# Feature Specification: Standardize Prompt Structure Across All CIS Safeguards

**Feature Branch**: `002-standardize-prompt-structure`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "I have modified the safeguard-manager.ts file in 10.2, to reflect the changes I want to make. Analyze the 10.2 changes and present them to me in a plan to make the same changes in all other safeguards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standardize System Prompts Template (Priority: P1)

Framework administrators need all 153 CIS safeguards to use the new standardized prompt structure that provides clear, capability-specific objectives for vendor assessment.

**Why this priority**: This is the core change that affects all safeguards and establishes the foundation template structure. Without this, the assessment system lacks consistency across all CIS controls.

**Independent Test**: Can be fully tested by retrieving any safeguard's system prompts via the API and verifying they all follow the new template structure with standardized objectives and simplified content.

**Acceptance Scenarios**:

1. **Given** any CIS safeguard in the system, **When** I retrieve its system prompt data, **Then** all five capability prompts (Full, Partial, Facilitates, Governance, Validates) use the standardized objective templates
2. **Given** a safeguard mapped to FULL capability, **When** I access systemPromptFull, **Then** the objective states "The vendor has been mapped to FULL by the mapping tool... Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY"
3. **Given** any system prompt, **When** I check the guidelines, **Then** they contain only "Future Use" as the guideline content
4. **Given** any system prompt, **When** I check the outputFormat, **Then** it uses the simplified format "Provide a structured assessment, confidence score, and evidence summary"

---

### User Story 2 - Simplify Implementation Suggestions (Priority: P2)

Framework administrators need all safeguards to have streamlined, simplified implementation suggestions that are concise and high-level rather than detailed technical specifications.

**Why this priority**: This reduces complexity and maintenance burden while making the framework more accessible to non-technical stakeholders.

**Independent Test**: Can be tested by checking implementation suggestions across all safeguards and verifying they use simplified, high-level language instead of detailed technical specifications.

**Acceptance Scenarios**:

1. **Given** any CIS safeguard, **When** I check its implementationSuggestions, **Then** they contain 1-3 simplified, high-level suggestions instead of detailed technical lists
2. **Given** safeguard 10.2 as the template, **When** I compare other safeguards, **Then** their implementation suggestions follow similar simplified patterns

---


### Edge Cases

- What happens when a safeguard has unique requirements that don't fit the template?
- How does the system handle safeguards with critical implementation details that shouldn't be simplified?
- What if the simplified structure loses important technical context for certain safeguards?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST update all 153 CIS safeguards to use the new standardized prompt template structure
- **FR-002**: System MUST apply the new objective templates to all five capability prompts (Full, Partial, Facilitates, Governance, Validates)
- **FR-003**: System MUST replace all guidelines with "Future Use" standardized content
- **FR-004**: System MUST update all outputFormat fields to use the simplified format "Provide a structured assessment, confidence score, and evidence summary"
- **FR-005**: System MUST simplify implementationSuggestions across all safeguards to use high-level, non-technical language
- **FR-006**: System MUST maintain the existing five-prompt structure (systemPromptFull, systemPromptPartial, systemPromptFacilitates, systemPromptGovernance, systemPromptValidates)
- **FR-007**: System MUST preserve all other safeguard metadata (id, title, description, implementationGroup, coreRequirements, etc.)

### Key Entities

- **SystemPromptStructure**: Contains role, context, objective, guidelines, and outputFormat with standardized template content
- **SafeguardElement**: All 153 CIS safeguard objects that need to be updated with the new template structure
- **TemplatePattern**: The standardized pattern established in safeguard 10.2 that serves as the blueprint for all other safeguards

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 153 CIS safeguards use the new standardized prompt template structure with consistent objectives across all five capability types
- **SC-002**: All system prompts contain only "Future Use" in guidelines and the simplified output format
- **SC-003**: Implementation suggestions are reduced to 1-3 high-level items per safeguard (down from detailed technical specifications)
- **SC-004**: Validation script confirms 100% compliance with the new template structure across all safeguards
- **SC-005**: API responses maintain backward compatibility while serving the new standardized content

## Assumptions

- Safeguard 10.2 represents the correct template pattern to be replicated across all other safeguards
- The simplified structure maintains sufficient detail for vendor assessment purposes
- "Future Use" as guidelines content is acceptable for the current implementation phase
- The new prompt objectives adequately cover all assessment scenarios for each capability type

## Dependencies

- Safeguard 10.2 serves as the source template pattern
- Existing five-prompt structure from v2.0.0 capability split implementation
- Validation tools for verifying consistent application across all safeguards

## Constraints

- Must maintain API backward compatibility
- Cannot break existing TypeScript interfaces
- Must preserve all essential safeguard metadata
- Changes should not affect the core framework assessment capabilities