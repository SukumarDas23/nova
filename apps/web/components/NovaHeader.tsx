'use client';

import { useState, useRef, useEffect } from 'react';
import { NovaLogo } from './NovaLogo';
import type { Settings } from '@/app/page';

const MODELS = [
  { id: 'z-ai/glm-5.3-flash',                       label: 'GLM-5.3 Flash',      badge: '⚡ Fast',    desc: 'Best for most tasks'           },
  { id: 'z-ai/glm-5.3',                             label: 'GLM-5.3',            badge: '🧠 Deep',    desc: 'Deep reasoning & analysis'      },
  { id: 'nvidia/llama-3.1-nemotron-ultra-253b-v1',  label: 'Nemotron Ultra 253B', badge: '🚀 Large',   desc: 'NVIDIA flagship, most capable'  },
  { id: 'deepseek-ai/deepseek-v4-flash-0731',       label: 'DeepSeek V4 Flash',  badge: '⚡ Fast',    desc: 'Fast, multilingual'            },
];

interface Props {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  settings: Settings;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  isStreaming: boolean;
}

export function NovaHeader({
  sidebarOpen, onToggleSidebar,
  settings, onUpdateSettings,
  settingsOpen, onToggleSettings,
  isStreaming,
}: Props) {
  const [modelOpen, setModelOpen] = useState(false);
  const modelRef  = useRef<HTMLDivElement>(null);
  const settRef   = useRef<HTMLDivElement>(null);

  const activeModel = MODELS.find(m => m.id === settings.model) || MODELS[0];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
      if (settRef.current  && !settRef.current.contains(e.target as Node))  onToggleSettings();
    };
    if (modelOpen || settingsOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [modelOpen, settingsOpen]);

  return (
    <header className="flex items-center gap-3 px-4 h-14 border-b flex-shrink-0 glass z-20"
            style={{ borderColor: 'var(--border)' }}>

      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg transition-all hover:bg-[var(--bg-surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        aria-label="Toggle sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Logo + name */}
      <div className="flex items-center gap-2 min-w-0">
        <NovaLogo size={22} />
        <span className="font-semibold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>NOVA</span>
      </div>

      {/* Model selector */}
      <div className="relative" ref={modelRef}>
        <button
          onClick={() => !isStreaming && setModelOpen(o => !o)}
          disabled={isStreaming}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
          style={{
            background: 'var(--bg-surface-2)',
            borderColor: 'var(--border)',
            color: isStreaming ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: isStreaming ? 'not-allowed' : 'pointer',
          }}
        >
          <span className="hidden sm:inline">{activeModel.label}</span>
          <span className="sm:hidden">Model</span>
          <span style={{ color: 'var(--accent)' }}>{activeModel.badge}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
               style={{ transform: modelOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {modelOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 rounded-xl overflow-hidden z-50 shadow-2xl animate-fade-in"
               style={{ background: 'var(--bg-surface-1)', border: '1px solid var(--border)' }}>
            <div className="p-2">
              {MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { onUpdateSettings({ model: m.id }); setModelOpen(false); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start gap-3"
                  style={{
                    background: settings.model === m.id ? 'var(--accent-dim)' : 'transparent',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">{m.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--bg-surface-3)', color: 'var(--accent)' }}>
                        {m.badge}
                      </span>
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.desc}</div>
                  </div>
                  {settings.model === m.id && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="2.5" strokeLinecap="round" style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs animate-fade-in"
             style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: 'var(--accent)' }} />
          Generating…
        </div>
      )}

      {/* Settings button */}
      <div className="relative" ref={settRef}>
        <button
          onClick={onToggleSettings}
          className="p-2 rounded-lg transition-all hover:bg-[var(--bg-surface-2)]"
          style={{ color: settingsOpen ? 'var(--accent)' : 'var(--text-muted)' }}
          aria-label="Settings"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 rounded-xl z-50 shadow-2xl animate-fade-in settings-panel"
               onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Settings</h3>

            {/* Temperature */}
            <div className="mb-4">
              <div className="settings-label flex justify-between">
                <span>Temperature</span>
                <span style={{ color: 'var(--accent)' }}>{settings.temperature.toFixed(1)}</span>
              </div>
              <input type="range" min="0" max="1" step="0.1"
                value={settings.temperature}
                onChange={e => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                className="settings-slider w-full"
              />
              <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                <span>Precise</span><span>Creative</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="mb-4">
              <div className="settings-label flex justify-between">
                <span>Max Tokens</span>
                <span style={{ color: 'var(--accent)' }}>{settings.maxTokens.toLocaleString()}</span>
              </div>
              <input type="range" min="512" max="8192" step="512"
                value={settings.maxTokens}
                onChange={e => onUpdateSettings({ maxTokens: parseInt(e.target.value) })}
                className="settings-slider w-full"
              />
            </div>

            {/* Theme toggle */}
            <div className="mb-2">
              <div className="settings-label">Appearance</div>
              <div className="flex gap-2">
                {(['dark','light'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => onUpdateSettings({ theme: t })}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all border capitalize"
                    style={{
                      background: settings.theme === t ? 'var(--accent)' : 'var(--bg-surface-2)',
                      color: settings.theme === t ? 'white' : 'var(--text-secondary)',
                      borderColor: settings.theme === t ? 'var(--accent)' : 'var(--border)',
                    }}
                  >
                    {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                ))}
              </div>
            </div>

            {/* NVIDIA badge */}
            <div className="mt-3 pt-3 flex items-center gap-2"
                 style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              NVIDIA API · {settings.model.split('/')[1] || settings.model}
            </div>
          </div>
        )}
      </div>

      {/* Theme quick toggle */}
      <button
        onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        className="p-2 rounded-lg transition-all hover:bg-[var(--bg-surface-2)]"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Toggle theme"
        data-tip={settings.theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      >
        {settings.theme === 'dark'
          ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
      </button>
    </header>
  );
}
