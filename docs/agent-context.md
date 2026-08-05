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
| Backend API | 🔲 Not started | 3 |
| MongoDB integration | 🔲 Not started | 4 |
| Visual context | 🔲 Not started | 5 |
| AI processing | 🔲 Not started | 6 |
| Dashboard | 🔲 Not started | 7 |
| Production polish | 🔲 Not started | 8 |

## Pending Tasks

Next phase: **Phase 3 — Backend API**

- Express.js server setup in `apps/server`
- `POST /api/events` endpoint for receiving events
- `GET /api/events` endpoint for querying events
- `GET /api/health` health check endpoint
- Request validation and middleware setup

## File Ownership

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `apps/extension/src/background/` | Extension | Service worker, event handling, tab listeners |
| `apps/extension/src/content/` | Extension | DOM event capture (click, scroll, visibility) |
| `apps/extension/src/messaging/` | Extension | Typed message protocol & StoredEvent model |
| `apps/extension/src/storage/` | Extension | Persistent event logger (`event-logger.ts`) |
| `apps/extension/src/popup/` | Extension | UI controls, statistics, export & clear |
| `apps/extension/scripts/` | Extension | Build tooling |
| `apps/server/` | Backend | Express.js API |
| `packages/shared-types/` | Shared | TypeScript interfaces |
| `packages/shared-utils/` | Shared | Utility functions |
| `docs/` | All | Documentation |

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

## Build System

- **Tool:** esbuild via `scripts/build.ts`
- **Output:** `apps/extension/dist/` (load as unpacked extension)
- **Format:** IIFE for all bundles (background, content, popup)
- **Source maps:** Enabled
- **Commands:** `npm run build`, `npm run dev`, `npm run clean`

## Known Assumptions

1. Browser screen monitoring = browser context capture + optional screenshot (not continuous video)
2. AI processing reads from the events collection, does not modify the core event pipeline
3. User consent is obtained through Chrome extension permission prompts
4. No user authentication in MVP — optional `userId` field for future use
5. esbuild chosen as bundler for simplicity and speed
6. IIFE format used for all extension scripts
7. Local timeline stored in `chrome.storage.local` under key `vai_events`, capped at 10,000 events

## Known Limitations

1. Chrome-only — no Firefox/Safari support in MVP
2. No real-time dashboard — polling or page refresh for updates
3. No cloud deployment configuration
4. Screenshot capture may be limited by Chrome's permission model
5. No hot-reload for extension development (manual reload after `npm run build`)
