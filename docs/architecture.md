# Architecture

## Overview

The system follows a three-tier architecture:

1. **Chrome Extension** — Captures browser events and visual context
2. **Backend API** — Receives, validates, and routes events
3. **Database** — Persists events and sessions in MongoDB

## Extension Architecture & Synchronization Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Chrome Extension                              │
│                                                                        │
│  ┌─────────────────┐           ┌────────────────────────────────────┐  │
│  │  Content Script  │──sendMessage▶│  Background Service Worker         │  │
│  │  • PAGE_LOADED   │           │  • Tab listeners (switch/update)   │  │
│  │  • CLICK         │           │  • Session Manager                 │  │
│  │  • SCROLL        │           │  • Message Router                  │  │
│  │  • VISIBILITY    │           │  • Sync Pipeline & Queue Manager   │  │
│  └─────────────────┘           └──────────────┬─────────────────────┘  │
│  ┌─────────────────┐                          │                        │
│  │  Popup UI       │─── GET_STATUS ───────────┤                        │
│  │  • Status badge │─── SYNC_NOW ─────────────┤                        │
│  │  • Connection   │─── SET_BACKEND_URL ──────┤                        │
│  │  • Queue count  │                          ▼                        │
│  │  • Last sync    │           ┌────────────────────────────────────┐  │
│  │  • URL config   │           │  Offline Queue (storage.local)     │  │
│  └─────────────────┘           └──────────────┬─────────────────────┘  │
│                                               │                        │
│                                               ▼                        │
│                                ┌────────────────────────────────────┐  │
│                                │  Network Client (network/client.ts)│  │
│                                │  • Configurable URL (storage.sync) │  │
│                                │  • Health checks & timeouts        │  │
│                                └──────────────┬─────────────────────┘  │
└───────────────────────────────────────────────┼────────────────────────┘
                                                │
                                    HTTP POST /api/events/batch
                                                │
                                                ▼
```

### Extension File Structure

```
apps/extension/
├── scripts/
│   └── build.ts              # esbuild build script
├── src/
│   ├── background/
│   │   └── index.ts          # Service worker — message handling, tab listeners, queue & sync pipeline
│   ├── content/
│   │   └── index.ts          # Content script — PAGE_LOADED, CLICK, SCROLL, VISIBILITY
│   ├── messaging/
│   │   └── types.ts          # Typed message protocol & Sync types
│   ├── network/
│   │   └── client.ts         # Network client — fetchWithTimeout, health checks, POST batch/single
│   ├── storage/
│   │   └── event-logger.ts   # Temporary offline event queue module (chrome.storage.local)
│   ├── popup/
│   │   ├── popup.html        # Popup UI (status, connection badge, URL config, sync now, export)
│   │   ├── popup.css         # Dark theme styles & connection badges
│   │   └── popup.ts          # Popup logic — status polling, manual sync, backend URL save
│   └── manifest.json         # Manifest V3 config
├── dist/                     # Build output (load as unpacked extension)
├── package.json
└── tsconfig.json
```

### Synchronization Architecture & Queue Lifecycle

1. **Event Capture & Queueing**:
   - Content scripts capture DOM events (`click`, `scroll`, `visibilitychange`, `page_load`).
   - Content script sends events to Background Service Worker via `chrome.runtime.sendMessage`.
   - Service worker creates structured `ActivityEvent` objects and appends them to `chrome.storage.local` under key `vai_events` (temporary offline queue).

2. **Automatic Flushing & Batch Transmission**:
   - Upon appending new events, the background worker triggers `flushQueue()`.
   - `flushQueue()` retrieves queued events, inspects the configured backend URL from `chrome.storage.sync` (default: `http://localhost:3000`), and issues a `POST /api/events/batch` HTTP request with a 5000ms AbortController timeout.
   - On `201 Created` response: successfully synced events are removed from `chrome.storage.local`, `lastSyncTime` timestamp is updated, and connection status is set to `connected`.

3. **Exponential Backoff Retry Strategy**:
   - If server is unreachable or responds with error, connection status updates to `offline` or `error`.
   - Queued events remain safely in `chrome.storage.local` to prevent data loss.
   - Background worker schedules a retry with exponential backoff: `delay = Math.min(2^attempt * 1000, 60000)` ms (2s, 4s, 8s, 16s, 32s, max 60s).
   - Once connectivity is restored or manual **Sync Now** is pressed, the queue is flushed automatically.

## Backend Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Express.js Server API                           │
│                                                                        │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  Middleware     │───▶│  Routes            │───▶│  Controllers    │  │
│  │  • CORS         │    │  • /api/health     │    │  • Health       │  │
│  │  • JSON Body    │    │  • /api/events     │    │  • Events       │  │
│  │  • Logger       │    │  • /api/events/    │    └────────┬────────┘  │
│  │  • Validator    │    │    batch           │             │           │
│  │  • Error        │    │  • /api/events/    │             ▼           │
│  └─────────────────┘    │    :sessionId      │    ┌─────────────────┐  │
│                         └────────────────────┘    │  Services       │  │
│                                                   │  • EventStore   │  │
│                                                   │    Interface    │  │
│                                                   └────────┬────────┘  │
└────────────────────────────────────────────────────────────┼───────────┘
                                                             │
                                     ┌───────────────────────┴───────────────────────┐
                                     ▼                                               ▼
                         ┌──────────────────────┐                        ┌──────────────────────┐
                         │  MongoEventStore     │                        │  InMemoryEventStore  │
                         │  (Mongoose Models)   │                        │  (Fallback Storage)  │
                         └──────────┬───────────┘                        └──────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │  MongoDB 7 Container │
                         │  (events & sessions) │
                         └──────────────────────┘
```

## Database Architecture

See [Database Schema](database.md) for collection definitions.

## Event Flow

```
User Action (click, scroll, page load, tab switch, URL change)
    │
    ▼
Content Script / Background Tab Listeners
    │
    │ chrome.runtime.sendMessage({ type, data })
    ▼
Background Service Worker
    │
    │ 1. Append to offline queue (chrome.storage.local)
    │ 2. Flush queue via network/client.ts
    ▼
HTTP POST /api/events/batch (Fetch with 5s timeout)
    │
    ├── (If server online: 201 Created) ──▶ Remove events from storage.local & update lastSyncTime
    └── (If server offline/error)       ──▶ Keep in storage.local & schedule exponential retry (2s..60s)
    │
    ▼
Express API (apps/server) ──▶ MongoEventStore (Mongoose) ──▶ MongoDB (events & sessions)
```
