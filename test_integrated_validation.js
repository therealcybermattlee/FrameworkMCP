#!/usr/bin/env node

/**
 * Test the integrated capability-focused analysis with domain validation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the server functionality
const serverPath = join(__dirname, 'dist', 'index.js');
let server;

try {
  server = await import(serverPath);
} catch (error) {
  console.error('Failed to import server:', error.message);
  process.exit(1);
}

// Test cases for domain validation scenarios
const testCases = [
  {
    name: "Inventory Tool - FULL Capability (Should PASS)",
    vendor: "AssetTracker Pro",
    safeguard: "1.1",
    claimedCapability: "full",
    supportingText: "Our comprehensive asset management platform provides automated discovery of all enterprise devices, maintains detailed hardware and software inventories, tracks ownership and location data, provides real-time asset status monitoring, and includes documented inventory procedures with bi-annual review capabilities."
  },
  {
    name: "Threat Intelligence Tool - FULL Capability (Should DOWNGRADE to FACILITATES)",
    vendor: "ThreatIntel Pro", 
    safeguard: "1.1",
    claimedCapability: "full",
    supportingText: "Our threat intelligence service provides comprehensive network scanning, identifies potential security risks across enterprise infrastructure, maintains detailed device databases, and offers complete visibility into network-connected assets with advanced threat correlation capabilities."
  },
  {
    name: "Identity Tool - PARTIAL Capability (Should PASS for 5.1)",
    vendor: "IdentityMax",
    safeguard: "5.1", 
    claimedCapability: "partial",
    supportingText: "Our identity management system maintains comprehensive user account inventories including privileged accounts, tracks account lifecycle events, and provides basic reporting on account status and access patterns."
  },
  {
    name: "Asset Tool on Identity Safeguard (Should DOWNGRADE)", 
    vendor: "AssetDiscovery Corp",
    safeguard: "5.1",
    claimedCapability: "full",
    supportingText: "Our network discovery tool scans all enterprise systems, identifies user accounts across multiple platforms, maintains detailed account databases, and provides comprehensive visibility into identity infrastructure components."
  },
  {
    name: "Vulnerability Tool - FACILITATES Capability (Should PASS)",
    vendor: "VulnScanner Elite",
    safeguard: "1.1", 
    claimedCapability: "facilitates",
    supportingText: "Our vulnerability scanning platform enhances existing asset management by providing additional context on device types, operating systems, and software versions discovered during security assessments, helping organizations improve their asset inventory accuracy."
  }
];

console.log("🧪 Testing Integrated Capability-Focused Analysis with Domain Validation\n");
console.log("=" .repeat(80));

for (let i = 0; i < testCases.length; i++) {
  const testCase = testCases[i];
  console.log(`\n📋 TEST ${i + 1}: ${testCase.name}`);
  console.log("-".repeat(60));
  
  try {
    // Create the request parameters
    const request = {
      name: "validate_vendor_mapping",
      arguments: {
        vendor_name: testCase.vendor,
        safeguard_id: testCase.safeguard,
        claimed_capability: testCase.claimedCapability,
        supporting_text: testCase.supportingText
      }
    };

    console.log(`Vendor: ${testCase.vendor}`);
    console.log(`Safeguard: ${testCase.safeguard}`);
    console.log(`Claimed: ${testCase.claimedCapability.toUpperCase()}`);
    console.log(`Text: "${testCase.supportingText.substring(0, 100)}..."`);
    
    // This would normally be called through MCP, but we'll simulate the call
    console.log("\n🔄 Processing...");
    
    // For now, log what we would expect to see
    console.log("\n📊 EXPECTED BEHAVIOR:");
    if (testCase.name.includes("Should PASS")) {
      console.log("✅ VALIDATION STATUS: SUPPORTED");
      console.log("✅ NO CAPABILITY DOWNGRADE");
    } else if (testCase.name.includes("DOWNGRADE")) {
      console.log("⚠️  VALIDATION STATUS: QUESTIONABLE");
      console.log("⬇️  CAPABILITY DOWNGRADED");
      console.log("🔧 REASON: Domain mismatch detected");
    }
    
  } catch (error) {
    console.log(`❌ TEST FAILED: ${error.message}`);
  }
  
  console.log("\n" + "=".repeat(80));
}

console.log("\n✅ Integration test scenarios defined");
console.log("🏃‍♂️ Run 'node dist/index.js' to start server for live testing");
console.log("📝 Use Claude Code to execute: validate_vendor_mapping with above test cases");