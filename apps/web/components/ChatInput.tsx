'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import type { Settings } from '@/app/page';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  settings: Settings;
}

export function ChatInput({ onSend, onStop, isStreaming, settings }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX_CHARS = 8000;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [text]);

  // Focus on mount
  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim() || isStreaming) return;
    onSend(text.trim());
    setText('');
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const modelLabel = settings.model.split('/')[1] || settings.model;

  return (
    <div className="flex-shrink-0 px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div className="input-glow rounded-2xl overflow-hidden"
             style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={false}
            rows={1}
            placeholder="Message NOVA… (Enter to send, Shift+Enter for new line)"
            className="w-full px-4 pt-3.5 pb-2 bg-transparent resize-none outline-none text-sm leading-relaxed"
            style={{
              color: 'var(--text-primary)',
              maxHeight: '200px',
              caretColor: 'var(--accent)',
            }}
          />

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
            {/* Left: char count + model hint */}
            <div className="flex items-center gap-3">
              {charCount > 100 && (
                <span className="text-[10px]"
                      style={{ color: isOverLimit ? '#f87171' : 'var(--text-faint)' }}>
                  {charCount.toLocaleString()}{isOverLimit ? ` / ${MAX_CHARS.toLocaleString()} ⚠` : ''}
                </span>
              )}
              <span className="hidden sm:block text-[10px]" style={{ color: 'var(--text-faint)' }}>
                {modelLabel}
              </span>
            </div>

            {/* Right: stop or send */}
            <div className="flex items-center gap-2">
              {text && !isStreaming && (
                <span className="text-[10px] hidden sm:block" style={{ color: 'var(--text-faint)' }}>
                  ↵ Send · ⇧↵ Newline
                </span>
              )}

              {isStreaming ? (
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'rgba(239,68,68,.15)', color: '#f87171', border: '1px solid rgba(239,68,68,.3)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  Stop
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || isOverLimit}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: text.trim() && !isOverLimit ? 'var(--accent)' : 'var(--bg-surface-3)',
                    color: text.trim() && !isOverLimit ? 'white' : 'var(--text-faint)',
                    cursor: text.trim() && !isOverLimit ? 'pointer' : 'not-allowed',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Send
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] mt-2" style={{ color: 'var(--text-faint)' }}>
          NOVA · NVIDIA 753B MoE · Responses may contain errors — verify important information
        </p>
      </div>
    </div>
  );
}
