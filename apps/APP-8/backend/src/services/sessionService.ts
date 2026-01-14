import { getDatabase } from '../database/db.js';
import { geminiMaestro } from './geminiMaestro.js';

export class SessionService {
  createSession() {
    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO sessions (start_time) VALUES (?)');
    const result = stmt.run(new Date().toISOString());
    return result.lastInsertRowid as number;
  }

  addMessage(sessionId: number, speaker: 'user' | 'model' | 'analysis', text: string, audioData?: Buffer) {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO messages (session_id, timestamp, speaker, text, audio_data) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(sessionId, new Date().toISOString(), speaker, text, audioData || null);
  }

  getSession(sessionId: number) {
    const db = getDatabase();
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId);
    
    return { ...session, messages };
  }

  getAllSessions(limit: number = 50) {
    const db = getDatabase();
    const sessions = db.prepare('SELECT * FROM sessions ORDER BY start_time DESC LIMIT ?').all(limit);
    
    return sessions.map((session: any) => {
      const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(session.id);
      return { ...session, messages };
    });
  }

  async summarizeSession(sessionId: number) {
    const db = getDatabase();
    const messages = db.prepare('SELECT speaker, text FROM messages WHERE session_id = ?').all(sessionId) as any[];
    
    const summary = await geminiMaestro.summarizeSession(messages);
    
    db.prepare('UPDATE sessions SET summary = ?, end_time = ? WHERE id = ?')
      .run(summary, new Date().toISOString(), sessionId);
    
    return summary;
  }

  deleteSession(sessionId: number) {
    const db = getDatabase();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  deleteOldSessions(keepCount: number = 50) {
    const db = getDatabase();
    const result = db.prepare(`
      DELETE FROM sessions 
      WHERE id NOT IN (
        SELECT id FROM sessions ORDER BY start_time DESC LIMIT ?
      )
    `).run(keepCount);
    
    return result.changes;
  }
}

export const sessionService = new SessionService();
