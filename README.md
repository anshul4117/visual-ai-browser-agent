# Visual AI Browser Agent

[![CI Pipeline](https://github.com/anshul4117/visual-ai-browser-agent/actions/workflows/ci.yml/badge.svg)](https.github.com/anshul4117/visual-ai-browser-agent/actions)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)
[![Node.js 20](https://img.shields.io/badge/Node.js-v20_LTS-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0_Community-green.svg)](https://www.mongodb.com/)
[![Gemini Vision](https://img.shields.io/badge/AI_Vision-Google_Gemini_2.5_Flash-purple.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> An enterprise-grade Manifest V3 Chrome Extension and Express.js + MongoDB backend that monitors browser activity, captures visual tab context, and uses Google Gemini Vision API to generate structured productivity insights.

---

## 📌 Executive Summary

The **Visual AI Browser Agent** is a full-stack, multimodal browser monitoring and activity intelligence system. It tracks user interactions (navigation, clicks, scroll depth, tab switching, document visibility), periodically captures browser visual context (`chrome.tabs.captureVisibleTab`), queues telemetry offline with exponential backoff retries, and analyzes screenshots via **Google Gemini 2.5 Flash API** to classify productivity and generate semantic summaries.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Chrome Extension (Manifest V3)                  │
│                                                                        │
│  ┌──────────────────┐           ┌───────────────────────────────────┐  │
│  │ Content Scripts  │──sendMessage▶│ Background Service Worker          │  │
│  │ • DOM Events     │           │ • Message Router & Tab Listeners  │  │
│  │ • PAGE_LOADED    │           │ • 30s Visual Scheduler            │  │
│  └──────────────────┘           │ • Throttled Visual Capture        │  │
│  ┌──────────────────┐           │ • Event & Screenshot Queues       │  │
│  │ Extension Popup  │──sendMessage▶│ • Real-Time Sync Pipeline         │  │
│  │ • Status Badge   │           └─────────────┬─────────────────────┘  │
│  │ • AI Insights    │                         │                        │
│  │ • Score Bar      │                         ▼                        │
│  │ • Analyze Button │           ┌───────────────────────────────────┐  │
│  └──────────────────┘           │ Local Offline Storage Queue       │  │
│                                 │ • vai_events (storage.local)      │  │
│                                 │ • vai_screenshots (storage.local) │  │
│                                 └─────────────┬─────────────────────┘  │
└───────────────────────────────────────────────┼────────────────────────┘
                                                │
                                    HTTP POST /api/events/batch
                                    HTTP POST /api/screenshots
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express.js Backend API & AI Engine                │
│                                                                        │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  Middleware     │───▶│  Routes            │───▶│  Controllers    │  │
│  │  • CORS         │    │  • /api/health     │    │  • Health       │  │
│  │  • Request ID   │    │  • /api/events     │    │  • Events       │  │
│  │  • JSON 50mb    │    │  • /api/screenshots│    │  • Screenshots  │  │
│  │  • Logger       │    │  • /api/analysis   │    │  • Analysis     │  │
│  └─────────────────┘    └────────────────────┘    └────────┬────────┘  │
│                                                            │           │
│                                                            ▼           │
│                                                   ┌─────────────────┐  │
│                                                   │ Async AI Queue  │  │
│                                                   │ (queue.service) │  │
│                                                   └────────┬────────┘  │
└────────────────────────────────────────────────────────────┼───────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │ Vision Provider │
                                                    │ (Google Gemini) │
                                                    └────────┬────────┘
                                                             │
                                          ┌──────────────────┴──────────────────┐
                                          ▼                                     ▼
                              ┌───────────────────────┐             ┌───────────────────────┐
                              │ GeminiVisionProvider  │             │ MockVisionProvider    │
                              │ (Gemini 2.5 Flash API)│             │ (Development Fallback)│
                              └───────────────────────┘             └───────────────────────┘
                                          │                                     │
                                          └──────────────────┬──────────────────┘
                                                             │
                                                             ▼
                                                ┌────────────────────────┐
                                                │ MongoDB 7 (Mongoose)   │
                                                │ • events               │
                                                │ • sessions             │
                                                │ • screenshots          │
                                                │ • screenshot_analyses  │
                                                └────────────────────────┘
```

---

## ✨ Features

- **Manifest V3 Compliant**: Built strictly using non-persistent Background Service Workers and modern Chrome APIs.
- **Comprehensive Activity Tracking**: Automatically tracks page loads, URL updates, active tab switching, click interactions, scroll depth percentages, and document visibility changes.
- **Throttled Visual Context Capture**: Captures visible browser tab area (`chrome.tabs.captureVisibleTab`) with active window focus checks and 30-second interval throttling.
- **Offline-First Synchronization**: Queues events locally in `chrome.storage.local` with automatic batching and exponential backoff retry algorithms ($2\text{s}, 4\text{s}, 8\text{s}, 16\text{s}, 32\text{s}$, max $60\text{s}$).
- **Multimodal AI Vision Analysis**: Integrates **Google Gemini 2.5 Flash API** to generate structured semantic summaries, activity classification categories, and productivity scores ($0 - 100$).
- **Decoupled Asynchronous Processing**: Screenshot upload returns immediately while an in-memory background worker processes AI analysis asynchronously.
- **Polymorphic Database Fallback**: Persists to MongoDB 7 via Mongoose, with graceful fallback to in-memory event stores when running without database containers.
- **Interactive Extension Popup**: Features real-time status badges, offline queue item counters, backend URL configuration, JSON log export, preview image modal, and AI Vision Insights score bar.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Extension** | Chrome Manifest V3, TypeScript, esbuild | Ephemeral service worker, content scripts, popup UI |
| **Backend** | Node.js v20 LTS, Express.js 4.x, TypeScript | RESTful API server with strict validation & request ID tracing |
| **Database** | MongoDB 7.0, Mongoose 8.x | Document database for sessions, events, screenshots, and AI analyses |
| **AI Engine** | Google Gemini 2.5 Flash API (`@google/genai`) | Multimodal vision model for visual activity classification |
| **Tooling** | Docker Compose, npm Workspaces, GitHub Actions | Containerized database and automated CI/CD pipeline |

---

## 📂 Repository Structure

```
visual-ai-browser-agent/
├── apps/
│   ├── extension/                    # Chrome Extension (Manifest V3)
│   │   ├── src/
│   │   │   ├── background/           # Service worker & sync pipeline
│   │   │   ├── content/              # Content scripts DOM event tracking
│   │   │   ├── messaging/            # Typed message contracts
│   │   │   ├── network/              # Network client with fetch timeout
│   │   │   ├── storage/              # Offline storage queue loggers
│   │   │   ├── visual/               # Throttled visual capture & scheduler
│   │   │   └── popup/                # Popup HTML/CSS/TS interface
│   │   └── manifest.json
│   └── server/                       # Node.js + Express API Backend
│       ├── uploads/                  # Local storage for screenshot image files
│       └── src/
│           ├── ai/                   # Vision client, prompt engineering, queue service
│           ├── config/               # Centralized env configuration
│           ├── controllers/          # Event, screenshot, and analysis controllers
│           ├── database/             # Mongoose connection manager
│           ├── middleware/           # Request ID logger & error handling
│           ├── models/               # Mongoose schemas (Event, Session, Screenshot, Analysis)
│           └── routes/               # API Express routes
├── packages/
│   ├── shared-types/                 # Shared TypeScript contracts across extension and server
│   └── shared-utils/                 # Shared utility functions
├── docs/                             # Complete project documentation & recruiter demo guide
├── .github/
│   └── workflows/ci.yml              # GitHub Actions CI workflow
├── docker-compose.yml                # MongoDB Docker setup
├── package.json                      # Monorepo root workspace configuration
├── README.md
└── AGENT.md                          # AI Agent execution context
```

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker**: Docker Desktop (optional, for local MongoDB container)

### 2. Installation & Build

```bash
# Clone the repository
git clone https://github.com/anshul4117/visual-ai-browser-agent.git
cd visual-ai-browser-agent

# Install dependencies for all workspaces
npm install

# Build shared types package
npm run build --workspace=packages/shared-types

# Build server and extension packages
npm run build --workspaces
```

### 3. Environment Variables Setup

Copy the example environment file:

```bash
cp .env.example .env
```

`.env` configuration keys:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
MONGODB_URI=mongodb://localhost:27017/visual-ai-browser-agent
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> *Note: If `GEMINI_API_KEY` is omitted, the backend server automatically runs `MockVisionProvider` so you can test all AI features offline.*

---

## 🐳 Running with Docker

Start the containerized MongoDB database:

```bash
# Start MongoDB service
docker-compose up -d

# Verify container is running
docker-compose ps
```

Start the API Server:

```bash
npm run dev --workspace=apps/server
```

---

## 🧩 Loading the Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked**.
4. Select the directory: `<repository-root>/apps/extension/dist`.
5. The **Visual AI Browser Agent** extension icon will appear in your extensions bar.

---

## 🤖 AI Vision Pipeline

```
1. Active Browser Tab ──▶ captureVisibleTab() ──▶ Base64 PNG Data URL
                                                      │
2. Local Offline Queue (chrome.storage.local) ───────┼──▶ POST /api/screenshots
                                                      │   (Returns 201 Created)
                                                      ▼
3. Background Worker ──▶ Reads PNG File ──▶ Google Gemini 2.5 Flash API
                                                      │
4. Parsed JSON Metrics ◀──────────────────────────────┘
   { summary, category, productivityScore, entities, confidence }
                                                      │
                                                      ▼
5. Saved in MongoDB screenshot_analyses ──▶ Extension Popup UI
```

---

## 📡 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service health, MongoDB status, queue metrics, and version |
| `POST` | `/api/events` | Ingest a single browser activity event |
| `POST` | `/api/events/batch` | Ingest a batch of browser activity events |
| `GET` | `/api/events` | Query recorded activity events with filtering & pagination |
| `GET` | `/api/events/:sessionId` | Retrieve activity timeline for a given session |
| `POST` | `/api/screenshots` | Upload screenshot image binary and metadata |
| `GET` | `/api/screenshots` | Query screenshot records |
| `GET` | `/api/screenshots/latest` | Retrieve most recent captured screenshot |
| `GET` | `/api/analysis/:screenshotId` | Fetch AI Vision analysis for a screenshot |
| `GET` | `/api/analysis/session/:sessionId` | Fetch all AI Vision analyses for a session |
| `POST` | `/api/analysis/trigger/:screenshotId` | Trigger/re-run AI Vision analysis |

---

## 📖 Recruiter & Interview Demo Guide

A complete 3-minute interview demonstration script, architecture walkthrough, and technical Q&A are documented in [docs/demo.md](docs/demo.md).

---

## 🔮 Future Improvements

- **Web Dashboard**: React/Next.js real-time analytics dashboard with interactive session timelines.
- **OCR Text Extraction**: On-device OCR text recognition using Tesseract.js.
- **Multi-Model Routing**: Support for Claude 3.5 Sonnet and OpenAI GPT-4o vision providers.
- **Privacy Masking**: Automatic client-side canvas blurring for sensitive input fields and password inputs before screenshot capture.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
