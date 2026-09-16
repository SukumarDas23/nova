'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/app/page';
import { MessageBubble } from './MessageBubble';
import { NovaLogo } from './NovaLogo';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
        <div className="flex flex-col items-center gap-6 animate-fade-in">
          <NovaLogo size={72} />
          <div className="text-center">
            <h1 className="text-3xl font-semibold gradient-text mb-2">NOVA</h1>
            <p className="text-[#6b7280] text-base">
              Powered by NVIDIA&rsquo;s 753B MoE Model
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 w-full max-w-xl">
            {STARTER_PROMPTS.map(prompt => (
              <button
                key={prompt}
                className="text-left p-3 rounded-xl border border-[#2e2e34] bg-[#141416] hover:bg-[#1c1c20] hover:border-[#6366f1] text-sm text-[#9ca3af] hover:text-[#e8e8ed] transition-all duration-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

const STARTER_PROMPTS = [
  '✨ Explain quantum computing simply',
  '🧠 Help me debug my Python code',
  '📝 Write a professional email template',
  '🔬 Analyze this data and give insights',
];
