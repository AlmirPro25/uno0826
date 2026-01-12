package immunity

/*
================================================================================
SELF-DEFENSE — DEFESA ATIVA CONTRA ATAQUES
================================================================================

O sistema se defende ativamente contra:
1. Brute Force → Rate limit + bloqueio progressivo
2. DDoS → Detecção de padrão + bloqueio de IP
3. Injection → Sanitização + bloqueio
4. Credential Stuffing → Detecção de padrão + CAPTCHA
5. API Abuse → Throttling + quarentena

Estratégias:
- Honeypots: endpoints falsos que detectam atacantes
- Tarpit: resposta lenta para atacantes (desperdiça tempo deles)
- Decoy: dados falsos para confundir
- Blackhole: descarta silenciosamente

"A melhor defesa é fazer o atacante pensar que está ganhando"

================================================================================
*/

import (
	"log"
	"math"
	"sync"
	"time"
)

// ThreatType tipo de ameaça
type ThreatType string

const (
	ThreatBruteForce        ThreatType = "brute_force"
	ThreatDDoS              ThreatType = "ddos"
	ThreatInjection         ThreatType = "injection"
	ThreatCredentialStuffing ThreatType = "credential_stuffing"
	ThreatAPIAbuse          ThreatType = "api_abuse"
	ThreatScraping          ThreatType = "scraping"
	ThreatBotActivity       ThreatType = "bot_activity"
	ThreatSuspiciousPattern ThreatType = "suspicious_pattern"
)

// DefenseAction ação de defesa
type DefenseAction string

const (
	ActionAllow     DefenseAction = "allow"      // Permitir
	ActionChallenge DefenseAction = "challenge"  // Exigir CAPTCHA/2FA
	ActionThrottle  DefenseAction = "throttle"   // Limitar velocidade
	ActionTarpit    DefenseAction = "tarpit"     // Resposta lenta
	ActionBlock     DefenseAction = "block"      // Bloquear
	ActionBlackhole DefenseAction = "blackhole"  // Descartar silenciosamente
	ActionDecoy     DefenseAction = "decoy"      // Retornar dados falsos
)

// ThreatScore pontuação de ameaça
type ThreatScore struct {
	IP           string
	UserID       string
	Score        float64
	Factors      map[string]float64
	LastUpdated  time.Time
	ActionsTaken []DefenseAction
}

// ThreatIndicator indicador de ameaça
type ThreatIndicator struct {
	Type        ThreatType
	Source      string // IP, UserID, etc
	Confidence  float64
	Evidence    map[string]interface{}
	DetectedAt  time.Time
}

// RateLimitEntry entrada de rate limit
type RateLimitEntry struct {
	Key         string
	Count       int64
	WindowStart time.Time
	Blocked     bool
	BlockedAt   *time.Time
	BlockExpiry *time.Time
}

// SelfDefense sistema de defesa
type SelfDefense struct {
	mu              sync.RWMutex
	threatScores    map[string]*ThreatScore // key: ip ou user_id
	rateLimits      map[string]*RateLimitEntry
	honeypots       map[string]bool // endpoints honeypot
	blocklist       map[string]time.Time // IPs bloqueados
	allowlist       map[string]bool // IPs sempre permitidos
	
	// Configurações
	scoreThreshold  float64 // Score para começar a agir
	blockThreshold  float64 // Score para bloquear
	decayRate       float64 // Taxa de decaimento do score
	windowDuration  time.Duration
	
	// Callbacks
	onThreatDetected func(indicator ThreatIndicator)
	onActionTaken    func(source string, action DefenseAction, reason string)
}

// NewSelfDefense cria novo sistema de defesa
func NewSelfDefense() *SelfDefense {
	sd := &SelfDefense{
		threatScores:   make(map[string]*ThreatScore),
		rateLimits:     make(map[string]*RateLimitEntry),
		honeypots:      make(map[string]bool),
		blocklist:      make(map[string]time.Time),
		allowlist:      make(map[string]bool),
		scoreThreshold: 50.0,
		blockThreshold: 100.0,
		decayRate:      0.1, // 10% por minuto
		windowDuration: time.Minute,
	}
	
	// Iniciar decay loop
	go sd.decayLoop()
	
	return sd
}

// SetThresholds configura thresholds
func (sd *SelfDefense) SetThresholds(score, block float64) {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	sd.scoreThreshold = score
	sd.blockThreshold = block
}

// SetOnThreatDetected define callback para ameaça detectada
func (sd *SelfDefense) SetOnThreatDetected(fn func(ThreatIndicator)) {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	sd.onThreatDetected = fn
}

// SetOnActionTaken define callback para ação tomada
func (sd *SelfDefense) SetOnActionTaken(fn func(string, DefenseAction, string)) {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	sd.onActionTaken = fn
}

// AddHoneypot adiciona endpoint honeypot
func (sd *SelfDefense) AddHoneypot(endpoint string) {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	sd.honeypots[endpoint] = true
	log.Printf("🍯 [DEFENSE] Honeypot adicionado: %s", endpoint)
}

// AddToAllowlist adiciona IP à allowlist
func (sd *SelfDefense) AddToAllowlist(ip string) {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	sd.allowlist[ip] = true
}

// RemoveFromAllowlist remove IP da allowlist
func (sd *SelfDefense) RemoveFromAllowlist(ip string) {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	delete(sd.allowlist, ip)
}

// ReportThreat reporta uma ameaça detectada
func (sd *SelfDefense) ReportThreat(indicator ThreatIndicator) DefenseAction {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	
	// Verificar allowlist
	if sd.allowlist[indicator.Source] {
		return ActionAllow
	}
	
	// Verificar blocklist
	if expiry, blocked := sd.blocklist[indicator.Source]; blocked {
		if time.Now().Before(expiry) {
			return ActionBlackhole
		}
		delete(sd.blocklist, indicator.Source)
	}
	
	// Calcular incremento de score baseado no tipo de ameaça
	scoreIncrement := sd.calculateScoreIncrement(indicator)
	
	// Atualizar score
	score := sd.getOrCreateScore(indicator.Source)
	score.Score += scoreIncrement
	score.Factors[string(indicator.Type)] += scoreIncrement
	score.LastUpdated = time.Now()
	
	log.Printf("🛡️ [DEFENSE] Ameaça reportada: %s de %s (score: %.1f → %.1f)", 
		indicator.Type, indicator.Source, score.Score-scoreIncrement, score.Score)
	
	// Callback
	if sd.onThreatDetected != nil {
		go sd.onThreatDetected(indicator)
	}
	
	// Determinar ação
	action := sd.determineAction(score)
	score.ActionsTaken = append(score.ActionsTaken, action)
	
	// Executar ação
	sd.executeAction(indicator.Source, action, string(indicator.Type))
	
	return action
}

// calculateScoreIncrement calcula incremento de score
func (sd *SelfDefense) calculateScoreIncrement(indicator ThreatIndicator) float64 {
	baseScore := map[ThreatType]float64{
		ThreatBruteForce:         20.0,
		ThreatDDoS:               50.0,
		ThreatInjection:          40.0,
		ThreatCredentialStuffing: 30.0,
		ThreatAPIAbuse:           15.0,
		ThreatScraping:           10.0,
		ThreatBotActivity:        25.0,
		ThreatSuspiciousPattern:  10.0,
	}
	
	base := baseScore[indicator.Type]
	if base == 0 {
		base = 10.0
	}
	
	// Ajustar pela confiança
	return base * indicator.Confidence
}

// getOrCreateScore obtém ou cria score para uma fonte
func (sd *SelfDefense) getOrCreateScore(source string) *ThreatScore {
	if score, exists := sd.threatScores[source]; exists {
		return score
	}
	
	score := &ThreatScore{
		IP:          source,
		Score:       0,
		Factors:     make(map[string]float64),
		LastUpdated: time.Now(),
	}
	sd.threatScores[source] = score
	return score
}

// determineAction determina ação baseada no score
func (sd *SelfDefense) determineAction(score *ThreatScore) DefenseAction {
	if score.Score >= sd.blockThreshold {
		return ActionBlock
	}
	if score.Score >= sd.blockThreshold*0.8 {
		return ActionTarpit
	}
	if score.Score >= sd.scoreThreshold {
		return ActionThrottle
	}
	if score.Score >= sd.scoreThreshold*0.5 {
		return ActionChallenge
	}
	return ActionAllow
}

// executeAction executa ação de defesa
func (sd *SelfDefense) executeAction(source string, action DefenseAction, reason string) {
	switch action {
	case ActionBlock:
		// Bloquear por tempo progressivo
		blockDuration := sd.calculateBlockDuration(source)
		expiry := time.Now().Add(blockDuration)
		sd.blocklist[source] = expiry
		log.Printf("🚫 [DEFENSE] %s bloqueado por %v: %s", source, blockDuration, reason)
		
	case ActionTarpit:
		log.Printf("🐌 [DEFENSE] %s em tarpit: %s", source, reason)
		
	case ActionThrottle:
		log.Printf("⏱️ [DEFENSE] %s throttled: %s", source, reason)
		
	case ActionChallenge:
		log.Printf("🔐 [DEFENSE] %s requer challenge: %s", source, reason)
		
	case ActionBlackhole:
		log.Printf("🕳️ [DEFENSE] %s em blackhole: %s", source, reason)
	}
	
	if sd.onActionTaken != nil {
		go sd.onActionTaken(source, action, reason)
	}
}

// calculateBlockDuration calcula duração do bloqueio (progressivo)
func (sd *SelfDefense) calculateBlockDuration(source string) time.Duration {
	score := sd.threatScores[source]
	if score == nil {
		return 5 * time.Minute
	}
	
	// Bloqueio progressivo baseado no score
	// Score 100 = 5 min, Score 200 = 20 min, Score 300 = 1h, etc
	minutes := 5 * math.Pow(2, (score.Score-100)/50)
	if minutes > 1440 { // Max 24h
		minutes = 1440
	}
	
	return time.Duration(minutes) * time.Minute
}

// CheckRequest verifica se request deve ser permitido
func (sd *SelfDefense) CheckRequest(ip, endpoint, userID string) DefenseAction {
	sd.mu.Lock()
	
	// Verificar allowlist
	if sd.allowlist[ip] {
		sd.mu.Unlock()
		return ActionAllow
	}
	
	// Verificar blocklist
	if expiry, blocked := sd.blocklist[ip]; blocked {
		if time.Now().Before(expiry) {
			sd.mu.Unlock()
			return ActionBlackhole
		}
		delete(sd.blocklist, ip)
	}
	
	// Verificar honeypot
	isHoneypot := sd.honeypots[endpoint]
	sd.mu.Unlock()
	
	if isHoneypot {
		// Qualquer acesso a honeypot é suspeito - chamar sem lock
		sd.ReportThreat(ThreatIndicator{
			Type:       ThreatBotActivity,
			Source:     ip,
			Confidence: 1.0,
			Evidence: map[string]interface{}{
				"endpoint": endpoint,
				"user_id":  userID,
			},
			DetectedAt: time.Now(),
		})
		return ActionDecoy // Retornar dados falsos
	}
	
	// Verificar score atual
	sd.mu.RLock()
	defer sd.mu.RUnlock()
	if score, exists := sd.threatScores[ip]; exists {
		return sd.determineAction(score)
	}
	
	return ActionAllow
}

// RateLimit verifica rate limit
func (sd *SelfDefense) RateLimit(key string, limit int64, window time.Duration) bool {
	sd.mu.Lock()
	defer sd.mu.Unlock()
	
	now := time.Now()
	entry, exists := sd.rateLimits[key]
	
	if !exists || now.Sub(entry.WindowStart) > window {
		// Nova janela
		sd.rateLimits[key] = &RateLimitEntry{
			Key:         key,
			Count:       1,
			WindowStart: now,
		}
		return true // Permitido
	}
	
	entry.Count++
	
	if entry.Count > limit {
		// Limite excedido
		if !entry.Blocked {
			entry.Blocked = true
			blockedAt := now
			entry.BlockedAt = &blockedAt
			
			log.Printf("⚠️ [DEFENSE] Rate limit excedido: %s (%d/%d)", key, entry.Count, limit)
		}
		return false // Bloqueado
	}
	
	return true // Permitido
}

// GetThreatScore retorna score de ameaça
func (sd *SelfDefense) GetThreatScore(source string) float64 {
	sd.mu.RLock()
	defer sd.mu.RUnlock()
	
	if score, exists := sd.threatScores[source]; exists {
		return score.Score
	}
	return 0
}

// GetBlockedSources retorna fontes bloqueadas
func (sd *SelfDefense) GetBlockedSources() map[string]time.Time {
	sd.mu.RLock()
	defer sd.mu.RUnlock()
	
	result := make(map[string]time.Time)
	now := time.Now()
	
	for source, expiry := range sd.blocklist {
		if now.Before(expiry) {
			result[source] = expiry
		}
	}
	
	return result
}

// decayLoop reduz scores ao longo do tempo
func (sd *SelfDefense) decayLoop() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		sd.mu.Lock()
		
		for source, score := range sd.threatScores {
			// Aplicar decay
			score.Score *= (1 - sd.decayRate)
			
			// Remover se score muito baixo
			if score.Score < 1 {
				delete(sd.threatScores, source)
			}
		}
		
		sd.mu.Unlock()
	}
}

// Stats retorna estatísticas
func (sd *SelfDefense) Stats() map[string]interface{} {
	sd.mu.RLock()
	defer sd.mu.RUnlock()
	
	var totalScore float64
	var blocked, throttled, challenged int
	threatTypes := make(map[ThreatType]int)
	
	for _, score := range sd.threatScores {
		totalScore += score.Score
		
		for factor := range score.Factors {
			threatTypes[ThreatType(factor)]++
		}
		
		action := sd.determineAction(score)
		switch action {
		case ActionBlock, ActionBlackhole:
			blocked++
		case ActionThrottle, ActionTarpit:
			throttled++
		case ActionChallenge:
			challenged++
		}
	}
	
	return map[string]interface{}{
		"tracked_sources":  len(sd.threatScores),
		"blocked_sources":  len(sd.blocklist),
		"allowlisted":      len(sd.allowlist),
		"honeypots":        len(sd.honeypots),
		"total_threat_score": totalScore,
		"currently_blocked":  blocked,
		"currently_throttled": throttled,
		"currently_challenged": challenged,
		"threat_types":     threatTypes,
	}
}

// ========================================
// DETECTORES PRÉ-DEFINIDOS
// ========================================

// DetectBruteForce detecta tentativas de brute force
func (sd *SelfDefense) DetectBruteForce(ip, userID string, failedAttempts int, window time.Duration) bool {
	if failedAttempts >= 5 {
		sd.ReportThreat(ThreatIndicator{
			Type:       ThreatBruteForce,
			Source:     ip,
			Confidence: float64(failedAttempts) / 10.0,
			Evidence: map[string]interface{}{
				"user_id":         userID,
				"failed_attempts": failedAttempts,
				"window":          window.String(),
			},
			DetectedAt: time.Now(),
		})
		return true
	}
	return false
}

// DetectAPIAbuse detecta abuso de API
func (sd *SelfDefense) DetectAPIAbuse(ip string, requestsPerMinute int) bool {
	if requestsPerMinute >= 100 {
		confidence := math.Min(float64(requestsPerMinute)/200.0, 1.0)
		sd.ReportThreat(ThreatIndicator{
			Type:       ThreatAPIAbuse,
			Source:     ip,
			Confidence: confidence,
			Evidence: map[string]interface{}{
				"requests_per_minute": requestsPerMinute,
			},
			DetectedAt: time.Now(),
		})
		return true
	}
	return false
}

// DetectSuspiciousPattern detecta padrão suspeito
func (sd *SelfDefense) DetectSuspiciousPattern(ip string, pattern string, evidence map[string]interface{}) {
	sd.ReportThreat(ThreatIndicator{
		Type:       ThreatSuspiciousPattern,
		Source:     ip,
		Confidence: 0.7,
		Evidence:   evidence,
		DetectedAt: time.Now(),
	})
}

// ========================================
// DETECÇÃO DE PADRÕES DE ATAQUE
// ========================================

// AttackPattern representa um padrão de ataque detectado
type AttackPattern struct {
	Type        string                 `json:"type"`
	Confidence  float64                `json:"confidence"`
	Sources     []string               `json:"sources"`
	Indicators  []string               `json:"indicators"`
	Evidence    map[string]interface{} `json:"evidence"`
	DetectedAt  time.Time              `json:"detected_at"`
	Severity    string                 `json:"severity"` // low, medium, high, critical
	Recommended DefenseAction          `json:"recommended_action"`
}

// ViolationLog representa um log de violação para análise
type ViolationLog struct {
	ID          string                 `json:"id"`
	Type        string                 `json:"type"`
	Source      string                 `json:"source"` // IP ou UserID
	Endpoint    string                 `json:"endpoint"`
	UserAgent   string                 `json:"user_agent"`
	Timestamp   time.Time              `json:"timestamp"`
	Details     map[string]interface{} `json:"details"`
	Severity    string                 `json:"severity"`
}

// DetectAttackPattern analisa logs de violação e identifica padrões de ataque
func (sd *SelfDefense) DetectAttackPattern(violations []ViolationLog) []AttackPattern {
	if len(violations) == 0 {
		return nil
	}
	
	patterns := make([]AttackPattern, 0)
	
	// 1. Detectar Brute Force (muitas falhas do mesmo IP)
	if pattern := sd.detectBruteForcePattern(violations); pattern != nil {
		patterns = append(patterns, *pattern)
	}
	
	// 2. Detectar DDoS (muitas requisições em curto período)
	if pattern := sd.detectDDoSPattern(violations); pattern != nil {
		patterns = append(patterns, *pattern)
	}
	
	// 3. Detectar Credential Stuffing (muitos usuários diferentes do mesmo IP)
	if pattern := sd.detectCredentialStuffingPattern(violations); pattern != nil {
		patterns = append(patterns, *pattern)
	}
	
	// 4. Detectar Scanning/Enumeration (muitos endpoints diferentes)
	if pattern := sd.detectScanningPattern(violations); pattern != nil {
		patterns = append(patterns, *pattern)
	}
	
	// 5. Detectar Bot Activity (user agents suspeitos)
	if pattern := sd.detectBotPattern(violations); pattern != nil {
		patterns = append(patterns, *pattern)
	}
	
	// 6. Detectar Ataque Coordenado (múltiplos IPs, mesmo padrão)
	if pattern := sd.detectCoordinatedAttackPattern(violations); pattern != nil {
		patterns = append(patterns, *pattern)
	}
	
	return patterns
}

// detectBruteForcePattern detecta padrão de brute force
func (sd *SelfDefense) detectBruteForcePattern(violations []ViolationLog) *AttackPattern {
	// Agrupar por IP
	ipCounts := make(map[string]int)
	ipViolations := make(map[string][]ViolationLog)
	
	for _, v := range violations {
		if v.Type == "auth_failure" || v.Type == "login_failed" || v.Type == "invalid_credentials" {
			ipCounts[v.Source]++
			ipViolations[v.Source] = append(ipViolations[v.Source], v)
		}
	}
	
	// Encontrar IPs com muitas falhas
	var suspiciousIPs []string
	for ip, count := range ipCounts {
		if count >= 5 {
			suspiciousIPs = append(suspiciousIPs, ip)
		}
	}
	
	if len(suspiciousIPs) == 0 {
		return nil
	}
	
	// Calcular confiança baseada no número de tentativas
	maxCount := 0
	for _, count := range ipCounts {
		if count > maxCount {
			maxCount = count
		}
	}
	confidence := math.Min(float64(maxCount)/20.0, 1.0)
	
	severity := "medium"
	if maxCount >= 20 {
		severity = "high"
	}
	if maxCount >= 50 {
		severity = "critical"
	}
	
	return &AttackPattern{
		Type:       "brute_force",
		Confidence: confidence,
		Sources:    suspiciousIPs,
		Indicators: []string{
			"multiple_auth_failures",
			"same_source_repeated_attempts",
		},
		Evidence: map[string]interface{}{
			"max_attempts":    maxCount,
			"suspicious_ips":  len(suspiciousIPs),
			"total_failures":  len(violations),
		},
		DetectedAt:  time.Now(),
		Severity:    severity,
		Recommended: ActionBlock,
	}
}

// detectDDoSPattern detecta padrão de DDoS
func (sd *SelfDefense) detectDDoSPattern(violations []ViolationLog) *AttackPattern {
	if len(violations) < 100 {
		return nil
	}
	
	// Verificar janela de tempo
	var earliest, latest time.Time
	for i, v := range violations {
		if i == 0 || v.Timestamp.Before(earliest) {
			earliest = v.Timestamp
		}
		if i == 0 || v.Timestamp.After(latest) {
			latest = v.Timestamp
		}
	}
	
	duration := latest.Sub(earliest)
	if duration == 0 {
		duration = time.Second
	}
	
	requestsPerSecond := float64(len(violations)) / duration.Seconds()
	
	if requestsPerSecond < 10 {
		return nil
	}
	
	// Coletar IPs únicos
	uniqueIPs := make(map[string]bool)
	for _, v := range violations {
		uniqueIPs[v.Source] = true
	}
	
	sources := make([]string, 0, len(uniqueIPs))
	for ip := range uniqueIPs {
		sources = append(sources, ip)
	}
	
	confidence := math.Min(requestsPerSecond/100.0, 1.0)
	
	severity := "high"
	if requestsPerSecond >= 100 {
		severity = "critical"
	}
	
	return &AttackPattern{
		Type:       "ddos",
		Confidence: confidence,
		Sources:    sources,
		Indicators: []string{
			"high_request_rate",
			"multiple_sources",
			"short_time_window",
		},
		Evidence: map[string]interface{}{
			"requests_per_second": requestsPerSecond,
			"total_requests":      len(violations),
			"unique_sources":      len(uniqueIPs),
			"duration_seconds":    duration.Seconds(),
		},
		DetectedAt:  time.Now(),
		Severity:    severity,
		Recommended: ActionBlackhole,
	}
}

// detectCredentialStuffingPattern detecta credential stuffing
func (sd *SelfDefense) detectCredentialStuffingPattern(violations []ViolationLog) *AttackPattern {
	// Agrupar por IP e contar usuários únicos tentados
	ipUsers := make(map[string]map[string]bool)
	
	for _, v := range violations {
		if v.Type == "auth_failure" || v.Type == "login_failed" {
			if ipUsers[v.Source] == nil {
				ipUsers[v.Source] = make(map[string]bool)
			}
			if userID, ok := v.Details["user_id"].(string); ok {
				ipUsers[v.Source][userID] = true
			}
			if email, ok := v.Details["email"].(string); ok {
				ipUsers[v.Source][email] = true
			}
		}
	}
	
	// Encontrar IPs tentando muitos usuários diferentes
	var suspiciousIPs []string
	maxUsers := 0
	
	for ip, users := range ipUsers {
		if len(users) >= 10 {
			suspiciousIPs = append(suspiciousIPs, ip)
			if len(users) > maxUsers {
				maxUsers = len(users)
			}
		}
	}
	
	if len(suspiciousIPs) == 0 {
		return nil
	}
	
	confidence := math.Min(float64(maxUsers)/50.0, 1.0)
	
	return &AttackPattern{
		Type:       "credential_stuffing",
		Confidence: confidence,
		Sources:    suspiciousIPs,
		Indicators: []string{
			"multiple_users_same_ip",
			"rapid_user_enumeration",
		},
		Evidence: map[string]interface{}{
			"max_users_per_ip": maxUsers,
			"suspicious_ips":   len(suspiciousIPs),
		},
		DetectedAt:  time.Now(),
		Severity:    "high",
		Recommended: ActionBlock,
	}
}

// detectScanningPattern detecta scanning/enumeration
func (sd *SelfDefense) detectScanningPattern(violations []ViolationLog) *AttackPattern {
	// Agrupar por IP e contar endpoints únicos
	ipEndpoints := make(map[string]map[string]bool)
	
	for _, v := range violations {
		if ipEndpoints[v.Source] == nil {
			ipEndpoints[v.Source] = make(map[string]bool)
		}
		ipEndpoints[v.Source][v.Endpoint] = true
	}
	
	// Encontrar IPs acessando muitos endpoints diferentes
	var suspiciousIPs []string
	maxEndpoints := 0
	
	for ip, endpoints := range ipEndpoints {
		if len(endpoints) >= 20 {
			suspiciousIPs = append(suspiciousIPs, ip)
			if len(endpoints) > maxEndpoints {
				maxEndpoints = len(endpoints)
			}
		}
	}
	
	if len(suspiciousIPs) == 0 {
		return nil
	}
	
	confidence := math.Min(float64(maxEndpoints)/50.0, 1.0)
	
	return &AttackPattern{
		Type:       "scanning",
		Confidence: confidence,
		Sources:    suspiciousIPs,
		Indicators: []string{
			"endpoint_enumeration",
			"rapid_endpoint_access",
		},
		Evidence: map[string]interface{}{
			"max_endpoints_per_ip": maxEndpoints,
			"suspicious_ips":       len(suspiciousIPs),
		},
		DetectedAt:  time.Now(),
		Severity:    "medium",
		Recommended: ActionThrottle,
	}
}

// detectBotPattern detecta atividade de bot
func (sd *SelfDefense) detectBotPattern(violations []ViolationLog) *AttackPattern {
	suspiciousUserAgents := []string{
		"curl", "wget", "python", "go-http", "java", "bot", "spider", "crawler",
		"scraper", "httpclient", "libwww", "lwp", "mechanize",
	}
	
	botSources := make(map[string]bool)
	
	for _, v := range violations {
		ua := v.UserAgent
		for _, suspicious := range suspiciousUserAgents {
			if containsIgnoreCase(ua, suspicious) {
				botSources[v.Source] = true
				break
			}
		}
		// User agent vazio também é suspeito
		if ua == "" {
			botSources[v.Source] = true
		}
	}
	
	if len(botSources) == 0 {
		return nil
	}
	
	sources := make([]string, 0, len(botSources))
	for ip := range botSources {
		sources = append(sources, ip)
	}
	
	return &AttackPattern{
		Type:       "bot_activity",
		Confidence: 0.8,
		Sources:    sources,
		Indicators: []string{
			"suspicious_user_agent",
			"automated_behavior",
		},
		Evidence: map[string]interface{}{
			"bot_sources": len(botSources),
		},
		DetectedAt:  time.Now(),
		Severity:    "medium",
		Recommended: ActionChallenge,
	}
}

// detectCoordinatedAttackPattern detecta ataque coordenado
func (sd *SelfDefense) detectCoordinatedAttackPattern(violations []ViolationLog) *AttackPattern {
	if len(violations) < 50 {
		return nil
	}
	
	// Agrupar por endpoint e verificar se muitos IPs diferentes atacam o mesmo
	endpointSources := make(map[string]map[string]bool)
	
	for _, v := range violations {
		if endpointSources[v.Endpoint] == nil {
			endpointSources[v.Endpoint] = make(map[string]bool)
		}
		endpointSources[v.Endpoint][v.Source] = true
	}
	
	// Encontrar endpoints atacados por muitos IPs diferentes
	var targetedEndpoints []string
	maxSources := 0
	allSources := make(map[string]bool)
	
	for endpoint, sources := range endpointSources {
		if len(sources) >= 10 {
			targetedEndpoints = append(targetedEndpoints, endpoint)
			if len(sources) > maxSources {
				maxSources = len(sources)
			}
			for source := range sources {
				allSources[source] = true
			}
		}
	}
	
	if len(targetedEndpoints) == 0 {
		return nil
	}
	
	sources := make([]string, 0, len(allSources))
	for ip := range allSources {
		sources = append(sources, ip)
	}
	
	confidence := math.Min(float64(maxSources)/30.0, 1.0)
	
	return &AttackPattern{
		Type:       "coordinated_attack",
		Confidence: confidence,
		Sources:    sources,
		Indicators: []string{
			"multiple_sources_same_target",
			"synchronized_timing",
			"distributed_attack",
		},
		Evidence: map[string]interface{}{
			"targeted_endpoints": targetedEndpoints,
			"unique_sources":     len(allSources),
			"max_sources_per_endpoint": maxSources,
		},
		DetectedAt:  time.Now(),
		Severity:    "critical",
		Recommended: ActionBlackhole,
	}
}

// containsIgnoreCase verifica se string contém substring (case insensitive)
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) && 
		(s == substr || 
		 len(s) > 0 && len(substr) > 0 && 
		 (s[0] == substr[0] || s[0]+32 == substr[0] || s[0]-32 == substr[0]) && 
		 containsIgnoreCase(s[1:], substr[1:]) ||
		 len(s) > 0 && containsIgnoreCase(s[1:], substr))
}

// ProcessViolationsAndRespond processa violações e responde automaticamente
func (sd *SelfDefense) ProcessViolationsAndRespond(violations []ViolationLog) []AttackPattern {
	patterns := sd.DetectAttackPattern(violations)
	
	for _, pattern := range patterns {
		// Reportar ameaça para cada fonte
		for _, source := range pattern.Sources {
			sd.ReportThreat(ThreatIndicator{
				Type:       ThreatType(pattern.Type),
				Source:     source,
				Confidence: pattern.Confidence,
				Evidence:   pattern.Evidence,
				DetectedAt: pattern.DetectedAt,
			})
		}
		
		log.Printf("🎯 [DEFENSE] Padrão de ataque detectado: %s (confiança: %.0f%%, severidade: %s, fontes: %d)",
			pattern.Type, pattern.Confidence*100, pattern.Severity, len(pattern.Sources))
	}
	
	return patterns
}

// ========================================
// GLOBAL DEFENSE
// ========================================

var globalDefense = NewSelfDefense()

// CheckIP verifica IP globalmente
func CheckIP(ip, endpoint, userID string) DefenseAction {
	return globalDefense.CheckRequest(ip, endpoint, userID)
}

// ReportThreatGlobal reporta ameaça globalmente
func ReportThreatGlobal(indicator ThreatIndicator) DefenseAction {
	return globalDefense.ReportThreat(indicator)
}

// RateLimitGlobal aplica rate limit global
func RateLimitGlobal(key string, limit int64, window time.Duration) bool {
	return globalDefense.RateLimit(key, limit, window)
}

// GetDefenseStats retorna estatísticas globais
func GetDefenseStats() map[string]interface{} {
	return globalDefense.Stats()
}

// AddGlobalHoneypot adiciona honeypot global
func AddGlobalHoneypot(endpoint string) {
	globalDefense.AddHoneypot(endpoint)
}

// BlockIP bloqueia IP globalmente
func BlockIP(ip string, duration time.Duration) {
	globalDefense.mu.Lock()
	defer globalDefense.mu.Unlock()
	globalDefense.blocklist[ip] = time.Now().Add(duration)
	log.Printf("🚫 [DEFENSE] IP bloqueado manualmente: %s por %v", ip, duration)
}

// UnblockIP desbloqueia IP
func UnblockIP(ip string) {
	globalDefense.mu.Lock()
	defer globalDefense.mu.Unlock()
	delete(globalDefense.blocklist, ip)
	log.Printf("✅ [DEFENSE] IP desbloqueado: %s", ip)
}
