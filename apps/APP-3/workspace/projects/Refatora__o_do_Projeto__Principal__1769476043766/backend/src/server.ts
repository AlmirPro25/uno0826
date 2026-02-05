
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import v1Routes from './routes/v1.routes';
import { PhysicsEngine } from './services/physics.engine';
import { logger, Severity, Origin } from './utils/logger';

// INITIALIZATION SEQUENCE
const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE CORTEX
app.use(helmet()); // Shielding
app.use(cors()); // Allow Colony Intranet
app.use(express.json()); // JSON Parser

// NEURAL PATHWAYS (ROUTES)
app.use('/api/v1', v1Routes);

// HEALTH CHECK
app.get('/', (req, res) => {
  res.send('AEROSPHERE OS v0.9.4 [ONLINE]');
});

// STARTUP
const start = async () => {
  try {
    // 1. Ignite Physics Engine
    PhysicsEngine.getInstance().startHeartbeat();
    
    // 2. Open Port
    app.listen(PORT, () => {
      logger.log(Severity.INFO, Origin.SYSTEM, `CORE ONLINE. LISTENING ON PORT ${PORT}`);
    });
  } catch (error) {
    console.error('CRITICAL BOOT FAILURE:', error);
    process.exit(1);
  }
};

start();
