# Implementation Plan: Security Audit Remediation

**Branch**: `003-security-fixes` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-security-fixes/spec.md`

## Summary

Implement security audit remediation including: (1) updating vulnerable dependencies (@modelcontextprotocol/sdk, express/body-parser), (2) adding rate limiting middleware to the HTTP API, (3) adding npm audit to CI pipeline, and (4) enabling Dependabot for automated security updates. All changes maintain backward compatibility with existing API functionality.

## Technical Context

**Language/Version**: TypeScript 5.0+ / Node.js 20.x (ES2020 modules)
**Primary Dependencies**: Express 4.18.2, @modelcontextprotocol/sdk 0.4.0, Helmet 8.1.0, compression, cors
**Storage**: In-memory (no database) - rate limiting will use in-memory storage
**Testing**: No test framework currently configured (npm test --if-present)
**Target Platform**: Linux server (DigitalOcean App Services), npm package
**Project Type**: Single project (HTTP API + MCP server)
**Performance Goals**: <100ms response for rate-limited rejections, 100 req/sec per client sustained
**Constraints**: Backward compatible with existing API, single-instance deployment (in-memory rate limiting acceptable)
**Scale/Scope**: Read-only API serving 153 CIS safeguards, single-instance deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template has not been customized for this project. Applying general best practices:

| Gate | Status | Notes |
|------|--------|-------|
| Library-First | ✅ Pass | Changes are to existing modules, no new libraries needed |
| CLI Interface | ✅ Pass | Existing CLI preserved, rate limiting is server-side only |
| Test-First | ⚠️ N/A | No test framework configured; will add tests for rate limiting |
| Simplicity | ✅ Pass | Using established express-rate-limit pattern, minimal changes |
| Security | ✅ Pass | This IS the security improvement initiative |

**Gate Result**: PASS - No violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/003-security-fixes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (rate limit response schemas)
└── tasks.md             # Phase 2 output (from /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts                    # Entry point (no changes)
├── shared/
│   └── types.ts                # Type definitions (add rate limit types)
├── core/
│   └── safeguard-manager.ts    # Data management (no changes)
└── interfaces/
    ├── http/
    │   └── http-server.ts      # HTTP API (add rate limiting middleware)
    └── mcp/
        └── mcp-server.ts       # MCP server (no changes)

.github/
├── workflows/
│   ├── ci.yml                  # Add npm audit step
│   └── release.yml             # No changes
└── dependabot.yml              # NEW: Dependabot configuration

package.json                    # Update dependencies
```

**Structure Decision**: Single project structure maintained. Changes limited to:
1. `package.json` - dependency updates
2. `src/interfaces/http/http-server.ts` - rate limiting middleware
3. `.github/workflows/ci.yml` - security audit step
4. `.github/dependabot.yml` - new file for automated updates

## Complexity Tracking

No violations requiring justification. All changes follow established patterns:
- express-rate-limit is the standard Express rate limiting solution
- npm audit is built into npm
- Dependabot is GitHub's native dependency update tool
