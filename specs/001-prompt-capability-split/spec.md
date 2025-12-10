# Feature Specification: System Prompt Capability Split

**Feature Branch**: `001-prompt-capability-split`
**Created**: 2025-12-05
**Status**: Draft
**Input**: User description: "This is a project that serves API data to be used by an agentic flow. It is in production and extremely valuable as it sits. I want to take an analysis of the current project as it sits for establishing project clarity, and then want to make a spec for converting the 'system prompt' portion of the api response per safeguard, to a FULL, PARTIAL, FACILITATES, GOVERNANCE, VALIDATES in that order. so instead of 'system prompt' as it is now, it would be 'system prompt FULL', and 'system prompt PARTIAL' and so forth for each. The remainder of the role, context, etc would initial be the same but I will manually edit those later. This is to get the framework set up on all 153 safeguards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Receives Capability-Specific Prompts (Priority: P1)

As an AI agent consuming the API, I need to receive different system prompts based on the capability level I'm evaluating, so that I can provide more accurate and context-aware vendor assessments for each CIS safeguard.

**Why this priority**: This is the core functionality that enables more granular and accurate vendor capability assessments. Without this, agents cannot distinguish between different levels of safeguard implementation.

**Independent Test**: Can be fully tested by making API calls for any single safeguard and verifying that all five capability-specific prompts are returned in the response.

**Acceptance Scenarios**:

1. **Given** an API request for safeguard 1.1, **When** the response is returned, **Then** it contains five distinct system prompt fields: systemPromptFull, systemPromptPartial, systemPromptFacilitates, systemPromptGovernance, and systemPromptValidates
2. **Given** an API request for any safeguard, **When** examining each capability-specific prompt, **Then** each contains role, context, objective, guidelines, and outputFormat properties
3. **Given** the new API structure, **When** the original systemPrompt field is accessed, **Then** it no longer exists in the response

---

### User Story 2 - Backward Compatibility Check (Priority: P2)

As an API consumer, I need clear documentation and migration guidance for the breaking change from single systemPrompt to capability-specific prompts, so that I can update my integrations accordingly.

**Why this priority**: This ensures existing production systems have a clear upgrade path and understand the breaking changes to prevent service disruptions.

**Independent Test**: Can be tested by comparing API responses before and after the change, and verifying documentation clearly explains the migration.

**Acceptance Scenarios**:

1. **Given** an existing API integration expecting systemPrompt field, **When** calling the updated API, **Then** appropriate error handling or migration warnings are provided
2. **Given** API documentation, **When** reviewing the changes, **Then** clear migration instructions exist for updating from single to multiple system prompts

---

### User Story 3 - Bulk Data Validation (Priority: P3)

As a system administrator, I need to verify that all 153 safeguards have been successfully converted to the new capability-specific prompt structure, so that I can ensure data completeness.

**Why this priority**: Ensures data integrity and completeness across all safeguards after the transformation.

**Independent Test**: Can be tested by fetching all safeguards and validating each has the required five capability-specific prompt fields.

**Acceptance Scenarios**:

1. **Given** a request for all safeguards, **When** iterating through the response, **Then** all 153 safeguards contain the five capability-specific prompt fields
2. **Given** any capability-specific prompt field, **When** examining its structure, **Then** it maintains the same sub-properties as the original systemPrompt (role, context, objective, guidelines, outputFormat)

---

### Edge Cases

- What happens when a safeguard is requested that doesn't exist (e.g., safeguard 99.99)?
- How does the system handle requests that explicitly request the old systemPrompt field format?
- What validation ensures all five capability prompts are present for each safeguard?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace the single systemPrompt field with five capability-specific fields for all 153 CIS safeguards
- **FR-002**: System MUST name the new fields: systemPromptFull, systemPromptPartial, systemPromptFacilitates, systemPromptGovernance, and systemPromptValidates
- **FR-003**: Each capability-specific prompt MUST maintain the existing sub-structure (role, context, objective, guidelines, outputFormat)
- **FR-004**: System MUST initially duplicate the existing systemPrompt content into all five new fields
- **FR-005**: System MUST remove the original systemPrompt field from the API response
- **FR-006**: System MUST apply this transformation to all 153 safeguards in the system
- **FR-007**: System MUST maintain the order of capability fields as: FULL, PARTIAL, FACILITATES, GOVERNANCE, VALIDATES
- **FR-008**: System MUST preserve all other existing safeguard fields unchanged (id, title, description, implementationGroup, etc.)

### Key Entities *(include if feature involves data)*

- **SafeguardElement**: Core data structure containing CIS safeguard information, currently has single systemPrompt field that will be split into five capability-specific fields
- **SystemPrompt Structure**: Contains role, context, objective, guidelines[], and outputFormat properties - this structure is preserved in each new capability field
- **Capability Types**: Five distinct evaluation levels (full, partial, facilitates, governance, validates) that determine agent behavior

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: API responses return five distinct system prompt fields for 100% of safeguards (153 out of 153)
- **SC-002**: Each capability-specific prompt field maintains the complete sub-structure without data loss
- **SC-003**: API response time remains within 10% of current performance despite increased data payload
- **SC-004**: All existing API consumers receive clear migration documentation before deployment
- **SC-005**: System successfully serves capability-specific prompts to agents for accurate vendor assessments