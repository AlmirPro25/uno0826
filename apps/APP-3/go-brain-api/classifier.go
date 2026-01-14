package main

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    CODE CLASSIFIER - O Modelo Pequeno que Julga              ║
║                                                                               ║
║              "A IA grande cria. A IA pequena julga, corrige e aprende."      ║
╚══════════════════════════════════════════════════════════════════════════════╝

FILOSOFIA:
- Este modelo NÃO cria código
- Ele JULGA, CLASSIFICA e NORMALIZA
- Identifica padrões válidos vs inválidos
- Detecta anti-patterns
- Calcula scores de qualidade

TREINAMENTO:
- Começa com regras heurísticas
- Evolui com fine-tuning no dataset gerado
- Aprende os padrões do SEU sistema
*/

import (
	"regexp"
	"strings"
	"time"
)

// CodeClassifier é o modelo pequeno que julga código
type CodeClassifier struct {
	// Regras heurísticas (fase 1)
	rules []ClassificationRule

	// Padrões conhecidos
	goodPatterns []string
	badPatterns  []string

	// Estatísticas de aprendizado
	totalClassified int
	avgQuality      float64
}

// ClassificationRule define uma regra de classificação
type ClassificationRule struct {
	Name        string
	Description string
	Category    string // quality, security, accessibility, performance
	Weight      int    // Peso no score final
	Check       func(code string) (bool, string)
}

// NewCodeClassifier cria novo classificador
func NewCodeClassifier() *CodeClassifier {
	c := &CodeClassifier{
		goodPatterns: []string{},
		badPatterns:  []string{},
	}
	c.initializeRules()
	return c
}

// initializeRules configura regras heurísticas iniciais
func (c *CodeClassifier) initializeRules() {
	c.rules = []ClassificationRule{
		// ═══════════════════════════════════════════════════════════════════
		// QUALIDADE BÁSICA
		// ═══════════════════════════════════════════════════════════════════
		{
			Name:        "has_doctype",
			Description: "Possui <!DOCTYPE html>",
			Category:    "quality",
			Weight:      5,
			Check: func(code string) (bool, string) {
				has := strings.Contains(strings.ToUpper(code), "<!DOCTYPE")
				if !has {
					return false, "Falta <!DOCTYPE html>"
				}
				return true, ""
			},
		},
		{
			Name:        "has_lang_attribute",
			Description: "Tag html tem atributo lang",
			Category:    "accessibility",
			Weight:      5,
			Check: func(code string) (bool, string) {
				has := regexp.MustCompile(`<html[^>]*lang=`).MatchString(code)
				if !has {
					return false, "Falta atributo lang no <html>"
				}
				return true, ""
			},
		},
		{
			Name:        "has_viewport_meta",
			Description: "Possui meta viewport para responsividade",
			Category:    "quality",
			Weight:      10,
			Check: func(code string) (bool, string) {
				has := strings.Contains(strings.ToLower(code), "viewport")
				if !has {
					return false, "Falta meta viewport"
				}
				return true, ""
			},
		},
		{
			Name:        "has_charset",
			Description: "Possui charset UTF-8",
			Category:    "quality",
			Weight:      5,
			Check: func(code string) (bool, string) {
				has := strings.Contains(strings.ToLower(code), "charset")
				if !has {
					return false, "Falta charset"
				}
				return true, ""
			},
		},

		// ═══════════════════════════════════════════════════════════════════
		// SEMÂNTICA HTML
		// ═══════════════════════════════════════════════════════════════════
		{
			Name:        "uses_semantic_html",
			Description: "Usa tags semânticas (header, main, footer, nav, article, section)",
			Category:    "quality",
			Weight:      15,
			Check: func(code string) (bool, string) {
				semanticTags := []string{"<header", "<main", "<footer", "<nav", "<article", "<section"}
				count := 0
				for _, tag := range semanticTags {
					if strings.Contains(strings.ToLower(code), tag) {
						count++
					}
				}
				if count < 2 {
					return false, "Pouco uso de tags semânticas"
				}
				return true, ""
			},
		},

		// ═══════════════════════════════════════════════════════════════════
		// ACESSIBILIDADE
		// ═══════════════════════════════════════════════════════════════════
		{
			Name:        "images_have_alt",
			Description: "Imagens possuem atributo alt",
			Category:    "accessibility",
			Weight:      10,
			Check: func(code string) (bool, string) {
				// Se não tem imagens, passa
				if !strings.Contains(code, "<img") {
					return true, ""
				}
				// Verifica se todas as imagens têm alt
				imgRegex := regexp.MustCompile(`<img[^>]*>`)
				imgs := imgRegex.FindAllString(code, -1)
				for _, img := range imgs {
					if !strings.Contains(img, "alt=") {
						return false, "Imagem sem atributo alt"
					}
				}
				return true, ""
			},
		},
		{
			Name:        "forms_have_labels",
			Description: "Inputs possuem labels associados",
			Category:    "accessibility",
			Weight:      10,
			Check: func(code string) (bool, string) {
				// Se não tem inputs, passa
				if !strings.Contains(code, "<input") {
					return true, ""
				}
				// Verifica se tem labels
				hasLabels := strings.Contains(code, "<label")
				if !hasLabels {
					return false, "Formulário sem labels"
				}
				return true, ""
			},
		},
		{
			Name:        "has_aria_attributes",
			Description: "Usa atributos ARIA quando necessário",
			Category:    "accessibility",
			Weight:      5,
			Check: func(code string) (bool, string) {
				// Bônus se usar ARIA
				if strings.Contains(code, "aria-") || strings.Contains(code, "role=") {
					return true, ""
				}
				return false, "Considere adicionar atributos ARIA"
			},
		},

		// ═══════════════════════════════════════════════════════════════════
		// RESPONSIVIDADE
		// ═══════════════════════════════════════════════════════════════════
		{
			Name:        "has_responsive_classes",
			Description: "Usa classes responsivas (Tailwind: sm:, md:, lg:)",
			Category:    "quality",
			Weight:      10,
			Check: func(code string) (bool, string) {
				responsivePatterns := []string{"sm:", "md:", "lg:", "xl:", "@media"}
				for _, pattern := range responsivePatterns {
					if strings.Contains(code, pattern) {
						return true, ""
					}
				}
				return false, "Sem classes responsivas detectadas"
			},
		},

		// ═══════════════════════════════════════════════════════════════════
		// SEGURANÇA
		// ═══════════════════════════════════════════════════════════════════
		{
			Name:        "no_inline_scripts_unsafe",
			Description: "Não usa eval() ou innerHTML com dados não sanitizados",
			Category:    "security",
			Weight:      15,
			Check: func(code string) (bool, string) {
				dangerous := []string{"eval(", "innerHTML =", "document.write("}
				for _, pattern := range dangerous {
					if strings.Contains(code, pattern) {
						return false, "Padrão potencialmente inseguro: " + pattern
					}
				}
				return true, ""
			},
		},
		{
			Name:        "no_exposed_secrets",
			Description: "Não expõe API keys ou secrets no código",
			Category:    "security",
			Weight:      20,
			Check: func(code string) (bool, string) {
				// Padrões de API keys comuns
				patterns := []string{
					`sk-[a-zA-Z0-9]{20,}`,           // OpenAI
					`AIza[a-zA-Z0-9_-]{35}`,         // Google
					`pk_live_[a-zA-Z0-9]{24,}`,      // Stripe
					`sk_live_[a-zA-Z0-9]{24,}`,      // Stripe
					`ghp_[a-zA-Z0-9]{36}`,           // GitHub
					`password\s*[:=]\s*["'][^"']+["']`, // Senhas hardcoded
				}
				for _, pattern := range patterns {
					if regexp.MustCompile(pattern).MatchString(code) {
						return false, "Possível secret exposto no código"
					}
				}
				return true, ""
			},
		},

		// ═══════════════════════════════════════════════════════════════════
		// PERFORMANCE
		// ═══════════════════════════════════════════════════════════════════
		{
			Name:        "scripts_async_defer",
			Description: "Scripts externos usam async ou defer",
			Category:    "performance",
			Weight:      5,
			Check: func(code string) (bool, string) {
				// Se não tem scripts externos, passa
				scriptRegex := regexp.MustCompile(`<script[^>]*src=`)
				scripts := scriptRegex.FindAllString(code, -1)
				if len(scripts) == 0 {
					return true, ""
				}
				// Verifica se usam async ou defer
				for _, script := range scripts {
					if !strings.Contains(script, "async") && !strings.Contains(script, "defer") {
						return false, "Script externo sem async/defer"
					}
				}
				return true, ""
			},
		},

		// ═══════════════════════════════════════════════════════════════════
		// ANTI-PATTERNS
		// ═══════════════════════════════════════════════════════════════════
		{
			Name:        "no_todo_comments",
			Description: "Não tem TODOs ou código incompleto",
			Category:    "quality",
			Weight:      10,
			Check: func(code string) (bool, string) {
				badPatterns := []string{
					"TODO:", "FIXME:", "XXX:", "HACK:",
					"// implement", "// add later",
					"placeholder", "lorem ipsum",
				}
				codeLower := strings.ToLower(code)
				for _, pattern := range badPatterns {
					if strings.Contains(codeLower, strings.ToLower(pattern)) {
						return false, "Código incompleto detectado: " + pattern
					}
				}
				return true, ""
			},
		},
		{
			Name:        "no_empty_functions",
			Description: "Não tem funções vazias",
			Category:    "quality",
			Weight:      10,
			Check: func(code string) (bool, string) {
				// Detecta funções vazias
				emptyFunc := regexp.MustCompile(`function\s+\w+\s*\([^)]*\)\s*\{\s*\}`)
				if emptyFunc.MatchString(code) {
					return false, "Função vazia detectada"
				}
				// Arrow functions vazias
				emptyArrow := regexp.MustCompile(`=>\s*\{\s*\}`)
				if emptyArrow.MatchString(code) {
					return false, "Arrow function vazia detectada"
				}
				return true, ""
			},
		},
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

// Classify classifica um código e retorna a classificação completa
func (c *CodeClassifier) Classify(code string) StarterKitClassification {
	classification := StarterKitClassification{
		ClassifiedBy: "heuristic_v1",
		ClassifiedAt: time.Now().UTC(),
		IsValid:      true,
	}

	// Scores por categoria
	scores := map[string]struct {
		total   int
		earned  int
		maxPossible int
	}{
		"quality":       {0, 0, 0},
		"security":      {0, 0, 0},
		"accessibility": {0, 0, 0},
		"performance":   {0, 0, 0},
	}

	// Aplica cada regra
	for _, rule := range c.rules {
		passed, message := rule.Check(code)

		// Atualiza scores
		cat := scores[rule.Category]
		cat.maxPossible += rule.Weight
		if passed {
			cat.earned += rule.Weight
			classification.PatternsDetected = append(classification.PatternsDetected, rule.Name)
		} else {
			if message != "" {
				classification.Improvements = append(classification.Improvements, message)
			}
			classification.AntiPatterns = append(classification.AntiPatterns, rule.Name)
		}
		scores[rule.Category] = cat
	}

	// Calcula scores finais (0-100)
	calcScore := func(cat string) int {
		s := scores[cat]
		if s.maxPossible == 0 {
			return 100
		}
		return (s.earned * 100) / s.maxPossible
	}

	classification.QualityScore = calcScore("quality")
	classification.SecurityScore = calcScore("security")
	classification.AccessibilityScore = calcScore("accessibility")
	classification.PerformanceScore = calcScore("performance")

	// Score de arquitetura (baseado em padrões detectados)
	classification.ArchitectureScore = c.calculateArchitectureScore(code)

	// Score de manutenibilidade
	classification.MaintainabilityScore = c.calculateMaintainabilityScore(code)

	// Grade final (média ponderada)
	avgScore := (classification.QualityScore*30 +
		classification.SecurityScore*25 +
		classification.AccessibilityScore*15 +
		classification.PerformanceScore*10 +
		classification.ArchitectureScore*10 +
		classification.MaintainabilityScore*10) / 100

	classification.Grade = c.scoreToGrade(avgScore)

	// Validação final
	if classification.SecurityScore < 50 {
		classification.IsValid = false
		classification.ValidationErrors = append(classification.ValidationErrors, "Score de segurança muito baixo")
	}
	if len(classification.AntiPatterns) > 5 {
		classification.IsValid = false
		classification.ValidationErrors = append(classification.ValidationErrors, "Muitos anti-patterns detectados")
	}

	// Atualiza estatísticas
	c.totalClassified++
	c.avgQuality = (c.avgQuality*float64(c.totalClassified-1) + float64(avgScore)) / float64(c.totalClassified)

	return classification
}

// calculateArchitectureScore avalia arquitetura do código
func (c *CodeClassifier) calculateArchitectureScore(code string) int {
	score := 50 // Base

	// Bônus por organização
	if strings.Contains(code, "// ===") || strings.Contains(code, "/* ===") {
		score += 10 // Seções organizadas
	}

	// Bônus por componentes bem definidos
	componentPatterns := []string{
		"function render", "const Component", "class Component",
		"export default", "export const",
	}
	for _, pattern := range componentPatterns {
		if strings.Contains(code, pattern) {
			score += 5
		}
	}

	// Penalidade por código muito longo sem separação
	lines := strings.Count(code, "\n")
	if lines > 500 && !strings.Contains(code, "// ===") {
		score -= 20
	}

	if score > 100 {
		score = 100
	}
	if score < 0 {
		score = 0
	}

	return score
}

// calculateMaintainabilityScore avalia manutenibilidade
func (c *CodeClassifier) calculateMaintainabilityScore(code string) int {
	score := 50 // Base

	// Bônus por comentários
	commentCount := strings.Count(code, "//") + strings.Count(code, "/*")
	lines := strings.Count(code, "\n")
	if lines > 0 {
		commentRatio := float64(commentCount) / float64(lines)
		if commentRatio > 0.05 {
			score += 15
		}
	}

	// Bônus por nomes descritivos (funções com mais de 3 caracteres)
	funcRegex := regexp.MustCompile(`function\s+([a-zA-Z_][a-zA-Z0-9_]*)`)
	funcs := funcRegex.FindAllStringSubmatch(code, -1)
	longNames := 0
	for _, f := range funcs {
		if len(f) > 1 && len(f[1]) > 5 {
			longNames++
		}
	}
	if longNames > 3 {
		score += 15
	}

	// Penalidade por funções muito longas
	// (simplificado - conta linhas entre { e })

	// Bônus por constantes nomeadas
	if strings.Contains(code, "const ") {
		score += 10
	}

	if score > 100 {
		score = 100
	}
	if score < 0 {
		score = 0
	}

	return score
}

// scoreToGrade converte score numérico para grade
func (c *CodeClassifier) scoreToGrade(score int) string {
	switch {
	case score >= 90:
		return "A"
	case score >= 80:
		return "B"
	case score >= 70:
		return "C"
	case score >= 60:
		return "D"
	default:
		return "F"
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE CATEGORIA
// ═══════════════════════════════════════════════════════════════════════════════

// DetectCategory detecta a categoria do código
func (c *CodeClassifier) DetectCategory(code, prompt string) string {
	combined := strings.ToLower(code + " " + prompt)

	categories := map[string][]string{
		"dashboard":  {"dashboard", "painel", "admin", "analytics", "métricas", "gráfico", "chart"},
		"ecommerce":  {"loja", "carrinho", "produto", "checkout", "e-commerce", "shop", "compra", "cart"},
		"landing":    {"landing", "hero", "cta", "call to action", "página inicial", "home"},
		"form":       {"formulário", "form", "cadastro", "registro", "login", "contato", "signup"},
		"game":       {"game", "jogo", "canvas", "sprite", "score", "player", "level"},
		"fintech":    {"banco", "pagamento", "pix", "transferência", "saldo", "financeiro", "payment"},
		"chat":       {"chat", "mensagem", "conversa", "whatsapp", "telegram", "message"},
		"portfolio":  {"portfolio", "portfólio", "projetos", "sobre mim", "currículo", "cv"},
		"blog":       {"blog", "artigo", "post", "notícia", "publicação", "article"},
		"saas":       {"saas", "plataforma", "assinatura", "subscription", "pricing", "plans"},
		"social":     {"rede social", "feed", "perfil", "timeline", "followers", "social"},
		"api":        {"api", "endpoint", "rest", "graphql", "backend", "server"},
		"mobile":     {"mobile", "app", "react native", "flutter", "ios", "android"},
	}

	for category, keywords := range categories {
		for _, keyword := range keywords {
			if strings.Contains(combined, keyword) {
				return category
			}
		}
	}

	return "general"
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTIMATIVA DE COMPLEXIDADE
// ═══════════════════════════════════════════════════════════════════════════════

// EstimateComplexity estima complexidade do código
func (c *CodeClassifier) EstimateComplexity(code string) (string, int) {
	lines := strings.Count(code, "\n")
	
	// Conta componentes/funções
	funcCount := strings.Count(code, "function ") + strings.Count(code, "=> {")
	
	// Conta integrações
	integrations := 0
	integrationPatterns := []string{
		"fetch(", "axios", "supabase", "firebase", "stripe",
		"localStorage", "sessionStorage", "indexedDB",
	}
	for _, pattern := range integrationPatterns {
		if strings.Contains(code, pattern) {
			integrations++
		}
	}

	// Calcula horas estimadas (muito simplificado)
	// Um dev sênior escreve ~100-200 linhas de código de qualidade por dia
	estimatedHours := lines / 20 // ~20 linhas por hora de código de qualidade

	// Ajusta por complexidade
	if funcCount > 20 {
		estimatedHours = int(float64(estimatedHours) * 1.5)
	}
	if integrations > 3 {
		estimatedHours = int(float64(estimatedHours) * 1.3)
	}

	// Determina complexidade
	var complexity string
	switch {
	case lines < 200 && funcCount < 5:
		complexity = "low"
	case lines < 1000 && funcCount < 20:
		complexity = "medium"
	case lines < 5000 && funcCount < 50:
		complexity = "high"
	default:
		complexity = "enterprise"
	}

	return complexity, estimatedHours
}

// GetStats retorna estatísticas do classificador
func (c *CodeClassifier) GetStats() map[string]interface{} {
	return map[string]interface{}{
		"total_classified": c.totalClassified,
		"avg_quality":      c.avgQuality,
		"rules_count":      len(c.rules),
	}
}
