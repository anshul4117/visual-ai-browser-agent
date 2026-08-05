# Database Schema

## MongoDB Database

**Database name:** `visual-ai-browser-agent`

## Collections

### events

Stores individual browser activity events.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB document ID |
| `sessionId` | string | Yes | Links event to a browsing session |
| `userId` | string | No | Optional user identifier |
| `url` | string | Yes | URL where the event occurred |
| `title` | string | Yes | Page title at time of event |
| `eventType` | string | Yes | Event type (see enum below) |
| `timestamp` | Date | Yes | When the event occurred |
| `metadata` | object | Yes | Event-specific data (see below) |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**eventType enum:**

- `page_load`
- `url_change`
- `tab_switch`
- `click`
- `scroll`
- `form_interaction`
- `time_on_page`

**metadata fields (vary by eventType):**

| Field | Used By | Type | Description |
|-------|---------|------|-------------|
| `selector` | click, form_interaction | string | CSS selector of element |
| `tagName` | click, form_interaction | string | HTML tag name |
| `innerText` | click | string | Truncated element text |
| `scrollPercentage` | scroll | number | Scroll depth (0-100) |
| `duration` | time_on_page | number | Time in milliseconds |
| `previousUrl` | url_change | string | URL before navigation |
| `previousTabId` | tab_switch | number | Tab ID before switch |
| `fieldName` | form_interaction | string | Form field name attribute |
| `fieldType` | form_interaction | string | Form field input type |

**Indexes:**

```
{ sessionId: 1 }
{ timestamp: -1 }
{ eventType: 1 }
{ url: 1 }
{ sessionId: 1, timestamp: -1 }  // compound index
```

---

### sessions

Stores browsing session records.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Auto | MongoDB document ID |
| `sessionId` | string | Yes | Unique session identifier |
| `startedAt` | Date | Yes | Session start time |
| `endedAt` | Date | No | Session end time (null if active) |
| `duration` | number | No | Duration in milliseconds |
| `createdAt` | Date | Auto | Mongoose timestamp |
| `updatedAt` | Date | Auto | Mongoose timestamp |

**Indexes:**

```
{ sessionId: 1 }  // unique
{ startedAt: -1 }
```

## Rules

- Do **not** add fields to these collections without updating this document first
- All field names use camelCase
- Timestamps are stored as native MongoDB Date objects
- The `metadata` field is schemaless but its known subfields are documented above
