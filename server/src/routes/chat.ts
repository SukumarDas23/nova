import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getDb, persistDb } from '../db/sqlite';

export const chatRouter = Router();

// ─── Lazy NVIDIA client (created on first request, after dotenv runs) ─────────
let _nvidia: OpenAI | null = null;
function getNvidiaClient(): OpenAI {
  if (!_nvidia) {
    _nvidia = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || '',
      baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    });
  }
  return _nvidia;
}
function getModel(): string {
  return process.env.NVIDIA_MODEL || 'z-ai/glm-5.3-flash';
}

// ─── Helper: run query, return rows as plain objects ──────────────────────────
function queryAll(sql: string, params: any[] = []): Record<string, any>[] {
  const db = getDb();
  const results = db.exec(sql, params);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}
function queryGet(sql: string, params: any[] = []): Record<string, any> | undefined {
  return queryAll(sql, params)[0];
}

// ─── POST /api/chat/stream ────────────────────────────────────────────────────
// SSE streaming endpoint — accepts model/temperature/maxTokens overrides
chatRouter.post('/stream', async (req: Request, res: Response) => {
  const { messages, conversationId, model, temperature, maxTokens } = req.body as {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    conversationId?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }
  if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
    res.status(503).json({ error: 'NVIDIA API key not configured. Set NVIDIA_API_KEY in server/.env' });
    return;
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const activeModel = model || getModel();
  const activeTemp  = temperature ?? 0.6;
  const activeMax   = maxTokens ?? 4096;
  const convId = conversationId || uuidv4();
  const db = getDb();

  // Ensure conversation exists
  const existing = queryGet('SELECT id FROM conversations WHERE id = ?', [convId]);
  if (!existing) {
    const title = messages.find(m => m.role === 'user')?.content?.slice(0, 60) || 'New Chat';
    db.run('INSERT INTO conversations (id, title) VALUES (?, ?)', [convId, title]);
  }

  // Save user message
  const userMsg = messages[messages.length - 1];
  if (userMsg?.role === 'user') {
    db.run(
      'INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)',
      [uuidv4(), convId, 'user', userMsg.content]
    );
    persistDb();
  }

  let fullContent = '';
  let fullReasoning = '';

  try {
    const stream = await getNvidiaClient().chat.completions.create({
      model: activeModel,
      messages: [
        { role: 'system', content: "You are NOVA, a highly intelligent AI assistant powered by NVIDIA's advanced AI. Be helpful, thorough, and precise." },
        ...messages
      ],
      stream: true,
      temperature: activeTemp,
      max_tokens: activeMax,
    });

    res.write(`data: ${JSON.stringify({ type: 'init', conversationId: convId })}\n\n`);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if ((delta as any)?.reasoning_content) {
        const r = (delta as any).reasoning_content;
        fullReasoning += r;
        res.write(`data: ${JSON.stringify({ type: 'reasoning', content: r })}\n\n`);
      }
      if (delta?.content) {
        fullContent += delta.content;
        res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
      }
      if (chunk.choices[0]?.finish_reason) {
        res.write(`data: ${JSON.stringify({ type: 'done', finish_reason: chunk.choices[0].finish_reason })}\n\n`);
      }
    }

    db.run(
      'INSERT INTO messages (id, conversation_id, role, content, reasoning) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), convId, 'assistant', fullContent, fullReasoning || null]
    );
    db.run("UPDATE conversations SET updated_at = strftime('%s','now') WHERE id = ?", [convId]);
    persistDb();
    res.end();

  } catch (error: any) {
    console.error('NVIDIA API error:', error?.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error?.message || 'Unknown error' })}\n\n`);
    res.end();
  }
});

// ─── POST /api/chat/simple ──── non-streaming (for testing) ──────────────────
chatRouter.post('/simple', async (req: Request, res: Response) => {
  const { message } = req.body as { message: string };
  if (!message) { res.status(400).json({ error: 'message is required' }); return; }
  if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
    res.status(503).json({ error: 'NVIDIA API key not configured' }); return;
  }
  try {
    const completion = await getNvidiaClient().chat.completions.create({
      model: getModel(),
      messages: [{ role: 'user', content: message }],
      stream: false,
      max_tokens: 4096,
    });
    const msg = completion.choices[0]?.message as any;
    res.json({
      content: msg?.content || msg?.reasoning_content || '(no response)',
      reasoning: msg?.reasoning_content,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/chat/models ─────────────────────────────────────────────────────
chatRouter.get('/models', (_req: Request, res: Response) => {
  res.json({
    current: getModel(),
    available: [
      { id: 'z-ai/glm-5.3-flash', label: 'GLM-5.3 Flash', description: 'Fast responses, great for most tasks' },
      { id: 'z-ai/glm-5.3',       label: 'GLM-5.3',       description: 'Deep reasoning, more thorough' },
      { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1', label: 'Nemotron Ultra 253B', description: 'NVIDIA flagship model' },
      { id: 'deepseek-ai/deepseek-v4-flash-0731', label: 'DeepSeek V4 Flash', description: 'Fast DeepSeek model' },
    ]
  });
});
