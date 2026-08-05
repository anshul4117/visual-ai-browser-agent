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
│  │  • PAGE_LOADED   │     │  • Message handler           │ │
│  │  (Phase 2:)      │     │  • Session management        │ │
│  │  • Click events  │     │  • Event logging             │ │
│  │  • Scroll events │     │  • Tab/URL change detection  │ │
│  │  • Form events   │     │  • API communication         │ │
│  │  • DOM snapshots │     │  • Offline buffering         │ │
│  └─────────────────┘     │  • Screenshot capture         │ │
│                           └──────────────┬───────────────┘ │
│  ┌─────────────────┐                     │                 │
│  │  Popup UI       │─── GET_STATUS ─────▶│                 │
│  │  • Status badge │                     │                 │
│  │  • Session ID   │                     │                 │
│  │  • Event count  │                     │                 │
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
│   │   └── index.ts          # Service worker — message handling, session mgmt
│   ├── content/
│   │   └── index.ts          # Content script — PAGE_LOADED event
│   ├── messaging/
│   │   └── types.ts          # Typed message protocol (extensible)
│   ├── popup/
│   │   ├── popup.html        # Popup UI (no inline scripts)
│   │   ├── popup.css         # Dark theme styles
│   │   └── popup.ts          # Popup logic — status display
│   └── manifest.json         # Manifest V3 config
├── dist/                     # Build output (load as unpacked extension)
├── package.json
└── tsconfig.json
```

### Build System

- **Bundler:** esbuild (fast, zero-config)
- **Output format:** IIFE (required for content scripts and service workers)
- **Static files:** manifest.json, popup.html, popup.css copied to dist/
- **Source maps:** Enabled for development debugging

### Messaging Protocol

All communication between extension components uses `chrome.runtime.sendMessage` with a typed protocol:

| Message | Direction | Purpose |
|---------|-----------|---------|
| `PAGE_LOADED` | Content → Background | Notify page finished loading |
| `GET_STATUS` | Popup → Background | Request current status |

Future Phase 2 messages will follow the same `{ type, data }` pattern.

### Session Management

- Session IDs are generated as `vai_<timestamp36>_<random>`
- Stored in `chrome.storage.session` (survives SW restart, cleared on browser close)
- Session state includes: `sessionId`, `eventCount`, `isActive`, `startedAt`
- No global variables — all state in `chrome.storage` (per AGENT.md rules)

### Content Script

- Injected into all pages (`<all_urls>`) at `document_idle`
- Captures `window.location.href` and `document.title`
- Sends `PAGE_LOADED` message to background service worker
- Gracefully handles extension context invalidation
- Must not block the main thread — batches DOM reads with `requestAnimationFrame`

### Background Service Worker

- Listens to Chrome APIs: `chrome.tabs.onUpdated`, `chrome.tabs.onActivated`, `chrome.webNavigation` (Phase 2)
- Receives messages from content scripts and popup
- Manages session lifecycle (create, extend, close)
- Batches events and sends to backend API (Phase 3)
- Buffers events offline using `chrome.storage.local` (Phase 8)
- Uses `return true` in `onMessage` for async responses

### Popup UI

- Displays: status badge, session ID, event count, current tab URL
- Dark theme with purple accent (#7c5cff)
- No inline scripts or event handlers
- Reads `tab.url` via `chrome.tabs.query` (requires `tabs` permission)

### Permissions

| Permission | Purpose | Used By |
|------------|---------|---------|
| `tabs` | Access `tab.url` and `tab.title` | Background, Popup |
| `activeTab` | Temporary access to active tab on user gesture | Background |
| `scripting` | Execute scripts in tabs | Background (Phase 2) |
| `storage` | Persist session state | Background |
| `<all_urls>` (host) | Content script injection on all pages | Content Script |

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
User Action (page load)
    │
    ▼
Content Script (document_idle)
    │
    │ chrome.runtime.sendMessage({ type: 'PAGE_LOADED', data })
    ▼
Background Service Worker
    │
    │ Log event, increment counter
    │ Store session in chrome.storage.session
    │
    │ (Phase 3: Aggregate + batch)
    │ (Phase 8: Buffer if offline)
    ▼
POST /api/events (Phase 3)
    │
    │ Validate + transform
    ▼
MongoDB (events collection) (Phase 4)
```

## AI Pipeline (Future — Phase 6)

```
Raw Events ──▶ Event Summarization ──▶ Activity Classification ──▶ Timeline Generation
```

ASSUMPTION: AI processing will be added as a separate module that reads from the events collection. It will not modify the core event pipeline.
