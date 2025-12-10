# Research: System Prompt Capability Split

**Feature**: System Prompt Capability Split
**Date**: 2025-12-05
**Status**: Complete

## Research Tasks & Findings

### 1. Testing Framework Selection

**Decision**: No automated testing framework for initial implementation
**Rationale**:
- This is a data structure transformation with deterministic output
- Manual validation can verify all 153 safeguards are transformed correctly
- Testing can be added in a future iteration if needed
**Alternatives considered**:
- Jest - Popular TypeScript testing framework, but adds build complexity
- Mocha - Alternative testing framework, similar concerns
- Manual validation scripts - Selected approach for simplicity

### 2. TypeScript Interface Evolution Pattern

**Decision**: Create new interface fields while deprecating old ones
**Rationale**:
- TypeScript supports optional fields for gradual migration
- Can mark old field as deprecated using JSDoc comments
- Enables type-safe migration path
**Alternatives considered**:
- Union types - Would complicate type checking
- Generics - Over-engineering for this use case
- Complete replacement - Too disruptive without migration period

### 3. Data Migration Strategy

**Decision**: Transform data at initialization time in SafeguardManager
**Rationale**:
- No persistent storage means transformation happens on server start
- Ensures consistency across all safeguards
- Simple to implement and verify
**Alternatives considered**:
- Runtime transformation - Would impact performance on every request
- Build-time script - Would require additional build tooling
- Database migration - Not applicable (no database)

### 4. API Versioning Approach

**Decision**: Breaking change with clear migration documentation
**Rationale**:
- Clean separation between old and new structure
- Simplified codebase without legacy support burden
- Clear communication to API consumers about the change
**Alternatives considered**:
- API version headers - Adds complexity for a one-time change
- Dual field support - Maintains both old and new fields indefinitely
- Gradual deprecation - Unnecessary for internal production system

### 5. Field Naming Convention

**Decision**: camelCase with capability suffix (e.g., systemPromptFull)
**Rationale**:
- Consistent with existing TypeScript/JavaScript conventions
- Clear indication of capability type in field name
- Maintains alphabetical proximity for related fields
**Alternatives considered**:
- Nested object structure - Would be a larger breaking change
- Array of prompts - Less explicit, requires indexing
- Separate capability object - Over-complicates data structure

## Implementation Recommendations

1. **Phase 1**: Update TypeScript types in shared/types.ts
2. **Phase 2**: Modify SafeguardManager initialization logic
3. **Phase 3**: Update API response serialization
4. **Phase 4**: Create migration documentation
5. **Phase 5**: Manual validation of all 153 safeguards

## Risk Mitigation

- **Breaking Change Risk**: Mitigated by clear documentation and migration guide
- **Data Loss Risk**: Mitigated by duplicating existing prompt to all five fields initially
- **Performance Risk**: Mitigated by monitoring response times post-deployment
- **Integration Risk**: Mitigated by testing with sample agent requests

## Next Steps

Proceed to Phase 1: Design & Contracts to create:
- Updated data model documentation
- API contract specifications
- Quick start guide for the new structure