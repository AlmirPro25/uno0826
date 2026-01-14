# Migration Plan: whatsapp-web.js to WhatsApp Cloud API

## Overview
This document outlines the steps to migrate from the unofficial `whatsapp-web.js` library (which uses Puppeteer/Chrome) to the official **WhatsApp Business Cloud API** (hosted by Meta). This migration is critical for production stability, scalability, and compliance with WhatsApp's Terms of Service.

## Why Migrate?
- **Stability**: `whatsapp-web.js` relies on reverse-engineering the Web client and breaks frequently with WhatsApp updates. Cloud API is stable and versioned.
- **Performance**: No need to run a headless Chrome instance (saves ~500MB+ RAM).
- **Compliance**: Using unauthorized automation can lead to number banning. Cloud API is the official path.

## Prerequisites (User Action Required)
1.  **Meta Business Account**: Create an account at [business.facebook.com](https://business.facebook.com/).
2.  **WhatsApp App**: Create an App in the [Meta for Developers Console](https://developers.facebook.com/).
3.  **Phone Number**: You need a phone number not currently in use by WhatsApp (or you must delete the account on the physical device to migrate it to the API).
4.  **System User & Token**: Generate a permanent Access Token for the system user.

## Implementation Steps

### 1. Environment Variables
Update your `.env` file with the following credentials:
```env
WHATSAPP_API_TOKEN="your_system_user_access_token"
WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_business_account_id"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="random_secure_string"
```

### 2. Message Templates (Critical)
WhatsApp Cloud API **requires** approved templates for any message initiated by the business (Notifications). You cannot send free-form text as a notification.
Go to the WhatsApp Manager in Meta Console and create these templates:

**Template 1: Appointment Confirmation**
- **Name**: `appointment_confirmation`
- **Category**: `UTILITY`
- **Body**:
  > Olá, sua consulta com Dr(a). {{1}} foi agendada para {{2}} às {{3}}. Responda se tiver dúvidas.
- **Buttons** (Optional): [Ver Detalhes], [Cancelar]

**Template 2: Appointment Reminder**
- **Name**: `appointment_reminder`
- **Category**: `UTILITY`
- **Body**:
  > Lembrete: Sua consulta com Dr(a). {{1}} é amanhã às {{2}}. Link da videochamada: {{3}}

**Template 3: Auth Code**
- **Name**: `auth_code`
- **Category**: `AUTHENTICATION`
- **Body**:
  > Seu código de verificação MediSync é {{1}}.

### 3. Backend Changes

#### A. Create `WhatsAppCloudService.js`
This service will replace `WhatsAppService.js`. It will uses `axios` to make HTTP calls.

```javascript
/* Structure Preview */
class WhatsAppCloudService {
    async sendMessage(to, text) {
        // ONLY works if within 24h window of user message
        // Otherwise, must use sendTemplate()
    }

    async sendTemplate(to, templateName, components) {
         // POST https://graph.facebook.com/v19.0/{phone_id}/messages
         // Body: { type: "template", template: { name: templateName ... } }
    }
}
```

#### B. Create Webhook Endpoint
Cloud API pushes messages to your server via Webhook.
- **File**: `backend/src/routes/whatsappWebhook.js` (or similar in your Node.js service)
- **Method**: `GET` (for verification) and `POST` (for receiving messages).
- **Logic**:
    1.  Verify `hub.verify_token` matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
    2.  Parse `entry[0].changes[0].value.messages`.
    3.  Extract text and user phone.
    4.  Pass to `GeminiAssistant`.
    5.  Reply using `sendMessage` (allowed since it's a reply).

### 4. Migration Phase
1.  Install `axios`: `npm install axios`.
2.  Implement `WhatsAppCloudService.js`.
3.  Expose the Webhook endpoint (must be HTTPS public, use `ngrok` for local dev).
4.  Verify the webhook in Meta Console.
5.  Switch the `WhatsAppService` class in your main application to the new implementation.

## Timeline
- **Day 1**: Account Setup & Template Creation (User).
- **Day 2**: Service Implementation & Webhook (Dev).
- **Day 3**: Testing with `ngrok` & Go Live.
