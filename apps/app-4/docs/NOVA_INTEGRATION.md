# 🏋️ Integração NOVA + SNDT + MediSync

## Visão Geral

O **NOVA** (Personal Trainer AI) e o **SNDT** (Sistema Nervoso Digital de Telemedicina) são sistemas originalmente standalone que foram integrados ao **MediSync Health Platform**.

### Aplicativos Integrados

| App | Descrição | Rota | Usuários |
|-----|-----------|------|----------|
| **NOVA** | Personal Trainer com IA, Gemini Live, Bluetooth | `/nova` | Pacientes |
| **SNDT** | Orquestrador clínico com match de médicos e copiloto IA | `/sndt` | Médicos |

### Localização dos Apps Originais

Os aplicativos originais (Vite/React) estão em:
- `frontend/nova---personal-trainer-ai (13)/` - NOVA completo
- `frontend/sistema-nervoso-clínico---orquestrador (3)/` - SNDT completo

As versões integradas ao Next.js estão em:
- `frontend/src/pages/nova/index.tsx` - NOVA adaptado
- `frontend/src/pages/sndt/index.tsx` - SNDT adaptado

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO DE DADOS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐         ┌─────────────┐         ┌──────────┐ │
│   │    NOVA     │ ──────► │  MediSync   │ ──────► │  Health  │ │
│   │ (Frontend)  │  Sync   │   Backend   │  Feed   │  Profile │ │
│   └─────────────┘         └─────────────┘         └──────────┘ │
│         │                       │                       │       │
│         │                       │                       │       │
│   ┌─────▼─────┐           ┌─────▼─────┐           ┌─────▼─────┐│
│   │ Treinos   │           │ Fitness   │           │ Médico    ││
│   │ Nutrição  │           │ Database  │           │ Visualiza ││
│   │ Análises  │           │ Tables    │           │ Dados     ││
│   └───────────┘           └───────────┘           └───────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Arquitetura da Integração

### Backend (Go)

#### Novos Modelos (`backend/internal/core/domain/fitness.go`)

| Modelo | Descrição |
|--------|-----------|
| `FitnessProfile` | Perfil fitness do usuário (objetivo, nível, XP, streaks) |
| `WorkoutSession` | Sessão de treino com dados de HR, distância, calorias |
| `DailyFitnessStats` | Estatísticas diárias agregadas |
| `NutritionLog` | Registro de refeições com macros |
| `BodyAnalysis` | Análises de composição corporal |
| `WeeklyFitnessPlan` | Plano semanal gerado por IA |
| `FitnessAchievement` | Conquistas e gamificação |
| `HeartRateReading` | Leituras de frequência cardíaca |

#### Serviço (`backend/internal/services/fitness_service.go`)

```go
// Principais funções
SyncFromNOVA()           // Sincroniza dados do app NOVA
CreateWorkoutSession()   // Registra treino
UpsertDailyStats()       // Atualiza stats diários
GetFitnessSummary()      // Resumo completo
RecordHeartRate()        // Registra HR do Bluetooth
```

#### Endpoints (`/fitness/*`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/fitness/profile` | Perfil fitness |
| PUT | `/fitness/profile` | Atualizar perfil |
| GET | `/fitness/summary` | Resumo completo |
| POST | `/fitness/sync` | Sincronizar do NOVA |
| GET | `/fitness/stats` | Stats diários |
| POST | `/fitness/workouts` | Registrar treino |
| GET | `/fitness/workouts` | Histórico treinos |
| POST | `/fitness/nutrition` | Registrar refeição |
| GET | `/fitness/nutrition` | Histórico nutrição |
| POST | `/fitness/heart-rate` | Registrar HR |
| GET | `/fitness/plan` | Plano ativo |
| POST | `/fitness/plan` | Salvar plano |

### Frontend (Next.js)

#### API Client (`frontend/src/api/fitness.ts`)

```typescript
// Funções disponíveis
getFitnessSummary()      // Resumo completo
syncFromNOVA()           // Sincronizar dados
getWorkoutSessions()     // Histórico treinos
createWorkoutSession()   // Registrar treino
getNutritionLogs()       // Histórico nutrição
recordHeartRate()        // Registrar HR
getActivePlan()          // Plano semanal
```

#### Serviço de Sincronização (`frontend/src/services/novaSyncService.ts`)

```typescript
// Sincronização automática
syncToMediSync()         // Sincroniza tudo
autoSync()               // Sync se necessário (>1h)
logWorkoutAndSync()      // Registra treino + sync
logHeartRate()           // Registra HR
```

#### Página Fitness (`frontend/src/pages/paciente/fitness.tsx`)

Dashboard completo com:
- Cards de estatísticas (calorias, treinos, streak, nível)
- Gráfico de progresso semanal
- Histórico de treinos
- Registro nutricional
- Plano semanal
- Botão para abrir NOVA

## Fluxo de Dados

### 1. Usuário treina no NOVA

```
NOVA App
    │
    ├── Treino ao vivo com coaching
    ├── Análise de alimentos por foto
    ├── Dados de HR via Bluetooth
    │
    ▼
localStorage (NOVA_SYSTEM_STATE_V1)
```

### 2. Sincronização com MediSync

```
novaSyncService.syncToMediSync()
    │
    ├── Carrega estado do localStorage
    ├── Converte para formato MediSync
    ├── POST /fitness/sync
    │
    ▼
Backend processa e salva
    │
    ├── Atualiza FitnessProfile
    ├── Cria WorkoutSessions
    ├── Cria NutritionLogs
    ├── Atualiza DailyFitnessStats
    │
    ▼
Sincroniza com HealthProfile
    │
    ├── Atualiza peso/altura
    ├── Atualiza nível de exercício
    ├── Alimenta DailyCheckIn
    │
    ▼
Médico pode visualizar dados
```

### 3. Médico visualiza dados fitness

```
Prontuário do Paciente
    │
    ├── Seção "Fitness & Bem-estar"
    │   ├── Nível de atividade
    │   ├── Frequência de treinos
    │   ├── Média de HR
    │   └── Tendências
    │
    └── Insights para diagnóstico
```

## Integração com Health Intelligence Core

O FitnessService sincroniza automaticamente com o HealthIntelligenceService:

```go
// fitness_service.go
func (s *FitnessService) syncToHealthProfile(ctx context.Context, userID uint, novaProfile *NOVAProfile) {
    healthProfile, _ := s.healthIntelligence.GetOrCreateProfile(ctx, userID)
    
    // Atualiza dados antropométricos
    healthProfile.HeightCm = novaProfile.HeightCm
    healthProfile.WeightKg = novaProfile.WeightKg
    
    // Mapeia nível de exercício
    if novaProfile.Level >= 5 {
        healthProfile.ExerciseLevel = "very_active"
    } else if novaProfile.Level >= 3 {
        healthProfile.ExerciseLevel = "active"
    }
    
    s.healthIntelligence.UpdateProfile(ctx, healthProfile)
}
```

## Dados Sincronizados

### Do NOVA para MediSync

| NOVA | MediSync |
|------|----------|
| `userProfile.weight` | `FitnessProfile.weight_kg` + `HealthProfile.weight_kg` |
| `userProfile.height` | `FitnessProfile.height_cm` + `HealthProfile.height_cm` |
| `userProfile.level` | `FitnessProfile.level` + `HealthProfile.exercise_level` |
| `stats[].caloriesBurned` | `DailyFitnessStats.calories_burned` |
| `stats[].workoutDurationMinutes` | `DailyFitnessStats.workout_duration_minutes` |
| `history[type=food]` | `NutritionLog` |
| `history[type=body]` | `BodyAnalysis` |
| `activePlan` | `WeeklyFitnessPlan` |
| `heartRate` (Bluetooth) | `HeartRateReading` + `DailyCheckIn.heart_rate` |

## Como Usar

### Para o Paciente

1. Acesse **Fitness & NOVA** no menu
2. Veja seu dashboard de fitness
3. Clique em **Abrir NOVA** para treinar
4. Dados são sincronizados automaticamente

### Para o Desenvolvedor

```typescript
// Sincronizar manualmente
import { syncToMediSync } from '@/services/novaSyncService';
await syncToMediSync();

// Registrar treino
import { logWorkoutAndSync } from '@/services/novaSyncService';
await logWorkoutAndSync({
  durationMinutes: 45,
  caloriesBurned: 350,
  type: 'strength',
  focus: 'Upper Body',
  intensity: 'moderate',
  heartRate: { avg: 135, max: 165, min: 95 }
});

// Registrar HR em tempo real
import { logHeartRate } from '@/services/novaSyncService';
await logHeartRate(142);
```

### Para o Médico

Os dados de fitness aparecem automaticamente no prontuário do paciente, permitindo:
- Ver nível de atividade física
- Monitorar frequência cardíaca durante exercícios
- Identificar padrões de comportamento
- Correlacionar com condições de saúde

## Benefícios da Integração

1. **Visão Holística**: Médico vê dados de saúde + fitness juntos
2. **Prevenção**: Identificar riscos baseado em atividade física
3. **Engajamento**: Gamificação motiva pacientes
4. **Dados Reais**: HR de dispositivos Bluetooth, não estimativas
5. **IA Integrada**: Análises do NOVA alimentam Health Intelligence

## Próximos Passos

- [ ] Integrar dados de sono do NOVA
- [ ] Alertas para médico quando HR anormal
- [ ] Metas de fitness prescritas pelo médico
- [ ] Integração com wearables (Apple Watch, Fitbit)
- [ ] Relatórios de progresso para consultas
