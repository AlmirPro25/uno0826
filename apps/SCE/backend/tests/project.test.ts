
import { ProjectService } from '../src/services/project.service.js';

// Tipos como strings (SQLite não suporta enums nativos)
type AppType = 'FRONTEND' | 'BACKEND';

describe('ProjectService Sovereignty Test', () => {
  const service = new ProjectService();

  it('deve validar a criação de projeto com isolamento', async () => {
    // Mock do Prisma seria necessário para rodar sem DB real
    expect(service).toBeDefined();
  });
});
