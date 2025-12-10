# Data Model: System Prompt Capability Split

**Feature**: System Prompt Capability Split
**Date**: 2025-12-05
**Version**: 1.0.0

## Overview

This document describes the data model changes for splitting the single `systemPrompt` field into five capability-specific fields in the SafeguardElement type.

## Entity Definitions

### SafeguardElement (Modified)

The core data structure for CIS safeguard information.

#### Removed Fields
- `systemPrompt?: SystemPromptStructure` - **DEPRECATED**: Single prompt for all capabilities

#### New Fields
- `systemPromptFull?: SystemPromptStructure` - Prompt for full capability evaluation
- `systemPromptPartial?: SystemPromptStructure` - Prompt for partial capability evaluation
- `systemPromptFacilitates?: SystemPromptStructure` - Prompt for facilitates capability evaluation
- `systemPromptGovernance?: SystemPromptStructure` - Prompt for governance capability evaluation
- `systemPromptValidates?: SystemPromptStructure` - Prompt for validates capability evaluation

#### Unchanged Fields
- `id: string` - Safeguard identifier (e.g., "1.1")
- `title: string` - Safeguard title
- `description: string` - Detailed description
- `implementationGroup: 'IG1' | 'IG2' | 'IG3'` - Implementation group classification
- `assetType: string[]` - Asset types affected
- `securityFunction: string[]` - Security functions addressed
- `governanceElements: string[]` - Orange governance requirements
- `coreRequirements: string[]` - Green core requirements
- `subTaxonomicalElements: string[]` - Yellow sub-taxonomical elements
- `implementationSuggestions: string[]` - Gray implementation suggestions
- `relatedSafeguards: string[]` - Related safeguard IDs
- `enhancedRelationships?: SafeguardRelationship[]` - Enhanced relationship data

### SystemPromptStructure (Unchanged)

The structure for each system prompt remains the same.

```typescript
interface SystemPromptStructure {
  role: string;           // AI role identifier
  context: string;        // Context about the safeguard
  objective: string;      // What to accomplish
  guidelines: string[];   // Evaluation criteria
  outputFormat: string;   // Expected response format
}
```

### CapabilityType (Reference)

Existing type that maps to the new fields:

```typescript
type CapabilityType = 'full' | 'partial' | 'facilitates' | 'governance' | 'validates';
```

## Data Relationships

```
SafeguardElement
    ├── systemPromptFull        → SystemPromptStructure
    ├── systemPromptPartial     → SystemPromptStructure
    ├── systemPromptFacilitates → SystemPromptStructure
    ├── systemPromptGovernance  → SystemPromptStructure
    └── systemPromptValidates   → SystemPromptStructure
```

## Validation Rules

### Field Validation
1. **Presence**: All five capability prompt fields MUST be present for each safeguard
2. **Structure**: Each capability prompt MUST contain all SystemPromptStructure properties
3. **Non-null**: During transformation, no capability prompt can be null/undefined

### Data Integrity
1. **Completeness**: All 153 safeguards MUST have all five capability prompts
2. **Consistency**: Initial values duplicate existing systemPrompt content
3. **Type Safety**: TypeScript compiler enforces structure compliance

### Business Rules
1. **Order**: Fields appear in order: FULL, PARTIAL, FACILITATES, GOVERNANCE, VALIDATES
2. **Migration**: Existing systemPrompt content copied to all five new fields initially
3. **Removal**: Original systemPrompt field removed from responses

## State Transitions

### Transformation Process
```
1. [Original State]
   - SafeguardElement with single systemPrompt

2. [Transformation]
   - Read existing systemPrompt
   - Create five new fields
   - Copy systemPrompt content to each new field

3. [Final State]
   - SafeguardElement with five capability-specific prompts
   - Original systemPrompt field removed
```

## Migration Path

### For API Consumers
1. **Before**: Access `safeguard.systemPrompt`
2. **After**: Access specific capability prompt:
   - `safeguard.systemPromptFull`
   - `safeguard.systemPromptPartial`
   - `safeguard.systemPromptFacilitates`
   - `safeguard.systemPromptGovernance`
   - `safeguard.systemPromptValidates`

### For Data Initialization
1. Load existing safeguard data
2. For each safeguard:
   - Copy `systemPrompt` to all five new fields
   - Remove `systemPrompt` field
3. Store transformed safeguard

## Example Data

### Before Transformation
```json
{
  "id": "1.1",
  "title": "Establish and Maintain Detailed Enterprise Asset Inventory",
  "systemPrompt": {
    "role": "asset_inventory_expert",
    "context": "Evaluating asset inventory capabilities",
    "objective": "Assess vendor solution capabilities",
    "guidelines": ["Check for automated discovery", "Verify asset tracking"],
    "outputFormat": "structured JSON response"
  }
}
```

### After Transformation
```json
{
  "id": "1.1",
  "title": "Establish and Maintain Detailed Enterprise Asset Inventory",
  "systemPromptFull": {
    "role": "asset_inventory_expert",
    "context": "Evaluating asset inventory capabilities",
    "objective": "Assess vendor solution capabilities",
    "guidelines": ["Check for automated discovery", "Verify asset tracking"],
    "outputFormat": "structured JSON response"
  },
  "systemPromptPartial": {
    "role": "asset_inventory_expert",
    "context": "Evaluating asset inventory capabilities",
    "objective": "Assess vendor solution capabilities",
    "guidelines": ["Check for automated discovery", "Verify asset tracking"],
    "outputFormat": "structured JSON response"
  },
  "systemPromptFacilitates": {
    "role": "asset_inventory_expert",
    "context": "Evaluating asset inventory capabilities",
    "objective": "Assess vendor solution capabilities",
    "guidelines": ["Check for automated discovery", "Verify asset tracking"],
    "outputFormat": "structured JSON response"
  },
  "systemPromptGovernance": {
    "role": "asset_inventory_expert",
    "context": "Evaluating asset inventory capabilities",
    "objective": "Assess vendor solution capabilities",
    "guidelines": ["Check for automated discovery", "Verify asset tracking"],
    "outputFormat": "structured JSON response"
  },
  "systemPromptValidates": {
    "role": "asset_inventory_expert",
    "context": "Evaluating asset inventory capabilities",
    "objective": "Assess vendor solution capabilities",
    "guidelines": ["Check for automated discovery", "Verify asset tracking"],
    "outputFormat": "structured JSON response"
  }
}
```