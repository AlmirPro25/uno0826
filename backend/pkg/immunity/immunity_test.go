package immunity

import (
	"testing"
	"time"
)

// ========================================
// TESTES DO SISTEMA IMUNOLÓGICO
// ========================================

func TestImmunitySystem_Creation(t *testing.T) {
	is := NewImmunitySystem()
	if is == nil {
		t.Fatal("ImmunitySystem should not be nil")
	}
	
	if !is.IsEnabled() {
		t.Error("ImmunitySystem should be enabled by default")
	}
	
	// Verificar componentes
	if is.AutoHealer() == nil {
		t.Error("AutoHealer should not be nil")
	}
	if is.CircuitBreakers() == nil {
		t.Error("CircuitBreakers should not be nil")
	}
	if is.Quarantine() == nil {
		t.Error("Quarantine should not be nil")
	}
	if is.Escalator() == nil {
		t.Error("Escalator should not be nil")
	}
	if is.Defense() == nil {
		t.Error("Defense should not be nil")
	}
}

func TestImmunitySystem_EnableDisable(t *testing.T) {
	is := NewImmunitySystem()
	
	is.Disable()
	if is.IsEnabled() {
		t.Error("Should be disabled")
	}
	
	is.Enable()
	if !is.IsEnabled() {
		t.Error("Should be enabled")
	}
}

func TestImmunitySystem_HealthCheck(t *testing.T) {
	is := NewImmunitySystem()
	
	// Pequeno delay para garantir uptime > 0
	time.Sleep(10 * time.Millisecond)
	
	health := is.CheckHealth()
	
	if health.Status != "healthy" {
		t.Errorf("Expected healthy status, got %s", health.Status)
	}
	
	if health.Score < 90 {
		t.Errorf("Expected high health score, got %.1f", health.Score)
	}
	
	if health.Uptime <= 0 {
		t.Error("Uptime should be positive")
	}
}

func TestImmunitySystem_RespondToThreat(t *testing.T) {
	is := NewImmunitySystem()
	
	incident := is.RespondToThreat(
		ThreatBruteForce,
		"192.168.1.100",
		SeverityWarning,
		map[string]interface{}{
			"attempts": 10,
		},
	)
	
	if incident == nil {
		t.Fatal("Incident should not be nil")
	}
	
	if incident.Type != string(ThreatBruteForce) {
		t.Errorf("Expected type %s, got %s", ThreatBruteForce, incident.Type)
	}
	
	if len(incident.Actions) == 0 {
		t.Error("Should have taken actions")
	}
}

func TestImmunitySystem_Stats(t *testing.T) {
	is := NewImmunitySystem()
	
	stats := is.Stats()
	
	if stats["enabled"] != true {
		t.Error("Should show enabled")
	}
	
	if _, ok := stats["auto_healer"]; !ok {
		t.Error("Should have auto_healer stats")
	}
	
	if _, ok := stats["circuit_breakers"]; !ok {
		t.Error("Should have circuit_breakers stats")
	}
}

// ========================================
// TESTES DO ALERT ESCALATION
// ========================================

func TestAlertEscalator_CreateAlert(t *testing.T) {
	config := DefaultEscalationConfig()
	config.Level1To2Duration = 100 * time.Millisecond // Rápido para teste
	
	ae := NewAlertEscalator(config)
	defer ae.Stop()
	
	alert := ae.CreateAlert(
		"Test Alert",
		"This is a test",
		SeverityWarning,
		CategoryBusiness,
		"test",
		nil,
	)
	
	if alert == nil {
		t.Fatal("Alert should not be nil")
	}
	
	if alert.Title != "Test Alert" {
		t.Errorf("Expected title 'Test Alert', got '%s'", alert.Title)
	}
	
	if !alert.IsActive() {
		t.Error("Alert should be active")
	}
}

func TestAlertEscalator_DuplicateGrouping(t *testing.T) {
	ae := NewAlertEscalator(DefaultEscalationConfig())
	defer ae.Stop()
	
	// Criar mesmo alerta duas vezes
	alert1 := ae.CreateAlert("Duplicate", "Test", SeverityWarning, CategoryBusiness, "test", nil)
	alert2 := ae.CreateAlert("Duplicate", "Test", SeverityWarning, CategoryBusiness, "test", nil)
	
	// Devem ser o mesmo alerta
	if alert1.ID != alert2.ID {
		t.Error("Duplicate alerts should be grouped")
	}
	
	if alert1.OccurrenceCount != 2 {
		t.Errorf("Expected 2 occurrences, got %d", alert1.OccurrenceCount)
	}
}

func TestAlertEscalator_AcknowledgeResolve(t *testing.T) {
	ae := NewAlertEscalator(DefaultEscalationConfig())
	defer ae.Stop()
	
	alert := ae.CreateAlert("Test", "Test", SeverityWarning, CategoryBusiness, "test", nil)
	
	// Acknowledge
	if !ae.Acknowledge(alert.ID, "tester") {
		t.Error("Should acknowledge successfully")
	}
	
	if !alert.IsAcked() {
		t.Error("Alert should be acknowledged")
	}
	
	// Resolve
	if !ae.Resolve(alert.ID, "tester", "Fixed") {
		t.Error("Should resolve successfully")
	}
	
	if alert.IsActive() {
		t.Error("Alert should not be active after resolve")
	}
}

func TestAlertEscalator_CriticalStartLevel(t *testing.T) {
	config := DefaultEscalationConfig()
	config.CriticalStartLevel = AlertLevelTeam
	
	ae := NewAlertEscalator(config)
	defer ae.Stop()
	
	alert := ae.CreateAlert("Critical", "Test", SeverityCritical, CategorySecurity, "test", nil)
	
	if alert.CurrentLevel != AlertLevelTeam {
		t.Errorf("Critical alert should start at TEAM level, got %s", alert.CurrentLevel)
	}
}

// ========================================
// TESTES DO SELF DEFENSE
// ========================================

func TestSelfDefense_ReportThreat(t *testing.T) {
	sd := NewSelfDefense()
	
	action := sd.ReportThreat(ThreatIndicator{
		Type:       ThreatBruteForce,
		Source:     "192.168.1.1",
		Confidence: 0.9,
		Evidence:   map[string]interface{}{"attempts": 10},
		DetectedAt: time.Now(),
	})
	
	// Primeira ameaça não deve bloquear imediatamente
	if action == ActionBlock {
		t.Error("First threat should not block immediately")
	}
	
	// Score deve ter aumentado
	score := sd.GetThreatScore("192.168.1.1")
	if score <= 0 {
		t.Error("Threat score should have increased")
	}
}

func TestSelfDefense_ProgressiveBlocking(t *testing.T) {
	sd := NewSelfDefense()
	sd.SetThresholds(20, 50) // Thresholds baixos para teste
	
	// Reportar múltiplas ameaças
	for i := 0; i < 5; i++ {
		sd.ReportThreat(ThreatIndicator{
			Type:       ThreatBruteForce,
			Source:     "192.168.1.2",
			Confidence: 1.0,
			DetectedAt: time.Now(),
		})
	}
	
	// Deve estar bloqueado agora
	action := sd.CheckRequest("192.168.1.2", "/api/test", "")
	if action != ActionBlackhole && action != ActionBlock {
		t.Errorf("Should be blocked after multiple threats, got %s", action)
	}
}

func TestSelfDefense_Allowlist(t *testing.T) {
	sd := NewSelfDefense()
	
	sd.AddToAllowlist("10.0.0.1")
	
	// Mesmo com ameaça, deve permitir
	action := sd.ReportThreat(ThreatIndicator{
		Type:       ThreatDDoS,
		Source:     "10.0.0.1",
		Confidence: 1.0,
		DetectedAt: time.Now(),
	})
	
	if action != ActionAllow {
		t.Errorf("Allowlisted IP should always be allowed, got %s", action)
	}
}

func TestSelfDefense_Honeypot(t *testing.T) {
	sd := NewSelfDefense()
	
	sd.AddHoneypot("/admin/secret")
	
	action := sd.CheckRequest("192.168.1.3", "/admin/secret", "")
	
	if action != ActionDecoy {
		t.Errorf("Honeypot access should return decoy, got %s", action)
	}
}

func TestSelfDefense_RateLimit(t *testing.T) {
	sd := NewSelfDefense()
	
	key := "test:ratelimit"
	limit := int64(5)
	window := time.Second
	
	// Primeiras 5 devem passar
	for i := 0; i < 5; i++ {
		if !sd.RateLimit(key, limit, window) {
			t.Errorf("Request %d should be allowed", i+1)
		}
	}
	
	// 6ª deve ser bloqueada
	if sd.RateLimit(key, limit, window) {
		t.Error("6th request should be blocked")
	}
}

// ========================================
// TESTES DO AUTO HEALER
// ========================================

func TestAutoHealer_RegisterAndHeal(t *testing.T) {
	ah := NewAutoHealer()
	
	healed := false
	ah.RegisterHealer(HealKillZombie, func(target string, ctx map[string]interface{}) error {
		healed = true
		return nil
	})
	
	result := ah.Heal(HealKillZombie, "session-123", nil)
	
	if !result.Success {
		t.Error("Heal should succeed")
	}
	
	if !healed {
		t.Error("Healer function should have been called")
	}
}

func TestAutoHealer_Disabled(t *testing.T) {
	ah := NewAutoHealer()
	ah.Disable()
	
	result := ah.Heal(HealKillZombie, "test", nil)
	
	if result.Success {
		t.Error("Should not heal when disabled")
	}
	
	if result.Message != "Auto-healing disabled" {
		t.Errorf("Expected disabled message, got '%s'", result.Message)
	}
}

func TestAutoHealer_Stats(t *testing.T) {
	ah := NewAutoHealer()
	
	ah.RegisterHealer(HealRecalcMetrics, func(target string, ctx map[string]interface{}) error {
		return nil
	})
	
	ah.Heal(HealRecalcMetrics, "app-1", nil)
	ah.Heal(HealRecalcMetrics, "app-2", nil)
	
	stats := ah.GetStats()
	
	if stats.TotalAttempts != 2 {
		t.Errorf("Expected 2 attempts, got %d", stats.TotalAttempts)
	}
	
	if stats.SuccessfulHeals != 2 {
		t.Errorf("Expected 2 successful heals, got %d", stats.SuccessfulHeals)
	}
}

// ========================================
// TESTES DO CIRCUIT BREAKER
// ========================================

func TestCircuitBreaker_States(t *testing.T) {
	config := DefaultCircuitBreakerConfig("test")
	config.MaxFailures = 3
	config.ResetTimeout = 100 * time.Millisecond
	
	cb := NewCircuitBreaker(config)
	
	// Deve começar fechado
	if cb.State() != CircuitClosed {
		t.Errorf("Should start closed, got %s", cb.State())
	}
	
	// Registrar falhas
	for i := 0; i < 3; i++ {
		cb.Allow()
		cb.Failure()
	}
	
	// Deve estar aberto
	if cb.State() != CircuitOpen {
		t.Errorf("Should be open after failures, got %s", cb.State())
	}
	
	// Não deve permitir chamadas
	if cb.Allow() {
		t.Error("Should not allow calls when open")
	}
	
	// Esperar reset timeout
	time.Sleep(150 * time.Millisecond)
	
	// Deve permitir (half-open)
	if !cb.Allow() {
		t.Error("Should allow after reset timeout")
	}
	
	if cb.State() != CircuitHalfOpen {
		t.Errorf("Should be half-open, got %s", cb.State())
	}
}

func TestCircuitBreaker_Execute(t *testing.T) {
	cb := NewCircuitBreaker(DefaultCircuitBreakerConfig("test-exec"))
	
	// Execução com sucesso
	err := cb.Execute(func() error {
		return nil
	})
	
	if err != nil {
		t.Errorf("Should succeed, got %v", err)
	}
	
	stats := cb.Stats()
	if stats["total_successes"].(int64) != 1 {
		t.Error("Should have 1 success")
	}
}

// ========================================
// TESTES DO QUARANTINE
// ========================================

func TestQuarantine_Basic(t *testing.T) {
	qm := NewQuarantineManager()
	defer qm.Stop()
	
	entry := qm.Quarantine(
		TargetUser,
		"user-123",
		QuarantineSoft,
		ReasonSuspiciousActivity,
		map[string]interface{}{"reason": "test"},
		time.Hour,
	)
	
	if entry == nil {
		t.Fatal("Entry should not be nil")
	}
	
	if !qm.IsQuarantined(TargetUser, "user-123") {
		t.Error("User should be quarantined")
	}
	
	qType := qm.GetQuarantineType(TargetUser, "user-123")
	if qType != QuarantineSoft {
		t.Errorf("Expected soft quarantine, got %s", qType)
	}
}

func TestQuarantine_Release(t *testing.T) {
	qm := NewQuarantineManager()
	defer qm.Stop()
	
	qm.Quarantine(TargetIP, "192.168.1.1", QuarantineHard, ReasonSecurityThreat, nil, time.Hour)
	
	if !qm.Release(TargetIP, "192.168.1.1", "admin", "False positive") {
		t.Error("Should release successfully")
	}
	
	if qm.IsQuarantined(TargetIP, "192.168.1.1") {
		t.Error("Should not be quarantined after release")
	}
}

func TestQuarantine_AutoExpiry(t *testing.T) {
	qm := NewQuarantineManager()
	qm.cleanupInterval = 50 * time.Millisecond
	defer qm.Stop()
	
	// Quarentena curta
	qm.Quarantine(TargetSession, "sess-1", QuarantineSoft, ReasonAnomalyDetected, nil, 100*time.Millisecond)
	
	if !qm.IsQuarantined(TargetSession, "sess-1") {
		t.Error("Should be quarantined initially")
	}
	
	// Esperar expirar
	time.Sleep(200 * time.Millisecond)
	
	// Verificar que não está mais ativo
	entry := qm.GetEntry(TargetSession, "sess-1")
	if entry != nil && entry.IsActive() {
		t.Error("Should have expired")
	}
}

// ========================================
// TESTES DE INTEGRAÇÃO
// ========================================

func TestIntegration_ThreatToQuarantine(t *testing.T) {
	is := NewImmunitySystem()
	defer is.Stop()
	
	// Configurar thresholds baixos
	is.Defense().SetThresholds(10, 30)
	
	// Reportar múltiplas ameaças do mesmo IP
	for i := 0; i < 5; i++ {
		is.RespondToThreat(
			ThreatBruteForce,
			"attacker-ip",
			SeverityWarning,
			map[string]interface{}{"attempt": i},
		)
	}
	
	// Verificar que IP foi quarentenado
	if !is.Quarantine().IsQuarantined(TargetIP, "attacker-ip") {
		t.Error("Attacker IP should be quarantined after multiple threats")
	}
	
	// Verificar que alertas foram criados
	alerts := is.Escalator().GetActiveAlerts()
	if len(alerts) == 0 {
		t.Error("Should have created alerts")
	}
}

func TestIntegration_HealthDegradation(t *testing.T) {
	is := NewImmunitySystem()
	defer is.Stop()
	
	// Saúde inicial deve ser boa
	health1 := is.CheckHealth()
	if health1.Score < 90 {
		t.Errorf("Initial health should be high, got %.1f", health1.Score)
	}
	
	// Abrir alguns circuit breakers
	cb1 := is.GetCircuitBreaker("service-1")
	for i := 0; i < 5; i++ {
		cb1.Allow()
		cb1.Failure()
	}
	
	cb2 := is.GetCircuitBreaker("service-2")
	for i := 0; i < 5; i++ {
		cb2.Allow()
		cb2.Failure()
	}
	
	// Saúde deve ter degradado
	health2 := is.CheckHealth()
	if health2.Score >= health1.Score {
		t.Error("Health should have degraded with open circuits")
	}
	
	if health2.OpenCircuits != 2 {
		t.Errorf("Expected 2 open circuits, got %d", health2.OpenCircuits)
	}
}

// ========================================
// TESTES DE DETECÇÃO DE PADRÕES DE ATAQUE
// ========================================

func TestSelfDefense_DetectAttackPattern_BruteForce(t *testing.T) {
	sd := NewSelfDefense()
	
	// Criar logs de violação simulando brute force
	violations := make([]ViolationLog, 0)
	for i := 0; i < 15; i++ {
		violations = append(violations, ViolationLog{
			ID:        "v" + string(rune(i)),
			Type:      "auth_failure",
			Source:    "192.168.1.100",
			Endpoint:  "/api/v1/auth/login",
			Timestamp: time.Now(),
			Details: map[string]interface{}{
				"user_id": "user-123",
			},
		})
	}
	
	patterns := sd.DetectAttackPattern(violations)
	
	if len(patterns) == 0 {
		t.Fatal("Should detect brute force pattern")
	}
	
	found := false
	for _, p := range patterns {
		if p.Type == "brute_force" {
			found = true
			if p.Confidence < 0.5 {
				t.Errorf("Confidence should be higher, got %.2f", p.Confidence)
			}
			if len(p.Sources) == 0 {
				t.Error("Should have sources")
			}
		}
	}
	
	if !found {
		t.Error("Should have detected brute_force pattern")
	}
}

func TestSelfDefense_DetectAttackPattern_CredentialStuffing(t *testing.T) {
	sd := NewSelfDefense()
	
	// Criar logs simulando credential stuffing (mesmo IP, muitos usuários)
	violations := make([]ViolationLog, 0)
	for i := 0; i < 20; i++ {
		violations = append(violations, ViolationLog{
			ID:        "v" + string(rune(i)),
			Type:      "auth_failure",
			Source:    "10.0.0.1",
			Endpoint:  "/api/v1/auth/login",
			Timestamp: time.Now(),
			Details: map[string]interface{}{
				"email": "user" + string(rune(i)) + "@example.com",
			},
		})
	}
	
	patterns := sd.DetectAttackPattern(violations)
	
	found := false
	for _, p := range patterns {
		if p.Type == "credential_stuffing" {
			found = true
			if p.Severity != "high" {
				t.Errorf("Expected high severity, got %s", p.Severity)
			}
		}
	}
	
	if !found {
		t.Error("Should have detected credential_stuffing pattern")
	}
}

func TestSelfDefense_DetectAttackPattern_Scanning(t *testing.T) {
	sd := NewSelfDefense()
	
	// Criar logs simulando scanning (mesmo IP, muitos endpoints)
	violations := make([]ViolationLog, 0)
	endpoints := []string{
		"/api/v1/users", "/api/v1/admin", "/api/v1/billing",
		"/api/v1/secrets", "/api/v1/config", "/api/v1/debug",
		"/api/v1/internal", "/api/v1/metrics", "/api/v1/health",
		"/api/v1/status", "/api/v1/version", "/api/v1/info",
		"/api/v1/test", "/api/v1/backup", "/api/v1/export",
		"/api/v1/import", "/api/v1/sync", "/api/v1/webhook",
		"/api/v1/callback", "/api/v1/notify", "/api/v1/alert",
	}
	
	for _, endpoint := range endpoints {
		violations = append(violations, ViolationLog{
			ID:        "v-" + endpoint,
			Type:      "unauthorized",
			Source:    "scanner-ip",
			Endpoint:  endpoint,
			Timestamp: time.Now(),
		})
	}
	
	patterns := sd.DetectAttackPattern(violations)
	
	found := false
	for _, p := range patterns {
		if p.Type == "scanning" {
			found = true
		}
	}
	
	if !found {
		t.Error("Should have detected scanning pattern")
	}
}

// ========================================
// TESTES DE PROCESSAMENTO DE VIOLAÇÕES
// ========================================

func TestProcessViolation_Fatal(t *testing.T) {
	violation := InvariantViolation{
		ID:        "v-fatal-1",
		Invariant: "billing_balance_consistency",
		Message:   "Saldo inconsistente detectado",
		Severity:  "FATAL",
		Context:   map[string]interface{}{"expected": 1000, "actual": 500},
		Timestamp: time.Now(),
	}
	
	decision := ProcessViolation(violation)
	
	if !decision.ShouldEscalate {
		t.Error("FATAL violation should escalate")
	}
	
	if decision.TargetLevel != AlertLevelOnCall {
		t.Errorf("Expected ON_CALL level, got %s", decision.TargetLevel)
	}
	
	if decision.RecommendedAction != "PAGER_DUTY_INCIDENT" {
		t.Errorf("Expected PAGER_DUTY_INCIDENT, got %s", decision.RecommendedAction)
	}
	
	if decision.Alert == nil {
		t.Error("Should have created alert")
	}
}

func TestProcessViolation_Critical(t *testing.T) {
	violation := InvariantViolation{
		ID:        "v-critical-1",
		Invariant: "auth_token_integrity",
		Message:   "Token inválido detectado",
		Severity:  "CRITICAL",
		Timestamp: time.Now(),
	}
	
	decision := ProcessViolation(violation)
	
	if !decision.ShouldEscalate {
		t.Error("CRITICAL violation should escalate")
	}
	
	if decision.TargetLevel != AlertLevelTeam {
		t.Errorf("Expected TEAM level, got %s", decision.TargetLevel)
	}
}

func TestProcessViolation_Warning(t *testing.T) {
	violation := InvariantViolation{
		ID:        "v-warning-1",
		Invariant: "cache_consistency",
		Message:   "Cache desatualizado",
		Severity:  "WARNING",
		Timestamp: time.Now(),
	}
	
	decision := ProcessViolation(violation)
	
	// WARNING isolado não deve escalar
	if decision.ShouldEscalate {
		t.Error("Single WARNING should not escalate")
	}
	
	if decision.Alert == nil {
		t.Error("Should still create alert")
	}
}

func TestShouldCreatePagerDutyIncident(t *testing.T) {
	// FATAL sempre cria
	fatalViolation := InvariantViolation{
		Severity: "FATAL",
	}
	if !ShouldCreatePagerDutyIncident(fatalViolation) {
		t.Error("FATAL should create PagerDuty incident")
	}
	
	// Invariant crítico específico
	billingViolation := InvariantViolation{
		Invariant: "billing_balance_consistency",
		Severity:  "WARNING",
	}
	if !ShouldCreatePagerDutyIncident(billingViolation) {
		t.Error("billing_balance_consistency should create PagerDuty incident")
	}
	
	// WARNING normal não cria
	normalViolation := InvariantViolation{
		Invariant: "some_other_invariant",
		Severity:  "WARNING",
	}
	if ShouldCreatePagerDutyIncident(normalViolation) {
		t.Error("Normal WARNING should not create PagerDuty incident")
	}
}

// ========================================
// TESTES DE AUTO-HEALING AVANÇADO
// ========================================

func TestAccountBalanceRecalculator(t *testing.T) {
	// Simular transações
	transactions := []Transaction{
		{ID: "tx1", Amount: 1000, Type: "credit"},
		{ID: "tx2", Amount: -200, Type: "debit"},
		{ID: "tx3", Amount: -300, Type: "debit"},
		{ID: "tx4", Amount: 500, Type: "credit"},
	}
	
	var savedBalance int64
	
	recalc := &AccountBalanceRecalculator{
		GetTransactions: func(accountID string) ([]Transaction, error) {
			return transactions, nil
		},
		UpdateBalance: func(accountID string, newBalance int64) error {
			savedBalance = newBalance
			return nil
		},
		GetCurrentBalance: func(accountID string) (int64, error) {
			return 500, nil // Saldo incorreto
		},
	}
	
	err := recalc.RecalculateAccountBalance("account-123")
	if err != nil {
		t.Fatalf("Should not error: %v", err)
	}
	
	// Saldo correto: 1000 - 200 - 300 + 500 = 1000
	if savedBalance != 1000 {
		t.Errorf("Expected balance 1000, got %d", savedBalance)
	}
}

func TestSessionStateRebuilder(t *testing.T) {
	var savedSession map[string]interface{}
	
	rebuilder := &SessionStateRebuilder{
		GetSessionData: func(sessionID string) (map[string]interface{}, error) {
			return map[string]interface{}{
				"user_id": "user-123",
				"app_id":  "app-456",
				"metadata": map[string]interface{}{
					"device": "mobile",
				},
			}, nil
		},
		GetUserData: func(userID string) (map[string]interface{}, error) {
			return map[string]interface{}{
				"name":        "Test User",
				"permissions": []string{"read", "write"},
			}, nil
		},
		GetAppData: func(appID string) (map[string]interface{}, error) {
			return map[string]interface{}{
				"name": "Test App",
			}, nil
		},
		SaveSession: func(sessionID string, data map[string]interface{}) error {
			savedSession = data
			return nil
		},
	}
	
	err := rebuilder.RebuildSessionState("session-789")
	if err != nil {
		t.Fatalf("Should not error: %v", err)
	}
	
	if savedSession == nil {
		t.Fatal("Session should have been saved")
	}
	
	if savedSession["session_id"] != "session-789" {
		t.Error("Session ID should be preserved")
	}
	
	if savedSession["is_valid"] != true {
		t.Error("Session should be marked as valid")
	}
	
	if savedSession["user_id"] != "user-123" {
		t.Error("User ID should be preserved")
	}
}

func TestAutoHealer_WithAccountBalanceHealer(t *testing.T) {
	ah := NewAutoHealer()
	
	var recalculated bool
	
	ah.RegisterHealer(HealRecalcAccountBalance, func(target string, ctx map[string]interface{}) error {
		recalculated = true
		return nil
	})
	
	result := ah.Heal(HealRecalcAccountBalance, "account-123", nil)
	
	if !result.Success {
		t.Error("Should succeed")
	}
	
	if !recalculated {
		t.Error("Should have called recalculator")
	}
}

func TestAutoHealer_WithSessionRebuilder(t *testing.T) {
	ah := NewAutoHealer()
	
	var rebuilt bool
	
	ah.RegisterHealer(HealRebuildSessionState, func(target string, ctx map[string]interface{}) error {
		rebuilt = true
		return nil
	})
	
	result := ah.Heal(HealRebuildSessionState, "session-456", nil)
	
	if !result.Success {
		t.Error("Should succeed")
	}
	
	if !rebuilt {
		t.Error("Should have called rebuilder")
	}
}


// ========================================
// TESTES DAS INTEGRAÇÕES
// ========================================

func TestInvariantIntegration_HandleViolation(t *testing.T) {
	is := NewImmunitySystem()
	ii := NewInvariantIntegration(is)
	
	violation := InvariantViolation{
		ID:        "test-violation-1",
		Invariant: "billing_balance_consistency",
		Message:   "Saldo inconsistente detectado",
		Severity:  "CRITICAL",
		Context: map[string]interface{}{
			"expected": 100,
			"actual":   50,
		},
		Timestamp: time.Now(),
		AppID:     "app-123",
	}
	
	decision := ii.HandleViolation(violation)
	
	if decision == nil {
		t.Fatal("Decision should not be nil")
	}
	
	if !decision.ShouldEscalate {
		t.Error("CRITICAL violation should escalate")
	}
	
	if decision.TargetLevel != AlertLevelTeam {
		t.Errorf("Expected AlertLevelTeam, got %v", decision.TargetLevel)
	}
	
	// Verificar estatísticas
	stats := ii.Stats()
	if stats["total_violations"].(int64) != 1 {
		t.Error("Should have 1 violation")
	}
	if stats["escalated_count"].(int64) != 1 {
		t.Error("Should have 1 escalated")
	}
	
	is.Stop()
}

func TestInvariantIntegration_FatalViolation(t *testing.T) {
	is := NewImmunitySystem()
	ii := NewInvariantIntegration(is)
	
	violation := InvariantViolation{
		ID:        "test-violation-fatal",
		Invariant: "auth_token_integrity",
		Message:   "Token comprometido",
		Severity:  "FATAL",
		Timestamp: time.Now(),
		AppID:     "app-456",
	}
	
	decision := ii.HandleViolation(violation)
	
	if decision.TargetLevel != AlertLevelOnCall {
		t.Errorf("FATAL should escalate to ON_CALL, got %v", decision.TargetLevel)
	}
	
	if decision.RecommendedAction != "PAGER_DUTY_INCIDENT" {
		t.Errorf("Expected PAGER_DUTY_INCIDENT, got %s", decision.RecommendedAction)
	}
	
	// Verificar se app foi colocado em quarentena
	if !is.Quarantine().IsQuarantined(TargetApp, "app-456") {
		t.Error("App should be quarantined after FATAL violation")
	}
	
	is.Stop()
}

func TestTelemetryExporter_CollectMetrics(t *testing.T) {
	is := NewImmunitySystem()
	te := NewTelemetryExporter(is, time.Second)
	
	metrics := te.CollectMetrics()
	
	if metrics.HealthScore < 0 || metrics.HealthScore > 100 {
		t.Errorf("Health score should be 0-100, got %.1f", metrics.HealthScore)
	}
	
	if metrics.HealthStatus == "" {
		t.Error("Health status should not be empty")
	}
	
	if metrics.Timestamp.IsZero() {
		t.Error("Timestamp should not be zero")
	}
	
	is.Stop()
}

func TestTelemetryExporter_Callback(t *testing.T) {
	is := NewImmunitySystem()
	te := NewTelemetryExporter(is, 100*time.Millisecond)
	
	received := make(chan ImmunityMetrics, 1)
	te.SetOnMetrics(func(m ImmunityMetrics) {
		select {
		case received <- m:
		default:
		}
	})
	
	te.Start()
	defer te.Stop()
	
	select {
	case m := <-received:
		if m.HealthScore == 0 && m.HealthStatus == "" {
			t.Error("Should receive valid metrics")
		}
	case <-time.After(500 * time.Millisecond):
		t.Error("Should receive metrics within timeout")
	}
	
	is.Stop()
}

func TestAuditIntegration_RecordAction(t *testing.T) {
	is := NewImmunitySystem()
	ai := NewAuditIntegration(is)
	
	received := make(chan AuditAction, 1)
	ai.SetOnAudit(func(action AuditAction) {
		select {
		case received <- action:
		default:
		}
	})
	
	ai.RecordAction(AuditAction{
		Type:    "test",
		Actor:   "system",
		Target:  "test-target",
		Action:  "test_action",
		Result:  "success",
	})
	
	select {
	case action := <-received:
		if action.Type != "test" {
			t.Errorf("Expected type 'test', got '%s'", action.Type)
		}
		if action.Action != "test_action" {
			t.Errorf("Expected action 'test_action', got '%s'", action.Action)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Should receive audit action")
	}
	
	is.Stop()
}

func TestNotificationIntegration_SendNotification(t *testing.T) {
	is := NewImmunitySystem()
	ni := NewNotificationIntegration(is)
	
	received := make(chan ImmunityNotification, 1)
	ni.RegisterHandler("test", func(n ImmunityNotification) {
		select {
		case received <- n:
		default:
		}
	})
	
	ni.SendNotification(ImmunityNotification{
		Level:    NotifyWarning,
		Title:    "Test Alert",
		Message:  "This is a test",
		Channels: []string{"test"},
	})
	
	select {
	case n := <-received:
		if n.Title != "Test Alert" {
			t.Errorf("Expected title 'Test Alert', got '%s'", n.Title)
		}
		if n.Level != NotifyWarning {
			t.Errorf("Expected level NotifyWarning, got %v", n.Level)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Should receive notification")
	}
	
	is.Stop()
}

func TestKillSwitchIntegration_CheckAndTrigger(t *testing.T) {
	is := NewImmunitySystem()
	ki := NewKillSwitchIntegration(is)
	
	triggered := false
	ki.SetOnKillSwitch(func(reason string, ctx map[string]interface{}) {
		triggered = true
	})
	
	// Com sistema saudável, não deve acionar
	result := ki.CheckAndTrigger()
	if result {
		t.Error("Should not trigger with healthy system")
	}
	if triggered {
		t.Error("Callback should not be called")
	}
	
	is.Stop()
}

func TestIntegrationManager_Creation(t *testing.T) {
	is := NewImmunitySystem()
	im := NewIntegrationManager(is)
	
	if im.Invariants() == nil {
		t.Error("Invariants integration should not be nil")
	}
	if im.Telemetry() == nil {
		t.Error("Telemetry integration should not be nil")
	}
	if im.Audit() == nil {
		t.Error("Audit integration should not be nil")
	}
	if im.Notifications() == nil {
		t.Error("Notifications integration should not be nil")
	}
	if im.KillSwitch() == nil {
		t.Error("KillSwitch integration should not be nil")
	}
	
	is.Stop()
}

func TestGlobalHandleInvariantViolation(t *testing.T) {
	violation := InvariantViolation{
		ID:        "global-test",
		Invariant: "test_invariant",
		Message:   "Test violation",
		Severity:  "WARNING",
		Timestamp: time.Now(),
	}
	
	decision := HandleInvariantViolation(violation)
	
	if decision == nil {
		t.Fatal("Decision should not be nil")
	}
	
	// WARNING não deve escalar automaticamente
	if decision.ShouldEscalate {
		t.Error("WARNING should not escalate automatically")
	}
}


// ========================================
// TESTES DE DETECÇÃO DE ANOMALIAS
// ========================================

func TestAnomalyDetector_Creation(t *testing.T) {
	ad := NewAnomalyDetector()
	
	if ad == nil {
		t.Fatal("AnomalyDetector should not be nil")
	}
	
	if !ad.IsLearning() {
		t.Error("Should start in learning mode")
	}
}

func TestAnomalyDetector_RecordSample(t *testing.T) {
	ad := NewAnomalyDetector()
	ad.SetZScoreThreshold(2.0)
	
	// Registrar amostras normais durante aprendizado
	for i := 0; i < 50; i++ {
		ad.RecordSample(MetricSample{
			Name:      "test_metric",
			Value:     100 + float64(i%10), // 100-109
			Timestamp: time.Now(),
		})
	}
	
	// Forçar fim do aprendizado
	ad.mu.Lock()
	ad.inLearningMode = false
	ad.mu.Unlock()
	
	// Registrar valor anômalo
	anomaly := ad.RecordSample(MetricSample{
		Name:      "test_metric",
		Value:     500, // Muito acima do normal
		Timestamp: time.Now(),
	})
	
	if anomaly == nil {
		t.Error("Should detect anomaly for value 500")
	}
	
	if anomaly != nil && anomaly.Severity != "critical" && anomaly.Severity != "high" {
		t.Errorf("Expected high/critical severity, got %s", anomaly.Severity)
	}
}

func TestAnomalyDetector_Baseline(t *testing.T) {
	ad := NewAnomalyDetector()
	
	// Registrar amostras
	for i := 0; i < 100; i++ {
		ad.RecordSample(MetricSample{
			Name:      "cpu_usage",
			Value:     50 + float64(i%20), // 50-69
			Timestamp: time.Now(),
		})
	}
	
	baseline := ad.GetBaseline("cpu_usage")
	
	if baseline == nil {
		t.Fatal("Baseline should exist")
	}
	
	if baseline.Count != 100 {
		t.Errorf("Expected 100 samples, got %d", baseline.Count)
	}
	
	// Média deve estar em torno de 59.5
	if baseline.Mean < 55 || baseline.Mean > 65 {
		t.Errorf("Mean should be around 59.5, got %.2f", baseline.Mean)
	}
}

func TestAnomalyDetector_Callback(t *testing.T) {
	ad := NewAnomalyDetector()
	ad.SetZScoreThreshold(2.0)
	
	received := make(chan Anomaly, 1)
	ad.SetOnAnomaly(func(a Anomaly) {
		select {
		case received <- a:
		default:
		}
	})
	
	// Preencher baseline
	for i := 0; i < 50; i++ {
		ad.RecordSample(MetricSample{
			Name:  "callback_test",
			Value: 10,
		})
	}
	
	// Forçar fim do aprendizado
	ad.mu.Lock()
	ad.inLearningMode = false
	ad.mu.Unlock()
	
	// Registrar anomalia
	ad.RecordSample(MetricSample{
		Name:  "callback_test",
		Value: 1000,
	})
	
	select {
	case a := <-received:
		if a.Metric != "callback_test" {
			t.Errorf("Expected metric 'callback_test', got '%s'", a.Metric)
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Should receive anomaly callback")
	}
}

func TestAnomalyDetector_Stats(t *testing.T) {
	ad := NewAnomalyDetector()
	
	for i := 0; i < 10; i++ {
		ad.RecordSample(MetricSample{
			Name:  "stats_test",
			Value: float64(i),
		})
	}
	
	stats := ad.Stats()
	
	if stats["total_samples"].(int64) != 10 {
		t.Errorf("Expected 10 samples, got %v", stats["total_samples"])
	}
	
	if stats["metrics_tracked"].(int) != 1 {
		t.Errorf("Expected 1 metric tracked, got %v", stats["metrics_tracked"])
	}
}

func TestRateChangeDetector_Creation(t *testing.T) {
	rcd := NewRateChangeDetector()
	
	if rcd == nil {
		t.Fatal("RateChangeDetector should not be nil")
	}
}

func TestRateChangeDetector_DetectChange(t *testing.T) {
	rcd := NewRateChangeDetector()
	rcd.SetChangeThreshold(30.0) // 30% de mudança
	
	detected := false
	rcd.SetOnRateChange(func(metric string, oldRate, newRate, changePercent float64) {
		detected = true
	})
	
	// Registrar taxas estáveis (primeira metade)
	for i := 0; i < 5; i++ {
		rcd.RecordRate("requests_per_second", 100)
	}
	
	// Registrar mudança brusca (segunda metade)
	for i := 0; i < 5; i++ {
		result := rcd.RecordRate("requests_per_second", 200)
		if result {
			detected = true
		}
	}
	
	// Deve detectar mudança de ~100%
	if !detected {
		t.Error("Should detect rate change")
	}
}
