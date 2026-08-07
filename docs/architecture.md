# Architecture

## Overview

The system follows a four-tier architecture:

1. **Chrome Extension (Manifest V3)** — Captures real-time browser events, throttled visual context (screenshots), and renders extension popup controls.
2. **Backend API & AI Engine** — Ingests telemetry, manages async queues, serves dashboard read-only APIs, and invokes Google Gemini 2.5 Flash Vision API.
3. **Web Dashboard (`apps/dashboard`)** — Modern React + Vite + Tailwind CSS analytics dashboard providing real-time data visualization, session timelines, screenshot galleries, and AI insights.
4. **Database & Storage** — Persists events, sessions, screenshots, and AI vision analyses in MongoDB 7 & local disk (`uploads/`).

## System Architecture Diagram

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
│                                                                        │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────┐  │
│  │  Middleware     │───▶│  Routes            │───▶│  Controllers    │  │
│  │  • CORS         │    │  • /api/health     │    │  • Health       │  │
│  │  • Request ID   │    │  • /api/events     │    │  • Events       │  │
│  │  • JSON 50mb    │    │  • /api/screenshots│    │  • Screenshots  │  │
│  │  • Logger       │    │  • /api/analysis   │    │  • Analysis     │  │
│  │  │              │    │  • /api/dashboard  │    │  • Dashboard    │  │
│  └─────────────────┘    └────────────────────┘    └────────┬────────┘  │
└───────────────────────────────────────────────┬────────────┼───────────┘
                                                │            │
                                                │            ▼
                                                │   ┌─────────────────┐
                                                │   │ Async AI Queue  │──▶ Gemini Vision API
                                                │   └─────────────────┘
                                                │
                                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Web Dashboard (React + Vite)                   │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │   Overview   │   │   Sessions   │   │  Events Log  │   │ Visuals  │ │
│  └──────────────┘   └──────────────┘   └──────────────┘   └──────────┘ │
│  ┌──────────────┐   ┌──────────────┐                                   │
│  │ AI Insights  │   │  Analytics   │                                   │
│  └──────────────┘   └──────────────┘                                   │
└────────────────────────────────────────────────────────────────────────┘
```

## Monorepo Directory Ownership

| Directory | Layer | Description |
|-----------|-------|-------------|
| `apps/extension/` | Extension | Chrome Manifest V3 service worker, content scripts, popup |
| `apps/server/` | Backend | Express API, database connection, dashboard endpoints & AI engine |
| `apps/dashboard/` | Frontend | Web Dashboard built with React, Vite, Tailwind CSS, TanStack Query, Recharts |
| `packages/shared-types/` | Shared | Unified TypeScript API contracts and data models |
| `packages/shared-utils/` | Shared | Shared helper functions |
