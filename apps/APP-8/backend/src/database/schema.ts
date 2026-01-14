import Database from 'better-sqlite3';

export function initializeDatabase(db: Database.Database) {
  // Tabela de sessões
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      summary TEXT,
      daily_summary_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (daily_summary_id) REFERENCES daily_summaries(id)
    );
  `);

  // Tabela de mensagens
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      speaker TEXT NOT NULL CHECK(speaker IN ('user', 'model', 'analysis')),
      text TEXT NOT NULL,
      audio_data BLOB,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  `);

  // Tabela de memórias de longo prazo
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('conversation', 'fact', 'preference', 'skill', 'context')),
      importance INTEGER NOT NULL CHECK(importance BETWEEN 1 AND 10),
      embedding BLOB,
      tags TEXT,
      related_to TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
    CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
  `);

  // Tabela de perfil do usuário
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      name TEXT,
      preferences TEXT,
      skills TEXT,
      interests TEXT,
      work_patterns TEXT,
      communication_style TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO user_profile (id, preferences, skills, interests, work_patterns) 
    VALUES (1, '{}', '[]', '[]', '{}');
  `);

  // Tabela de capturas de tela/fotos
  db.exec(`
    CREATE TABLE IF NOT EXISTS captures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      message_id INTEGER,
      timestamp TEXT NOT NULL,
      image_data BLOB NOT NULL,
      thumbnail BLOB,
      description TEXT,
      ai_analysis TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_captures_session ON captures(session_id);
    CREATE INDEX IF NOT EXISTS idx_captures_timestamp ON captures(timestamp);
  `);

  // Tabela de resumos diários (Gemini Maestro)
  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      key_topics TEXT,
      important_facts TEXT,
      user_mood TEXT,
      productivity_score INTEGER,
      ai_insights TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);
  `);

  // Tabela de contexto ativo (memória de curto prazo)
  db.exec(`
    CREATE TABLE IF NOT EXISTS short_term_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      relevance_score REAL DEFAULT 1.0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_context_timestamp ON short_term_context(timestamp);
  `);

  // Tabela de pessoas reconhecidas (reconhecimento facial)
  db.exec(`
    CREATE TABLE IF NOT EXISTS known_people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      face_encoding BLOB,
      face_thumbnail BLOB,
      description TEXT,
      relationship TEXT,
      first_seen TEXT NOT NULL,
      last_seen TEXT NOT NULL,
      times_seen INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_people_name ON known_people(name);
    CREATE INDEX IF NOT EXISTS idx_people_last_seen ON known_people(last_seen);
  `);

  // Tabela de detecções de pessoas em sessões
  db.exec(`
    CREATE TABLE IF NOT EXISTS person_detections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      person_id INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      confidence REAL,
      emotion TEXT,
      context TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (person_id) REFERENCES known_people(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_detections_session ON person_detections(session_id);
    CREATE INDEX IF NOT EXISTS idx_detections_person ON person_detections(person_id);
  `);

  console.log('✅ Database schema initialized');
}
