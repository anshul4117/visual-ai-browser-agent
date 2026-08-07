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

## Phase 3 — Backend API ✅

- [x] Express.js server setup in `apps/server`
- [x] `POST /api/events` single event endpoint
- [x] `POST /api/events/batch` batch events endpoint
- [x] `GET /api/events` query endpoint (filtering & pagination)
- [x] `GET /api/events/:sessionId` endpoint
- [x] `GET /api/health` health check endpoint
- [x] Request payload validation & error middleware
- [x] Request logging middleware
- [x] CORS configuration
- [x] Server Dockerfile & docker-compose service configuration

## Phase 4 — Database Persistence ✅

- [x] MongoDB connection with Mongoose (`apps/server/src/database/connection.ts`)
- [x] Event Mongoose model & schema (`apps/server/src/models/event.model.ts`)
- [x] Session Mongoose model & schema (`apps/server/src/models/session.model.ts`)
- [x] Database indexes (single & compound `sessionId + timestamp`)
- [x] Polymorphic `EventStore` interface & `MongoEventStore` implementation
- [x] Efficient `insertMany` batch insertion & automated session metadata updates
- [x] Graceful database connection & fallback handling

## Phase 5 — Extension → Backend Integration ✅

- [x] Extension network client (`apps/extension/src/network/client.ts`)
- [x] Configurable backend URL with `chrome.storage.sync` (default: `http://localhost:3000`)
- [x] Temporary offline event queue in `chrome.storage.local`
- [x] Real-time queue flushing via `POST /api/events/batch`
- [x] Exponential backoff retry strategy for failed uploads
- [x] Popup connection status badge (`Connected`, `Syncing`, `Offline`, `Error`)
- [x] Popup manual **Sync Now** button & **Backend Server URL** config input
- [x] Offline event queue removal upon successful upload

## Phase 6 — Visual Context Capture ✅

- [x] Visual context capture module (`apps/extension/src/visual/capture.ts`) using `chrome.tabs.captureVisibleTab`
- [x] Periodic 30s capture scheduler (`apps/extension/src/visual/scheduler.ts`) with window focus check
- [x] Image utility helper module (`apps/extension/src/visual/image-utils.ts`)
- [x] Temporary screenshot offline queue (`apps/extension/src/storage/screenshot-logger.ts`)
- [x] Backend `POST /api/screenshots` endpoint & static `/uploads` serving
- [x] Screenshot Mongoose model & MongoDB metadata persistence (`apps/server/src/models/screenshot.model.ts`)
- [x] Popup visual capture statistics & **View Latest Screenshot** preview modal

## Phase 7 — AI Vision Analysis ✅

- [x] Gemini Vision provider interface & implementation (`apps/server/src/ai/vision-client.ts`)
- [x] Prompt engineering for strict JSON output (`apps/server/src/ai/prompt.ts`)
- [x] Asynchronous background AI queue service (`apps/server/src/ai/queue.service.ts`)
- [x] Screenshot Analysis service (`apps/server/src/ai/analysis.service.ts`)
- [x] Mongoose model for `ScreenshotAnalysis` (`apps/server/src/models/screenshot-analysis.model.ts`)
- [x] Analysis API endpoints (`GET/POST /api/analysis`)
- [x] Popup AI Insights card, category badge, productivity score bar & Analyze button

## Phase 8 — Production Polish ✅

- [x] README overhaul with architecture diagrams, badges, and quickstart instructions
- [x] Open-source governance files (`LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `.editorconfig`, `.gitattributes`)
- [x] GitHub issue templates, PR template, and `CODEOWNERS`
- [x] GitHub Actions CI pipeline (`.github/workflows/ci.yml`)
- [x] Centralized environment configuration and validation (`apps/server/src/config/env.ts`)
- [x] Request ID middleware (`x-request-id`) in logger middleware
- [x] Enhanced health check endpoint (`GET /api/health`) with MongoDB, Queue, and AI status
- [x] Recruiter Demo Guide (`docs/demo.md`) with 3-minute script & technical interview Q&A

## Phase 9 — Recruiter Web Dashboard ✅

- [x] Workspace setup (`apps/dashboard`) using React, Vite, TypeScript, Tailwind CSS
- [x] Backend read-only dashboard endpoints (`/api/dashboard/*`)
- [x] Overview page with system metrics, hourly event activity chart, and category share
- [x] Sessions page with duration, event counts, and interactive session timeline drawer
- [x] Events Log page with URL search, event type filtering, and paginated table
- [x] Visual Captures page with responsive gallery grid, thumbnail previews, and Lightbox modal
- [x] AI Vision Insights page with Gemini evaluation cards, confidence badges, and score bar
- [x] Analytics page with Recharts productivity trends, top domain bar chart, and session distribution
- [x] Dark mode UI design with loading skeletons, error boundaries, and empty state handlers
