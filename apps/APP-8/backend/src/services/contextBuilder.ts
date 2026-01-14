/**
 * Context Builder - Constrói contexto dinâmico para o System Prompt do Gemini Live
 * O Maestro usa este serviço para injetar inteligência no prompt em tempo real
 */

import { getDatabase } from '../database/db.js';
import { geminiMaestro } from './geminiMaestro.js';

export class ContextBuilder {
  /**
   * Constrói o System Instruction completo para o Gemini Live
   * Injeta contexto do banco de dados dinamicamente
   */
  async buildLiveSystemInstruction(userId: number = 1): Promise<string> {
    const db = getDatabase();
    
    // 1. Base instruction
    let instruction = `Você é um assistente de IA avançado que vê a tela do usuário em tempo real.

CAPACIDADES:
- Você vê a tela do usuário continuamente
- Você ouve a voz do usuário
- Você pode analisar código, documentos, imagens
- Você pode ajudar proativamente quando detectar necessidade

COMPORTAMENTO:
- Seja natural e conversacional
- Ajude proativamente quando ver algo relevante
- Seja conciso mas completo
- Use português brasileiro naturalmente
`;

    // 2. Perfil do usuário
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = ?').get(userId) as any;
    if (profile) {
      instruction += '\n\n=== PERFIL DO USUÁRIO ===\n';
      
      if (profile.name) {
        instruction += `Nome: ${profile.name}\n`;
      }
      
      const prefs = JSON.parse(profile.preferences || '{}');
      if (Object.keys(prefs).length > 0) {
        instruction += '\nPreferências:\n';
        Object.entries(prefs).forEach(([key, value]) => {
          instruction += `- ${key}: ${value}\n`;
        });
      }
      
      const skills = JSON.parse(profile.skills || '[]');
    }

    // 2.5 Pessoas conhecidas (NOVO!)
    const knownPeople = db.prepare(`
      SELECT name, description, relationship, times_seen, last_seen
      FROM known_people
      ORDER BY times_seen DESC
      LIMIT 10
    `).all() as any[];
    
    if (knownPeople.length > 0) {
      instruction += '\n\n=== PESSOAS CONHECIDAS ===\n';
      instruction += 'Você conhece estas pessoas e deve reconhecê-las quando aparecerem na câmera:\n\n';
      
      knownPeople.forEach(person => {
        instruction += `👤 ${person.name}`;
        if (person.relationship) {
          instruction += ` (${person.relationship})`;
        }
        instruction += '\n';
        
        if (person.description) {
          instruction += `   ${person.description}\n`;
        }
        
        instruction += `   Visto ${person.times_seen} vezes, última vez: ${new Date(person.last_seen).toLocaleDateString('pt-BR')}\n\n`;
      });
      
      instruction += 'IMPORTANTE: Quando reconhecer alguém na câmera, cumprimente pelo nome e demonstre que lembra da pessoa!\n';
    }

    // Continua com o código original
    if (profile) {
      const skills = JSON.parse(profile.skills || '[]');
      if (skills.length > 0) {
        instruction += `\nHabilidades conhecidas: ${skills.join(', ')}\n`;
      }
      
      const interests = JSON.parse(profile.interests || '[]');
      if (interests.length > 0) {
        instruction += `Interesses: ${interests.join(', ')}\n`;
      }
    }

    // 3. Resumo do dia anterior
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const dailySummary = db.prepare('SELECT * FROM daily_summaries WHERE date = ?').get(yesterdayStr) as any;
    if (dailySummary) {
      instruction += '\n\n=== CONTEXTO DO DIA ANTERIOR ===\n';
      instruction += `Resumo: ${dailySummary.summary}\n`;
      instruction += `Humor: ${dailySummary.user_mood}\n`;
      instruction += `Produtividade: ${dailySummary.productivity_score}/10\n`;
      
      const topics = JSON.parse(dailySummary.key_topics || '[]');
      if (topics.length > 0) {
        instruction += `Tópicos trabalhados: ${topics.join(', ')}\n`;
      }
    }

    // 4. Memórias mais importantes (top 5)
    const topMemories = db.prepare(`
      SELECT content, type, importance 
      FROM memories 
      ORDER BY importance DESC, timestamp DESC 
      LIMIT 5
    `).all() as any[];
    
    if (topMemories.length > 0) {
      instruction += '\n\n=== MEMÓRIAS IMPORTANTES ===\n';
      topMemories.forEach(mem => {
        instruction += `- [${mem.type}] ${mem.content}\n`;
      });
    }

    // 5. Contexto recente (últimas 5 interações)
    const recentContext = db.prepare(`
      SELECT content 
      FROM short_term_context 
      ORDER BY timestamp DESC 
      LIMIT 5
    `).all() as any[];
    
    if (recentContext.length > 0) {
      instruction += '\n\n=== CONTEXTO RECENTE ===\n';
      recentContext.reverse().forEach(ctx => {
        instruction += `- ${ctx.content}\n`;
      });
    }

    // 6. Última sessão (se houver)
    const lastSession = db.prepare(`
      SELECT summary 
      FROM sessions 
      WHERE summary IS NOT NULL 
      ORDER BY start_time DESC 
      LIMIT 1
    `).get() as any;
    
    if (lastSession?.summary) {
      instruction += '\n\n=== ÚLTIMA CONVERSA ===\n';
      instruction += lastSession.summary + '\n';
    }

    // 7. Instruções finais
    instruction += `\n\n=== INSTRUÇÕES IMPORTANTES ===
- Use TODO esse contexto para personalizar suas respostas
- Lembre-se das preferências e habilidades do usuário
- Seja proativo quando ver algo na tela relacionado ao histórico
- Adapte seu tom baseado no humor detectado
- Continue conversas anteriores naturalmente
- Não mencione explicitamente que você tem acesso a essas informações, apenas use-as naturalmente
`;

    return instruction;
  }

  /**
   * Atualiza contexto de curto prazo
   */
  addToShortTermContext(content: string, relevanceScore: number = 1.0) {
    const db = getDatabase();
    
    // Adiciona novo contexto
    db.prepare(`
      INSERT INTO short_term_context (content, timestamp, relevance_score)
      VALUES (?, ?, ?)
    `).run(content, new Date().toISOString(), relevanceScore);
    
    // Mantém apenas os 20 mais recentes
    const all = db.prepare('SELECT id FROM short_term_context ORDER BY timestamp DESC').all() as any[];
    if (all.length > 20) {
      const toDelete = all.slice(20).map(r => r.id);
      db.prepare(`DELETE FROM short_term_context WHERE id IN (${toDelete.join(',')})`).run();
    }
  }

  /**
   * Atualiza perfil do usuário baseado na conversa
   */
  async updateProfileFromConversation(conversation: string) {
    const db = getDatabase();
    
    // Usa Gemini para extrair informações do perfil
    const facts = await geminiMaestro.extractFacts(conversation);
    
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as any;
    const prefs = JSON.parse(profile.preferences || '{}');
    const skills = JSON.parse(profile.skills || '[]');
    const interests = JSON.parse(profile.interests || '[]');
    
    facts.forEach((fact: any) => {
      if (fact.type === 'preference') {
        prefs[fact.content] = true;
      } else if (fact.type === 'skill') {
        if (!skills.includes(fact.content)) {
          skills.push(fact.content);
        }
      } else if (fact.type === 'context') {
        if (!interests.includes(fact.content)) {
          interests.push(fact.content);
        }
      }
    });
    
    db.prepare(`
      UPDATE user_profile 
      SET preferences = ?, skills = ?, interests = ?, updated_at = ?
      WHERE id = 1
    `).run(
      JSON.stringify(prefs),
      JSON.stringify(skills),
      JSON.stringify(interests),
      new Date().toISOString()
    );
  }

  /**
   * Busca contexto relevante para uma query específica
   */
  async getRelevantContext(query: string, limit: number = 3): Promise<string> {
    const db = getDatabase();
    
    // Gera embedding da query
    const queryEmbedding = await geminiMaestro.generateEmbedding(query);
    if (queryEmbedding.length === 0) return '';
    
    // Busca memórias similares
    const memories = db.prepare('SELECT * FROM memories').all() as any[];
    
    const scored = memories.map(mem => {
      const embedding = new Float32Array(mem.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, Array.from(embedding));
      return { ...mem, similarity };
    });
    
    const relevant = scored
      .filter(m => m.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    if (relevant.length === 0) return '';
    
    let context = 'Informações relevantes:\n';
    relevant.forEach(mem => {
      context += `- ${mem.content}\n`;
    });
    
    return context;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}

export const contextBuilder = new ContextBuilder();
