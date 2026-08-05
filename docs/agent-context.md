# Agent Context

Persistent context for the AI coding agent. Updated after each phase.

## Current Implementation Status

| Component | Status | Phase |
|-----------|--------|-------|
| Repository structure | ✅ Complete | 0 |
| Documentation skeleton | ✅ Complete | 0 |
| Shared types | ✅ Complete | 0 |
| Shared utils | ✅ Complete | 0 |
| Docker (MongoDB) | ✅ Complete | 0 |
| Chrome extension foundation | ✅ Complete | 1 |
| Extension build system (esbuild) | ✅ Complete | 1 |
| Manifest V3 | ✅ Complete | 1 |
| Background service worker | ✅ Complete | 1 |
| Content script scaffold | ✅ Complete | 1 |
| Popup UI | ✅ Complete | 1 |
| Messaging layer | ✅ Complete | 1 |
| Event logger module (chrome.storage.local) | ✅ Complete | 2 |
| Tab activation & update tracking | ✅ Complete | 2 |
| Content script DOM tracking (click/scroll/visibility) | ✅ Complete | 2 |
| Event export & clear features in Popup | ✅ Complete | 2 |
| Express.js Backend Server (`apps/server`) | ✅ Complete | 3 |
| Single & Batch Event Ingestion APIs | ✅ Complete | 3 |
| Request Validation & Error Middlewares | ✅ Complete | 3 |
| Multi-Stage Dockerfile for Server | ✅ Complete | 3 |
| MongoDB Database Layer & Mongoose Connection | ✅ Complete | 4 |
| Event & Session Mongoose Models & Schemas | ✅ Complete | 4 |
| Polymorphic EventStore Abstraction | ✅ Complete | 4 |
| Real-Time Extension-to-Backend Sync Pipeline | ✅ Complete | 5 |
| Network Client with Timeout & Health Checks | ✅ Complete | 5 |
| Offline Queue with Exponential Backoff Retry | ✅ Complete | 5 |
| Visual Context Capture (`chrome.tabs.captureVisibleTab`) | ✅ Complete | 6 |
| Throttled 30s Capture Scheduler & Window Focus Check | ✅ Complete | 6 |
| Screenshot Ingestion Endpoint (`POST /api/screenshots`) | ✅ Complete | 6 |
| Local Image File Persistence (`apps/server/uploads/`) | ✅ Complete | 6 |
| Screenshot Mongoose Model & MongoDB Metadata | ✅ Complete | 6 |
| Popup Visual Stats & Latest Screenshot Preview Modal | ✅ Complete | 6 |
| Gemini Vision Provider Interface (`IVisionProvider`) | ✅ Complete | 7 |
| Prompt Engineering for JSON Output (`prompt.ts`) | ✅ Complete | 7 |
| ScreenshotAnalysis Mongoose Model & Storage | ✅ Complete | 7 |
| Asynchronous Processing Queue Service (`queue.service.ts`) | ✅ Complete | 7 |
| Analysis API Endpoints (`GET/POST /api/analysis`) | ✅ Complete | 7 |
| Popup AI Insights Card, Category Badge & Score Bar | ✅ Complete | 7 |
| Production README overhaul & Recruiter Demo Guide | ✅ Complete | 8 |
| GitHub Actions CI Pipeline (`.github/workflows/ci.yml`) | ✅ Complete | 8 |
| Governance files (LICENSE, CONTRIBUTING, SECURITY, etc.) | ✅ Complete | 8 |
| Request ID Tracking Middleware & Centralized Env Config | ✅ Complete | 8 |
| Service Metrics Health Check Endpoint (`GET /api/health`) | ✅ Complete | 8 |

## File Ownership

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `apps/extension/src/background/` | Extension | Service worker, sync manager, tab listeners |
| `apps/extension/src/content/` | Extension | DOM event capture (click, scroll, visibility) |
| `apps/extension/src/visual/` | Extension | Throttled screenshot capture, image utils, scheduler |
| `apps/extension/src/network/` | Extension | Network client (`client.ts`) for events, screenshots & AI analysis |
| `apps/extension/src/messaging/` | Extension | Typed message protocol & StoredEvent model |
| `apps/extension/src/storage/` | Extension | Event & screenshot offline storage queues |
| `apps/extension/src/popup/` | Extension | UI controls, AI Insights card, category badge, score bar |
| `apps/server/src/ai/` | Backend | Vision client, prompt builder, analysis & queue services |
| `apps/server/src/config/` | Backend | Centralized env configuration & validation |
| `apps/server/src/controllers/` | Backend | Ingestion controllers for events, screenshots, and AI analysis |
| `apps/server/src/middleware/` | Backend | Request ID logger & global error handlers |
| `apps/server/src/models/` | Backend | Mongoose models for `Event`, `Session`, `Screenshot`, `ScreenshotAnalysis` |
| `apps/server/uploads/` | Backend | Local static storage for uploaded screenshot images |
| `.github/` | CI/CD | GitHub Actions workflow, PR/Issue templates, CODEOWNERS |
| `packages/shared-types/` | Shared | TypeScript interfaces |
| `packages/shared-utils/` | Shared | Utility functions |
| `docs/` | All | Documentation & Recruiter Demo Guide |

## API Contracts

Defined in: [docs/api-spec.md](api-spec.md)

- `GET /api/health` — Enhanced server health check with service metrics
- `POST /api/events` — Ingest single event
- `POST /api/events/batch` — Ingest batch of events
- `POST /api/screenshots` — Upload visual context screenshot image & metadata
- `GET /api/screenshots` — Query screenshots by sessionId
- `GET /api/screenshots/latest` — Fetch latest recorded screenshot
- `GET /api/analysis/:screenshotId` — Get AI vision analysis for a screenshot
- `GET /api/analysis/session/:sessionId` — Get AI vision analyses for a session
- `POST /api/analysis/trigger/:screenshotId` — Trigger AI vision analysis for a screenshot

## Database Contracts

Defined in: [docs/database.md](database.md)

- `events` collection (`EventModel`)
- `sessions` collection (`SessionModel`)
- `screenshots` collection (`ScreenshotModel`)
- `screenshot_analyses` collection (`ScreenshotAnalysisModel`)

## Known Assumptions

1. Google Gemini Vision API (`gemini-2.5-flash`) is accessed via `GEMINI_API_KEY` env var.
2. `MockVisionProvider` serves as an intelligent development fallback when `GEMINI_API_KEY` is not provided.
3. Analyses run asynchronously in the background queue (`AnalysisQueueService`) without blocking HTTP uploads.
