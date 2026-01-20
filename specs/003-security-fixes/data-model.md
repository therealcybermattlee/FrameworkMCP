# Data Model: Security Audit Remediation

**Feature**: 003-security-fixes
**Date**: 2026-01-20

## Overview

This feature introduces rate limiting state management. No persistent data storage is added - rate limiting uses in-memory storage appropriate for single-instance deployment.

## Entities

### RateLimitState (In-Memory)

Tracks request counts per client within sliding time windows.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| clientKey | string | Client identifier (IP address) | IPv4 or IPv6 format |
| requestCount | number | Requests in current window | >= 0 |
| windowStart | timestamp | Window start time | Valid timestamp |
| windowMs | number | Window duration (ms) | > 0, default 60000 |
| maxRequests | number | Max requests per window | > 0, default 100 |

**Notes**:
- Managed internally by express-rate-limit middleware
- Not directly accessible via API
- Cleared on server restart (acceptable for single-instance)

### RateLimitResponse

Response returned when rate limit is exceeded.

| Field | Type | Description |
|-------|------|-------------|
| error | string | Error message ("Too many requests") |
| retryAfter | number | Seconds until rate limit resets |
| timestamp | string | ISO 8601 timestamp |

### RateLimitHeaders

Standard headers included in all responses.

| Header | Type | Description |
|--------|------|-------------|
| RateLimit-Limit | number | Maximum requests per window |
| RateLimit-Remaining | number | Requests remaining in current window |
| RateLimit-Reset | number | Unix timestamp when window resets |
| Retry-After | number | (429 only) Seconds until retry allowed |

## State Transitions

### Request Lifecycle with Rate Limiting

```
[Request Received]
       │
       ▼
[Extract Client IP]
       │
       ▼
[Check Rate Limit State]
       │
       ├── Under Limit ──► [Increment Counter] ──► [Process Request] ──► [200 OK + Rate Headers]
       │
       └── Over Limit ───► [429 Too Many Requests + Retry-After]
```

### Rate Limit Window Reset

```
[Window Expires]
       │
       ▼
[Reset Counter to 0]
       │
       ▼
[Start New Window]
```

## Configuration Entity

Environment variable configuration for rate limiting.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| RATE_LIMIT_WINDOW_MS | number | 60000 | Window duration in milliseconds |
| RATE_LIMIT_MAX | number | 100 | Maximum requests per window |
| RATE_LIMIT_SKIP_IPS | string | "" | Comma-separated IPs to exempt |

## Relationships

```
┌─────────────────┐
│     Client      │
│    (by IP)      │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐
│ RateLimitState  │
│  (in-memory)    │
└────────┬────────┘
         │ triggers
         ▼
┌─────────────────┐     ┌─────────────────┐
│ RateLimitHeaders│◄────│ RateLimitResponse│
│ (all responses) │     │   (429 only)     │
└─────────────────┘     └─────────────────┘
```

## Existing Entities (Unchanged)

The following existing entities are not modified by this feature:

- **SafeguardElement**: CIS Controls safeguard data
- **CacheEntry**: Internal cache for safeguard lookups
- **ErrorResponse**: Existing error response format (rate limit errors follow same pattern)

## Migration Notes

- No database migrations required
- No data persistence changes
- Rate limit state is ephemeral (cleared on restart)
- Backward compatible with existing API responses
