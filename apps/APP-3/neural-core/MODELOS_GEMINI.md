# 🤖 Modelos Gemini Suportados

## 📊 Modelos Disponíveis (Atualizados 2025)

### 🏆 Modelos Mais Recentes

#### 1. `gemini-2.5-pro` 
**O Mais Poderoso**

- ✅ Melhor qualidade de código
- ✅ Raciocínio mais profundo
- ✅ Ideal para projetos complexos
- ⚠️ Mais lento
- ⚠️ Mais caro

**Quando usar:**
- Fintechs com arquitetura complexa
- Sistemas enterprise-grade
- Projetos que exigem máxima qualidade

**Exemplo:**
```json
{
  "prompt": "Crie um banco digital completo com PIX",
  "modelName": "gemini-2.5-pro"
}
```

---

#### 2. `gemini-2.5-flash` ⭐ **PADRÃO**
**Equilíbrio Perfeito**

- ✅ Rápido
- ✅ Qualidade excelente
- ✅ Custo-benefício ideal
- ✅ Recomendado para 90% dos casos

**Quando usar:**
- Projetos fullstack
- Apps completos
- Uso geral

**Exemplo:**
```json
{
  "prompt": "Crie um app de pizzaria",
  "modelName": "gemini-2.5-flash"
}
```

---

#### 3. `gemini-flash-latest`
**Sempre Atualizado**

- ✅ Sempre a versão mais recente do Flash
- ✅ Atualizações automáticas do Google
- ✅ Sem precisar mudar código

**Quando usar:**
- Quer sempre a versão mais recente
- Não quer se preocupar com versões

**Exemplo:**
```json
{
  "prompt": "Crie um dashboard",
  "modelName": "gemini-flash-latest"
}
```

---

#### 4. `gemini-flash-lite-latest`
**Ultra-Rápido**

- ✅ Mais rápido de todos
- ✅ Menor custo
- ⚠️ Qualidade um pouco menor
- ✅ Ideal para prototipagem

**Quando usar:**
- Prototipagem rápida
- Projetos simples
- Testes e experimentação

**Exemplo:**
```json
{
  "prompt": "Crie um botão vermelho",
  "modelName": "gemini-flash-lite-latest"
}
```

---

### 🔄 Modelos Anteriores (Compatibilidade)

#### `gemini-2.0-flash-exp`
- Experimental
- Pode ter instabilidades
- Use apenas para testes

#### `gemini-1.5-flash`
- Versão anterior do Flash
- Ainda funciona, mas desatualizado

#### `gemini-1.5-pro`
- Versão anterior do Pro
- Substituído pelo 2.5-pro

---

## 📊 Comparação de Modelos

| Modelo | Velocidade | Qualidade | Custo | Uso Recomendado |
|--------|-----------|-----------|-------|-----------------|
| **gemini-2.5-pro** | 🐢 Lento | 🏆 Máxima | 💰💰💰 Alto | Projetos complexos |
| **gemini-2.5-flash** ⭐ | ⚡ Rápido | 🏆 Excelente | 💰 Médio | Uso geral |
| **gemini-flash-latest** | ⚡ Rápido | 🏆 Excelente | 💰 Médio | Sempre atualizado |
| **gemini-flash-lite-latest** | 🚀 Ultra | ✅ Boa | 💵 Baixo | Prototipagem |

---

## 🎯 Recomendações por Tipo de Projeto

### Fintech / Banco Digital
```json
{
  "modelName": "gemini-2.5-pro"
}
```
**Por quê:** Precisa de máxima qualidade e compliance

---

### App Fullstack Completo
```json
{
  "modelName": "gemini-2.5-flash"
}
```
**Por quê:** Equilíbrio perfeito entre velocidade e qualidade

---

### Landing Page / Site Simples
```json
{
  "modelName": "gemini-flash-lite-latest"
}
```
**Por quê:** Rápido e suficiente para projetos simples

---

### Jogo Complexo
```json
{
  "modelName": "gemini-2.5-flash"
}
```
**Por quê:** Precisa de lógica de game loop bem estruturada

---

### Prototipagem Rápida
```json
{
  "modelName": "gemini-flash-lite-latest"
}
```
**Por quê:** Velocidade é prioridade

---

## 🔧 Como Configurar

### No Neural Core

**Padrão (automático):**
```typescript
// Usa gemini-2.5-flash automaticamente
const response = await fetch('/api/generate', {
  body: JSON.stringify({ prompt: "..." })
});
```

**Especificar modelo:**
```typescript
const response = await fetch('/api/generate', {
  body: JSON.stringify({ 
    prompt: "...",
    modelName: "gemini-2.5-pro" // ← Escolher modelo
  })
});
```

### No Frontend

```typescript
const result = await generateAiResponse(
  prompt,
  'generate_code_no_plan',
  'gemini-2.5-pro' // ← Escolher modelo
);
```

---

## 💡 Dicas de Uso

### 1. Use o Padrão (2.5-flash)
Para 90% dos casos, o padrão é perfeito.

### 2. Use Pro para Projetos Críticos
Fintechs, sistemas médicos, projetos enterprise.

### 3. Use Lite para Testes
Prototipagem rápida, experimentação.

### 4. Use Latest para Sempre Atualizado
Se não quer se preocupar com versões.

---

## 🚀 Exemplos Práticos

### Exemplo 1: Fintech com Pro

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Crie um banco digital com PIX e transações atômicas",
    "modelName": "gemini-2.5-pro",
    "temperature": 0.7
  }'
```

### Exemplo 2: App Rápido com Flash

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Crie um app de tarefas",
    "modelName": "gemini-2.5-flash"
  }'
```

### Exemplo 3: Protótipo com Lite

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Crie um botão animado",
    "modelName": "gemini-flash-lite-latest"
  }'
```

---

## 📈 Performance Esperada

### gemini-2.5-pro
- Tempo médio: 5-10 segundos
- Qualidade: 95-100/100
- Tokens: Até 8192

### gemini-2.5-flash ⭐
- Tempo médio: 2-4 segundos
- Qualidade: 90-95/100
- Tokens: Até 8192

### gemini-flash-lite-latest
- Tempo médio: 1-2 segundos
- Qualidade: 80-90/100
- Tokens: Até 8192

---

## ✅ Checklist de Escolha

**Use `gemini-2.5-pro` se:**
- [ ] Projeto crítico (fintech, saúde, etc)
- [ ] Precisa de máxima qualidade
- [ ] Complexidade alta
- [ ] Custo não é problema

**Use `gemini-2.5-flash` se:** ⭐
- [ ] Projeto normal
- [ ] Quer equilíbrio
- [ ] Uso geral
- [ ] Recomendado para 90% dos casos

**Use `gemini-flash-lite-latest` se:**
- [ ] Prototipagem
- [ ] Projeto simples
- [ ] Velocidade é prioridade
- [ ] Custo é importante

---

**Modelo padrão recomendado:** `gemini-2.5-flash` ⭐
