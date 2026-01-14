import { getDatabase } from '../database/db.js';
import { geminiMaestro } from './geminiMaestro.js';
import sharp from 'sharp';

export class CaptureService {
  async saveCapture(
    imageBuffer: Buffer,
    sessionId?: number,
    messageId?: number,
    context?: string
  ) {
    const db = getDatabase();
    
    // Cria thumbnail
    const thumbnail = await sharp(imageBuffer)
      .resize(200, 200, { fit: 'inside' })
      .jpeg({ quality: 70 })
      .toBuffer();
    
    // Analisa imagem com Gemini
    const imageBase64 = imageBuffer.toString('base64');
    const analysis = await geminiMaestro.analyzeImage(imageBase64, context);
    
    const stmt = db.prepare(`
      INSERT INTO captures (session_id, message_id, timestamp, image_data, thumbnail, description, ai_analysis, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      sessionId || null,
      messageId || null,
      new Date().toISOString(),
      imageBuffer,
      thumbnail,
      analysis.description,
      analysis.relevantInfo,
      JSON.stringify(analysis.tags)
    );
    
    return {
      id: result.lastInsertRowid,
      analysis
    };
  }

  getCapture(captureId: number, includeFull: boolean = false) {
    const db = getDatabase();
    const columns = includeFull 
      ? '*' 
      : 'id, session_id, message_id, timestamp, thumbnail, description, ai_analysis, tags';
    
    const capture = db.prepare(`SELECT ${columns} FROM captures WHERE id = ?`).get(captureId) as any;
    
    if (capture && capture.tags) {
      capture.tags = JSON.parse(capture.tags);
    }
    
    return capture;
  }

  getCapturesBySession(sessionId: number) {
    const db = getDatabase();
    const captures = db.prepare(`
      SELECT id, timestamp, thumbnail, description, tags 
      FROM captures 
      WHERE session_id = ? 
      ORDER BY timestamp DESC
    `).all(sessionId) as any[];
    
    return captures.map(c => ({
      ...c,
      tags: JSON.parse(c.tags)
    }));
  }

  searchCapturesByTags(tags: string[]) {
    const db = getDatabase();
    const captures = db.prepare('SELECT * FROM captures').all() as any[];
    
    return captures
      .map(c => ({ ...c, tags: JSON.parse(c.tags) }))
      .filter(c => tags.some(tag => c.tags.includes(tag)));
  }

  deleteCapture(captureId: number) {
    const db = getDatabase();
    db.prepare('DELETE FROM captures WHERE id = ?').run(captureId);
  }
}

export const captureService = new CaptureService();
