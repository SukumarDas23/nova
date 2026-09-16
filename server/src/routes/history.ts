import { Router, Request, Response } from 'express';
import { getDb } from '../db/sqlite';

export const historyRouter = Router();

// ─── GET /api/history/conversations ──────────────────────────────────────────
historyRouter.get('/conversations', (_req: Request, res: Response) => {
  const db = getDb();
  const conversations = db.prepare(`
    SELECT id, title, created_at, updated_at 
    FROM conversations 
    ORDER BY updated_at DESC
  `).all();
  res.json(conversations);
});

// ─── GET /api/history/conversations/:id/messages ─────────────────────────────
historyRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const db = getDb();
  const messages = db.prepare(`
    SELECT id, role, content, reasoning, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC
  `).all(req.params.id);
  res.json(messages);
});

// ─── DELETE /api/history/conversations/:id ───────────────────────────────────
historyRouter.delete('/conversations/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── PATCH /api/history/conversations/:id ────────────────────────────────────
historyRouter.patch('/conversations/:id', (req: Request, res: Response) => {
  const { title } = req.body as { title: string };
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const db = getDb();
  db.prepare('UPDATE conversations SET title = ? WHERE id = ?').run(title, req.params.id);
  res.json({ success: true });
});
