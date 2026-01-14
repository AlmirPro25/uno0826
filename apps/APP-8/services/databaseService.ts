import initSqlJs from 'sql.js';
import { geminiService } from './geminiService';
import { TranscriptionEntry } from '../types';

export interface Message {
    id: number;
    sessionId: number;
    timestamp: string;
    speaker: 'user' | 'model' | 'analysis';
    text: string;
}

export interface Session {
    id: number;
    startTime: string;
    summary: string | null;
    messages: Message[];
}

let db: any = null;

const init = async () => {
    if (db) return;
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });
        
        // Try to load existing database from localStorage
        const savedDb = localStorage.getItem('gemini-companion-db');
        if (savedDb) {
            const buffer = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
            db = new SQL.Database(buffer);
            console.log('Loaded existing database from localStorage');
        } else {
            db = new SQL.Database();
            console.log('Created new database');
        }

        // Create tables if they don't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                startTime TEXT NOT NULL,
                summary TEXT
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sessionId INTEGER NOT NULL,
                timestamp TEXT NOT NULL,
                speaker TEXT NOT NULL,
                text TEXT NOT NULL,
                FOREIGN KEY (sessionId) REFERENCES sessions(id)
            );
        `);
        
        // Save to localStorage
        saveDatabase();
    } catch (err: any) {
        console.error('SQLite initialization error:', err.message);
        db = null;
        throw err;
    }
};

const saveDatabase = () => {
    if (db) {
        try {
            const data = db.export();
            const base64 = btoa(String.fromCharCode(...data));
            localStorage.setItem('gemini-companion-db', base64);
        } catch (error: any) {
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded. Database not saved.');
                // Optionally, you could trigger a cleanup here
            } else {
                console.error('Error saving database:', error);
            }
        }
    }
};

const createSession = async (): Promise<number> => {
    if (!db) await init();
    const startTime = new Date().toISOString();
    db.run('INSERT INTO sessions (startTime) VALUES (?)', [startTime]);
    const result = db.exec('SELECT last_insert_rowid()');
    saveDatabase();
    return result[0].values[0][0] as number;
};

const addMessage = async (sessionId: number, speaker: 'user' | 'model' | 'analysis', text: string): Promise<void> => {
    if (!db) await init();
    const timestamp = new Date().toISOString();
    db.run('INSERT INTO messages (sessionId, timestamp, speaker, text) VALUES (?, ?, ?, ?)', 
        [sessionId, timestamp, speaker, text]);
    saveDatabase();
};

const getHistory = async (): Promise<Session[]> => {
    if (!db) await init();
    const sessionsResult = db.exec('SELECT * FROM sessions ORDER BY startTime DESC');
    
    const history: Session[] = [];
    if (sessionsResult.length > 0) {
        const sessions = sessionsResult[0];
        for (let i = 0; i < sessions.values.length; i++) {
            const sessionRow = sessions.values[i];
            const sessionId = sessionRow[0];
            const messagesResult = db.exec('SELECT * FROM messages WHERE sessionId = ? ORDER BY timestamp ASC', [sessionId]);
            
            const messages: Message[] = [];
            if (messagesResult.length > 0) {
                const msgs = messagesResult[0];
                for (let j = 0; j < msgs.values.length; j++) {
                    const msg = msgs.values[j];
                    messages.push({
                        id: msg[0] as number,
                        sessionId: msg[1] as number,
                        timestamp: msg[2] as string,
                        speaker: msg[3] as 'user' | 'model' | 'analysis',
                        text: msg[4] as string,
                    });
                }
            }
            
            history.push({
                id: sessionRow[0] as number,
                startTime: sessionRow[1] as string,
                summary: sessionRow[2] as string | null,
                messages,
            });
        }
    }
    return history;
};

const getLatestSummary = async (): Promise<string | null> => {
    if (!db) await init();
    const result = db.exec('SELECT summary FROM sessions WHERE summary IS NOT NULL ORDER BY startTime DESC LIMIT 1');
    return result.length > 0 && result[0].values.length > 0 ? result[0].values[0][0] as string : null;
};

const summarizeAndStoreSession = async (sessionId: number, fullTranscript: string): Promise<void> => {
    if (!db) await init();
    const summary = await geminiService.summarizeText(fullTranscript);
    if(summary) {
        db.run('UPDATE sessions SET summary = ? WHERE id = ?', [summary, sessionId]);
        saveDatabase();
    }
};

const deleteOldSessions = async (keepCount: number = 10): Promise<void> => {
    if (!db) await init();
    
    // Get all sessions ordered by date
    const result = db.exec('SELECT id FROM sessions ORDER BY startTime DESC');
    
    if (result.length > 0 && result[0].values.length > keepCount) {
        const sessionsToDelete = result[0].values.slice(keepCount);
        
        for (const sessionRow of sessionsToDelete) {
            const sessionId = sessionRow[0];
            // Delete messages first
            db.run('DELETE FROM messages WHERE sessionId = ?', [sessionId]);
            // Delete session
            db.run('DELETE FROM sessions WHERE id = ?', [sessionId]);
        }
        
        saveDatabase();
        console.log(`Deleted ${sessionsToDelete.length} old sessions`);
    }
};

const clearAllData = (): void => {
    localStorage.removeItem('gemini-companion-db');
    db = null;
    console.log('All data cleared');
};

const getDatabaseSize = (): string => {
    const data = localStorage.getItem('gemini-companion-db');
    if (!data) return '0 KB';
    const bytes = data.length;
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
};

export const databaseService = {
    init,
    createSession,
    addMessage,
    getHistory,
    getLatestSummary,
    summarizeAndStoreSession,
    deleteOldSessions,
    clearAllData,
    getDatabaseSize,
};