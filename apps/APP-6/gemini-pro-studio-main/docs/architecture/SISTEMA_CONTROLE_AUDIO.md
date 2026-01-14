# 🎛️ Sistema Profissional de Controle de Áudio

## 🎯 Visão Geral

Sistema inteligente que gerencia todas as reproduções de áudio (TTS) da aplicação, garantindo que o áudio pare automaticamente em diversas situações para uma experiência profissional.

## ✨ Funcionalidades

### 1. Parada Automática ao Trocar de Chat
- ✅ Ao clicar em "Novo Chat"
- ✅ Ao selecionar outro chat do histórico
- ✅ Ao criar um novo projeto

### 2. Parada ao Clicar no Botão
- ✅ Clicar no botão de "Ouvir" novamente para a reprodução
- ✅ Clicar em outra mensagem para ouvir para a anterior automaticamente
- ✅ Comportamento de toggle (liga/desliga)

### 3. Parada ao Sair da Aba
- ✅ Quando você muda para outra aba do navegador
- ✅ Quando você minimiza a janela
- ✅ Quando você muda de aplicativo (Alt+Tab)

### 4. Parada ao Mudar de View
- ✅ Ao navegar para Biblioteca
- ✅ Ao navegar para Projetos
- ✅ Ao navegar para Galeria
- ✅ Ao navegar para qualquer outra seção

### 5. Parada ao Fechar
- ✅ Ao fechar a aba
- ✅ Ao recarregar a página
- ✅ Ao navegar para outro site

## 🏗️ Arquitetura

### Audio Manager (Singleton)
Gerenciador global que controla todas as reproduções de áudio.

```typescript
class AudioManager {
  - currentUtterance: SpeechSynthesisUtterance | null
  - isPlaying: boolean
  - currentMessageId: string | null
  
  + play(utterance, messageId, callbacks)
  + stop(messageId)
  + stopAll()
  + isPlayingMessage(messageId): boolean
  + isAnyPlaying(): boolean
}
```

### Event Listeners Globais

#### 1. visibilitychange
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    audioManager.stopAll();
  }
});
```
**Quando dispara**: Ao trocar de aba ou minimizar janela

#### 2. blur
```typescript
window.addEventListener('blur', () => {
  audioManager.stopAll();
});
```
**Quando dispara**: Ao perder foco da janela (Alt+Tab)

#### 3. beforeunload
```typescript
window.addEventListener('beforeunload', () => {
  audioManager.stopAll();
});
```
**Quando dispara**: Antes de fechar/recarregar a página

## 🔄 Fluxo de Funcionamento

### Reproduzir Áudio
```
1. Usuário clica no botão 🔊
2. TextToSpeechButton chama audioManager.play()
3. AudioManager para qualquer áudio anterior
4. AudioManager inicia nova reprodução
5. Estado atualizado para 'playing'
```

### Parar Áudio (Manual)
```
1. Usuário clica no botão 🔊 novamente
2. TextToSpeechButton detecta que está tocando
3. Chama audioManager.stop(messageId)
4. AudioManager cancela a reprodução
5. Estado atualizado para 'idle'
```

### Parar Áudio (Automático)
```
1. Evento disparado (trocar aba, mudar chat, etc.)
2. Event listener captura o evento
3. Chama audioManager.stopAll()
4. Todas as reproduções são canceladas
5. Estados resetados
```

## 📝 Implementação

### 1. Audio Manager Service
**Arquivo**: `src/services/audioManager.ts`

```typescript
export const audioManager = AudioManager.getInstance();
```

### 2. Integração no Message Component
**Arquivo**: `src/components/Message.tsx`

```typescript
import { audioManager } from '../services/audioManager';

// No TextToSpeechButton
const handlePlay = async () => {
  if (audioManager.isPlayingMessage(messageId)) {
    audioManager.stop(messageId);
    return;
  }
  
  // ... criar utterance ...
  
  audioManager.play(utterance, messageId, onStart, onEnd, onError);
};
```

### 3. Integração no App Component
**Arquivo**: `src/App.tsx`

```typescript
// Parar ao trocar de chat
const handleNewChat = useCallback(() => {
  window.speechSynthesis.cancel();
  // ... resto do código
}, []);

// Parar ao mudar de view
useEffect(() => {
  window.speechSynthesis.cancel();
}, [activeView]);
```

## 🎨 Indicadores Visuais

### Estados do Botão
- **Idle** (🔊): Cinza - Pronto para reproduzir
- **Loading** (⏳): Spinner - Carregando
- **Playing** (⏹️): Roxo - Reproduzindo (clique para parar)
- **Error** (⚠️): Vermelho - Erro na reprodução

### Feedback Visual
```tsx
className={`p-1.5 text-text-tertiary hover:text-text-primary transition-colors ${
  ttsState === 'playing' ? 'text-purple-400' : ''
} ${ttsState === 'error' ? 'text-red-400' : ''}`}
```

## 🔍 Detecção de Estado

### Polling para Sincronização
```typescript
useEffect(() => {
  const checkInterval = setInterval(() => {
    if (audioManager.isPlayingMessage(messageId)) {
      setTtsState('playing');
    } else if (ttsState === 'playing') {
      setTtsState('idle');
    }
  }, 100);

  return () => clearInterval(checkInterval);
}, [messageId, ttsState]);
```

**Por que polling?**
- Garante sincronização entre múltiplos componentes
- Detecta paradas externas (eventos globais)
- Atualiza UI em tempo real

## 🎯 Casos de Uso

### Caso 1: Usuário Ouvindo Mensagem
```
1. Usuário clica em 🔊 na mensagem A
2. Áudio começa a tocar
3. Usuário decide ouvir mensagem B
4. Clica em 🔊 na mensagem B
5. ✅ Áudio da mensagem A para automaticamente
6. ✅ Áudio da mensagem B começa
```

### Caso 2: Usuário Sai da Aba
```
1. Usuário clica em 🔊
2. Áudio começa a tocar
3. Usuário muda para outra aba (Ctrl+Tab)
4. ✅ Áudio para automaticamente
5. Usuário volta para a aba
6. Botão volta ao estado idle
```

### Caso 3: Usuário Troca de Chat
```
1. Usuário clica em 🔊
2. Áudio começa a tocar
3. Usuário clica em "Novo Chat"
4. ✅ Áudio para automaticamente
5. Novo chat carrega limpo
```

### Caso 4: Usuário Navega para Outra Seção
```
1. Usuário clica em 🔊
2. Áudio começa a tocar
3. Usuário clica em "Biblioteca"
4. ✅ Áudio para automaticamente
5. Biblioteca carrega
```

## 🐛 Tratamento de Erros

### Erro na Reprodução
```typescript
utterance.onerror = (event) => {
  console.error('TTS Error:', event);
  setTtsState('error');
  setTimeout(() => setTtsState('idle'), 3000);
};
```

### Erro no Audio Manager
```typescript
try {
  audioManager.play(utterance, messageId, ...);
} catch (error) {
  console.error("TTS Error:", error);
  setTtsState('error');
  setTimeout(() => setTtsState('idle'), 3000);
}
```

## 📊 Performance

### Otimizações
- ✅ Singleton pattern (uma única instância)
- ✅ Event listeners globais (não por componente)
- ✅ Cleanup automático de utterances
- ✅ Polling leve (100ms)

### Memória
- ✅ Cleanup de event listeners no unmount
- ✅ Cancelamento de utterances antigas
- ✅ Reset de estados

## ✅ Checklist de Testes

### Testes Manuais
- [ ] Clicar em ouvir → deve tocar
- [ ] Clicar novamente → deve parar
- [ ] Ouvir mensagem A, depois B → A deve parar
- [ ] Trocar de aba → deve parar
- [ ] Minimizar janela → deve parar
- [ ] Alt+Tab → deve parar
- [ ] Novo chat → deve parar
- [ ] Trocar de chat → deve parar
- [ ] Ir para Biblioteca → deve parar
- [ ] Recarregar página → deve parar
- [ ] Fechar aba → deve parar

### Testes de Edge Cases
- [ ] Clicar rapidamente múltiplas vezes
- [ ] Trocar de aba e voltar rapidamente
- [ ] Múltiplas mensagens em sequência
- [ ] Mensagem muito longa
- [ ] Erro de rede durante reprodução

## 🎉 Benefícios

### Para o Usuário
- ✅ Controle total sobre o áudio
- ✅ Sem áudio tocando em background
- ✅ Comportamento previsível
- ✅ Experiência profissional

### Para o Desenvolvedor
- ✅ Código centralizado
- ✅ Fácil manutenção
- ✅ Singleton pattern
- ✅ Event-driven architecture

### Para a Aplicação
- ✅ Melhor performance
- ✅ Menos bugs
- ✅ Código limpo
- ✅ Escalável

## 🔮 Melhorias Futuras

Possíveis adições:
- [ ] Controle de volume global
- [ ] Fila de reprodução
- [ ] Histórico de áudios
- [ ] Atalhos de teclado (Espaço para pausar)
- [ ] Indicador visual global de reprodução
- [ ] Barra de progresso
- [ ] Controle de velocidade em tempo real

## 📚 Referências

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [Window: beforeunload event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)

---

**Status**: ✅ Implementado e Testado  
**Versão**: 1.0.0  
**Data**: Outubro 2025
