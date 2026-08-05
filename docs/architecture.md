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
                                    HTTP REST API (Phase 3)
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
| `CLICK` | Content → Background | Notify user clicked an element (selector, tag, text) |
| `SCROLL` | Content → Background | Notify user scrolled page (throttled depth percentage) |
| `VISIBILITY_CHANGED` | Content → Background | Notify tab visibility state changed |
| `GET_STATUS` | Popup → Background | Request current extension status & stats |
| `CLEAR_EVENTS` | Popup → Background | Clear all stored events from local storage |
| `EXPORT_EVENTS` | Popup → Background | Retrieve all stored events for JSON export |

### Event Storage & Logging Layer

- Event logger encapsulated in `apps/extension/src/storage/event-logger.ts`
- Events persisted in `chrome.storage.local` under key `vai_events`
- Maintains an append-only timeline with auto-capping at 10,000 events
- All events conform to the standard `StoredEvent` model

### Session Management

- Session IDs are generated as `vai_<timestamp36>_<random>`
- Stored in `chrome.storage.session` (survives SW restart, cleared on browser close)
- Session state includes: `sessionId`, `lastEventCount`, `lastEventType`, `isActive`, `startedAt`
- Emits a `session_started` event into the timeline upon initial creation

### Content Script

- Injected into all pages (`<all_urls>`) at `document_idle`
- Uses passive event listeners for `click` and `scroll`
- Throttles scroll logging (max once per 2s, minimum 5% change threshold)
- Prevents duplicate `PAGE_LOADED` messages within the same script context

### Background Service Worker

- Listens to Chrome APIs: `chrome.tabs.onActivated` (tab switch), `chrome.tabs.onUpdated` (URL/title changes)
- Logs corresponding `tab_switch` and `url_change` events
- Filters out non-HTTP(S) scheme URLs (e.g. `chrome://`)
- Handles message dispatch and local event timeline persistence

### Popup UI

- Displays: status badge, session ID, event count, last recorded event type, current tab URL
- Features: "Export JSON" button (downloads JSON timeline) and "Clear Events" button
- Dark theme styling with responsive layout
- Reads `tab.url` via `chrome.tabs.query` (requires `tabs` permission)

### Permissions

| Permission | Purpose | Used By |
|------------|---------|---------|
| `tabs` | Access `tab.url` and `tab.title` | Background, Popup |
| `activeTab` | Temporary access to active tab on user gesture | Background |
| `scripting` | Execute scripts in tabs | Background |
| `storage` | Persist session state and local event log | Background, Storage |
| `<all_urls>` (host) | Content script injection on all pages | Content Script |

## Backend Architecture (Phase 3)

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
    │ Process event & append to timeline
    ▼
chrome.storage.local (vai_events)
```
