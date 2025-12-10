# Implementation Plan: Standardize Prompt Structure Across All CIS Safeguards

**Branch**: `002-standardize-prompt-structure` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Apply the standardized prompt template pattern from safeguard 10.2 to all 153 CIS safeguards. This involves updating system prompts with new objective templates, simplifying guidelines to "Future Use", and streamlining implementation suggestions across the entire framework.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.0+ (existing codebase)
**Primary Dependencies**: @modelcontextprotocol/sdk 0.4.0, Express 4.18.2 (existing)
**Storage**: In-memory data structures (existing architecture)
**Testing**: npm test && npm run lint (existing validation)
**Target Platform**: Node.js server environment (existing)
**Project Type**: Single project - data transformation within existing MCP server
**Performance Goals**: Maintain current API response times, process all 153 safeguards
**Constraints**: Must maintain API backward compatibility, preserve existing interfaces
**Scale/Scope**: Transform 153 CIS safeguards using automated pattern application from template safeguard 10.2

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Constitution Template Not Configured** - No specific constitution constraints found.

**Assessment**: This feature involves data transformation within existing architecture:
- No new libraries or services required
- No new testing frameworks needed
- No breaking changes to existing interfaces
- Follows existing TypeScript/Node.js patterns
- Maintains backward compatibility

**Gate Status**: PASS - No constitutional violations detected

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Existing FrameworkMCP Structure (no changes to structure)
src/
├── core/
│   └── safeguard-manager.ts    # PRIMARY TARGET: Contains all 153 safeguard definitions
├── shared/
│   └── types.ts               # SafeguardElement interface (already updated in v2.0.0)
├── interfaces/
│   ├── http/
│   │   └── http-server.ts     # HTTP API (no changes needed)
│   └── mcp/
│       └── mcp-server.ts      # MCP interface (no changes needed)
└── index.ts

scripts/
├── validate-capability-prompts.js  # Existing validation (reusable)
└── [NEW] standardize-prompts.ts     # New transformation script

tests/
└── [existing test structure]        # No changes needed
```

**Structure Decision**: Uses existing single-project structure. Primary changes occur in `src/core/safeguard-manager.ts` where all 153 CIS safeguard definitions reside. A new transformation script will be created to apply the standardization pattern from safeguard 10.2 to all other safeguards.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
