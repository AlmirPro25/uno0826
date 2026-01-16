package performance

import (
	"log"
	"os"
	"runtime"
	"runtime/debug"
	"strconv"
)

// OptimizeRuntime configures Go runtime for production
// "Go runtime bem configurado = menos GC pauses, mais throughput"
func OptimizeRuntime() {
	// ========================================
	// GOMAXPROCS - Número de CPUs
	// Oracle Free Tier: 1 OCPU = 2 threads
	// ========================================
	maxProcs := runtime.GOMAXPROCS(0) // Get current
	if v := os.Getenv("GOMAXPROCS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			maxProcs = n
		}
	}
	runtime.GOMAXPROCS(maxProcs)
	log.Printf("⚙️  GOMAXPROCS set to %d", maxProcs)
	
	// ========================================
	// GOGC - Garbage Collector Target
	// Default: 100 (GC quando heap dobra)
	// Para 1GB RAM: 50 (GC mais frequente, menos picos de memória)
	// ========================================
	gcPercent := 50 // Mais agressivo para baixa memória
	if v := os.Getenv("GOGC"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			gcPercent = n
		}
	}
	debug.SetGCPercent(gcPercent)
	log.Printf("⚙️  GOGC set to %d%%", gcPercent)
	
	// ========================================
	// GOMEMLIMIT - Limite de memória (Go 1.19+)
	// Para 1GB RAM VM: ~700MB para Go (deixar espaço para OS)
	// ========================================
	memLimit := int64(700 * 1024 * 1024) // 700MB default
	if v := os.Getenv("GOMEMLIMIT"); v != "" {
		if n, err := strconv.ParseInt(v, 10, 64); err == nil {
			memLimit = n
		}
	}
	debug.SetMemoryLimit(memLimit)
	log.Printf("⚙️  GOMEMLIMIT set to %d MB", memLimit/(1024*1024))
	
	// ========================================
	// Stack size - Reduzir para economizar memória
	// Default: 8KB por goroutine
	// ========================================
	// Note: Não há API para mudar isso em runtime, mas é bom documentar
	
	log.Println("✅ Go runtime otimizado para produção")
}

// GetRuntimeStats returns current runtime statistics
func GetRuntimeStats() map[string]interface{} {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	return map[string]interface{}{
		// Memory
		"alloc_mb":        m.Alloc / 1024 / 1024,
		"total_alloc_mb":  m.TotalAlloc / 1024 / 1024,
		"sys_mb":          m.Sys / 1024 / 1024,
		"heap_alloc_mb":   m.HeapAlloc / 1024 / 1024,
		"heap_sys_mb":     m.HeapSys / 1024 / 1024,
		"heap_idle_mb":    m.HeapIdle / 1024 / 1024,
		"heap_inuse_mb":   m.HeapInuse / 1024 / 1024,
		"heap_objects":    m.HeapObjects,
		"stack_inuse_mb":  m.StackInuse / 1024 / 1024,
		
		// GC
		"gc_cycles":       m.NumGC,
		"gc_pause_total_ms": m.PauseTotalNs / 1000000,
		"gc_cpu_fraction": m.GCCPUFraction,
		
		// Goroutines
		"goroutines":      runtime.NumGoroutine(),
		"gomaxprocs":      runtime.GOMAXPROCS(0),
		
		// Build info
		"go_version":      runtime.Version(),
		"num_cpu":         runtime.NumCPU(),
	}
}

// ForceGC triggers garbage collection
// "Útil antes de operações pesadas ou para debugging"
func ForceGC() {
	runtime.GC()
}

// FreeOSMemory returns memory to the OS
// "Útil após picos de uso de memória"
func FreeOSMemory() {
	debug.FreeOSMemory()
}

// ========================================
// MEMORY PRESSURE DETECTION
// ========================================

// MemoryPressure represents memory pressure levels
type MemoryPressure int

const (
	MemoryPressureNone     MemoryPressure = iota // < 50% heap
	MemoryPressureLow                            // 50-70% heap
	MemoryPressureMedium                         // 70-85% heap
	MemoryPressureHigh                           // 85-95% heap
	MemoryPressureCritical                       // > 95% heap
)

// GetMemoryPressure returns current memory pressure level
func GetMemoryPressure() MemoryPressure {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Calculate heap usage percentage
	if m.HeapSys == 0 {
		return MemoryPressureNone
	}
	
	usagePercent := float64(m.HeapAlloc) / float64(m.HeapSys) * 100
	
	switch {
	case usagePercent > 95:
		return MemoryPressureCritical
	case usagePercent > 85:
		return MemoryPressureHigh
	case usagePercent > 70:
		return MemoryPressureMedium
	case usagePercent > 50:
		return MemoryPressureLow
	default:
		return MemoryPressureNone
	}
}

// IsUnderMemoryPressure returns true if memory pressure is high or critical
func IsUnderMemoryPressure() bool {
	pressure := GetMemoryPressure()
	return pressure >= MemoryPressureHigh
}

// MemoryPressureMiddleware rejects requests under critical memory pressure
// "Melhor rejeitar do que crashar"
func MemoryPressureMiddleware() func(next func()) func() {
	return func(next func()) func() {
		return func() {
			if GetMemoryPressure() == MemoryPressureCritical {
				// Force GC and try again
				ForceGC()
				if GetMemoryPressure() == MemoryPressureCritical {
					log.Println("⚠️  Critical memory pressure - request rejected")
					return
				}
			}
			next()
		}
	}
}
