
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import assetRoutes from './routes/asset.routes';
import systemRoutes from './routes/system.routes';

const app = express();

// DEFESA DE PERÍMETRO (Middleware)
app.use(helmet());
app.use(cors({ origin: '*' })); // Em prod, restringir para domínio do dashboard
app.use(express.json());
app.use(morgan('dev'));

// ROTAS TÁTICAS
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/system', systemRoutes);

// Health Check
app.get('/health', (req, res) => res.status(200).send('SENTINEL_ONLINE'));

export default app;
