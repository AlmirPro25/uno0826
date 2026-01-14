import axios from 'axios';

class WhatsAppCloudService {
    constructor(geminiAssistant) {
        this.geminiAssistant = geminiAssistant;
        this.apiUrl = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        this.accessToken = process.env.WHATSAPP_API_TOKEN;

        // Headers for all requests
        this.headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };

        // Conversation history
        this.conversations = new Map();
    }

    /**
     * Send a free-form text message.
     * NOTE: This only works if the user has messaged you within the last 24 hours.
     * Otherwise, you MUST use sendTemplate().
     */
    async sendMessage(to, text) {
        try {
            const formattedNumber = this._formatNumber(to);
            const data = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: formattedNumber,
                type: "text",
                text: { preview_url: false, body: text }
            };

            await axios.post(this.apiUrl, data, { headers: this.headers });
            console.log(`📤 Cloud API: Message sent to ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Cloud API Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send a Template Message (Required for notifications/business-initiated chats)
     * @param {string} to Phone number
     * @param {string} templateName Name of the template created in Meta Manager
     * @param {string} languageCode e.g., 'pt_BR'
     * @param {Array} components Array of component objects (header, body parameters)
     */
    async sendTemplate(to, templateName, languageCode = 'pt_BR', components = []) {
        try {
            const formattedNumber = this._formatNumber(to);
            const data = {
                messaging_product: "whatsapp",
                to: formattedNumber,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components: components
                }
            };

            await axios.post(this.apiUrl, data, { headers: this.headers });
            console.log(`📤 Cloud API: Template '${templateName}' sent to ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Cloud API Template Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Process Incoming Webhook Message
     * Call this from your controller/route handler
     * @param {Object} messageObject The 'messages[0]' object from the webhook payload
     */
    async handleIncomingMessage(messageObject) {
        if (!messageObject || !messageObject.text) return;

        const from = messageObject.from; // Phone number
        const text = messageObject.text.body;

        console.log(`📩 Cloud API: Message from ${from}: ${text}`);

        // Maintain History
        if (!this.conversations.has(from)) {
            this.conversations.set(from, []);
        }
        const history = this.conversations.get(from);
        history.push({ role: 'user', content: text });
        if (history.length > 20) history.splice(0, 2);

        try {
            // Get AI Response
            const aiResponse = await this.geminiAssistant.chat(text, history, from);
            history.push({ role: 'assistant', content: aiResponse });

            // Reply (Free-form text is allowed as a response)
            await this.sendMessage(from, aiResponse);

        } catch (error) {
            console.error('❌ AI Processing Error:', error);
            await this.sendMessage(from, "Desculpe, estou com dificuldades técnicas no momento.");
        }
    }

    /**
     * Format number for Cloud API (No @c.us, just digits)
     */
    _formatNumber(number) {
        return number.replace(/\D/g, '');
    }
}

export { WhatsAppCloudService };
