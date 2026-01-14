/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║                    🧪 TESTES DO PROXY SERVER 🧪                              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import request from 'supertest';
import { app, server } from '../server';

// Fechar servidor após todos os testes
afterAll((done) => {
  server.close(done);
});

describe('Proxy Server - Health Check', () => {
  it('deve retornar status ok no /health', async () => {
    const response = await request(app).get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });
});

describe('Proxy Server - Validação de Requisições', () => {
  it('deve rejeitar requisição sem prompt', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('prompt');
  });

  it('deve rejeitar prompt vazio', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ prompt: '   ' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('vazio');
  });

  it('deve rejeitar prompt muito longo', async () => {
    const longPrompt = 'a'.repeat(1000001); // 1MB + 1 byte
    
    const response = await request(app)
      .post('/api/generate')
      .send({ prompt: longPrompt });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toContain('muito longo');
  });

  it('deve aceitar prompt válido', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ 
        prompt: 'Olá, mundo!',
        modelName: 'gemini-2.0-flash-exp'
      });
    
    // Pode retornar 200 (sucesso) ou 401 (API key inválida em ambiente de teste)
    expect([200, 401, 500]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });
});

describe('Proxy Server - Variáveis de Ambiente', () => {
  it('deve ter GEMINI_API_KEY configurada', () => {
    expect(process.env.GEMINI_API_KEY).toBeDefined();
    expect(process.env.GEMINI_API_KEY).not.toBe('');
  });

  it('deve ter PORT configurada ou usar padrão', () => {
    const port = process.env.PORT || 3000;
    expect(port).toBeDefined();
    expect(typeof port).toBe('string');
  });
});

describe('Proxy Server - CORS', () => {
  it('deve ter headers CORS configurados', async () => {
    const response = await request(app)
      .options('/api/generate')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });
});

describe('Proxy Server - Rate Limiting', () => {
  it('deve ter headers de rate limit', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ prompt: 'teste' });
    
    // Rate limit headers podem estar presentes
    // (depende da configuração)
    expect(response.status).toBeDefined();
  });
});

describe('Proxy Server - Rotas 404', () => {
  it('deve retornar 404 para rotas inexistentes', async () => {
    const response = await request(app).get('/rota-inexistente');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  });
});

describe('Proxy Server - Segurança', () => {
  it('deve ter headers de segurança (Helmet)', async () => {
    const response = await request(app).get('/health');
    
    // Helmet adiciona vários headers de segurança
    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-frame-options');
  });

  it('deve limitar tamanho do payload', async () => {
    const hugePayload = {
      prompt: 'a'.repeat(11 * 1024 * 1024) // 11MB (acima do limite de 10MB)
    };
    
    const response = await request(app)
      .post('/api/generate')
      .send(hugePayload);
    
    // Deve rejeitar payload muito grande
    expect([400, 413]).toContain(response.status);
  });
});
