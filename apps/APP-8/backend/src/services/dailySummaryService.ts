import { getDatabase } from '../database/db.js';
import { geminiMaestro } from './geminiMaestro.js';
import { sessionService } from './sessionService.js';

export class DailySummaryService {
  /**
   * Cria resumo diário automático
   */
  async createDailySummary(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const db = getDatabase();
    
    // Busca todas as sessões do dia
    const sessions = db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM messages WHERE session_id = s.id) as message_count
      FROM sessions s
      WHERE DATE(s.start_time) = ?
    `).all(targetDate) as any[];
    
    if (sessions.length === 0) {
      return null;
    }
    
    // Busca mensagens de cada sessão
    const sessionsWithMessages = sessions.map(s => {
      const messages = db.prepare('SELECT speaker, text FROM messages WHERE session_id = ?').all(s.id) as any[];
      return { ...s, messages };
    });
    
    // Gemini Maestro cria o resumo inteligente
    const summary = await geminiMaestro.createDailySummary(sessionsWithMessages);
    
    // Salva no banco
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO daily_summaries 
      (date, summary, key_topics, important_facts, user_mood, productivity_score, ai_insights)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      targetDate,
      summary.summary,
      JSON.stringify(summary.keyTopics),
      JSON.stringify(summary.importantFacts),
      summary.userMood,
      summary.productivityScore,
      summary.aiInsights
    );
    
    // Atualiza sessões com referência ao resumo diário
    const summaryId = result.lastInsertRowid;
    db.prepare('UPDATE sessions SET daily_summary_id = ? WHERE DATE(start_time) = ?')
      .run(summaryId, targetDate);
    
    return {
      id: summaryId,
      date: targetDate,
      ...summary
    };
  }

  /**
   * Busca resumo de um dia específico
   */
  getDailySummary(date: string) {
    const db = getDatabase();
    const summary = db.prepare('SELECT * FROM daily_summaries WHERE date = ?').get(date) as any;
    
    if (summary) {
      summary.key_topics = JSON.parse(summary.key_topics);
      summary.important_facts = JSON.parse(summary.important_facts);
    }
    
    return summary;
  }

  /**
   * Lista resumos recentes
   */
  getRecentSummaries(limit: number = 30) {
    const db = getDatabase();
    const summaries = db.prepare('SELECT * FROM daily_summaries ORDER BY date DESC LIMIT ?').all(limit) as any[];
    
    return summaries.map(s => ({
      ...s,
      key_topics: JSON.parse(s.key_topics),
      important_facts: JSON.parse(s.important_facts)
    }));
  }

  /**
   * Análise de tendências (últimos 7 dias)
   */
  async getWeeklyTrends() {
    const db = getDatabase();
    const summaries = db.prepare(`
      SELECT * FROM daily_summaries 
      WHERE date >= DATE('now', '-7 days')
      ORDER BY date DESC
    `).all() as any[];
    
    if (summaries.length === 0) {
      return null;
    }
    
    const avgProductivity = summaries.reduce((sum, s) => sum + s.productivity_score, 0) / summaries.length;
    const allTopics = summaries.flatMap(s => JSON.parse(s.key_topics));
    const topicFrequency = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      averageProductivity: avgProductivity,
      topTopics: Object.entries(topicFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count })),
      summaries: summaries.map(s => ({
        date: s.date,
        summary: s.summary,
        mood: s.user_mood,
        productivity: s.productivity_score
      }))
    };
  }

  /**
   * Agenda criação automática de resumo diário
   */
  scheduleAutomaticSummaries() {
    // Cria resumo do dia anterior à meia-noite
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 5, 0, 0); // 00:05 AM
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      await this.createDailySummary(dateStr);
      console.log(`✅ Resumo diário criado automaticamente para ${dateStr}`);
      
      // Agenda próximo resumo
      this.scheduleAutomaticSummaries();
    }, msUntilMidnight);
    
    console.log(`📅 Próximo resumo automático agendado para ${tomorrow.toLocaleString()}`);
  }
}

export const dailySummaryService = new DailySummaryService();
