#!/usr/bin/env node

/**
 * Validate formatted safeguards data for integration readiness
 */

const fs = require('fs');

console.log('🔍 Validating Formatted Safeguards Data\n');

// Read formatted data
const formattedData = fs.readFileSync('/tmp/formatted_safeguards_ready.ts', 'utf8');

// Extract safeguard IDs from formatted data
const idPattern = /"(\d+\.\d+)":\s*{/g;
const foundIds = [];
let match;

while ((match = idPattern.exec(formattedData)) !== null) {
  foundIds.push(match[1]);
}

console.log('📊 Validation Results:');
console.log(`  Safeguards found: ${foundIds.length}`);

// Check for duplicates
const duplicates = foundIds.filter((id, index) => foundIds.indexOf(id) !== index);
if (duplicates.length > 0) {
  console.log('❌ Duplicates found:', duplicates);
} else {
  console.log('✅ No duplicates');
}

// Validate ID format
const invalidIds = foundIds.filter(id => !/^\d+\.\d+$/.test(id));
if (invalidIds.length > 0) {
  console.log('❌ Invalid ID formats:', invalidIds);
} else {
  console.log('✅ All IDs follow X.Y format');
}

// Sort and check sequence
const sortedIds = foundIds.sort((a, b) => {
  const [aMajor, aMinor] = a.split('.').map(Number);
  const [bMajor, bMinor] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor;
});

console.log(`  ID range: ${sortedIds[0]} to ${sortedIds[sortedIds.length - 1]}`);

// Check control coverage
const controlCounts = {};
sortedIds.forEach(id => {
  const control = id.split('.')[0];
  controlCounts[control] = (controlCounts[control] || 0) + 1;
});

console.log('\n📋 Control Coverage:');
for (let i = 1; i <= 18; i++) {
  const count = controlCounts[i.toString()] || 0;
  console.log(`  Control ${i}: ${count} safeguards ${count === 0 ? '❌' : '✅'}`);
}

// Syntax validation - try to evaluate as JavaScript object
console.log('\n🔍 Syntax Validation:');
try {
  // Extract just the object part for validation
  const objectMatch = formattedData.match(/this\.safeguards = ({[\s\S]*});/);
  if (objectMatch) {
    // Basic syntax check by attempting to parse
    eval(`const testObj = ${objectMatch[1]}`);
    console.log('✅ Valid JavaScript object syntax');
    
    // Check if object has expected safeguard count
    eval(`const safeguardsCount = Object.keys(${objectMatch[1]}).length`);
    console.log(`✅ Object contains ${eval(`Object.keys(${objectMatch[1]}).length`)} properties`);
  } else {
    console.log('❌ Could not extract object for validation');
  }
} catch (error) {
  console.log('❌ Syntax validation failed:', error.message);
}

console.log('\n🎯 Final Validation Summary:');
console.log(`  Expected: 153 safeguards`);
console.log(`  Found: ${foundIds.length} safeguards`);
console.log(`  Match: ${foundIds.length === 153 ? '✅' : '❌'}`);
console.log(`  Ready for integration: ${foundIds.length === 153 && duplicates.length === 0 && invalidIds.length === 0 ? '✅' : '❌'}`);