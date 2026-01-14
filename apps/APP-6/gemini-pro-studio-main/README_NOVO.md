# 🚀 prox ai studio

> **Professional AI Platform with WhatsApp Integration**

Complete artificial intelligence system with modern web interface, WhatsApp Business integration and multiple advanced capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

---

## ✨ Features

### 🤖 Advanced AI
- **7 Specialized Personas** (ML, Full Stack, DevOps, Security, Data, Code Review)
- **Thinking Mode** - Deep step-by-step reasoning
- **Contextual Chat** - Maintains conversation history
- **Code Analysis** - Automatic review with suggestions

### 🎨 Content Generation
- **Images** - Generation with Gemini 2.0 Flash Exp (free!)
- **Image Editing** - Remove background, apply effects
- **Image Analysis** - Gemini Vision to describe and analyze
- **Documents** - Professional resumes with 6 templates

### 📱 WhatsApp Integration
- **Intelligent Bot** - All features via WhatsApp
- **Special Commands** - `/help`, `/persona`, `/imagem`, `/codigo`
- **Smart Detection** - Recognizes requests without commands
- **Web Panel** - Manage conversations in real-time

### 🔍 Intelligent Search
- **Multi-Search** - Wikipedia, Google, Bing
- **Autonomous Navigation** - Browse websites automatically
- **Product Search** - Integration with public APIs
- **Smart Agents** - AI agents for complex tasks

### 🎤 Voice System
- **Text-to-Speech** - Natural voice synthesis
- **Speech-to-Text** - Voice recognition
- **Audio Controls** - Play, pause, speed control
- **Accessibility** - Full keyboard support

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- Google Gemini API Key ([Get here](https://aistudio.google.com/app/apikey))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/SEU_USUARIO/prox-ai-studio.git
cd prox-ai-studio

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Start the application
npm run dev
```

Access: http://localhost:3000

🎉 **Welcome to prox ai studio!**

### WhatsApp Integration (Optional)

```bash
# 1. Navigate to WhatsApp bridge
cd whatsapp-bridge

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# 4. Start the bridge
npm start

# 5. Scan QR Code with WhatsApp
```

---

## 📚 Documentation

### Quick Guides
- **[Quick Start](docs/guides/QUICK_START.md)** - Get started in 5 minutes
- **[WhatsApp Integration](docs/guides/GUIA_RAPIDO_WHATSAPP.md)** - Complete guide
- **[Voice System](docs/guides/GUIA_RAPIDO_VOZ.md)** - Voice features
- **[Publishing on GitHub](docs/guides/GUIA_PUBLICAR_GITHUB.md)** - How to publish

### Complete Documentation
- **[Documentation Index](docs/INDEX.md)** - Complete index
- **[Architecture](docs/architecture/)** - System architecture
- **[Development](docs/dev/)** - Development guides
- **[Troubleshooting](docs/troubleshooting/)** - Problem solutions

---

## 🎯 WhatsApp Commands

| Command | Description |
|---------|-------------|
| `/help` | List all commands |
| `/persona [name]` | Change specialist (ml, fullstack, devops, etc) |
| `/thinking` | Activate deep reasoning mode |
| `/codigo` | Analyze sent code |
| `/imagem [description]` | Generate image with AI |
| `/status` | System status |
| `/reset` | Clear history |

**Or use natural language:**
- "generate an image of an astronaut cat"
- "analyze this code: [code]"
- [Send photo] "what's in this image?"

---

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│      prox ai studio (React)         │
│  - Professional Web Interface       │
│  - Advanced AI Chat                 │
│  - Document Generation              │
│  - Image Gallery                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   WhatsApp Bridge (Node.js)         │
│  - Express API                      │
│  - Socket.IO Real-time              │
│  - WhatsApp-Web.js                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│        Gemini API (Google)          │
│  - Gemini 2.5 Flash                 │
│  - Gemini 2.0 Flash Exp (Images)    │
│  - Gemini Vision                    │
└─────────────────────────────────────┘
```

---

## 🛠️ Technologies

### Frontend
- React 19
- TypeScript 5.8
- Vite 6
- Tailwind CSS (via CDN)

### Backend
- Node.js
- Express
- Socket.IO
- WhatsApp-Web.js

### AI
- Google Gemini API
- Gemini 2.5 Flash (Chat)
- Gemini 2.0 Flash Exp (Images - Free!)
- Gemini Vision (Image Analysis)

---

## 📊 Project Structure

```
prox-ai-studio/
├── src/                    # React/TypeScript source code
│   ├── components/         # React components
│   ├── services/          # Services and APIs
│   ├── data/              # Data and configurations
│   └── utils/             # Utilities
├── backend/               # Node.js backend server
│   ├── server.js          # Main server
│   ├── services/          # Backend services
│   └── test-*.js          # Test scripts
├── whatsapp-bridge/       # WhatsApp integration
│   ├── server.js          # WhatsApp server
│   ├── package.json       # Dependencies
│   └── README.md          # Documentation
├── docs/                  # Complete documentation
│   ├── guides/            # Practical guides
│   ├── architecture/      # Architecture docs
│   ├── dev/               # Development docs
│   └── troubleshooting/   # Problem solutions
├── tests/                 # Tests and fixtures
│   └── fixtures/          # Test data
├── public/                # Public assets
└── README.md             # This file
```

---

## 🎓 Use Cases

### 1. Customer Service
- 24/7 WhatsApp bot
- Intelligent responses
- Product image analysis
- Proposal generation

### 2. Content Creation
- Social media image generation
- Automatic photo editing
- Resume creation
- Professional documents

### 3. Development
- Automatic code review
- Code analysis
- AI specialist consulting
- Assisted debugging

### 4. Productivity
- Personal assistant via WhatsApp
- Document generation
- Image analysis
- Task automation

---

## 💰 Cost

**100% FREE!** 🎉

- Gemini 2.5 Flash: Free (generous quota)
- Gemini 2.0 Flash Exp: Free (unlimited images)
- Gemini Vision: Free
- All features: Free

---

## 🤝 Contributing

Contributions are welcome! Open an issue or PR.

### How to Contribute
1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 Credits

Developed with ❤️ using:
- [Google Gemini API](https://ai.google.dev/)
- [WhatsApp-Web.js](https://wwebjs.dev/)
- [React](https://reactjs.org/)
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)

---

## 🎨 Brand

**prox ai studio** - Professional AI, Simplified

### Meaning
- **prox** = proximity, professional, productive
- **ai** = artificial intelligence
- **studio** = creative and professional environment

---

## 📞 Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/SEU_USUARIO/prox-ai-studio/issues)
- **Discussions:** [GitHub Discussions](https://github.com/SEU_USUARIO/prox-ai-studio/discussions)

---

## 🌟 Show Your Support

If this project helped you, give it a ⭐!

---

## 📈 Roadmap

- [ ] Add more AI models
- [ ] Implement user authentication
- [ ] Add database persistence
- [ ] Create mobile app
- [ ] Add more integrations
- [ ] Implement team features

---

**⭐ If this project helped you, leave a star!**

**📱 Try now: `npm run dev` and `cd whatsapp-bridge && npm start`**

**🚀 prox ai studio - Transform Ideas into Reality with AI**
