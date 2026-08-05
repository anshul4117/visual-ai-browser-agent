# Git Workflow

## Branch Strategy

### Main Branch

- `main` — production-ready code
- All features merge into `main`
- Never commit directly to `main` after initial setup

### Feature Branches

| Phase | Branch Name |
|-------|-------------|
| Phase 1 | `feat/extension-foundation` |
| Phase 2 | `feat/activity-tracking` |
| Phase 3 | `feat/backend-api` |
| Phase 4 | `feat/database` |
| Phase 5 | `feat/visual-context` |
| Phase 6 | `feat/ai-processing` |
| Phase 7 | `feat/dashboard` |
| Phase 8 | `feat/production-polish` |

### Branch Rules

- One feature per branch
- Branch from `main`
- Merge back into `main` when complete
- Delete branch after merge

## Commit Conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `chore` | Maintenance, tooling, config |
| `refactor` | Code change that doesn't fix or add |
| `test` | Adding or updating tests |
| `style` | Formatting, whitespace |

### Scopes

| Scope | Description |
|-------|-------------|
| `extension` | Chrome extension code |
| `server` | Backend server code |
| `shared-types` | Shared type definitions |
| `shared-utils` | Shared utilities |
| `docs` | Documentation |
| `docker` | Docker configuration |
| `ci` | CI/CD configuration |

### Examples

```
feat(extension): add content script for click tracking
fix(server): handle missing sessionId in event payload
docs: update architecture diagram with AI pipeline
chore(docker): add MongoDB health check
```

## Merge Policy

- **Merge commits only** — never squash, never rebase
- Use `git merge --no-ff` to always create a merge commit
- Merge commit message: `Merge branch 'feat/feature-name' into main`

## Pull Request Process

1. Create feature branch from `main`
2. Implement feature with atomic commits
3. Ensure all checks pass (typecheck, lint)
4. Create PR into `main`
5. Review and merge with merge commit
6. Delete feature branch

## Release Process

Releases are tagged on `main`:

```bash
git tag -a v1.0.0 -m "Release v1.0.0: MVP"
git push origin v1.0.0
```

### Version Format

`v<major>.<minor>.<patch>`

- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes
