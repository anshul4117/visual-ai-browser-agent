# Visual AI Browser Agent

[![CI Pipeline](https://github.com/anshul4117/visual-ai-browser-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/anshul4117/visual-ai-browser-agent/actions)
[![Live Web Dashboard](https://img.shields.io/badge/Live_Dashboard-Vercel_Deployed-black?logo=vercel)](https://visual-ai-dashboard.vercel.app)
[![Live Backend API](https://img.shields.io/badge/Live_API-Render_Hosted-blue?logo=render)](https://visual-ai-api.onrender.com/api/health)
[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-blue.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)
[![Node.js 20](https://img.shields.io/badge/Node.js-v20_LTS-green.svg)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Cloud-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![Gemini Vision](https://img.shields.io/badge/AI_Vision-Google_Gemini_2.5_Flash-purple.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> An enterprise-grade Manifest V3 Chrome Extension, Express.js + MongoDB backend, and React Web Dashboard that captures real-time browser activity, records visual tab context, and uses Google Gemini Vision API to generate structured productivity insights.

---

## 🌐 Live Public Demo URLs

| Component | Platform | Live URL | Description |
|-----------|----------|----------|-------------|
| **Web Dashboard** | Vercel | [https://visual-ai-dashboard.vercel.app](https://visual-ai-dashboard.vercel.app) | Public analytics & real-time telemetry dashboard |
| **Backend API** | Render | [https://visual-ai-api.onrender.com/api/health](https://visual-ai-api.onrender.com/api/health) | Public REST API & Gemini Vision analysis service |
| **Database** | MongoDB Atlas | *Managed Cloud Cluster* | Cloud persistence with automatic connection pooling |

---

## ⚡ 60-Second Recruiter Quickstart

1. **Visit Live Dashboard**: Open [https://visual-ai-dashboard.vercel.app](https://visual-ai-dashboard.vercel.app) in any web browser to explore real-time session timelines, telemetry charts, and Gemini AI evaluations.
2. **Test Public API Health**: Run `curl https://visual-ai-api.onrender.com/api/health` to inspect server health metrics, database connection status, and AI provider status.
3. **Load Chrome Extension (Local)**:
   ```bash
   git clone https://github.com/anshul4117/visual-ai-browser-agent.git
   cd visual-ai-browser-agent
   npm install && npm run build --workspace=@visual-ai/extension
   ```
   Open `chrome://extensions` $\rightarrow$ enable **Developer mode** $\rightarrow$ click **Load unpacked** $\rightarrow$ select `apps/extension/dist`.
4. **Point Extension to Live Backend**:
   In the Extension Popup, set the Backend URL to `https://visual-ai-api.onrender.com` to stream your live browsing telemetry to the cloud dashboard.

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
│  └──────────────────┘           └─────────────┬─────────────────────┘  │
│                                               │                        │
│                                               ▼                        │
│                                 ┌───────────────────────────────────┐  │
│                                 │ Local Offline Storage Queue       │  │
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
│                         (Hosted on Render / Railway)                   │
│                                                                        │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  Middleware     │───▶│  Routes            │───▶│  Controllers    │  │
│  │  • Helmet (CSP) │    │  • /api/health     │    │  • Health       │  │
│  │  • Compression  │    │  • /api/events     │    │  • Events       │  │
│  │  • Rate Limiter │    │  • /api/screenshots│    │  • Screenshots  │  │
│  │  • Logger UUID  │    │  • /api/analysis   │    │  • Analysis     │  │
│  │  • Trust Proxy  │    │  • /api/dashboard  │    │  • Dashboard    │  │
│  └─────────────────┘    └────────────────────┘    └────────┬────────┘  │
└───────────────────────────────────────────────┬────────────┼───────────┘
                                                │            │
                                                │            ▼
                                                │   ┌─────────────────┐
                                                │   │ Async AI Queue  │──▶ Google Gemini Vision
                                                │   │ (queue.service) │    (gemini-2.5-flash)
                                                │   └─────────────────┘
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Web Dashboard (React + Vite)                   │
│                            (Hosted on Vercel)                          │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │   Overview   │   │   Sessions   │   │  Events Log  │   │ Visuals  │ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────┘ │
│  ┌──────────────┐   ┌──────────────┐                                   │
│  │ AI Insights  │   │  Analytics   │                                   │
│  └──────────────┘   └──────────────┘                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- **Manifest V3 Compliant**: Built strictly using non-persistent Background Service Workers and modern Chrome APIs.
- **Comprehensive Activity Tracking**: Automatically tracks page loads, URL updates, active tab switching, click interactions, scroll depth percentages, and document visibility changes.
- **Throttled Visual Context Capture**: Captures visible browser tab area (`chrome.tabs.captureVisibleTab`) with active window focus checks and 30-second interval throttling.
- **Offline-First Synchronization**: Queues events locally in `chrome.storage.local` with automatic batching and exponential backoff retry algorithms ($2\text{s}, 4\text{s}, 8\text{s}, 16\text{s}, 32\text{s}$, max $60\text{s}$).
- **Multimodal AI Vision Analysis**: Integrates **Google Gemini 2.5 Flash API** to generate structured semantic summaries, activity classification categories, and productivity scores ($0 - 100$).
- **Recruiter Web Dashboard**: Modern dark mode React + Vite dashboard featuring session duration histograms, 24h event volume area charts, category share distributions, and interactive screenshot Lightbox modal.
- **Production Hardened Backend**: Equipped with Helmet security headers, Gzip compression, rate limiting (1000 req/15min), UUID request tracing (`x-request-id`), and trust proxy support.
- **Polymorphic Database Fallback**: Persists to MongoDB Atlas via Mongoose, with graceful fallback to in-memory event stores when running without cloud database credentials.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|-------|------------|-------------|
| **Extension** | Chrome Manifest V3, TypeScript, esbuild | Ephemeral service worker, content scripts, popup UI |
| **Backend** | Node.js v20 LTS, Express.js 4.x, TypeScript | RESTful API with Helmet, Rate Limiter, Compression, and Request ID tracing |
| **Web Dashboard** | React 18, Vite, Tailwind CSS, TanStack Query, Recharts | Recruiter analytics interface and visual context explorer |
| **Database** | MongoDB Atlas / MongoDB 7.0, Mongoose 8.x | Cloud document database for sessions, events, screenshots, and AI analyses |
| **AI Engine** | Google Gemini 2.5 Flash API (`@google/genai`) | Multimodal vision model for visual activity classification |
| **Cloud Hosting** | Vercel & Render | Automated CI/CD deployment with SPA client rewrites |

---

## 🚀 Local Development Setup

### 1. Installation & Build

```bash
# Clone the repository
git clone https://github.com/anshul4117/visual-ai-browser-agent.git
cd visual-ai-browser-agent

# Install dependencies for all workspaces
npm install

# Build shared types package
npm run build --workspace=packages/shared-types

# Build all monorepo packages (extension, server, dashboard)
npm run build --workspaces
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

`.env` configuration keys:

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
DASHBOARD_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/visual-ai-browser-agent
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Start Services

```bash
# Terminal 1: Start MongoDB (Docker)
docker-compose up -d

# Terminal 2: Start Express API Server
npm run dev --workspace=@visual-ai/server

# Terminal 3: Start Web Dashboard
npm run dev --workspace=@visual-ai/dashboard
```

---

## 📖 Recruiter & Interview Demo Guide

A complete 3-minute interview demonstration script, architecture walkthrough, and technical Q&A are documented in [docs/demo.md](docs/demo.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
