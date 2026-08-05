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
| Request Validation & Error Middlewares | ✅ Complete | 3 |
| Multi-Stage Dockerfile for Server | ✅ Complete | 3 |
| MongoDB Database Layer & Mongoose Connection | ✅ Complete | 4 |
| Event & Session Mongoose Models & Schemas | ✅ Complete | 4 |
| Polymorphic EventStore Abstraction | ✅ Complete | 4 |
| Real-Time Extension-to-Backend Sync Pipeline | ✅ Complete | 5 |
| Network Client with Timeout & Health Checks | ✅ Complete | 5 |
| Offline Queue with Exponential Backoff Retry | ✅ Complete | 5 |
| Configurable Backend Server URL (`chrome.storage.sync`) | ✅ Complete | 5 |
| Connection Status & Manual Sync in Popup UI | ✅ Complete | 5 |
| Visual context | 🔲 Not started | 6 |
| AI processing | 🔲 Not started | 7 |
| Dashboard | 🔲 Not started | 8 |

## Pending Tasks

Next phase: **Phase 6 — Visual Context**

- Browser screenshot capture or DOM snapshot module in Chrome Extension
- Associate visual context with activity events
- Transmit visual payload to backend API

## File Ownership

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `apps/extension/src/background/` | Extension | Service worker, sync manager, tab listeners |
| `apps/extension/src/content/` | Extension | DOM event capture (click, scroll, visibility) |
| `apps/extension/src/network/` | Extension | Network client (`client.ts`) for backend sync |
| `apps/extension/src/messaging/` | Extension | Typed message protocol & StoredEvent model |
| `apps/extension/src/storage/` | Extension | Temporary offline queue logger (`event-logger.ts`) |
| `apps/extension/src/popup/` | Extension | UI controls, connection status, sync now, URL config |
| `apps/extension/scripts/` | Extension | Build tooling |
| `apps/server/src/database/` | Backend | Mongoose connection lifecycle manager |
| `apps/server/src/models/` | Backend | Mongoose models for `Event` and `Session` |
| `apps/server/src/services/` | Backend | `EventStore` interface, `MongoEventStore`, `InMemoryEventStore` |
| `apps/server/src/` | Backend | Express API controllers, routes, middlewares |
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

## Database Contracts

Defined in: [docs/database.md](database.md)

- `events` collection (`EventModel`) — see database.md for schema & indexes
- `sessions` collection (`SessionModel`) — see database.md for schema & indexes

## Extension Network & Sync Configuration

- **Default Backend URL:** `http://localhost:3000` (stored in `chrome.storage.sync` under key `vai_backend_url`)
- **Offline Queue Key:** `vai_events` in `chrome.storage.local`
- **Batch Endpoint:** `POST /api/events/batch`
- **Retry Mechanism:** Exponential backoff (2s, 4s, 8s, 16s, 32s, max 60s)

## Known Assumptions

1. Browser screen monitoring = browser context capture + optional screenshot (not continuous video)
2. AI processing reads from the events collection, does not modify the core event pipeline
3. User consent is obtained through Chrome extension permission prompts
4. No user authentication in MVP — optional `userId` field for future use
5. Background service worker acts as single synchronization pipeline for all captured browser events.

## Known Limitations

1. Chrome-only — no Firefox/Safari support in MVP
2. No real-time dashboard — polling or page refresh for updates
3. Screenshot capture may be limited by Chrome's permission model
