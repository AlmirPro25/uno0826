# 🔐 Guia de Permissões - Gemini Live Companion

## Por que precisamos de permissões?

O Gemini Live Companion é um assistente de IA multimodal que precisa de acesso a diferentes recursos do seu dispositivo para funcionar corretamente. Este documento explica cada permissão necessária e como gerenciá-las.

---

## 📋 Permissões Necessárias

### 1. 🖥️ Compartilhamento de Tela (Screen Capture)

**O que é:**
Permite que a aplicação capture e transmita o conteúdo da sua tela em tempo real.

**Por que precisamos:**
- A IA vê exatamente o que você está vendo
- Fornece contexto visual para conversas mais precisas
- Permite análise de código, dados, designs e documentos
- Essencial para assistência contextual

**Como funciona:**
- Você escolhe qual janela, aba ou tela inteira compartilhar
- Frames são capturados a 2 FPS (configurável)
- Imagens são enviadas para o modelo Gemini em formato JPEG
- Você pode parar o compartilhamento a qualquer momento

**Controle:**
- ✅ Você escolhe o que compartilhar (janela específica, aba do navegador, ou tela inteira)
- ✅ Um indicador visual mostra quando está ativo
- ✅ Pode ser interrompido clicando no botão de parar sessão

---

### 2. 🎤 Microfone (Microphone)

**O que é:**
Permite que a aplicação capture áudio do seu microfone.

**Por que precisamos:**
- Conversação por voz natural com a IA
- Transcrição em tempo real das suas palavras
- Interação hands-free enquanto trabalha
- Processamento de áudio para melhor compreensão

**Como funciona:**
- Áudio é capturado em PCM 16kHz
- Enviado em tempo real para o modelo Gemini
- Transcrições aparecem na interface
- Áudio não é gravado localmente (apenas transcrições)

**Controle:**
- ✅ Ativado apenas durante sessões ativas
- ✅ Indicador visual de sessão ativa
- ✅ Desativado automaticamente ao parar a sessão

---

### 3. 📹 Câmera (Camera)

**O que é:**
Permite que a aplicação acesse sua webcam.

**Por que precisamos:**
- Adiciona contexto visual através do Picture-in-Picture
- Permite que a IA veja gestos ou objetos físicos
- Útil para demonstrações ou explicações visuais
- Opcional mas recomendado para experiência completa

**Como funciona:**
- Vídeo da câmera aparece em um círculo flutuante na tela
- Pode ser arrastado para qualquer posição
- Espelhado horizontalmente para melhor visualização
- Transmitido junto com o compartilhamento de tela

**Controle:**
- ✅ Sempre visível quando ativa (PiP na tela)
- ✅ Pode ser movido para não atrapalhar
- ✅ Desativado ao parar a sessão

---

## 🛡️ Segurança e Privacidade

### Dados Locais
- ✅ Conversas são salvas **apenas no seu navegador** (localStorage)
- ✅ Nenhum dado é enviado para servidores externos além da API do Gemini
- ✅ Você pode limpar o histórico a qualquer momento limpando o localStorage

### Dados Enviados ao Gemini
- 📤 Frames da tela (2 por segundo)
- 📤 Áudio do microfone (streaming)
- 📤 Vídeo da câmera (streaming)
- 📤 Transcrições de texto

### O que NÃO é armazenado
- ❌ Gravações de áudio/vídeo completas
- ❌ Capturas de tela em alta resolução
- ❌ Dados em servidores externos (exceto processamento temporário do Gemini)

---

## 🔧 Como Gerenciar Permissões

### No Chrome/Edge

1. **Verificar permissões atuais:**
   - Clique no ícone de cadeado na barra de endereços
   - Veja o status de cada permissão

2. **Revogar permissões:**
   - Clique no cadeado → Configurações do site
   - Altere Câmera/Microfone para "Bloquear"

3. **Conceder novamente:**
   - Recarregue a página
   - Clique em "Conceder Permissões" quando solicitado

### No Firefox

1. **Verificar permissões:**
   - Clique no ícone de informações (i) na barra de endereços
   - Veja "Permissões"

2. **Gerenciar:**
   - Clique em "Mais informações"
   - Aba "Permissões"
   - Ajuste cada permissão individualmente

### No Safari

1. **Verificar permissões:**
   - Safari → Preferências → Sites
   - Selecione Câmera/Microfone

2. **Gerenciar:**
   - Encontre o site na lista
   - Altere a permissão conforme necessário

---

## ❓ Perguntas Frequentes

### Por que preciso conceder todas as permissões?

Cada permissão serve a um propósito específico:
- **Tela**: Para a IA ver o contexto
- **Microfone**: Para conversação por voz
- **Câmera**: Para contexto visual adicional

Tecnicamente, você pode usar apenas tela + microfone, mas a experiência será limitada.

### As permissões são permanentes?

Não. Você pode:
- Revogar a qualquer momento nas configurações do navegador
- Parar a sessão para desativar temporariamente
- Fechar a aba para encerrar completamente

### O que acontece se eu negar uma permissão?

- A aplicação mostrará uma mensagem de erro clara
- Você pode tentar novamente clicando em "Tentar Novamente"
- Algumas funcionalidades podem não estar disponíveis

### Meus dados são seguros?

Sim:
- ✅ Processamento acontece via API oficial do Google Gemini
- ✅ Dados locais ficam apenas no seu navegador
- ✅ Você controla quando iniciar/parar o compartilhamento
- ✅ Nenhum servidor intermediário armazena seus dados

### Como sei que as permissões estão ativas?

Indicadores visuais:
- 🔴 Ponto vermelho pulsante no botão principal
- 📹 Círculo PiP da câmera visível
- 📊 Status "Connected" no canto superior esquerdo
- 🎤 Indicador do navegador mostrando uso de microfone/câmera

### Posso usar sem câmera?

Sim, mas você precisará modificar o código para tornar a câmera opcional. Por padrão, todas as três permissões são solicitadas.

---

## 🚨 Solução de Problemas

### "Permissão negada"
- Verifique se você clicou em "Permitir" quando solicitado
- Verifique as configurações do navegador
- Tente em modo anônimo para descartar extensões

### "Dispositivo em uso"
- Feche outros aplicativos usando câmera/microfone (Zoom, Teams, etc.)
- Feche outras abas do navegador que possam estar usando os dispositivos
- Reinicie o navegador

### "Dispositivo não encontrado"
- Verifique se câmera/microfone estão conectados
- Verifique drivers do dispositivo
- Teste em outro aplicativo para confirmar funcionamento

### Permissões não são solicitadas
- Limpe o cache do navegador
- Verifique se o site está em HTTPS (necessário para permissões)
- Tente outro navegador

---

## 📞 Suporte

Se você tiver problemas com permissões:

1. Verifique este guia primeiro
2. Consulte a documentação do seu navegador
3. Abra uma issue no repositório do projeto
4. Verifique os logs do console do navegador (F12)

---

## 🔗 Links Úteis

- [MDN - Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [MDN - MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API)
- [Gemini API Privacy](https://ai.google.dev/gemini-api/terms)

---

<div align="center">

**Sua privacidade é importante. Use com responsabilidade.** 🔒

</div>
