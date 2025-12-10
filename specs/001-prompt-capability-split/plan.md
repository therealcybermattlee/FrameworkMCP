# Implementation Plan: System Prompt Capability Split

**Branch**: `001-prompt-capability-split` | **Date**: 2025-12-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-prompt-capability-split/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Transform the single systemPrompt field in the SafeguardElement type to five capability-specific fields (systemPromptFull, systemPromptPartial, systemPromptFacilitates, systemPromptGovernance, systemPromptValidates) for all 153 CIS safeguards. This enables agents to receive context-appropriate prompts based on the capability level being evaluated, improving accuracy of vendor assessments.

## Technical Context

**Language/Version**: TypeScript 5.0+
**Primary Dependencies**: Express 4.18.2, @modelcontextprotocol/sdk 0.4.0
**Storage**: In-memory data structure (no database)
**Testing**: NEEDS CLARIFICATION - No test framework currently configured
**Target Platform**: Node.js server (dual HTTP/MCP interfaces)
**Project Type**: Single project - Node.js API server
**Performance Goals**: API response time within 10% of current performance
**Constraints**: Breaking API change requires migration documentation
**Scale/Scope**: 153 safeguards to transform, production system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Since no specific constitution has been defined for this project, using standard software engineering principles:

- ✅ **Single Responsibility**: Each field serves one capability type
- ✅ **Open/Closed**: Extending without modifying existing structure
- ✅ **Interface Segregation**: Clients can use only needed prompts
- ✅ **Backward Compatibility**: Breaking change documented with migration path
- ✅ **Data Integrity**: All 153 safeguards transformed consistently

## Project Structure

### Documentation (this feature)

```text
specs/001-prompt-capability-split/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── shared/
│   └── types.ts         # SafeguardElement type definition
├── core/
│   └── safeguard-manager.ts  # Safeguard data management
├── interfaces/
│   ├── http/
│   │   └── http-server.ts    # HTTP API endpoint
│   └── mcp/
│       └── mcp-server.ts      # MCP server interface
└── index.ts             # Entry point

dist/                    # Compiled JavaScript output
└── [mirrors src structure]
```

**Structure Decision**: Using existing single project structure - no new directories needed. Changes will be made to the type definitions in shared/types.ts and the safeguard initialization in safeguard-manager.ts.

## Complexity Tracking

> No complexity violations - this is a straightforward data structure transformation within the existing architecture.