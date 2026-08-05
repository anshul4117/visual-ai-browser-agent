# Architecture

## Overview

The system follows a three-tier architecture:

1. **Chrome Extension** — Captures browser events and visual context
2. **Backend API** — Receives, validates, and routes events
3. **Database** — Persists events and sessions

## Extension Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Chrome Extension                         │
│                                                            │
│  ┌─────────────────┐     ┌──────────────────────────────┐ │
│  │  Content Script  │────▶│  Background Service Worker   │ │
│  │                  │     │                              │ │
│  │  • Click events  │     │  • Event aggregation         │ │
│  │  • Scroll events │     │  • Tab/URL change detection  │ │
│  │  • Form events   │     │  • Session management        │ │
│  │  • DOM snapshots │     │  • API communication         │ │
│  │                  │     │  • Offline buffering          │ │
│  └─────────────────┘     │  • Screenshot capture         │ │
│                           └──────────────┬───────────────┘ │
│  ┌─────────────────┐                     │                 │
│  │  Popup UI       │                     │                 │
│  │  • Toggle       │                     │                 │
│  │  • Status       │                     │                 │
│  │  • Settings     │                     │                 │
│  └─────────────────┘                     │                 │
└──────────────────────────────────────────┼─────────────────┘
                                           │
                                    HTTP REST API
                                           │
                                           ▼
```

### Content Script

- Injected into all pages (`<all_urls>`)
- Captures DOM-level events: clicks, scrolls, form interactions
- Sends events to the background service worker via `chrome.runtime.sendMessage`
- Must not block the main thread — batches DOM reads with `requestAnimationFrame`

### Background Service Worker

- Listens to Chrome APIs: `chrome.tabs.onUpdated`, `chrome.tabs.onActivated`, `chrome.webNavigation`
- Receives events from content scripts
- Manages session lifecycle (create, extend, close)
- Batches events and sends to backend API
- Buffers events offline using `chrome.storage.local`
- No global state — all state in `chrome.storage`

### Popup UI

- Simple control panel for the extension
- Toggle tracking on/off
- Display current session status
- Show event count

## Backend Architecture

```
┌──────────────────────────────────────────────┐
│                Express.js Server             │
│                                              │
│  ┌────────────┐  ┌────────────────────────┐ │
│  │  Routes     │  │  Controllers           │ │
│  │             │  │                        │ │
│  │  POST /api/ │──▶│  • validateEvent()    │ │
│  │    events   │  │  • createEvent()       │ │
│  │             │  │  • getEvents()         │ │
│  │  GET /api/  │──▶│  • healthCheck()      │ │
│  │    events   │  │                        │ │
│  │             │  └────────────┬───────────┘ │
│  │  GET /api/  │               │             │
│  │    health   │               ▼             │
│  └────────────┘  ┌────────────────────────┐ │
│                  │  Mongoose Models        │ │
│                  │  • Event               │ │
│                  │  • Session             │ │
│                  └────────────┬───────────┘ │
└───────────────────────────────┼──────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │       MongoDB        │
                    └──────────────────────┘
```

### Route → Controller → Model

- Routes define HTTP endpoints
- Controllers handle request validation and business logic
- Mongoose models define schemas and handle persistence

## Database Architecture

See [Database Schema](database.md) for collection definitions.

### Collections

- **events** — Individual browser activity events
- **sessions** — Browsing session records

### Indexing Strategy

- `events.sessionId` — Query events by session
- `events.timestamp` — Time-range queries
- `events.eventType` — Filter by event type
- `events.url` — Filter by URL
- `sessions.sessionId` — Unique session lookup

## Event Flow

```
User Action
    │
    ▼
Content Script (DOM event listener)
    │
    │ chrome.runtime.sendMessage({ type, data })
    ▼
Background Service Worker
    │
    │ Aggregate + batch
    │ Buffer if offline
    ▼
POST /api/events
    │
    │ Validate + transform
    ▼
MongoDB (events collection)
```

## AI Pipeline (Future — Phase 6)

```
Raw Events ──▶ Event Summarization ──▶ Activity Classification ──▶ Timeline Generation
```

ASSUMPTION: AI processing will be added as a separate module that reads from the events collection. It will not modify the core event pipeline.
