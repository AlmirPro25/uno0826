package invariants

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes registra endpoints para monitoramento de invariants
func RegisterRoutes(router *gin.RouterGroup) {
	inv := router.Group("/invariants")
	{
		inv.GET("/violations", getViolations)
		inv.GET("/stats", getStats)
		inv.DELETE("/violations", clearViolationsHandler)
	}
}

// getViolations retorna todas as violações registradas
func getViolations(c *gin.Context) {
	violations := GetViolations()
	
	// Filtrar por categoria se especificado
	category := c.Query("category")
	if category != "" {
		filtered := make([]Violation, 0)
		for _, v := range violations {
			// Extrair categoria do nome da invariant (ex: "ads_impression_not_duplicated" -> "ads")
			if len(v.Invariant) > 0 {
				parts := splitInvariantName(v.Invariant)
				if len(parts) > 0 && parts[0] == category {
					filtered = append(filtered, v)
				}
			}
		}
		violations = filtered
	}
	
	c.JSON(http.StatusOK, gin.H{
		"violations": violations,
		"count":      len(violations),
		"category":   category,
	})
}

// splitInvariantName extrai partes do nome da invariant
func splitInvariantName(name string) []string {
	result := make([]string, 0)
	current := ""
	for _, c := range name {
		if c == '_' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(c)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

// getStats retorna estatísticas das violações
func getStats(c *gin.Context) {
	violations := GetViolations()

	// Contar por severidade
	bySeverity := map[string]int{
		"WARNING":  0,
		"CRITICAL": 0,
		"FATAL":    0,
	}

	// Contar por invariant
	byInvariant := make(map[string]int)

	for _, v := range violations {
		bySeverity[v.Severity.String()]++
		byInvariant[v.Invariant]++
	}

	c.JSON(http.StatusOK, gin.H{
		"total":        len(violations),
		"by_severity":  bySeverity,
		"by_invariant": byInvariant,
		"enabled":      enabled,
	})
}

// clearViolationsHandler limpa o histórico de violações
func clearViolationsHandler(c *gin.Context) {
	ClearViolations()
	c.JSON(http.StatusOK, gin.H{
		"message": "Violations cleared",
	})
}
