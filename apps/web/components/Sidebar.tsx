'use client';

import type { Conversation } from '@/app/page';

interface SidebarProps {
  open: boolean;
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete }: SidebarProps) {
  if (!open) return null;

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-[#0d0d0f] border-r border-[#1c1c20]">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1c1c20]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#4338ca] flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        <span className="font-semibold text-white text-lg tracking-tight">NOVA</span>
      </div>

      {/* New Chat button */}
      <div className="px-3 py-3">
        <button
          id="new-chat-btn"
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#1c1c20] hover:bg-[#242428] border border-[#2e2e34] hover:border-[#6366f1] text-sm text-[#9ca3af] hover:text-white transition-all duration-200"
        >
          <span className="text-[#6366f1] font-bold text-lg leading-none">+</span>
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {conversations.length === 0 ? (
          <p className="text-xs text-[#374151] text-center mt-8 px-4">
            No conversations yet. Start chatting!
          </p>
        ) : (
          <div className="space-y-1">
            <p className="text-[10px] text-[#374151] uppercase tracking-widest px-2 py-2">
              Recent
            </p>
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 ${
                  activeId === conv.id
                    ? 'bg-[#1c1c20] border border-[#4338ca]/50 text-white'
                    : 'hover:bg-[#141416] border border-transparent text-[#9ca3af] hover:text-white'
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <span className="flex-1 text-sm truncate">{conv.title}</span>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[#ef4444] hover:text-red-400 text-xs px-1 transition-opacity"
                  title="Delete conversation"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1c1c20]">
        <p className="text-[10px] text-[#374151]">NVIDIA 753B MoE · Personal</p>
      </div>
    </aside>
  );
}
