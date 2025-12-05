#!/usr/bin/env node

/**
 * Validate that all 153 safeguards have complete capability-specific prompts
 * This script verifies the transformation was successful
 */

import { SafeguardManager } from '../dist/core/safeguard-manager.js';

function validateCapabilityPrompts() {
  console.log('🔍 Starting capability prompt validation...');

  const safeguardManager = new SafeguardManager();
  const allSafeguards = safeguardManager.getAllSafeguards();
  const safeguardIds = Object.keys(allSafeguards);

  console.log(`📊 Found ${safeguardIds.length} safeguards to validate`);

  const expectedFields = [
    'systemPromptFull',
    'systemPromptPartial',
    'systemPromptFacilitates',
    'systemPromptGovernance',
    'systemPromptValidates'
  ];

  const requiredSubfields = ['role', 'context', 'objective', 'guidelines', 'outputFormat'];

  let totalValidated = 0;
  let errors = [];

  for (const safeguardId of safeguardIds) {
    const safeguard = allSafeguards[safeguardId];

    // Check if all five capability prompts exist
    for (const field of expectedFields) {
      if (!safeguard[field]) {
        errors.push(`❌ ${safeguardId}: Missing ${field}`);
        continue;
      }

      // Check if each prompt has the required structure
      const prompt = safeguard[field];
      for (const subfield of requiredSubfields) {
        if (!prompt[subfield]) {
          errors.push(`❌ ${safeguardId}.${field}: Missing ${subfield}`);
        }

        if (subfield === 'guidelines' && (!Array.isArray(prompt[subfield]) || prompt[subfield].length === 0)) {
          errors.push(`❌ ${safeguardId}.${field}: Guidelines must be non-empty array`);
        }

        if (subfield !== 'guidelines' && (!prompt[subfield] || typeof prompt[subfield] !== 'string')) {
          errors.push(`❌ ${safeguardId}.${field}: ${subfield} must be non-empty string`);
        }
      }
    }

    // Check that old systemPrompt field is gone
    if ('systemPrompt' in safeguard) {
      errors.push(`❌ ${safeguardId}: Deprecated systemPrompt field still exists`);
    }

    totalValidated++;
  }

  // Report results
  console.log(`\n📊 Validation Results:`);
  console.log(`✅ Safeguards validated: ${totalValidated}`);
  console.log(`❌ Errors found: ${errors.length}`);

  if (errors.length > 0) {
    console.log(`\n🚨 Validation Errors:`);
    errors.forEach(error => console.log(error));
    process.exit(1);
  } else {
    console.log(`\n🎉 All ${totalValidated} safeguards have complete capability-specific prompts!`);
    console.log(`✅ All safeguards properly transformed`);
    console.log(`✅ No deprecated systemPrompt fields found`);
    console.log(`✅ All capability prompts have complete structure`);
  }
}

// Validate specific prompt structure
function validatePromptStructure(prompt, safeguardId, fieldName) {
  const requiredFields = ['role', 'context', 'objective', 'guidelines', 'outputFormat'];
  const errors = [];

  for (const field of requiredFields) {
    if (!prompt[field]) {
      errors.push(`Missing ${field}`);
    } else if (field === 'guidelines') {
      if (!Array.isArray(prompt[field]) || prompt[field].length === 0) {
        errors.push(`Guidelines must be non-empty array`);
      }
    } else if (typeof prompt[field] !== 'string' || prompt[field].trim() === '') {
      errors.push(`${field} must be non-empty string`);
    }
  }

  return errors;
}

// Export for testing
export { validateCapabilityPrompts, validatePromptStructure };

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  validateCapabilityPrompts();
}