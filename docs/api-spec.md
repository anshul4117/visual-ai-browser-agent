# API Specification

## Base URL

```
http://localhost:3000/api
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health, MongoDB status, queue metrics, & version |
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
| `GET` | `/api/dashboard/overview` | Dashboard summary metrics, hourly chart data, & categories |
| `GET` | `/api/dashboard/sessions` | List of browsing sessions with duration & event count |
| `GET` | `/api/dashboard/events` | Paginated event telemetry table with filters |
| `GET` | `/api/dashboard/screenshots` | Paginated screenshot gallery with populated AI vision analysis |
| `GET` | `/api/dashboard/analytics` | Telemetry analytics (productivity trend, top domains, session duration) |

---

### GET /api/dashboard/overview

Returns aggregated high-level statistics for the Web Dashboard overview page.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalSessions": 12,
    "totalEvents": 482,
    "totalScreenshots": 34,
    "totalAnalyses": 34,
    "activeSyncStatus": true,
    "databaseStatus": "connected",
    "aiProviderStatus": "gemini-2.5-flash",
    "averageProductivityScore": 88,
    "eventsPerHour": [
      { "hour": "10:00", "count": 45 },
      { "hour": "11:00", "count": 82 }
    ],
    "topCategories": [
      { "category": "Development", "count": 22, "percentage": 65 },
      { "category": "Documentation", "count": 8, "percentage": 25 }
    ]
  }
}
```

---

### GET /api/dashboard/analytics

Returns analytics visualization datasets for Recharts graphs.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "productivityTrend": [
      { "timestamp": "10:00 AM", "score": 85, "category": "Development" }
    ],
    "categoryDistribution": [
      { "category": "Development", "count": 45, "percentage": 55 }
    ],
    "topVisitedDomains": [
      { "domain": "github.com", "count": 142 }
    ],
    "sessionDurationDistribution": [
      { "range": "5-15 mins", "count": 14 }
    ],
    "screenshotFrequency": [
      { "time": "10:00", "count": 4 }
    ]
  }
}
```
