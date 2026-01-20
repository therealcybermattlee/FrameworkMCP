# Quickstart: Security Audit Remediation

**Feature**: 003-security-fixes
**Branch**: `003-security-fixes`

## Prerequisites

- Node.js 20.x
- npm 10.x
- Git
- GitHub repository access (for Dependabot configuration)

## Quick Implementation Guide

### Step 1: Update Dependencies (P1 - Critical)

```bash
# Update MCP SDK to fix DNS rebinding and ReDoS vulnerabilities
npm install @modelcontextprotocol/sdk@^1.25.3

# Update Express to fix body-parser DoS vulnerability
npm update express

# Add rate limiting middleware
npm install express-rate-limit

# Verify no high/critical vulnerabilities remain
npm audit
```

**Expected Output**: `found 0 vulnerabilities` or only low/moderate issues

### Step 2: Add Rate Limiting (P2 - High)

Add to `src/interfaces/http/http-server.ts`:

```typescript
import rateLimit from 'express-rate-limit';

// In setupMiddleware():
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    retryAfter: 'See Retry-After header',
    timestamp: new Date().toISOString()
  },
  handler: (req, res, next, options) => {
    console.log(`[Rate Limit] IP ${req.ip} exceeded limit`);
    res.status(429).json(options.message);
  }
});

this.app.use(limiter);
```

**Test**:
```bash
# Start server
npm run dev:http

# Test rate limiting (in another terminal)
for i in {1..110}; do curl -s http://localhost:8080/health; done | tail -5
# Should see 429 responses after 100 requests
```

### Step 3: Add CI Security Scanning (P3 - Medium)

Add to `.github/workflows/ci.yml` (new job):

```yaml
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    - run: npm ci
    - name: Security audit
      run: npm audit --audit-level=high
```

Update `publish` job to depend on both `test` and `security`:
```yaml
publish:
  needs: [test, security]
```

### Step 4: Enable Dependabot (P4 - Low)

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      security-updates:
        applies-to: security-updates

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

## Verification Checklist

| Step | Command | Expected Result |
|------|---------|-----------------|
| Dependencies | `npm audit` | 0 high/critical vulnerabilities |
| Build | `npm run build` | No TypeScript errors |
| Rate Limiting | `curl -I http://localhost:8080/health` | RateLimit-* headers present |
| CI (local test) | `npm audit --audit-level=high` | Exit code 0 |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window (1 minute) |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |
| `RATE_LIMIT_SKIP_IPS` | "" | Comma-separated exempt IPs |

## Rollback Plan

If issues occur:

1. **Rate limiting issues**: Set `RATE_LIMIT_MAX=10000` to effectively disable
2. **MCP SDK breaking changes**: Revert to `@modelcontextprotocol/sdk@^0.4.0` (temporary, vulnerable)
3. **CI failures**: Add `continue-on-error: true` to security job (temporary)

## Success Criteria Verification

- [ ] `npm audit` shows 0 high/critical vulnerabilities (SC-001)
- [ ] 100+ requests in 60s triggers 429 response (SC-002)
- [ ] CI pipeline fails with vulnerable dependency (SC-003)
- [ ] Rate limit rejection responds in <100ms (SC-004)
- [ ] All existing API endpoints work identically (SC-005)
- [ ] Dependabot creates PR for test vulnerability (SC-006)
