# Transformation Script API Contract

**Feature**: 002-standardize-prompt-structure
**Contract Type**: Internal Script Interface
**Date**: 2025-12-10

## Script Interface

### Primary Script: `scripts/standardize-prompts.ts`

**Purpose**: Apply standardized prompt template pattern from safeguard 10.2 to all other safeguards

**Input**:
- `src/core/safeguard-manager.ts` - Current safeguard definitions
- Template pattern from safeguard 10.2

**Output**:
- Updated `src/core/safeguard-manager.ts` with standardized prompts
- Console progress reporting
- Validation summary

**Command Line Interface**:
```bash
npm run standardize-prompts [options]

Options:
  --dry-run    Show what would be changed without applying
  --validate   Run validation after transformation
  --verbose    Show detailed progress information
  --target     Specific safeguard ID to update (default: all except 10.2)
```

**Exit Codes**:
- `0` - Success: All transformations applied successfully
- `1` - Error: Transformation failed or validation errors detected
- `2` - Warning: Some safeguards skipped due to conflicts

## Transformation Functions

### `extractTemplate(sourceId: string): TemplatePattern`

**Purpose**: Extract standardization pattern from source safeguard (10.2)

**Input**:
- `sourceId`: "10.2" - Source safeguard identifier

**Output**: `TemplatePattern` object containing:
```typescript
{
  sourceId: "10.2",
  objectiveTemplates: {
    Full: "The vendor has taken an assessment and has been mapped to FULL...",
    Partial: "The vendor has taken an assessment and has been mapped to PARTIAL...",
    Facilitates: "The vendor has taken an assessment and has been mapped to FACILITATES...",
    Governance: "The vendor has taken an assessment and has been mapped to GOVERNANCE...",
    Validates: "The vendor has taken an assessment and has been mapped to VALIDATES..."
  },
  standardizedGuidelines: ["Future Use"],
  standardizedOutputFormat: "Provide a structured assessment, confidence score, and evidence summary",
  simplificationPatterns: {...}
}
```

**Error Conditions**:
- Source safeguard not found
- Source safeguard missing required template structure
- Invalid capability prompt structure in source

### `applyTemplate(safeguard: SafeguardElement, template: TemplatePattern): SafeguardElement`

**Purpose**: Apply standardization template to a single safeguard

**Input**:
- `safeguard`: Original safeguard definition
- `template`: Template pattern from 10.2

**Output**: Updated safeguard with standardized structure

**Transformations Applied**:
1. Update all five system prompt objectives with template patterns
2. Replace guidelines with ["Future Use"]
3. Update outputFormat to standardized text
4. Simplify implementationSuggestions (preserve 1-3 high-level items)

**Preservation Rules**:
- Preserve: id, title, description, implementationGroup, assetType, securityFunction
- Preserve: governanceElements, subTaxonomicalElements, relatedSafeguards, coreRequirements
- Preserve: role and context in all system prompts
- Update: objective, guidelines, outputFormat in all system prompts
- Optimize: implementationSuggestions only

### `validateTransformation(safeguards: Record<string, SafeguardElement>): ValidationResult`

**Purpose**: Verify all safeguards comply with standardized template

**Input**: Complete safeguards collection

**Output**:
```typescript
{
  success: boolean,
  totalSafeguards: 153,
  compliantSafeguards: number,
  errors: string[],
  warnings: string[]
}
```

**Validation Checks**:
- All 153 safeguards present
- All system prompts use standardized objective templates
- All guidelines equal ["Future Use"]
- All outputFormats use standardized text
- Implementation suggestions contain 1-3 items
- Core requirements preserved completely unchanged
- Original metadata preserved unchanged

## Error Handling

### Input Validation
- Verify source file exists and is readable
- Confirm TypeScript syntax validity
- Check safeguard 10.2 exists and has expected structure

### Transformation Validation
- Ensure no data loss during transformation
- Verify all essential fields preserved
- Confirm standardized templates applied correctly

### Output Validation
- Validate updated TypeScript compiles successfully
- Confirm API still returns expected structure
- Verify 153 safeguards count maintained

### Recovery Procedures
- Backup original file before transformation
- Provide rollback capability for failed transformations
- Log all changes for audit trail

## Success Criteria

**Primary Objectives**:
- ✅ All 152 safeguards (excluding 10.2) updated with standardized templates
- ✅ Zero data loss or corruption
- ✅ 100% validation compliance
- ✅ TypeScript compilation success
- ✅ API backward compatibility maintained

**Quality Gates**:
- All transformation functions pass unit tests
- Integration test confirms API responses unchanged
- Manual spot check of representative safeguards
- Performance impact assessment (transformation time < 30 seconds)