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

---

### screenshots

Stores visual context screenshot metadata. Model: `ScreenshotModel` (`apps/server/src/models/screenshot.model.ts`).

| Field | Mongoose Type | Required | Description |
|-------|--------------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB document ID |
| `screenshotId` | String | Yes | Unique screenshot identifier (unique index) |
| `sessionId` | String | Yes | Unique session identifier (indexed) |
| `eventId` | String | No | Optional ID of associated activity event |
| `url` | String | Yes | Tab URL when capture occurred |
| `title` | String | Yes | Tab title when capture occurred |
| `capturedAt` | Date | Yes | ISO 8601 capture timestamp (indexed) |
| `filePath` | String | Yes | Local file relative path (e.g. `/uploads/scr_123.png`) |
| `width` | Number | No | Image width in pixels |
| `height` | Number | No | Image height in pixels |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**Indexes:**

```javascript
{ screenshotId: 1 } // unique index
{ sessionId: 1, capturedAt: -1 } // compound index for session visual timeline
```

---

### screenshot_analyses

Stores structured AI Vision model analysis results for screenshots. Model: `ScreenshotAnalysisModel` (`apps/server/src/models/screenshot-analysis.model.ts`).

| Field | Mongoose Type | Required | Description |
|-------|--------------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB document ID |
| `screenshotId` | String | Yes | Links analysis to target screenshot (unique index) |
| `sessionId` | String | Yes | Session ID (indexed) |
| `summary` | String | Yes | 1-2 sentence AI summary of browser activity |
| `category` | String | Yes | Activity classification category (indexed) |
| `productivityScore` | Number | Yes | Productivity score (0 - 100) |
| `entities` | [String] | Yes | Recognized visible entities/tech stack names |
| `confidence` | Number | Yes | Model confidence score (0.0 - 1.0) |
| `analyzedAt` | Date | Yes | Timestamp when analysis occurred (indexed) |
| `model` | String | Yes | Model identifier (e.g., `gemini-2.5-flash`) |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**Indexes:**

```javascript
{ screenshotId: 1 } // unique index
{ category: 1 }     // index for category filtering
{ sessionId: 1, analyzedAt: -1 } // compound index for session analysis timeline
```

## Rules

- All field names use `camelCase`
- Timestamps are stored as native MongoDB `Date` objects
- Raw screenshot binaries are stored under `apps/server/uploads/` and served via static route `/uploads/`
