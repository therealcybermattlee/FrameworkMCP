#!/usr/bin/env node

/**
 * Clean and format CIS Safeguards data for SafeguardManager compatibility
 */

const fs = require('fs');

console.log('🧹 Cleaning and Formatting CIS Safeguards Data\n');

// Read original data
const originalData = fs.readFileSync('/tmp/complete_cis_safeguards.ts', 'utf8');

// Extract just the object content (without const declaration and type annotation)
const objectMatch = originalData.match(/= {([\s\S]*)};\s*$/);
if (!objectMatch) {
  console.log('❌ Failed to extract object content');
  process.exit(1);
}

let objectContent = objectMatch[1];

console.log('✅ Extracted object content');

// Clean up the data:
// 1. Remove TypeScript comments that might break parsing
objectContent = objectContent.replace(/\/\/ [^\n\r]*/g, '');

// 2. Ensure consistent formatting
objectContent = objectContent.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').replace(/\s*:\s*/g, ':');

// 3. Add proper indentation for readability
const lines = objectContent.split('\n');
const indentedLines = lines.map((line, index) => {
  if (index === 0) return line; // First line stays as is
  return '    ' + line.trim(); // Indent other lines
});

objectContent = indentedLines.join('\n');

// Create the properly formatted safeguards object content
const cleanedContent = `    this.safeguards = {${objectContent}
    };`;

console.log('✅ Formatted for SafeguardManager integration');

// Write cleaned data to temporary file
fs.writeFileSync('/tmp/cleaned_safeguards_content.ts', cleanedContent);

console.log('✅ Cleaned data saved to /tmp/cleaned_safeguards_content.ts');

// Show a sample of the cleaned data
const preview = cleanedContent.substring(0, 500);
console.log('\n📄 Preview of cleaned data:');
console.log(preview + '...\n');

console.log('📊 Data Statistics:');
console.log('  Original size:', originalData.length, 'characters');
console.log('  Cleaned size:', cleanedContent.length, 'characters');
console.log('  Ready for SafeguardManager integration ✅');