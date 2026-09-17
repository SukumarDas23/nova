'use client';

import { useState, useEffect } from 'react';
import { NovaLogo } from './NovaLogo';
import type { Conversation } from '@/app/page';

interface Props {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void; // called when mobile backdrop is tapped
}

function groupConversations(convs: Conversation[]) {
  const now   = Date.now() / 1000;
  const today = now - 86400;
  const week  = now - 7 * 86400;
  const month = now - 30 * 86400;

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Today',      items: [] },
    { label: 'Yesterday',  items: [] },
    { label: 'This week',  items: [] },
    { label: 'This month', items: [] },
    { label: 'Older',      items: [] },
  ];

  for (const c of convs) {
    const ts = c.updated_at;
    if (ts >= today)              groups[0].items.push(c);
    else if (ts >= today - 86400) groups[1].items.push(c);
    else if (ts >= week)          groups[2].items.push(c);
    else if (ts >= month)         groups[3].items.push(c);
    else                          groups[4].items.push(c);
  }

  return groups.filter(g => g.items.length > 0);
}

export function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onClose }: Props) {
  const [search, setSearch]       = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isMobile, setIsMobile]   = useState(false);

  // Detect mobile on mount + on resize
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );
  const groups = search ? [{ label: 'Results', items: filtered }] : groupConversations(filtered);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 2500);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    // Close drawer on mobile after selecting a conversation
    if (isMobile && onClose) onClose();
  };

  const handleNew = () => {
    onNew();
    if (isMobile && onClose) onClose();
  };

  // ── MOBILE: slide-over overlay drawer ────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Dark backdrop — tap to close */}
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(2px)',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
          }}
          onClick={onClose}
        />

        {/* Drawer panel */}
        <aside
          className="fixed top-0 left-0 h-full z-50 flex flex-col"
          style={{
            width: '280px',
            transform: open ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
            background: 'var(--bg-surface-1)',
            borderRight: '1px solid var(--border)',
            boxShadow: open ? '4px 0 32px rgba(0,0,0,0.45)' : 'none',
          }}
        >
          <DrawerContent
            groups={groups}
            search={search}
            setSearch={setSearch}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            confirmId={confirmId}
            activeId={activeId}
            conversations={conversations}
            onNew={handleNew}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        </aside>
      </>
    );
  }

  // ── DESKTOP: push-layout sidebar (original behaviour) ────────────────────────
  return (
    <aside
      className="flex flex-col h-full flex-shrink-0 transition-all duration-300 overflow-hidden border-r"
      style={{
        width: open ? '240px' : '0px',
        borderColor: 'var(--border)',
        background: 'var(--bg-surface-1)',
        minWidth: open ? '240px' : '0px',
      }}
    >
      {open && (
        <DrawerContent
          groups={groups}
          search={search}
          setSearch={setSearch}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          confirmId={confirmId}
          activeId={activeId}
          conversations={conversations}
          onNew={handleNew}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      )}
    </aside>
  );
}

// ── Shared inner content (used by both mobile drawer & desktop sidebar) ─────────
interface ContentProps {
  groups: { label: string; items: Conversation[] }[];
  search: string;
  setSearch: (v: string) => void;
  hoveredId: string | null;
  setHoveredId: (v: string | null) => void;
  confirmId: string | null;
  activeId: string | null;
  conversations: Conversation[];
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

function DrawerContent({
  groups, search, setSearch, hoveredId, setHoveredId,
  confirmId, activeId, conversations, onNew, onSelect, onDelete,
}: ContentProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b"
           style={{ borderColor: 'var(--border)' }}>
        <NovaLogo size={20} />
        <span className="font-semibold text-sm gradient-text">NOVA</span>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent)',
            border: '1px solid rgba(99,102,241,.25)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,.25)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Chat
        </button>
      </div>

      {/* Search */}
      {conversations.length > 3 && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
               style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                 style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chats…"
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>✕</button>
            )}
          </div>
        </div>
      )}

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: 'var(--text-muted)' }}>
            {search ? 'No matches' : 'No conversations yet'}
          </div>
        )}

        {groups.map(group => (
          <div key={group.label} className="mb-3">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider mb-1"
                 style={{ color: 'var(--text-faint)' }}>
              {group.label}
            </div>
            {group.items.map(conv => (
              <div
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer mb-0.5 group transition-all"
                style={{
                  background: activeId === conv.id ? 'var(--bg-surface-3)' : hoveredId === conv.id ? 'var(--bg-surface-2)' : 'transparent',
                  border: '1px solid',
                  borderColor: activeId === conv.id ? 'rgba(99,102,241,.3)' : 'transparent',
                }}
              >
                {activeId === conv.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                       style={{ background: 'var(--accent)' }} />
                )}

                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     style={{ flexShrink: 0, color: activeId === conv.id ? 'var(--accent)' : 'var(--text-faint)' }}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>

                <span className="flex-1 text-xs truncate"
                      style={{ color: activeId === conv.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {conv.title}
                </span>

                <button
                  onClick={e => onDelete(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                  style={{ color: confirmId === conv.id ? '#f87171' : 'var(--text-muted)' }}
                  title={confirmId === conv.id ? 'Click again to confirm' : 'Delete'}
                >
                  {confirmId === conv.id ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t text-[10px]"
           style={{ borderColor: 'var(--border)', color: 'var(--text-faint)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          NOVA · NVIDIA 753B MoE · Personal
        </div>
      </div>
    </div>
  );
}
