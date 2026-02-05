
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { LoginInput } from '../models/validation';

// SERVIÇO DE AUTENTICAÇÃO DE COMANDO
// Como o Schema é imutável e não possui tabela de usuários,
// implementamos uma verificação estática de credenciais de nível "Commander".

export class AuthService {
  
  static async executeLogin(credentials: LoginInput) {
    // Verificação de credenciais táticas
    if (credentials.username !== env.OPERATOR_KEY || credentials.password !== env.OPERATOR_SECRET) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Geração de Token de Sessão Blindado
    const token = jwt.sign(
      { id: 'COMMANDER-01', role: 'ADMIN', clearance: 'TOP_SECRET' },
      env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return {
      accessToken: token,
      expiresIn: 28800,
      operator: 'SENTINEL_PRIME'
    };
  }
}
