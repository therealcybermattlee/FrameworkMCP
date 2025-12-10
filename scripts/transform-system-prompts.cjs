#!/usr/bin/env node

/**
 * Transform single systemPrompt to five capability-specific prompts
 * This script reads the current safeguard-manager.ts file and transforms
 * each systemPrompt to five capability-specific fields
 */

const fs = require('fs');
const path = require('path');

const SAFEGUARD_MANAGER_PATH = path.join(__dirname, '../src/core/safeguard-manager.ts');

function transformSystemPrompts() {
  console.log('🔄 Starting system prompt transformation...');

  // Read the current file
  let content = fs.readFileSync(SAFEGUARD_MANAGER_PATH, 'utf8');

  // Pattern to match systemPrompt objects
  const systemPromptRegex = /(\s+)systemPrompt:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/gs;

  let matchCount = 0;

  // Replace each systemPrompt with five capability-specific prompts
  content = content.replace(systemPromptRegex, (match, indent, promptContent) => {
    matchCount++;

    // Extract the properties from the systemPrompt
    const roleMatch = promptContent.match(/role:\s*"([^"]+)"/);
    const contextMatch = promptContent.match(/context:\s*"([^"]+)"/);
    const objectiveMatch = promptContent.match(/objective:\s*"([^"]+)"/);
    const guidelinesMatch = promptContent.match(/guidelines:\s*\[([\s\S]*?)\]/);
    const outputFormatMatch = promptContent.match(/outputFormat:\s*"([^"]+)"/);

    if (!roleMatch || !contextMatch || !objectiveMatch || !guidelinesMatch || !outputFormatMatch) {
      console.warn(`⚠️  Could not parse systemPrompt in match ${matchCount}`);
      return match; // Return unchanged if we can't parse
    }

    const role = roleMatch[1];
    const context = contextMatch[1];
    const objective = objectiveMatch[1];
    const guidelines = guidelinesMatch[1];
    const outputFormat = outputFormatMatch[1];

    // Create five capability-specific prompts with identical content initially
    const capabilityPrompts = [
      'systemPromptFull',
      'systemPromptPartial',
      'systemPromptFacilitates',
      'systemPromptGovernance',
      'systemPromptValidates'
    ].map(fieldName => {
      return `${indent}${fieldName}: {
${indent}  role: "${role}",
${indent}  context: "${context}",
${indent}  objective: "${objective}",
${indent}  guidelines: [${guidelines}],
${indent}  outputFormat: "${outputFormat}"
${indent}}`;
    }).join(',\n');

    return capabilityPrompts;
  });

  // Write the transformed content back
  fs.writeFileSync(SAFEGUARD_MANAGER_PATH, content, 'utf8');

  console.log(`✅ Transformation complete! Processed ${matchCount} systemPrompt objects.`);
  console.log('📁 Updated file: src/core/safeguard-manager.ts');
}

// Run the transformation
try {
  transformSystemPrompts();
} catch (error) {
  console.error('❌ Error during transformation:', error.message);
  process.exit(1);
}