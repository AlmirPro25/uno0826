/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧪 TESTES DO VERIFIER-ARCHITECT                                     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { VerifierArchitect, ValidationRequest, ValidationReport } from '../services/VerifierArchitect';

// ═══════════════════════════════════════════════════════════════════════════════
// CÓDIGO DE EXEMPLO PARA TESTES
// ═══════════════════════════════════════════════════════════════════════════════

// Código BOM - Jogo de Damas com todas as validações
const GOOD_CHECKERS_CODE = `
package game

import (
    "fmt"
    "sync"
)

type Color int

const (
    Red Color = iota
    Black
)

type Piece struct {
    Color Color
    King  bool
}

type Pos struct { R, C int }

type Move struct {
    From  Pos
    To    Pos
    Jumps []Pos
}

type Board struct {
    Cells       [][]*Piece
    CurrentTurn Color
    mu          sync.Mutex
}

// ValidateMove valida um movimento no tabuleiro
func (b *Board) ValidateMove(playerID string, mv Move) error {
    b.mu.Lock()
    defer b.mu.Unlock()
    
    // 1. Basic bounds
    if !b.inBounds(mv.From) || !b.inBounds(mv.To) {
        return fmt.Errorf("out of bounds")
    }

    piece := b.Cells[mv.From.R][mv.From.C]
    if piece == nil {
        return fmt.Errorf("no piece at origin")
    }
    
    // 2. Ownership check - jogador só pode mover suas peças
    if piece.Color != b.PlayerColor(playerID) {
        return fmt.Errorf("not your piece")
    }

    // 3. Turn validation - verificar se é a vez do jogador
    if b.CurrentTurn != piece.Color {
        return fmt.Errorf("not your turn")
    }

    // 4. Destination empty
    if b.Cells[mv.To.R][mv.To.C] != nil {
        return fmt.Errorf("destination occupied")
    }

    dr := mv.To.R - mv.From.R
    dc := mv.To.C - mv.From.C
    absDr := abs(dr)
    absDc := abs(dc)

    // 5. Simple move (no capture)
    if absDr == 1 && absDc == 1 && len(mv.Jumps) == 0 {
        // CRÍTICO: Verificar captura obrigatória
        if b.HasAnyCaptureForColor(piece.Color) {
            return fmt.Errorf("capture available; simple move not allowed")
        }
        // Direction check for non-king
        if !piece.King {
            if piece.Color == Red && dr != -1 {
                return fmt.Errorf("invalid direction")
            }
            if piece.Color == Black && dr != 1 {
                return fmt.Errorf("invalid direction")
            }
        }
        return nil
    }

    // 6. Capture move(s) - múltiplos pulos
    return b.validateCaptureChain(piece, mv)
}

// HasAnyCaptureForColor verifica se existe captura disponível
func (b *Board) HasAnyCaptureForColor(color Color) bool {
    for r := 0; r < 8; r++ {
        for c := 0; c < 8; c++ {
            piece := b.Cells[r][c]
            if piece != nil && piece.Color == color {
                if b.hasCaptureFrom(Pos{r, c}, piece) {
                    return true
                }
            }
        }
    }
    return false
}

// Promotion - promoção a dama
func (b *Board) checkPromotion(pos Pos, piece *Piece) {
    if piece.Color == Red && pos.R == 0 {
        piece.King = true
    }
    if piece.Color == Black && pos.R == 7 {
        piece.King = true
    }
}

func TestValidateMove_CaptureRequired(t *testing.T) {
    board := NewBoard()
    // Setup: peça vermelha com captura disponível
    board.Cells[2][1] = &Piece{Color: Red}
    board.Cells[3][2] = &Piece{Color: Black}
    
    // Tentar movimento simples quando captura existe
    err := board.ValidateMove("player1", Move{From: Pos{2, 1}, To: Pos{3, 0}})
    if err == nil {
        t.Fatal("expected capture required error")
    }
}

func TestValidateMove_MultipleJumps(t *testing.T) {
    board := NewBoard()
    // Setup: cadeia de capturas
    board.Cells[2][1] = &Piece{Color: Red}
    board.Cells[3][2] = &Piece{Color: Black}
    board.Cells[5][4] = &Piece{Color: Black}
    
    // Deve capturar ambas
    err := board.ValidateMove("player1", Move{
        From:  Pos{2, 1},
        To:    Pos{6, 5},
        Jumps: []Pos{{4, 3}},
    })
    if err != nil {
        t.Fatalf("expected valid multi-jump, got: %v", err)
    }
}

func TestValidateMove_ConcurrentRequests(t *testing.T) {
    board := NewBoard()
    board.Cells[2][1] = &Piece{Color: Red}
    
    var wg sync.WaitGroup
    var successCount int32
    
    for i := 0; i < 20; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            err := board.ValidateMove("player1", Move{From: Pos{2, 1}, To: Pos{3, 2}})
            if err == nil {
                atomic.AddInt32(&successCount, 1)
            }
        }()
    }
    
    wg.Wait()
    
    // Apenas 1 deve ter sucesso
    if successCount != 1 {
        t.Fatalf("expected 1 success, got %d", successCount)
    }
}
`;

// Código RUIM - Sem validações críticas
const BAD_CHECKERS_CODE = `
package game

type Board struct {
    Cells [][]*Piece
}

// ValidateMove - INCOMPLETO!
func (b *Board) ValidateMove(mv Move) error {
    // TODO: implementar validação
    
    piece := b.Cells[mv.From.R][mv.From.C]
    if piece == nil {
        return fmt.Errorf("no piece")
    }
    
    // Move direto sem validações
    b.Cells[mv.To.R][mv.To.C] = piece
    b.Cells[mv.From.R][mv.From.C] = nil
    
    return nil
}
`;

// Código com vulnerabilidade de segurança
const INSECURE_CODE = `
const apiKey = "sk-1234567890abcdef";

app.post('/api/users', async (req, res) => {
    const { email, password } = req.body;
    
    // SQL Injection vulnerável!
    const query = \`SELECT * FROM users WHERE email = '\${email}'\`;
    const result = await db.query(query);
    
    res.json(result);
});
`;

// Código com transações não atômicas
const NON_ATOMIC_CODE = `
async function transfer(from, to, amount) {
    // PERIGO: Operações separadas!
    await db.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, from]);
    // Se falhar aqui, dinheiro sumiu!
    await db.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, to]);
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TESTES
// ═══════════════════════════════════════════════════════════════════════════════

describe('VerifierArchitect', () => {
    let verifier: VerifierArchitect;
    
    beforeEach(() => {
        verifier = new VerifierArchitect(90);
    });
    
    describe('Validação de Jogo de Damas', () => {
        it('deve aprovar código com todas as validações', () => {
            const request: ValidationRequest = {
                code: GOOD_CHECKERS_CODE,
                language: 'go',
                projectType: 'game'
            };
            
            const report = verifier.validate(request);
            
            console.log('Score:', report.summary.totalScore);
            console.log('Issues:', report.criticalIssues.length);
            
            expect(report.summary.totalScore).toBeGreaterThanOrEqual(80);
            expect(report.scores.businessLogic.issues.filter(i => i.severity === 'CRITICAL')).toHaveLength(0);
        });
        
        it('deve reprovar código sem validação de captura obrigatória', () => {
            const request: ValidationRequest = {
                code: BAD_CHECKERS_CODE,
                language: 'go',
                projectType: 'game'
            };
            
            const report = verifier.validate(request);
            
            console.log('Score:', report.summary.totalScore);
            console.log('Issues:', report.criticalIssues.map(i => i.code));
            
            expect(report.summary.passed).toBe(false);
            expect(report.criticalIssues.some(i => i.code === 'CAPTURE_NOT_ENFORCED')).toBe(true);
        });
        
        it('deve detectar falta de validação de turno', () => {
            const request: ValidationRequest = {
                code: BAD_CHECKERS_CODE,
                language: 'go',
                projectType: 'game'
            };
            
            const report = verifier.validate(request);
            
            expect(report.criticalIssues.some(i => i.code === 'TURN_NOT_VALIDATED')).toBe(true);
        });
        
        it('deve detectar falta de ownership check', () => {
            const request: ValidationRequest = {
                code: BAD_CHECKERS_CODE,
                language: 'go',
                projectType: 'game'
            };
            
            const report = verifier.validate(request);
            
            expect(report.criticalIssues.some(i => i.code === 'OWNERSHIP_NOT_CHECKED')).toBe(true);
        });
    });
    
    describe('Validação de Segurança', () => {
        it('deve detectar SQL Injection', () => {
            const request: ValidationRequest = {
                code: INSECURE_CODE,
                language: 'typescript',
                projectType: 'api'
            };
            
            const report = verifier.validate(request);
            
            expect(report.scores.security.issues.some(i => i.code === 'SQL_INJECTION_RISK')).toBe(true);
        });
        
        it('deve detectar secrets expostos', () => {
            const request: ValidationRequest = {
                code: INSECURE_CODE,
                language: 'typescript',
                projectType: 'api'
            };
            
            const report = verifier.validate(request);
            
            expect(report.scores.security.issues.some(i => i.code === 'SECRET_EXPOSED')).toBe(true);
        });
    });
    
    describe('Validação de Transações', () => {
        it('deve detectar transações não atômicas', () => {
            const request: ValidationRequest = {
                code: NON_ATOMIC_CODE,
                language: 'typescript',
                projectType: 'fintech'
            };
            
            const report = verifier.validate(request);
            
            expect(report.scores.businessLogic.issues.some(i => i.code === 'NO_ATOMIC_TRANSACTION')).toBe(true);
        });
    });
    
    describe('Geração de Relatório', () => {
        it('deve gerar relatório Markdown', () => {
            const request: ValidationRequest = {
                code: BAD_CHECKERS_CODE,
                language: 'go',
                projectType: 'game'
            };
            
            const report = verifier.validate(request);
            const markdown = verifier.generateMarkdownReport(report);
            
            expect(markdown).toContain('# 🔍 Relatório Verifier-Architect');
            expect(markdown).toContain('Score:');
            expect(markdown).toContain('Issues Críticos');
        });
        
        it('deve gerar patches para issues com autoFix', () => {
            const request: ValidationRequest = {
                code: BAD_CHECKERS_CODE,
                language: 'go',
                projectType: 'game'
            };
            
            const report = verifier.validate(request);
            
            // Deve ter patches sugeridos
            expect(report.patches.length).toBeGreaterThan(0);
        });
        
        it('deve gerar recomendações', () => {
            const request: ValidationRequest = {
                code: BAD_CHECKERS_CODE,
                language: 'go',
                projectType: 'game'
            };
            
            const report = verifier.validate(request);
            
            expect(report.recommendations.length).toBeGreaterThan(0);
        });
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXECUÇÃO MANUAL
// ═══════════════════════════════════════════════════════════════════════════════

async function runTests() {
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║         🧪 TESTES DO VERIFIER-ARCHITECT                                     ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    
    const verifier = new VerifierArchitect(90);
    
    // Teste 1: Código bom
    console.log('📋 TESTE 1: Código com todas as validações');
    console.log('─'.repeat(60));
    const goodReport = verifier.validate({
        code: GOOD_CHECKERS_CODE,
        language: 'go',
        projectType: 'game'
    });
    console.log(`Score: ${goodReport.summary.totalScore.toFixed(0)}/100`);
    console.log(`Status: ${goodReport.summary.passed ? '✅ APROVADO' : '❌ REPROVADO'}`);
    console.log(`Issues Críticos: ${goodReport.criticalIssues.length}`);
    console.log();
    
    // Teste 2: Código ruim
    console.log('📋 TESTE 2: Código sem validações');
    console.log('─'.repeat(60));
    const badReport = verifier.validate({
        code: BAD_CHECKERS_CODE,
        language: 'go',
        projectType: 'game'
    });
    console.log(`Score: ${badReport.summary.totalScore.toFixed(0)}/100`);
    console.log(`Status: ${badReport.summary.passed ? '✅ APROVADO' : '❌ REPROVADO'}`);
    console.log(`Issues Críticos: ${badReport.criticalIssues.length}`);
    badReport.criticalIssues.forEach(issue => {
        console.log(`  🔴 ${issue.code}: ${issue.description}`);
    });
    console.log();
    
    // Teste 3: Código inseguro
    console.log('📋 TESTE 3: Código com vulnerabilidades');
    console.log('─'.repeat(60));
    const insecureReport = verifier.validate({
        code: INSECURE_CODE,
        language: 'typescript',
        projectType: 'api'
    });
    console.log(`Score: ${insecureReport.summary.totalScore.toFixed(0)}/100`);
    console.log(`Status: ${insecureReport.summary.passed ? '✅ APROVADO' : '❌ REPROVADO'}`);
    console.log(`Issues de Segurança:`);
    insecureReport.scores.security.issues.forEach(issue => {
        console.log(`  🔐 ${issue.code}: ${issue.description}`);
    });
    console.log();
    
    // Gerar relatório Markdown
    console.log('📋 RELATÓRIO MARKDOWN:');
    console.log('─'.repeat(60));
    console.log(verifier.generateMarkdownReport(badReport));
}

// Executar se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
    runTests();
}

export { runTests };
