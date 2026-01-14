# Guia de Integração do Sistema Visual

## 🚀 Integração Rápida

### Passo 1: Instalar Dependências

```bash
# Backend
cd backend
npm install puppeteer axios

# Frontend
cd ..
npm install axios
```

### Passo 2: Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env` na raiz do backend:

```bash
# Gemini (obrigatório)
GEMINI_API_KEY=sua_chave_aqui

# APIs de Imagens (opcional - pelo menos uma recomendada)
UNSPLASH_API_KEY=sua_chave_unsplash
PEXELS_API_KEY=sua_chave_pexels
PIXABAY_API_KEY=sua_chave_pixabay
```

### Passo 3: Usar ChatViewWithVisual

Substitua o ChatView atual pelo ChatViewWithVisual no seu App.tsx:

```tsx
// Antes:
import { ChatView } from './components/ChatView';

// Depois:
import { ChatViewWithVisual } from './components/ChatViewWithVisual';

// No render:
<ChatViewWithVisual
  messages={messages}
  isLoading={isLoading}
  onSend={handleSend}
  // ... outras props
/>
```

### Passo 4: Testar o Sistema

```bash
# Testar backend
cd backend
node test-visual-system.js

# Iniciar servidor
npm start

# Em outro terminal, iniciar frontend
cd ..
npm start
```

## 📋 Checklist de Integração

### Backend
- [ ] Puppeteer instalado
- [ ] Axios instalado
- [ ] GEMINI_API_KEY configurada
- [ ] Pelo menos uma API de imagens configurada (opcional)
- [ ] Rotas de API adicionadas ao server.js
- [ ] imageGenerationService.js criado

### Frontend
- [ ] Axios instalado
- [ ] visualComposerService.ts criado
- [ ] VisualCanvas.tsx criado
- [ ] useVisualCanvas.ts criado
- [ ] ChatViewWithVisual.tsx criado
- [ ] Imports atualizados no App.tsx

## 🧪 Como Testar

### Teste 1: Tela Inicial Generativa

1. Abra o app
2. Deve ver tela inicial personalizada
3. Verifique saudação baseada na hora
4. Clique em um card de ação

**Esperado**: Tela inicial com 4 cards, animações suaves

### Teste 2: Busca de Produtos

1. Digite: "notebook dell"
2. Envie a mensagem
3. Aguarde resposta da IA

**Esperado**: 
- Layout visual com fotos de notebooks
- Preços destacados
- Links para produtos
- Screenshots das páginas (se configurado)

### Teste 3: Notícias

1. Digite: "últimas notícias de tecnologia"
2. Envie a mensagem

**Esperado**:
- Layout de notícias com ilustrações
- Cards de notícias com imagens
- Fontes e datas

### Teste 4: Alternância de Canvas

1. Após gerar um visual, clique no botão flutuante
2. Alterne entre chat e visual

**Esperado**:
- Transição suave
- Canvas aparece/desaparece
- Botão muda de ícone (💬 ↔ 🎨)

## 🔧 Configuração de APIs

### Unsplash (Recomendado)

1. Acesse: https://unsplash.com/developers
2. Crie uma conta
3. Crie um novo app
4. Copie o Access Key
5. Adicione ao .env: `UNSPLASH_API_KEY=sua_chave`

**Limite**: 50 requisições/hora (gratuito)

### Pexels (Alternativa)

1. Acesse: https://www.pexels.com/api/
2. Crie uma conta
3. Gere uma API key
4. Adicione ao .env: `PEXELS_API_KEY=sua_chave`

**Limite**: 200 requisições/hora (gratuito)

### Pixabay (Alternativa)

1. Acesse: https://pixabay.com/api/docs/
2. Crie uma conta
3. Copie sua API key
4. Adicione ao .env: `PIXABAY_API_KEY=sua_chave`

**Limite**: 5000 requisições/hora (gratuito)

## 🐛 Troubleshooting

### Problema: Imagens não aparecem

**Solução 1**: Verifique se pelo menos uma API de imagens está configurada
```bash
# No terminal do backend
echo $UNSPLASH_API_KEY
# ou
echo $PEXELS_API_KEY
```

**Solução 2**: Verifique logs do backend
```bash
# Deve ver:
✅ Imagem gerada: { url: '...', source: 'unsplash' }
```

**Solução 3**: Use placeholders (funciona sem API)
- O sistema usa placeholders automaticamente se APIs não estiverem configuradas

### Problema: Screenshots não funcionam

**Solução 1**: Verifique se Puppeteer está instalado
```bash
cd backend
npm list puppeteer
```

**Solução 2**: Instale dependências do Chromium (Linux)
```bash
sudo apt-get install -y chromium-browser
```

**Solução 3**: Use modo headless
- Já está configurado por padrão no código

### Problema: Canvas não aparece

**Solução 1**: Verifique se ChatViewWithVisual está sendo usado
```tsx
// Deve ser:
import { ChatViewWithVisual } from './components/ChatViewWithVisual';
```

**Solução 2**: Verifique console do navegador
```javascript
// Deve ver:
✅ Usando Template: products
// ou
🎨 Gerando Layout Visual...
```

**Solução 3**: Clique no botão flutuante para alternar

### Problema: Progresso trava em X%

**Solução**: Verifique conexão com backend
```bash
# Teste a rota:
curl -X POST http://localhost:3001/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{"query":"test","context":{},"count":1}'
```

## 📊 Monitoramento

### Ver Logs do Backend

```bash
# Terminal do backend deve mostrar:
🚀 Servidor rodando na porta 3001
📸 Gerando imagem: laptop
✅ Imagem gerada via unsplash
🖼️  Capturando screenshot: https://...
✅ Screenshot capturado
```

### Ver Logs do Frontend

Abra DevTools (F12) e vá para Console:

```javascript
// Deve ver:
✅ Usando Template: products
Confiança: 0.9
🎨 Gerando Layout Visual...
Progresso: 20%
Progresso: 40%
...
✅ Layout visual gerado
```

### Verificar Estado dos Hooks

No console do navegador:

```javascript
// Verificar template canvas
console.log(window.__TEMPLATE_CANVAS_STATE__);

// Verificar visual canvas
console.log(window.__VISUAL_CANVAS_STATE__);

// Verificar contexto do usuário
console.log(window.__USER_CONTEXT__);
```

## 🎯 Casos de Uso

### Caso 1: E-commerce

**Query**: "notebook gamer"

**Resultado Esperado**:
- Layout de produtos
- 3-6 fotos de notebooks
- Preços em destaque
- Links para compra
- Screenshots das páginas

### Caso 2: Notícias

**Query**: "notícias de hoje"

**Resultado Esperado**:
- Layout de notícias
- Ilustrações temáticas
- Cards de notícias
- Fontes e datas

### Caso 3: Comparação

**Query**: "iphone vs samsung"

**Resultado Esperado**:
- Layout de comparação
- Lado a lado
- Ícones e fotos
- Tabela de features

### Caso 4: Galeria

**Query**: "fotos de paisagens"

**Resultado Esperado**:
- Grid de imagens
- 8+ fotos
- Modal de visualização
- Transições suaves

## 🔄 Fluxo Completo

```
1. Usuário abre app
   ↓
2. GenerativeHome aparece
   ↓
3. Usuário clica em card ou digita
   ↓
4. Mensagem enviada
   ↓
5. IA responde
   ↓
6. Sistema analisa resposta
   ↓
7. Decide: Template ou Visual?
   ↓
8. Gera recursos (imagens/screenshots)
   ↓
9. Compõe layout
   ↓
10. Renderiza canvas
    ↓
11. Usuário vê resultado visual
```

## ✅ Verificação Final

Execute este checklist antes de considerar integrado:

```bash
# 1. Backend rodando
curl http://localhost:3001/health
# Esperado: 200 OK

# 2. Rotas de API funcionando
curl -X POST http://localhost:3001/api/generate-images \
  -H "Content-Type: application/json" \
  -d '{"query":"test","context":{}}'
# Esperado: { "images": [...] }

# 3. Frontend rodando
curl http://localhost:3000
# Esperado: HTML do app

# 4. Tela inicial aparece
# Abra http://localhost:3000
# Esperado: Tela com saudação e 4 cards

# 5. Canvas funciona
# Digite "notebook dell" e envie
# Esperado: Layout visual com produtos
```

## 🎉 Pronto!

Se todos os testes passaram, o sistema está integrado e funcionando!

**Próximos passos**:
- Personalize cores e temas
- Adicione mais templates
- Configure mais APIs de imagens
- Ajuste detecções de contexto

**Documentação adicional**:
- [Sistema Visual Completo](./SISTEMA_VISUAL_COMPLETO.md)
- [Arquitetura Completa](./ARQUITETURA_COMPLETA_UI_IA.md)
- [Guia de Templates](./GUIA_CRIAR_TEMPLATES.md)
