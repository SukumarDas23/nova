# NOVA — Task Checklist
> Phase 0: Foundation & Setup
> Updated: 2026-09-17

## Phase 0 — NEARLY COMPLETE ✅

- [x] Plan approved
- [x] PLAN.md in project root
- [x] Monorepo scaffold (pnpm + turbo)
- [x] Server: Express + TypeScript setup
- [x] Server: NVIDIA API proxy route (streaming + SSE)
- [x] Server: SQLite setup (sql.js WASM — no native compile issues)
- [x] Web: Next.js 14 setup
- [x] Web: Full chat UI (Sidebar, MessageBubble, ChatInput, Header, Logo)
- [x] Web: Connected to backend API
- [x] Git init + 2 commits

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
