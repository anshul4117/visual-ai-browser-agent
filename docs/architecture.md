# Architecture

## Overview

The system follows a three-tier architecture:

1. **Chrome Extension** — Captures browser events and visual context
2. **Backend API** — Receives, validates, and routes events
3. **Database** — Persists events and sessions (Phase 4)

## Extension Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Chrome Extension                         │
│                                                            │
│  ┌─────────────────┐     ┌──────────────────────────────┐ │
│  │  Content Script  │────▶│  Background Service Worker   │ │
│  │                  │     │                              │ │
│  │  • PAGE_LOADED   │     │  • Message handler           │ │
│  │  • CLICK         │     │  • Event Logger (storage)    │ │
│  │  • SCROLL        │     │  • Session management        │ │
│  │  • VISIBILITY    │     │  • Tab switch / update events│ │
│  └─────────────────┘     │  • API communication (Ph 3)  │ │
│                           └──────────────┬───────────────┘ │
│  ┌─────────────────┐                     │                 │
│  │  Popup UI       │─── GET_STATUS ─────▶│                 │
│  │  • Status badge │─── EXPORT_EVENTS ──▶│                 │
│  │  • Session ID   │─── CLEAR_EVENTS ───▶│                 │
│  │  • Event count  │                     │                 │
│  │  • Last event   │                     │                 │
│  │  • Current URL  │                     │                 │
│  └─────────────────┘                     │                 │
└──────────────────────────────────────────┼─────────────────┘
                                           │
                                    HTTP REST API
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
│   │   └── index.ts          # Service worker — message handling, tab listeners, session mgmt
│   ├── content/
│   │   └── index.ts          # Content script — PAGE_LOADED, CLICK, SCROLL, VISIBILITY
│   ├── messaging/
│   │   └── types.ts          # Typed message protocol & StoredEvent model
│   ├── storage/
│   │   └── event-logger.ts   # Persistent event storage module (chrome.storage.local)
│   ├── popup/
│   │   ├── popup.html        # Popup UI (status, export, clear)
│   │   ├── popup.css         # Dark theme styles & action buttons
│   │   └── popup.ts          # Popup logic — status display, JSON export, clear storage
│   └── manifest.json         # Manifest V3 config
├── dist/                     # Build output (load as unpacked extension)
├── package.json
└── tsconfig.json
```

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
│                                                   │    (In-Memory   │  │
│                                                   │     Timeline &  │  │
│                                                   │     Indexing)   │  │
│                                                   └─────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Server File Structure

```
apps/server/
├── Dockerfile                # Multi-stage Docker build
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Entry point — loads env & starts HTTP server
    ├── app.ts                # Express app configuration & middleware pipeline
    ├── routes/
    │   ├── health.routes.ts  # /api/health route
    │   └── events.routes.ts  # /api/events & /api/events/batch routes
    ├── controllers/
    │   ├── health.controller.ts # Health check logic
    │   └── events.controller.ts # Single/batch event ingestion & query controllers
    ├── services/
    │   └── event-store.service.ts # In-memory append-only event store & indexer
    ├── middleware/
    │   ├── logger.middleware.ts   # Request logger (method, path, status, duration)
    │   ├── error.middleware.ts    # Global error handler & 404 handler
    │   └── validate.middleware.ts # Request body validation for single & batch events
    └── types/
        └── index.ts          # Query parameters & pagination types
```

### Route → Middleware → Controller → Service Pattern

- **Routes**: Map HTTP methods and paths to middlewares and controllers.
- **Middleware**: Validates incoming payloads, logs HTTP requests, and handles errors.
- **Controllers**: Handle request/response mapping and call domain services.
- **Services**: `EventStoreService` encapsulates in-memory storage, session indexing, query filtering, and pagination.

## Database Architecture (Phase 4)

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
    │ Log event locally (chrome.storage.local)
    │ (Phase 3 Backend Integration / Phase 8 Buffer)
    ▼
POST /api/events  OR  POST /api/events/batch
    │
    ▼
Express API (apps/server)
    │
    │ Validate payload & append to EventStoreService
    ▼
In-Memory Store (Phase 3) ──▶ MongoDB (Phase 4)
```
