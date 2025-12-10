# Tasks: Standardize Prompt Structure Across All CIS Safeguards

**Input**: Design documents from `/specs/002-standardize-prompt-structure/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `scripts/` at repository root
- Paths assume existing Framework MCP structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and validate existing structure

- [ ] T001 Verify current safeguard structure in src/core/safeguard-manager.ts
- [ ] T002 Confirm safeguard 10.2 template pattern exists in src/core/safeguard-manager.ts
- [ ] T003 Validate existing TypeScript compilation with npm run build
- [ ] T004 Verify existing validation script at scripts/validate-capability-prompts.js works

## Phase 2: Foundational (Prerequisites for All User Stories)

**Purpose**: Create shared transformation infrastructure needed by all user stories

- [ ] T005 Create transformation script at scripts/standardize-prompts.ts
- [ ] T006 Implement extractTemplate() function to parse safeguard 10.2 pattern in scripts/standardize-prompts.ts
- [ ] T007 Implement applyTemplate() function for single safeguard transformation in scripts/standardize-prompts.ts
- [ ] T008 Create backup mechanism for original safeguard-manager.ts file in scripts/standardize-prompts.ts
- [ ] T009 Add command line interface with --dry-run, --validate, --verbose options in scripts/standardize-prompts.ts

## Phase 3: User Story 1 - Standardize System Prompts Template (P1)

**Goal**: All 153 CIS safeguards use standardized prompt templates with consistent objectives

**Independent Test**: Retrieve any safeguard via API and verify all five capability prompts follow new template structure

**Story Dependencies**: None (foundational work complete)

- [ ] T010 [US1] Create objective templates for all five capabilities in scripts/standardize-prompts.ts
- [ ] T011 [US1] Implement system prompt objective standardization logic in scripts/standardize-prompts.ts
- [ ] T012 [US1] Implement guidelines replacement with "Future Use" in scripts/standardize-prompts.ts
- [ ] T013 [US1] Implement outputFormat standardization in scripts/standardize-prompts.ts
- [ ] T014 [P] [US1] Run transformation script on all 152 safeguards (excluding 10.2) via scripts/standardize-prompts.ts
- [ ] T015 [US1] Validate all system prompts updated correctly using existing validation script
- [ ] T016 [US1] Test API endpoint /api/safeguards/1.1 returns standardized prompt structure
- [ ] T017 [US1] Verify TypeScript compilation succeeds with updated safeguard-manager.ts

## Phase 4: User Story 2 - Simplify Implementation Suggestions (P2)

**Goal**: All safeguards have streamlined implementation suggestions (1-3 high-level items)

**Independent Test**: Check implementation suggestions across safeguards for simplified language

**Story Dependencies**: Must complete US1 first (operates on same safeguard-manager.ts file)

- [ ] T018 [US2] Analyze current implementation suggestions patterns in src/core/safeguard-manager.ts
- [ ] T019 [US2] Create simplification logic for implementationSuggestions in scripts/standardize-prompts.ts
- [ ] T020 [P] [US2] Apply implementation suggestions simplification to all 153 safeguards via scripts/standardize-prompts.ts
- [ ] T021 [US2] Validate implementation suggestions contain 1-3 items per safeguard using validation script
- [ ] T022 [US2] Spot-check 10 representative safeguards for simplified suggestions quality
- [ ] T023 [US2] Test API responses maintain backward compatibility for implementationSuggestions field

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and production readiness

- [ ] T024 Run comprehensive validation on all 153 safeguards using scripts/validate-capability-prompts.js
- [ ] T025 Performance test: Verify API response times unchanged with transformed data
- [ ] T026 Create deployment checklist for production release
- [ ] T027 Update package.json scripts to include new transformation command
- [ ] T028 Document rollback procedure in case of issues

## Dependencies & Execution Order

### Story Completion Requirements

1. **Phase 1-2** → Must complete before any user stories
2. **US1 (Phase 3)** → Independent, can start after Phase 2
3. **US2 (Phase 4)** → Depends on US1 completion (same file modifications)

### Parallel Execution Opportunities

**Within US1 (Phase 3)**:
- T010, T011, T012, T013 can be developed in parallel (different functions)
- T014 is the integration point requiring all previous US1 tasks
- T015, T016, T017 can run in parallel after T014

**Within US2 (Phase 4)**:
- T018, T019 can run in parallel
- T020 depends on T019
- T021, T022, T023 can run in parallel after T020

### MVP Strategy

**Minimum Viable Product**: US1 Only
- Delivers core standardization of system prompts
- Provides complete template consistency across all 153 safeguards
- Independently testable and valuable to users
- Can be released without US2 if needed

**Full Feature**: US1 + US2
- Adds implementation suggestions simplification
- Complete standardization across all safeguard fields
- Maximum value delivery

## Implementation Strategy

### Incremental Delivery Approach

1. **Sprint 1**: Phase 1-2 + US1 (Core prompt standardization)
   - Deliverable: All system prompts standardized
   - Value: Consistent assessment objectives across framework
   - Risk mitigation: Core functionality validated first

2. **Sprint 2**: US2 (Implementation suggestions simplification)
   - Deliverable: Simplified implementation guidance
   - Value: Reduced complexity for non-technical stakeholders
   - Independent: Can be skipped or delayed if needed

### Risk Mitigation

- **T008**: Backup mechanism ensures safe rollback capability
- **T009**: Dry-run mode allows validation before applying changes
- **T015, T021**: Validation scripts catch any transformation errors
- **T016, T023**: API testing ensures backward compatibility maintained

### Validation Gates

- After US1: All system prompts must pass validation (T015)
- After US2: All implementation suggestions must be simplified (T021)
- Before deployment: Comprehensive validation must pass (T024)
- Performance requirement: API response times unchanged (T025)

**Total Tasks**: 28
**Parallelizable Tasks**: 8 (marked with [P])
**User Story Tasks**: 18 (10 for US1, 8 for US2)
**Foundation Tasks**: 5 (Phase 1-2)
**Polish Tasks**: 5 (Phase 5)