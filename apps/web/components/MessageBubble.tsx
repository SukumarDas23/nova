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
  const [liked, setLiked]                 = useState<'up' | 'down' | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [isDark, setIsDark]               = useState(true);
  const [isEditing, setIsEditing]         = useState(false);
  const [editText, setEditText]           = useState(message.content);
  const [hovered, setHovered]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const isAssistant = message.role === 'assistant';

  useEffect(() => {
    const update = () => setIsDark(!document.documentElement.classList.contains('light'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

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
    if (trimmed && trimmed !== message.content && onEdit) onEdit(message.id, trimmed);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
    if (e.key === 'Escape') { setEditText(message.content); setIsEditing(false); }
  };

  const handleDelete = () => {
    if (confirmDelete) { onDelete?.(message.id); setConfirmDelete(false); }
    else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2500); }
  };

  const codeStyle = isDark ? oneDark : oneLight;

  // ── USER message ─────────────────────────────────────────────────────────────
  if (!isAssistant) {
    return (
      <div
        className="flex flex-col items-end gap-1 max-w-3xl mx-auto w-full animate-slide-up"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      >
        <div className="flex items-end gap-2">
          {/* User bubble */}
          <div className="relative max-w-[75%]">
            {isEditing ? (
              <div className="rounded-2xl rounded-tr-sm px-4 py-3"
                   style={{ background: 'var(--user-bubble)', color: 'white', minWidth: 120 }}>
                <textarea
                  ref={editRef}
                  value={editText}
                  onChange={e => { setEditText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                  onKeyDown={handleEditKeyDown}
                  className="w-full bg-transparent resize-none outline-none text-sm leading-relaxed"
                  style={{ color: 'white', minHeight: '1.5rem' }}
                  rows={1}
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => { setEditText(message.content); setIsEditing(false); }}
                    className="text-xs px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}
                  >Cancel</button>
                  <button
                    onClick={handleEditSubmit}
                    className="text-xs px-3 py-1 rounded-lg font-medium"
                    style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--user-bubble)' }}
                  >Send</button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl rounded-tr-sm px-4 py-3"
                   style={{ background: 'var(--user-bubble)', color: 'white' }}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-0.5"
               style={{ background: 'var(--user-bubble)' }}>
            SU
          </div>
        </div>

        {/* Action bar below user message */}
        {hovered && !message.isStreaming && !isEditing && (
          <div className="flex items-center gap-1 pr-9 animate-fade-in">
            <IconBtn onClick={copyMessage} title={copied ? 'Copied!' : 'Copy'}>
              {copied
                ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </IconBtn>
            {onEdit && (
              <IconBtn onClick={() => setIsEditing(true)} title="Edit message">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </IconBtn>
            )}
            {onDelete && (
              <IconBtn onClick={handleDelete} title={confirmDelete ? 'Confirm' : 'Delete'} danger={confirmDelete}>
                {confirmDelete
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                }
              </IconBtn>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── ASSISTANT message (Claude style — no bubble, clean text) ─────────────────
  return (
    <div
      className="flex gap-3 max-w-3xl mx-auto w-full animate-slide-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
      {/* NOVA avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full flex items-center justify-center"
             style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
          <NovaLogo size={16} />
        </div>
      </div>

      {/* Content — no background, just clean text */}
      <div className="flex-1 min-w-0 pb-2">

        {/* Reasoning */}
        {message.reasoning && (
          <div className="mb-3">
            <button
              onClick={() => setReasoningOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs transition-all px-2.5 py-1 rounded-full"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                   style={{ transform: reasoningOpen ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span>{reasoningOpen ? 'Hide' : 'Show'} thinking</span>
              {message.isStreaming && !reasoningOpen && (
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: 'var(--accent)' }} />
              )}
            </button>
            {reasoningOpen && (
              <div className="mt-2 pl-3 reasoning-panel animate-fade-in">
                <p className="text-xs leading-relaxed whitespace-pre-wrap font-mono" style={{ color: 'var(--text-muted)' }}>
                  {message.reasoning}
                  {message.isStreaming && <span className="typing-cursor" />}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main text — Claude style, no bubble */}
        <div className="nova-prose text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
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
          ) : message.isStreaming ? (
            <span className="typing-cursor" />
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>…</span>
          )}
          {message.isStreaming && message.content && <span className="typing-cursor" />}
        </div>

        {/* ── Claude-style action bar ── */}
        {!message.isStreaming && message.content && (
          <div
            className="flex items-center gap-0.5 mt-3 transition-opacity duration-200"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            {/* Copy */}
            <IconBtn onClick={copyMessage} title={copied ? 'Copied!' : 'Copy'}>
              {copied
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              }
            </IconBtn>

            {/* Thumbs up */}
            <IconBtn onClick={() => setLiked(liked === 'up' ? null : 'up')} title="Good response" active={liked === 'up'} activeColor="var(--accent)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
            </IconBtn>

            {/* Thumbs down */}
            <IconBtn onClick={() => setLiked(liked === 'down' ? null : 'down')} title="Bad response" active={liked === 'down'} activeColor="#f87171">
              <svg width="14" height="14" viewBox="0 0 24 24" fill={liked === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
            </IconBtn>

            {/* Regenerate */}
            {isLast && onRegenerate && (
              <IconBtn onClick={onRegenerate} title="Regenerate">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.71"/>
                </svg>
              </IconBtn>
            )}

            {/* Delete */}
            {onDelete && (
              <IconBtn onClick={handleDelete} title={confirmDelete ? 'Confirm delete' : 'Delete'} danger={confirmDelete}>
                {confirmDelete
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                }
              </IconBtn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small icon button ──────────────────────────────────────────────────────────
function IconBtn({ children, onClick, title, active, activeColor, danger }: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  activeColor?: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
      style={{
        color: danger ? '#f87171' : active && activeColor ? activeColor : 'var(--text-muted)',
        background: 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      {children}
    </button>
  );
}

// ── Copy code button ───────────────────────────────────────────────────────────
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
