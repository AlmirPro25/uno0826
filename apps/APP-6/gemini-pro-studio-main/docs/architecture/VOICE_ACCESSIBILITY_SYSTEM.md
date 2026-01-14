# Sistema de Acessibilidade de Voz

## 🎤 Visão Geral

O sistema de acessibilidade de voz foi completamente reformulado para usar as **APIs nativas do navegador** (Web Speech API), eliminando a dependência de APIs pagas do Gemini. Agora você tem controle total sobre reconhecimento de voz e síntese de fala, com configurações personalizáveis e vozes de alta qualidade.

## ✨ Funcionalidades

### 1. Reconhecimento de Voz (Speech Recognition)
- **Gravação em tempo real**: Clique no botão do microfone para começar a gravar
- **Transcrição ao vivo**: Veja o texto sendo transcrito enquanto você fala
- **Suporte multilíngue**: Mais de 15 idiomas suportados
- **Transcrição contínua**: Continue falando sem interrupções
- **Resultados intermediários**: Veja o texto sendo formado em tempo real

### 2. Síntese de Voz (Text-to-Speech)
- **Leitura de mensagens**: Clique no ícone de volume em qualquer mensagem da IA
- **Vozes de alta qualidade**: Acesso às melhores vozes do sistema (Google, Microsoft, etc.)
- **Controles de reprodução**: Pause, retome ou pare a leitura a qualquer momento
- **Limpeza automática**: Remove código e formatação markdown para melhor leitura

### 3. Configurações Personalizáveis
- **Seleção de voz**: Escolha entre todas as vozes disponíveis no sistema
- **Velocidade**: Ajuste de 0.5x a 2.0x
- **Tom (Pitch)**: Ajuste de 0.5 a 2.0
- **Volume**: Controle de 0% a 100%
- **Idioma**: Selecione o idioma preferido
- **Filtro de qualidade**: Mostre apenas vozes premium/naturais
- **Teste de voz**: Ouça uma demonstração antes de salvar

## 🎯 Como Usar

### Gravação de Áudio

1. **Iniciar gravação**:
   - Clique no ícone do microfone (🎤) no campo de entrada
   - Permita o acesso ao microfone quando solicitado
   - Comece a falar

2. **Durante a gravação**:
   - Veja o texto sendo transcrito em tempo real
   - O ícone do microfone ficará vermelho e pulsando
   - Continue falando normalmente

3. **Parar gravação**:
   - Clique novamente no ícone do microfone
   - O texto transcrito será adicionado ao campo de entrada
   - Você pode editar o texto antes de enviar

### Ouvir Mensagens

1. **Reproduzir**:
   - Clique no ícone de volume (🔊) em qualquer mensagem da IA
   - A leitura começará automaticamente

2. **Parar**:
   - Clique novamente no ícone (agora mostrando ⏹️)
   - A leitura será interrompida imediatamente

### Configurar Voz

1. **Abrir configurações**:
   - Clique no ícone de configurações (⚙️) ao lado do microfone
   - Ou acesse através do menu

2. **Personalizar**:
   - Selecione o idioma desejado
   - Escolha uma voz da lista (recomendamos vozes Google ou Microsoft)
   - Ajuste velocidade, tom e volume usando os controles deslizantes
   - Clique em "Testar Voz" para ouvir uma demonstração

3. **Salvar**:
   - Clique em "Salvar" para aplicar as configurações
   - As configurações são salvas automaticamente no navegador

## 🌟 Vozes Recomendadas

### Português (Brasil)
- **Google Português do Brasil** (Feminina/Masculina)
- **Microsoft Maria** (Feminina)
- **Microsoft Daniel** (Masculino)

### Inglês (EUA)
- **Google US English** (Feminina/Masculina)
- **Microsoft Zira** (Feminina)
- **Microsoft David** (Masculino)

### Espanhol
- **Google Español** (Feminina/Masculina)
- **Microsoft Helena** (Feminina)
- **Microsoft Pablo** (Masculino)

## 🔧 Detalhes Técnicos

### Arquitetura

```
src/
├── services/
│   ├── speechRecognitionService.ts  # Reconhecimento de voz
│   └── speechSynthesisService.ts    # Síntese de voz
└── components/
    ├── VoiceSettingsModal.tsx       # Modal de configurações
    ├── PromptInput.tsx              # Input com gravação
    └── Message.tsx                  # Mensagem com TTS
```

### APIs Utilizadas

1. **Web Speech API - Speech Recognition**
   - `SpeechRecognition` / `webkitSpeechRecognition`
   - Suporte: Chrome, Edge, Safari (parcial)
   - Funciona online (requer conexão)

2. **Web Speech API - Speech Synthesis**
   - `speechSynthesis`
   - Suporte: Todos os navegadores modernos
   - Funciona offline (vozes locais)

### Configurações Salvas

As configurações são salvas no `localStorage` do navegador:

```json
{
  "voice": {
    "name": "Google português do Brasil",
    "lang": "pt-BR"
  },
  "rate": 1.0,
  "pitch": 1.0,
  "volume": 1.0,
  "language": "pt-BR"
}
```

## 🎨 Interface

### Indicadores Visuais

- **Microfone inativo**: Ícone cinza 🎤
- **Gravando**: Ícone vermelho pulsando 🔴 + animação de ondas
- **Erro**: Ícone amarelo ⚠️
- **Reproduzindo**: Ícone roxo 🔊
- **Pausado**: Ícone azul ⏸️

### Feedback ao Usuário

- Placeholder dinâmico: "Ouvindo... fale agora" durante gravação
- Transcrição em tempo real visível no campo de entrada
- Mensagens de erro claras e em português
- Tooltips informativos em todos os botões

## 🚀 Vantagens do Novo Sistema

### Antes (API Gemini)
- ❌ Custos por uso
- ❌ Dependência de API externa
- ❌ Latência de rede
- ❌ Sem controle sobre vozes
- ❌ Configurações limitadas

### Agora (Web Speech API)
- ✅ **100% gratuito**
- ✅ **Funciona offline** (TTS com vozes locais)
- ✅ **Baixa latência**
- ✅ **Vozes de alta qualidade**
- ✅ **Controle total**
- ✅ **Configurações avançadas**
- ✅ **Suporte multilíngue**

## 🌐 Compatibilidade

### Reconhecimento de Voz
- ✅ Chrome/Edge (completo)
- ✅ Safari (parcial)
- ⚠️ Firefox (experimental)

### Síntese de Voz
- ✅ Chrome/Edge (excelente)
- ✅ Safari (bom)
- ✅ Firefox (bom)
- ✅ Opera (excelente)

## 💡 Dicas de Uso

1. **Melhor qualidade de reconhecimento**:
   - Use um microfone de qualidade
   - Fale claramente e em ritmo normal
   - Minimize ruído de fundo

2. **Melhores vozes**:
   - Prefira vozes "Google" ou "Microsoft"
   - Vozes "Neural" ou "Natural" são mais realistas
   - Vozes locais funcionam offline

3. **Performance**:
   - Vozes locais são mais rápidas
   - Vozes online têm melhor qualidade
   - Ajuste a velocidade para sua preferência

4. **Acessibilidade**:
   - Use atalhos de teclado quando disponíveis
   - Configure uma voz confortável para longas leituras
   - Ajuste o volume conforme o ambiente

## 🔒 Privacidade

- **Reconhecimento de voz**: Processado pelos servidores do navegador (Google/Microsoft)
- **Síntese de voz**: Processado localmente quando usa vozes locais
- **Configurações**: Salvas apenas no seu navegador
- **Sem rastreamento**: Nenhum dado é enviado para servidores externos

## 🐛 Solução de Problemas

### Microfone não funciona
1. Verifique permissões do navegador
2. Teste o microfone em outras aplicações
3. Recarregue a página

### Voz não reproduz
1. Verifique o volume do sistema
2. Teste com outra voz
3. Verifique se o navegador suporta TTS

### Transcrição imprecisa
1. Fale mais devagar e claramente
2. Reduza ruído de fundo
3. Verifique se o idioma está correto

### Vozes não aparecem
1. Aguarde alguns segundos (vozes carregam assincronamente)
2. Recarregue a página
3. Verifique se o navegador suporta vozes

## 📝 Notas de Desenvolvimento

- Serviços implementados como singletons para melhor performance
- Event listeners otimizados para evitar memory leaks
- Configurações persistidas automaticamente
- Fallbacks para navegadores sem suporte
- Código limpo e bem documentado

## 🎉 Conclusão

O novo sistema de acessibilidade de voz oferece uma experiência profissional, gratuita e totalmente personalizável. Aproveite todas as funcionalidades para tornar sua interação com a IA mais natural e acessível!
