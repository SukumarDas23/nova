import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatRouter } from './routes/chat';
import { historyRouter } from './routes/history';
import { initDb, persistDb } from './db/sqlite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/chat', chatRouter);
app.use('/api/history', historyRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    model: process.env.NVIDIA_MODEL,
    timestamp: new Date().toISOString()
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
async function start() {
  // Initialize SQLite (WASM-based, no native compilation needed)
  await initDb();

  // Persist DB to disk every 30 seconds as a safety net
  setInterval(() => persistDb(), 30_000);

  // Persist DB on graceful shutdown
  process.on('SIGTERM', () => { persistDb(); process.exit(0); });
  process.on('SIGINT',  () => { persistDb(); process.exit(0); });

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════╗
║        NOVA Server Running           ║
║  Port:  ${PORT}                          ║
║  Model: ${(process.env.NVIDIA_MODEL || '').slice(0, 25)}...  ║
╚══════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);
