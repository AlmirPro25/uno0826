# 🎨 Sistema de Geração de Imagens IA

Sistema integrado de geração automática de imagens usando **Gemini 2.0 Flash Preview Image Generation** para o AI Web Weaver.

## 🚀 Funcionalidades

- **Geração Automática**: Detecta placeholders e gera imagens automaticamente
- **URLs Locais**: Salva imagens no servidor para manter o código limpo
- **Integração Seamless**: Funciona com o sistema existente do GeminiService
- **Análise Contextual**: Usa o contexto do HTML para gerar imagens mais precisas
- **Fallback Inteligente**: Placeholders SVG em caso de erro
- **Limpeza Automática**: Remove imagens antigas automaticamente

## 📋 Pré-requisitos

1. **Chave da API Gemini**: Configure `GEMINI_API_KEY` ou `API_KEY` no `.env.local`
2. **Node.js**: Versão 18+ para o backend
3. **Dependências**: `@google/genai` e `uuid` instaladas

## ⚡ Configuração Rápida

```bash
# 1. Execute o script de configuração
node scripts/setup-image-server.js

# 2. Configure sua API key
echo "GEMINI_API_KEY=sua_chave_aqui" >> .env.local

# 3. Instale dependências do backend
cd backend && npm install

# 4. Inicie o servidor
npm run dev
```

## 🎯 Como Usar

### 1. Placeholders no HTML

Use o formato especial para placeholders de imagem:

```html
<img 
    src="ai-researched-image://pizza margherita artesanal com mussarela de búfala em forno a lenha"
    alt="Pizza Margherita"
    class="w-full h-48 object-cover"
/>
```

### 2. Processamento Automático

```typescript
import { useEnhancedAI } from '../hooks/useEnhancedAI';

const { generateCode, isGenerating, imagesGenerated } = useEnhancedAI({
  generateImages: true,
  projectId: 'meu-projeto'
});

// Gera código com imagens automaticamente
const result = await generateCode("Crie um site de restaurante");
```

### 3. Processamento Manual

```typescript
import { imageGenerationService } from '../services/ImageGenerationService';

const result = await imageGenerationService.processHtmlAndGenerateImages(
  htmlContent,
  'projeto-id'
);

console.log(`${result.imagesGenerated} imagens geradas!`);
```

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│ • ImageGenerationManager (Component)                        │
│ • useEnhancedAI (Hook)                                      │
│ • ImageGenerationService (Service)                          │
│ • EnhancedGeminiService (Enhanced AI)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                        │
├─────────────────────────────────────────────────────────────┤
│ • /api/images/process (Endpoint principal)                  │
│ • /api/images/generated/:filename (Servir imagens)          │
│ • /api/images/placeholder (Placeholders SVG)                │
│ • /api/images/cleanup (Limpeza automática)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 GEMINI 2.0 FLASH PREVIEW                   │
├─────────────────────────────────────────────────────────────┤
│ • Model: gemini-2.0-flash-preview-image-generation         │
│ • Response Modalities: [TEXT, IMAGE]                       │
│ • Geração de imagens de alta qualidade                     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura de Arquivos

```
backend/
├── src/api/controllers/imageController.ts    # Lógica principal
├── src/api/routes/imageRoutes.ts            # Rotas da API
└── public/generated-images/                 # Imagens salvas

services/
├── ImageGenerationService.ts               # Cliente frontend
└── EnhancedGeminiService.ts                # IA aprimorada

components/
├── ImageGenerationManager.tsx              # UI de controle
└── ImageGenerationDemo.tsx                 # Demonstração

hooks/
└── useEnhancedAI.ts                        # Hook personalizado
```

## 🔧 API Endpoints

### POST /api/images/process
Processa HTML e gera imagens automaticamente.

**Request:**
```json
{
  "htmlContent": "<html>...</html>",
  "projectId": "opcional"
}
```

**Response:**
```json
{
  "success": true,
  "htmlContent": "<html com URLs reais>",
  "imagesGenerated": 3,
  "images": [
    {
      "id": "uuid",
      "url": "/api/images/generated/filename.png",
      "description": "descrição da imagem"
    }
  ]
}
```

### GET /api/images/generated/:filename
Serve imagens geradas com cache otimizado.

### GET /api/images/placeholder?text=descrição
Gera placeholder SVG dinâmico.

### DELETE /api/images/cleanup
Remove imagens antigas (24h+).

## 🎨 Exemplos de Placeholders

### Restaurante/Comida
```html
src="ai-researched-image://pizza margherita artesanal com mussarela de búfala, tomate san marzano e manjericão fresco em forno a lenha, fotografia profissional de comida"
```

### E-commerce
```html
src="ai-researched-image://smartphone moderno preto em fundo minimalista branco, fotografia de produto profissional, iluminação suave"
```

### Interiores
```html
src="ai-researched-image://sala de estar moderna com sofá cinza, plantas, iluminação natural, estilo escandinavo, fotografia de arquitetura"
```

### Pessoas/Profissionais
```html
src="ai-researched-image://mulher profissional sorrindo em escritório moderno, roupa executiva, iluminação natural, fotografia corporativa"
```

## ⚙️ Configurações Avançadas

### Personalizar Qualidade das Imagens

```typescript
// No imageController.ts
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash-preview-image-generation",
  contents: [{ text: enhancedPrompt }],
  config: {
    responseModalities: [Modality.TEXT, Modality.IMAGE],
    temperature: 0.7, // Ajustar criatividade
    topK: 40,         // Controle de diversidade
    topP: 0.95        // Controle de foco
  },
});
```

### Cache e Performance

```typescript
// Configurar cache no ImageGenerationService
const cacheOptions = {
  useCache: true,        // Habilitar cache
  cacheTime: 300000,     // 5 minutos
  maxCacheSize: 100      // Máximo 100 entradas
};
```

### Rate Limiting

```typescript
// Configurar limites no backend
const rateLimits = {
  maxRequests: 60,       // 60 requests por minuto
  windowMs: 60000,       // Janela de 1 minuto
  maxImagesPerRequest: 10 // Máximo 10 imagens por request
};
```

## 🐛 Troubleshooting

### Erro: "Gemini API Key não configurada"
```bash
# Verificar variáveis de ambiente
echo $GEMINI_API_KEY
# ou
cat .env.local | grep API_KEY
```

### Erro: "Circuit breaker is open"
```bash
# Aguardar 1 minuto ou reiniciar servidor
# Verificar logs para identificar causa das falhas
```

### Imagens não aparecem
```bash
# Verificar se o diretório existe
ls -la backend/public/generated-images/

# Verificar permissões
chmod 755 backend/public/generated-images/
```

### Performance lenta
```bash
# Limpar imagens antigas
curl -X DELETE http://localhost:3001/api/images/cleanup

# Verificar uso de memória
node --max-old-space-size=4096 backend/dist/server.js
```

## 📊 Monitoramento

### Métricas Importantes
- **Taxa de sucesso**: % de imagens geradas com sucesso
- **Tempo médio**: Tempo de geração por imagem
- **Uso de API**: Requests por minuto
- **Armazenamento**: Espaço usado pelas imagens

### Logs
```bash
# Backend logs
tail -f backend/logs/image-generation.log

# Frontend logs (DevTools Console)
# Procurar por: 🎨, 📸, ✅, ❌
```

## 🚀 Deploy em Produção

### Variáveis de Ambiente
```bash
GEMINI_API_KEY=sua_chave_de_producao
NODE_ENV=production
IMAGE_STORAGE_PATH=/app/public/generated-images
MAX_IMAGE_SIZE=5MB
CLEANUP_INTERVAL=24h
```

### Docker
```dockerfile
# Adicionar ao Dockerfile
RUN mkdir -p /app/public/generated-images
VOLUME ["/app/public/generated-images"]
```

### Nginx
```nginx
# Servir imagens estaticamente
location /api/images/generated/ {
    alias /app/public/generated-images/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🎯 Próximos Passos

1. **Otimização de Imagens**: Compressão automática WebP
2. **CDN Integration**: Upload para Cloudinary/AWS S3
3. **Batch Processing**: Processar múltiplas imagens em paralelo
4. **AI Upscaling**: Melhorar qualidade automaticamente
5. **Style Transfer**: Aplicar estilos consistentes
6. **Background Removal**: Remoção automática de fundo

---

**🎉 Sistema pronto para produção em 30 minutos!**

Para suporte: [Documentação completa](./README.md) | [Issues](./issues)