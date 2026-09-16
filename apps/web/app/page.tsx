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
};

export type Conversation = {
  id: string;
  title: string;
  updated_at: number;
};

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/history/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {}
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/history/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          reasoning: m.reasoning,
        })));
        setActiveConvId(id);
      }
    } catch {}
  };

  const newChat = () => {
    setMessages([]);
    setActiveConvId(null);
  };

  const deleteConversation = async (id: string) => {
    await fetch(`/api/history/conversations/${id}`, { method: 'DELETE' });
    if (activeConvId === id) newChat();
    fetchConversations();
  };

  const sendMessage = useCallback(async (userText: string) => {
    if (isStreaming || !userText.trim()) return;

    const userMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: userText.trim(),
    };

    const assistantId = uuidv4();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      reasoning: '',
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    // Build history for the API
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: userText.trim() });

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          conversationId: activeConvId,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({ error: 'Stream failed' }));
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `❌ Error: ${err.error}`, isStreaming: false }
            : m
        ));
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

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
                m.id === assistantId
                  ? { ...m, content: m.content + evt.content }
                  : m
              ));
            } else if (evt.type === 'reasoning') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, reasoning: (m.reasoning || '') + evt.content }
                  : m
              ));
            } else if (evt.type === 'done') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              ));
              setIsStreaming(false);
              fetchConversations();
            } else if (evt.type === 'error') {
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: `❌ Error: ${evt.error}`, isStreaming: false }
                  : m
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
  }, [isStreaming, messages, activeConvId]);

  const stopStream = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages(prev => prev.map(m =>
      m.isStreaming ? { ...m, isStreaming: false } : m
    ));
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0d0f]">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeConvId}
        onSelect={loadConversation}
        onNew={newChat}
        onDelete={deleteConversation}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <NovaHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />

        <MessageList messages={messages} />

        <ChatInput
          onSend={sendMessage}
          onStop={stopStream}
          isStreaming={isStreaming}
          disabled={false}
        />
      </div>
    </div>
  );
}
