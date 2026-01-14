# 🤖 MediSync WhatsApp Service + Gemini AI

Serviço de notificações multicanal (WhatsApp + Email) com atendente de IA integrado usando Google Gemini 2.0.

## 📋 Funcionalidades

### WhatsApp (via whatsapp-web.js)
- ✅ **Notificações automáticas**
  - Confirmação de agendamento
  - Lembretes de consultas
  - Códigos de verificação (2FA futuro)
- ✅ **Atendente de IA (ARIA)**
  - Respostas automáticas 24/7
  - Agendamento de consultas
  - Informações sobre a plataforma
  - Contexto de conversa mantido

### Email (via Nodemailer)
- ✅ Confirmação de agendamento
- ✅ Lembretes de consultas
- ✅ Códigos de verificação
- ✅ Email de boas-vindas
- ✅ Templates HTML profissionais

## 🚀 Início Rápido

### 1. Instalar dependências

```bash
cd whatsapp-service
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Obrigatório para IA
GEMINI_API_KEY=sua_chave_api_aqui

# Opcional para email
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
```

**Obter Gemini API Key:** https://makersuite.google.com/app/apikey

### 3. Iniciar o serviço

```bash
npm start
# ou para desenvolvimento com hot-reload:
npm run dev
```

### 4. Conectar WhatsApp

1. Acesse http://localhost:3001/health
2. O QR Code aparecerá no terminal
3. Escaneie com o WhatsApp (Menu > Dispositivos Conectados > Conectar Dispositivo)
4. Pronto! O bot está ativo

## 📡 API Endpoints

### Status

```http
GET /health
```

Retorna o status do serviço.

### Enviar Notificação

```http
POST /api/notifications/send
Content-Type: application/json

{
  "type": "appointment_confirmation",
  "channels": ["whatsapp", "email"],
  "recipient": {
    "name": "João Silva",
    "phone": "11999998888",
    "email": "joao@email.com"
  },
  "data": {
    "date": "15/12/2024",
    "time": "14:00",
    "doctorName": "Maria Santos",
    "specialty": "Cardiologia"
  }
}
```

### Confirmar Consulta

```http
POST /api/notifications/appointment/confirm
Content-Type: application/json

{
  "recipient": {
    "name": "João Silva",
    "phone": "11999998888",
    "email": "joao@email.com"
  },
  "appointment": {
    "id": "123",
    "date": "15/12/2024",
    "time": "14:00",
    "doctorName": "Maria Santos",
    "specialty": "Cardiologia"
  }
}
```

### Enviar Código de Verificação

```http
POST /api/notifications/verification
Content-Type: application/json

{
  "recipient": {
    "phone": "11999998888",
    "name": "João"
  },
  "code": "123456",
  "channel": "whatsapp"
}
```

### Status dos Serviços

```http
GET /api/notifications/status
```

## 🤖 Comandos Especiais do Bot

Os usuários podem digitar esses comandos no WhatsApp:

| Comando | Ação |
|---------|------|
| `AGENDAR` | Inicia fluxo de agendamento |
| `CANCELAR` | Ajuda a cancelar consulta |
| `HORARIOS` | Mostra horários disponíveis |
| `FALAR COM HUMANO` | Solicita atendimento humano |

## 🔧 Integração com Backend Go

O serviço se comunica com o backend Go através da variável `BACKEND_URL`:

```javascript
// Buscar horários disponíveis
GET ${BACKEND_URL}/api/appointments/available?specialty=...&date=...
```

## 📱 Estrutura do Projeto

```
whatsapp-service/
├── src/
│   ├── index.js                 # Entry point
│   ├── services/
│   │   ├── WhatsAppService.js   # WhatsApp client (whatsapp-web.js)
│   │   ├── GeminiAssistant.js   # IA Gemini 2.0
│   │   └── EmailService.js      # Nodemailer
│   └── routes/
│       └── notifications.js     # API endpoints
├── .env.example
├── package.json
└── README.md
```

## ⚠️ Notas Importantes

1. **Rate Limiting**: O WhatsApp pode banir números que enviam muitas mensagens. Use com moderação.

2. **Sessão WhatsApp**: A sessão é salva em `.wwebjs_auth/`. Se precisar reconectar, delete essa pasta.

3. **Gemini 2.0 Flash**: Modelo escolhido por ter 1000+ chamadas gratuitas/dia.

4. **Produção**: Em produção, considere:
   - Usar uma instância dedicada para o WhatsApp
   - Implementar filas de mensagens (Redis/RabbitMQ)
   - Configurar webhooks para eventos do WhatsApp

## 🔮 Roadmap Futuro

- [ ] Autenticação via WhatsApp (2FA)
- [ ] Envio de arquivos/imagens
- [ ] Lembretes automáticos agendados
- [ ] Métricas e analytics
- [ ] Interface admin para monitoramento

## 📄 Licença

MIT
