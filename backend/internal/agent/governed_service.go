package agent

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"prost-qs/backend/internal/approval"
	"prost-qs/backend/internal/audit"
	"prost-qs/backend/internal/authority"
	"prost-qs/backend/internal/autonomy"
	"prost-qs/backend/internal/killswitch"
	"prost-qs/backend/internal/policy"
	"prost-qs/backend/internal/shadow"
)

// ========================================
// GOVERNED AGENT SERVICE
// "Toda decisão de agente passa por governança"
// ========================================

// GovernedAgentService wraps AgentService with governance
type GovernedAgentService struct {
	*AgentService
	policyService    *policy.PolicyService
	killSwitch       *killswitch.KillSwitchService
	auditService     *audit.AuditService
	autonomyService  *autonomy.AutonomyService  // Fase 12
	shadowService    *shadow.ShadowService      // Fase 12.2
	approvalService  *approval.ApprovalService  // Fase 13
	authorityService *authority.AuthorityService // Fase 13
	memoryService    MemoryChecker              // Fase 14
}

// ========================================
// APP CONTEXT - Fase 16
// "Toda operação sabe de qual app veio"
// ========================================

// AgentAppContext contexto de aplicação para operações de agente
type AgentAppContext struct {
	AppID     *uuid.UUID
	AppUserID *uuid.UUID
	SessionID *uuid.UUID
	IP        string
	UserAgent string
}

// toAuditContext converte para AuditContext
func (c *AgentAppContext) toAuditContext() *audit.AuditContext {
	if c == nil {
		return nil
	}
	return &audit.AuditContext{
		AppID:     c.AppID,
		AppUserID: c.AppUserID,
		SessionID: c.SessionID,
		IP:        c.IP,
		UserAgent: c.UserAgent,
	}
}

// MemoryChecker interface para verificação de memória institucional
type MemoryChecker interface {
	IsDecisionActive(decisionID uuid.UUID) (bool, error)
	HasOpenConflict(decisionID uuid.UUID) (bool, any, error)
	CanExecute(decisionID uuid.UUID) (bool, string, error)
}

// NewGovernedAgentService creates a governed agent service
func NewGovernedAgentService(
	agentSvc *AgentService,
	policyService *policy.PolicyService,
	killSwitch *killswitch.KillSwitchService,
	auditService *audit.AuditService,
) *GovernedAgentService {
	return &GovernedAgentService{
		AgentService:  agentSvc,
		policyService: policyService,
		killSwitch:    killSwitch,
		auditService:  auditService,
	}
}

// SetAutonomyService configura o serviço de autonomia (Fase 12)
func (s *GovernedAgentService) SetAutonomyService(autonomySvc *autonomy.AutonomyService) {
	s.autonomyService = autonomySvc
}

// SetShadowService configura o serviço de shadow mode (Fase 12.2)
func (s *GovernedAgentService) SetShadowService(shadowSvc *shadow.ShadowService) {
	s.shadowService = shadowSvc
}

// SetApprovalService configura o serviço de aprovação (Fase 13)
func (s *GovernedAgentService) SetApprovalService(approvalSvc *approval.ApprovalService) {
	s.approvalService = approvalSvc
}

// SetAuthorityService configura o serviço de autoridade (Fase 13)
func (s *GovernedAgentService) SetAuthorityService(authoritySvc *authority.AuthorityService) {
	s.authorityService = authoritySvc
}

// SetMemoryService configura o serviço de memória institucional (Fase 14)
func (s *GovernedAgentService) SetMemoryService(memorySvc MemoryChecker) {
	s.memoryService = memorySvc
}

// ========================================
// GOVERNED OPERATIONS
// ========================================

// ProposeDecisionGoverned proposes decision with governance
func (s *GovernedAgentService) ProposeDecisionGoverned(ctx context.Context, input ProposeDecisionInput, appCtx *AgentAppContext) (*AgentDecision, error) {
	// 0. FASE 12: Verificação de Autonomia (ANTES de tudo)
	// "Esse agente poderia fazer isso sozinho?"
	if s.autonomyService != nil {
		autonomyCheck, err := s.autonomyService.Check(autonomy.AutonomyCheckRequest{
			AgentID: input.AgentID,
			Action:  input.Action,
			Domain:  input.Domain,
			Amount:  input.Amount,
		})
		if err != nil && err != autonomy.ErrActionNotDefined {
			// Erro interno - logar mas não bloquear (graceful degradation)
			fmt.Printf("AUTONOMY CHECK ERROR: %v\n", err)
		} else if autonomyCheck != nil {
			// Ação forbidden por matriz de autonomia
			if autonomyCheck.AutonomyLevel == autonomy.AutonomyForbidden {
				s.auditService.LogWithAppContext(
					appCtx.toAuditContext(),
					audit.EventAgentDecisionRejected,
					input.AgentID, uuid.Nil,
					audit.ActorSystem, "agent_decision", "autonomy_forbidden",
					nil, nil, nil,
					fmt.Sprintf("AUTONOMIA PROIBIDA: %s - %s", input.Action, autonomyCheck.Reason),
				)
				return nil, fmt.Errorf("ação proibida por matriz de autonomia: %s", autonomyCheck.Reason)
			}

			// Ação requer humano
			if autonomyCheck.RequiresHuman {
				s.auditService.LogWithAppContext(
					appCtx.toAuditContext(),
					audit.EventAgentDecisionProposed,
					input.AgentID, uuid.Nil,
					audit.ActorAgent, "agent_decision", "requires_human",
					nil, nil, nil,
					fmt.Sprintf("Ação requer aprovação humana: %s", input.Action),
				)
				// Não bloqueia, mas marca que precisa de aprovação
				// A decisão será criada com requires_approval = true
			}

			// Shadow only - executar em shadow mode
			if autonomyCheck.ShadowOnly && s.shadowService != nil {
				// Executar simulação shadow
				shadowResult, shadowErr := s.shadowService.Execute(shadow.ShadowRequest{
					AgentID:      input.AgentID,
					Domain:       input.Domain,
					Action:       input.Action,
					TargetEntity: input.TargetEntity,
					Amount:       input.Amount,
					Payload:      input.Payload,
					Reason:       input.Reason,
					ShadowReason: autonomyCheck.Reason,
				})

				if shadowErr != nil {
					fmt.Printf("SHADOW ERROR: %v\n", shadowErr)
				} else {
					// Logar no Audit com as 3 perguntas respondidas + AppContext
					s.auditService.LogWithAppContext(
						appCtx.toAuditContext(),
						audit.EventAgentDecisionProposed,
						input.AgentID, shadowResult.ExecutionID,
						audit.ActorAgent, "shadow_execution", "shadow_mode",
						nil,
						map[string]any{
							"mode":              "shadow",
							"executed":          false,
							"would_succeed":     shadowResult.WhatWouldHappen.WouldSucceed,
							"estimated_impact":  shadowResult.WhatWouldHappen.EstimatedImpact,
							"risk_score":        shadowResult.WhatWouldHappen.RiskScore,
							"recommendation":    shadowResult.Recommendation,
						},
						map[string]any{
							"what_agent_wanted": shadowResult.WhatAgentWanted,
							"why_didnt_happen":  shadowResult.WhyDidntHappen,
						},
						fmt.Sprintf("SHADOW MODE: Agente tentou %s - simulação registrada", input.Action),
					)

					// FASE 13: Criar ApprovalRequest automaticamente se recomendado
					if s.approvalService != nil && (shadowResult.Recommendation == "safe_to_promote" || shadowResult.Recommendation == "needs_review") {
						approvalReq, approvalErr := s.approvalService.CreateRequest(approval.CreateApprovalRequest{
							Domain:          input.Domain,
							Action:          input.Action,
							Impact:          s.mapRiskToImpact(shadowResult.WhatWouldHappen.RiskScore),
							Amount:          input.Amount,
							Context: approval.ApprovalContext{
								Intent:               shadowResult.WhatAgentWanted.Action,
								Description:          shadowResult.WhatAgentWanted.Reason,
								SimulatedOutcome:     fmt.Sprintf("Would succeed: %v, Impact: %s", shadowResult.WhatWouldHappen.WouldSucceed, shadowResult.WhatWouldHappen.EstimatedImpact),
								SystemRecommendation: shadowResult.Recommendation,
								RiskAssessment:       fmt.Sprintf("Risk Score: %.2f - %s", shadowResult.WhatWouldHappen.RiskScore, shadowResult.WhatWouldHappen.EstimatedImpact),
								Metadata: map[string]any{
									"shadow_execution_id": shadowResult.ExecutionID,
									"would_succeed":       shadowResult.WhatWouldHappen.WouldSucceed,
									"would_affect":        shadowResult.WhatWouldHappen.WouldAffect,
									"risk_factors":        shadowResult.WhatWouldHappen.RiskFactors,
									"app_id":              appCtx.AppID, // Fase 16
								},
							},
							RequestedBy:     input.AgentID,
							RequestedByType: "agent",
							RequestReason:   input.Reason,
							ExpiresInHours:  24,
						})

						if approvalErr != nil {
							fmt.Printf("APPROVAL REQUEST ERROR: %v\n", approvalErr)
						} else {
							s.auditService.LogWithAppContext(
								appCtx.toAuditContext(),
								"APPROVAL_REQUEST_AUTO_CREATED",
								input.AgentID, approvalReq.ID,
								audit.ActorSystem, "approval_request", "auto_create",
								nil, nil, nil,
								fmt.Sprintf("ApprovalRequest criado automaticamente a partir de Shadow Mode: %s", shadowResult.Recommendation),
							)
							
							// Retornar erro informativo com ID do approval request
							return nil, fmt.Errorf("shadow mode: ação requer aprovação humana - ApprovalRequest ID: %s", approvalReq.ID)
						}
					}

					// Retornar erro informativo (não é erro real, é shadow)
					return nil, fmt.Errorf("shadow mode: ação simulada mas não executada - %s", shadowResult.Recommendation)
				}
			}
		}
	}

	// 1. Check Kill Switch
	if err := s.killSwitch.Check(killswitch.ScopeAgents); err != nil {
		auditErr := s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventAgentDecisionProposed,
			input.AgentID, uuid.Nil,
			audit.ActorAgent, "agent_decision", "propose_blocked",
			nil, nil, nil,
			"Bloqueado por Kill Switch: operação de agente impedida durante emergência",
		)
		if auditErr != nil {
			fmt.Printf("AUDIT ERROR: %v\n", auditErr)
		}
		return nil, fmt.Errorf("operação bloqueada: %w", err)
	}

	// 2. Evaluate Policy Engine (além da policy interna do agente)
	evalResult, err := s.policyService.Evaluate(policy.EvaluationRequest{
		Resource: policy.ResourceAgent,
		Action:   policy.ActionExecute,
		Context: map[string]any{
			"agent_id":      input.AgentID.String(),
			"domain":        input.Domain,
			"action":        input.Action,
			"target_entity": input.TargetEntity,
			"amount":        input.Amount,
			"app_id":        appCtx.AppID, // Fase 16
		},
		ActorID:   input.AgentID,
		ActorType: "agent",
	})
	if err != nil {
		return nil, err
	}

	if !evalResult.Allowed {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventAgentDecisionRejected,
			input.AgentID, uuid.Nil,
			audit.ActorAgent, "agent_decision", "propose",
			nil, nil, nil,
			fmt.Sprintf("Bloqueado por política global: %s", evalResult.Reason),
		)
		return nil, fmt.Errorf("bloqueado por política: %s", evalResult.Reason)
	}

	// 3. Execute (usa a lógica interna do AgentService)
	decision, err := s.AgentService.ProposeDecision(ctx, input)
	if err != nil {
		return nil, err
	}

	// 3.1 Fase 16: Atualizar decisão com AppID
	if appCtx != nil && appCtx.AppID != nil {
		decision.AppID = appCtx.AppID
		s.db.Model(decision).Update("app_id", appCtx.AppID)
	}

	// 4. Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventAgentDecisionProposed,
		input.AgentID, decision.ID,
		audit.ActorAgent, "agent_decision", "propose",
		nil,
		map[string]any{
			"decision_id":   decision.ID.String(),
			"domain":        input.Domain,
			"action":        input.Action,
			"target_entity": input.TargetEntity,
			"risk_score":    decision.RiskScore,
			"status":        decision.Status,
		},
		map[string]any{
			"amount": input.Amount,
			"reason": input.Reason,
		},
		fmt.Sprintf("Agente propôs decisão: %s", input.Action),
	)

	return decision, nil
}

// ApproveDecisionGoverned approves decision with governance
func (s *GovernedAgentService) ApproveDecisionGoverned(ctx context.Context, decisionID uuid.UUID, reviewerID uuid.UUID, note string, appCtx *AgentAppContext) (*AgentDecision, error) {
	// 1. Check Kill Switch
	if err := s.killSwitch.Check(killswitch.ScopeAgents); err != nil {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventAgentDecisionApproved,
			reviewerID, decisionID,
			audit.ActorAdmin, "agent_decision", "approve",
			nil, nil, nil,
			"Bloqueado por Kill Switch",
		)
		return nil, fmt.Errorf("operação bloqueada: %w", err)
	}

	// 2. Get decision before
	decisionBefore, _ := s.AgentService.GetDecision(decisionID)

	// 3. Execute
	decision, err := s.AgentService.ApproveDecision(ctx, decisionID, reviewerID, note)
	if err != nil {
		return nil, err
	}

	// 4. Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventAgentDecisionApproved,
		reviewerID, decisionID,
		audit.ActorAdmin, "agent_decision", "approve",
		map[string]any{"status": decisionBefore.Status},
		map[string]any{"status": decision.Status, "reviewed_by": reviewerID.String()},
		map[string]any{"note": note},
		fmt.Sprintf("Decisão aprovada por humano: %s", note),
	)

	return decision, nil
}

// RejectDecisionGoverned rejects decision with governance
func (s *GovernedAgentService) RejectDecisionGoverned(ctx context.Context, decisionID uuid.UUID, reviewerID uuid.UUID, note string, appCtx *AgentAppContext) (*AgentDecision, error) {
	// 1. Get decision before
	decisionBefore, _ := s.AgentService.GetDecision(decisionID)

	// 2. Execute
	decision, err := s.AgentService.RejectDecision(ctx, decisionID, reviewerID, note)
	if err != nil {
		return nil, err
	}

	// 3. Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventAgentDecisionRejected,
		reviewerID, decisionID,
		audit.ActorAdmin, "agent_decision", "reject",
		map[string]any{"status": decisionBefore.Status},
		map[string]any{"status": decision.Status, "reviewed_by": reviewerID.String()},
		map[string]any{"note": note},
		fmt.Sprintf("Decisão rejeitada por humano: %s", note),
	)

	return decision, nil
}

// ExecuteDecisionGoverned executes decision with governance
func (s *GovernedAgentService) ExecuteDecisionGoverned(ctx context.Context, decisionID uuid.UUID, appCtx *AgentAppContext) error {
	// 1. Check Kill Switch
	if err := s.killSwitch.Check(killswitch.ScopeAgents); err != nil {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventAgentDecisionExecuted,
			uuid.Nil, decisionID,
			audit.ActorSystem, "agent_decision", "execute",
			nil, nil, nil,
			"Bloqueado por Kill Switch",
		)
		return fmt.Errorf("operação bloqueada: %w", err)
	}

	// 2. FASE 14: Verificar Memória Institucional
	// "O sistema sabe se uma decisão pode produzir efeitos"
	if s.memoryService != nil {
		canExecute, reason, err := s.memoryService.CanExecute(decisionID)
		if err != nil {
			fmt.Printf("MEMORY CHECK ERROR: %v\n", err)
			// Graceful degradation - não bloqueia se erro interno
		} else if !canExecute {
			s.auditService.LogWithAppContext(
				appCtx.toAuditContext(),
				audit.EventAgentDecisionRejected,
				uuid.Nil, decisionID,
				audit.ActorSystem, "agent_decision", "execute_blocked_by_memory",
				nil, nil, nil,
				fmt.Sprintf("MEMÓRIA INSTITUCIONAL: %s", reason),
			)
			return fmt.Errorf("execução bloqueada por memória institucional: %s", reason)
		}
	}

	// 3. Get decision before
	decision, err := s.AgentService.GetDecision(decisionID)
	if err != nil {
		return err
	}

	// 4. Evaluate Policy Engine (verificação final antes de executar)
	evalResult, err := s.policyService.Evaluate(policy.EvaluationRequest{
		Resource: policy.ResourceAgent,
		Action:   policy.ActionExecute,
		Context: map[string]any{
			"agent_id":      decision.AgentID.String(),
			"decision_id":   decisionID.String(),
			"domain":        decision.Domain,
			"action":        decision.ProposedAction,
			"target_entity": decision.TargetEntity,
			"risk_score":    decision.RiskScore,
			"app_id":        decision.AppID, // Fase 16
		},
		ActorID:   decision.AgentID,
		ActorType: "agent",
	})
	if err != nil {
		return err
	}

	if !evalResult.Allowed {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventAgentDecisionRejected,
			decision.AgentID, decisionID,
			audit.ActorSystem, "agent_decision", "execute",
			nil, nil, nil,
			fmt.Sprintf("Bloqueado por política na execução: %s", evalResult.Reason),
		)
		return fmt.Errorf("bloqueado por política: %s", evalResult.Reason)
	}

	// 5. Execute
	err = s.AgentService.ExecuteDecision(ctx, decisionID)

	// 6. Audit Log com AppContext
	if err != nil {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventAgentDecisionExecuted,
			decision.AgentID, decisionID,
			audit.ActorAgent, "agent_decision", "execute",
			map[string]any{"status": "approved"},
			map[string]any{"status": "failed", "error": err.Error()},
			nil,
			fmt.Sprintf("Execução falhou: %s", err.Error()),
		)
	} else {
		s.auditService.LogWithAppContext(
			appCtx.toAuditContext(),
			audit.EventAgentDecisionExecuted,
			decision.AgentID, decisionID,
			audit.ActorAgent, "agent_decision", "execute",
			map[string]any{"status": "approved"},
			map[string]any{"status": "executed"},
			map[string]any{
				"action":        decision.ProposedAction,
				"target_entity": decision.TargetEntity,
			},
			"Decisão executada com sucesso",
		)
	}

	return err
}

// SuspendAgentGoverned suspends agent with governance
func (s *GovernedAgentService) SuspendAgentGoverned(ctx context.Context, agentID uuid.UUID, actorID uuid.UUID, reason string, appCtx *AgentAppContext) (*Agent, error) {
	// Get before
	agentBefore, _ := s.AgentService.GetAgent(agentID)

	// Execute
	agent, err := s.AgentService.SuspendAgent(ctx, agentID)
	if err != nil {
		return nil, err
	}

	// Audit Log com AppContext
	s.auditService.LogWithAppContext(
		appCtx.toAuditContext(),
		audit.EventUserSuspended, // Reutilizando evento
		actorID, agentID,
		audit.ActorAdmin, "agent", "suspend",
		map[string]any{"status": agentBefore.Status},
		map[string]any{"status": agent.Status},
		map[string]any{"reason": reason},
		fmt.Sprintf("Agente suspenso: %s", reason),
	)

	return agent, nil
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// mapRiskToImpact converte risk score para ImpactLevel
func (s *GovernedAgentService) mapRiskToImpact(riskScore float64) authority.ImpactLevel {
	switch {
	case riskScore >= 0.8:
		return authority.ImpactCritical
	case riskScore >= 0.6:
		return authority.ImpactHigh
	case riskScore >= 0.4:
		return authority.ImpactMedium
	case riskScore >= 0.2:
		return authority.ImpactLow
	default:
		return authority.ImpactNone
	}
}
