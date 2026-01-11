package narrative

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NarrativeIntegration conecta eventos do sistema com narrativas
type NarrativeIntegration struct {
	service *NarrativeService
	db      *gorm.DB
}

func NewNarrativeIntegration(db *gorm.DB) *NarrativeIntegration {
	return &NarrativeIntegration{
		service: NewNarrativeService(db),
		db:      db,
	}
}

// OnDeployFailed cria narrativa quando deploy falha
func (i *NarrativeIntegration) OnDeployFailed(appID uuid.UUID, appName, phase, errorMsg, context string) {
	var narrative FailureNarrative
	
	if phase == "build" {
		narrative = NewNarrative(appID).
			What("Deploy do app \"" + appName + "\" falhou na fase de build").
			Where("Pipeline de CI/CD - Stage: Build").
			Why(errorMsg).
			Context(context).
			ActionTaken("Build cancelado. Container não foi atualizado.").
			NextStep("Verificar código e dependências, corrigir erro e tentar novamente").
			Severity("error").
			Build()
	} else {
		narrative = NewNarrative(appID).
			What("Deploy do app \"" + appName + "\" falhou na infraestrutura").
			Where("Pipeline de CI/CD - Stage: Deploy").
			Why(errorMsg).
			Context(context).
			ActionTaken("Sistema tentará retry automático em 30s").
			NextStep("Aguardar retry ou verificar status da infraestrutura").
			Severity("critical").
			Build()
	}
	
	if err := i.service.Create(narrative); err != nil {
		log.Printf("❌ Falha ao criar narrativa de deploy: %v", err)
	} else {
		log.Printf("📝 Narrativa criada: %s", narrative.What)
	}
}

// OnContainerCrash cria narrativa quando container crasha
func (i *NarrativeIntegration) OnContainerCrash(appID uuid.UUID, appName, containerID, exitCode, logs string, restartCount int) {
	severity := "error"
	actionTaken := "Sistema tentará restart automático"
	nextStep := "Verificar logs e corrigir erro no código"
	
	if restartCount >= 3 {
		severity = "critical"
		actionTaken = "Container parado após múltiplos crashes"
		nextStep = "Investigar causa raiz. Considerar rollback."
	}
	
	narrative := NewNarrative(appID).
		What("Container do app \"" + appName + "\" crashou").
		Where("Runtime - Container: " + containerID).
		Why("Exit code: " + exitCode).
		Context(fmt.Sprintf("Restarts: %d | Logs: %s", restartCount, truncate(logs, 500))).
		ActionTaken(actionTaken).
		NextStep(nextStep).
		Severity(severity).
		ContainerID(containerID).
		Build()
	
	if err := i.service.Create(narrative); err != nil {
		log.Printf("❌ Falha ao criar narrativa de crash: %v", err)
	}
}

// OnContainerOOM cria narrativa quando container fica sem memória
func (i *NarrativeIntegration) OnContainerOOM(appID uuid.UUID, appName, containerID, memoryLimit string) {
	narrative := NewNarrative(appID).
		What("Container do app \"" + appName + "\" foi encerrado por falta de memória").
		Where("Runtime - Container: " + containerID).
		Why("Out of Memory (OOM) - Limite excedido").
		Context("Limite de memória: " + memoryLimit).
		ActionTaken("Container parado. Sem retry automático.").
		NextStep("Aumentar limite de memória ou otimizar código para usar menos RAM").
		Severity("error").
		ContainerID(containerID).
		Build()
	
	if err := i.service.Create(narrative); err != nil {
		log.Printf("❌ Falha ao criar narrativa de OOM: %v", err)
	}
}

// OnHealthCheckFailed cria narrativa quando health check falha
func (i *NarrativeIntegration) OnHealthCheckFailed(appID uuid.UUID, appName, endpoint, timeout string, attempts int, rolledBack bool) {
	actionTaken := "Aguardando próxima tentativa"
	nextStep := "Verificar se app está respondendo corretamente"
	severity := "warning"
	
	if rolledBack {
		actionTaken = "Rollback para versão anterior executado"
		nextStep = "Investigar por que nova versão não responde"
		severity = "error"
	}
	
	narrative := NewNarrative(appID).
		What("Health check do app \"" + appName + "\" falhou").
		Where("Monitoramento - Endpoint: " + endpoint).
		Why("Endpoint não respondeu em " + timeout).
		Context(fmt.Sprintf("Tentativas: %d", attempts)).
		ActionTaken(actionTaken).
		NextStep(nextStep).
		Severity(severity).
		Build()
	
	if err := i.service.Create(narrative); err != nil {
		log.Printf("❌ Falha ao criar narrativa de health check: %v", err)
	}
}

// OnWebhookFailed cria narrativa quando webhook falha repetidamente
func (i *NarrativeIntegration) OnWebhookFailed(appID uuid.UUID, appName, webhookURL string, attempts int, lastError string) {
	narrative := NewNarrative(appID).
		What("Webhook do app \"" + appName + "\" falhou após múltiplas tentativas").
		Where("Sistema de Webhooks - URL: " + truncate(webhookURL, 100)).
		Why(lastError).
		Context(fmt.Sprintf("Tentativas: %d com backoff exponencial", attempts)).
		ActionTaken("Webhook desabilitado temporariamente").
		NextStep("Verificar se endpoint está acessível e respondendo corretamente").
		Severity("warning").
		Build()
	
	if err := i.service.Create(narrative); err != nil {
		log.Printf("❌ Falha ao criar narrativa de webhook: %v", err)
	}
}

// OnCertificateExpiring cria narrativa quando certificado está expirando
func (i *NarrativeIntegration) OnCertificateExpiring(appID uuid.UUID, appName, domain, expiresAt string, daysLeft int) {
	severity := "info"
	if daysLeft <= 7 {
		severity = "warning"
	}
	if daysLeft <= 1 {
		severity = "critical"
	}
	
	narrative := NewNarrative(appID).
		What("Certificado SSL do app \"" + appName + "\" expira em breve").
		Where("Domain: " + domain).
		Why("Certificado expira em " + expiresAt).
		Context(fmt.Sprintf("Dias restantes: %d", daysLeft)).
		ActionTaken("Renovação automática agendada").
		NextStep("Monitorar renovação. Se falhar, renovar manualmente.").
		Severity(severity).
		Build()
	
	if err := i.service.Create(narrative); err != nil {
		log.Printf("❌ Falha ao criar narrativa de certificado: %v", err)
	}
}

// OnResourceLimitReached cria narrativa quando limite de recurso é atingido
func (i *NarrativeIntegration) OnResourceLimitReached(appID uuid.UUID, appName, resource string, current, limit float64, unit string) {
	percentage := (current / limit) * 100
	severity := "warning"
	if percentage >= 90 {
		severity = "error"
	}
	
	narrative := NewNarrative(appID).
		What("App \"" + appName + "\" atingiu limite de " + resource).
		Where("Monitoramento de Recursos").
		Why("Uso atual: " + formatFloat(current) + unit + " de " + formatFloat(limit) + unit + " (" + formatFloat(percentage) + "%)").
		Context("Recurso: " + resource).
		ActionTaken("Alerta gerado. Nenhuma ação automática.").
		NextStep("Considerar upgrade de plano ou otimizar uso de recursos").
		Severity(severity).
		Build()
	
	if err := i.service.Create(narrative); err != nil {
		log.Printf("❌ Falha ao criar narrativa de limite: %v", err)
	}
}

// Helper functions
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

func formatFloat(f float64) string {
	return fmt.Sprintf("%.2f", f)
}
