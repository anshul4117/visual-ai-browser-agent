# Agent Context

Persistent context for the AI coding agent. Updated after each phase.

## Current Implementation Status

| Component | Status | Phase |
|-----------|--------|-------|
| Repository structure | ✅ Complete | 0 |
| Documentation skeleton | ✅ Complete | 0 |
| Shared types | ✅ Complete | 0 |
| Shared utils | ✅ Complete | 0 |
| Docker (MongoDB) | ✅ Complete | 0 |
| Chrome extension | 🔲 Not started | 1 |
| Activity tracking | 🔲 Not started | 2 |
| Backend API | 🔲 Not started | 3 |
| MongoDB integration | 🔲 Not started | 4 |
| Visual context | 🔲 Not started | 5 |
| AI processing | 🔲 Not started | 6 |
| Dashboard | 🔲 Not started | 7 |
| Production polish | 🔲 Not started | 8 |

## Pending Tasks

Next phase: **Phase 1 — Chrome Extension Foundation**

- Set up Manifest V3
- Create background service worker scaffold
- Create content script scaffold
- Set up extension popup
- Configure build system (bundler)

## File Ownership

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `apps/extension/` | Extension team | Chrome extension code |
| `apps/server/` | Backend team | Express.js API |
| `packages/shared-types/` | Shared | TypeScript interfaces |
| `packages/shared-utils/` | Shared | Utility functions |
| `docs/` | All | Documentation |

## API Contracts

Defined in: [docs/api-spec.md](api-spec.md)

- `POST /api/events` — Extension → Server
- `GET /api/events` — Dashboard → Server
- `GET /api/health` — Monitoring → Server

## Database Contracts

Defined in: [docs/database.md](database.md)

- `events` collection — see database.md for schema
- `sessions` collection — see database.md for schema

## Known Assumptions

1. Browser screen monitoring = browser context capture + optional screenshot (not continuous video)
2. AI processing reads from the events collection, does not modify the core event pipeline
3. User consent is obtained through Chrome extension permission prompts
4. No user authentication in MVP — optional `userId` field for future use
5. Extension build tool has not been chosen yet (Phase 1 decision)

## Known Limitations

1. Chrome-only — no Firefox/Safari support in MVP
2. No real-time dashboard — polling or page refresh for updates
3. No cloud deployment configuration
4. Screenshot capture may be limited by Chrome's permission model
