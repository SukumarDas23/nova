'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { NovaLogo } from './NovaLogo';
import type { Message } from '@/app/page';

const SUGGESTIONS = [
  { icon: '💡', text: 'Explain quantum entanglement simply' },
  { icon: '💻', text: 'Write a REST API in TypeScript' },
  { icon: '📊', text: 'Analyze the pros and cons of microservices' },
  { icon: '🧮', text: 'Solve: If 9.11 > 9.8, is 0.9 > 0.10?' },
];

interface Props {
  messages: Message[];
  onRegenerate: () => void;
  onDeleteMessage: (id: string) => void;
  onEditMessage: (id: string, newContent: string) => void;
  isStreaming: boolean;
}

export function MessageList({ messages, onRegenerate, onDeleteMessage, onEditMessage, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(fromBottom > 200);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto" style={{ color: 'var(--text-primary)' }}>
        <div className="flex flex-col items-center gap-5 max-w-lg w-full animate-fade-in">
          {/* Logo */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
              <NovaLogo size={36} />
            </div>
            <div className="absolute -inset-1 rounded-2xl opacity-20 blur-lg"
                 style={{ background: 'var(--accent)' }} />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-1 gradient-text">NOVA</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Powered by NVIDIA · GLM-5.3 · Ask me anything
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full mt-2">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all group"
                style={{
                  background: 'var(--bg-surface-1)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-1)';
                }}
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs leading-snug">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
            isStreaming={isStreaming}
            onRegenerate={onRegenerate}
            onDelete={onDeleteMessage}
            onEdit={onEditMessage}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 p-2 rounded-full shadow-lg transition-all animate-fade-in"
          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}
    </div>
  );
}
