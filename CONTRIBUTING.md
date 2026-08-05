# Contributing to Visual AI Browser Agent

Thank you for your interest in contributing to Visual AI Browser Agent! We welcome pull requests, bug reports, feature suggestions, and documentation improvements.

## Development Workflow

### 1. Monorepo Setup

This repository uses **npm workspaces** and **TypeScript strict mode**.

```bash
# Clone repository
git clone https://github.com/anshul4117/visual-ai-browser-agent.git
cd visual-ai-browser-agent

# Install dependencies
npm install

# Build shared types
npm run build --workspace=packages/shared-types
```

### 2. Running Services Locally

```bash
# Terminal 1: Start MongoDB
docker-compose up -d

# Terminal 2: Start Express API Server (Dev mode)
npm run dev --workspace=apps/server

# Terminal 3: Build Chrome Extension
npm run build --workspace=apps/extension
```

### 3. Git Rules & Commit Standards

- Always create feature branches: `feat/<description>`, `fix/<description>`, `docs/<description>`.
- Use **Conventional Commits**:
  - `feat(extension): add screenshot capture throttling`
  - `fix(server): handle null database fallback gracefully`
  - `docs(api): update OpenAPI spec`
- Maintain clean Git history: **Merge commits only (`git merge --no-ff`), never squash or force push.**

### 4. Code Quality & Verification

Before submitting a Pull Request, make sure all typechecks and builds pass:

```bash
# Typecheck all workspaces
npm run typecheck --workspaces

# Build extension and server
npm run build --workspaces
```
