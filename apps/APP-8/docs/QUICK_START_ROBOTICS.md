# 🚀 QUICK START - VISÃO ROBÓTICA

## ⚡ COMEÇAR EM 3 PASSOS

### 1️⃣ Inicie o Backend
```bash
cd backend
npm run dev
```

### 2️⃣ Inicie o Executor Python
```bash
cd executor
py executor.py
```

### 3️⃣ Teste a API
```bash
# Detectar botões na tela
curl -X POST http://localhost:3001/api/robotics/detect-2d \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"buttons\", \"maxItems\": 10}"

# Encontrar e clicar em um botão
curl -X POST http://localhost:3001/api/robotics/find-and-click \
  -H "Content-Type: application/json" \
  -d "{\"targetItem\": \"close button\"}"
```

## 🎯 EXEMPLOS RÁPIDOS

### Detectar Objetos
```typescript
import { roboticsVisionService } from './services/roboticsVisionService';

// Detecta botões
const buttons = await roboticsVisionService.detect2DBoundingBoxes('buttons', 20);
console.log(`Encontrados ${buttons.length} botões`);

// Detecta ícones
const icons = await roboticsVisionService.detectPoints('icons', 10);
console.log(`Encontrados ${icons.length} ícones`);
```

### Encontrar e Clicar
```typescript
// Encontra e clica automaticamente
const result = await roboticsVisionService.findAndClick('search button');

if (result.success) {
  console.log(`✅ Clicado em "${result.label}"`);
} else {
  console.log('❌ Botão não encontrado');
}
```

### Com Comandos de Voz
```typescript
// Em liveCommandService.ts
if (cmd.includes('clique no')) {
  const target = cmd.replace(/.*clique no\s+/i, '');
  const result = await roboticsVisionService.findAndClick(target);
  
  return {
    success: result.success,
    response: result.success 
      ? `✅ Clicado em "${result.label}"` 
      : `❌ "${target}" não encontrado`
  };
}
```

## 📊 3 MODOS DE DETECÇÃO

### 📦 2D Bounding Boxes (Recomendado)
Melhor para: Botões, janelas, áreas clicáveis
```typescript
const boxes = await roboticsVisionService.detect2DBoundingBoxes('buttons');
// Retorna: [{ x, y, width, height, label }]
```

### 📍 Points (Mais Rápido)
Melhor para: Ícones, pontos específicos
```typescript
const points = await roboticsVisionService.detectPoints('icons');
// Retorna: [{ x, y, label }]
```

### 🎨 Segmentation Masks (Mais Preciso)
Melhor para: Segmentação avançada, objetos complexos
```typescript
const masks = await roboticsVisionService.detectSegmentationMasks('items');
// Retorna: [{ x, y, width, height, label, imageData }]
```

## 🎛️ THINKING MODE

### Desabilitado (Padrão) - Rápido
```typescript
const boxes = await roboticsVisionService.detect2DBoundingBoxes('buttons', 20, false);
// ⚡ Rápido para tarefas simples
```

### Habilitado - Preciso
```typescript
const boxes = await roboticsVisionService.detect2DBoundingBoxes('buttons', 20, true);
// 🧠 Mais lento, mas mais preciso para cenas complexas
```

## 🔌 ENDPOINTS DA API

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/robotics/detect-2d` | POST | Detecta com bounding boxes |
| `/api/robotics/detect-points` | POST | Detecta pontos |
| `/api/robotics/detect-masks` | POST | Detecta máscaras |
| `/api/robotics/find-and-click` | POST | Encontra e clica |

## 💡 DICAS

### ✅ Faça
- Use `detect-2d` para a maioria dos casos
- Use `detectPoints` quando precisar apenas de coordenadas
- Desabilite thinking para tarefas simples
- Limite `maxItems` para melhor performance

### ❌ Evite
- Habilitar thinking desnecessariamente (mais lento)
- Detectar muitos objetos de uma vez (>30)
- Usar segmentation masks para tarefas simples

## 🎯 CASOS DE USO COMUNS

### 1. Clicar em Botão
```typescript
await roboticsVisionService.findAndClick('submit button');
```

### 2. Preencher Formulário
```typescript
// Encontra campo de email
await roboticsVisionService.findAndClick('email field');
await executorService.type('[email]@example.com');

// Encontra botão de enviar
await roboticsVisionService.findAndClick('submit button');
```

### 3. Navegar em Menu
```typescript
// Detecta itens do menu
const items = await roboticsVisionService.detect2DBoundingBoxes('menu items', 10);

// Clica no primeiro
if (items.length > 0) {
  const screenInfo = await executorService.getScreenInfo();
  const x = (items[0].x + items[0].width / 2) * screenInfo.screen.width;
  const y = (items[0].y + items[0].height / 2) * screenInfo.screen.height;
  await executorService.click('left', x, y);
}
```

## 🐛 TROUBLESHOOTING

### Erro: "Executor não está conectado"
```bash
# Inicie o executor Python
cd executor
py executor.py
```

### Erro: "API Key não configurada"
```bash
# Configure a API key no .env
echo "GEMINI_API_KEY=sua_chave_aqui" > backend/.env
```

### Objeto não encontrado
- Tente habilitar thinking mode
- Use descrição mais específica
- Verifique se o objeto está visível na tela

## 📚 DOCUMENTAÇÃO COMPLETA

- `ROBOTICS_VISION_INTEGRATION.md` - Documentação técnica completa
- `INTEGRACAO_VISAO_ROBOTICA.md` - Guia de integração
- `backend/examples/robotics-vision-examples.ts` - 7 exemplos práticos

## 🎊 PRONTO!

Agora você pode usar visão robótica profissional no seu sistema! 🤖👁️✨
