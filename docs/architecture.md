# Architecture

## Overview

The system follows a three-tier architecture:

1. **Chrome Extension** — Captures browser events and visual context (screenshots)
2. **Backend API** — Receives, validates, and routes events & visual context
3. **Database & Storage** — Persists events, sessions, and visual screenshots in MongoDB & local disk (`uploads/`)

## Extension Architecture & Visual Synchronization

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Chrome Extension                              │
│                                                                        │
│  ┌─────────────────┐           ┌────────────────────────────────────┐  │
│  │  Content Script  │──sendMessage▶│  Background Service Worker         │  │
│  │  • DOM events    │           │  • Message Router                  │  │
│  │  • PAGE_LOADED   │           │  • 30s Visual Scheduler            │  │
│  └─────────────────┘           │  • Throttled Visual Capture        │  │
│  ┌─────────────────┐           │  • Event & Screenshot Queues      │  │
│  │  Popup UI       │──sendMessage▶│  • Sync Pipeline to Express        │  │
│  │  • Status badge │           └──────────────┬─────────────────────┘  │
│  │  • Screenshot   │                          │                        │
│  │    modal view   │                          ▼                        │
│  │  • Sync Now     │           ┌────────────────────────────────────┐  │
│  │  • URL Config   │           │  Local Offline Queues              │  │
│  └─────────────────┘           │  • vai_events (storage.local)      │  │
│                                │  • vai_screenshots (storage.local) │  │
│                                └──────────────┬─────────────────────┘  │
│                                               │                        │
│                                               ▼                        │
│                                ┌────────────────────────────────────┐  │
│                                │  Network Client (network/client.ts)│  │
│                                └──────────────┬─────────────────────┘  │
└───────────────────────────────────────────────┼────────────────────────┘
                                                │
                                    HTTP POST /api/events/batch
                                    HTTP POST /api/screenshots
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
│   │   └── index.ts          # Service worker — router, queue & sync pipeline, visual capture
│   ├── content/
│   │   └── index.ts          # Content script — PAGE_LOADED, CLICK, SCROLL, VISIBILITY
│   ├── messaging/
│   │   └── types.ts          # Typed message protocol & Screenshot messaging interfaces
│   ├── network/
│   │   └── client.ts         # Network client — fetchWithTimeout, POST events/batch & POST screenshots
│   ├── storage/
│   │   ├── event-logger.ts   # Offline event queue module (chrome.storage.local)
│   │   └── screenshot-logger.ts # Offline screenshot queue module (chrome.storage.local)
│   ├── visual/
│   │   ├── capture.ts        # Throttled captureVisibleTab implementation with window focus check
│   │   ├── image-utils.ts    # Base64 Data URL to Blob & dimension extraction helpers
│   │   └── scheduler.ts      # Periodic 30s visual context capture scheduler
│   ├── popup/
│   │   ├── popup.html        # Popup UI (status, connection, screenshot stats, modal preview)
│   │   ├── popup.css         # Dark theme styles & modal overlay styling
│   │   └── popup.ts          # Popup logic — screenshot view modal, manual sync, URL config
│   └── manifest.json         # Manifest V3 config
├── dist/                     # Build output (load as unpacked extension)
├── package.json
└── tsconfig.json
```

### Visual Capture & Upload Flow

1. **Capture Triggers**:
   - Navigation & tab update events (`url_change`, `page_load`).
   - Tab switch events (`tab_switch`).
   - Periodic 30-second interval timer managed by `scheduler.ts` when tab remains active.

2. **Throttling & Focus Validation**:
   - `captureVisibleTab` checks browser window focus (`chrome.windows.getLastFocused`).
   - Throttled to a minimum 30-second interval (`MIN_CAPTURE_INTERVAL_MS = 30000`).

3. **Temporary Local Queue & Upload**:
   - Captured PNG Data URLs are saved to `chrome.storage.local` under key `vai_screenshots`.
   - On background sync flush, pending screenshots are transmitted via HTTP POST to `/api/screenshots`.
   - Upon HTTP `201 Created` response, uploaded screenshots are purged from `chrome.storage.local`.

## Backend Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Express.js Server API                           │
│                                                                        │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  Middleware     │───▶│  Routes            │───▶│  Controllers    │  │
│  │  • CORS         │    │  • /api/health     │    │  • Health       │  │
│  │  • JSON 50mb    │    │  • /api/events     │    │  • Events       │  │
│  │  • Logger       │    │  • /api/screenshots│    │  • Screenshots  │  │
│  │  • Validator    │    └────────────────────┘    └────────┬────────┘  │
│  └─────────────────┘                                       │           │
│                                                            ▼           │
│                                                   ┌─────────────────┐  │
│                                                   │  Local Storage  │  │
│                                                   │  apps/server/   │  │
│                                                   │  uploads/*.png  │  │
│                                                   └─────────────────┘  │
└────────────────────────────────────────────────────────────┬───────────┘
                                                             │
                                                             ▼
                                                ┌────────────────────────┐
                                                │ MongoDB 7 (Mongoose)   │
                                                │ • events               │
                                                │ • sessions             │
                                                │ • screenshots          │
                                                └────────────────────────┘
```

## Database Architecture

See [Database Schema](database.md) for collection definitions.
