# Research: Security Audit Remediation

**Feature**: 003-security-fixes
**Date**: 2026-01-20

## Research Tasks

### 1. MCP SDK Version Update

**Decision**: Update @modelcontextprotocol/sdk from ^0.4.0 to ^1.25.3

**Rationale**:
- Version 1.25.3 is the latest stable release
- Addresses GHSA-w48q-cv73-mx4w (DNS rebinding protection) fixed in 1.24.0
- Addresses GHSA-8r9q-7v3j-jr4g (ReDoS vulnerability) fixed in 1.25.2
- Major version bump (0.x to 1.x) indicates breaking changes may exist

**Alternatives Considered**:
- ^1.24.0: Would fix DNS rebinding but not ReDoS vulnerability
- ^1.25.2: Minimum required, but 1.25.3 includes additional fixes
- Stay at 0.4.0: Not acceptable due to known high-severity vulnerabilities

**Migration Notes**:
- MCP SDK 1.x has API changes from 0.x
- Review import paths and initialization patterns
- Test MCP server functionality after upgrade

### 2. Express Version Update

**Decision**: Update express from ^4.18.2 to ^4.21.2 (latest 4.x)

**Rationale**:
- Addresses GHSA-qwcr-r2fm-qrc7 (body-parser DoS) via transitive dependency update
- Maintains 4.x API compatibility (no breaking changes)
- Express 5.x is stable but would require more extensive testing

**Alternatives Considered**:
- Express 5.x (5.2.1): Major version with breaking changes, deferred for separate upgrade
- Stay at 4.18.2: Not acceptable due to body-parser vulnerability
- Patch body-parser directly: Would conflict with express's dependency management

**Migration Notes**:
- Run `npm update express` to get latest 4.x with patched transitive dependencies
- No code changes required for 4.x minor version update

### 3. Rate Limiting Middleware Selection

**Decision**: Use express-rate-limit v8.2.1

**Rationale**:
- Most popular Express rate limiting solution (3M+ weekly downloads)
- Built-in support for standard headers (RateLimit-*, X-RateLimit-*)
- In-memory store by default (appropriate for single-instance deployment)
- TypeScript support included
- Simple configuration API

**Alternatives Considered**:
- rate-limiter-flexible: More features but higher complexity than needed
- express-brute: Focused on brute-force protection, less general-purpose
- Custom implementation: Unnecessary when standard solution exists
- Nginx/load balancer rate limiting: Would require infrastructure changes

**Configuration Approach**:
```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute window
  max: 100,                       // 100 requests per window
  standardHeaders: true,          // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,           // Disable X-RateLimit-* headers
  message: {
    error: 'Too many requests',
    retryAfter: 'See Retry-After header'
  }
});
```

### 4. CI Security Scanning Approach

**Decision**: Add npm audit step to existing GitHub Actions workflow

**Rationale**:
- npm audit is built-in, no additional tools needed
- Can fail build on high/critical vulnerabilities
- Integrates naturally with existing npm ci workflow
- Zero additional cost or setup

**Alternatives Considered**:
- Snyk: More features but requires account setup and has usage limits
- GitHub CodeQL: SAST tool, different purpose (code analysis vs dependency scanning)
- OWASP Dependency-Check: More complex setup, Java-based
- npm audit in pre-commit hook: Would slow down local development

**Implementation**:
```yaml
- name: Security audit
  run: npm audit --audit-level=high
```

### 5. Automated Dependency Updates

**Decision**: Enable GitHub Dependabot

**Rationale**:
- Native GitHub integration, zero setup cost
- Creates PRs automatically for security updates
- Can be configured for schedule and grouping
- Well-established in the ecosystem

**Alternatives Considered**:
- Renovate Bot: More configurable but requires separate setup
- Manual monitoring: Error-prone and time-consuming
- Snyk automatic PRs: Requires paid plan for private repos

**Configuration**:
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    groups:
      security:
        applies-to: security-updates
```

### 6. Rate Limit Configuration Values

**Decision**: 100 requests per minute per IP, configurable via environment variables

**Rationale**:
- 100 req/min is standard for public APIs without authentication
- Environment variable configuration allows adjustment without code changes
- Matches SC-002 success criteria (100 req/sec capacity with rate limiting)

**Environment Variables**:
- `RATE_LIMIT_WINDOW_MS`: Window duration in milliseconds (default: 60000)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 100)
- `RATE_LIMIT_SKIP_IPS`: Comma-separated list of IPs to exempt (optional)

## Dependencies Summary

| Package | Current | Target | Breaking Changes |
|---------|---------|--------|------------------|
| @modelcontextprotocol/sdk | ^0.4.0 | ^1.25.3 | Yes (major version) |
| express | ^4.18.2 | ^4.21.2 | No |
| express-rate-limit | N/A | ^8.2.1 | N/A (new dependency) |
| @types/express-rate-limit | N/A | Not needed | Built-in TypeScript support |

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| MCP SDK major upgrade | Medium | Test MCP server functionality, review changelog |
| Express minor upgrade | Low | Standard patch process, run build |
| Add rate limiting | Low | New feature, doesn't change existing behavior |
| CI audit step | Low | Can use continue-on-error initially |
| Dependabot | Very Low | Only creates PRs, doesn't auto-merge |

## Open Questions Resolved

All research questions have been resolved. No NEEDS CLARIFICATION items remain.
