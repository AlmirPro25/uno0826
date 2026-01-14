#!/usr/bin/env node

import fs from 'fs';

console.log('🔍 Testando configuração das APIs...\n');

// Ler arquivo .env
const envContent = fs.readFileSync('.env', 'utf8');

const apis = [
  {
    name: 'Gemini API',
    key: 'VITE_GEMINI_API_KEY',
    check: (content) => content.includes('VITE_GEMINI_API_KEY=AIzaSy')
  },
  {
    name: 'Supabase URL',
    key: 'VITE_SUPABASE_URL',
    check: (content) => content.includes('VITE_SUPABASE_URL=https://qmalyenyrdsrmagwuhqm.supabase.co')
  },
  {
    name: 'Supabase Key',
    key: 'VITE_SUPABASE_ANON_KEY',
    check: (content) => content.includes('VITE_SUPABASE_ANON_KEY=eyJ') && content.includes('AFwh5tffrJn4FxDeeuE9G8A92L_4RpdYdvmb5t8UVJc')
  },
  {
    name: 'MercadoPago Access Token',
    key: 'VITE_MERCADO_PAGO_ACCESS_TOKEN',
    check: (content) => content.includes('VITE_MERCADO_PAGO_ACCESS_TOKEN=TEST-2750340988674130')
  },
  {
    name: 'MercadoPago Public Key',
    key: 'VITE_MERCADO_PAGO_PUBLIC_KEY',
    check: (content) => content.includes('VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-436ba3a5')
  }
];

let allConfigured = true;

apis.forEach(({ name, key, check }) => {
  const isConfigured = check(envContent);
  const status = isConfigured ? '✅' : '❌';
  console.log(`${status} ${name}: ${isConfigured ? 'Configurado' : 'Não configurado'}`);
  if (!isConfigured) allConfigured = false;
});

console.log('\n' + (allConfigured ? '🎉 Todas as APIs estão configuradas!' : '⚠️  Algumas APIs não estão configuradas'));

if (allConfigured) {
  console.log('\n📋 Sistema completo com:');
  console.log('• Geração de currículos (Gemini AI)');
  console.log('• Autenticação e banco de dados (Supabase)');
  console.log('• Sistema de pagamentos (MercadoPago)');
  console.log('\n🚀 Pronto para desenvolvimento e produção!');
}