# Project Overview

## Problem Statement

Users need a way to automatically track and record their browser activity for productivity analysis, usage monitoring, and AI-powered insights. Currently, there is no lightweight, privacy-conscious tool that captures browser interactions and stores them in a structured format for later analysis.

## Solution

The **Visual AI Browser Agent** is a Chrome Extension (Manifest V3) that silently monitors browser activity — including navigation, clicks, scrolls, form interactions, and visual context — and sends structured events to a backend API where they are stored in MongoDB.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Chrome Browser                             │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ Content      │───▶│ Background       │───▶│ Extension    │  │
│  │ Script       │    │ Service Worker   │    │ Popup UI     │  │
│  │ (DOM events) │    │ (event pipeline) │    │ (controls)   │  │
│  └──────────────┘    └────────┬─────────┘    └──────────────┘  │
│                               │                                 │
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTP POST /api/events
                                ▼
                    ┌──────────────────────┐
                    │   Express.js Server  │
                    │   (REST API)         │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   MongoDB            │
                    │   (events, sessions) │
                    └──────────────────────┘
```

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Extension | Manifest V3, TypeScript | Browser activity capture |
| Backend | Node.js, Express.js, TypeScript | Event ingestion API |
| Database | MongoDB, Mongoose | Persistent event storage |
| DevOps | Docker, Docker Compose | Local development environment |
| Shared | TypeScript interfaces | Type safety across layers |

## Scope

### In Scope (MVP)

- Chrome Extension that captures browser activity events
- Background service worker for event aggregation and delivery
- Content scripts for DOM-level interaction tracking
- REST API for event ingestion and retrieval
- MongoDB storage for events and sessions
- Visual context capture (screenshot or DOM snapshot)
- Extension popup for user controls

### Out of Scope (MVP)

- Cross-browser support (Firefox, Safari)
- User authentication/authorization
- Real-time dashboard with WebSockets
- Cloud deployment
- Mobile browser support

## Deliverables

1. Installable Chrome extension (.crx or unpacked)
2. Express.js backend API
3. MongoDB persistence layer
4. Docker Compose environment
5. Complete documentation
6. Full Git history with merge commits
