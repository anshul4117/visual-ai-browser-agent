# API Specification

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### POST /api/events

Create a new activity event.

**Request Body:**

```json
{
  "sessionId": "vai_m1abc123_x7y8z9",
  "url": "https://example.com/page",
  "title": "Example Page",
  "eventType": "click",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "selector": "#submit-btn",
    "tagName": "BUTTON",
    "innerText": "Submit"
  }
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | Yes | Unique session identifier |
| `url` | string | Yes | URL where the event occurred |
| `title` | string | Yes | Page title |
| `eventType` | string | Yes | One of: `page_load`, `url_change`, `tab_switch`, `click`, `scroll`, `form_interaction`, `time_on_page` |
| `timestamp` | string | Yes | ISO 8601 timestamp |
| `metadata` | object | Yes | Event-specific metadata (can be empty `{}`) |

**Success Response (201):**

```json
{
  "success": true
}
```

**Error Response (400):**

```json
{
  "success": false,
  "error": "Invalid eventType: unknown_event"
}
```

---

### GET /api/events

Retrieve stored activity events.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | No | Filter by session |
| `eventType` | string | No | Filter by event type |
| `url` | string | No | Filter by URL (partial match) |
| `from` | string | No | Start timestamp (ISO 8601) |
| `to` | string | No | End timestamp (ISO 8601) |
| `limit` | number | No | Max results (default: 100, max: 1000) |
| `offset` | number | No | Pagination offset (default: 0) |

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "vai_m1abc123_x7y8z9",
      "url": "https://example.com/page",
      "title": "Example Page",
      "eventType": "click",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "metadata": {
        "selector": "#submit-btn",
        "tagName": "BUTTON",
        "innerText": "Submit"
      }
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

---

### GET /api/health

Health check endpoint.

**Success Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600
}
```

**Error Response (503):**

```json
{
  "status": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 0
}
```
