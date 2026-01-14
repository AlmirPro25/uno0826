# 🧪 GUIA DE TESTE - ROBOTICS VISION

## 🚀 PREPARAÇÃO

### 1. Inicie o Backend
```bash
cd backend
npm run dev
```

### 2. Inicie o Executor Python
```bash
cd executor
py executor.py
```

### 3. Verifique Conexão
```bash
# Deve retornar status ok
curl http://localhost:3001/health
```

## 🎯 TESTES BÁSICOS

### Teste 1: Detectar Botões
```bash
curl -X POST http://localhost:3001/api/robotics/detect-2d \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"buttons\", \"maxItems\": 10}"
```

**Resultado Esperado:**
```json
{
  "success": true,
  "count": 5,
  "boxes": [
    {
      "x": 0.1,
      "y": 0.2,
      "width": 0.15,
      "height": 0.08,
      "label": "Close button"
    }
  ]
}
```

### Teste 2: Detectar Pontos
```bash
curl -X POST http://localhost:3001/api/robotics/detect-points \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"icons\", \"maxItems\": 10}"
```

### Teste 3: Find and Click
```bash
curl -X POST http://localhost:3001/api/robotics/find-and-click \
  -H "Content-Type: application/json" \
  -d "{\"targetItem\": \"close button\"}"
```

**Resultado Esperado:**
```json
{
  "success": true,
  "found": true,
  "clicked": { "x": 1850, "y": 50 },
  "label": "Close button"
}
```

## 🎙️ TESTES COM COMANDOS DE VOZ

### Teste 4: Clicar em Elemento
1. Abra o frontend
2. Inicie uma sessão Live
3. Fale: **"Clique no botão de fechar"**

**Resultado Esperado:**
- ✅ Sistema detecta comando
- ✅ Robotics Vision encontra botão
- ✅ Clica automaticamente
- ✅ Resposta: "Clicado em 'Close button'"

### Teste 5: Listar Elementos
Fale: **"Mostre todos os botões"**

**Resultado Esperado:**
- ✅ Detecta todos os botões
- ✅ Lista os nomes
- ✅ Resposta: "Encontrei 8 botões: ..."

### Teste 6: Clicar no Primeiro
Fale: **"Clique no primeiro vídeo"**

**Resultado Esperado:**
- ✅ Detecta vídeos
- ✅ Clica no primeiro
- ✅ Resposta: "Clicado no primeiro 'Video Thumbnail'"

## 🎨 TESTES VISUAIS

### Teste 7: Overlay de Bounding Boxes
```tsx
import { RoboticsOverlay } from './components/RoboticsOverlay';

<RoboticsOverlay
  enabled={true}
  targetItems="buttons"
  detectType="2D bounding boxes"
/>
```

**Resultado Esperado:**
- ✅ Caixas roxas ao redor dos botões
- ✅ Labels com nomes
- ✅ Hover funciona

### Teste 8: Overlay de Pontos
```tsx
<RoboticsOverlay
  enabled={true}
  targetItems="icons"
  detectType="Points"
/>
```

**Resultado Esperado:**
- ✅ Pontos verdes nos ícones
- ✅ Animação de pulso
- ✅ Labels com nomes

## 🗄️ TESTES DE CACHE

### Teste 9: Cache Hit
```typescript
import { useRoboticsCache } from './hooks/useRoboticsCache';

const { detectWithCache } = useRoboticsCache();

// Primeira chamada (MISS)
const data1 = await detectWithCache('buttons', '2D bounding boxes');
console.log('Primeira: ', data1); // Deve demorar ~2s

// Segunda chamada (HIT)
const data2 = await detectWithCache('buttons', '2D bounding boxes');
console.log('Segunda: ', data2); // Deve ser instantâneo
```

**Resultado Esperado:**
```
🔍 Cache MISS: buttons (2D bounding boxes) - Detectando...
💾 Cache SET: buttons (2D bounding boxes)
✅ Cache HIT: buttons (2D bounding boxes)
```

### Teste 10: Cache Cleanup
```typescript
const { cleanup, cacheSize } = useRoboticsCache({ maxAge: 5000 });

console.log('Tamanho inicial:', cacheSize);

// Aguarda 6 segundos
await new Promise(resolve => setTimeout(resolve, 6000));

cleanup();
console.log('Tamanho após cleanup:', cacheSize);
```

## 🎼 TESTES DE INTEGRAÇÃO

### Teste 11: Maestro + Robotics
```typescript
import { geminiMaestro } from './services/geminiMaestro';

const result = await geminiMaestro.findAndClickWithRobotics('submit button');
console.log(result);
```

**Resultado Esperado:**
```json
{
  "success": true,
  "found": true,
  "clicked": { "x": 800, "y": 600 },
  "label": "Submit button",
  "explanation": "✅ Encontrado e clicado em 'Submit button' usando Robotics Vision"
}
```

### Teste 12: Live Command + Robotics
1. Inicie sessão Live
2. Fale: **"Clique no botão de pesquisa"**
3. Verifique logs do backend

**Logs Esperados:**
```
🎯 COMANDO RECEBIDO DA LIVE
📝 Comando: "Clique no botão de pesquisa"
🤖 Comando com Robotics Vision: Clicar em elemento
🎯 Procurando: "botão de pesquisa"
🤖 Detectando "botão de pesquisa" com Robotics Vision...
✅ Detectados 1 objetos: Search button
🖱️  Clicando em (1200, 100) - Search button
✅ COMANDO EXECUTADO COM SUCESSO
```

## 🧠 TESTES COM THINKING MODE

### Teste 13: Sem Thinking (Rápido)
```bash
curl -X POST http://localhost:3001/api/robotics/detect-2d \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"buttons\", \"enableThinking\": false}"
```

**Tempo Esperado:** ~1-2 segundos

### Teste 14: Com Thinking (Preciso)
```bash
curl -X POST http://localhost:3001/api/robotics/detect-2d \
  -H "Content-Type: application/json" \
  -d "{\"targetItems\": \"all interactive elements\", \"enableThinking\": true}"
```

**Tempo Esperado:** ~3-5 segundos
**Precisão:** Maior

## 📊 TESTES DE PERFORMANCE

### Teste 15: Múltiplas Detecções
```typescript
const start = Date.now();

for (let i = 0; i < 5; i++) {
  await roboticsVisionService.detect2DBoundingBoxes('buttons', 10);
}

const duration = Date.now() - start;
console.log(`5 detecções em ${duration}ms (média: ${duration/5}ms)`);
```

**Resultado Esperado:**
- Sem cache: ~10-15s total
- Com cache: ~2-3s total

### Teste 16: Comparação de Modos
```typescript
// 2D Boxes
const start1 = Date.now();
const boxes = await roboticsVisionService.detect2DBoundingBoxes('buttons', 10);
const time1 = Date.now() - start1;

// Points
const start2 = Date.now();
const points = await roboticsVisionService.detectPoints('buttons', 10);
const time2 = Date.now() - start2;

console.log(`2D Boxes: ${time1}ms`);
console.log(`Points: ${time2}ms`);
```

## 🐛 TESTES DE ERRO

### Teste 17: Elemento Não Encontrado
```bash
curl -X POST http://localhost:3001/api/robotics/find-and-click \
  -H "Content-Type: application/json" \
  -d "{\"targetItem\": \"elemento_que_nao_existe\"}"
```

**Resultado Esperado:**
```json
{
  "success": false,
  "found": false
}
```

### Teste 18: Executor Desconectado
1. Pare o executor Python
2. Tente detectar elementos

**Resultado Esperado:**
```json
{
  "error": "Executor não está conectado"
}
```

### Teste 19: API Key Inválida
1. Configure API key inválida no .env
2. Tente detectar elementos

**Resultado Esperado:**
```json
{
  "error": "Invalid API key"
}
```

## ✅ CHECKLIST DE TESTES

### Funcionalidades Básicas
- [ ] Detectar botões (2D boxes)
- [ ] Detectar ícones (Points)
- [ ] Detectar máscaras (Segmentation)
- [ ] Find and click automático

### Comandos de Voz
- [ ] "Clique no [elemento]"
- [ ] "Encontre o [elemento]"
- [ ] "Mostre todos os botões"
- [ ] "Clique no primeiro [elemento]"

### Interface Visual
- [ ] Overlay de bounding boxes
- [ ] Overlay de pontos
- [ ] Auto-refresh funciona
- [ ] Animações suaves

### Cache
- [ ] Cache hit funciona
- [ ] Cache miss funciona
- [ ] Cleanup automático
- [ ] Limite de entradas

### Integração
- [ ] Maestro + Robotics
- [ ] Live Commands + Robotics
- [ ] Task Planner + Robotics
- [ ] Executor + Robotics

### Performance
- [ ] Detecção rápida (<2s)
- [ ] Cache instantâneo (<0.1s)
- [ ] Thinking mode mais lento mas preciso
- [ ] Múltiplas detecções eficientes

### Erros
- [ ] Elemento não encontrado
- [ ] Executor desconectado
- [ ] API key inválida
- [ ] Timeout de detecção

## 🎊 RESULTADO ESPERADO

Após todos os testes, você deve ter:

✅ **100% de sucesso** em detecções básicas
✅ **95%+ de precisão** em find and click
✅ **<2s** de tempo de resposta sem cache
✅ **<0.1s** de tempo de resposta com cache
✅ **Comandos de voz** funcionando perfeitamente
✅ **Overlay visual** mostrando detecções
✅ **Cache** otimizando performance

## 🚀 PRÓXIMO PASSO

Se todos os testes passaram, seu sistema está **100% funcional**!

Agora você pode:
1. Usar em produção
2. Adicionar mais comandos
3. Criar workflows complexos
4. Integrar com outras ferramentas

**Parabéns! Seu sistema de visão robótica está completo! 🤖👁️✨**
