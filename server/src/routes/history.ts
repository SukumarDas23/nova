import { Router, Request, Response } from 'express';
import { getDb } from '../db/sqlite';

export const historyRouter = Router();

// Helper: run a query and return rows as plain objects
function queryAll(sql: string, params: any[] = []): Record<string, any>[] {
  const db = getDb();
  const results = db.exec(sql, params);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

// ─── GET /api/history/conversations ──────────────────────────────────────────
historyRouter.get('/conversations', (_req: Request, res: Response) => {
  const rows = queryAll(
    'SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC'
  );
  res.json(rows);
});

// ─── GET /api/history/conversations/:id/messages ─────────────────────────────
historyRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const rows = queryAll(
    'SELECT id, role, content, reasoning, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [req.params.id]
  );
  res.json(rows);
});

// ─── DELETE /api/history/conversations/:id ───────────────────────────────────
historyRouter.delete('/conversations/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.run('DELETE FROM messages WHERE conversation_id = ?', [req.params.id]);
  db.run('DELETE FROM conversations WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// ─── PATCH /api/history/conversations/:id (rename) ───────────────────────────
historyRouter.patch('/conversations/:id', (req: Request, res: Response) => {
  const { title } = req.body as { title: string };
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }
  const db = getDb();
  db.run('UPDATE conversations SET title = ? WHERE id = ?', [title, req.params.id]);
  res.json({ success: true });
});
