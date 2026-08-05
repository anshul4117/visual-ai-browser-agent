# Visual AI Browser Agent

A Chrome Extension (Manifest V3) that monitors browser activity and visual context, sends structured events to a backend API, and stores them in MongoDB.

## Problem

Build a Visual AI agent as a Chrome browser plugin that tracks all user activities and posts them into a database.

## MVP Scope

- **Chrome Extension** — Manifest V3 with content scripts and service worker
- **Browser Activity Tracking** — URL changes, tab switches, clicks, scrolls, form interactions
- **Event Pipeline** — Structured activity events sent to backend
- **Backend API** — Express.js REST API for event ingestion and retrieval
- **MongoDB Storage** — Persistent event and session storage
- **Visual Context** — Browser screenshot/DOM snapshot capture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Manifest V3, TypeScript, Chrome APIs |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB, Mongoose |
| DevOps | Docker, Docker Compose |

## Repository Structure

```
visual-ai-browser-agent/
├── apps/
│   ├── extension/          # Chrome Extension (Manifest V3)
│   └── server/             # Express.js backend API
├── packages/
│   ├── shared-types/       # Shared TypeScript interfaces
│   └── shared-utils/       # Shared utility functions
├── docs/                   # Project documentation
├── docker-compose.yml      # MongoDB service
└── AGENT.md                # AI agent context
```

## Quick Start

### Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- Google Chrome

### Setup

```bash
# Clone and install
git clone <repo-url>
cd visual-ai-browser-agent
npm install

# Start MongoDB
docker compose up -d

# Type-check
npm run typecheck
```

### Load Extension (Development)

1. Build the extension: `cd apps/extension && npm run build`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `apps/extension/dist`

### Start Backend

```bash
cd apps/server
npm run dev
```

## Documentation

- [Project Overview](docs/project-overview.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [API Specification](docs/api-spec.md)
- [Database Schema](docs/database.md)
- [Git Workflow](docs/git-workflow.md)
- [Roadmap](docs/roadmap.md)

## Git Workflow

- Feature branches: `feat/<feature-name>`
- Merge commits only (no squash)
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- See [Git Workflow](docs/git-workflow.md) for details

## License

ISC
