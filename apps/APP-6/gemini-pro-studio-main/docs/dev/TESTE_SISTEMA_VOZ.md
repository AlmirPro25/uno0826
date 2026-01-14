# 🧪 Guia de Testes - Sistema de Voz

## 🎯 Objetivo

Este guia ajuda você a testar todas as funcionalidades do novo sistema de acessibilidade de voz.

## 📋 Checklist de Testes

### 1. Reconhecimento de Voz (Speech-to-Text)

#### Teste Básico
- [ ] Clique no ícone do microfone 🎤
- [ ] Permita o acesso ao microfone quando solicitado
- [ ] Verifique se o ícone fica vermelho e pulsando
- [ ] Fale algo simples: "Olá, como você está?"
- [ ] Verifique se o texto aparece no campo de entrada
- [ ] Clique novamente no microfone para parar
- [ ] Verifique se o texto permanece no campo

#### Teste de Transcrição em Tempo Real
- [ ] Inicie a gravação
- [ ] Fale uma frase longa pausadamente
- [ ] Observe o texto sendo formado em tempo real
- [ ] Verifique se há texto intermediário (cinza/transparente)
- [ ] Verifique se o texto final é adicionado corretamente

#### Teste de Continuidade
- [ ] Inicie a gravação
- [ ] Fale uma frase
- [ ] Pause por 2 segundos
- [ ] Fale outra frase
- [ ] Verifique se ambas as frases foram capturadas

#### Teste de Erros
- [ ] Negue permissão ao microfone
- [ ] Verifique se aparece mensagem de erro
- [ ] Verifique se o ícone fica amarelo
- [ ] Permita a permissão e tente novamente

### 2. Síntese de Voz (Text-to-Speech)

#### Teste Básico
- [ ] Envie uma mensagem para a IA
- [ ] Aguarde a resposta
- [ ] Clique no ícone de volume 🔊 na resposta
- [ ] Verifique se a mensagem é lida em voz alta
- [ ] Clique novamente para parar
- [ ] Verifique se a leitura para imediatamente

#### Teste de Controles
- [ ] Inicie a reprodução de uma mensagem longa
- [ ] Clique no botão de parar
- [ ] Verifique se para imediatamente
- [ ] Clique novamente para reiniciar
- [ ] Verifique se começa do início

#### Teste de Múltiplas Mensagens
- [ ] Inicie a reprodução de uma mensagem
- [ ] Clique em outra mensagem para reproduzir
- [ ] Verifique se a primeira para e a segunda inicia

#### Teste de Limpeza de Markdown
- [ ] Envie uma mensagem que gere código
- [ ] Reproduza a resposta
- [ ] Verifique se o código não é lido
- [ ] Verifique se apenas o texto é lido

### 3. Configurações de Voz

#### Teste de Abertura
- [ ] Clique no ícone de configurações ⚙️
- [ ] Verifique se o modal abre
- [ ] Verifique se todas as seções estão visíveis
- [ ] Clique no X para fechar
- [ ] Verifique se o modal fecha

#### Teste de Seleção de Idioma
- [ ] Abra as configurações
- [ ] Selecione "Português (Brasil)"
- [ ] Verifique se as vozes mudam
- [ ] Selecione "English (US)"
- [ ] Verifique se as vozes mudam novamente

#### Teste de Seleção de Voz
- [ ] Abra as configurações
- [ ] Marque "Apenas vozes de qualidade"
- [ ] Verifique se a lista é filtrada
- [ ] Desmarque a opção
- [ ] Verifique se mais vozes aparecem
- [ ] Selecione uma voz Google ou Microsoft

#### Teste de Velocidade
- [ ] Abra as configurações
- [ ] Mova o controle de velocidade para 0.5x
- [ ] Clique em "Testar Voz"
- [ ] Verifique se a voz está lenta
- [ ] Mova para 2.0x
- [ ] Teste novamente
- [ ] Verifique se a voz está rápida

#### Teste de Tom
- [ ] Abra as configurações
- [ ] Mova o controle de tom para 0.5
- [ ] Teste a voz
- [ ] Verifique se o tom está grave
- [ ] Mova para 2.0
- [ ] Teste novamente
- [ ] Verifique se o tom está agudo

#### Teste de Volume
- [ ] Abra as configurações
- [ ] Mova o controle de volume para 0%
- [ ] Teste a voz
- [ ] Verifique se não há som
- [ ] Mova para 100%
- [ ] Teste novamente
- [ ] Verifique se o som está alto

#### Teste de Persistência
- [ ] Configure uma voz específica
- [ ] Ajuste velocidade, tom e volume
- [ ] Clique em "Salvar"
- [ ] Feche o modal
- [ ] Recarregue a página (F5)
- [ ] Abra as configurações novamente
- [ ] Verifique se as configurações foram mantidas

#### Teste de Restauração
- [ ] Abra as configurações
- [ ] Faça várias alterações
- [ ] Clique em "Restaurar Padrões"
- [ ] Verifique se tudo volta ao padrão

### 4. Interface e UX

#### Teste de Indicadores Visuais
- [ ] Verifique se o microfone muda de cor ao gravar
- [ ] Verifique se há animação de pulsação
- [ ] Verifique se aparecem ondas sonoras
- [ ] Verifique se o texto "Gravando áudio..." aparece

#### Teste de Tooltips
- [ ] Passe o mouse sobre o microfone
- [ ] Verifique se aparece "Gravar áudio"
- [ ] Passe sobre o volume
- [ ] Verifique se aparece "Ouvir"
- [ ] Passe sobre as configurações
- [ ] Verifique se aparece "Configurações de Voz"

#### Teste de Responsividade
- [ ] Redimensione a janela do navegador
- [ ] Verifique se os botões permanecem visíveis
- [ ] Abra o modal de configurações
- [ ] Verifique se está centralizado
- [ ] Teste em tela pequena (mobile)

### 5. Compatibilidade

#### Teste em Chrome/Edge
- [ ] Abra no Chrome ou Edge
- [ ] Teste reconhecimento de voz
- [ ] Teste síntese de voz
- [ ] Verifique se há vozes Google disponíveis

#### Teste em Safari
- [ ] Abra no Safari
- [ ] Teste reconhecimento de voz
- [ ] Teste síntese de voz
- [ ] Verifique se há vozes Apple disponíveis

#### Teste em Firefox
- [ ] Abra no Firefox
- [ ] Teste síntese de voz
- [ ] Verifique se funciona corretamente

### 6. Casos Extremos

#### Teste de Texto Longo
- [ ] Envie uma mensagem que gere resposta longa
- [ ] Reproduza a resposta
- [ ] Verifique se toda a mensagem é lida
- [ ] Pare no meio
- [ ] Verifique se para corretamente

#### Teste de Caracteres Especiais
- [ ] Grave áudio com números: "123"
- [ ] Verifique se transcreve corretamente
- [ ] Grave com pontuação: "Olá! Como vai?"
- [ ] Verifique a transcrição

#### Teste de Ruído
- [ ] Grave com ruído de fundo
- [ ] Verifique a qualidade da transcrição
- [ ] Teste em ambiente silencioso
- [ ] Compare os resultados

#### Teste de Múltiplos Idiomas
- [ ] Configure para Português
- [ ] Grave em português
- [ ] Configure para Inglês
- [ ] Grave em inglês
- [ ] Verifique se ambos funcionam

## 📊 Resultados Esperados

### Reconhecimento de Voz
- ✅ Transcrição precisa (>90% em ambiente silencioso)
- ✅ Latência baixa (<500ms)
- ✅ Feedback visual claro
- ✅ Tratamento de erros adequado

### Síntese de Voz
- ✅ Reprodução clara e natural
- ✅ Controles responsivos
- ✅ Configurações aplicadas corretamente
- ✅ Limpeza de markdown efetiva

### Configurações
- ✅ Interface intuitiva
- ✅ Todas as opções funcionais
- ✅ Persistência correta
- ✅ Teste de voz funcional

## 🐛 Problemas Conhecidos

### Reconhecimento de Voz
- Firefox: Suporte experimental, pode não funcionar
- Safari: Pode ter limitações em algumas versões

### Síntese de Voz
- Algumas vozes podem não estar disponíveis offline
- Vozes online requerem conexão com internet

## 📝 Relatório de Bugs

Se encontrar algum problema, anote:

1. **Navegador**: Chrome/Edge/Safari/Firefox
2. **Versão**: 
3. **Sistema Operacional**: Windows/Mac/Linux
4. **Descrição do problema**: 
5. **Passos para reproduzir**: 
6. **Comportamento esperado**: 
7. **Comportamento atual**: 

## ✅ Critérios de Aceitação

O sistema está pronto quando:

- [ ] Todos os testes básicos passam
- [ ] Reconhecimento de voz funciona em Chrome/Edge
- [ ] Síntese de voz funciona em todos os navegadores
- [ ] Configurações são salvas e carregadas corretamente
- [ ] Interface é responsiva e intuitiva
- [ ] Não há erros no console
- [ ] Documentação está completa

## 🎉 Conclusão

Após completar todos os testes, você terá verificado que o sistema de acessibilidade de voz está funcionando perfeitamente e pronto para uso em produção!

---

**Boa sorte com os testes!** 🚀
