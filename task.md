# NOVA — Task Checklist
> Updated: 2026-09-17

## ✅ Phase 0 — Foundation DONE
- [x] Monorepo scaffold (pnpm + turbo)
- [x] Express + TypeScript server
- [x] NVIDIA API proxy (SSE streaming)
- [x] sql.js WASM SQLite (no ABI issues ever)
- [x] Next.js 14 web app
- [x] API key configured: z-ai/glm-5.3-flash

## ✅ Phase 1 — Full Chat Web App DONE
- [x] Model selector (GLM-5.3-flash / GLM-5.3 / Nemotron / DeepSeek)
- [x] Dark / Light mode toggle (persists to localStorage)
- [x] Settings panel (temperature 0–1, max tokens 512–8192)
- [x] Regenerate last response button
- [x] Copy message + copy code buttons
- [x] Collapsible reasoning steps panel
- [x] Sidebar search + time-grouped conversations
- [x] Two-click safe delete for conversations
- [x] Beautiful empty state with suggestion chips
- [x] Scroll-to-bottom button
- [x] Character counter + over-limit warning
- [x] Auto-resize textarea
- [x] Rich markdown (tables, code blocks, bold, links)
- [x] Theme-aware syntax highlighting (dark/light)
- [x] Streaming SSE with proper buffer handling

## 🔴 Phase 2 — Live on Oracle Cloud (NEXT)
- [ ] Set up Oracle Free Tier VM (user to provide SSH/IP)
- [ ] Nginx reverse proxy config
- [ ] PM2 process manager for server
- [ ] Domain / HTTPS via Let's Encrypt
- [ ] Docker-compose for easy redeploy
- [ ] Environment secrets management
- [ ] Health monitoring endpoint

## 🔄 Phase 3 — Desktop App (Electron) IN PROGRESS
- [x] NOVA icon generated (glowing N logo)
- [x] apps/desktop/ scaffold created
- [x] main.js: window, tray, menu, IPC, single-instance lock
- [x] preload.js: contextBridge API
- [x] electron-builder: Linux (AppImage/deb) + Windows (NSIS)
- [/] Installing Electron (npm install running...)
- [ ] Launch and test desktop app
- [ ] Build AppImage for Linux
- [ ] Build .exe installer for Windows

## Phase 4 — Android App (Capacitor) — FUTURE
- [ ] Capacitor wrapper
- [ ] Android APK build
- [ ] Mobile-optimized UI

---

## 🚀 Restart Instructions (every session)
```bash
# Terminal 1 — Backend
cd /home/su10/Projects/su/nova/server
/home/su10/.local/share/pnpm/bin/pnpm dev

# Terminal 2 — Frontend
cd /home/su10/Projects/su/nova/apps/web
/home/su10/.local/share/pnpm/bin/pnpm dev
```
Then open http://localhost:3000
