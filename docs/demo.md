# Visual AI Browser Agent — Recruiter & Interview Demo Guide

This document contains a structured 3-minute demo script, key technical highlights for recruiters, live public deployment URLs, and common technical interview questions with recommended answers.

---

## 🌐 Public Live Demo URLs

| Resource | Platform | URL |
|----------|----------|-----|
| **Web Dashboard** | Vercel | [https://visual-ai-dashboard.vercel.app](https://visual-ai-dashboard.vercel.app) |
| **Backend API Health** | Render | [https://visual-ai-api.onrender.com/api/health](https://visual-ai-api.onrender.com/api/health) |

---

## 1. What to Show Recruiters (Key Highlights)

1. **Manifest V3 Architecture**: Background Service Worker, Content Scripts, Popup UI, and strict permissions (`tabs`, `activeTab`, `scripting`, `storage`).
2. **Offline-First Synchronization Pipeline**: Local queue in `chrome.storage.local` with automatic batching, exponential backoff retries ($2^n\text{s}$ capped at $60\text{s}$), and background flushing to Express.
3. **Throttled Visual Context Capture**: `chrome.tabs.captureVisibleTab` with window focus checks and 30-second interval throttling to prevent redundant captures.
4. **Multimodal AI Integration**: Google Gemini 2.5 Flash API integration for automated visual context analysis, returning structured JSON metrics (summary, category, productivity score, entities, confidence).
5. **Recruiter Web Dashboard**: React + Vite + Tailwind CSS dashboard with Recharts visualizations, session duration histograms, and an interactive Lightbox modal for previewing screenshots and Gemini AI analyses.
6. **Cloud Deployment Infrastructure**: Deployed on Vercel and Render with MongoDB Atlas connection pooling, Helmet security headers, Gzip compression, and rate-limiting.

---

## 2. 3-Minute Walkthrough Script

### Minute 0:00 - 0:45 | Overview & Live Public Dashboard
> *"Hi! This project is the **Visual AI Browser Agent**, an enterprise-ready Chrome Extension (Manifest V3), Express.js + MongoDB Atlas backend, and React + Vite analytics Web Dashboard."*
>
> *"Recruiters can immediately open the live dashboard at [visual-ai-dashboard.vercel.app](https://visual-ai-dashboard.vercel.app) to inspect real-time user browsing telemetry, session timelines, and productivity analytics."*

### Minute 0:45 - 1:45 | Extension Demo & Visual Context Capture
1. Show the Chrome Extension loaded in Chrome unpacked mode (`apps/extension/dist`).
2. Browse pages (e.g., GitHub, StackOverflow), click buttons, and scroll.
3. Open Extension Popup: point out the **Connected** status badge, **Session ID**, and **Screenshot Count**.
4. Click **View Image**: preview the captured screenshot.

### Minute 1:45 - 2:30 | AI Vision Analysis & Web Dashboard
1. Open the **AI Insights** tab on the Web Dashboard:
   - Point out the **Gemini 2.5 Flash** evaluation cards, **Productivity Score** bar (e.g. `95 / 100`), **Category Badge** (e.g. `Development`), and entity tags (`#GitHub`, `#TypeScript`).
2. Open the **Visual Captures Gallery**:
   - Click on any thumbnail image to trigger the **Lightbox Modal**, displaying the high-res browser screenshot alongside its paired AI vision summary.

### Minute 2:30 - 3:00 | Health Diagnostics & Cloud Reliability
1. Run `curl https://visual-ai-api.onrender.com/api/health` to show health check metrics (MongoDB status, queue size, uptime, version).
2. Point out production security middleware (Helmet, Gzip compression, rate limiting, and CORS headers).

---

## 3. Common Interview Questions & Answers

### Q1: Why did you choose Manifest V3 over Manifest V2?
> **Answer**: Manifest V3 is the modern, mandatory standard for Chrome Extensions. It replaces background pages with ephemeral Background Service Workers, enhancing performance and security. We designed our storage layer using `chrome.storage.local` and `chrome.storage.session` so state persists seamlessly across service worker termination cycles.

### Q2: How do you handle network latency and offline scenarios?
> **Answer**: All captured events and screenshots are enqueued in `chrome.storage.local` first. A background synchronization pipeline attempts transmission using HTTP batching (`POST /api/events/batch`). If the network fails or times out, the queue remains safely stored on disk and retries with exponential backoff ($2\text{s}, 4\text{s}, 8\text{s}, 16\text{s}, 32\text{s}$, max $60\text{s}$).

### Q3: How does the AI Vision integration work without slowing down screenshot capture?
> **Answer**: Screenshot upload and AI vision analysis are decoupled. The extension uploads raw PNG binaries to `POST /api/screenshots`, which returns immediately ($<5\text{ms}$). The server then enqueues the `screenshotId` into `AnalysisQueueService`, where background workers read the image and call Gemini Vision asynchronously.

### Q4: How is the production deployment structured?
> **Answer**: The Web Dashboard is deployed on Vercel with SPA client routing rewrites, while the Express API is hosted on Render with MongoDB Atlas for persistent document storage. The server enforces Helmet security headers, Gzip compression, rate limiting, and CORS rules accepting requests from the Vercel dashboard.
