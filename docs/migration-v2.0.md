# Migration Guide: Framework MCP v2.0

**Breaking Change**: System Prompt Capability Split

## Overview

Framework MCP v2.0 introduces a **breaking change** to the API response structure for CIS safeguards. The single `systemPrompt` field has been replaced with five capability-specific prompt fields to enable more granular and accurate vendor assessments.

## What Changed

### Before (v1.x)
```json
{
  "id": "1.1",
  "title": "Establish and Maintain Detailed Enterprise Asset Inventory",
  "systemPrompt": {
    "role": "asset_inventory_expert",
    "context": "You are evaluating enterprise asset inventory solutions...",
    "objective": "Determine if a vendor solution provides...",
    "guidelines": ["Verify coverage of all asset types...", "..."],
    "outputFormat": "Provide structured assessment..."
  }
}
```

### After (v2.0)
```json
{
  "id": "1.1",
  "title": "Establish and Maintain Detailed Enterprise Asset Inventory",
  "systemPromptFull": {
    "role": "asset_inventory_expert",
    "context": "You are evaluating enterprise asset inventory solutions...",
    "objective": "Determine if a vendor solution provides...",
    "guidelines": ["Verify coverage of all asset types...", "..."],
    "outputFormat": "Provide structured assessment..."
  },
  "systemPromptPartial": { /* same structure */ },
  "systemPromptFacilitates": { /* same structure */ },
  "systemPromptGovernance": { /* same structure */ },
  "systemPromptValidates": { /* same structure */ }
}
```

## Migration Steps

### 1. Update Code References

**Old code:**
```typescript
const prompt = safeguard.systemPrompt;
```

**New code:**
```typescript
// Choose the appropriate capability-specific prompt
const prompt = safeguard.systemPromptFull;  // or other capability type
```

### 2. Capability Types

Choose the appropriate prompt based on what you're evaluating:

| Capability | When to Use | Description |
|------------|-------------|-------------|
| `systemPromptFull` | Vendor claims complete implementation | Tool directly implements the entire safeguard |
| `systemPromptPartial` | Vendor provides limited features | Tool implements some aspects of the safeguard |
| `systemPromptFacilitates` | Tool enables others to implement | Solution helps or enhances implementation by others |
| `systemPromptGovernance` | Solution provides oversight | Tool provides policy, process, and oversight capabilities |
| `systemPromptValidates` | Product validates/audits | Tool provides evidence, audit, and validation reporting |

### 3. API Client Updates

#### HTTP API
```javascript
// Before
const response = await fetch('/api/safeguard/1.1');
const safeguard = await response.json();
const prompt = safeguard.systemPrompt;

// After
const response = await fetch('/api/safeguard/1.1');
const safeguard = await response.json();
const prompt = safeguard.systemPromptFull; // Choose appropriate capability
```

#### MCP Client
```python
# Before
result = await call_tool('get_safeguard_details', {'safeguard_id': '1.1'})
safeguard = json.loads(result.content[0].text)
prompt = safeguard['systemPrompt']

# After
result = await call_tool('get_safeguard_details', {'safeguard_id': '1.1'})
safeguard = json.loads(result.content[0].text)
prompt = safeguard['systemPromptFull']  # Choose appropriate capability
```

### 4. Dynamic Field Access

For applications that need to dynamically select capability types:

```typescript
function getCapabilityPrompt(
  safeguard: SafeguardElement,
  capability: 'full' | 'partial' | 'facilitates' | 'governance' | 'validates'
) {
  const fieldName = `systemPrompt${capability.charAt(0).toUpperCase() + capability.slice(1)}`;
  return safeguard[fieldName as keyof SafeguardElement];
}

// Usage
const prompt = getCapabilityPrompt(safeguard, 'full');
```

## Testing Your Migration

### 1. Verify Field Presence
```bash
# All safeguards should have 5 systemPrompt fields
curl https://your-api.com/api/safeguard/1.1 | jq 'keys | map(select(startswith("systemPrompt"))) | length'
# Expected output: 5
```

### 2. Check Field Structure
```bash
# Each prompt should maintain the same sub-structure
curl https://your-api.com/api/safeguard/1.1 | jq '.systemPromptFull | keys'
# Expected: ["context", "guidelines", "objective", "outputFormat", "role"]
```

### 3. Validate All Safeguards
```bash
# Confirm all 153 safeguards are properly transformed
curl https://your-api.com/api/safeguards | jq '. | length'
# Expected output: 153 (or however many exist in your deployment)
```

## Common Migration Patterns

### Single Evaluation Type
If you only need one evaluation type, simply use that specific field:

```typescript
// Always use full capability evaluation
const prompt = safeguard.systemPromptFull;
```

### Multi-Capability Evaluation
For comprehensive assessments that evaluate multiple capabilities:

```typescript
const capabilities = [
  { type: 'full', prompt: safeguard.systemPromptFull },
  { type: 'partial', prompt: safeguard.systemPromptPartial },
  { type: 'facilitates', prompt: safeguard.systemPromptFacilitates },
  { type: 'governance', prompt: safeguard.systemPromptGovernance },
  { type: 'validates', prompt: safeguard.systemPromptValidates }
];

for (const capability of capabilities) {
  const result = await evaluateVendor(capability.prompt, vendorData);
  // Process result for each capability type
}
```

### Backward Compatibility Layer
For gradual migration, you can create a compatibility layer:

```typescript
function getSystemPrompt(safeguard: SafeguardElement, capability?: string) {
  // Default to 'full' if no capability specified (backward compatibility)
  const cap = capability || 'full';
  const fieldName = `systemPrompt${cap.charAt(0).toUpperCase() + cap.slice(1)}`;
  return safeguard[fieldName as keyof SafeguardElement];
}

// Backward compatible usage
const prompt = getSystemPrompt(safeguard); // Uses 'full' by default
```

## FAQ

### Q: Are the prompt contents different between capability types?
**A:** Initially, all five capability prompts contain identical content from the original systemPrompt. This will be differentiated in future updates based on capability-specific requirements.

### Q: Can I still use just one prompt for all evaluations?
**A:** Yes, you can choose to use just one capability prompt (e.g., `systemPromptFull`) for all evaluations if you don't need capability-specific behavior.

### Q: Will there be a deprecation period for the old structure?
**A:** No, this is an immediate breaking change. The `systemPrompt` field has been completely removed. Update your integrations before upgrading to v2.0.

### Q: How do I choose which capability prompt to use?
**A:** Choose based on what type of capability you're evaluating:
- Full implementation → `systemPromptFull`
- Partial features → `systemPromptPartial`
- Enables others → `systemPromptFacilitates`
- Provides governance → `systemPromptGovernance`
- Validates/audits → `systemPromptValidates`

### Q: Do all safeguards have all five prompts?
**A:** Yes, all 153 CIS safeguards now include all five capability-specific prompts with complete structure.

## Support

For questions or assistance with the migration:
- GitHub Issues: https://github.com/therealcybermattlee/FrameworkMCP/issues
- Documentation: See `/docs` directory
- Quick Start: See `quickstart.md` for updated examples

## Version Compatibility

- **v1.x**: Uses single `systemPrompt` field
- **v2.0+**: Uses five capability-specific prompt fields
- **No backward compatibility**: This is a breaking change requiring code updates