# 🧠 Criador de Redes Neurais AI

Um sistema completo e profissional para criação automática de redes neurais usando IA. Gera código Python, explicações detalhadas, visualizações e interfaces de usuário com apenas uma descrição em linguagem natural.

## 🚀 Funcionalidades Principais

### 🎯 **Geração Inteligente de IA**
- **Código Python Completo** com TensorFlow/Keras
- **Explicações Detalhadas** em markdown
- **Visualização da Arquitetura** interativa
- **Interface de Usuário** automática (Streamlit/Gradio)
- **Versão JavaScript** para execução no navegador

### 📋 **Sistema de Templates**
- **6 Templates Pré-configurados**:
  - Classificador de Imagens (Transfer Learning)
  - Análise de Sentimentos (NLP)
  - Controle Robótico (6-DOF)
  - Gerador GAN (DCGAN)
  - Large Language Model (Transformer)
  - Agente de RL (PPO)

### 📚 **Histórico e Favoritos**
- **Salvamento Automático** de todos os projetos
- **Sistema de Favoritos** para projetos importantes
- **Busca e Filtros** inteligentes
- **Carregamento Rápido** de projetos anteriores

### 📊 **Analytics e Métricas**
- **Métricas em Tempo Real**: projetos, taxa de sucesso, tempo médio
- **Análise Temporal**: 7 dias, 30 dias, histórico completo
- **Datasets Populares** e distribuição por categoria
- **Tracking Automático** de uso e performance

### 📦 **Exportação Avançada**
- **Múltiplos Formatos**:
  - **ZIP Completo** - Projeto pronto para usar
  - **GitHub Repository** - Com CI/CD Actions
  - **Google Colab** - Notebook Jupyter
  - **Docker Container** - Deploy instantâneo
- **Configurações Personalizáveis**
- **Documentação Automática**

### 🔗 **Sistema de Compartilhamento**
- **Links Locais** para compartilhamento rápido
- **GitHub Gist** público ou privado
- **Pastebin** para código simples
- **Email** com conteúdo formatado

### ⚙️ **Configurações Avançadas**
- **Temas** (Escuro/Claro/Automático)
- **Modelos Padrão** e datasets preferidos
- **Comportamento Personalizado**
- **Export/Import** de configurações

### 🔔 **Sistema de Notificações**
- **Feedback Visual** para todas as ações
- **Notificações Contextuais** com ações
- **Status em Tempo Real**

### ⌨️ **Atalhos de Teclado**
- `Ctrl + Enter` - Gerar IA
- `Ctrl + T` - Templates
- `Ctrl + H` - Histórico
- `Ctrl + M` - Métricas
- `Ctrl + Shift + S` - Compartilhar
- `Ctrl + ,` - Configurações
- `?` - Ajuda de Atalhos

### 🛡️ **Sistema de Fallback**
- **Modo Offline** com exemplos pré-configurados
- **Detecção Automática** de problemas de rede
- **Continuidade de Uso** sem interrupção

## 🚀 Como Usar

### **1. Configuração Inicial**
```bash
# Clone o repositório
git clone [url-do-repo]
cd criador-redes-neurais-ai

# Instale as dependências
npm install

# Configure a API Gemini (opcional)
echo "API_KEY=sua_chave_aqui" > .env.local
```

### **2. Execute o Projeto**
```bash
npm run dev
```

### **3. Acesse o Sistema**
- Abra http://localhost:5173
- Use o botão "🔧 Setup API" se precisar configurar a chave
- Experimente os templates ou crie seu próprio prompt!

## 💡 Exemplos de Prompts

### **Visão Computacional**
```
"Criar um classificador de imagens para detectar gatos e cachorros usando transfer learning com ResNet50"
```

### **Processamento de Linguagem**
```
"Modelo de análise de sentimentos para reviews de produtos com visualização de importância das palavras"
```

### **Robótica**
```
"Sistema de controle neural para braço robótico de 6 DOF com cinemática inversa e planejamento de trajetória"
```

### **Modelos Generativos**
```
"GAN condicional para gerar dígitos MNIST específicos com controle de classe e visualização do progresso"
```

## 🛠️ Tecnologias

### **Frontend**
- React 19 + TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)

### **IA e APIs**
- Google Gemini API
- Sistema de Fallback integrado

### **Funcionalidades Avançadas**
- D3.js (Visualizações)
- JSZip (Exportação)
- Web Speech API (Reconhecimento de voz)
- LocalStorage (Persistência)

## 🔧 Configuração da API

### **Opção 1: Com API Gemini (Recomendado)**
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma chave da API
3. Adicione no arquivo `.env.local`: `API_KEY=sua_chave`
4. Reinicie a aplicação

### **Opção 2: Modo Offline**
- O sistema funciona automaticamente sem API
- Usa exemplos pré-configurados inteligentes
- Todas as funcionalidades disponíveis

## 🤝 Contribuindo

1. **Fork** o projeto
2. **Crie** uma branch: `git checkout -b feature/nova-funcionalidade`
3. **Commit** suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. **Push** para a branch: `git push origin feature/nova-funcionalidade`
5. **Abra** um Pull Request

## 📄 Licença

MIT License - Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para democratizar a criação de IA**