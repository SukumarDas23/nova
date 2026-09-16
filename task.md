# NOVA — Task Checklist
> **Phase 0: COMPLETE ✅**
> Updated: 2026-09-17

## Phase 0 — ✅ DONE

- [x] Plan approved & PLAN.md in project root
- [x] Monorepo scaffold (pnpm + turbo)
- [x] Server: Express + TypeScript + dotenv
- [x] Server: NVIDIA API proxy route (streaming SSE + simple)
- [x] Server: sql.js WASM SQLite (no native compile issues ever)
- [x] Server: Lazy client init (fixes env timing on tsx restart)
- [x] Web: Next.js 14 + Tailwind dark theme
- [x] Web: Full chat UI (Sidebar, MessageBubble, Markdown, Syntax highlight)
- [x] Web: SSE streaming connected to backend
- [x] API key set: z-ai/glm-5.3-flash working ✅
- [x] Git: 3 commits, all working code

## ✅ MILESTONE ACHIEVED
→ Full API pipeline working: Express → NVIDIA → GLM-5.3-flash → streaming response

## 🔴 Next: PHASE 1 — Full Chat Web App
Start after user confirms browser UI works.

### Phase 1 Features to Build:
- [ ] Sidebar: multiple conversations + history
- [ ] Streaming tokens display in real-time
- [ ] Markdown rendering (code blocks, tables, bold)
- [ ] Show/hide reasoning steps
- [ ] Copy message button
- [ ] Dark/light mode toggle
- [ ] Mobile responsive layout
- [ ] Model selector (glm-5.3 vs glm-5.3-flash)

## ⏳ WAITING ON: NVIDIA API Key
→ Once user provides key, insert it into `server/.env` as `NVIDIA_API_KEY=nvapi-...`
→ Then test: http://localhost:3000 → type message → streaming AI response

## MILESTONE: Phase 0 DONE when
→ http://localhost:3000 shows streaming AI response ← ONE STEP AWAY

## All Tests Passing RIGHT NOW:
- ✅ http://localhost:3001/api/health → {"status":"ok"}
- ✅ http://localhost:3001/api/history/conversations → []
- ✅ http://localhost:3001/api/chat/simple → {"error":"API key not configured"} (expected)
- ✅ http://localhost:3000 → Full HTML with dark mode chat UI

## Servers Running:
- Backend: http://localhost:3001 (Express + sql.js)
- Frontend: http://localhost:3000 (Next.js 14)
