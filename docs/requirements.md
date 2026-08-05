# Requirements

## Functional Requirements

### FR-1: Detect Active Browser Tab

The extension must detect which tab is currently active and capture its URL and title.

### FR-2: Detect URL Changes

The extension must detect when the user navigates to a new URL within a tab.

### FR-3: Detect Page Loads

The extension must detect when a page finishes loading.

### FR-4: Track User Interactions

The extension must capture:

- **Click events** — element clicked, CSS selector, tag name, truncated text
- **Scroll events** — scroll depth as percentage
- **Form interactions** — field name, field type (never field values for privacy)

### FR-5: Track Time Spent on Pages

The extension must measure how long the user spends on each page before navigating away or switching tabs.

### FR-6: Send Events to Backend

The extension must send structured activity events to the backend API via `POST /api/events`.

### FR-7: Store Events in Database

The backend must persist all received events in MongoDB with proper indexing.

### FR-8: Visual Context Capture

The extension must capture browser visual context (screenshot or DOM snapshot) and associate it with activity events.

ASSUMPTION: Browser screen monitoring will be implemented using browser context capture and/or screenshot capture where supported by Chrome permissions.

## Non-Functional Requirements

### NFR-1: Reliable Event Delivery

Events must be buffered locally if the backend is unavailable and retried when connectivity is restored.

### NFR-2: Privacy

- No form field values are captured
- User consent is required for extension permissions
- Screenshots must be opt-in or clearly disclosed
- No data sent to third parties

### NFR-3: Performance

- Content scripts must not degrade page performance
- Events should be batched where possible
- DOM operations must be batched with `requestAnimationFrame`

### NFR-4: Extensibility

- Event pipeline must support adding new event types
- AI processing layer must be pluggable
- Shared types ensure consistent contracts

### NFR-5: Type Safety

- All code must be TypeScript with `strict: true`
- Shared interfaces define all data contracts
- No `any` types in production code
