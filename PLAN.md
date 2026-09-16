# 🚀 NOVA — Multi-Platform AI Assistant
### Powered by NVIDIA 753B MoE API | Hosted on Oracle Cloud Free Tier

---

> ⚠️  LOCKED PLAN — DO NOT DEVIATE MID-PHASE
> Every session MUST start by reading this file.
> No feature changes, no stack changes until current phase is COMPLETE.
> New ideas → add to "Future Ideas" section. Don't act on them now.

---

## STATUS TRACKER
- [x] Plan Created & Approved
- [x] Phase 0 — Foundation & Setup ✅ DONE (2026-09-17)
- [ ] Phase 1 — Full Chat Web App  ← CURRENT
- [ ] Phase 2 — Live on Oracle Cloud
- [ ] Phase 3 — Desktop App (Electron)
- [ ] Phase 4 — Android App (Capacitor)

---

## EVERY SESSION START — DO THIS FIRST
1. cat /home/su10/Projects/su/nova/PLAN.md
2. cat /home/su10/Projects/su/nova/task.md
3. git log --oneline -5
4. git status
5. ONLY THEN start coding

## EVERY SESSION END — DO THIS
1. Update task.md
2. git add -A && git commit -m "Phase X: description"

---

## PROJECT STRUCTURE
/home/su10/Projects/su/nova/
├── PLAN.md          ← THIS FILE (never delete)
├── task.md          ← Current session checklist
├── package.json     ← Root (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json
├── server/          ← Express API (NVIDIA proxy + SQLite)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/chat.ts
│   │   └── db/sqlite.ts
│   └── .env         ← API KEYS (never commit)
└── apps/
    ├── web/         ← Next.js 14 chat UI
    ├── desktop/     ← Electron (Phase 3)
    └── mobile/      ← Capacitor (Phase 4)

---

## TECH STACK (LOCKED — NO CHANGES)
| Layer        | Technology              |
|--------------|-------------------------|
| Monorepo     | Turborepo + pnpm        |
| Frontend     | Next.js 14 App Router   |
| UI           | Tailwind CSS + shadcn   |
| Backend      | Node.js + Express (TS)  |
| AI SDK       | openai npm package      |
| Database     | SQLite (better-sqlite3) |
| Hosting      | Oracle Cloud Free Tier  |
| Containers   | Docker + docker-compose |
| Proxy        | Nginx + Certbot (HTTPS) |

---

## NVIDIA API
Base URL:  https://integrate.api.nvidia.com/v1
SDK:       openai npm package (OpenAI-compatible)
Features:  Streaming, Tool Calling, Reasoning, FP8

---

## ORACLE CLOUD HOSTING (Phase 2)
VM:        Ampere A1 (4 OCPUs, 24GB RAM ARM64) — Always Free
Stack:     Docker + Nginx + Let's Encrypt HTTPS
Deploy:    git pull + docker-compose up -d

---

## KEYS NEEDED (user provides when ready)
- NVIDIA_API_KEY    → needed in Phase 0 testing
- Oracle VM SSH     → needed in Phase 2
- Oracle VM IP      → needed in Phase 2

---

## THE 7 RULES
1. Always read PLAN.md before coding
2. Always update task.md when starting/finishing work
3. Never add Phase 2+ features while in Phase 0/1
4. Never delete working files — only extend them
5. Never change the tech stack
6. Never commit .env files
7. Always git commit after every working milestone

---

## PHASES

### PHASE 0 — Foundation (CURRENT)
Goal: Type message → streaming AI response in browser
- Monorepo scaffold
- Express server with NVIDIA API proxy
- Next.js chat UI
- .env setup
- Git init

DONE WHEN: http://localhost:3000 shows streaming AI response

### PHASE 1 — Full Chat App (after Phase 0)
- Multiple conversations (sidebar)
- SQLite chat history
- Streaming display
- Markdown + code highlighting
- Reasoning steps display
- Tool call display
- Dark/light mode
- Mobile responsive

### PHASE 2 — Oracle Cloud Deploy (after Phase 1)
- Docker + docker-compose
- Nginx config
- Certbot HTTPS
- Deploy to Oracle VM

### PHASE 3 — Desktop (after Phase 2)
- Electron wrapper
- System tray
- Global hotkey
- Windows/Linux builds

### PHASE 4 — Android (after Phase 3)
- Capacitor wrapper
- Android APK

---

## FUTURE IDEAS (don't build yet)
- Voice input/output
- Image generation
- Plugin system
- Web search tool
- Code execution sandbox
- iOS app
