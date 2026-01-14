import { getDatabase } from '../database/db.js';
import { geminiMaestro } from './geminiMaestro.js';

export class MemoryService {
  async addMemory(
    content: string,
    type: 'conversation' | 'fact' | 'preference' | 'skill' | 'context',
    importance: number = 5,
    tags: string[] = []
  ) {
    const db = getDatabase();
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const embedding = await geminiMaestro.generateEmbedding(content);
    const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
    
    const relatedMemories = await this.findRelatedMemories(embedding, 3);
    
    db.prepare(`
      INSERT INTO memories (id, timestamp, content, type, importance, embedding, tags, related_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      new Date().toISOString(),
      content,
      type,
      Math.max(1, Math.min(10, importance)),
      embeddingBuffer,
      JSON.stringify(tags),
      JSON.stringify(relatedMemories)
    );
    
    return id;
  }

  async searchMemories(query: string, limit: number = 5) {
    const db = getDatabase();
    const queryEmbedding = await geminiMaestro.generateEmbedding(query);
    
    const memories = db.prepare('SELECT * FROM memories').all() as any[];
    
    const scored = memories.map(mem => {
      const embedding = new Float32Array(mem.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, Array.from(embedding));
      
      const recencyBoost = this.calculateRecencyBoost(mem.timestamp);
      const importanceBoost = mem.importance / 10;
      const score = similarity * (1 + recencyBoost + importanceBoost);
      
      return { ...mem, score };
    });
    
    return scored
      .filter(m => m.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(m => ({
        ...m,
        tags: JSON.parse(m.tags),
        related_to: JSON.parse(m.related_to)
      }));
  }

  private async findRelatedMemories(embedding: number[], limit: number = 3): Promise<string[]> {
    const db = getDatabase();
    const memories = db.prepare('SELECT id, embedding FROM memories').all() as any[];
    
    const similarities = memories
      .map(mem => ({
        id: mem.id,
        similarity: this.cosineSimilarity(embedding, Array.from(new Float32Array(mem.embedding)))
      }))
      .filter(s => s.similarity > 0.5)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return similarities.map(s => s.id);
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

  private calculateRecencyBoost(timestamp: string): number {
    const age = Date.now() - new Date(timestamp).getTime();
    const daysOld = age / (1000 * 60 * 60 * 24);
    
    if (daysOld < 1) return 0.5;
    if (daysOld < 7) return 0.3;
    if (daysOld < 30) return 0.1;
    return 0;
  }

  async extractAndStoreFactsFromConversation(conversation: string) {
    const facts = await geminiMaestro.extractFacts(conversation);
    
    for (const fact of facts) {
      await this.addMemory(fact.content, fact.type, fact.importance, fact.tags);
    }
  }

  getMemoryStats() {
    const db = getDatabase();
    const total = db.prepare('SELECT COUNT(*) as count FROM memories').get() as any;
    const byType = db.prepare('SELECT type, COUNT(*) as count FROM memories GROUP BY type').all();
    const avgImportance = db.prepare('SELECT AVG(importance) as avg FROM memories').get() as any;
    
    return {
      totalMemories: total.count,
      byType,
      averageImportance: avgImportance.avg || 0
    };
  }

  clearAllMemories() {
    const db = getDatabase();
    db.prepare('DELETE FROM memories').run();
  }
}

export const memoryService = new MemoryService();
