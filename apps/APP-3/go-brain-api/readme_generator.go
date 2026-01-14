package main

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    README GENERATOR - Documentação Automática                 ║
║                                                                               ║
║              Gera README profissional para cada Starter Kit                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

Cada Starter Kit precisa de documentação para ter valor no marketplace.
Este módulo gera README automaticamente baseado no código e metadados.
*/

import (
	"fmt"
	"strings"
	"time"
)

// ReadmeGenerator gera documentação automática para Starter Kits
type ReadmeGenerator struct{}

// NewReadmeGenerator cria nova instância
func NewReadmeGenerator() *ReadmeGenerator {
	return &ReadmeGenerator{}
}

// GenerateReadme gera README completo para um Starter Kit
func (rg *ReadmeGenerator) GenerateReadme(kit *StarterKit) string {
	var sb strings.Builder

	// Header
	sb.WriteString(rg.generateHeader(kit))
	
	// Badges
	sb.WriteString(rg.generateBadges(kit))
	
	// Descrição
	sb.WriteString(rg.generateDescription(kit))
	
	// Features
	sb.WriteString(rg.generateFeatures(kit))
	
	// Quick Start
	sb.WriteString(rg.generateQuickStart(kit))
	
	// Estrutura
	sb.WriteString(rg.generateStructure(kit))
	
	// Tecnologias
	sb.WriteString(rg.generateTechnologies(kit))
	
	// Qualidade
	sb.WriteString(rg.generateQualityReport(kit))
	
	// Trade-offs
	if len(kit.Metadata.TradeOffs) > 0 {
		sb.WriteString(rg.generateTradeOffs(kit))
	}
	
	// Footer
	sb.WriteString(rg.generateFooter(kit))

	return sb.String()
}

// generateHeader gera o cabeçalho do README
func (rg *ReadmeGenerator) generateHeader(kit *StarterKit) string {
	title := rg.extractTitle(kit.Prompt)
	
	return fmt.Sprintf(`# %s

> %s

`, title, kit.Prompt)
}

// generateBadges gera badges do projeto
func (rg *ReadmeGenerator) generateBadges(kit *StarterKit) string {
	grade := kit.Classification.Grade
	quality := kit.Classification.QualityScore
	complexity := kit.Metadata.Complexity
	category := kit.Metadata.Category

	gradeColor := map[string]string{
		"A": "brightgreen",
		"B": "green",
		"C": "yellow",
		"D": "orange",
		"F": "red",
	}[grade]

	complexityColor := map[string]string{
		"low":        "brightgreen",
		"medium":     "yellow",
		"high":       "orange",
		"enterprise": "red",
	}[complexity]

	return fmt.Sprintf(`[![Grade](https://img.shields.io/badge/Grade-%s-%s.svg)]()
[![Quality](https://img.shields.io/badge/Quality-%d%%25-blue.svg)]()
[![Complexity](https://img.shields.io/badge/Complexity-%s-%s.svg)]()
[![Category](https://img.shields.io/badge/Category-%s-purple.svg)]()

---

`, grade, gradeColor, quality, complexity, complexityColor, category)
}

// generateDescription gera descrição do projeto
func (rg *ReadmeGenerator) generateDescription(kit *StarterKit) string {
	hours := kit.Metadata.EstimatedHours
	
	return fmt.Sprintf(`## 📋 Sobre

Este Starter Kit foi gerado automaticamente e representa aproximadamente **%d horas** de desenvolvimento economizadas.

### O que está incluído:

- ✅ Código funcional e testado
- ✅ Estrutura de projeto organizada
- ✅ Boas práticas implementadas
- ✅ Responsivo e acessível

`, hours)
}

// generateFeatures detecta e lista features do código
func (rg *ReadmeGenerator) generateFeatures(kit *StarterKit) string {
	features := rg.detectFeatures(kit.Code)
	
	if len(features) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("## ✨ Features\n\n")
	
	for _, feature := range features {
		sb.WriteString(fmt.Sprintf("- %s\n", feature))
	}
	sb.WriteString("\n")
	
	return sb.String()
}

// generateQuickStart gera instruções de uso
func (rg *ReadmeGenerator) generateQuickStart(kit *StarterKit) string {
	return `## 🚀 Quick Start

### 1. Clone ou copie o código

` + "```bash" + `
# Copie o arquivo HTML para seu projeto
cp index.html seu-projeto/
` + "```" + `

### 2. Abra no navegador

` + "```bash" + `
# Simplesmente abra o arquivo HTML
open index.html
# ou
start index.html  # Windows
` + "```" + `

### 3. Personalize

Edite o código conforme suas necessidades. O código está bem comentado e organizado.

`
}

// generateStructure analisa e documenta a estrutura
func (rg *ReadmeGenerator) generateStructure(kit *StarterKit) string {
	structure := rg.analyzeStructure(kit.Code)
	
	var sb strings.Builder
	sb.WriteString("## 📁 Estrutura\n\n")
	sb.WriteString("```\n")
	
	for _, item := range structure {
		sb.WriteString(fmt.Sprintf("%s\n", item))
	}
	
	sb.WriteString("```\n\n")
	return sb.String()
}

// generateTechnologies lista tecnologias detectadas
func (rg *ReadmeGenerator) generateTechnologies(kit *StarterKit) string {
	techs := rg.detectTechnologies(kit.Code)
	
	if len(techs) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("## 🛠️ Tecnologias\n\n")
	sb.WriteString("| Tecnologia | Uso |\n")
	sb.WriteString("|------------|-----|\n")
	
	for tech, usage := range techs {
		sb.WriteString(fmt.Sprintf("| %s | %s |\n", tech, usage))
	}
	sb.WriteString("\n")
	
	return sb.String()
}

// generateQualityReport gera relatório de qualidade
func (rg *ReadmeGenerator) generateQualityReport(kit *StarterKit) string {
	c := kit.Classification
	
	return fmt.Sprintf(`## 📊 Relatório de Qualidade

| Métrica | Score | Status |
|---------|-------|--------|
| Qualidade Geral | %d%% | %s |
| Segurança | %d%% | %s |
| Acessibilidade | %d%% | %s |
| Performance | %d%% | %s |
| Arquitetura | %d%% | %s |
| Manutenibilidade | %d%% | %s |

**Grade Final: %s**

`, 
		c.QualityScore, rg.getStatusEmoji(c.QualityScore),
		c.SecurityScore, rg.getStatusEmoji(c.SecurityScore),
		c.AccessibilityScore, rg.getStatusEmoji(c.AccessibilityScore),
		c.PerformanceScore, rg.getStatusEmoji(c.PerformanceScore),
		c.ArchitectureScore, rg.getStatusEmoji(c.ArchitectureScore),
		c.MaintainabilityScore, rg.getStatusEmoji(c.MaintainabilityScore),
		c.Grade,
	)
}

// generateTradeOffs documenta decisões arquiteturais
func (rg *ReadmeGenerator) generateTradeOffs(kit *StarterKit) string {
	var sb strings.Builder
	sb.WriteString("## ⚖️ Trade-offs e Decisões\n\n")
	
	for _, tradeoff := range kit.Metadata.TradeOffs {
		sb.WriteString(fmt.Sprintf("### %s\n\n", tradeoff.Decision))
		sb.WriteString(fmt.Sprintf("**Por quê:** %s\n\n", tradeoff.Reason))
		if tradeoff.Alternative != "" {
			sb.WriteString(fmt.Sprintf("**Alternativa:** %s\n\n", tradeoff.Alternative))
		}
		if tradeoff.Impact != "" {
			sb.WriteString(fmt.Sprintf("**Impacto:** %s\n\n", tradeoff.Impact))
		}
	}
	
	return sb.String()
}

// generateFooter gera rodapé
func (rg *ReadmeGenerator) generateFooter(kit *StarterKit) string {
	return fmt.Sprintf(`---

## 📝 Licença

Este código foi gerado automaticamente e está disponível sob licença %s.

## 🏷️ Metadados

- **ID:** %s
- **Versão:** %d
- **Gerado em:** %s
- **Categoria:** %s
- **Complexidade:** %s

---

*Gerado automaticamente pelo Starter Kit Marketplace*
`, 
		kit.LicenseType,
		kit.ID,
		kit.Version,
		kit.CreatedAt.Format(time.RFC3339),
		kit.Metadata.Category,
		kit.Metadata.Complexity,
	)
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// extractTitle extrai título do prompt
func (rg *ReadmeGenerator) extractTitle(prompt string) string {
	// Remove palavras comuns do início
	prompt = strings.TrimPrefix(prompt, "Crie ")
	prompt = strings.TrimPrefix(prompt, "Criar ")
	prompt = strings.TrimPrefix(prompt, "Faça ")
	prompt = strings.TrimPrefix(prompt, "Fazer ")
	prompt = strings.TrimPrefix(prompt, "Gere ")
	prompt = strings.TrimPrefix(prompt, "Gerar ")
	prompt = strings.TrimPrefix(prompt, "um ")
	prompt = strings.TrimPrefix(prompt, "uma ")
	
	// Capitaliza primeira letra
	if len(prompt) > 0 {
		prompt = strings.ToUpper(string(prompt[0])) + prompt[1:]
	}
	
	// Limita tamanho
	if len(prompt) > 60 {
		prompt = prompt[:57] + "..."
	}
	
	return prompt
}

// detectFeatures detecta features no código
func (rg *ReadmeGenerator) detectFeatures(code string) []string {
	var features []string
	codeLower := strings.ToLower(code)

	featurePatterns := map[string]string{
		"Responsivo (Mobile-first)":     "viewport",
		"Dark Mode":                      "dark",
		"Animações CSS":                  "animation",
		"Formulário com validação":       "<form",
		"Navegação":                      "<nav",
		"Cards/Grid Layout":              "grid",
		"Flexbox Layout":                 "flex",
		"Ícones":                         "icon",
		"Imagens otimizadas":             "<img",
		"Links externos":                 "target=\"_blank\"",
		"Acessibilidade (ARIA)":          "aria-",
		"SEO básico":                     "<meta",
		"Tailwind CSS":                   "tailwindcss",
		"JavaScript interativo":          "<script",
		"Fetch API":                      "fetch(",
		"LocalStorage":                   "localstorage",
		"Gráficos/Charts":                "chart",
		"Tabelas de dados":               "<table",
		"Modal/Dialog":                   "modal",
		"Dropdown/Menu":                  "dropdown",
	}

	for feature, pattern := range featurePatterns {
		if strings.Contains(codeLower, pattern) {
			features = append(features, feature)
		}
	}

	return features
}

// analyzeStructure analisa estrutura do código
func (rg *ReadmeGenerator) analyzeStructure(code string) []string {
	var structure []string
	
	structure = append(structure, "index.html")
	
	// Detecta seções
	if strings.Contains(code, "<head") {
		structure = append(structure, "├── <head> - Metadados e estilos")
	}
	if strings.Contains(code, "<style") {
		structure = append(structure, "│   └── <style> - CSS embutido")
	}
	if strings.Contains(code, "<body") {
		structure = append(structure, "├── <body> - Conteúdo principal")
	}
	if strings.Contains(code, "<header") {
		structure = append(structure, "│   ├── <header> - Cabeçalho")
	}
	if strings.Contains(code, "<nav") {
		structure = append(structure, "│   ├── <nav> - Navegação")
	}
	if strings.Contains(code, "<main") {
		structure = append(structure, "│   ├── <main> - Conteúdo principal")
	}
	if strings.Contains(code, "<footer") {
		structure = append(structure, "│   └── <footer> - Rodapé")
	}
	if strings.Contains(code, "<script") {
		structure = append(structure, "└── <script> - JavaScript")
	}

	return structure
}

// detectTechnologies detecta tecnologias usadas
func (rg *ReadmeGenerator) detectTechnologies(code string) map[string]string {
	techs := make(map[string]string)
	codeLower := strings.ToLower(code)

	techPatterns := map[string]struct {
		pattern string
		usage   string
	}{
		"HTML5":       {"<!doctype html", "Estrutura semântica"},
		"CSS3":        {"<style", "Estilização"},
		"JavaScript":  {"<script", "Interatividade"},
		"Tailwind":    {"tailwindcss", "Framework CSS utilitário"},
		"Alpine.js":   {"x-data", "Reatividade leve"},
		"Chart.js":    {"chart.js", "Gráficos"},
		"Font Awesome": {"fontawesome", "Ícones"},
		"Google Fonts": {"fonts.googleapis", "Tipografia"},
		"Animate.css": {"animate.css", "Animações"},
	}

	for tech, info := range techPatterns {
		if strings.Contains(codeLower, info.pattern) {
			techs[tech] = info.usage
		}
	}

	return techs
}

// getStatusEmoji retorna emoji baseado no score
func (rg *ReadmeGenerator) getStatusEmoji(score int) string {
	switch {
	case score >= 90:
		return "🟢 Excelente"
	case score >= 80:
		return "🟢 Bom"
	case score >= 70:
		return "🟡 Aceitável"
	case score >= 60:
		return "🟠 Melhorar"
	default:
		return "🔴 Crítico"
	}
}

// GenerateArchitectureDiagram gera diagrama ASCII da arquitetura
func (rg *ReadmeGenerator) GenerateArchitectureDiagram(kit *StarterKit) string {
	// Detecta componentes
	hasHeader := strings.Contains(kit.Code, "<header")
	hasNav := strings.Contains(kit.Code, "<nav")
	hasMain := strings.Contains(kit.Code, "<main")
	hasSidebar := strings.Contains(kit.Code, "sidebar")
	hasFooter := strings.Contains(kit.Code, "<footer")

	var sb strings.Builder
	sb.WriteString("```\n")
	sb.WriteString("┌─────────────────────────────────────────┐\n")
	
	if hasHeader {
		sb.WriteString("│              HEADER                     │\n")
		if hasNav {
			sb.WriteString("│  ┌─────────────────────────────────┐    │\n")
			sb.WriteString("│  │           NAVIGATION            │    │\n")
			sb.WriteString("│  └─────────────────────────────────┘    │\n")
		}
		sb.WriteString("├─────────────────────────────────────────┤\n")
	}

	if hasMain {
		if hasSidebar {
			sb.WriteString("│  ┌──────────┐  ┌──────────────────┐    │\n")
			sb.WriteString("│  │ SIDEBAR  │  │                  │    │\n")
			sb.WriteString("│  │          │  │      MAIN        │    │\n")
			sb.WriteString("│  │          │  │     CONTENT      │    │\n")
			sb.WriteString("│  │          │  │                  │    │\n")
			sb.WriteString("│  └──────────┘  └──────────────────┘    │\n")
		} else {
			sb.WriteString("│  ┌─────────────────────────────────┐    │\n")
			sb.WriteString("│  │                                 │    │\n")
			sb.WriteString("│  │          MAIN CONTENT           │    │\n")
			sb.WriteString("│  │                                 │    │\n")
			sb.WriteString("│  └─────────────────────────────────┘    │\n")
		}
	}

	if hasFooter {
		sb.WriteString("├─────────────────────────────────────────┤\n")
		sb.WriteString("│              FOOTER                     │\n")
	}

	sb.WriteString("└─────────────────────────────────────────┘\n")
	sb.WriteString("```\n")

	return sb.String()
}
