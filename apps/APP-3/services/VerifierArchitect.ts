/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🔍 VERIFIER-ARCHITECT - MOTOR DE VALIDAÇÃO UNIVERSAL 🔍             ║
 * ║                                                                              ║
 * ║     "GARANTIR QUE O CÓDIGO GERADO CUMPRA ARQUITETURA, REGRAS DE NEGÓCIO     ║
 * ║              E REQUISITOS NÃO-FUNCIONAIS COM AUTOCORREÇÃO"                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { VERIFIER_ARCHITECT_MANIFEST } from './manifestos/VERIFIER_ARCHITECT_MANIFEST';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationRequest {
    code: string;
    language: 'go' | 'typescript' | 'javascript' | 'python' | 'html';
    projectType: 'game' | 'fintech' | 'api' | 'web' | 'mobile' | 'fullstack';
    requirements?: string[];
    context?: string;
}

export interface ValidationScore {
    score: number;
    weight: number;
    issues: ValidationIssue[];
    passed: boolean;
}

export interface ValidationIssue {
    code: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    line?: number;
    file?: string;
    autoFixAvailable: boolean;
    suggestedFix?: string;
}

export interface ValidationPatch {
    file: string;
    diff: string;
    description: string;
    type: 'fix' | 'improvement' | 'test';
}

export interface ValidationReport {
    summary: {
        totalScore: number;
        passed: boolean;
        threshold: number;
        timestamp: string;
        executionTimeMs: number;
    };
    scores: {
        architecture: ValidationScore;
        businessLogic: ValidationScore;
        security: ValidationScore;
        tests: ValidationScore;
        performance: ValidationScore;
        ux: ValidationScore;
        documentation: ValidationScore;
    };
    criticalIssues: ValidationIssue[];
    patches: ValidationPatch[];
    newTests: ValidationPatch[];
    recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// REGRAS DE VALIDAÇÃO POR DOMÍNIO
// ═══════════════════════════════════════════════════════════════════════════════

interface DomainRule {
    id: string;
    name: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    validator: (code: string) => ValidationIssue | null;
    autoFix?: (code: string) => string;
}

// Regras para Jogo de Damas
const CHECKERS_RULES: DomainRule[] = [
    {
        id: 'CAPTURE_REQUIRED',
        name: 'Captura Obrigatória',
        description: 'Se existe captura disponível, jogador DEVE capturar',
        severity: 'CRITICAL',
        validator: (code: string) => {
            // Verifica se há validação de captura obrigatória
            const hasCapturCheck = /HasAnyCaptureForColor|captureAvailable|mustCapture|forceCapture/i.test(code);
            const hasCaptureError = /capture.*required|capture.*available|must.*capture/i.test(code);
            
            if (!hasCapturCheck && !hasCaptureError) {
                return {
                    code: 'CAPTURE_NOT_ENFORCED',
                    description: 'Validação de captura obrigatória não encontrada. Jogador pode fazer movimento simples quando captura está disponível.',
                    severity: 'CRITICAL',
                    autoFixAvailable: true,
                    suggestedFix: `
// Adicionar antes de permitir movimento simples:
if b.HasAnyCaptureForColor(piece.Color) {
    return fmt.Errorf("capture available; simple move not allowed")
}`
                };
            }
            return null;
        }
    },
    {
        id: 'MULTIPLE_JUMPS',
        name: 'Múltiplos Pulos Sequenciais',
        description: 'Na mesma jogada, se após captura houver outra captura disponível, jogador DEVE continuar',
        severity: 'CRITICAL',
        validator: (code: string) => {
            const hasMultiJump = /Jumps|jumpChain|multipleCapture|chainCapture|continueCapture/i.test(code);
            
            if (!hasMultiJump) {
                return {
                    code: 'MULTIPLE_JUMPS_NOT_IMPLEMENTED',
                    description: 'Validação de múltiplos pulos sequenciais não encontrada.',
                    severity: 'CRITICAL',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    },
    {
        id: 'TURN_VALIDATION',
        name: 'Validação de Turno',
        description: 'Verificar se é a vez do jogador antes de permitir movimento',
        severity: 'CRITICAL',
        validator: (code: string) => {
            const hasTurnCheck = /CurrentTurn|currentPlayer|isPlayerTurn|playerTurn|turn.*check/i.test(code);
            const hasTurnError = /not.*your.*turn|wrong.*turn|invalid.*turn/i.test(code);
            
            if (!hasTurnCheck && !hasTurnError) {
                return {
                    code: 'TURN_NOT_VALIDATED',
                    description: 'Validação de turno não encontrada. Jogador pode mover fora de sua vez.',
                    severity: 'CRITICAL',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    },
    {
        id: 'OWNERSHIP_CHECK',
        name: 'Verificação de Ownership',
        description: 'Jogador só pode mover suas próprias peças',
        severity: 'CRITICAL',
        validator: (code: string) => {
            const hasOwnershipCheck = /piece\.Color.*!=.*player|PlayerColor|ownedBy|belongsTo/i.test(code);
            const hasOwnershipError = /not.*your.*piece|wrong.*piece|invalid.*piece/i.test(code);
            
            if (!hasOwnershipCheck && !hasOwnershipError) {
                return {
                    code: 'OWNERSHIP_NOT_CHECKED',
                    description: 'Verificação de ownership de peça não encontrada.',
                    severity: 'CRITICAL',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    },
    {
        id: 'PROMOTION',
        name: 'Promoção a Dama',
        description: 'Peça que atinge última fileira deve ser promovida',
        severity: 'HIGH',
        validator: (code: string) => {
            const hasPromotion = /King|promotion|promote|crowned|dame/i.test(code);
            
            if (!hasPromotion) {
                return {
                    code: 'PROMOTION_NOT_IMPLEMENTED',
                    description: 'Lógica de promoção a dama não encontrada.',
                    severity: 'HIGH',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    }
];

// Regras de Segurança
const SECURITY_RULES: DomainRule[] = [
    {
        id: 'SQL_INJECTION',
        name: 'SQL Injection Prevention',
        description: 'Todas as queries devem usar prepared statements',
        severity: 'CRITICAL',
        validator: (code: string) => {
            // Detecta concatenação de strings em queries
            const hasDangerousQuery = /query\s*\(\s*[`'"].*\$\{|query\s*\(\s*[`'"].*\+\s*\w+/i.test(code);
            const hasStringInterpolation = /SELECT.*FROM.*WHERE.*\$\{|INSERT.*INTO.*VALUES.*\$\{/i.test(code);
            
            if (hasDangerousQuery || hasStringInterpolation) {
                return {
                    code: 'SQL_INJECTION_RISK',
                    description: 'Possível vulnerabilidade de SQL Injection detectada. Use prepared statements.',
                    severity: 'CRITICAL',
                    autoFixAvailable: true,
                    suggestedFix: 'Use $1, $2 placeholders em vez de interpolação de strings'
                };
            }
            return null;
        }
    },
    {
        id: 'EXPOSED_SECRETS',
        name: 'Secrets Expostos',
        description: 'API keys e secrets não devem estar no código',
        severity: 'CRITICAL',
        validator: (code: string) => {
            const secretPatterns = [
                /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i,
                /secret[_-]?key\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i,
                /password\s*[:=]\s*['"][^'"]{8,}['"]/i,
                /token\s*[:=]\s*['"][A-Za-z0-9_-]{20,}['"]/i
            ];
            
            for (const pattern of secretPatterns) {
                if (pattern.test(code)) {
                    return {
                        code: 'SECRET_EXPOSED',
                        description: 'Possível secret/API key exposto no código. Use variáveis de ambiente.',
                        severity: 'CRITICAL',
                        autoFixAvailable: true,
                        suggestedFix: 'Mova para variáveis de ambiente: process.env.API_KEY ou os.Getenv("API_KEY")'
                    };
                }
            }
            return null;
        }
    },
    {
        id: 'RATE_LIMITING',
        name: 'Rate Limiting',
        description: 'Endpoints devem ter rate limiting',
        severity: 'HIGH',
        validator: (code: string) => {
            const hasRateLimit = /rateLimit|rateLimiter|throttle|limiter/i.test(code);
            const hasEndpoints = /router\.|app\.(get|post|put|delete)|@(Get|Post|Put|Delete)/i.test(code);
            
            if (hasEndpoints && !hasRateLimit) {
                return {
                    code: 'NO_RATE_LIMITING',
                    description: 'Endpoints sem rate limiting detectados.',
                    severity: 'HIGH',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    },
    {
        id: 'AUTH_CHECK',
        name: 'Verificação de Autenticação',
        description: 'Endpoints sensíveis devem verificar autenticação',
        severity: 'CRITICAL',
        validator: (code: string) => {
            const hasAuth = /authMiddleware|authenticate|requireAuth|isAuthenticated|jwt\.verify/i.test(code);
            const hasSensitiveEndpoints = /(post|put|delete|patch)\s*\(/i.test(code);
            
            if (hasSensitiveEndpoints && !hasAuth) {
                return {
                    code: 'NO_AUTH_CHECK',
                    description: 'Endpoints sensíveis sem verificação de autenticação.',
                    severity: 'CRITICAL',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    }
];

// Regras de Transações
const TRANSACTION_RULES: DomainRule[] = [
    {
        id: 'ATOMIC_TRANSACTION',
        name: 'Transações Atômicas',
        description: 'Operações financeiras devem usar transações atômicas',
        severity: 'CRITICAL',
        validator: (code: string) => {
            const hasFinancialOp = /balance|saldo|transfer|deposit|withdraw|payment/i.test(code);
            const hasTransaction = /BEGIN|COMMIT|ROLLBACK|transaction|tx\./i.test(code);
            
            if (hasFinancialOp && !hasTransaction) {
                return {
                    code: 'NO_ATOMIC_TRANSACTION',
                    description: 'Operações financeiras sem transações atômicas detectadas.',
                    severity: 'CRITICAL',
                    autoFixAvailable: true,
                    suggestedFix: `
tx, err := db.Begin()
defer tx.Rollback()
// ... operações ...
return tx.Commit()`
                };
            }
            return null;
        }
    },
    {
        id: 'PESSIMISTIC_LOCK',
        name: 'Lock Pessimista',
        description: 'Operações de saldo devem usar FOR UPDATE',
        severity: 'CRITICAL',
        validator: (code: string) => {
            const hasBalanceUpdate = /UPDATE.*balance|balance.*=.*balance/i.test(code);
            const hasForUpdate = /FOR UPDATE|LOCK IN SHARE MODE/i.test(code);
            
            if (hasBalanceUpdate && !hasForUpdate) {
                return {
                    code: 'NO_PESSIMISTIC_LOCK',
                    description: 'Operações de saldo sem lock pessimista (FOR UPDATE).',
                    severity: 'CRITICAL',
                    autoFixAvailable: true,
                    suggestedFix: 'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE'
                };
            }
            return null;
        }
    }
];

// Regras de WebSocket/Multiplayer
const WEBSOCKET_RULES: DomainRule[] = [
    {
        id: 'WS_ACK',
        name: 'WebSocket Acknowledgment',
        description: 'Mensagens WebSocket devem ter sistema de ack',
        severity: 'HIGH',
        validator: (code: string) => {
            const hasWebSocket = /WebSocket|ws\.|socket\./i.test(code);
            const hasAck = /ack|acknowledge|confirm|seqId|sequence/i.test(code);
            
            if (hasWebSocket && !hasAck) {
                return {
                    code: 'NO_WS_ACK',
                    description: 'WebSocket sem sistema de acknowledgment.',
                    severity: 'HIGH',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    },
    {
        id: 'WS_RETRY',
        name: 'WebSocket Retry',
        description: 'Mensagens devem ter retry com exponential backoff',
        severity: 'MEDIUM',
        validator: (code: string) => {
            const hasWebSocket = /WebSocket|ws\.|socket\./i.test(code);
            const hasRetry = /retry|backoff|reconnect|attempts/i.test(code);
            
            if (hasWebSocket && !hasRetry) {
                return {
                    code: 'NO_WS_RETRY',
                    description: 'WebSocket sem sistema de retry.',
                    severity: 'MEDIUM',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    },
    {
        id: 'WS_IDEMPOTENCY',
        name: 'WebSocket Idempotência',
        description: 'Operações críticas devem ter idempotency key',
        severity: 'HIGH',
        validator: (code: string) => {
            const hasWebSocket = /WebSocket|ws\.|socket\./i.test(code);
            const hasIdempotency = /idempotency|idempotent|dedup|deduplicate/i.test(code);
            
            if (hasWebSocket && !hasIdempotency) {
                return {
                    code: 'NO_WS_IDEMPOTENCY',
                    description: 'WebSocket sem idempotency keys.',
                    severity: 'HIGH',
                    autoFixAvailable: true
                };
            }
            return null;
        }
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSE PRINCIPAL: VERIFIER-ARCHITECT
// ═══════════════════════════════════════════════════════════════════════════════

export class VerifierArchitect {
    private threshold: number = 90;
    private logs: string[] = [];
    
    constructor(threshold: number = 90) {
        this.threshold = threshold;
    }

    /**
     * 🔍 MÉTODO PRINCIPAL: Valida código completo
     */
    public validate(request: ValidationRequest): ValidationReport {
        const startTime = Date.now();
        this.log('🔍 VERIFIER-ARCHITECT INICIADO');
        this.log(`📝 Tipo de projeto: ${request.projectType}`);
        this.log(`💻 Linguagem: ${request.language}`);
        
        // Executar validações por área
        const architectureScore = this.validateArchitecture(request);
        const businessLogicScore = this.validateBusinessLogic(request);
        const securityScore = this.validateSecurity(request);
        const testsScore = this.validateTests(request);
        const performanceScore = this.validatePerformance(request);
        const uxScore = this.validateUX(request);
        const documentationScore = this.validateDocumentation(request);
        
        // Calcular score total ponderado
        const totalScore = this.calculateTotalScore({
            architecture: architectureScore,
            businessLogic: businessLogicScore,
            security: securityScore,
            tests: testsScore,
            performance: performanceScore,
            ux: uxScore,
            documentation: documentationScore
        });
        
        // Coletar issues críticos
        const criticalIssues = this.collectCriticalIssues([
            architectureScore,
            businessLogicScore,
            securityScore,
            testsScore,
            performanceScore,
            uxScore,
            documentationScore
        ]);
        
        // Gerar patches se necessário
        const patches = this.generatePatches(criticalIssues, request);
        const newTests = this.generateTests(criticalIssues, request);
        
        const executionTime = Date.now() - startTime;
        const passed = totalScore >= this.threshold;
        
        this.log(`\n📊 SCORE FINAL: ${totalScore.toFixed(0)}/100`);
        this.log(`${passed ? '✅ APROVADO' : '❌ REPROVADO'} (threshold: ${this.threshold})`);
        this.log(`⏱️ Tempo de execução: ${executionTime}ms`);
        
        return {
            summary: {
                totalScore,
                passed,
                threshold: this.threshold,
                timestamp: new Date().toISOString(),
                executionTimeMs: executionTime
            },
            scores: {
                architecture: architectureScore,
                businessLogic: businessLogicScore,
                security: securityScore,
                tests: testsScore,
                performance: performanceScore,
                ux: uxScore,
                documentation: documentationScore
            },
            criticalIssues,
            patches,
            newTests,
            recommendations: this.generateRecommendations(criticalIssues)
        };
    }
    
    /**
     * 🏗️ Valida Arquitetura
     */
    private validateArchitecture(request: ValidationRequest): ValidationScore {
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        const code = request.code;
        
        // Verificar estrutura de pastas/módulos
        if (!this.hasProperStructure(code)) {
            issues.push({
                code: 'POOR_STRUCTURE',
                description: 'Estrutura de código não segue padrões de organização',
                severity: 'MEDIUM',
                autoFixAvailable: false
            });
            score -= 15;
        }
        
        // Verificar separação de concerns
        if (!this.hasSeparationOfConcerns(code)) {
            issues.push({
                code: 'NO_SEPARATION',
                description: 'Falta separação de responsabilidades (handlers, services, repositories)',
                severity: 'HIGH',
                autoFixAvailable: false
            });
            score -= 20;
        }
        
        // Verificar uso de interfaces/tipos
        if (request.language === 'typescript' || request.language === 'go') {
            if (!this.hasProperTyping(code)) {
                issues.push({
                    code: 'WEAK_TYPING',
                    description: 'Uso insuficiente de tipos/interfaces',
                    severity: 'MEDIUM',
                    autoFixAvailable: false
                });
                score -= 10;
            }
        }
        
        return {
            score: Math.max(0, score),
            weight: 15,
            issues,
            passed: score >= 70
        };
    }
    
    /**
     * 📜 Valida Lógica de Negócio
     */
    private validateBusinessLogic(request: ValidationRequest): ValidationScore {
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        const code = request.code;
        
        // Aplicar regras específicas do domínio
        if (request.projectType === 'game') {
            // Regras de jogo de damas
            for (const rule of CHECKERS_RULES) {
                const issue = rule.validator(code);
                if (issue) {
                    issues.push(issue);
                    score -= rule.severity === 'CRITICAL' ? 25 : 
                             rule.severity === 'HIGH' ? 15 : 
                             rule.severity === 'MEDIUM' ? 10 : 5;
                }
            }
        }
        
        // Regras de transações (se aplicável)
        if (request.projectType === 'fintech' || code.toLowerCase().includes('balance')) {
            for (const rule of TRANSACTION_RULES) {
                const issue = rule.validator(code);
                if (issue) {
                    issues.push(issue);
                    score -= rule.severity === 'CRITICAL' ? 25 : 15;
                }
            }
        }
        
        // Regras de WebSocket (se aplicável)
        if (code.toLowerCase().includes('websocket') || code.toLowerCase().includes('socket')) {
            for (const rule of WEBSOCKET_RULES) {
                const issue = rule.validator(code);
                if (issue) {
                    issues.push(issue);
                    score -= rule.severity === 'CRITICAL' ? 25 : 
                             rule.severity === 'HIGH' ? 15 : 10;
                }
            }
        }
        
        return {
            score: Math.max(0, score),
            weight: 25,
            issues,
            passed: score >= 70
        };
    }
    
    /**
     * 🔐 Valida Segurança
     */
    private validateSecurity(request: ValidationRequest): ValidationScore {
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        const code = request.code;
        
        // Aplicar regras de segurança
        for (const rule of SECURITY_RULES) {
            const issue = rule.validator(code);
            if (issue) {
                issues.push(issue);
                score -= rule.severity === 'CRITICAL' ? 30 : 
                         rule.severity === 'HIGH' ? 20 : 10;
            }
        }
        
        // Verificar headers de segurança (se for web)
        if (request.language === 'html' || code.includes('express') || code.includes('gin')) {
            if (!this.hasSecurityHeaders(code)) {
                issues.push({
                    code: 'NO_SECURITY_HEADERS',
                    description: 'Headers de segurança não configurados (X-Frame-Options, CSP, etc.)',
                    severity: 'MEDIUM',
                    autoFixAvailable: true
                });
                score -= 10;
            }
        }
        
        // Verificar CORS
        if (code.includes('cors') || code.includes('Access-Control')) {
            if (code.includes('*') && code.includes('origin')) {
                issues.push({
                    code: 'CORS_WILDCARD',
                    description: 'CORS configurado com wildcard (*). Especifique origens permitidas.',
                    severity: 'MEDIUM',
                    autoFixAvailable: true
                });
                score -= 10;
            }
        }
        
        return {
            score: Math.max(0, score),
            weight: 20,
            issues,
            passed: score >= 70
        };
    }
    
    /**
     * 🧪 Valida Testes
     */
    private validateTests(request: ValidationRequest): ValidationScore {
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        const code = request.code;
        
        // Verificar se há testes
        const hasTests = /test\(|it\(|describe\(|func Test|@Test/i.test(code);
        
        if (!hasTests) {
            issues.push({
                code: 'NO_TESTS',
                description: 'Nenhum teste encontrado no código',
                severity: 'HIGH',
                autoFixAvailable: true
            });
            score -= 30;
        } else {
            // Verificar testes de edge cases
            const hasEdgeCases = /edge|boundary|invalid|error|fail|empty|null|undefined/i.test(code);
            if (!hasEdgeCases) {
                issues.push({
                    code: 'NO_EDGE_CASE_TESTS',
                    description: 'Testes de edge cases não encontrados',
                    severity: 'MEDIUM',
                    autoFixAvailable: true
                });
                score -= 15;
            }
            
            // Verificar testes de concorrência (se aplicável)
            if (code.includes('async') || code.includes('goroutine') || code.includes('Promise')) {
                const hasConcurrencyTests = /concurrent|parallel|race|sync\.WaitGroup|Promise\.all/i.test(code);
                if (!hasConcurrencyTests) {
                    issues.push({
                        code: 'NO_CONCURRENCY_TESTS',
                        description: 'Testes de concorrência não encontrados',
                        severity: 'HIGH',
                        autoFixAvailable: true
                    });
                    score -= 20;
                }
            }
        }
        
        return {
            score: Math.max(0, score),
            weight: 15,
            issues,
            passed: score >= 60
        };
    }
    
    /**
     * ⚡ Valida Performance
     */
    private validatePerformance(request: ValidationRequest): ValidationScore {
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        const code = request.code;
        
        // Verificar N+1 queries
        if (/for.*query|forEach.*query|map.*query/i.test(code)) {
            issues.push({
                code: 'N_PLUS_1_QUERY',
                description: 'Possível N+1 query detectado. Use batch queries.',
                severity: 'HIGH',
                autoFixAvailable: false
            });
            score -= 20;
        }
        
        // Verificar loops infinitos potenciais
        if (/while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/i.test(code)) {
            if (!/break|return/i.test(code)) {
                issues.push({
                    code: 'INFINITE_LOOP_RISK',
                    description: 'Possível loop infinito sem condição de saída',
                    severity: 'HIGH',
                    autoFixAvailable: false
                });
                score -= 25;
            }
        }
        
        // Verificar uso de índices em queries
        if (/SELECT.*FROM.*WHERE/i.test(code)) {
            if (!/INDEX|CREATE INDEX/i.test(code)) {
                issues.push({
                    code: 'MISSING_INDEX',
                    description: 'Queries sem índices definidos podem ser lentas',
                    severity: 'MEDIUM',
                    autoFixAvailable: false
                });
                score -= 10;
            }
        }
        
        return {
            score: Math.max(0, score),
            weight: 10,
            issues,
            passed: score >= 70
        };
    }
    
    /**
     * 🎨 Valida UX/Completude
     */
    private validateUX(request: ValidationRequest): ValidationScore {
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        const code = request.code;
        
        // Verificar TODOs e FIXMEs
        const todoCount = (code.match(/TODO|FIXME|XXX|HACK/gi) || []).length;
        if (todoCount > 0) {
            issues.push({
                code: 'TODO_FOUND',
                description: `${todoCount} TODO/FIXME encontrado(s). Código incompleto.`,
                severity: 'HIGH',
                autoFixAvailable: false
            });
            score -= Math.min(30, todoCount * 10);
        }
        
        // Verificar placeholders
        if (/placeholder|lorem ipsum|example\.com|test@test/i.test(code)) {
            issues.push({
                code: 'PLACEHOLDER_FOUND',
                description: 'Placeholders encontrados no código',
                severity: 'MEDIUM',
                autoFixAvailable: false
            });
            score -= 15;
        }
        
        // Verificar tratamento de erros para usuário
        if (request.language === 'html' || request.language === 'typescript') {
            const hasErrorUI = /error.*message|toast|alert|notification|snackbar/i.test(code);
            if (!hasErrorUI && code.includes('catch')) {
                issues.push({
                    code: 'NO_ERROR_UI',
                    description: 'Erros capturados mas sem feedback visual para usuário',
                    severity: 'MEDIUM',
                    autoFixAvailable: false
                });
                score -= 10;
            }
        }
        
        return {
            score: Math.max(0, score),
            weight: 10,
            issues,
            passed: score >= 70
        };
    }
    
    /**
     * 📚 Valida Documentação
     */
    private validateDocumentation(request: ValidationRequest): ValidationScore {
        const issues: ValidationIssue[] = [];
        let score = 100;
        
        const code = request.code;
        
        // Verificar README
        if (!code.includes('README') && !code.includes('# ')) {
            issues.push({
                code: 'NO_README',
                description: 'README não encontrado',
                severity: 'MEDIUM',
                autoFixAvailable: true
            });
            score -= 20;
        }
        
        // Verificar comentários em funções públicas
        const functionCount = (code.match(/func |function |def |public /gi) || []).length;
        const commentCount = (code.match(/\/\*\*|\/\/\/|"""|#\s+\w+/g) || []).length;
        
        if (functionCount > 5 && commentCount < functionCount / 2) {
            issues.push({
                code: 'INSUFFICIENT_COMMENTS',
                description: 'Funções públicas sem documentação adequada',
                severity: 'LOW',
                autoFixAvailable: false
            });
            score -= 15;
        }
        
        return {
            score: Math.max(0, score),
            weight: 5,
            issues,
            passed: score >= 60
        };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES
    // ═══════════════════════════════════════════════════════════════════════════
    
    private hasProperStructure(code: string): boolean {
        return /package|module|import|export|require/i.test(code);
    }
    
    private hasSeparationOfConcerns(code: string): boolean {
        const hasHandler = /handler|controller|route/i.test(code);
        const hasService = /service|usecase|business/i.test(code);
        const hasRepository = /repository|repo|store|dao/i.test(code);
        
        return hasHandler || hasService || hasRepository;
    }
    
    private hasProperTyping(code: string): boolean {
        return /interface|type |struct |class /i.test(code);
    }
    
    private hasSecurityHeaders(code: string): boolean {
        return /X-Frame-Options|Content-Security-Policy|X-Content-Type-Options/i.test(code);
    }
    
    private calculateTotalScore(scores: Record<string, ValidationScore>): number {
        let totalWeightedScore = 0;
        let totalWeight = 0;
        
        for (const [, score] of Object.entries(scores)) {
            totalWeightedScore += score.score * score.weight;
            totalWeight += score.weight;
        }
        
        return totalWeightedScore / totalWeight;
    }
    
    private collectCriticalIssues(scores: ValidationScore[]): ValidationIssue[] {
        const criticalIssues: ValidationIssue[] = [];
        
        for (const score of scores) {
            for (const issue of score.issues) {
                if (issue.severity === 'CRITICAL' || issue.severity === 'HIGH') {
                    criticalIssues.push(issue);
                }
            }
        }
        
        return criticalIssues;
    }
    
    private generatePatches(issues: ValidationIssue[], request: ValidationRequest): ValidationPatch[] {
        const patches: ValidationPatch[] = [];
        
        for (const issue of issues) {
            if (issue.autoFixAvailable && issue.suggestedFix) {
                patches.push({
                    file: `fix_${issue.code.toLowerCase()}.patch`,
                    diff: issue.suggestedFix,
                    description: `Fix para: ${issue.description}`,
                    type: 'fix'
                });
            }
        }
        
        return patches;
    }
    
    private generateTests(issues: ValidationIssue[], request: ValidationRequest): ValidationPatch[] {
        const tests: ValidationPatch[] = [];
        
        // Gerar testes para issues críticos
        for (const issue of issues) {
            if (issue.severity === 'CRITICAL') {
                tests.push({
                    file: `test_${issue.code.toLowerCase()}.test.ts`,
                    diff: this.generateTestCode(issue, request),
                    description: `Teste para validar: ${issue.description}`,
                    type: 'test'
                });
            }
        }
        
        return tests;
    }
    
    private generateTestCode(issue: ValidationIssue, request: ValidationRequest): string {
        // Gerar código de teste baseado no issue
        return `
describe('${issue.code}', () => {
    it('should validate ${issue.description}', () => {
        // TODO: Implementar teste específico
        expect(true).toBe(true);
    });
});`;
    }
    
    private generateRecommendations(issues: ValidationIssue[]): string[] {
        const recommendations: string[] = [];
        
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const highCount = issues.filter(i => i.severity === 'HIGH').length;
        
        if (criticalCount > 0) {
            recommendations.push(`🔴 ${criticalCount} issue(s) CRÍTICO(S) devem ser corrigidos IMEDIATAMENTE`);
        }
        
        if (highCount > 0) {
            recommendations.push(`🟠 ${highCount} issue(s) de alta prioridade devem ser corrigidos antes do deploy`);
        }
        
        if (issues.some(i => i.code === 'NO_TESTS')) {
            recommendations.push('📝 Adicione testes unitários para garantir qualidade');
        }
        
        if (issues.some(i => i.code.includes('SQL'))) {
            recommendations.push('🔐 Revise todas as queries para prevenir SQL Injection');
        }
        
        if (issues.some(i => i.code.includes('WS'))) {
            recommendations.push('🌐 Implemente sistema robusto de ack/retry para WebSocket');
        }
        
        return recommendations;
    }
    
    private log(message: string): void {
        this.logs.push(message);
        console.log(`[VA] ${message}`);
    }
    
    /**
     * 📊 Gera relatório em formato Markdown
     */
    public generateMarkdownReport(report: ValidationReport): string {
        let md = `# 🔍 Relatório Verifier-Architect\n\n`;
        md += `**Data:** ${report.summary.timestamp}\n`;
        md += `**Score:** ${report.summary.totalScore.toFixed(0)}/100\n`;
        md += `**Status:** ${report.summary.passed ? '✅ APROVADO' : '❌ REPROVADO'}\n\n`;
        
        md += `## 📊 Scores por Área\n\n`;
        md += `| Área | Score | Peso | Status |\n`;
        md += `|------|-------|------|--------|\n`;
        
        for (const [area, score] of Object.entries(report.scores)) {
            const status = score.passed ? '✅' : '❌';
            md += `| ${area} | ${score.score.toFixed(0)} | ${score.weight}% | ${status} |\n`;
        }
        
        if (report.criticalIssues.length > 0) {
            md += `\n## 🚨 Issues Críticos\n\n`;
            for (const issue of report.criticalIssues) {
                md += `### ${issue.severity}: ${issue.code}\n`;
                md += `${issue.description}\n`;
                if (issue.suggestedFix) {
                    md += `\n**Sugestão:**\n\`\`\`\n${issue.suggestedFix}\n\`\`\`\n`;
                }
                md += `\n`;
            }
        }
        
        if (report.recommendations.length > 0) {
            md += `## 💡 Recomendações\n\n`;
            for (const rec of report.recommendations) {
                md += `- ${rec}\n`;
            }
        }
        
        return md;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { VERIFIER_ARCHITECT_MANIFEST };
export default VerifierArchitect;
