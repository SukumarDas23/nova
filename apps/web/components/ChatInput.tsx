'use client';

import { useState, useRef, useCallback } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, isStreaming, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  return (
    <div className="px-4 py-4 border-t border-[#1c1c20]">
      <div className="max-w-4xl mx-auto">
        <div className="glow-indigo relative flex items-end gap-3 bg-[#141416] border border-[#2e2e34] rounded-2xl px-4 py-3 transition-all duration-200">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message NOVA... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-[#e8e8ed] placeholder-[#4b5563] leading-relaxed min-h-[24px] max-h-[200px]"
          />

          {isStreaming ? (
            <button
              id="stop-btn"
              onClick={onStop}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20 text-sm font-medium transition-all duration-200"
            >
              <span className="w-2 h-2 rounded-sm bg-[#ef4444]" />
              Stop
            </button>
          ) : (
            <button
              id="send-btn"
              onClick={handleSubmit}
              disabled={!text.trim() || disabled}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#4338ca] hover:bg-[#4f46e5] disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all duration-200 active:scale-95"
            >
              <SendIcon />
              Send
            </button>
          )}
        </div>
        <p className="text-center text-[10px] text-[#374151] mt-2">
          NOVA · NVIDIA 753B MoE · Responses may contain errors — verify important information
        </p>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
