#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PromptStandardizer {
  constructor() {
    this.safeguardManagerPath = path.join(__dirname, '..', 'src/core/safeguard-manager.ts');
    this.backupPath = `${this.safeguardManagerPath}.backup.${Date.now()}`;
    this.dryRun = false;
    this.verbose = false;
  }

  /**
   * Extract template objectives from safeguard 10.2
   */
  extractTemplateObjectives() {
    const content = fs.readFileSync(this.safeguardManagerPath, 'utf-8');

    // Find safeguard 10.2 and extract the objectives
    const safeguard10_2Match = content.match(/"10\.2":\s*{[\s\S]*?systemPromptValidates:\s*{[\s\S]*?}\s*}/);
    if (!safeguard10_2Match) {
      throw new Error('Could not find safeguard 10.2 definition');
    }

    const safeguard10_2Text = safeguard10_2Match[0];

    // Extract objectives for each capability
    const extractObjective = (capability) => {
      const regex = new RegExp(`systemPrompt${capability}:[\\s\\S]*?objective:\\s*"([^"]*)"`, 'i');
      const match = safeguard10_2Text.match(regex);
      if (!match) {
        throw new Error(`Could not find ${capability} objective in safeguard 10.2`);
      }
      return match[1];
    };

    const template = {
      Full: extractObjective('Full'),
      Partial: extractObjective('Partial'),
      Facilitates: extractObjective('Facilitates'),
      Governance: extractObjective('Governance'),
      Validates: extractObjective('Validates')
    };

    if (this.verbose) {
      console.log('📋 Extracted template objectives:');
      Object.entries(template).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.substring(0, 80)}...`);
      });
    }

    return template;
  }

  /**
   * Apply standardization using global replacements
   */
  standardizeContent(template) {
    let content = fs.readFileSync(this.safeguardManagerPath, 'utf-8');
    let totalReplacements = 0;

    // Track changes
    const stats = {
      objectiveReplacements: 0,
      guidelineReplacements: 0,
      outputFormatReplacements: 0,
      implementationSimplifications: 0
    };

    // Step 1: Replace all objectives with template objectives
    const capabilities = ['Full', 'Partial', 'Facilitates', 'Governance', 'Validates'];

    for (const capability of capabilities) {
      const templateObjective = template[capability];

      // Replace all objectives for this capability (excluding 10.2)
      const objectiveRegex = new RegExp(
        `(systemPrompt${capability}:[\\s\\S]*?objective:\\s*)"[^"]*"`,
        'g'
      );

      let matches = 0;
      content = content.replace(objectiveRegex, (match, prefix, offset) => {
        // Skip if this is within safeguard 10.2
        const before = content.substring(Math.max(0, offset - 500), offset);
        if (before.includes('"10.2":')) {
          return match; // Don't replace template safeguard
        }
        matches++;
        return `${prefix}"${templateObjective}"`;
      });

      stats.objectiveReplacements += matches;
      if (this.verbose && matches > 0) {
        console.log(`  ✅ Updated ${matches} ${capability} objectives`);
      }
    }

    // Step 2: Replace all guidelines with ["Future Use"] (excluding 10.2)
    const guidelineRegex = /(systemPrompt(?:Full|Partial|Facilitates|Governance|Validates):[\s\S]*?guidelines:\s*)\[[\s\S]*?\]/g;

    content = content.replace(guidelineRegex, (match, prefix, offset) => {
      // Skip if this is within safeguard 10.2
      const before = content.substring(Math.max(0, offset - 500), offset);
      if (before.includes('"10.2":')) {
        return match; // Don't replace template safeguard
      }
      stats.guidelineReplacements++;
      return `${prefix}[\n        "Future Use"\n      ]`;
    });

    // Step 3: Replace all outputFormat with standardized version (excluding 10.2)
    const outputFormatRegex = /(systemPrompt(?:Full|Partial|Facilitates|Governance|Validates):[\s\S]*?outputFormat:\s*)"[^"]*"/g;
    const standardOutputFormat = 'Provide a structured assessment, confidence score, and evidence summary';

    content = content.replace(outputFormatRegex, (match, prefix, offset) => {
      // Skip if this is within safeguard 10.2
      const before = content.substring(Math.max(0, offset - 500), offset);
      if (before.includes('"10.2":')) {
        return match; // Don't replace template safeguard
      }
      stats.outputFormatReplacements++;
      return `${prefix}"${standardOutputFormat}"`;
    });

    // Step 4: Simplify implementation suggestions (excluding 10.2)
    const implRegex = /(implementationSuggestions:\s*\[\s*)((?:\s*"[^"]*",?\s*)+)(\s*\])/g;

    content = content.replace(implRegex, (match, prefix, suggestions, suffix, offset) => {
      // Skip if this is within safeguard 10.2
      const before = content.substring(Math.max(0, offset - 500), offset);
      if (before.includes('"10.2":')) {
        return match; // Don't replace template safeguard
      }

      // Extract individual suggestions
      const suggestionMatches = suggestions.match(/"[^"]+"/g) || [];

      if (suggestionMatches.length > 3) {
        stats.implementationSimplifications++;
        const simplified = suggestionMatches.slice(0, 3).join(',\n      ');
        return `${prefix} // Gray - Implementation suggestions\n      ${simplified}\n    ${suffix}`;
      }

      return match; // Keep as is if 3 or fewer suggestions
    });

    if (this.verbose) {
      console.log('📊 Transformation statistics:');
      console.log(`  - Objective replacements: ${stats.objectiveReplacements}`);
      console.log(`  - Guideline replacements: ${stats.guidelineReplacements}`);
      console.log(`  - Output format replacements: ${stats.outputFormatReplacements}`);
      console.log(`  - Implementation simplifications: ${stats.implementationSimplifications}`);
    }

    return { content, stats };
  }

  /**
   * Create backup of original safeguard-manager.ts
   */
  createBackup() {
    if (this.verbose) {
      console.log(`📁 Creating backup: ${this.backupPath}`);
    }
    fs.copyFileSync(this.safeguardManagerPath, this.backupPath);
  }

  /**
   * Save updated content
   */
  saveContent(content) {
    if (this.dryRun) {
      console.log('🔍 DRY RUN: Would save updated content to file');
      return;
    }

    if (this.verbose) {
      console.log('💾 Saving updated content...');
    }

    fs.writeFileSync(this.safeguardManagerPath, content);

    if (this.verbose) {
      console.log('✅ File saved successfully');
    }
  }

  /**
   * Validate transformation results
   */
  validateTransformation(content) {
    if (this.verbose) {
      console.log('🔍 Validating transformation...');
    }

    let isValid = true;
    const errors = [];

    // Count "Future Use" guidelines
    const futureUseMatches = content.match(/guidelines:\s*\[\s*"Future Use"\s*\]/g);
    const futureUseCount = futureUseMatches ? futureUseMatches.length : 0;

    // Expected: 153 safeguards × 5 capabilities = 765
    // But safeguard 10.2 already has 5, so we should see 760 from transformation + 5 existing = 765 total
    const expectedTotal = 765;

    if (futureUseCount !== expectedTotal) {
      errors.push(`Expected ${expectedTotal} "Future Use" guidelines, found ${futureUseCount}`);
      isValid = false;
    }

    // Count standardized output formats
    const outputFormatMatches = content.match(/outputFormat:\s*"Provide a structured assessment, confidence score, and evidence summary"/g);
    const outputFormatCount = outputFormatMatches ? outputFormatMatches.length : 0;

    if (outputFormatCount !== expectedTotal) {
      errors.push(`Expected ${expectedTotal} standardized output formats, found ${outputFormatCount}`);
      isValid = false;
    }

    // Verify template objectives are applied
    const fullObjectiveMatches = content.match(/The vendor has taken an assessment and has been mapped to FULL.*?FULLY\./g);
    const fullObjectiveCount = fullObjectiveMatches ? fullObjectiveMatches.length : 0;

    if (fullObjectiveCount !== 153) {
      errors.push(`Expected 153 FULL template objectives, found ${fullObjectiveCount}`);
      isValid = false;
    }

    if (errors.length > 0) {
      console.error('❌ Validation errors:');
      errors.forEach(error => console.error(`  - ${error}`));
    } else {
      console.log('✅ Validation passed: All transformations applied successfully');
    }

    return isValid;
  }

  /**
   * Main transformation process
   */
  async run(options = {}) {
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;

    try {
      console.log('🚀 Starting prompt standardization...');

      // Create backup unless dry run
      if (!this.dryRun) {
        this.createBackup();
      }

      // Extract template objectives from 10.2
      console.log('📋 Extracting template from safeguard 10.2...');
      const template = this.extractTemplateObjectives();

      // Apply standardization
      console.log('🔄 Applying standardization to all safeguards (excluding 10.2)...');
      const { content, stats } = this.standardizeContent(template);

      // Validate if requested
      if (options.validate) {
        const isValid = this.validateTransformation(content);
        if (!isValid) {
          throw new Error('Validation failed - transformation incomplete');
        }
      }

      // Save results
      this.saveContent(content);

      console.log('🎉 Standardization complete!');
      console.log('📊 Summary:');
      console.log(`  - Objective updates: ${stats.objectiveReplacements}`);
      console.log(`  - Guideline standardizations: ${stats.guidelineReplacements}`);
      console.log(`  - Output format standardizations: ${stats.outputFormatReplacements}`);
      console.log(`  - Implementation simplifications: ${stats.implementationSimplifications}`);
      if (!this.dryRun) {
        console.log(`  - Backup: ${this.backupPath}`);
      }

    } catch (error) {
      console.error('❌ Error during standardization:', error);
      process.exit(1);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    validate: args.includes('--validate'),
    verbose: args.includes('--verbose')
  };

  if (args.includes('--help')) {
    console.log(`
Usage: npm run standardize-prompts [options]

Options:
  --dry-run    Show what would be changed without making actual changes
  --validate   Run validation after transformation
  --verbose    Show detailed progress information
  --help       Show this help message

Examples:
  npm run standardize-prompts --dry-run --verbose
  npm run standardize-prompts --validate --verbose
`);
    process.exit(0);
  }

  const standardizer = new PromptStandardizer();
  standardizer.run(options).catch(console.error);
}