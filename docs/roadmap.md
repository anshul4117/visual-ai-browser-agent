# Roadmap

## Phase 0 — Project Setup ✅

- [x] Initialize monorepo
- [x] Configure TypeScript
- [x] Configure Docker (MongoDB)
- [x] Configure Git workflow
- [x] Create documentation skeleton
- [x] Create shared types package
- [x] Create shared utils package

**Deliverable:** Repository initialized with docs and Docker.

---

## Phase 1 — Chrome Extension Foundation

- [ ] Manifest V3 configuration
- [ ] Background service worker (empty scaffold)
- [ ] Content script injection setup
- [ ] Permissions configuration
- [ ] Extension popup (basic UI)
- [ ] Build system (bundler)

**Deliverable:** Installable Chrome extension that loads in the browser.

---

## Phase 2 — Browser Activity Tracking

Track:

- [ ] URL changes (`chrome.tabs.onUpdated`)
- [ ] Tab switches (`chrome.tabs.onActivated`)
- [ ] Page loads (`chrome.webNavigation.onCompleted`)
- [ ] Time on page
- [ ] Click events (content script)
- [ ] Scroll events (content script)
- [ ] Form interactions (content script)

**Deliverable:** Structured activity events generated locally in the extension.

---

## Phase 3 — Backend API

Implement:

- [ ] Express.js server setup
- [ ] `POST /api/events` — receive events
- [ ] `GET /api/events` — query events
- [ ] `GET /api/health` — health check
- [ ] Request validation
- [ ] Error handling middleware
- [ ] CORS configuration

**Deliverable:** Events received and validated by the backend.

---

## Phase 4 — Database Persistence

- [ ] MongoDB connection with Mongoose
- [ ] Event schema and model
- [ ] Session schema and model
- [ ] Index creation
- [ ] Batch insertion support
- [ ] Connection error handling

**Deliverable:** Browser activity stored permanently in MongoDB.

---

## Phase 5 — Visual Context

Implement one safe visual feature:

- [ ] Browser screenshot capture (where Chrome permissions allow)
- [ ] OR DOM snapshot capture
- [ ] Associate visual context with activity events

**Deliverable:** Visual/browser context associated with activity events.

---

## Phase 6 — AI Processing Layer

- [ ] Event summarization
- [ ] Activity classification
- [ ] Timeline generation

**Deliverable:** AI-ready processing pipeline.

---

## Phase 7 — Dashboard

- [ ] Activity timeline view
- [ ] Session view
- [ ] Event filtering
- [ ] Screenshot preview
- [ ] Search functionality

**Deliverable:** Simple monitoring dashboard.

---

## Phase 8 — Production Polish

- [ ] Error handling improvements
- [ ] Retry queue for failed API calls
- [ ] Offline buffering in extension
- [ ] Logging
- [ ] Rate limiting
- [ ] Security review

**Deliverable:** Production-quality submission.
