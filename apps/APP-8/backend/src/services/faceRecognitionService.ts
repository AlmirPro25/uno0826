/**
 * Serviço de Reconhecimento Facial
 * Usa Gemini Vision para identificar e lembrar de pessoas
 */

import { getDatabase } from '../database/db.js';
import { geminiMaestro } from './geminiMaestro.js';

export class FaceRecognitionService {
  /**
   * Analisa uma imagem e detecta pessoas
   */
  async detectPeople(imageBase64: string, sessionId: number): Promise<{
    people: Array<{
      name: string;
      isKnown: boolean;
      confidence: number;
      emotion?: string;
      description: string;
    }>;
    analysis: string;
  }> {
    const db = getDatabase();
    
    // Busca pessoas conhecidas
    const knownPeople = db.prepare(`
      SELECT id, name, description, relationship 
      FROM known_people 
      ORDER BY times_seen DESC
    `).all() as any[];

    // Monta contexto para o Gemini
    const knownPeopleContext = knownPeople.length > 0
      ? `\n\nPessoas conhecidas no sistema:\n${knownPeople.map(p => 
          `- ${p.name}: ${p.description || 'Sem descrição'} (${p.relationship || 'Relação não definida'})`
        ).join('\n')}`
      : '';

    const prompt = `Analise esta imagem e identifique TODAS as pessoas visíveis.

${knownPeopleContext}

Para cada pessoa detectada, retorne um JSON com:
{
  "people": [
    {
      "name": "nome da pessoa (se reconhecer) ou 'Pessoa Desconhecida'",
      "isKnown": true/false,
      "confidence": 0-100,
      "emotion": "emoção detectada (feliz, triste, neutro, etc)",
      "description": "descrição física breve (cabelo, roupas, etc)"
    }
  ],
  "analysis": "análise geral da cena e contexto"
}

Se reconhecer alguém das pessoas conhecidas, use o nome exato. Se não reconhecer, use "Pessoa Desconhecida" + número.`;

    try {
      const result = await geminiMaestro.analyzeImage(imageBase64, prompt);
      
      // Tenta extrair JSON da resposta
      const jsonMatch = result.description.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        
        // Registra detecções no banco
        for (const person of data.people) {
          if (person.isKnown) {
            const knownPerson = knownPeople.find(p => 
              p.name.toLowerCase() === person.name.toLowerCase()
            );
            
            if (knownPerson) {
              // Atualiza última vez visto
              db.prepare(`
                UPDATE known_people 
                SET last_seen = ?, times_seen = times_seen + 1 
                WHERE id = ?
              `).run(new Date().toISOString(), knownPerson.id);
              
              // Registra detecção
              db.prepare(`
                INSERT INTO person_detections 
                (session_id, person_id, timestamp, confidence, emotion, context)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(
                sessionId,
                knownPerson.id,
                new Date().toISOString(),
                person.confidence,
                person.emotion,
                data.analysis
              );
            }
          }
        }
        
        return data;
      }
    } catch (error) {
      console.error('Erro ao detectar pessoas:', error);
    }

    return {
      people: [],
      analysis: 'Não foi possível analisar a imagem'
    };
  }

  /**
   * Adiciona uma nova pessoa ao sistema
   */
  async addPerson(
    name: string,
    faceImage: string,
    description?: string,
    relationship?: string
  ): Promise<number> {
    const db = getDatabase();
    
    // Cria thumbnail
    const thumbnail = faceImage; // TODO: Redimensionar se necessário
    
    const result = db.prepare(`
      INSERT INTO known_people 
      (name, face_thumbnail, description, relationship, first_seen, last_seen)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name,
      Buffer.from(thumbnail, 'base64'),
      description || '',
      relationship || 'Usuário',
      new Date().toISOString(),
      new Date().toISOString()
    );

    console.log(`✅ Pessoa adicionada: ${name}`);
    return result.lastInsertRowid as number;
  }

  /**
   * Busca informações de uma pessoa
   */
  getPerson(personId: number) {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, name, description, relationship, first_seen, last_seen, times_seen, notes
      FROM known_people
      WHERE id = ?
    `).get(personId);
  }

  /**
   * Busca pessoa por nome
   */
  getPersonByName(name: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, name, description, relationship, first_seen, last_seen, times_seen, notes
      FROM known_people
      WHERE LOWER(name) = LOWER(?)
    `).get(name);
  }

  /**
   * Lista todas as pessoas conhecidas
   */
  getAllPeople() {
    const db = getDatabase();
    return db.prepare(`
      SELECT id, name, description, relationship, first_seen, last_seen, times_seen
      FROM known_people
      ORDER BY times_seen DESC
    `).all();
  }

  /**
   * Atualiza informações de uma pessoa
   */
  updatePerson(personId: number, updates: {
    description?: string;
    relationship?: string;
    notes?: string;
  }) {
    const db = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.relationship !== undefined) {
      fields.push('relationship = ?');
      values.push(updates.relationship);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }

    if (fields.length > 0) {
      values.push(personId);
      db.prepare(`
        UPDATE known_people 
        SET ${fields.join(', ')}
        WHERE id = ?
      `).run(...values);
    }
  }

  /**
   * Busca histórico de detecções de uma pessoa
   */
  getPersonHistory(personId: number, limit: number = 50) {
    const db = getDatabase();
    return db.prepare(`
      SELECT 
        pd.*,
        s.start_time,
        s.summary
      FROM person_detections pd
      JOIN sessions s ON pd.session_id = s.id
      WHERE pd.person_id = ?
      ORDER BY pd.timestamp DESC
      LIMIT ?
    `).all(personId, limit);
  }

  /**
   * Remove uma pessoa do sistema
   */
  deletePerson(personId: number) {
    const db = getDatabase();
    db.prepare('DELETE FROM known_people WHERE id = ?').run(personId);
    console.log(`🗑️ Pessoa removida: ID ${personId}`);
  }
}

export const faceRecognitionService = new FaceRecognitionService();
