# Tasks: Security Audit Remediation

**Feature**: 003-security-fixes
**Generated**: 2026-01-20
**Status**: Ready for implementation

## Task Overview

| Phase | Tasks | Priority |
|-------|-------|----------|
| Setup | 2 | P1 |
| Core | 4 | P1-P2 |
| CI/CD | 2 | P3-P4 |
| Validation | 2 | Final |

---

## Phase 1: Setup

### TASK-001: Update vulnerable dependencies
**Priority**: P1 (Critical)
**Files**: `package.json`, `package-lock.json`
**Dependencies**: None

**Description**:
Update @modelcontextprotocol/sdk from ^0.4.0 to ^1.25.3 to fix DNS rebinding and ReDoS vulnerabilities. Update express to latest 4.x to fix body-parser DoS vulnerability.

**Acceptance Criteria**:
- [ ] @modelcontextprotocol/sdk updated to ^1.25.3
- [ ] express updated to latest 4.x
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] `npm run build` succeeds

---

### TASK-002: Install rate limiting dependency
**Priority**: P1 (Critical)
**Files**: `package.json`, `package-lock.json`
**Dependencies**: TASK-001

**Description**:
Install express-rate-limit package for HTTP API rate limiting.

**Acceptance Criteria**:
- [ ] express-rate-limit ^8.x installed
- [ ] @types/express still compatible
- [ ] `npm run build` succeeds

---

## Phase 2: Core Implementation

### TASK-003: Add rate limit types
**Priority**: P2 (High)
**Files**: `src/shared/types.ts`
**Dependencies**: TASK-002

**Description**:
Add TypeScript type definitions for rate limit configuration and response.

**Acceptance Criteria**:
- [ ] RateLimitConfig interface defined
- [ ] RateLimitErrorResponse interface defined
- [ ] Types exported from shared/types.ts

---

### TASK-004: Implement rate limiting middleware
**Priority**: P2 (High)
**Files**: `src/interfaces/http/http-server.ts`
**Dependencies**: TASK-002, TASK-003

**Description**:
Add rate limiting middleware to the HTTP server with configurable limits via environment variables.

**Acceptance Criteria**:
- [ ] Rate limiter imported and configured
- [ ] Middleware applied to all routes
- [ ] Environment variables supported (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX)
- [ ] Standard headers enabled (RateLimit-*)
- [ ] Rate limit violations logged
- [ ] 429 response with proper error format

---

### TASK-005: Update version numbers
**Priority**: P2 (High)
**Files**: `src/interfaces/http/http-server.ts`, `src/interfaces/mcp/mcp-server.ts`, `package.json`
**Dependencies**: TASK-004

**Description**:
Update version numbers to 2.2.0 to reflect security improvements.

**Acceptance Criteria**:
- [ ] package.json version updated to 2.2.0
- [ ] HTTP server version string updated
- [ ] MCP server version string updated

---

### TASK-006: Verify backward compatibility
**Priority**: P2 (High)
**Files**: None (testing only)
**Dependencies**: TASK-004, TASK-005

**Description**:
Build and test that all existing API endpoints work correctly after changes.

**Acceptance Criteria**:
- [ ] `npm run build` succeeds with no errors
- [ ] HTTP server starts without errors
- [ ] /health endpoint returns expected response
- [ ] /api/safeguards endpoint returns list
- [ ] /api/safeguards/1.1 endpoint returns details

---

## Phase 3: CI/CD Configuration

### TASK-007: Add security audit to CI pipeline
**Priority**: P3 (Medium)
**Files**: `.github/workflows/ci.yml`
**Dependencies**: TASK-001

**Description**:
Add npm audit step to GitHub Actions CI workflow that fails on high/critical vulnerabilities.

**Acceptance Criteria**:
- [ ] Security job added to ci.yml
- [ ] Job runs npm audit --audit-level=high
- [ ] Publish job depends on security job
- [ ] Workflow syntax is valid

---

### TASK-008: Configure Dependabot
**Priority**: P4 (Low)
**Files**: `.github/dependabot.yml`
**Dependencies**: None [P]

**Description**:
Create Dependabot configuration for automated dependency updates.

**Acceptance Criteria**:
- [ ] dependabot.yml created in .github/
- [ ] npm ecosystem configured with weekly schedule
- [ ] GitHub Actions ecosystem configured
- [ ] Security updates grouped together

---

## Phase 4: Validation

### TASK-009: Run security audit verification
**Priority**: Final
**Files**: None (testing only)
**Dependencies**: TASK-001 through TASK-008

**Description**:
Run npm audit and verify all high/critical vulnerabilities are resolved.

**Acceptance Criteria**:
- [ ] `npm audit` shows 0 high severity vulnerabilities
- [ ] `npm audit` shows 0 critical severity vulnerabilities
- [ ] Build completes successfully

---

### TASK-010: Test rate limiting functionality
**Priority**: Final
**Files**: None (testing only)
**Dependencies**: TASK-004, TASK-006

**Description**:
Manually test rate limiting by sending requests and verifying 429 responses.

**Acceptance Criteria**:
- [ ] Requests within limit return 200 with RateLimit-* headers
- [ ] Requests exceeding limit return 429
- [ ] 429 response includes Retry-After header
- [ ] Rate limit resets after window expires

---

## Execution Order

```
TASK-001 (deps) ─┬─► TASK-002 (rate-limit pkg) ─► TASK-003 (types) ─► TASK-004 (middleware)
                 │                                                              │
                 └─► TASK-007 (CI audit) ─────────────────────────────────────►├─► TASK-005 (version)
                                                                                │        │
TASK-008 (dependabot) [P] ─────────────────────────────────────────────────────►├────────┘
                                                                                │
                                                                                ▼
                                                                         TASK-006 (compat)
                                                                                │
                                                                                ▼
                                                                    TASK-009 & TASK-010 (validation)
```

**Legend**: [P] = Can run in parallel with other tasks
