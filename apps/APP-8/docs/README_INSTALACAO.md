# 🚀 Instalação - Escolha seu método

## 🎯 Método 1: Automático (Windows)

### Instalar tudo de uma vez:
```
Duplo clique em: INSTALAR_TUDO.bat
```

### Iniciar o sistema:
```
Duplo clique em: INICIAR_SISTEMA.bat
```

Pronto! O sistema vai abrir 3 janelas e iniciar automaticamente.

---

## 🛠️ Método 2: Manual

### 1. Instalar Dependências

**Backend:**
```bash
cd backend
npm install
```

**Executor:**
```bash
cd executor
pip install -r requirements.txt
```

**Frontend:**
```bash
npm install
```

### 2. Iniciar (3 terminais)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Executor:**
```bash
cd executor
python executor.py
```

**Terminal 3 - Frontend:**
```bash
npm run dev
```

### 3. Acessar

Abra: http://localhost:5173

---

## ✅ Verificar Instalação

### Testar Backend:
```bash
curl http://localhost:3001/health
```

Deve retornar: `{"status":"ok"}`

### Testar Executor:
```bash
cd executor
python test_executor.py
```

Deve executar testes de mouse e teclado.

### Testar Frontend:

Acesse http://localhost:5173 e veja a interface.

---

## 🐛 Problemas?

### Python não encontrado
Instale: https://www.python.org/downloads/

### Node.js não encontrado
Instale: https://nodejs.org/

### Porta 3001 em uso
Mude em `backend/.env`:
```
PORT=3002
```

### Executor não conecta
1. Verifique se backend está rodando
2. Verifique token em `backend/.env` e `executor/.env`
3. Reinicie o executor

---

## 📚 Documentação Completa

- `INSTALACAO_COMPLETA.md` - Guia detalhado
- `INICIO_RAPIDO_EXECUTOR.md` - Executor rápido
- `SISTEMA_COMPLETO_ROBOTICS.md` - Sistema completo
- `EXECUTOR_GUIDE.md` - Guia do Executor

---

## 🎉 Pronto!

Após instalar e iniciar, você terá:
- ✅ Backend rodando na porta 3001
- ✅ Executor conectado via WebSocket
- ✅ Frontend em http://localhost:5173

Comece a usar! 🚀
