# Visual AI Browser Agent — Recruiter & Interview Demo Guide

This document contains a structured 3-minute demo script, key technical highlights for recruiters, and common technical interview questions with recommended answers.

---

## 1. What to Show Recruiters (Key Highlights)

1. **Manifest V3 Architecture**: Background Service Worker, Content Scripts, Popup UI, and strict permissions (`tabs`, `activeTab`, `scripting`, `storage`).
2. **Offline-First Synchronization Pipeline**: Local queue in `chrome.storage.local` with automatic batching, exponential backoff retries ($2^n\text{s}$ capped at $60\text{s}$), and background flushing to Express.
3. **Throttled Visual Context Capture**: `chrome.tabs.captureVisibleTab` with window focus checks and 30-second interval throttling to prevent redundant captures.
4. **Multimodal AI Integration**: Google Gemini 2.5 Flash API integration for automated visual context analysis, returning structured JSON metrics (summary, category, productivity score, entities, confidence).
5. **Production Monorepo & Fallback Architecture**: TypeScript strict mode monorepo (npm workspaces) with graceful fallback to in-memory event stores when MongoDB or Gemini API keys are offline.

---

## 2. 3-Minute Walkthrough Script

### Minute 0:00 - 0:45 | Overview & Architecture
> *"Hi! This project is the **Visual AI Browser Agent**, an enterprise-ready Chrome Extension (Manifest V3) and Node.js + Express backend that captures real-time browser activity, records visual context, and uses Google Gemini Vision API to summarize productivity."*
>
> *"It's built as a clean monorepo with TypeScript strict mode, shared types, and robust offline queueing so no telemetry is lost if the user loses connectivity."*

### Minute 0:45 - 1:45 | Live Demo (Extension & Event Capture)
1. Show the extension loaded in Chrome unpacked extension mode (`apps/extension/dist`).
2. Open Chrome, browse to a site (e.g. GitHub), click buttons, scroll down the page, and switch tabs.
3. Click the extension popup icon:
   - Point out the **Active Status** badge and **Connected** backend state.
   - Point out the **Session ID** and live **Screenshot Count**.
4. Click **View Image**: show the captured browser screenshot in the preview modal.

### Minute 1:45 - 2:30 | AI Vision Analysis
1. Click **Analyze Latest Screenshot** in the popup UI:
   - Highlight that the server asynchronously enqueues the screenshot, runs vision analysis through Google Gemini 2.5 Flash API, and returns structured JSON.
   - Show the rendered **AI Summary**, **Category Badge** (e.g. `Development`), and **Productivity Score** bar (e.g. `95 / 100`).

### Minute 2:30 - 3:00 | Database & Reliability
1. Open terminal and run `curl http://localhost:3000/api/health` to show health check metrics (MongoDB status, queue size, uptime, version).
2. Stop the backend server to demonstrate offline queueing: browse pages; show events accumulating safely in `chrome.storage.local`.
3. Restart the server: demonstrate automatic reconnection and batch queue flushing to MongoDB.

---

## 3. Common Interview Questions & Answers

### Q1: Why did you choose Manifest V3 over Manifest V2?
> **Answer**: Manifest V3 is the modern, mandatory standard for Chrome Extensions. It replaces background pages with ephemeral Background Service Workers, enhancing performance and security. We designed our storage layer using `chrome.storage.local` and `chrome.storage.session` so state persists seamlessly across service worker termination cycles.

### Q2: How do you handle network latency and offline scenarios?
> **Answer**: All captured events and screenshots are enqueued in `chrome.storage.local` first. A background synchronization pipeline attempts transmission using HTTP batching (`POST /api/events/batch`). If the network fails or times out, the queue remains safely stored on disk and retries with exponential backoff ($2\text{s}, 4\text{s}, 8\text{s}, 16\text{s}, 32\text{s}$, max $60\text{s}$).

### Q3: How does the AI Vision integration work without slowing down screenshot capture?
> **Answer**: Screenshot upload and AI vision analysis are decoupled. The extension uploads raw PNG binaries to `POST /api/screenshots`, which returns immediately ($<5\text{ms}$). The server then enqueues the `screenshotId` into `AnalysisQueueService`, where background workers read the image and call Gemini Vision asynchronously.

### Q4: How is the codebase structured for maintainability?
> **Answer**: We use an npm workspace monorepo with `packages/shared-types` defining strict interfaces for all API payloads and database schemas. The AI layer uses the Strategy pattern (`IVisionProvider`), allowing seamless swapping between `GeminiVisionProvider` and `MockVisionProvider` for offline development.
