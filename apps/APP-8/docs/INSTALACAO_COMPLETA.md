# 🚀 Instalação Completa - Guia Rápido

## 📋 Pré-requisitos

- Node.js 18+ 
- Python 3.10+
- npm ou yarn

## ⚡ Instalação Rápida (5 minutos)

### 1️⃣ Instalar Dependências do Backend

```bash
cd backend
npm install
```

### 2️⃣ Instalar Dependências do Executor (Python)

```bash
cd executor
pip install -r requirements.txt
```

**OU no Windows, use o atalho:**
- Duplo clique em `executor/START_EXECUTOR.bat` (instala automaticamente)

### 3️⃣ Instalar Dependências do Frontend

```bash
# Na raiz do projeto
npm install
```

### 4️⃣ Configurar Variáveis de Ambiente

Os arquivos `.env` já estão configurados! Apenas verifique:

**backend/.env** - ✅ Já configurado
**executor/.env** - ✅ Já configurado

## 🎮 Iniciar o Sistema

Abra **3 terminais** e execute:

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Aguarde ver:
```
🚀 Gemini Companion Backend
📡 Server running on http://localhost:3001
```

### Terminal 2 - Executor
```bash
cd executor
python executor.py
```

**OU no Windows:**
- Duplo clique em `executor/START_EXECUTOR.bat`

Aguarde ver:
```
🎮 GEMINI EXECUTOR v1.0
📡 Conectando ao Maestro...
```

### Terminal 3 - Frontend
```bash
npm run dev
```

Aguarde ver:
```
Local: http://localhost:5173
```

## ✅ Testar Instalação

1. Abra http://localhost:5173
2. Adicione o componente na sua interface
3. Teste o Executor Control
4. Clique em "Conectar"

Se aparecer "✅ Conectado", está tudo funcionando!

## 🧪 Testar Executor (Opcional)

Antes de conectar, teste o executor:

```bash
cd executor
python test_executor.py
```

**OU:**
- Duplo clique em `executor/TEST_EXECUTOR.bat`

## 🐛 Problemas Comuns

### Executor não conecta
```bash
# Verifique se o backend está rodando
curl http://localhost:3001/health
```

### Python não encontrado
Instale Python 3.10+ de: https://www.python.org/downloads/

### Dependências Python falharam
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

## 📚 Próximos Passos

Leia:
- `SISTEMA_COMPLETO_ROBOTICS.md` - Guia completo
- `EXECUTOR_GUIDE.md` - Documentação do Executor
- `GEMINI_ROBOTICS_INTEGRATION.md` - Arquitetura técnica

Pronto! Sistema instalado e rodando! 🎉
