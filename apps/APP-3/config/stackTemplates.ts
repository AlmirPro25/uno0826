import { type TechStack, type StackTemplate } from '@/types/ProjectStructure';

// Stack Templates Configuration
export const stackTemplates: Record<TechStack, StackTemplate> = {
  'html5-vanilla': {
    id: 'html5-vanilla',
    name: 'HTML5 + CSS + JavaScript',
    description: 'HTML5 puro com CSS moderno e JavaScript vanilla',
    category: 'frontend',
    icon: 'fab fa-html5',
    defaultFiles: [
      { 
        name: 'index.html', 
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Novo Projeto</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main>
        <h1>Bem-vindo ao seu projeto!</h1>
        <p>Comece a desenvolver aqui...</p>
    </main>
    <script src="script.js"></script>
</body>
</html>`, 
        language: 'html' 
      },
      { 
        name: 'style.css', 
        content: `/* CSS Moderno */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --background: #f8fafc;
  --text: #1e293b;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--background);
  color: var(--text);
  line-height: 1.6;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}`, 
        language: 'css' 
      },
      { 
        name: 'script.js', 
        content: `// JavaScript ES6+
document.addEventListener('DOMContentLoaded', () => {
    console.log('Projeto carregado com sucesso!');
    
    // Seu código aqui...
});`, 
        language: 'javascript' 
      }
    ],
    aiInstructions: 'Foque em HTML5 semântico, CSS Grid/Flexbox, JavaScript ES6+ vanilla. Use Web APIs modernas.',
    dependencies: [],
    devDependencies: []
  },
  
  'react-typescript': {
    id: 'react-typescript',
    name: 'React + TypeScript',
    description: 'React moderno com TypeScript e hooks',
    category: 'frontend',
    icon: 'fab fa-react',
    defaultFiles: [
      { 
        name: 'App.tsx', 
        content: `import React, { useState } from 'react';
import './App.css';

const App: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>React + TypeScript</h1>
        <p>Contador: {count}</p>
        <button onClick={() => setCount(count + 1)}>
          Incrementar
        </button>
      </header>
    </div>
  );
};

export default App;`, 
        language: 'typescript' 
      }
    ],
    aiInstructions: 'Use React hooks, TypeScript strict, componentes funcionais, props tipadas. Foque em performance e reutilização.',
    dependencies: ['react', 'react-dom'],
    devDependencies: ['@types/react', '@types/react-dom', 'typescript', 'vite']
  },

  'nodejs-express': {
    id: 'nodejs-express',
    name: 'Node.js + Express',
    description: 'Backend Node.js com Express e TypeScript',
    category: 'backend',
    icon: 'fab fa-node-js',
    defaultFiles: [
      { 
        name: 'server.ts', 
        content: `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Servidor rodando na porta \${PORT}\`);
});`, 
        language: 'typescript' 
      }
    ],
    aiInstructions: 'Foque em APIs RESTful, middleware, validação, autenticação JWT, banco de dados, error handling.',
    dependencies: ['express', 'cors', 'dotenv'],
    devDependencies: ['@types/express', '@types/cors', '@types/node', 'typescript', 'ts-node-dev']
  },

  // Stacks básicos para os outros tipos
  'vue-composition': {
    id: 'vue-composition',
    name: 'Vue 3 + Composition API',
    description: 'Vue 3 com Composition API e TypeScript',
    category: 'frontend',
    icon: 'fab fa-vuejs',
    defaultFiles: [
      { name: 'App.vue', content: '<template><div>Vue App</div></template>', language: 'vue' }
    ],
    aiInstructions: 'Use Vue 3 Composition API, TypeScript, Pinia para state management.',
    dependencies: ['vue'],
    devDependencies: ['@vitejs/plugin-vue', 'typescript']
  },

  'angular-standalone': {
    id: 'angular-standalone',
    name: 'Angular Standalone',
    description: 'Angular com componentes standalone',
    category: 'frontend',
    icon: 'fab fa-angular',
    defaultFiles: [
      { name: 'app.component.ts', content: 'import { Component } from "@angular/core";', language: 'typescript' }
    ],
    aiInstructions: 'Use Angular standalone components, signals, TypeScript strict.',
    dependencies: ['@angular/core', '@angular/common'],
    devDependencies: ['@angular/cli', 'typescript']
  },

  'python-flask': {
    id: 'python-flask',
    name: 'Python + Flask',
    description: 'API Python com Flask',
    category: 'backend',
    icon: 'fab fa-python',
    defaultFiles: [
      { name: 'app.py', content: 'from flask import Flask\napp = Flask(__name__)', language: 'python' }
    ],
    aiInstructions: 'Use Flask, SQLAlchemy, marshmallow, JWT authentication.',
    dependencies: ['flask', 'flask-sqlalchemy'],
    devDependencies: []
  },

  'python-fastapi': {
    id: 'python-fastapi',
    name: 'Python + FastAPI',
    description: 'API Python com FastAPI',
    category: 'backend',
    icon: 'fab fa-python',
    defaultFiles: [
      { name: 'main.py', content: 'from fastapi import FastAPI\napp = FastAPI()', language: 'python' }
    ],
    aiInstructions: 'Use FastAPI, Pydantic, async/await, automatic OpenAPI docs.',
    dependencies: ['fastapi', 'uvicorn'],
    devDependencies: []
  },

  'php-laravel': {
    id: 'php-laravel',
    name: 'PHP + Laravel',
    description: 'API PHP com Laravel',
    category: 'backend',
    icon: 'fab fa-laravel',
    defaultFiles: [
      { name: 'routes/web.php', content: '<?php\nRoute::get("/", function () { return "Laravel"; });', language: 'php' }
    ],
    aiInstructions: 'Use Laravel Eloquent, middleware, validation, API resources.',
    dependencies: [],
    devDependencies: []
  },

  'java-spring': {
    id: 'java-spring',
    name: 'Java + Spring Boot',
    description: 'API Java com Spring Boot',
    category: 'backend',
    icon: 'fab fa-java',
    defaultFiles: [
      { name: 'Application.java', content: '@SpringBootApplication\npublic class Application {}', language: 'java' }
    ],
    aiInstructions: 'Use Spring Boot, JPA, Spring Security, REST controllers.',
    dependencies: [],
    devDependencies: []
  },

  'csharp-dotnet': {
    id: 'csharp-dotnet',
    name: 'C# + .NET',
    description: 'API C# com .NET Core',
    category: 'backend',
    icon: 'fab fa-microsoft',
    defaultFiles: [
      { name: 'Program.cs', content: 'var builder = WebApplication.CreateBuilder(args);', language: 'csharp' }
    ],
    aiInstructions: 'Use .NET Core, Entity Framework, ASP.NET Core Web API.',
    dependencies: [],
    devDependencies: []
  }
};