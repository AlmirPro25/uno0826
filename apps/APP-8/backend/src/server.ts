import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDatabase } from './database/db.js';
import { dailySummaryService } from './services/dailySummaryService.js';
import { setupWebSocketServer } from './websocket.js';

import sessionsRouter from './routes/sessions.js';
import memoriesRouter from './routes/memories.js';
import capturesRouter from './routes/captures.js';
import summariesRouter from './routes/summaries.js';
import contextRouter from './routes/context.js';
import peopleRouter from './routes/people.js';
import executorRouter from './routes/executor.js';
import tasksRouter from './routes/tasks.js';
import liveRouter from './routes/live.js';
import browserRouter from './routes/browser.js';
import roboticsRouter from './routes/robotics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Inicializa banco de dados
getDatabase();
console.log('✅ Database initialized');

// Agenda resumos automáticos
dailySummaryService.scheduleAutomaticSummaries();

// Rotas
app.use('/api/sessions', sessionsRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/captures', capturesRouter);
app.use('/api/summaries', summariesRouter);
app.use('/api/context', contextRouter);
app.use('/api/people', peopleRouter);
app.use('/api/executor', executorRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/live', liveRouter);
app.use('/api/browser', browserRouter);
app.use('/api/robotics', roboticsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Gemini Companion Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      sessions: '/api/sessions',
      memories: '/api/memories',
      captures: '/api/captures',
      summaries: '/api/summaries',
      context: '/api/context',
      people: '/api/people',
      executor: '/api/executor',
      tasks: '/api/tasks',
      live: '/api/live',
      browser: '/api/browser',
      robotics: '/api/robotics',
      health: '/health'
    }
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  🚀 Gemini Companion Backend                          ║
║  📡 Server running on http://localhost:${PORT}        ║
║  🤖 Gemini Maestro: ACTIVE                            ║
║  💾 SQLite3 Database: READY                           ║
║  📅 Auto-summaries: SCHEDULED                         ║
╚═══════════════════════════════════════════════════════╝
  `);
  
  // Inicia WebSocket Server para o Executor
  setupWebSocketServer(server);
});

export default app;
