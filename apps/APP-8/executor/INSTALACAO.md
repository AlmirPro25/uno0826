# 🚀 Instalação do Gemini Executor

## Pré-requisitos

- Python 3.10 ou superior
- pip (gerenciador de pacotes Python)

## Passo a Passo

### 1. Instalar Python

Se você ainda não tem Python instalado:

**Windows:**
```bash
# Baixe do site oficial: https://www.python.org/downloads/
# Durante a instalação, marque "Add Python to PATH"
```

**Verificar instalação:**
```bash
python --version
pip --version
```

### 2. Instalar Dependências

Navegue até a pasta `executor/` e execute:

```bash
cd executor
pip install -r requirements.txt
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```bash
copy .env.example .env
```

Edite o `.env` e configure o token (deve ser o mesmo do backend):
```
AUTH_TOKEN=gemini_executor_secret_2024
```

### 4. Executar o Executor

```bash
python executor.py
```

Você verá:
```
╔═══════════════════════════════════════════════╗
║       🎮 GEMINI EXECUTOR v1.0                 ║
║   Automação física coordenada pelo Maestro    ║
╚═══════════════════════════════════════════════╝

🎮 Gemini Executor inicializado
📡 Conectando ao Maestro em: ws://localhost:8081
```

### 5. Conectar no Frontend

1. Abra a interface web
2. Vá até o painel do Executor
3. Clique em "Conectar"
4. Aguarde a confirmação ✅

## Solução de Problemas

### Erro: "No module named 'pyautogui'"
```bash
pip install pyautogui
```

### Erro: "Connection refused"
- Certifique-se de que o backend está rodando na porta 3001
- Verifique se o token no `.env` está correto

### Erro: "Permission denied" (Linux/Mac)
```bash
# Pode precisar de permissões especiais para controlar mouse/teclado
sudo python executor.py
```

### PyAutoGUI não funciona no Windows
- Instale o Pillow: `pip install pillow`
- Reinicie o terminal

## Segurança

⚠️ **IMPORTANTE:**
- O Executor tem controle total do seu computador
- Use apenas em ambiente controlado
- Sempre supervisione as ações
- Pressione ESC para parada de emergência
- Mantenha o token secreto

## Próximos Passos

Após conectar com sucesso:
1. Teste comandos simples (mover mouse, clicar)
2. Experimente comandos em linguagem natural
3. Integre com o Gemini Maestro para automação inteligente
