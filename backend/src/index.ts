import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase } from './database/init';
import authRoutes from './routes/auth';
import fileStorageRoutes from './routes/fileStorage';
import tedRoutes from './routes/ted';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = new Set([
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'null'
].filter((origin): origin is string => Boolean(origin)));

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origem não permitida pelo CORS'));
  }
}));
app.use(express.json({ limit: '10mb' }));

// Rotas
app.use('/api/storage', fileStorageRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ted', tedRoutes);
app.use('/api/user', userRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../../index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

async function startServer() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.warn('⚠️ Banco de dados indisponível. As rotas baseadas em arquivo continuarão funcionando.', error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`💾 Arquivo compartilhado disponível em http://localhost:${PORT}/api/storage/status`);
  });
}

startServer().catch((error) => {
  console.error('Erro ao iniciar servidor:', error);
  process.exit(1);
});
