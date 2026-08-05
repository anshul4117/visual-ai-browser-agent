# Architecture

## Overview

The system follows a three-tier architecture:

1. **Chrome Extension** — Captures browser events, visual context (screenshots), and renders AI Vision Insights
2. **Backend API & AI Engine** — Ingests events/screenshots, manages async queues, and invokes Google Gemini Vision API
3. **Database & Storage** — Persists events, sessions, screenshots, and AI vision analyses in MongoDB & local disk (`uploads/`)

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
│  │  • AI Insights  │                          │                        │
│  │    & Score bar  │                          ▼                        │
│  │  • Analyze Now  │           ┌────────────────────────────────────┐  │
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
                                    GET /api/analysis/:screenshotId
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
│   │   └── index.ts          # Service worker — router, queue & sync pipeline, AI vision handler
│   ├── content/
│   │   └── index.ts          # Content script — PAGE_LOADED, CLICK, SCROLL, VISIBILITY
│   ├── messaging/
│   │   └── types.ts          # Message protocol & AI Analysis response types
│   ├── network/
│   │   └── client.ts         # Network client — POST events, POST screenshots, GET/POST analysis
│   ├── storage/
│   │   ├── event-logger.ts   # Offline event queue module (chrome.storage.local)
│   │   └── screenshot-logger.ts # Offline screenshot queue module (chrome.storage.local)
│   ├── visual/
│   │   ├── capture.ts        # Throttled captureVisibleTab implementation with window focus check
│   │   ├── image-utils.ts    # Base64 Data URL to Blob & dimension extraction helpers
│   │   └── scheduler.ts      # Periodic 30s visual context capture scheduler
│   ├── popup/
│   │   ├── popup.html        # Popup UI (status, AI Insights card, category badge, score bar)
│   │   ├── popup.css         # Dark theme styles, AI card & score bar styling
│   │   └── popup.ts          # Popup logic — AI analyze button, view screenshot modal, URL config
│   └── manifest.json         # Manifest V3 config
├── dist/                     # Build output (load as unpacked extension)
├── package.json
└── tsconfig.json
```

## Backend & AI Engine Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Express.js Server API                           │
│                                                                        │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  Middleware     │───▶│  Routes            │───▶│  Controllers    │  │
│  │  • CORS         │    │  • /api/health     │    │  • Health       │  │
│  │  • JSON 50mb    │    │  • /api/events     │    │  • Events       │  │
│  │  • Logger       │    │  • /api/screenshots│    │  • Screenshots  │  │
│  │  • Validator    │    │  • /api/analysis   │    │  • Analysis     │  │
│  └─────────────────┘    └────────────────────┘    └────────┬────────┘  │
│                                                            │           │
│                                                            ▼           │
│                                                   ┌─────────────────┐  │
│                                                   │ Async Queue     │  │
│                                                   │ (queue.service) │  │
│                                                   └────────┬────────┘  │
└────────────────────────────────────────────────────────────┼───────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │ Analysis Service│
                                                    │(analysis.service│
                                                    └────────┬────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │ Vision Client   │
                                                    │ (IVisionProvider│
                                                    └────────┬────────┘
                                                             │
                                          ┌──────────────────┴──────────────────┐
                                          ▼                                     ▼
                              ┌───────────────────────┐             ┌───────────────────────┐
                              │ GeminiVisionProvider  │             │ MockVisionProvider    │
                              │ (Gemini 2.5 Flash API)│             │ (Development Fallback)│
                              └───────────────────────┘             └───────────────────────┘
```

## Database Architecture

See [Database Schema](database.md) for collection definitions.
