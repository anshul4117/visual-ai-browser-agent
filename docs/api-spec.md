# API Specification

## Base URL

```
http://localhost:3000/api
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health & uptime check |
| `POST` | `/api/events` | Record a single activity event |
| `POST` | `/api/events/batch` | Record a batch of activity events |
| `GET` | `/api/events` | Query events with filters and pagination |
| `GET` | `/api/events/:sessionId` | Get events for a specific session ID |

---

### GET /api/health

Health check endpoint.

**Request:** None

**Success Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2026-08-05T21:30:00.000Z",
  "uptime": 3600
}
```

---

### POST /api/events

Create a new single activity event.

**Request Body:**

```json
{
  "sessionId": "vai_m1abc123_x7y8z9",
  "url": "https://example.com/page",
  "title": "Example Page",
  "eventType": "click",
  "timestamp": "2026-08-05T21:30:00.000Z",
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
| `eventType` | string | Yes | Event type string (`click`, `page_load`, `scroll`, `tab_switch`, etc.) |
| `timestamp` | string | Yes | ISO 8601 timestamp string |
| `metadata` | object | No | Event-specific metadata (defaults to `{}`) |

**Success Response (201 Created):**

```json
{
  "success": true
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Missing or invalid required field: sessionId"
}
```

---

### POST /api/events/batch

Create a batch of activity events in a single request.

**Request Body:**

```json
[
  {
    "sessionId": "vai_m1abc123_x7y8z9",
    "url": "https://example.com/home",
    "title": "Home",
    "eventType": "page_load",
    "timestamp": "2026-08-05T21:31:00.000Z",
    "metadata": {}
  },
  {
    "sessionId": "vai_m1abc123_x7y8z9",
    "url": "https://example.com/home",
    "title": "Home",
    "eventType": "scroll",
    "timestamp": "2026-08-05T21:31:05.000Z",
    "metadata": { "scrollPercentage": 50 }
  }
]
```

*Note: The body can also be an object containing an `"events"` array: `{ "events": [...] }`.*

**Success Response (201 Created):**

```json
{
  "success": true,
  "count": 2
}
```

---

### GET /api/events

Retrieve stored activity events with query parameters filtering.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | No | Filter by session ID |
| `eventType` | string | No | Filter by event type |
| `url` | string | No | Filter by URL (partial case-insensitive match) |
| `from` | string | No | Filter events after timestamp (ISO 8601) |
| `to` | string | No | Filter events before timestamp (ISO 8601) |
| `limit` | number | No | Max results (default: 100, max: 1000) |
| `offset` | number | No | Pagination offset (default: 0) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "vai_m1abc123_x7y8z9",
      "url": "https://example.com/page",
      "title": "Example Page",
      "eventType": "click",
      "timestamp": "2026-08-05T21:30:00.000Z",
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

### GET /api/events/:sessionId

Retrieve events for a specific session ID.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | No | Max results (default: 100, max: 1000) |
| `offset` | number | No | Pagination offset (default: 0) |

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "sessionId": "vai_m1abc123_x7y8z9",
      "url": "https://example.com/page",
      "title": "Example Page",
      "eventType": "click",
      "timestamp": "2026-08-05T21:30:00.000Z",
      "metadata": {}
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```
