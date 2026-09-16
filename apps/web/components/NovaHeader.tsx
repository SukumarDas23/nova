'use client';

interface NovaHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function NovaHeader({ sidebarOpen, onToggleSidebar }: NovaHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-[#1c1c20] bg-[#0d0d0f]/80 backdrop-blur-sm">
      <button
        id="sidebar-toggle-btn"
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-[#1c1c20] text-[#6b7280] hover:text-white transition-all"
        title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-white">NOVA</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1c1c20] border border-[#2e2e34] text-[#6366f1] font-medium">
          753B MoE
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse-slow" title="Server online" />
        <span className="text-xs text-[#374151]">NVIDIA API</span>
      </div>
    </header>
  );
}
