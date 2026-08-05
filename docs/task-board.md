# Task Board

Master checklist for the Visual AI Browser Agent project.

## Phase 0 — Project Setup ✅

- [x] Repository initialization
- [x] Monorepo structure (npm workspaces)
- [x] TypeScript configuration
- [x] Docker Compose (MongoDB)
- [x] Documentation skeleton
- [x] AGENT.md
- [x] README.md
- [x] Shared types package
- [x] Shared utils package

## Phase 1 — Extension Foundation ✅

- [x] Manifest V3 (`manifest.json`)
- [x] Background service worker
- [x] Content script scaffold (PAGE_LOADED)
- [x] Extension popup HTML/CSS/JS
- [x] Build system configuration (esbuild)
- [x] Messaging layer (typed protocol)
- [x] Session management (chrome.storage.session)
- [x] Extension loads in Chrome

## Phase 2 — Activity Tracking ✅

- [x] URL change detection (`chrome.tabs.onUpdated`)
- [x] Tab switch detection (`chrome.tabs.onActivated`)
- [x] Page load detection (`PAGE_LOADED`)
- [x] Click event tracking (content script)
- [x] Scroll event tracking (throttled)
- [x] Visibility change tracking (`visibilitychange`)
- [x] Session lifecycle events (`SESSION_STARTED`)
- [x] Reusable event logger module (`chrome.storage.local`)
- [x] Popup event statistics & last event display
- [x] Popup JSON export & event clearing
- [x] Events structured per `shared-types` and `docs/database.md`

## Phase 3 — Backend API

- [ ] Express.js server setup
- [ ] `POST /api/events` endpoint
- [ ] `GET /api/events` endpoint
- [ ] `GET /api/health` endpoint
- [ ] Request validation
- [ ] Error handling middleware
- [ ] CORS configuration

## Phase 4 — Database

- [ ] MongoDB connection
- [ ] Event Mongoose model
- [ ] Session Mongoose model
- [ ] Index creation
- [ ] Batch insertion
- [ ] Connection error handling

## Phase 5 — Visual Context

- [ ] Screenshot capture OR DOM snapshot
- [ ] Associate visual data with events
- [ ] Storage strategy for visual data

## Phase 6 — AI Processing

- [ ] Event summarization
- [ ] Activity classification
- [ ] Timeline generation

## Phase 7 — Dashboard

- [ ] Activity timeline
- [ ] Session view
- [ ] Event filtering
- [ ] Screenshot preview
- [ ] Search

## Phase 8 — Production Polish

- [ ] Error handling
- [ ] Retry queue
- [ ] Offline buffering
- [ ] Logging
- [ ] Rate limiting
- [ ] Security review
