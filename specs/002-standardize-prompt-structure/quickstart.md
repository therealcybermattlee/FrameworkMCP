# Quick Start: Standardize Prompt Structure Implementation

**Feature**: 002-standardize-prompt-structure
**Implementation Time**: ~30 minutes
**Complexity**: Low (data transformation)

## Overview

This feature standardizes the prompt structure across all 153 CIS safeguards by applying the template pattern established in safeguard 10.2. The transformation updates system prompts and simplifies implementation suggestions while maintaining complete API backward compatibility.

## Prerequisites

✅ **Repository Setup**:
- Framework MCP v2.0.0 codebase
- Node.js + TypeScript environment
- Existing validation scripts available

✅ **Template Source**:
- Safeguard 10.2 updated with desired standardization pattern
- Five capability prompts with new objective templates
- Simplified guidelines ("Future Use") and output format

## Quick Implementation Steps

### Step 1: Create Transformation Script (10 minutes)

```bash
# Create the standardization script
touch scripts/standardize-prompts.ts
```

**Script Structure**:
```typescript
// Core functions needed:
// 1. extractTemplate() - Get pattern from 10.2
// 2. applyTemplate() - Apply to other safeguards
// 3. validateTransformation() - Verify results

// Key transformations:
// - Update system prompt objectives with templates
// - Replace guidelines with ["Future Use"]
// - Simplify implementation suggestions
// - Preserve core requirements unchanged
```

### Step 2: Extract Template Pattern (5 minutes)

```typescript
// Target the standardized structure from 10.2:
const template = {
  objectiveTemplates: {
    Full: "The vendor has been mapped to FULL... Assess whether their answer CLEARLY educates...",
    Partial: "The vendor has been mapped to PARTIAL... Assess whether their answer CLEARLY educates...",
    // ... other capability templates
  },
  guidelines: ["Future Use"],
  outputFormat: "Provide a structured assessment, confidence score, and evidence summary"
};
```

### Step 3: Apply Transformation (10 minutes)

```bash
# Run the standardization script
npm run standardize-prompts --validate
```

**Expected Output**:
```
✅ Extracting template from safeguard 10.2...
✅ Processing 152 safeguards (excluding 10.2)...
✅ Applied standardized objectives to 765 prompts (153 × 5)...
✅ Simplified implementation suggestions across 152 safeguards...
✅ Preserved core requirements unchanged for all safeguards...
✅ Validation: 100% template compliance achieved
```

### Step 4: Verification (5 minutes)

```bash
# Verify compilation
npm run build

# Run existing validation
node scripts/validate-capability-prompts.js

# Test API responses
curl localhost:8080/api/safeguards/1.1 | jq '.systemPromptFull.guidelines'
# Expected: ["Future Use"]
```

## Example: Before vs After

### Before (Original Structure)
```typescript
"1.1": {
  systemPromptFull: {
    role: "asset_inventory_expert",
    context: "You are evaluating...",
    objective: "Determine if a vendor solution provides...",
    guidelines: [
      "Verify asset discovery capabilities...",
      "Confirm inventory management...",
      "Validate comprehensive coverage...",
      // ... 4 more detailed guidelines
    ],
    outputFormat: "Provide structured assessment with capability level (FULL/PARTIAL/FACILITATES/GOVERNANCE/VALIDATES), confidence score, and evidence summary"
  },
  implementationSuggestions: [
    "asset discovery tools",
    "inventory management systems",
    "configuration management databases",
    "network scanning solutions",
    "automated discovery agents",
    "centralized asset repositories"
  ]
}
```

### After (Standardized Structure)
```typescript
"1.1": {
  systemPromptFull: {
    role: "asset_inventory_expert",           // PRESERVED
    context: "You are evaluating...",        // PRESERVED
    objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.", // STANDARDIZED
    guidelines: ["Future Use"],              // STANDARDIZED
    outputFormat: "Provide a structured assessment, confidence score, and evidence summary" // SIMPLIFIED
  },
  implementationSuggestions: [
    "asset discovery and inventory management solutions", // SIMPLIFIED (1-3 items)
    "automated asset tracking systems",
    "configuration management tools"
  ]
}
```

## Validation Checklist

**✅ Structural Integrity**:
- [ ] All 153 safeguards present
- [ ] Five system prompts per safeguard maintained
- [ ] TypeScript compilation succeeds
- [ ] API endpoints return expected structure

**✅ Template Compliance**:
- [ ] All objectives use standardized capability templates
- [ ] All guidelines equal ["Future Use"]
- [ ] All outputFormat fields simplified
- [ ] Implementation suggestions contain 1-3 items

**✅ API Compatibility**:
- [ ] HTTP API endpoints unchanged
- [ ] MCP tool responses unchanged
- [ ] Response structure identical
- [ ] Existing tests pass

## Troubleshooting

### Common Issues

**TypeScript Compilation Errors**:
```bash
# Usually indicates missing/invalid transformation
npm run build
# Check for syntax errors in updated safeguards
```

**Validation Failures**:
```bash
# Run validation with verbose output
node scripts/validate-capability-prompts.js --verbose
# Look for specific safeguards missing template compliance
```

**API Response Changes**:
```bash
# Compare before/after API responses
curl localhost:8080/api/safeguards/1.1 | jq 'keys'
# Should match original structure exactly
```

### Recovery Options

**Rollback Procedure**:
```bash
# If transformation fails, restore from backup
git checkout HEAD~1 -- src/core/safeguard-manager.ts
npm run build
```

**Partial Fix**:
```bash
# Re-run transformation for specific safeguards
npm run standardize-prompts --target 1.1 --validate
```

## Success Confirmation

**Final Verification Commands**:
```bash
# Confirm all transformations applied
npm run build && npm test
node scripts/validate-capability-prompts.js
curl localhost:8080/api/safeguards | jq '.total'  # Should be 153
curl localhost:8080/api/safeguards/10.2 | jq '.systemPromptFull.guidelines[0]'  # Should be "Future Use"
```

**Expected Results**:
- ✅ All 153 safeguards have standardized prompt structure
- ✅ API maintains backward compatibility
- ✅ Implementation suggestions simplified
- ✅ Core requirements preserved unchanged
- ✅ Zero breaking changes to existing integrations

## Next Steps After Implementation

1. **Performance Testing**: Verify API response times unchanged
2. **Documentation Update**: Update any internal documentation referencing prompt structure
3. **Monitoring**: Watch for any consumer issues (should be none due to compatibility)
4. **Future Customization**: Guidelines field now ready for future capability-specific content

**Estimated Total Time**: 30 minutes for complete implementation and validation