'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/app/page';
import { NovaLogo } from './NovaLogo';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const isAssistant = message.role === 'assistant';

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 max-w-4xl mx-auto w-full animate-slide-up ${
      isAssistant ? 'flex-row' : 'flex-row-reverse'
    }`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1c1c20] border border-[#2e2e34]">
            <NovaLogo size={20} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#4338ca] text-white text-xs font-bold">
            U
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isAssistant ? '' : 'flex justify-end'}`}>
        {/* Reasoning (thinking steps) */}
        {isAssistant && message.reasoning && (
          <div className="mb-3">
            <button
              onClick={() => setReasoningOpen(o => !o)}
              className="flex items-center gap-2 text-xs text-[#6366f1] hover:text-[#818cf8] transition-colors"
            >
              <span className={`transition-transform duration-200 ${reasoningOpen ? 'rotate-90' : ''}`}>
                ▶
              </span>
              <span>{reasoningOpen ? 'Hide' : 'Show'} reasoning steps</span>
            </button>
            {reasoningOpen && (
              <div className="mt-2 p-3 rounded-lg bg-[#141416] border border-[#2e2e34] border-dashed">
                <p className="text-xs text-[#6b7280] font-mono leading-relaxed whitespace-pre-wrap">
                  {message.reasoning}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main content bubble */}
        <div className={`relative group rounded-2xl px-4 py-3 ${
          isAssistant
            ? 'bg-[#141416] border border-[#242428] text-[#e8e8ed]'
            : 'bg-[#4338ca] text-white max-w-[80%]'
        }`}>
          {isAssistant ? (
            <div className="nova-prose text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = match || String(children).includes('\n');
                    const lang = match?.[1] || '';
                    
                    if (isBlock) {
                      return (
                        <div className="code-block-wrapper my-3">
                          <div className="code-block-header">
                            <span>{lang || 'code'}</span>
                            <CopyCodeButton code={String(children)} />
                          </div>
                          <SyntaxHighlighter
                            style={oneDark as any}
                            language={lang || 'text'}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              borderRadius: 0,
                              background: '#141416',
                              fontSize: '0.8125rem',
                            }}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  },
                }}
              >
                {message.content || ''}
              </ReactMarkdown>
              {message.isStreaming && (
                <span className="typing-cursor" />
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Copy button */}
          {isAssistant && message.content && !message.isStreaming && (
            <button
              onClick={copyMessage}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-[#1c1c20] border border-[#2e2e34] text-[#6b7280] hover:text-white text-xs"
              title="Copy message"
            >
              {copied ? '✓' : '⊕'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="code-copy-btn">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}
