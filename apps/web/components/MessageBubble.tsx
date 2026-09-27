'use client';

import { useState, useEffect, useRef } from 'react';
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
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
}

export function MessageBubble({ message, isLast, isStreaming, onRegenerate, onDelete, onEdit }: Props) {
  const [copied, setCopied]               = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [isDark, setIsDark]               = useState(true);
  const [isEditing, setIsEditing]         = useState(false);
  const [editText, setEditText]           = useState(message.content);
  const [hovered, setHovered]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const isAssistant = message.role === 'assistant';

  // Detect current theme
  useEffect(() => {
    const update = () => setIsDark(!document.documentElement.classList.contains('light'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Auto-focus + auto-resize textarea when editing
  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.focus();
      editRef.current.style.height = 'auto';
      editRef.current.style.height = editRef.current.scrollHeight + 'px';
    }
  }, [isEditing]);

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== message.content && onEdit) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
    if (e.key === 'Escape') { setEditText(message.content); setIsEditing(false); }
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete?.(message.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  const codeStyle = isDark ? oneDark : oneLight;
  const showActions = hovered && !message.isStreaming && message.content;

  return (
    <div
      className={`flex gap-3 max-w-3xl mx-auto w-full animate-slide-up ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
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
      <div className={`flex-1 min-w-0 ${isAssistant ? '' : 'flex flex-col items-end'}`}>

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
        <div className={`relative rounded-2xl px-4 py-3 ${
          isAssistant ? 'rounded-tl-sm w-full' : 'rounded-tr-sm max-w-[80%]'
        }`}
          style={isAssistant
            ? { background: 'var(--bg-surface-1)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
            : { background: 'var(--user-bubble)', color: 'white' }
          }
        >
          {/* Edit mode */}
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                ref={editRef}
                value={editText}
                onChange={e => { setEditText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                onKeyDown={handleEditKeyDown}
                className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed"
                style={{ color: 'white', minHeight: '2rem' }}
                rows={1}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setEditText(message.content); setIsEditing(false); }}
                  className="text-xs px-3 py-1 rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="text-xs px-3 py-1 rounded-lg font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--user-bubble)' }}
                >
                  Send
                </button>
              </div>
            </div>
          ) : isAssistant ? (
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
              {message.isStreaming && <span className="typing-cursor" />}
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* ── Action toolbar (Claude-style, appears below message on hover) ─── */}
        {showActions && !isEditing && (
          <div
            className="flex items-center gap-1 mt-1.5 animate-fade-in"
            style={{ justifyContent: isAssistant ? 'flex-start' : 'flex-end' }}
          >
            {/* Copy */}
            <ActionBtn
              onClick={copyMessage}
              title={copied ? 'Copied!' : 'Copy'}
              active={copied}
              activeColor="#4ade80"
            >
              {copied ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              )}
            </ActionBtn>

            {/* Edit (user messages only) */}
            {!isAssistant && onEdit && (
              <ActionBtn onClick={() => setIsEditing(true)} title="Edit message">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </ActionBtn>
            )}

            {/* Regenerate (last assistant only) */}
            {isAssistant && isLast && onRegenerate && (
              <ActionBtn onClick={onRegenerate} title="Regenerate">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.71"/>
                </svg>
              </ActionBtn>
            )}

            {/* Delete */}
            {onDelete && (
              <ActionBtn
                onClick={handleDelete}
                title={confirmDelete ? 'Click again to confirm' : 'Delete message'}
                active={confirmDelete}
                activeColor="#f87171"
              >
                {confirmDelete ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                )}
              </ActionBtn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small icon action button ──────────────────────────────────────────────────
function ActionBtn({
  children, onClick, title, active, activeColor,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
      style={{
        background: active ? `${activeColor}22` : 'var(--bg-surface-2)',
        border: '1px solid var(--border)',
        color: active ? activeColor : 'var(--text-muted)',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
      }}
    >
      {children}
    </button>
  );
}

// ── Copy code button inside code blocks ──────────────────────────────────────
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
