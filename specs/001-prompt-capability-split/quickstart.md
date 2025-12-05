# Quick Start: System Prompt Capability Split

**Feature**: System Prompt Capability Split
**Version**: 2.0.0
**Breaking Change**: Yes - Migration Required

## Overview

The Framework MCP API has been updated to provide capability-specific system prompts for each CIS safeguard. Instead of a single `systemPrompt` field, each safeguard now contains five specialized prompts tailored to different capability evaluation levels.

## What Changed

### Before (v1.x)
```json
{
  "id": "1.1",
  "systemPrompt": { /* single prompt for all evaluations */ }
}
```

### After (v2.0)
```json
{
  "id": "1.1",
  "systemPromptFull": { /* prompt for full capability */ },
  "systemPromptPartial": { /* prompt for partial capability */ },
  "systemPromptFacilitates": { /* prompt for facilitates capability */ },
  "systemPromptGovernance": { /* prompt for governance capability */ },
  "systemPromptValidates": { /* prompt for validates capability */ }
}
```

## Migration Guide

### For API Consumers

1. **Update your field references**:
   ```typescript
   // Old way
   const prompt = safeguard.systemPrompt;

   // New way - choose the appropriate capability
   const prompt = safeguard.systemPromptFull;  // or other capability
   ```

2. **Handle the breaking change**:
   - The `systemPrompt` field no longer exists
   - You must select the appropriate capability-specific prompt
   - All five prompts are always present for backward compatibility

3. **Capability Types**:
   - `systemPromptFull` - Complete implementation of the safeguard
   - `systemPromptPartial` - Partial implementation capabilities
   - `systemPromptFacilitates` - Enables implementation by others
   - `systemPromptGovernance` - Policy and oversight capabilities
   - `systemPromptValidates` - Evidence and audit capabilities

### For MCP Clients

The MCP interface returns the same structure as the HTTP API:

```typescript
// MCP tool call
const result = await callTool('get_safeguard_details', {
  safeguardId: '1.1'
});

// Access capability-specific prompts
const fullPrompt = result.systemPromptFull;
const partialPrompt = result.systemPromptPartial;
// ... etc
```

## Quick Examples

### HTTP API Request
```bash
# Get a single safeguard with all capability prompts
curl https://your-api.com/api/safeguards/1.1

# Response includes all five capability prompts
{
  "id": "1.1",
  "title": "Establish and Maintain Detailed Enterprise Asset Inventory",
  "systemPromptFull": { ... },
  "systemPromptPartial": { ... },
  "systemPromptFacilitates": { ... },
  "systemPromptGovernance": { ... },
  "systemPromptValidates": { ... }
}
```

### Agent Integration
```python
# Python example for agent consuming the API
import requests

def evaluate_vendor_capability(safeguard_id, capability_type='full'):
    response = requests.get(f'https://api.example.com/api/safeguards/{safeguard_id}')
    safeguard = response.json()

    # Select the appropriate prompt based on capability type
    prompt_field = f'systemPrompt{capability_type.capitalize()}'
    system_prompt = safeguard[prompt_field]

    # Use the prompt for evaluation
    return ai_evaluate(system_prompt)
```

### TypeScript Integration
```typescript
interface SafeguardElement {
  id: string;
  title: string;
  // ... other fields
  systemPromptFull: SystemPromptStructure;
  systemPromptPartial: SystemPromptStructure;
  systemPromptFacilitates: SystemPromptStructure;
  systemPromptGovernance: SystemPromptStructure;
  systemPromptValidates: SystemPromptStructure;
}

// Usage
async function getSafeguardPrompt(
  safeguardId: string,
  capability: 'full' | 'partial' | 'facilitates' | 'governance' | 'validates'
): Promise<SystemPromptStructure> {
  const response = await fetch(`/api/safeguards/${safeguardId}`);
  const safeguard: SafeguardElement = await response.json();

  // Dynamic field access based on capability
  const fieldName = `systemPrompt${capability.charAt(0).toUpperCase() + capability.slice(1)}`;
  return safeguard[fieldName as keyof SafeguardElement];
}
```

## Testing Your Integration

1. **Verify all prompts are present**:
   ```bash
   # Should return 5 systemPrompt fields
   curl https://your-api.com/api/safeguards/1.1 | jq 'keys | map(select(startswith("systemPrompt"))) | length'
   # Expected output: 5
   ```

2. **Check field structure**:
   Each capability prompt maintains the same structure:
   - `role`: string
   - `context`: string
   - `objective`: string
   - `guidelines`: array of strings
   - `outputFormat`: string

3. **Validate all safeguards**:
   ```bash
   # Verify all 153 safeguards have the new structure
   curl https://your-api.com/api/safeguards | jq '.[].id' | wc -l
   # Expected output: 153
   ```

## FAQ

**Q: Why are all five prompts the same initially?**
A: Initially, the existing systemPrompt content is duplicated to all five fields to ensure backward compatibility. These will be customized per capability in future updates.

**Q: Can I still use a single prompt for all evaluations?**
A: Yes, you can choose to use just one capability prompt (e.g., systemPromptFull) for all evaluations if you don't need capability-specific behavior.

**Q: Will there be a deprecation period?**
A: No, this is a breaking change. The old systemPrompt field has been removed. Update your integrations before upgrading.

**Q: How do I know which capability prompt to use?**
A: Choose based on what you're evaluating:
- Vendor claims full implementation → use systemPromptFull
- Vendor provides partial features → use systemPromptPartial
- Tool helps others implement → use systemPromptFacilitates
- Solution provides governance → use systemPromptGovernance
- Product validates/audits → use systemPromptValidates

## Support

For questions or issues with the migration:
- GitHub Issues: https://github.com/therealcybermattlee/FrameworkMCP/issues
- Documentation: See `/docs` directory in the repository