
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/prisma';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env';

// TESTES DE INTEGRAÇÃO DO PROTOCOLO

let token: string;
let assetId: string;

beforeAll(async () => {
  // Gerar token de teste
  token = jwt.sign(
    { id: 'TEST-COMMANDER', role: 'ADMIN' },
    env.JWT_SECRET
  );

  // Criar ativo de teste
  const asset = await prisma.asset.create({
    data: {
      codename: 'TEST-ALPHA',
      type: 'AIR',
      origin: 'TEST',
      destination: 'TEST',
      latitude: 0,
      longitude: 0,
      status: 'CLEARED'
    }
  });
  assetId = asset.id;
});

afterAll(async () => {
  await prisma.securityLog.deleteMany();
  await prisma.manifest.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.$disconnect();
});

describe('GET /api/assets', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/assets');
    expect(res.statusCode).toBe(401);
  });

  it('should return assets list with valid token', async () => {
    const res = await request(app)
      .get('/api/assets')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

describe('POST /api/assets/:id/lockdown', () => {
  it('should trigger lockdown protocol', async () => {
    const res = await request(app)
      .post(`/api/assets/${assetId}/lockdown`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Verificar no banco
    const updated = await prisma.asset.findUnique({ where: { id: assetId }});
    expect(updated?.status).toBe('LOCKED_DOWN');
  });
});
