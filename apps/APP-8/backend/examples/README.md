# Exemplos de Uso

## Executar Teste Completo

```bash
cd backend
npm run dev

# Em outro terminal
npx tsx examples/test-system.ts
```

## Exemplos de API

### 1. Criar Sessão e Adicionar Mensagens

```bash
# Criar sessão
curl -X POST http://localhost:3001/api/sessions

# Adicionar mensagem
curl -X POST http://localhost:3001/api/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d '{"speaker":"user","text":"Olá, como você está?"}'
```

### 2. Buscar Memórias

```bash
curl "http://localhost:3001/api/memories/search?q=programação&limit=5"
```

### 3. Upload de Imagem

```bash
curl -X POST http://localhost:3001/api/captures \
  -F "image=@screenshot.jpg" \
  -F "sessionId=1" \
  -F "context=Tela do código"
```

### 4. Criar Resumo Diário

```bash
curl -X POST http://localhost:3001/api/summaries \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-15"}'
```

### 5. Análise Semanal

```bash
curl http://localhost:3001/api/summaries/trends/weekly
```

## Exemplo de Integração Frontend

```typescript
import { backendService } from './services/backendService';

// Fluxo completo de uma conversa
async function handleConversation() {
  // 1. Criar sessão
  const sessionId = await backendService.createSession();
  
  // 2. Adicionar mensagens
  await backendService.addMessage(sessionId, 'user', 'Olá!');
  await backendService.addMessage(sessionId, 'model', 'Olá! Como posso ajudar?');
  
  // 3. Capturar screenshot (opcional)
  const screenshot = await captureScreen();
  const capture = await backendService.saveCapture(
    screenshot,
    sessionId,
    undefined,
    'Contexto da conversa'
  );
  
  // 4. Buscar memórias relevantes
  const memories = await backendService.searchMemories('ajuda com código', 5);
  
  // 5. Resumir sessão ao final
  const summary = await backendService.summarizeSession(sessionId);
  
  // 6. Extrair fatos importantes
  const fullConversation = 'Usuário: Olá!\nModelo: Olá! Como posso ajudar?';
  await backendService.extractFactsFromConversation(fullConversation);
}
```

## Exemplo de Componente React

```typescript
import { useState, useEffect } from 'react';
import { backendService } from '../services/backendService';

export function DailySummaryView() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const data = await backendService.getDailySummary(today);
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!summary) return <div>Nenhum resumo disponível</div>;

  return (
    <div className="daily-summary">
      <h2>Resumo de {summary.date}</h2>
      <p>{summary.summary}</p>
      
      <div className="metrics">
        <div>Humor: {summary.user_mood}</div>
        <div>Produtividade: {summary.productivity_score}/10</div>
      </div>
      
      <div className="topics">
        <h3>Tópicos Principais</h3>
        {summary.key_topics.map(topic => (
          <span key={topic} className="tag">{topic}</span>
        ))}
      </div>
      
      <div className="insights">
        <h3>Insights da IA</h3>
        <p>{summary.ai_insights}</p>
      </div>
    </div>
  );
}
```
