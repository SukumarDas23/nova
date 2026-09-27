'use client';

import { useState, useEffect, useRef } from 'react';
import { NovaLogo } from './NovaLogo';
import type { Conversation } from '@/app/page';

interface Props {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
  onToggle: () => void;
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

const PINNED_KEY = 'nova-pinned-convs';

export function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onClose, onToggle }: Props) {
  const [search, setSearch]       = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pinned, setPinned]       = useState<string[]>([]);
  const [isMobile, setIsMobile]   = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINNED_KEY);
      if (saved) setPinned(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (searchMode && searchRef.current) searchRef.current.focus();
  }, [searchMode]);

  const savePinned = (ids: string[]) => {
    setPinned(ids);
    localStorage.setItem(PINNED_KEY, JSON.stringify(ids));
  };

  const togglePin = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    savePinned(pinned.includes(id) ? pinned.filter(p => p !== id) : [id, ...pinned]);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmId === id) {
      onDelete(id);
      savePinned(pinned.filter(p => p !== id));
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 2500);
    }
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    if (isMobile && onClose) onClose();
  };

  const handleNew = () => {
    onNew();
    setSearch('');
    setSearchMode(false);
    if (isMobile && onClose) onClose();
  };

  const filtered     = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const pinnedConvs  = conversations.filter(c => pinned.includes(c.id));
  const unpinned     = (search ? filtered : conversations).filter(c => !pinned.includes(c.id));
  const groups       = search ? [{ label: 'Results', items: unpinned }] : groupConversations(unpinned);

  // ── Collapsed: icon rail (OpenAI style) ──────────────────────────────────────
  const iconRail = (
    <div
      className="flex flex-col items-center py-3 h-full"
      style={{ width: 60, background: 'var(--bg-surface-1)', borderRight: '1px solid var(--border)' }}
    >
      {/* Logo / expand */}
      <button
        onClick={onToggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-all"
        style={{ color: 'var(--text-muted)' }}
        title="Open sidebar"
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* New chat */}
      <button
        onClick={handleNew}
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-1 transition-all"
        style={{ color: 'var(--text-muted)' }}
        title="New chat"
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

      {/* Search */}
      <button
        onClick={() => { onToggle(); setTimeout(() => setSearchMode(true), 150); }}
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-1 transition-all"
        style={{ color: 'var(--text-muted)' }}
        title="Search chats"
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>

      {/* Chats */}
      <button
        onClick={onToggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
        style={{ color: 'var(--text-muted)' }}
        title="Chats"
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white mb-1"
           style={{ background: 'var(--accent)' }}>
        SU
      </div>
    </div>
  );

  // ── Expanded sidebar content ──────────────────────────────────────────────────
  const expandedContent = (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Top: Logo + collapse button */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="font-semibold text-sm gradient-text flex-1">NOVA</span>
        {/* New chat */}
        <button
          onClick={handleNew}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          title="New chat"
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {/* Scrollable conversation area */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">

        {/* ── Pinned section ── */}
        {pinnedConvs.length > 0 && !search && (
          <div className="mb-3">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                 style={{ color: 'var(--text-faint)' }}>
              Pinned
            </div>
            {pinnedConvs.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                activeId={activeId}
                hoveredId={hoveredId}
                confirmId={confirmId}
                isPinned
                onSelect={handleSelect}
                onHover={setHoveredId}
                onDelete={handleDelete}
                onPin={togglePin}
              />
            ))}
          </div>
        )}

        {/* ── Chats and tasks section ── */}
        <div>
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
               style={{ color: 'var(--text-faint)' }}>
            Chats and tasks
          </div>

          {groups.length === 0 && (
            <div className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              {search ? 'No matches' : 'No conversations yet'}
            </div>
          )}

          {groups.map(group => (
            <div key={group.label} className="mb-2">
              {group.label !== 'Results' && (
                <div className="px-2 py-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  {group.label}
                </div>
              )}
              {group.items.map(conv => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  activeId={activeId}
                  hoveredId={hoveredId}
                  confirmId={confirmId}
                  isPinned={false}
                  onSelect={handleSelect}
                  onHover={setHoveredId}
                  onDelete={handleDelete}
                  onPin={togglePin}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom: Search bar (Claude style) + user ── */}
      <div className="flex-shrink-0 border-t px-2 pt-2 pb-3"
           style={{ borderColor: 'var(--border)' }}>

        {/* Search */}
        {searchMode ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 animate-fade-in"
               style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--accent)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                 style={{ color: 'var(--accent)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && (setSearchMode(false), setSearch(''))}
              placeholder="Search chats…"
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              onClick={() => { setSearchMode(false); setSearch(''); }}
              style={{ color: 'var(--text-muted)' }}
              className="text-xs"
            >✕</button>
          </div>
        ) : (
          <button
            onClick={() => setSearchMode(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl mb-2 text-xs transition-all"
            style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                 style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search chats…
          </button>
        )}

        {/* User */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all cursor-pointer"
             style={{ color: 'var(--text-secondary)' }}
             onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'}
             onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
               style={{ background: 'var(--accent)' }}>
            SU
          </div>
          <span className="text-xs font-medium">SU · Free</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
        </div>
      </div>
    </div>
  );

  // ── Mobile: overlay drawer ────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
            opacity: open ? 1 : 0,
            pointerEvents: open ? 'auto' : 'none',
          }}
          onClick={onClose}
        />
        <aside
          className="fixed top-0 left-0 h-full z-50 flex flex-col"
          style={{
            width: 280,
            transform: open ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
            background: 'var(--bg-surface-1)',
            borderRight: '1px solid var(--border)',
            boxShadow: open ? '4px 0 32px rgba(0,0,0,0.45)' : 'none',
          }}
        >
          {expandedContent}
        </aside>
      </>
    );
  }

  // ── Desktop: collapsed icon rail OR expanded ──────────────────────────────────
  return (
    <aside
      className="flex-shrink-0 h-full transition-all duration-300 overflow-hidden border-r"
      style={{
        width: open ? 240 : 60,
        borderColor: 'var(--border)',
        background: 'var(--bg-surface-1)',
      }}
    >
      {open ? expandedContent : iconRail}
    </aside>
  );
}

// ── Single conversation row ───────────────────────────────────────────────────
function ConvItem({ conv, activeId, hoveredId, confirmId, isPinned, onSelect, onHover, onDelete, onPin }: {
  conv: Conversation;
  activeId: string | null;
  hoveredId: string | null;
  confirmId: string | null;
  isPinned: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onPin: (e: React.MouseEvent, id: string) => void;
}) {
  const isActive  = activeId === conv.id;
  const isHovered = hoveredId === conv.id;

  return (
    <div
      onClick={() => onSelect(conv.id)}
      onMouseEnter={() => onHover(conv.id)}
      onMouseLeave={() => onHover(null)}
      className="relative flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer mb-0.5 group transition-all"
      style={{
        background: isActive ? 'var(--bg-surface-2)' : isHovered ? 'var(--bg-surface-2)' : 'transparent',
      }}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
             style={{ background: 'var(--accent)' }} />
      )}

      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
           style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--text-faint)' }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>

      <span className="flex-1 text-xs truncate"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {conv.title}
      </span>

      {/* Action buttons on hover */}
      {isHovered && (
        <div className="flex items-center gap-0.5 animate-fade-in">
          {/* Pin */}
          <button
            onClick={e => onPin(e, conv.id)}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: isPinned ? 'var(--accent)' : 'var(--text-faint)' }}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </button>
          {/* Delete */}
          <button
            onClick={e => onDelete(e, conv.id)}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: confirmId === conv.id ? '#f87171' : 'var(--text-faint)' }}
            title={confirmId === conv.id ? 'Confirm delete' : 'Delete'}
          >
            {confirmId === conv.id ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
