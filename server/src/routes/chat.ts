import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/sqlite';

export const chatRouter = Router();

// Initialize NVIDIA API client (OpenAI-compatible)
const nvidia = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
});

const MODEL = process.env.NVIDIA_MODEL || 'nvidia/llama-3_3-nemotron-super-49b-v1';

// ─── POST /api/chat/stream ────────────────────────────────────────────────────
// Sends a message and streams the response back (SSE)
chatRouter.post('/stream', async (req: Request, res: Response) => {
  const { messages, conversationId } = req.body as {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    conversationId?: string;
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages array is required' });
    return;
  }

  // Validate API key is set
  if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
    res.status(503).json({ 
      error: 'NVIDIA API key not configured. Please set NVIDIA_API_KEY in server/.env' 
    });
    return;
  }

  // Set up SSE (Server-Sent Events) headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  const convId = conversationId || uuidv4();
  const db = getDb();

  // Ensure conversation exists
  const existing = db.prepare('SELECT id FROM conversations WHERE id = ?').get(convId);
  if (!existing) {
    db.prepare('INSERT INTO conversations (id, title) VALUES (?, ?)').run(
      convId,
      messages.find(m => m.role === 'user')?.content?.slice(0, 60) || 'New Chat'
    );
  }

  // Save user message
  const userMsg = messages[messages.length - 1];
  if (userMsg.role === 'user') {
    db.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), convId, 'user', userMsg.content);
  }

  let fullContent = '';
  let fullReasoning = '';

  try {
    // Call NVIDIA API with streaming
    const stream = await nvidia.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are NOVA, a highly intelligent AI assistant powered by NVIDIA\'s advanced AI. Be helpful, thorough, and precise.'
        },
        ...messages
      ],
      stream: true,
      temperature: 0.6,
      max_tokens: 4096,
    });

    // Send conversation ID first
    res.write(`data: ${JSON.stringify({ type: 'init', conversationId: convId })}\n\n`);

    // Stream each token
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      // Handle reasoning content (thinking steps)
      if ((delta as any)?.reasoning_content) {
        const reasoning = (delta as any).reasoning_content;
        fullReasoning += reasoning;
        res.write(`data: ${JSON.stringify({ type: 'reasoning', content: reasoning })}\n\n`);
      }

      // Handle main content
      if (delta?.content) {
        fullContent += delta.content;
        res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
      }

      // Handle finish
      if (chunk.choices[0]?.finish_reason) {
        res.write(`data: ${JSON.stringify({ type: 'done', finish_reason: chunk.choices[0].finish_reason })}\n\n`);
      }
    }

    // Save assistant response to DB
    db.prepare('INSERT INTO messages (id, conversation_id, role, content, reasoning) VALUES (?, ?, ?, ?, ?)')
      .run(uuidv4(), convId, 'assistant', fullContent, fullReasoning || null);

    // Update conversation timestamp
    db.prepare('UPDATE conversations SET updated_at = unixepoch() WHERE id = ?').run(convId);

    res.end();

  } catch (error: any) {
    console.error('NVIDIA API error:', error);
    const errorMsg = error?.message || 'Unknown error';
    res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
    res.end();
  }
});

// ─── POST /api/chat/simple ────────────────────────────────────────────────────
// Non-streaming version (for testing)
chatRouter.post('/simple', async (req: Request, res: Response) => {
  const { message } = req.body as { message: string };

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY === 'your_nvidia_api_key_here') {
    res.status(503).json({ error: 'NVIDIA API key not configured' });
    return;
  }

  try {
    const completion = await nvidia.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: message }],
      stream: false,
    });

    res.json({
      content: completion.choices[0]?.message?.content,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
