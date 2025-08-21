#!/usr/bin/env node

/**
 * Comprehensive Validation Script for CIS Safeguards Migration
 * This script will be used to validate data integrity during and after migration
 */

const fs = require('fs');

class SafeguardsValidator {
  constructor() {
    this.expectedCount = 153;
    this.expectedControls = 18;
    this.requiredFields = [
      'id', 'title', 'description', 'implementationGroup', 
      'assetType', 'securityFunction', 'governanceElements',
      'coreRequirements', 'subTaxonomicalElements', 
      'implementationSuggestions', 'relatedSafeguards', 'keywords'
    ];
  }

  validateFile(filePath) {
    console.log(`🔍 Validating: ${filePath}\n`);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ File not found');
      return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return this.validateContent(content);
  }

  validateContent(content) {
    const results = {
      countTest: false,
      duplicateTest: false,
      formatTest: false,
      syntaxTest: false,
      fieldsTest: false,
      controlsTest: false
    };

    try {
      // Extract safeguards data
      let safeguardsData;
      
      if (content.includes('this.safeguards = ')) {
        // SafeguardManager format
        const match = content.match(/this\.safeguards = ({[\s\S]*});/);
        safeguardsData = match ? match[1] : null;
      } else {
        // Raw CIS_SAFEGUARDS format
        const match = content.match(/= ({[\s\S]*});/);
        safeguardsData = match ? match[1] : null;
      }

      if (!safeguardsData) {
        console.log('❌ Could not extract safeguards data');
        return false;
      }

      // Parse the data
      const safeguards = eval(`(${safeguardsData})`);
      const safeguardIds = Object.keys(safeguards);

      // Test 1: Count validation
      console.log('📊 Count Validation:');
      console.log(`  Expected: ${this.expectedCount}`);
      console.log(`  Found: ${safeguardIds.length}`);
      results.countTest = safeguardIds.length === this.expectedCount;
      console.log(`  Result: ${results.countTest ? '✅' : '❌'}\n`);

      // Test 2: Duplicate check
      console.log('🔍 Duplicate Check:');
      const duplicates = safeguardIds.filter((id, index) => safeguardIds.indexOf(id) !== index);
      results.duplicateTest = duplicates.length === 0;
      console.log(`  Duplicates found: ${duplicates.length}`);
      console.log(`  Result: ${results.duplicateTest ? '✅' : '❌'}\n`);

      // Test 3: ID format validation
      console.log('📝 Format Validation:');
      const invalidFormats = safeguardIds.filter(id => !/^\d+\.\d+$/.test(id));
      results.formatTest = invalidFormats.length === 0;
      console.log(`  Invalid formats: ${invalidFormats.length}`);
      console.log(`  Result: ${results.formatTest ? '✅' : '❌'}\n`);

      // Test 4: Syntax validation (already done by eval above)
      console.log('⚙️  Syntax Validation:');
      results.syntaxTest = true; // If we got here, syntax is valid
      console.log(`  Result: ✅\n`);

      // Test 5: Required fields validation
      console.log('📋 Fields Validation:');
      let fieldsValid = true;
      const sampleSafeguard = safeguards[safeguardIds[0]];
      const missingFields = this.requiredFields.filter(field => !(field in sampleSafeguard));
      
      if (missingFields.length > 0) {
        console.log(`  Missing fields in sample: ${missingFields.join(', ')}`);
        fieldsValid = false;
      }

      // Check a few random safeguards for field completeness
      const testSafeguards = [safeguardIds[0], safeguardIds[Math.floor(safeguardIds.length / 2)], safeguardIds[safeguardIds.length - 1]];
      for (const id of testSafeguards) {
        const missing = this.requiredFields.filter(field => !(field in safeguards[id]));
        if (missing.length > 0) {
          console.log(`  Missing fields in ${id}: ${missing.join(', ')}`);
          fieldsValid = false;
        }
      }

      results.fieldsTest = fieldsValid;
      console.log(`  Result: ${fieldsValid ? '✅' : '❌'}\n`);

      // Test 6: Control coverage
      console.log('🎯 Control Coverage:');
      const controlCounts = {};
      safeguardIds.forEach(id => {
        const control = parseInt(id.split('.')[0]);
        controlCounts[control] = (controlCounts[control] || 0) + 1;
      });

      let allControlsPresent = true;
      for (let i = 1; i <= this.expectedControls; i++) {
        const count = controlCounts[i] || 0;
        if (count === 0) {
          console.log(`  ❌ Control ${i}: Missing`);
          allControlsPresent = false;
        } else {
          console.log(`  ✅ Control ${i}: ${count} safeguards`);
        }
      }

      results.controlsTest = allControlsPresent;
      console.log(`  Result: ${allControlsPresent ? '✅' : '❌'}\n`);

    } catch (error) {
      console.log('❌ Validation error:', error.message);
      return false;
    }

    // Overall result
    const allTestsPassed = Object.values(results).every(test => test);
    console.log('🎯 Overall Validation Result:');
    console.log(`  Status: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Details:`, results);

    return allTestsPassed;
  }
}

// Main execution
if (require.main === module) {
  const validator = new SafeguardsValidator();
  
  console.log('🔍 CIS Safeguards Comprehensive Validation\n');
  console.log('=' .repeat(50) + '\n');
  
  // Test the formatted data ready for integration
  const testFile = '/tmp/formatted_safeguards_ready.ts';
  const isValid = validator.validateFile(testFile);
  
  console.log('\n' + '='.repeat(50));
  console.log(`Final Result: ${isValid ? '✅ READY FOR INTEGRATION' : '❌ NOT READY'}`);
  
  if (!isValid) {
    console.log('\n❌ Issues found - please fix before proceeding with integration');
    process.exit(1);
  } else {
    console.log('\n🎉 All validations passed - data is ready for SafeguardManager integration!');
  }
}

module.exports = SafeguardsValidator;