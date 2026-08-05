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
| `POST` | `/api/screenshots` | Upload screenshot image & metadata |
| `GET` | `/api/screenshots` | Query screenshots by sessionId |
| `GET` | `/api/screenshots/latest` | Get latest recorded screenshot |
| `GET` | `/api/analysis/:screenshotId` | Get AI vision analysis for a screenshot |
| `GET` | `/api/analysis/session/:sessionId` | Get AI vision analyses for a session |
| `POST` | `/api/analysis/trigger/:screenshotId` | Explicitly trigger AI analysis for a screenshot |

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

---

### POST /api/screenshots

Upload a visual context screenshot image.

**Request Body:**

```json
{
  "screenshotId": "scr_m1abc123_z9y8x7",
  "sessionId": "vai_m1abc123_x7y8z9",
  "eventId": "evt_123",
  "url": "https://example.com/page",
  "title": "Example Page",
  "capturedAt": "2026-08-05T21:30:00.000Z",
  "dataUrl": "data:image/png;base64,...",
  "width": 1280,
  "height": 720
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "screenshotId": "scr_m1abc123_z9y8x7",
  "filePath": "/uploads/scr_m1abc123_z9y8x7.png"
}
```

---

### GET /api/analysis/:screenshotId

Retrieve AI Vision analysis for a specific screenshot.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "screenshotId": "scr_m1abc123_z9y8x7",
    "sessionId": "vai_m1abc123_x7y8z9",
    "summary": "User is actively developing code on GitHub.",
    "category": "Development",
    "productivityScore": 95,
    "entities": ["GitHub", "TypeScript", "Repository"],
    "confidence": 0.95,
    "analyzedAt": "2026-08-05T21:30:05.000Z",
    "model": "gemini-2.5-flash"
  }
}
```

---

### GET /api/analysis/session/:sessionId

Retrieve all AI Vision analyses for a session.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "screenshotId": "scr_m1abc123_z9y8x7",
      "sessionId": "vai_m1abc123_x7y8z9",
      "summary": "User is actively developing code on GitHub.",
      "category": "Development",
      "productivityScore": 95,
      "entities": ["GitHub", "TypeScript"],
      "confidence": 0.95,
      "analyzedAt": "2026-08-05T21:30:05.000Z",
      "model": "gemini-2.5-flash"
    }
  ],
  "total": 1
}
```
