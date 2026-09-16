'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '@/app/page';
import { NovaLogo } from './NovaLogo';

interface Props {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, isLast, isStreaming, onRegenerate }: Props) {
  const [copied, setCopied]           = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [isDark, setIsDark]           = useState(true);
  const isAssistant = message.role === 'assistant';

  // Detect current theme
  useEffect(() => {
    const update = () => setIsDark(!document.documentElement.classList.contains('light'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showRegenerate = isAssistant && isLast && !isStreaming && onRegenerate;
  const codeStyle = isDark ? oneDark : oneLight;

  return (
    <div className={`flex gap-3 max-w-3xl mx-auto w-full animate-slide-up ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>

      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isAssistant ? (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
            <NovaLogo size={20} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
               style={{ background: 'var(--user-bubble)' }}>
            U
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isAssistant ? '' : 'flex justify-end'}`}>

        {/* Reasoning panel */}
        {isAssistant && message.reasoning && (
          <div className="mb-2.5">
            <button
              onClick={() => setReasoningOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1 rounded-lg"
              style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   style={{ transform: reasoningOpen ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <span>{reasoningOpen ? 'Hide' : 'Show'} reasoning</span>
              {message.isStreaming && !reasoningOpen && (
                <span className="w-1 h-1 rounded-full animate-pulse-slow" style={{ background: 'var(--accent)' }} />
              )}
            </button>

            {reasoningOpen && (
              <div className="mt-1.5 reasoning-panel animate-fade-in">
                <p className="text-xs leading-relaxed whitespace-pre-wrap font-mono"
                   style={{ color: 'var(--text-muted)' }}>
                  {message.reasoning}
                  {message.isStreaming && <span className="typing-cursor" />}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main bubble */}
        <div className={`relative group rounded-2xl px-4 py-3 ${
          isAssistant
            ? 'rounded-tl-sm'
            : 'rounded-tr-sm max-w-[80%]'
        }`}
          style={isAssistant
            ? { background: 'var(--bg-surface-1)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
            : { background: 'var(--user-bubble)', color: 'white' }
          }
        >
          {isAssistant ? (
            <div className="nova-prose text-sm leading-relaxed">
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
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
                              style={codeStyle as any}
                              language={lang || 'text'}
                              PreTag="div"
                              customStyle={{
                                margin: 0, borderRadius: 0,
                                background: isDark ? '#0d1117' : '#f6f8fa',
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
                    // Open links in new tab
                    a({ href, children, ...props }: any) {
                      return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : message.isStreaming ? null : (
                <span style={{ color: 'var(--text-muted)' }}>…</span>
              )}
              {message.isStreaming && (
                <span className="typing-cursor" />
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Copy button (appears on hover for assistant, always for user) */}
          {!message.isStreaming && message.content && (
            <button
              onClick={copyMessage}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg text-xs"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border)',
                color: copied ? '#4ade80' : 'var(--text-muted)',
              }}
              title={copied ? 'Copied!' : 'Copy message'}
            >
              {copied ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
            </button>
          )}
        </div>

        {/* Regenerate button */}
        {showRegenerate && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface-1)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.71"/>
              </svg>
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="code-copy-btn"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}
