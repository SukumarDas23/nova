'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageList } from '@/components/MessageList';
import { ChatInput } from '@/components/ChatInput';
import { Sidebar } from '@/components/Sidebar';
import { NovaHeader } from '@/components/NovaHeader';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  tokenCount?: number;
};

export type Conversation = {
  id: string;
  title: string;
  updated_at: number;
};

export type Settings = {
  model: string;
  temperature: number;
  maxTokens: number;
  theme: 'dark' | 'light';
};

const DEFAULT_SETTINGS: Settings = {
  model: 'z-ai/glm-5.3-flash',
  temperature: 0.6,
  maxTokens: 4096,
  theme: 'dark',
};

export default function HomePage() {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId]   = useState<string | null>(null);
  const [isStreaming, setIsStreaming]      = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const [settings, setSettings]           = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen]   = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [settings.theme]);

  // Load conversations + restore settings on mount
  useEffect(() => {
    fetchConversations();
    const saved = localStorage.getItem('nova-settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Persist settings
  const updateSettings = (patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('nova-settings', JSON.stringify(next));
      return next;
    });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/history/conversations');
      if (res.ok) setConversations(await res.json());
    } catch {}
  };

  const loadConversation = async (id: string) => {
    if (isStreaming) return;
    try {
      const res = await fetch(`/api/history/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({
          id: m.id, role: m.role,
          content: m.content, reasoning: m.reasoning,
        })));
        setActiveConvId(id);
      }
    } catch {}
  };

  const newChat = () => {
    if (isStreaming) return;
    setMessages([]);
    setActiveConvId(null);
  };

  const deleteConversation = async (id: string) => {
    await fetch(`/api/history/conversations/${id}`, { method: 'DELETE' });
    if (activeConvId === id) newChat();
    fetchConversations();
  };

  // ─── Core send/stream logic ─────────────────────────────────────────────────
  const sendMessage = useCallback(async (userText: string) => {
    if (isStreaming || !userText.trim()) return;

    const userMsg: Message = { id: uuidv4(), role: 'user', content: userText.trim() };
    const assistantId = uuidv4();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', reasoning: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const history = [...messages.map(m => ({ role: m.role, content: m.content })),
                     { role: 'user' as const, content: userText.trim() }];

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          conversationId: activeConvId,
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({ error: 'Stream failed' }));
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: `❌ Error: ${err.error}`, isStreaming: false } : m
        ));
        setIsStreaming(false);
        return;
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';           // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'init') {
              setActiveConvId(evt.conversationId);
            } else if (evt.type === 'content') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + evt.content } : m
              ));
            } else if (evt.type === 'reasoning') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, reasoning: (m.reasoning || '') + evt.content } : m
              ));
            } else if (evt.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              ));
              setIsStreaming(false);
              fetchConversations();
            } else if (evt.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: `❌ ${evt.error}`, isStreaming: false } : m
              ));
              setIsStreaming(false);
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: '❌ Connection error. Is the server running?', isStreaming: false }
            : m
        ));
      }
      setIsStreaming(false);
    }
  }, [isStreaming, messages, activeConvId, settings]);

  // ─── Regenerate last assistant response ────────────────────────────────────
  const regenerateLast = useCallback(() => {
    if (isStreaming) return;
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    // Drop the last assistant message and re-send
    const withoutLast = messages.slice(0, messages.length - 1).filter(m =>
      !(m.role === 'assistant' && messages.indexOf(m) === messages.length - 1)
    );
    setMessages(withoutLast.filter(m => m !== messages[messages.length - 1]));
    // Re-trigger send with last user message
    const trimmedMessages = messages.filter(m => m.role !== 'assistant' ||
      messages.indexOf(m) < messages.length - 1
    );
    setMessages(trimmedMessages.slice(0, -1));
    sendMessage(lastUser.content);
  }, [isStreaming, messages, sendMessage]);

  const stopStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeConvId}
        onSelect={loadConversation}
        onNew={newChat}
        onDelete={deleteConversation}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <NovaHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          settings={settings}
          onUpdateSettings={updateSettings}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen(o => !o)}
          isStreaming={isStreaming}
        />

        <MessageList
          messages={messages}
          onRegenerate={regenerateLast}
          isStreaming={isStreaming}
        />

        <ChatInput
          onSend={sendMessage}
          onStop={stopStream}
          isStreaming={isStreaming}
          settings={settings}
        />
      </div>
    </div>
  );
}
