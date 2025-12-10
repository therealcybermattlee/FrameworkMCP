# Tasks: System Prompt Capability Split

**Input**: Design documents from `/specs/001-prompt-capability-split/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are NOT requested for this feature - focus on implementation and manual validation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, at repository root
- Based on plan.md: TypeScript project with Express and MCP interfaces

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure - no changes needed for this feature

This feature works with the existing project structure, so no setup tasks are required.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] Create backup of current SafeguardElement type definition in src/shared/types.ts
- [x] T002 [P] Update TypeScript SafeguardElement interface to include five capability-specific prompt fields in src/shared/types.ts
- [x] T003 [P] Remove deprecated systemPrompt field from SafeguardElement interface in src/shared/types.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agent Receives Capability-Specific Prompts (Priority: P1) 🎯 MVP

**Goal**: Enable agents to receive five distinct capability-specific system prompts for any safeguard

**Independent Test**: Make API call for safeguard 1.1 and verify response contains systemPromptFull, systemPromptPartial, systemPromptFacilitates, systemPromptGovernance, systemPromptValidates fields with complete sub-structure

### Implementation for User Story 1

- [x] T004 [US1] Update SafeguardManager.initializeSafeguards method to transform existing systemPrompt data to five capability fields in src/core/safeguard-manager.ts
- [x] T005 [US1] Modify SafeguardManager.getSafeguardDetails to return new capability-specific prompt structure in src/core/safeguard-manager.ts
- [x] T006 [US1] Update HTTP API response serialization to include all five capability prompts in src/interfaces/http/http-server.ts
- [x] T007 [US1] Update MCP server response to include all five capability prompts in src/interfaces/mcp/mcp-server.ts
- [x] T008 [US1] Test API endpoint /api/safeguard/1.1 returns all five capability prompt fields with correct structure
- [x] T009 [US1] Test MCP get_safeguard_details tool returns all five capability prompt fields with correct structure

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Backward Compatibility Check (Priority: P2)

**Goal**: Provide clear migration documentation and ensure API consumers understand the breaking change

**Independent Test**: Review API documentation and migration guide to verify they clearly explain the transition from single systemPrompt to five capability-specific prompts

### Implementation for User Story 2

- [x] T010 [P] [US2] Create migration documentation file in docs/migration-v2.0.md explaining the breaking change
- [x] T011 [P] [US2] Update API documentation to reflect new capability-specific prompt structure in swagger.json
- [x] T012 [P] [US2] Update README.md to reference breaking change and migration guide
- [x] T013 [US2] Test that API no longer returns deprecated systemPrompt field for any safeguard
- [x] T014 [US2] Validate that quickstart.md examples work with new API structure

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Bulk Data Validation (Priority: P3)

**Goal**: Ensure all 153 safeguards have been successfully converted to the new capability-specific prompt structure

**Independent Test**: Fetch all safeguards via /api/safeguards and verify each of the 153 safeguards contains all five capability prompt fields

### Implementation for User Story 3

- [ ] T015 [US3] Create data validation script to verify all 153 safeguards have five capability prompts in scripts/validate-capability-prompts.js
- [ ] T016 [US3] Add validation that each capability prompt maintains complete SystemPromptStructure in scripts/validate-capability-prompts.js
- [ ] T017 [US3] Test bulk endpoint /api/safeguards returns 153 safeguards each with all five capability fields
- [ ] T018 [US3] Run validation script and confirm 100% of safeguards are properly transformed
- [ ] T019 [US3] Create monitoring endpoint /api/health/safeguards to check data completeness in src/interfaces/http/http-server.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T020 [P] Update package.json version to 2.0.0 to reflect breaking change
- [ ] T021 [P] Compile TypeScript and test that all interfaces build successfully
- [ ] T022 [P] Performance test to ensure API response time remains within 10% of baseline
- [ ] T023 [P] Update CLAUDE.md agent context with new capability prompt structure
- [ ] T024 Run quickstart.md validation to ensure all examples work with new API

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - not needed for this feature
- **Foundational (Phase 2)**: No dependencies - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1 but references new API structure
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent but validates US1 implementation

### Within Each User Story

- Type definition updates before implementation
- SafeguardManager changes before API interface updates
- Core implementation before testing
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Tasks marked [P] within User Story 2 can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch documentation tasks for User Story 2 together:
Task: "Create migration documentation file in docs/migration-v2.0.md explaining the breaking change"
Task: "Update API documentation to reflect new capability-specific prompt structure in swagger.json"
Task: "Update README.md to reference breaking change and migration guide"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (core transformation)
   - Developer B: User Story 2 (documentation)
   - Developer C: User Story 3 (validation)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No automated tests - rely on manual API testing and validation scripts
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This is a breaking change - ensure migration documentation is clear and complete