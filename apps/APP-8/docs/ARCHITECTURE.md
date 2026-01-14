# 🏗️ Arquitetura do Sistema de Inteligência

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  (React Components: App, UnifiedInterface, ThinkingMode)    │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Personality  │   │   Memory     │   │  Proactive   │
│   Service    │   │   Service    │   │   Service    │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │    Gemini    │
                    │   Service    │
                    └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Google AI   │
                    │   (Gemini)   │
                    └──────────────┘
```

---

## 📦 Estrutura de Módulos

### Services Layer

#### 1. personalityService.ts
**Responsabilidade:** Gerenciar personalidade e tom da IA

**Principais Classes/Funções:**
```typescript
class PersonalityService {
  - generateSystemInstruction(): string
  - analyzeContextAndAdapt(): PersonalityType
  - recordInteraction(): void
  - learnFromFeedback(): void
  - generateProactiveSuggestions(): string[]
}
```

**Fluxo de Dados:**
```
User Config → PersonalityService → System Instruction → Gemini
                    ↓
              localStorage
```

**Padrões Utilizados:**
- Strategy Pattern (múltiplas personalidades)
- Singleton (instância única)

---

#### 2. memoryService.ts
**Responsabilidade:** Gerenciar memória de longo prazo

**Principais Classes/Funções:**
```typescript
class MemoryService {
  - addMemory(): Promise<string>
  - searchMemories(): Promise<MemoryEntry[]>
  - getContextForAI(): Promise<string>
  - extractAndStoreFactsFromConversation(): Promise<void>
  - generateEmbedding(): Promise<number[]>
  - cosineSimilarity(): number
}
```

**Estrutura de Dados:**
```typescript
interface MemoryEntry {
  id: string;
  timestamp: string;
  content: string;
  type: 'conversation' | 'fact' | 'preference' | 'skill' | 'context';
  importance: number; // 1-10
  embedding?: number[];
  tags: string[];
  relatedTo?: string[];
}
```

**Algoritmo de Busca:**
```
1. Gera embedding da query
2. Calcula similaridade de cosseno com todas as memórias
3. Aplica boost por recência e importância
4. Retorna top N resultados ordenados
```

**Padrões Utilizados:**
- Repository Pattern
- Singleton

---

#### 3. proactiveService.ts
**Responsabilidade:** Análise proativa da tela

**Principais Classes/Funções:**
```typescript
class ProactiveService {
  - analyzeScreenFrame(): Promise<ScreenAnalysis>
  - quickPatternAnalysis(): ScreenAnalysis
  - deepAIAnalysis(): Promise<ScreenAnalysis>
  - analyzeCodeQuality(): Promise<ProactiveSuggestion[]>
  - detectAutomationOpportunities(): ProactiveSuggestion[]
}
```

**Fluxo de Análise:**
```
Screen Frame → Quick Pattern Check → Deep AI Analysis (if needed)
                                            ↓
                                    Suggestions Queue
                                            ↓
                                    ProactiveSuggestions Component
```

**Padrões Utilizados:**
- Observer Pattern
- Strategy Pattern (análise rápida vs profunda)

---

#### 4. geminiService.ts
**Responsabilidade:** Interface com API do Gemini

**Principais Funções:**
```typescript
{
  analyzeImageAndText(): Promise<string>
  performDeepThought(): Promise<string>
  generateSpeech(): Promise<string>
  summarizeText(): Promise<string>
  extractFacts(): Promise<Fact[]>
  generateWithPersonality(): Promise<string>
}
```

**Modelos Utilizados:**
- `gemini-2.5-flash-native-audio-preview`: Live sessions
- `gemini-2.5-pro`: Deep thinking
- `gemini-2.5-flash-preview-tts`: Text-to-speech
- `gemini-2.5-flash`: Rápido para resumos

---

### Components Layer

#### 1. PersonalitySettings.tsx
**Props:**
```typescript
interface PersonalitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Estado:**
```typescript
const [config, setConfig] = useState<PersonalityConfig>()
```

**Integração:**
```
User Input → Component State → personalityService.saveConfig()
                                        ↓
                                  localStorage
```

---

#### 2. MemoryPanel.tsx
**Props:**
```typescript
interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Funcionalidades:**
- Busca de memórias
- Visualização de estatísticas
- Exportar/Importar
- Limpeza seletiva

---

#### 3. ProactiveSuggestions.tsx
**Comportamento:**
```
1. Poll a cada 5s por novas sugestões
2. Exibe card flutuante
3. Permite ação ou descarte
4. Auto-descarta após 1h
```

**Priorização Visual:**
```typescript
const getPriorityColor = (priority: string) => {
  critical: 'border-red-500'
  high: 'border-orange-500'
  medium: 'border-yellow-500'
  low: 'border-blue-500'
}
```

---

## 🔄 Fluxos de Dados Principais

### Fluxo 1: Inicialização de Sessão

```
1. User clicks "Start Session"
2. App.tsx → UnifiedInterface
3. UnifiedInterface:
   a. memoryService.getContextForAI()
   b. personalityService.generateSystemInstruction()
   c. databaseService.getLatestSummary()
4. Combina tudo em systemInstruction
5. Inicia conexão com Gemini
6. memoryService.analyzeWorkPatterns()
```

### Fluxo 2: Processamento de Mensagem

```
1. User fala → Microfone → PCM Audio
2. Gemini processa → Retorna transcrição + resposta
3. UnifiedInterface:
   a. databaseService.addMessage()
   b. memoryService.addToShortTerm()
   c. personalityService.recordInteraction()
4. Exibe na UI
```

### Fluxo 3: Análise Proativa

```
1. Timer (30s) → Captura frame
2. proactiveService.analyzeScreenFrame()
   a. quickPatternAnalysis() (sempre)
   b. deepAIAnalysis() (se necessário)
3. Gera sugestões
4. proactiveService.addSuggestion()
5. ProactiveSuggestions component exibe
```

### Fluxo 4: Thinking Mode

```
1. User abre ThinkingMode
2. Digita prompt
3. ThinkingMode:
   a. memoryService.getContextForAI(prompt)
   b. personalityService.generateSystemInstruction()
4. geminiService.generateWithPersonality()
5. Exibe resultado formatado
6. Registra interação
```

---

## 💾 Persistência de Dados

### localStorage Structure

```javascript
{
  // Personalidade
  'personality-config': JSON.stringify(PersonalityConfig),
  'interaction-history': JSON.stringify(Interaction[]),
  
  // Memória
  'long-term-memories': JSON.stringify(Map<string, MemoryEntry>),
  'user-profile': JSON.stringify(UserProfile),
  
  // Database
  'gemini-companion-db': base64(SQLite),
  
  // Proativo
  'proactive-enabled': 'true' | 'false'
}
```

### Limites e Gestão

**Limites:**
- localStorage: ~5-10 MB (varia por navegador)
- Memórias: Máximo 500 (configurável)
- Histórico de interações: Últimas 50

**Estratégias de Limpeza:**
1. Poda automática por importância
2. Boost de recência
3. Compressão de dados antigos
4. Exportação periódica

---

## 🧮 Algoritmos Principais

### 1. Busca Semântica (Similaridade de Cosseno)

```typescript
cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}
```

**Complexidade:** O(n) onde n = dimensão do embedding (128)

---

### 2. Geração de Embeddings (Simplificado)

```typescript
generateEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(128).fill(0);
  
  words.forEach((word, idx) => {
    const hash = simpleHash(word);
    embedding[hash % 128] += 1;
  });

  // Normalização
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );
  
  return embedding.map(val => val / (magnitude || 1));
}
```

**Nota:** Em produção, usar Gemini Embedding API

---

### 3. Detecção de Contexto

```typescript
analyzeContextAndAdapt(userMessage: string, screenContext?: string): PersonalityType {
  const message = userMessage.toLowerCase();
  const context = screenContext?.toLowerCase() || '';

  // Padrões técnicos
  if (message.match(/\b(código|code|bug|erro)\b/) ||
      context.match(/\b(vscode|terminal)\b/)) {
    return PersonalityType.TECHNICAL;
  }

  // Padrões de aprendizado
  if (message.match(/\b(como|explica|ensina)\b/)) {
    return PersonalityType.TUTOR;
  }

  // ... mais padrões
  
  return PersonalityType.FRIENDLY; // default
}
```

---

### 4. Priorização de Sugestões

```typescript
finalScore = similarity * (1 + recencyBoost + importanceBoost)

recencyBoost = {
  < 1 dia: 0.5
  < 7 dias: 0.3
  < 30 dias: 0.1
  > 30 dias: 0
}

importanceBoost = importance / 10
```

---

## 🔌 Pontos de Extensão

### Adicionar Nova Personalidade

```typescript
// 1. Em personalityService.ts
export enum PersonalityType {
  // ... existentes
  CUSTOM = 'CUSTOM'
}

// 2. Adicionar prompt
const PERSONALITY_PROMPTS: Record<PersonalityType, string> = {
  // ... existentes
  [PersonalityType.CUSTOM]: `Seu prompt aqui...`
};

// 3. Atualizar UI em PersonalitySettings.tsx
<option value={PersonalityType.CUSTOM}>🎯 Custom</option>
```

---

### Adicionar Novo Tipo de Memória

```typescript
// 1. Em memoryService.ts
export interface MemoryEntry {
  // ... existentes
  type: 'conversation' | 'fact' | 'preference' | 'skill' | 'context' | 'custom';
}

// 2. Atualizar getTypeColor em MemoryPanel.tsx
case 'custom': return 'bg-pink-600';

// 3. Atualizar getTypeIcon
case 'custom': return '🎯';
```

---

### Adicionar Nova Análise Proativa

```typescript
// Em proactiveService.ts
async analyzeCustomPattern(imageBase64: string): Promise<ProactiveSuggestion[]> {
  // Sua lógica de análise
  
  return [{
    id: `sug_${Date.now()}`,
    type: 'improvement',
    priority: 'medium',
    title: 'Sua sugestão',
    description: 'Descrição',
    timestamp: new Date().toISOString()
  }];
}

// Integrar em analyzeScreenFrame
const customSuggestions = await this.analyzeCustomPattern(imageBase64);
suggestions.push(...customSuggestions);
```

---

## 🧪 Testing Strategy

### Unit Tests (Recomendado)

```typescript
// personalityService.test.ts
describe('PersonalityService', () => {
  it('should generate correct system instruction', () => {
    const service = new PersonalityService();
    const instruction = service.generateSystemInstruction();
    expect(instruction).toContain('friendly');
  });
});

// memoryService.test.ts
describe('MemoryService', () => {
  it('should search memories semantically', async () => {
    const service = new MemoryService();
    await service.addMemory('Python programming', 'skill', 8);
    const results = await service.searchMemories('coding');
    expect(results.length).toBeGreaterThan(0);
  });
});
```

---

## 📊 Performance Considerations

### Otimizações Implementadas

1. **Análise Proativa:**
   - Quick pattern check antes de AI profunda
   - Throttling de 30s entre análises
   - Cache de últimos resultados

2. **Memória:**
   - Embeddings de 128 dimensões (vs 1536 típico)
   - Poda automática de memórias antigas
   - Busca limitada a top N resultados

3. **Personalidade:**
   - Instruções pré-compiladas
   - Cache de configuração
   - Detecção de contexto otimizada

### Métricas Alvo

- Busca de memória: < 100ms
- Geração de embedding: < 50ms
- Análise rápida de padrão: < 100ms
- Análise profunda com IA: < 3s

---

## 🔐 Security Considerations

### Dados Sensíveis

**Armazenamento:**
- Tudo em localStorage (client-side)
- Nenhum servidor próprio
- API Gemini recebe apenas o necessário

**Recomendações:**
1. Não armazenar PII em memórias
2. Implementar criptografia para dados sensíveis
3. Oferecer modo "privado" sem persistência
4. Limpeza automática de dados antigos

---

## 🚀 Deployment

### Build

```bash
npm run build
```

### Environment Variables

```env
GEMINI_API_KEY=your_key_here
```

### Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ⚠️ Partial (localStorage limits)
- Mobile: ⚠️ Limited (screen capture)

---

## 📚 Referências Técnicas

- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
- [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**Esta arquitetura foi projetada para ser modular, extensível e performática!** 🏗️
