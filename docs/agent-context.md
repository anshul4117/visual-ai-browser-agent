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
| Chrome extension foundation | ✅ Complete | 1 |
| Extension build system (esbuild) | ✅ Complete | 1 |
| Manifest V3 | ✅ Complete | 1 |
| Background service worker | ✅ Complete | 1 |
| Content script scaffold | ✅ Complete | 1 |
| Popup UI | ✅ Complete | 1 |
| Messaging layer | ✅ Complete | 1 |
| Event logger module (chrome.storage.local) | ✅ Complete | 2 |
| Tab activation & update tracking | ✅ Complete | 2 |
| Content script DOM tracking (click/scroll/visibility) | ✅ Complete | 2 |
| Event export & clear features in Popup | ✅ Complete | 2 |
| Express.js Backend Server (`apps/server`) | ✅ Complete | 3 |
| Single & Batch Event Ingestion APIs | ✅ Complete | 3 |
| In-Memory Append-Only Event Store | ✅ Complete | 3 |
| Request Validation & Error Middlewares | ✅ Complete | 3 |
| Multi-Stage Dockerfile for Server | ✅ Complete | 3 |
| MongoDB integration | 🔲 Not started | 4 |
| Visual context | 🔲 Not started | 5 |
| AI processing | 🔲 Not started | 6 |
| Dashboard | 🔲 Not started | 7 |
| Production polish | 🔲 Not started | 8 |

## Pending Tasks

Next phase: **Phase 4 — Database Persistence**

- MongoDB connection setup with Mongoose in `apps/server`
- Event and Session Mongoose schemas & models
- Database indexes creation
- Batch insertion persistence
- Connection error handling and fallback

## File Ownership

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `apps/extension/src/background/` | Extension | Service worker, event handling, tab listeners |
| `apps/extension/src/content/` | Extension | DOM event capture (click, scroll, visibility) |
| `apps/extension/src/messaging/` | Extension | Typed message protocol & StoredEvent model |
| `apps/extension/src/storage/` | Extension | Persistent event logger (`event-logger.ts`) |
| `apps/extension/src/popup/` | Extension | UI controls, statistics, export & clear |
| `apps/extension/scripts/` | Extension | Build tooling |
| `apps/server/src/` | Backend | Express.js API, controllers, routes, middlewares, services |
| `apps/server/Dockerfile` | Backend | Server Docker multi-stage build |
| `packages/shared-types/` | Shared | TypeScript interfaces |
| `packages/shared-utils/` | Shared | Utility functions |
| `docs/` | All | Documentation |

## API Contracts

Defined in: [docs/api-spec.md](api-spec.md)

- `GET /api/health` — Server health check
- `POST /api/events` — Ingest single event
- `POST /api/events/batch` — Ingest batch of events
- `GET /api/events` — Query events with filters & pagination
- `GET /api/events/:sessionId` — Retrieve events for a session

## Internal Messaging Contracts

Defined in: `apps/extension/src/messaging/types.ts`

| Message | Direction | Data |
|---------|-----------|------|
| `PAGE_LOADED` | Content → Background | `{ url, title, timestamp }` |
| `CLICK` | Content → Background | `{ url, title, timestamp, selector, tagName, innerText }` |
| `SCROLL` | Content → Background | `{ url, title, timestamp, scrollPercentage }` |
| `VISIBILITY_CHANGED` | Content → Background | `{ url, title, timestamp, visibilityState }` |
| `GET_STATUS` | Popup → Background | (none) |
| `CLEAR_EVENTS` | Popup → Background | (none) |
| `EXPORT_EVENTS` | Popup → Background | (none) |

## Database Contracts

Defined in: [docs/database.md](database.md)

- `events` collection — see database.md for schema
- `sessions` collection — see database.md for schema

## Server Build System

- **Build Tool:** TypeScript `tsc` outputting to `apps/server/dist/`
- **Dev Runner:** `tsx watch src/index.ts`
- **Docker:** `apps/server/Dockerfile` (multi-stage Alpine Node 20)

## Known Assumptions

1. Browser screen monitoring = browser context capture + optional screenshot (not continuous video)
2. AI processing reads from the events collection, does not modify the core event pipeline
3. User consent is obtained through Chrome extension permission prompts
4. No user authentication in MVP — optional `userId` field for future use
5. In-memory event store used for Phase 3 prior to MongoDB integration in Phase 4

## Known Limitations

1. Chrome-only — no Firefox/Safari support in MVP
2. No real-time dashboard — polling or page refresh for updates
3. In-memory event storage in Phase 3 resets on server restart until Phase 4 (MongoDB persistence)
