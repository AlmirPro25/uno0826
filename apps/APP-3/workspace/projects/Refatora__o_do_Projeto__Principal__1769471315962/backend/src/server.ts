
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';
import { errorHandler } from './middleware/error.middleware';
import prisma from './prisma';
import { calculateNextPosition } from './utils/geo';
import { AssetStatus } from '@prisma/client';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Em produção, restrinja para o domínio do frontend
    methods: ["GET", "POST"]
  }
});

// Middleware Base
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/v1', apiRoutes);

// Error Handling Global
app.use(errorHandler);

//
