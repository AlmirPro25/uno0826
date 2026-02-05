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
  },

  // Novas stacks adicionadas
  'svelte': {
    id: 'svelte',
    name: 'Svelte',
    description: 'Svelte com compilação otimizada',
    category: 'frontend',
    icon: 'fas fa-fire',
    defaultFiles: [
      { name: 'App.svelte', content: '<script>\n  let count = 0;\n</script>\n\n<button on:click={() => count++}>\n  Clicks: {count}\n</button>', language: 'svelte' }
    ],
    aiInstructions: 'Use Svelte 5 com runes, stores e transições. Foque em simplicidade e performance.',
    dependencies: ['svelte'],
    devDependencies: ['@sveltejs/vite-plugin-svelte', 'vite']
  },

  'nextjs': {
    id: 'nextjs',
    name: 'Next.js',
    description: 'React com SSR/SSG e App Router',
    category: 'frontend',
    icon: 'fas fa-n',
    defaultFiles: [
      { name: 'page.tsx', content: `export default function Home() {\n  return (\n    <main>\n      <h1>Next.js App</h1>\n    </main>\n  );\n}`, language: 'typescript' }
    ],
    aiInstructions: 'Use Next.js 14+ com App Router, Server Components, streaming e otimizações de performance.',
    dependencies: ['next', 'react', 'react-dom'],
    devDependencies: ['@types/react', '@types/node', 'typescript']
  },

  'go-fiber': {
    id: 'go-fiber',
    name: 'Go + Fiber',
    description: 'Go ultra-performático com Fiber',
    category: 'backend',
    icon: 'fas fa-bolt',
    defaultFiles: [
      { name: 'main.go', content: `package main\n\nimport "github.com/gofiber/fiber/v2"\n\nfunc main() {\n    app := fiber.New()\n\n    app.Get("/", func(c *fiber.Ctx) error {\n        return c.JSON(fiber.Map{"status": "ok"})\n    })\n\n    app.Listen(":3000")\n}`, language: 'go' }
    ],
    aiInstructions: 'Use Go com Fiber, GORM para banco de dados, JWT para auth. Foque em alta performance.',
    dependencies: [],
    devDependencies: []
  },

  // CSS/Styling options
  'tailwind': {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    category: 'frontend',
    icon: 'fas fa-wind',
    defaultFiles: [
      { name: 'tailwind.config.js', content: `module.exports = {\n  content: ["./src/**/*.{js,jsx,ts,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n}`, language: 'javascript' }
    ],
    aiInstructions: 'Use Tailwind CSS v3 com classes utilitárias. Evite CSS customizado quando possível.',
    dependencies: ['tailwindcss'],
    devDependencies: ['autoprefixer', 'postcss']
  },

  'sass': {
    id: 'sass',
    name: 'SASS/SCSS',
    description: 'CSS com superpoderes',
    category: 'frontend',
    icon: 'fab fa-sass',
    defaultFiles: [
      { name: 'styles.scss', content: `$primary: #3b82f6;\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  \n  .title {\n    color: $primary;\n  }\n}`, language: 'scss' }
    ],
    aiInstructions: 'Use SASS/SCSS com variáveis, mixins, nesting e funções. Organize em partials.',
    dependencies: [],
    devDependencies: ['sass']
  },

  'css-vanilla': {
    id: 'css-vanilla',
    name: 'CSS Puro',
    description: 'CSS moderno sem frameworks',
    category: 'frontend',
    icon: 'fab fa-css3-alt',
    defaultFiles: [
      { name: 'styles.css', content: `:root {\n  --primary: #3b82f6;\n  --secondary: #64748b;\n}\n\n* { box-sizing: border-box; margin: 0; padding: 0; }\n\nbody {\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n}`, language: 'css' }
    ],
    aiInstructions: 'Use CSS moderno com variáveis, Grid, Flexbox, animations e custom properties.',
    dependencies: [],
    devDependencies: []
  },

  'styled-components': {
    id: 'styled-components',
    name: 'Styled Components',
    description: 'CSS-in-JS para React',
    category: 'frontend',
    icon: 'fas fa-palette',
    defaultFiles: [
      { name: 'Button.tsx', content: `import styled from 'styled-components';\n\nexport const Button = styled.button\`\n  background: #3b82f6;\n  color: white;\n  padding: 12px 24px;\n  border: none;\n  border-radius: 8px;\n  cursor: pointer;\n  \n  &:hover {\n    background: #2563eb;\n  }\n\`;`, language: 'typescript' }
    ],
    aiInstructions: 'Use Styled Components com props dinâmicas, temas e animações.',
    dependencies: ['styled-components'],
    devDependencies: ['@types/styled-components']
  },

  'chakra': {
    id: 'chakra',
    name: 'Chakra UI',
    description: 'Components acessíveis para React',
    category: 'frontend',
    icon: 'fas fa-yin-yang',
    defaultFiles: [
      { name: 'App.tsx', content: `import { ChakraProvider, Button, Box } from '@chakra-ui/react';\n\nfunction App() {\n  return (\n    <ChakraProvider>\n      <Box p={4}>\n        <Button colorScheme="blue">Click me</Button>\n      </Box>\n    </ChakraProvider>\n  );\n}`, language: 'typescript' }
    ],
    aiInstructions: 'Use Chakra UI com props de estilo, temas customizados e components compostos.',
    dependencies: ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
    devDependencies: []
  },

  'material': {
    id: 'material',
    name: 'Material UI',
    description: 'Design System Google para React',
    category: 'frontend',
    icon: 'fas fa-square',
    defaultFiles: [
      { name: 'App.tsx', content: `import { Button, Container, Typography } from '@mui/material';\n\nfunction App() {\n  return (\n    <Container>\n      <Typography variant="h1">Material UI</Typography>\n      <Button variant="contained">Click me</Button>\n    </Container>\n  );\n}`, language: 'typescript' }
    ],
    aiInstructions: 'Use Material UI v5 com sx prop, temas customizados e componentes do Material Design.',
    dependencies: ['@mui/material', '@emotion/react', '@emotion/styled'],
    devDependencies: []
  }
};