# AGENT.md

## Project

Visual AI Browser Agent

## Objective

Build a Chrome Extension (Manifest V3) that monitors browser activity and browser visual context, sends structured events to a backend API, and stores them in MongoDB.

## Source Requirement

Original assignment:

> "Build a Visual AI agent (Chrome browser plugin/Chrome) to monitor browser screen. Imagine a user installs your visual AI agent and the agent can track all the user activities and post into a database."

## Current Phase

Phase 5 — Extension → Backend Integration (Complete)

## Architecture Constraints

- Chrome Extension (Manifest V3)
- TypeScript (strict mode)
- Node.js + Express backend
- MongoDB database
- Docker for local development
- Monorepo structure (npm workspaces)
- Shared types package between extension and server

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
├── .github/                # GitHub workflows and templates
├── docker-compose.yml      # MongoDB service
├── package.json            # Root monorepo config
├── tsconfig.base.json      # Base TypeScript config
├── README.md
└── AGENT.md                # This file
```

## Git Rules

- Never squash commits
- Use feature branches (`feat/<name>`)
- Merge into `main` with merge commits only
- Keep full history
- Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)

## Coding Standards

- TypeScript strict mode (`strict: true`)
- `async`/`await` only — no `.then()` chains
- Small focused modules
- Explicit interfaces for all data structures
- No undocumented database fields
- No inline scripts in extension HTML
- Service worker must not store state in global variables — use `chrome.storage`

## Anti-Hallucination Rules

Do not invent:

1. Chrome APIs that do not exist
2. Chrome permissions that do not exist
3. Database fields not documented in `docs/database.md`
4. API endpoints not documented in `docs/api-spec.md`
5. AI features not explicitly approved
6. Backend routes not in the roadmap

If something is unclear, create an `ASSUMPTION:` annotation in the relevant doc before implementing.

## Definition of Done

A task is complete only if:

- Code builds without errors
- TypeScript type-checking passes (`tsc --noEmit`)
- Documentation is updated to reflect changes
- Git history is preserved (no squash, no force push)
- Changes match what is documented in the roadmap

## Key Documentation

- [Project Overview](docs/project-overview.md)
- [Requirements](docs/requirements.md)
- [Architecture](docs/architecture.md)
- [API Spec](docs/api-spec.md)
- [Database](docs/database.md)
- [Git Workflow](docs/git-workflow.md)
- [Roadmap](docs/roadmap.md)
- [Agent Context](docs/agent-context.md)
- [Task Board](docs/task-board.md)
