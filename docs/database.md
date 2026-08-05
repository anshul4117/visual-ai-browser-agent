# Database Schema

## MongoDB Database

**Database name:** `visual-ai-browser-agent`

## Collections & Mongoose Models

### events

Stores individual browser activity events. Model: `EventModel` (`apps/server/src/models/event.model.ts`).

| Field | Mongoose Type | Required | Description |
|-------|--------------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB document ID |
| `sessionId` | String | Yes | Links event to a browsing session (indexed) |
| `userId` | String | No | Optional user identifier |
| `url` | String | Yes | URL where the event occurred (indexed) |
| `title` | String | Yes | Page title at time of event |
| `eventType` | String | Yes | Event type (indexed) |
| `timestamp` | Date | Yes | When the event occurred (indexed) |
| `metadata` | Schema.Types.Mixed | Yes | Event-specific data object (defaults to `{}`) |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**eventType enum values:**

- `session_started`
- `page_load`
- `url_change`
- `tab_switch`
- `click`
- `scroll`
- `form_interaction`
- `visibility_changed`
- `time_on_page`

**metadata fields (vary by eventType):**

| Field | Used By | Type | Description |
|-------|---------|------|-------------|
| `selector` | click, form_interaction | string | CSS selector of element |
| `tagName` | click, form_interaction | string | HTML tag name |
| `innerText` | click | string | Truncated element text |
| `scrollPercentage` | scroll | number | Scroll depth (0-100) |
| `visibilityState` | visibility_changed | string | Document visibility state (`visible`, `hidden`) |
| `duration` | time_on_page | number | Time in milliseconds |
| `previousUrl` | url_change | string | URL before navigation |
| `previousTabId` | tab_switch | number | Tab ID before switch |

**Indexes:**

```javascript
{ sessionId: 1 }
{ timestamp: -1 }
{ eventType: 1 }
{ url: 1 }
{ sessionId: 1, timestamp: -1 }  // compound index for session event timeline
```

---

### sessions

Stores browsing session records. Model: `SessionModel` (`apps/server/src/models/session.model.ts`).

| Field | Mongoose Type | Required | Description |
|-------|--------------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB document ID |
| `sessionId` | String | Yes | Unique session identifier (unique index) |
| `startedAt` | Date | Yes | Session start time (indexed) |
| `endedAt` | Date | No | Session end time (null if active) |
| `eventCount` | Number | Yes | Total number of recorded events in session (default 0) |
| `lastSeenAt` | Date | Yes | Timestamp of most recent event in session |
| `duration` | Number | No | Session duration in milliseconds (default 0) |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**Indexes:**

```javascript
{ sessionId: 1 }  // unique index
{ startedAt: -1 } // index for recent session queries
```

## Rules

- All field names use `camelCase`
- Timestamps are stored as native MongoDB `Date` objects
- The `metadata` field is schemaless (`Schema.Types.Mixed`) to accommodate custom event payloads
- Sessions are automatically created or updated via `$setOnInsert`, `$set`, `$inc` during event ingestion
