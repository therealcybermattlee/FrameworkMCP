#!/usr/bin/env node

/**
 * Data Structure Analysis Script
 * Compares original CIS_SAFEGUARDS with current SafeguardManager interface
 */

const fs = require('fs');

console.log('📊 CIS Safeguards Data Structure Analysis\n');

// Read original data
const originalData = fs.readFileSync('/tmp/complete_cis_safeguards.ts', 'utf8');
console.log('✅ Original data loaded:', originalData.split('\n').length, 'lines');

// Extract safeguard structure from first entry (1.1)
const match = originalData.match(/"1\.1":\s*{([^}]+(?:{[^}]*}[^}]*)*)/);
if (match) {
  console.log('✅ Successfully parsed safeguard 1.1 structure\n');
  
  // Extract field names from original data
  const fieldPattern = /(\w+):/g;
  const originalFields = new Set();
  let fieldMatch;
  
  while ((fieldMatch = fieldPattern.exec(match[1])) !== null) {
    originalFields.add(fieldMatch[1]);
  }
  
  console.log('📋 Original fields found:');
  Array.from(originalFields).sort().forEach(field => {
    console.log(`  - ${field}`);
  });
  
  // Required fields for SafeguardElement interface
  const requiredFields = [
    'id',
    'title', 
    'description',
    'implementationGroup',
    'assetType',
    'securityFunction',
    'governanceElements',
    'coreRequirements',
    'subTaxonomicalElements', 
    'implementationSuggestions',
    'relatedSafeguards',
    'keywords'
  ];
  
  console.log('\n📋 Required SafeguardElement fields:');
  requiredFields.forEach(field => {
    const present = originalFields.has(field);
    console.log(`  ${present ? '✅' : '❌'} ${field}`);
  });
  
  // Check for extra fields
  const extraFields = Array.from(originalFields).filter(f => !requiredFields.includes(f));
  if (extraFields.length > 0) {
    console.log('\n⚠️  Extra fields in original data:');
    extraFields.forEach(field => console.log(`  - ${field}`));
  }
  
  console.log('\n📊 Compatibility Analysis:');
  const missingFields = requiredFields.filter(f => !originalFields.has(f));
  if (missingFields.length === 0) {
    console.log('✅ Perfect compatibility - all required fields present');
  } else {
    console.log('❌ Missing fields:', missingFields);
  }
  
} else {
  console.log('❌ Failed to parse safeguard structure');
}