package localstore

import (
	"log"
	"sync"

	"gorm.io/gorm"
)

// ========================================
// GLOBAL PROVIDER - Singleton para LocalStore
// "Um store local, muitos consumidores"
// ========================================

var (
	globalStore     *LocalStore
	globalStoreMu   sync.RWMutex
	globalInitOnce  sync.Once
)

// InitGlobalStore inicializa o LocalStore global
// Deve ser chamado uma vez no main.go
func InitGlobalStore(localDB, remoteDB *gorm.DB, cfg Config) error {
	var initErr error
	
	globalInitOnce.Do(func() {
		store, err := New(localDB, remoteDB, cfg)
		if err != nil {
			initErr = err
			return
		}
		
		globalStoreMu.Lock()
		globalStore = store
		globalStoreMu.Unlock()
		
		// Iniciar sync worker
		store.Start()
		
		log.Println("✅ LocalStore global inicializado")
	})
	
	return initErr
}

// GetGlobalStore retorna o LocalStore global
// Retorna nil se não foi inicializado
func GetGlobalStore() *LocalStore {
	globalStoreMu.RLock()
	defer globalStoreMu.RUnlock()
	return globalStore
}

// StopGlobalStore para o sync worker do store global
// Deve ser chamado no shutdown do servidor
func StopGlobalStore() {
	globalStoreMu.RLock()
	store := globalStore
	globalStoreMu.RUnlock()
	
	if store != nil {
		store.Stop()
		log.Println("✅ LocalStore global parado")
	}
}

// ========================================
// ADAPTERS GLOBAIS - Acesso fácil
// ========================================

// GetTelemetryAdapter retorna adapter de telemetria do store global
func GetTelemetryAdapter() *TelemetryAdapter {
	store := GetGlobalStore()
	if store == nil {
		return nil
	}
	return NewTelemetryAdapter(store)
}

// GetAuditAdapter retorna adapter de auditoria do store global
func GetAuditAdapter() *AuditAdapter {
	store := GetGlobalStore()
	if store == nil {
		return nil
	}
	return NewAuditAdapter(store)
}

// GetRuleExecutionAdapter retorna adapter de execução de regras do store global
func GetRuleExecutionAdapter() *RuleExecutionAdapter {
	store := GetGlobalStore()
	if store == nil {
		return nil
	}
	return NewRuleExecutionAdapter(store)
}

// ========================================
// HELPER - Verificar se está habilitado
// ========================================

// IsEnabled retorna true se o LocalStore está inicializado
func IsEnabled() bool {
	return GetGlobalStore() != nil
}
