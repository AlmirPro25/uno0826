/**
 * 🧪 TESTE SIMPLES DO THREE-PHASE PIPELINE
 * 
 * Execute com: npx tsx tests/test-pipeline-simple.ts
 */

import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar .env do proxy-server (onde está a API key)
dotenv.config({ path: path.join(process.cwd(), 'proxy-server', '.env') });
// Também tentar o .env raiz
dotenv.config();

// Tentar várias formas de pegar a API key
const API_KEY = process.env.GEMINI_API_KEY || 
                process.env.VITE_GEMINI_API_KEY ||
                process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error('❌ ERRO: Configure GEMINI_API_KEY ou VITE_GEMINI_API_KEY no .env');
  process.exit(1);
}

// Manifestos simplificados para teste
const PHASE_1_MANIFEST = `
🏗️ VOCÊ É O ARQUITETO UNIVERSAL (FASE 1 de 3)

Sua missão: Criar TODO o backend para o pedido do usuário.

RETORNE NESTE FORMATO EXATO:

===FILE: backend/main.go===
LANGUAGE: go
---
// Código Go completo aqui
package main
// ... implementação
---

===FILE: backend/handlers.go===
LANGUAGE: go
---
// Handlers da API
---

===FILE: database/schema.sql===
LANGUAGE: sql
---
-- Schema do banco
---

===PHASE2_MANIFEST===
# 🎯 BASTÃO PARA O DESIGNER (FASE 2)

## Resumo do Backend Criado
- [liste os arquivos criados]

## Endpoints da API
- GET /api/... - descrição
- POST /api/... - descrição

## Modelos de Dados
- Model1: campo1, campo2
- Model2: campo1, campo2

## Instruções para o Frontend
- Use estes endpoints para...
- O design deve ter...
- Componentes necessários: ...
---
`;

const PHASE_2_MANIFEST = `
🎨 VOCÊ É O DESIGNER SUPREMO (FASE 2 de 3)

Você recebeu o BASTÃO da Fase 1 com todo o contexto do backend.
Sua missão: Criar TODO o frontend integrado com o backend.

RETORNE NESTE FORMATO EXATO:

===FILE: frontend/src/App.tsx===
LANGUAGE: typescript
---
// Código React/TypeScript completo
import React from 'react';
// ... implementação
---

===FILE: frontend/src/components/TodoList.tsx===
LANGUAGE: typescript
---
// Componente
---

===FILE: frontend/src/services/api.ts===
LANGUAGE: typescript
---
// Integração com backend
---

===PHASE3_MANIFEST===
# 🎯 BASTÃO PARA O DOCUMENTADOR (FASE 3)

## Resumo do Frontend Criado
- [liste os arquivos criados]

## Componentes Implementados
- Component1: descrição
- Component2: descrição

## Integração com Backend
- Endpoints utilizados: ...
- Como os dados fluem: ...

## O que Documentar
- README com instruções de...
- Docker para...
- Testes para...
---
`;

const PHASE_3_MANIFEST = `
📚 VOCÊ É O DOCUMENTADOR/FINALIZADOR (FASE 3 de 3 - FINAL)

Você recebeu os BASTÕES das Fases 1 e 2 com todo o contexto.
Sua missão: Finalizar o projeto com documentação, Docker e testes.

RETORNE NESTE FORMATO EXATO:

===FILE: README.md===
LANGUAGE: markdown
---
# Nome do Projeto

## Descrição
...

## Como Rodar
...

## API Endpoints
...
---

===FILE: docker-compose.yml===
LANGUAGE: yaml
---
version: '3.8'
services:
  ...
---

===FILE: Dockerfile===
LANGUAGE: dockerfile
---
FROM ...
---
`;

async function testPipeline() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 TESTE DO THREE-PHASE PIPELINE 🧪                            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const genAI = new GoogleGenAI({ apiKey: API_KEY });
  const userPrompt = 'Crie um sistema simples de lista de tarefas (todo list)';
  
  console.log(`📝 Prompt: ${userPrompt}\n`);
  
  const startTime = Date.now();
  
  try {
    // ═══════════════════════════════════════════════════════════════════════
    // FASE 1: ARQUITETO
    // ═══════════════════════════════════════════════════════════════════════
    console.log('🏗️ ═══════════════════════════════════════════════════════════════════════');
    console.log('🏗️ FASE 1: ARQUITETO UNIVERSAL');
    console.log('🏗️ ═══════════════════════════════════════════════════════════════════════\n');
    
    const phase1Prompt = `${PHASE_1_MANIFEST}\n\nPEDIDO: ${userPrompt}`;
    
    const result1 = await genAI.models.generateContent({
      model: 'gemini-2.0-flash', // Modelo estável
      contents: [{ text: phase1Prompt }]
    });
    
    const response1 = result1.text || '';
    console.log('✅ Fase 1 completa!');
    console.log(`📄 Resposta (${response1.length} chars)\n`);
    
    // Extrair manifesto para fase 2
    const manifest1 = extractManifest(response1, 'PHASE2_MANIFEST');
    
    // 🎯 MOSTRAR O BASTÃO SENDO PASSADO
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              🏃 BASTÃO FASE 1 → FASE 2 🏃                                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    console.log('📋 MANIFESTO GERADO PELA FASE 1 (instruções para o Designer):');
    console.log('─'.repeat(70));
    console.log(manifest1 || '(Manifesto não encontrado no formato esperado)');
    console.log('─'.repeat(70));
    console.log('\n📁 ARQUIVOS GERADOS NA FASE 1:');
    const files1Preview = extractFiles(response1);
    files1Preview.forEach(f => console.log(`   ✅ ${f.path} (${f.language})`));
    console.log('\n');
    
    // ═══════════════════════════════════════════════════════════════════════
    // FASE 2: DESIGNER
    // ═══════════════════════════════════════════════════════════════════════
    console.log('🎨 ═══════════════════════════════════════════════════════════════════════');
    console.log('🎨 FASE 2: DESIGNER SUPREMO');
    console.log('🎨 ═══════════════════════════════════════════════════════════════════════\n');
    
    const phase2Prompt = `${PHASE_2_MANIFEST}

CONTEXTO DA FASE 1 (BACKEND):
${response1.substring(0, 3000)}

MANIFESTO DA FASE 1:
${manifest1}

PEDIDO ORIGINAL: ${userPrompt}`;
    
    const result2 = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: phase2Prompt }]
    });
    
    const response2 = result2.text || '';
    console.log('✅ Fase 2 completa!');
    console.log(`📄 Resposta (${response2.length} chars)\n`);
    
    // Extrair manifesto para fase 3
    const manifest2 = extractManifest(response2, 'PHASE3_MANIFEST');
    
    // 🎯 MOSTRAR O BASTÃO SENDO PASSADO
    console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              🏃 BASTÃO FASE 2 → FASE 3 🏃                                    ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    console.log('📋 MANIFESTO GERADO PELA FASE 2 (instruções para o Documentador):');
    console.log('─'.repeat(70));
    console.log(manifest2 || '(Manifesto não encontrado no formato esperado)');
    console.log('─'.repeat(70));
    console.log('\n📁 ARQUIVOS GERADOS NA FASE 2:');
    const files2Preview = extractFiles(response2);
    files2Preview.forEach(f => console.log(`   ✅ ${f.path} (${f.language})`));
    console.log('\n');
    
    // ═══════════════════════════════════════════════════════════════════════
    // FASE 3: DOCUMENTADOR
    // ═══════════════════════════════════════════════════════════════════════
    console.log('📚 ═══════════════════════════════════════════════════════════════════════');
    console.log('📚 FASE 3: DOCUMENTADOR/FINALIZADOR');
    console.log('📚 ═══════════════════════════════════════════════════════════════════════\n');
    
    const phase3Prompt = `${PHASE_3_MANIFEST}

CONTEXTO DA FASE 1 (BACKEND):
${response1.substring(0, 2000)}

CONTEXTO DA FASE 2 (FRONTEND):
${response2.substring(0, 2000)}

MANIFESTO DA FASE 2:
${manifest2}

PEDIDO ORIGINAL: ${userPrompt}`;
    
    const result3 = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ text: phase3Prompt }]
    });
    
    const response3 = result3.text || '';
    console.log('✅ Fase 3 completa!');
    console.log(`📄 Resposta (${response3.length} chars)\n`);
    
    // ═══════════════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════════════
    const totalTime = Date.now() - startTime;
    
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║              🎉 PIPELINE COMPLETO COM SUCESSO! 🎉                            ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
    
    console.log(`⏱️ Tempo total: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📊 Fase 1: ${response1.length} chars`);
    console.log(`📊 Fase 2: ${response2.length} chars`);
    console.log(`📊 Fase 3: ${response3.length} chars`);
    console.log(`📊 Total: ${response1.length + response2.length + response3.length} chars`);
    
    // Extrair e mostrar arquivos
    console.log('\n📁 Arquivos gerados:');
    const files1 = extractFiles(response1);
    const files2 = extractFiles(response2);
    const files3 = extractFiles(response3);
    
    [...files1, ...files2, ...files3].forEach(f => {
      console.log(`   - ${f.path} (${f.language})`);
    });
    
    console.log(`\n✅ Total de arquivos: ${files1.length + files2.length + files3.length}`);
    
  } catch (error) {
    console.error('❌ ERRO:', error);
  }
}

function extractManifest(response: string, key: string): string {
  const regex = new RegExp(`===${key}===\\s*\\n([\\s\\S]*?)(?:---|$)`);
  const match = response.match(regex);
  return match ? match[1].trim() : '';
}

function extractFiles(response: string): Array<{ path: string; language: string }> {
  const files: Array<{ path: string; language: string }> = [];
  const regex = /===FILE:\s*(.+?)===\s*\nLANGUAGE:\s*(.+?)\s*\n/g;
  let match;
  while ((match = regex.exec(response)) !== null) {
    files.push({ path: match[1].trim(), language: match[2].trim() });
  }
  return files;
}

// Executar
testPipeline();
