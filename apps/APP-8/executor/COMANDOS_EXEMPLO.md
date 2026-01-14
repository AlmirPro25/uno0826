# 🎯 Exemplos de Comandos do Executor

## Comandos Básicos

### Mover Mouse
```json
{
  "action": "move",
  "params": {
    "x": 500,
    "y": 300,
    "duration": 0.5
  }
}
```

### Clicar
```json
{
  "action": "click",
  "params": {
    "button": "left"
  }
}
```

### Clicar em Posição Específica
```json
{
  "action": "click",
  "params": {
    "button": "left",
    "x": 500,
    "y": 300
  }
}
```

### Digitar Texto
```json
{
  "action": "type",
  "params": {
    "text": "Olá, mundo!"
  }
}
```

### Pressionar Tecla
```json
{
  "action": "press",
  "params": {
    "key": "enter",
    "presses": 1
  }
}
```

### Atalho de Teclado
```json
{
  "action": "hotkey",
  "params": {
    "keys": ["ctrl", "c"]
  }
}
```

### Screenshot
```json
{
  "action": "screenshot",
  "params": {
    "filename": "captura.png"
  }
}
```

### Rolar Página
```json
{
  "action": "scroll",
  "params": {
    "amount": -3
  }
}
```

### Arrastar Mouse
```json
{
  "action": "drag",
  "params": {
    "x": 100,
    "y": 100,
    "duration": 1.0,
    "button": "left"
  }
}
```

## Comandos em Linguagem Natural

O Gemini Maestro pode interpretar comandos em português e executar ações:

### Exemplo 1: Abrir Aplicativo
```
"Abra o bloco de notas"
```
**Ações executadas:**
1. Pressiona Win+R
2. Digita "notepad"
3. Pressiona Enter

### Exemplo 2: Copiar e Colar
```
"Copie o texto selecionado e cole no campo de busca"
```
**Ações executadas:**
1. Ctrl+C (copiar)
2. Clica no campo de busca
3. Ctrl+V (colar)

### Exemplo 3: Navegação Web
```
"Pesquise por 'Python tutorial' no Google"
```
**Ações executadas:**
1. Clica na barra de endereços
2. Digita "google.com"
3. Pressiona Enter
4. Aguarda carregamento
5. Clica no campo de busca
6. Digita "Python tutorial"
7. Pressiona Enter

### Exemplo 4: Captura de Tela
```
"Tire um print da tela e salve como 'resultado.png'"
```
**Ações executadas:**
1. Captura screenshot
2. Salva como "resultado.png"

### Exemplo 5: Automação de Formulário
```
"Preencha o formulário com nome 'João Silva' e email 'joao@email.com'"
```
**Ações executadas:**
1. Clica no campo nome
2. Digita "João Silva"
3. Pressiona Tab
4. Digita "joao@email.com"

## Sequências Complexas

### Abrir e Configurar Aplicativo
```javascript
const actions = [
  { action: "hotkey", params: { keys: ["win", "r"] } },
  { action: "type", params: { text: "chrome" } },
  { action: "press", params: { key: "enter" } },
  { action: "wait", params: { seconds: 2 } },
  { action: "hotkey", params: { keys: ["ctrl", "t"] } },
  { action: "type", params: { text: "github.com" } },
  { action: "press", params: { key: "enter" } }
];
```

### Automação de Dados
```javascript
const data = [
  { nome: "João", email: "joao@email.com" },
  { nome: "Maria", email: "maria@email.com" }
];

for (const pessoa of data) {
  await executor.click(100, 200); // Campo nome
  await executor.type(pessoa.nome);
  await executor.press("tab");
  await executor.type(pessoa.email);
  await executor.press("enter");
}
```

## Teclas Especiais

### Teclas de Navegação
- `enter` - Enter
- `tab` - Tab
- `esc` - Escape
- `space` - Espaço
- `backspace` - Backspace
- `delete` - Delete

### Teclas de Seta
- `up` - Seta para cima
- `down` - Seta para baixo
- `left` - Seta para esquerda
- `right` - Seta para direita

### Teclas de Função
- `f1` até `f12` - Teclas F1-F12

### Teclas Modificadoras
- `ctrl` - Control
- `alt` - Alt
- `shift` - Shift
- `win` - Windows/Command

### Teclas de Página
- `pageup` - Page Up
- `pagedown` - Page Down
- `home` - Home
- `end` - End

## Dicas de Uso

### 1. Adicione Pausas
```json
{
  "action": "type",
  "params": {
    "text": "texto lento",
    "interval": 0.1
  }
}
```

### 2. Use Coordenadas Relativas
```javascript
// Obter tamanho da tela
const screen = await executor.getScreenInfo();
const centerX = screen.screen.width / 2;
const centerY = screen.screen.height / 2;

// Clicar no centro
await executor.click(centerX, centerY);
```

### 3. Capture Antes de Agir
```javascript
// Captura tela para análise
await executor.screenshot("antes.png");

// Executa ação
await executor.click(500, 300);

// Captura resultado
await executor.screenshot("depois.png");
```

### 4. Tratamento de Erros
```javascript
try {
  await executor.click(500, 300);
  await executor.type("texto");
} catch (error) {
  console.error("Erro na automação:", error);
  await executor.screenshot("erro.png");
}
```

## Limitações

- ⚠️ Não funciona em jogos com proteção anti-cheat
- ⚠️ Pode ser bloqueado por alguns aplicativos
- ⚠️ Coordenadas são absolutas (dependem da resolução)
- ⚠️ Velocidade limitada para segurança

## Boas Práticas

1. ✅ Sempre teste em ambiente controlado
2. ✅ Use paradas de emergência
3. ✅ Adicione logs detalhados
4. ✅ Valide resultados após cada ação
5. ✅ Mantenha backups antes de automações críticas
