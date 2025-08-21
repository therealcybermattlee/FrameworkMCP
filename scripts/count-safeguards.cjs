#!/usr/bin/env node

/**
 * Safeguard Count and Validation Script
 */

const fs = require('fs');

console.log('🔢 CIS Safeguards Count and Validation\n');

const originalData = fs.readFileSync('/tmp/complete_cis_safeguards.ts', 'utf8');

// Extract all safeguard IDs using regex
const safeguardPattern = /"(\d+\.\d+)":\s*{/g;
const safeguardIds = [];
let match;

while ((match = safeguardPattern.exec(originalData)) !== null) {
  safeguardIds.push(match[1]);
}

console.log('📊 Safeguard Count Analysis:');
console.log(`  Total safeguards found: ${safeguardIds.length}`);

// Sort safeguards numerically
const sortedIds = safeguardIds.sort((a, b) => {
  const [aMajor, aMinor] = a.split('.').map(Number);
  const [bMajor, bMinor] = b.split('.').map(Number);
  return aMajor - bMajor || aMinor - bMinor;
});

console.log(`  First safeguard: ${sortedIds[0]}`);
console.log(`  Last safeguard: ${sortedIds[sortedIds.length - 1]}`);

// Check for duplicates
const duplicates = safeguardIds.filter((id, index) => safeguardIds.indexOf(id) !== index);
if (duplicates.length > 0) {
  console.log('❌ Duplicate safeguards found:', duplicates);
} else {
  console.log('✅ No duplicate safeguards');
}

// Group by control
const byControl = {};
sortedIds.forEach(id => {
  const control = id.split('.')[0];
  if (!byControl[control]) byControl[control] = [];
  byControl[control].push(id);
});

console.log('\n📋 Safeguards by Control:');
for (let i = 1; i <= 18; i++) {
  const controlSafeguards = byControl[i.toString()] || [];
  console.log(`  Control ${i}: ${controlSafeguards.length} safeguards`);
  if (controlSafeguards.length > 0) {
    console.log(`    Range: ${controlSafeguards[0]} - ${controlSafeguards[controlSafeguards.length - 1]}`);
  }
}

// Validate expected total
const expectedTotal = 153;
console.log('\n🎯 Validation Results:');
console.log(`  Expected: ${expectedTotal} safeguards`);
console.log(`  Found: ${safeguardIds.length} safeguards`);

if (safeguardIds.length === expectedTotal) {
  console.log('✅ Perfect count match!');
} else {
  console.log(`❌ Count mismatch: ${safeguardIds.length - expectedTotal} difference`);
}

// Check for missing controls
const missingControls = [];
for (let i = 1; i <= 18; i++) {
  if (!byControl[i.toString()] || byControl[i.toString()].length === 0) {
    missingControls.push(i);
  }
}

if (missingControls.length === 0) {
  console.log('✅ All 18 CIS Controls represented');
} else {
  console.log('❌ Missing controls:', missingControls);
}

console.log('\n📄 Sample safeguards:');
sortedIds.slice(0, 5).forEach(id => console.log(`  - ${id}`));
console.log('  ...');
sortedIds.slice(-5).forEach(id => console.log(`  - ${id}`));