# Architecture

## Overview

The system follows a three-tier architecture:

1. **Chrome Extension** — Captures browser events and visual context
2. **Backend API** — Receives, validates, and routes events
3. **Database** — Persists events and sessions in MongoDB

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
│  └─────────────────┘     │  • API communication         │ │
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

### Server File Structure

```
apps/server/
├── Dockerfile                # Multi-stage Docker build
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Entry point — connects DB, loads env & starts HTTP server
    ├── app.ts                # Express app configuration & middleware pipeline
    ├── database/
    │   └── connection.ts     # Mongoose connection manager & event listeners
    ├── models/
    │   ├── event.model.ts    # Mongoose schema & model for Events
    │   └── session.model.ts  # Mongoose schema & model for Sessions
    ├── routes/
    │   ├── health.routes.ts  # /api/health route
    │   └── events.routes.ts  # /api/events & /api/events/batch routes
    ├── controllers/
    │   ├── health.controller.ts # Health check logic
    │   └── events.controller.ts # Single/batch event ingestion & query controllers
    ├── services/
    │   ├── event-store.interface.ts # Storage abstraction interface
    │   ├── mongo-event-store.ts     # Mongoose implementation
    │   ├── in-memory-event-store.ts # Fallback in-memory implementation
    │   └── event-store.service.ts   # Delegating singleton exporter
    ├── middleware/
    │   ├── logger.middleware.ts   # Request logger (method, path, status, duration)
    │   ├── error.middleware.ts    # Global error handler & 404 handler
    │   └── validate.middleware.ts # Request body validation for single & batch events
    └── types/
        └── index.ts          # Query parameters & pagination types
```

### Storage Abstraction & Polymorphism Pattern

- **`EventStore` Interface**: Standard interface defining `add`, `addBatch`, `getBySession`, and `query` methods.
- **`MongoEventStore`**: Mongoose-backed persistence layer writing documents to MongoDB `events` and updating session stats in `sessions`.
- **`InMemoryEventStore`**: Fallback in-memory storage used when database is offline or unconfigured.
- **`DelegatingEventStore`**: Singleton proxy dynamically delegating requests to `MongoEventStore` when MongoDB is connected or `InMemoryEventStore` otherwise.

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
    ▼
POST /api/events  OR  POST /api/events/batch
    │
    ▼
Express API (apps/server)
    │
    │ Validate payload & delegate to EventStore
    ▼
MongoEventStore (Mongoose) ──▶ MongoDB (events & sessions collections)
```
