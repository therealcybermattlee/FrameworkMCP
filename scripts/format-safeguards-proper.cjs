#!/usr/bin/env node

/**
 * Properly format CIS Safeguards data with readable indentation
 */

const fs = require('fs');

console.log('✨ Properly Formatting CIS Safeguards Data\n');

// Read original data  
const originalData = fs.readFileSync('/tmp/complete_cis_safeguards.ts', 'utf8');

// Extract just the safeguards object content (between the braces)
const match = originalData.match(/const CIS_SAFEGUARDS[^=]*=\s*({[\s\S]*});/);
if (!match) {
  console.log('❌ Failed to extract safeguards object');
  process.exit(1);
}

const safeguardsObject = match[1];

console.log('✅ Extracted safeguards object');

// Create properly formatted assignment for SafeguardManager
const formattedContent = `    // Complete CIS Controls v8.1 Framework - 153 safeguards across 18 controls
    // Migrated from original implementation on ${new Date().toISOString().split('T')[0]}
    this.safeguards = ${safeguardsObject};`;

// Write formatted data
fs.writeFileSync('/tmp/formatted_safeguards_ready.ts', formattedContent);

console.log('✅ Properly formatted data saved to /tmp/formatted_safeguards_ready.ts');

// Show preview of properly formatted data
const lines = formattedContent.split('\n');
console.log('\n📄 Preview (first 20 lines):');
lines.slice(0, 20).forEach((line, i) => console.log(`${i + 1}: ${line}`));
console.log('  ...');

console.log('\n📊 Final Statistics:');
console.log('  Lines:', lines.length);
console.log('  Size:', formattedContent.length, 'characters');
console.log('  Ready for direct integration into SafeguardManager ✅');