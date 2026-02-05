
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const SECRET_KEY = process.env.JWT_SECRET || 'TITAN_SUPER_SECRET_KEY_V1';

// Como o Schema é imutável e não tem tabela de usuários, 
// usamos um padrão de Concierge/Admin em memória ou ENV.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'command@titan.lux';
const ADMIN_PASS_HASH = process.env.ADMIN_HASH || '$2b$10$X7V.j.X.X.X.X.X.X.X.X.X.X.X.X.X'; // Hash placeholder

export const login = async (email: string, password: string) => {
  // Simulação de verificação de alta segurança
  if (email !== ADMIN_EMAIL) {
    throw new Error('Invalid Credentials');
  }

  // Em produção real, compararíamos o hash. 
  // Para este protótipo "Zero User Table", validamos se a senha é o "Master Key"
  const isMatch = password === 'titan-elite-2024'; 

  if (!isMatch) {
    throw new Error('Invalid Credentials');
  }

  const token = jwt.sign({ role: 'COMMANDER', email }, SECRET_KEY, { expiresIn: '12h' });

  return { token, user: { email, role: 'COMMANDER' } };
};
