package immunity

/*
================================================================================
ANOMALY DETECTION — DETECÇÃO DE ANOMALIAS
================================================================================

Detecta comportamentos anômalos usando estatísticas simples:
1. Baseline Learning → Aprende padrões normais
2. Z-Score Detection → Detecta desvios significativos
3. Rate Change Detection → Detecta mudanças bruscas
4. Pattern Matching → Detecta padrões conhecidos de ataque

Métricas monitoradas:
- Requisições por segundo
- Taxa de erros
- Latência média
- Uso de recursos
- Padrões de acesso

================================================================================
*/

import (
	"log"
	"math"
	"sync"
	"time"
)

// AnomalyType tipo de anomalia
type AnomalyType string

const (
	AnomalyHighTraffic     AnomalyType = "high_traffic"
	AnomalyHighErrorRate   AnomalyType = "high_error_rate"
	AnomalyHighLatency     AnomalyType = "high_latency"
	AnomalyUnusualPattern  AnomalyType = "unusual_pattern"
	AnomalyResourceSpike   AnomalyType = "resource_spike"
	AnomalySuddenDrop      AnomalyType = "sudden_drop"
	AnomalyTimeAnomaly     AnomalyType = "time_anomaly"
)

// Anomaly representa uma anomalia detectada
type Anomaly struct {
	ID          string                 `json:"id"`
	Type        AnomalyType            `json:"type"`
	Metric      string                 `json:"metric"`
	Value       float64                `json:"value"`
	Expected    float64                `json:"expected"`
	Deviation   float64                `json:"deviation"` // Z-score
	Severity    string                 `json:"severity"`  // low, medium, high, critical
	Context     map[string]interface{} `json:"context"`
	DetectedAt  time.Time              `json:"detected_at"`
	Source      string                 `json:"source"`
}

// MetricSample amostra de métrica
type MetricSample struct {
	Name      string
	Value     float64
	Timestamp time.Time
	Tags      map[string]string
}

// MetricBaseline baseline de uma métrica
type MetricBaseline struct {
	Name       string
	Mean       float64
	StdDev     float64
	Min        float64
	Max        float64
	Count      int64
	LastUpdate time.Time
	Samples    []float64 // Últimas N amostras para cálculo
}

// AnomalyDetector detector de anomalias
type AnomalyDetector struct {
	mu sync.RWMutex
	
	// Baselines por métrica
	baselines map[string]*MetricBaseline
	
	// Configurações
	zScoreThreshold    float64 // Threshold para considerar anomalia
	minSamples         int     // Mínimo de amostras para baseline
	maxSamples         int     // Máximo de amostras mantidas
	learningPeriod     time.Duration
	
	// Estado
	inLearningMode     bool
	learningStartedAt  time.Time
	
	// Callbacks
	onAnomaly func(Anomaly)
	
	// Estatísticas
	totalSamples    int64
	totalAnomalies  int64
	anomaliesByType map[AnomalyType]int64
}

// NewAnomalyDetector cria novo detector
func NewAnomalyDetector() *AnomalyDetector {
	ad := &AnomalyDetector{
		baselines:         make(map[string]*MetricBaseline),
		zScoreThreshold:   3.0, // 3 desvios padrão
		minSamples:        30,
		maxSamples:        1000,
		learningPeriod:    5 * time.Minute,
		inLearningMode:    true,
		learningStartedAt: time.Now(),
		anomaliesByType:   make(map[AnomalyType]int64),
	}
	
	return ad
}

// SetZScoreThreshold configura threshold de z-score
func (ad *AnomalyDetector) SetZScoreThreshold(threshold float64) {
	ad.mu.Lock()
	defer ad.mu.Unlock()
	ad.zScoreThreshold = threshold
}

// SetOnAnomaly define callback para anomalias
func (ad *AnomalyDetector) SetOnAnomaly(fn func(Anomaly)) {
	ad.mu.Lock()
	defer ad.mu.Unlock()
	ad.onAnomaly = fn
}

// RecordSample registra uma amostra de métrica
func (ad *AnomalyDetector) RecordSample(sample MetricSample) *Anomaly {
	ad.mu.Lock()
	defer ad.mu.Unlock()
	
	ad.totalSamples++
	
	// Verificar se ainda está em modo de aprendizado
	if ad.inLearningMode {
		if time.Since(ad.learningStartedAt) > ad.learningPeriod {
			ad.inLearningMode = false
			log.Println("🧠 [ANOMALY] Período de aprendizado concluído")
		}
	}
	
	// Obter ou criar baseline
	baseline := ad.getOrCreateBaseline(sample.Name)
	
	// Adicionar amostra ao baseline
	ad.updateBaseline(baseline, sample.Value)
	
	// Se ainda em aprendizado, não detectar anomalias
	if ad.inLearningMode || baseline.Count < int64(ad.minSamples) {
		return nil
	}
	
	// Calcular z-score
	zScore := ad.calculateZScore(baseline, sample.Value)
	
	// Verificar se é anomalia
	if math.Abs(zScore) > ad.zScoreThreshold {
		anomaly := ad.createAnomaly(sample, baseline, zScore)
		ad.totalAnomalies++
		ad.anomaliesByType[anomaly.Type]++
		
		// Callback
		if ad.onAnomaly != nil {
			go ad.onAnomaly(anomaly)
		}
		
		return &anomaly
	}
	
	return nil
}

// getOrCreateBaseline obtém ou cria baseline
func (ad *AnomalyDetector) getOrCreateBaseline(name string) *MetricBaseline {
	if baseline, exists := ad.baselines[name]; exists {
		return baseline
	}
	
	baseline := &MetricBaseline{
		Name:    name,
		Samples: make([]float64, 0, ad.maxSamples),
	}
	ad.baselines[name] = baseline
	return baseline
}

// updateBaseline atualiza baseline com nova amostra
func (ad *AnomalyDetector) updateBaseline(baseline *MetricBaseline, value float64) {
	// Adicionar amostra
	baseline.Samples = append(baseline.Samples, value)
	baseline.Count++
	baseline.LastUpdate = time.Now()
	
	// Limitar tamanho
	if len(baseline.Samples) > ad.maxSamples {
		baseline.Samples = baseline.Samples[1:]
	}
	
	// Recalcular estatísticas
	ad.recalculateStats(baseline)
}

// recalculateStats recalcula estatísticas do baseline
func (ad *AnomalyDetector) recalculateStats(baseline *MetricBaseline) {
	n := len(baseline.Samples)
	if n == 0 {
		return
	}
	
	// Calcular média
	var sum float64
	baseline.Min = baseline.Samples[0]
	baseline.Max = baseline.Samples[0]
	
	for _, v := range baseline.Samples {
		sum += v
		if v < baseline.Min {
			baseline.Min = v
		}
		if v > baseline.Max {
			baseline.Max = v
		}
	}
	baseline.Mean = sum / float64(n)
	
	// Calcular desvio padrão
	var variance float64
	for _, v := range baseline.Samples {
		diff := v - baseline.Mean
		variance += diff * diff
	}
	baseline.StdDev = math.Sqrt(variance / float64(n))
}

// calculateZScore calcula z-score
func (ad *AnomalyDetector) calculateZScore(baseline *MetricBaseline, value float64) float64 {
	if baseline.StdDev == 0 {
		return 0
	}
	return (value - baseline.Mean) / baseline.StdDev
}

// createAnomaly cria anomalia
func (ad *AnomalyDetector) createAnomaly(sample MetricSample, baseline *MetricBaseline, zScore float64) Anomaly {
	anomalyType := ad.determineAnomalyType(sample, baseline, zScore)
	severity := ad.determineSeverity(zScore)
	
	return Anomaly{
		ID:         generateID(),
		Type:       anomalyType,
		Metric:     sample.Name,
		Value:      sample.Value,
		Expected:   baseline.Mean,
		Deviation:  zScore,
		Severity:   severity,
		Context: map[string]interface{}{
			"baseline_mean":   baseline.Mean,
			"baseline_stddev": baseline.StdDev,
			"baseline_min":    baseline.Min,
			"baseline_max":    baseline.Max,
			"sample_count":    baseline.Count,
			"tags":            sample.Tags,
		},
		DetectedAt: time.Now(),
		Source:     sample.Name,
	}
}

// determineAnomalyType determina tipo de anomalia
func (ad *AnomalyDetector) determineAnomalyType(sample MetricSample, baseline *MetricBaseline, zScore float64) AnomalyType {
	name := sample.Name
	
	// Baseado no nome da métrica
	switch {
	case contains(name, "request") || contains(name, "traffic") || contains(name, "rps"):
		if zScore > 0 {
			return AnomalyHighTraffic
		}
		return AnomalySuddenDrop
		
	case contains(name, "error") || contains(name, "failure"):
		return AnomalyHighErrorRate
		
	case contains(name, "latency") || contains(name, "duration") || contains(name, "response_time"):
		return AnomalyHighLatency
		
	case contains(name, "cpu") || contains(name, "memory") || contains(name, "disk"):
		return AnomalyResourceSpike
		
	default:
		return AnomalyUnusualPattern
	}
}

// determineSeverity determina severidade baseada no z-score
func (ad *AnomalyDetector) determineSeverity(zScore float64) string {
	absZ := math.Abs(zScore)
	
	switch {
	case absZ >= 5:
		return "critical"
	case absZ >= 4:
		return "high"
	case absZ >= 3.5:
		return "medium"
	default:
		return "low"
	}
}

// contains verifica se string contém substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || containsIgnoreCase(s, substr))
}

// generateID gera ID único
func generateID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(6)
}

// randomString gera string aleatória
func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
		time.Sleep(time.Nanosecond)
	}
	return string(b)
}

// GetBaseline retorna baseline de uma métrica
func (ad *AnomalyDetector) GetBaseline(name string) *MetricBaseline {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	return ad.baselines[name]
}

// GetAllBaselines retorna todos os baselines
func (ad *AnomalyDetector) GetAllBaselines() map[string]*MetricBaseline {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	
	result := make(map[string]*MetricBaseline)
	for k, v := range ad.baselines {
		result[k] = v
	}
	return result
}

// IsLearning verifica se está em modo de aprendizado
func (ad *AnomalyDetector) IsLearning() bool {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	return ad.inLearningMode
}

// ResetLearning reinicia período de aprendizado
func (ad *AnomalyDetector) ResetLearning() {
	ad.mu.Lock()
	defer ad.mu.Unlock()
	ad.inLearningMode = true
	ad.learningStartedAt = time.Now()
	ad.baselines = make(map[string]*MetricBaseline)
	log.Println("🧠 [ANOMALY] Aprendizado reiniciado")
}

// Stats retorna estatísticas
func (ad *AnomalyDetector) Stats() map[string]interface{} {
	ad.mu.RLock()
	defer ad.mu.RUnlock()
	
	return map[string]interface{}{
		"in_learning_mode":   ad.inLearningMode,
		"total_samples":      ad.totalSamples,
		"total_anomalies":    ad.totalAnomalies,
		"anomalies_by_type":  ad.anomaliesByType,
		"metrics_tracked":    len(ad.baselines),
		"z_score_threshold":  ad.zScoreThreshold,
		"min_samples":        ad.minSamples,
	}
}

// ========================================
// RATE CHANGE DETECTOR
// ========================================

// RateChangeDetector detecta mudanças bruscas em taxas
type RateChangeDetector struct {
	mu sync.RWMutex
	
	// Histórico de taxas por métrica
	history map[string][]ratePoint
	
	// Configurações
	windowSize      int           // Número de pontos para comparação
	changeThreshold float64       // % de mudança para considerar anomalia
	minPoints       int           // Mínimo de pontos para detectar
	
	// Callback
	onRateChange func(metric string, oldRate, newRate, changePercent float64)
}

type ratePoint struct {
	Value     float64
	Timestamp time.Time
}

// NewRateChangeDetector cria novo detector de mudança de taxa
func NewRateChangeDetector() *RateChangeDetector {
	return &RateChangeDetector{
		history:         make(map[string][]ratePoint),
		windowSize:      10,
		changeThreshold: 50.0, // 50% de mudança
		minPoints:       5,
	}
}

// SetChangeThreshold configura threshold de mudança
func (rcd *RateChangeDetector) SetChangeThreshold(threshold float64) {
	rcd.mu.Lock()
	defer rcd.mu.Unlock()
	rcd.changeThreshold = threshold
}

// SetOnRateChange define callback
func (rcd *RateChangeDetector) SetOnRateChange(fn func(string, float64, float64, float64)) {
	rcd.mu.Lock()
	defer rcd.mu.Unlock()
	rcd.onRateChange = fn
}

// RecordRate registra uma taxa
func (rcd *RateChangeDetector) RecordRate(metric string, rate float64) bool {
	rcd.mu.Lock()
	defer rcd.mu.Unlock()
	
	// Adicionar ponto
	if rcd.history[metric] == nil {
		rcd.history[metric] = make([]ratePoint, 0, rcd.windowSize*2)
	}
	
	rcd.history[metric] = append(rcd.history[metric], ratePoint{
		Value:     rate,
		Timestamp: time.Now(),
	})
	
	// Limitar tamanho
	if len(rcd.history[metric]) > rcd.windowSize*2 {
		rcd.history[metric] = rcd.history[metric][1:]
	}
	
	// Verificar se temos pontos suficientes
	if len(rcd.history[metric]) < rcd.minPoints {
		return false
	}
	
	// Calcular média das últimas N amostras vs anteriores
	points := rcd.history[metric]
	n := len(points)
	half := n / 2
	
	var oldSum, newSum float64
	for i := 0; i < half; i++ {
		oldSum += points[i].Value
	}
	for i := half; i < n; i++ {
		newSum += points[i].Value
	}
	
	oldAvg := oldSum / float64(half)
	newAvg := newSum / float64(n-half)
	
	if oldAvg == 0 {
		return false
	}
	
	changePercent := ((newAvg - oldAvg) / oldAvg) * 100
	
	if math.Abs(changePercent) >= rcd.changeThreshold {
		if rcd.onRateChange != nil {
			go rcd.onRateChange(metric, oldAvg, newAvg, changePercent)
		}
		return true
	}
	
	return false
}

// ========================================
// GLOBAL ANOMALY DETECTOR
// ========================================

var globalAnomalyDetector *AnomalyDetector
var anomalyDetectorOnce sync.Once

// GetAnomalyDetector retorna detector global
func GetAnomalyDetector() *AnomalyDetector {
	anomalyDetectorOnce.Do(func() {
		globalAnomalyDetector = NewAnomalyDetector()
		
		// Configurar integração com sistema imunológico
		globalAnomalyDetector.SetOnAnomaly(func(anomaly Anomaly) {
			// Criar alerta para anomalias significativas
			if anomaly.Severity == "high" || anomaly.Severity == "critical" {
				severity := SeverityWarning
				if anomaly.Severity == "critical" {
					severity = SeverityCritical
				}
				
				GetImmunitySystem().CreateAlert(
					"Anomalia Detectada: "+string(anomaly.Type),
					anomaly.Metric+" com desvio de "+formatFloat(anomaly.Deviation)+" sigma",
					severity,
					CategoryPerformance,
					"anomaly_detector",
					anomaly.Context,
				)
			}
			
			log.Printf("🔍 [ANOMALY] %s detectada em %s: valor=%.2f, esperado=%.2f, desvio=%.2f sigma",
				anomaly.Type, anomaly.Metric, anomaly.Value, anomaly.Expected, anomaly.Deviation)
		})
	})
	return globalAnomalyDetector
}

// formatFloat formata float para exibição
func formatFloat(f float64) string {
	if f >= 0 {
		return "+" + formatFloatAbs(f)
	}
	return formatFloatAbs(f)
}

func formatFloatAbs(f float64) string {
	return time.Duration(int64(math.Abs(f) * 100)).String()[:4]
}

// RecordMetric registra métrica globalmente
func RecordMetric(name string, value float64, tags map[string]string) *Anomaly {
	return GetAnomalyDetector().RecordSample(MetricSample{
		Name:      name,
		Value:     value,
		Timestamp: time.Now(),
		Tags:      tags,
	})
}

// GetAnomalyStats retorna estatísticas de anomalias
func GetAnomalyStats() map[string]interface{} {
	return GetAnomalyDetector().Stats()
}
