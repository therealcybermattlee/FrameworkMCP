# Vendor Framework Analyzer MCP Server

[![npm version](https://badge.fury.io/js/framework-mcp.svg)](https://badge.fury.io/js/framework-mcp)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![GitHub](https://img.shields.io/github/stars/therealcybermattlee/FrameworkMCP?style=social)](https://github.com/therealcybermattlee/FrameworkMCP)
[![Website](https://img.shields.io/badge/Website-cyberrise.org-blue)](https://cyberrise.org)

A Model Context Protocol (MCP) server that analyzes vendor responses against the **CIS Controls Framework** using a 4-attribute methodology. This tool helps security professionals evaluate vendor capabilities against specific CIS Control safeguards with detailed sub-taxonomical analysis.

## 🎯 Purpose

This MCP server enables security teams to:
- **Analyze vendor responses** against specific CIS Control safeguards (1.1, 5.1, 6.3, etc.)
- **Validate coverage claims** (FULL/PARTIAL) with evidence-based assessment
- **Categorize vendor capabilities** across 4 key attributes: Governance, Facilitates, Coverage, and Validates
- **Generate detailed reports** showing sub-element coverage and compliance gaps

## 🔧 The 4 Analysis Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Governance** | GRC platform capabilities for policy/process management | Policy management, documented processes, compliance workflows |
| **Facilitates** | Enhancement capabilities that enable others to implement safeguards better/faster/stronger (does not perform safeguard directly) | Automation tools, optimization platforms, streamlined workflows |
| **Coverage** | Scope of safeguard elements directly addressed by tools that perform the safeguard (Full/Partial) | Percentage of sub-taxonomical elements actually implemented |
| **Validates** | Verification capabilities providing evidence and reporting | Audit logs, compliance reports, evidence collection |

## 🎨 CIS Controls Framework Integration

The server uses the CIS Controls visual framework with color-coded categorization:

- **🟠 Orange Elements**: Governance requirements that MUST be met
- **🟢 Green Elements**: Core "what" of the safeguard  
- **🟡 Yellow Elements**: Sub-taxonomical components
- **⚫ Gray Elements**: Implementation suggestions and methods

## 🚀 Installation

### Prerequisites
- Node.js 18+
- Claude Code CLI tool

### Install from npm
```bash
npm install -g framework-mcp
```

### Update to Latest Version
```bash
npm update -g framework-mcp
```

Or reinstall to get the latest version:
```bash
npm uninstall -g framework-mcp
npm install -g framework-mcp
```

### Install from source
```bash
git clone https://github.com/therealcybermattlee/FrameworkMCP.git
cd FrameworkMCP
npm install
npm run build
```

## ⚙️ Configuration

### Claude Code Integration

Add to your MCP configuration file (`~/.config/claude-code/mcp.json`):

```json
{
  "mcpServers": {
    "framework-analyzer": {
      "command": "node",
      "args": ["/path/to/FrameworkMCP/dist/index.js"],
      "env": {}
    }
  }
}
```

### Verify Installation
```bash
claude-code "List available CIS Control safeguards"
```

## 📋 Usage Examples

### Analyze Single Vendor Response

```bash
claude-code "Analyze this vendor response for safeguard 5.1:
Vendor: SecureIAM Corp
Response: 'Our tool is a full identity provider with comprehensive account management. We maintain detailed user inventories including names, usernames, departments, and access rights. Automated quarterly reviews ensure all accounts are authorized and compliant.'"
```

### Validate Coverage Claims

```bash
claude-code "Validate this coverage claim:
Vendor: ComplianceBot
Safeguard: 5.1  
Claim: FULL coverage with Governance and Validates capabilities
Response: 'We provide automated account lifecycle management with real-time inventory tracking and compliance reporting.'"
```

### Analyze Multiple Vendors from File

Create `vendors.csv`:
```csv
vendor,safeguard,response
VendorA,5.1,"Complete IAM solution with policy management and quarterly reviews"
VendorB,5.1,"Basic user directory with manual account tracking"
VendorC,6.3,"MFA enforcement for all external applications with SSO integration"
```

```bash
claude-code "Analyze the vendor responses in vendors.csv and provide recommendations"
```

### Get Safeguard Details

```bash
claude-code "Show me the detailed breakdown of safeguard 5.1 including all sub-elements"
```

### Validate Vendor Capability Claims

**NEW**: Validate whether a vendor's stated capability mapping is actually supported by their explanatory text.

```bash
claude-code "Validate this vendor capability claim:
Vendor: SecureAssets Corp
Safeguard: 1.1  
Claimed Capability: FULL
Supporting Text: 'Our comprehensive asset management platform performs automated discovery of all enterprise devices, maintains detailed hardware and software inventories, tracks ownership and location data, provides real-time asset status monitoring, and includes documented inventory procedures with bi-annual review capabilities.'"
```

## 📊 Sample Output

### Standard Analysis Output
```json
{
  "vendor": "SecureIAM Corp",
  "safeguardId": "5.1",
  "safeguardTitle": "Establish and Maintain an Inventory of Accounts",
  "governance": true,
  "facilitates": true,
  "coverage": "full",
  "validates": true,
  "confidence": 87,
  "coverageBreakdown": {
    "governance": 90,
    "core": 85,
    "subElements": 75,
    "overall": 83
  },
  "governanceElementsCovered": [
    "establish inventory process",
    "maintain inventory process",
    "validate all active accounts are authorized"
  ],
  "evidence": [
    "comprehensive account management",
    "detailed user inventories",
    "automated quarterly reviews"
  ]
}
```

### Validation Tool Output
```json
{
  "vendor": "SecureAssets Corp",
  "safeguard_id": "1.1",
  "safeguard_title": "Establish and Maintain a Detailed Enterprise Asset Inventory",
  "claimed_capability": "full",
  "validation_status": "SUPPORTED",
  "confidence_score": 85,
  "evidence_analysis": {
    "core_requirements_coverage": 100,
    "sub_elements_coverage": 47,
    "governance_alignment": 80,
    "language_consistency": 90
  },
  "domain_validation": {
    "required_tool_type": "inventory",
    "detected_tool_type": "inventory",
    "domain_match": true,
    "capability_adjusted": false
  },
  "gaps_identified": [],
  "strengths_identified": [
    "High coverage of core requirements and sub-elements",
    "Strong implementation language consistency",
    "Appropriate tool type for safeguard domain"
  ],
  "recommendations": [],
  "detailed_feedback": "Validation of FULL capability claim: SUPPORTED (85% alignment)\n\nSTRENGTHS:\n• High coverage of core requirements and sub-elements\n• Strong implementation language consistency\n• Appropriate tool type for safeguard domain\n\nASSESSMENT: The vendor's supporting evidence strongly aligns with their claimed capability."
}
```

### Domain Mismatch Example Output
```json
{
  "vendor": "ThreatIntel Pro",
  "safeguard_id": "1.1", 
  "safeguard_title": "Establish and Maintain a Detailed Enterprise Asset Inventory",
  "claimed_capability": "facilitates",
  "validation_status": "QUESTIONABLE",
  "confidence_score": 45,
  "evidence_analysis": {
    "core_requirements_coverage": 65,
    "sub_elements_coverage": 20,
    "governance_alignment": 30,
    "language_consistency": 75
  },
  "domain_validation": {
    "required_tool_type": "inventory",
    "detected_tool_type": "threat_intelligence", 
    "domain_match": false,
    "capability_adjusted": true,
    "original_claim": "full"
  },
  "gaps_identified": [
    "Tool type mismatch: threat_intelligence tools cannot provide FULL coverage for Asset Inventory safeguards"
  ],
  "strengths_identified": [
    "Good language consistency in supporting text"
  ],
  "recommendations": [
    "Consider repositioning as FACILITATES capability to align with tool type"
  ],
  "detailed_feedback": "DOMAIN VALIDATION: Tool type 'threat_intelligence' cannot provide FULL coverage for safeguard 1.1 (Asset Inventory). Capability automatically adjusted from FULL to FACILITATES.\n\nThe vendor's claim has been downgraded due to domain mismatch, though evidence quality is reasonable for facilitation capabilities."
}
```

## 🔧 Available Tools

| Tool | Description |
|------|-------------|
| `analyze_vendor_response` | Analyze vendor response for specific safeguard |
| `validate_vendor_mapping` | **NEW** Validate vendor's claimed capability against supporting evidence |
| `validate_coverage_claim` | Validate FULL/PARTIAL coverage claims |
| `get_safeguard_details` | Get detailed safeguard breakdown |
| `list_available_safeguards` | List all available CIS safeguards |

## 📁 File Formats Supported

### JSON Format
```json
[
  {
    "name": "VendorName",
    "safeguard_id": "5.1",
    "response": "Vendor response text..."
  }
]
```

### CSV Format
```csv
vendor,safeguard,response
VendorName,5.1,"Response text..."
```

### Text Format
```
Vendor: VendorName - Safeguard: 5.1
Response text here...

Vendor: AnotherVendor - Safeguard: 6.3
Another response...
```

## 🆕 Vendor Mapping Validation

The **validate_vendor_mapping** tool provides evidence-based validation of vendor capability claims. This addresses a critical need: vendors often self-assess their capabilities, but practitioners need to verify whether the supporting evidence actually justifies the claimed mapping.

### Validation Criteria

| Capability | Requirements | Validation Thresholds |
|------------|-------------|----------------------|
| **FULL** | Complete implementation within scope | ≥70% core requirements + ≥40% sub-elements |
| **PARTIAL** | Limited scope with clear boundaries | ≥30% core requirements OR some core + ≥20% sub-elements |
| **FACILITATES** | Enables/enhances implementation | Facilitation language present, no direct implementation claims |
| **GOVERNANCE** | Policy/process management | ≥60% governance elements + policy language |
| **VALIDATES** | Evidence collection & reporting | Audit/monitoring/reporting capabilities present |

### Domain-Specific Validation Rules

**CRITICAL**: The validation tool enforces domain-specific requirements for capability claims:

| Safeguard | Domain | Required Tool Types | Rule |
|-----------|--------|-------------------|------|
| **1.1** | Asset Inventory | inventory, asset_management, cmdb, discovery | Only inventory tools can claim FULL/PARTIAL |
| **1.2** | Unauthorized Assets | inventory, asset_management, cmdb, discovery | Only inventory tools can claim FULL/PARTIAL |
| **5.1** | Account Inventory | identity_management, governance | Only identity/governance tools can claim FULL/PARTIAL |
| **6.3** | External MFA | identity_management | Only identity management tools can claim FULL/PARTIAL |
| **7.1** | Vulnerability Process | vulnerability_management, governance | Only vulnerability/governance tools can claim FULL/PARTIAL |

**Auto-Downgrade Logic**: When a tool type doesn't match the safeguard domain:
- **FULL/PARTIAL** claims → Automatically downgraded to **FACILITATES**
- **FACILITATES/GOVERNANCE/VALIDATES** claims → Remain unchanged
- Validation status becomes **QUESTIONABLE** with explanation

### Validation Statuses

- **SUPPORTED** (70-100%): Evidence strongly supports the claimed capability
- **QUESTIONABLE** (40-69%): Evidence partially supports but has notable gaps OR domain mismatch occurred
- **UNSUPPORTED** (0-39%): Evidence does not adequately support the claim

### Usage Examples

```bash
# Validate a FULL coverage claim (matching domain)
claude-code "Use validate_vendor_mapping for vendor 'AssetMax Pro', safeguard '1.1', claimed capability 'full', with supporting text: 'Our platform provides comprehensive automated discovery, detailed inventory management, and complete asset lifecycle tracking for all enterprise devices including servers, workstations, and network equipment.'"

# Validate a FACILITATES claim  
claude-code "Use validate_vendor_mapping for vendor 'ThreatIntel Feed', safeguard '1.1', claimed capability 'facilitates', with supporting text: 'Our threat intelligence service provides supplemental risk data that enriches existing asset management systems, enabling organizations to prioritize asset security based on threat exposure.'"

# Domain mismatch example (auto-downgraded)
claude-code "Use validate_vendor_mapping for vendor 'VulnScanner Pro', safeguard '1.1', claimed capability 'full', with supporting text: 'Our vulnerability scanner performs comprehensive network discovery and maintains detailed device databases with complete visibility into enterprise infrastructure.'"
# Result: Downgraded from FULL to FACILITATES (vulnerability_management ≠ inventory tool)

# Questionable claim (insufficient evidence)
claude-code "Use validate_vendor_mapping for vendor 'BasicTracker', safeguard '1.1', claimed capability 'full', with supporting text: 'We help track computers and provide some visibility into your IT environment.'"
```

## 🎯 CIS Controls Coverage

**Complete CIS Controls v8.1 Framework Implementation**
- **153 total safeguards** across all 18 controls
- **Full framework coverage** from Controls 1-18
- **Comprehensive vendor analysis** capability for all CIS safeguards

### Current Version Highlights
- ✅ **All 18 Controls** implemented (Enterprise Assets through Penetration Testing)
- ✅ **Color-coded element categorization** (Orange/Green/Yellow/Gray)
- ✅ **Enhanced capability detection** (Governance, Facilitates, Coverage, Validates)
- ✅ **Production-ready** vendor analysis for complete compliance assessments

## 🛠️ Development

### Build from Source
```bash
git clone https://github.com/therealcybermattlee/FrameworkMCP.git
cd FrameworkMCP
npm install
npm run build
```

### Add New Safeguards
Edit `src/index.ts` and add to the `CIS_SAFEGUARDS` object:

```typescript
"X.Y": {
  id: "X.Y",
  title: "Safeguard Title",
  description: "Description...",
  implementationGroup: "IG1",
  governanceElements: [...],    // Orange - MUST be met
  coreRequirements: [...],      // Green - The "what"
  subTaxonomicalElements: [...], // Yellow - Sub-elements
  implementationSuggestions: [...], // Gray - Suggestions
  // ...
}
```

### Testing
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

## 📖 Documentation

- [Installation Guide](docs/installation.md)
- [API Reference](docs/api-reference.md)
- [CIS Safeguards Reference](docs/safeguards-reference.md)
- [Example Usage](examples/example-usage.md)

## 🐛 Troubleshooting

### Common Issues

**Permission denied:**
```bash
chmod +x dist/index.js
```

**Module not found:**
```bash
npm install
npm run build
```

**MCP server not connecting:**
- Check Claude Code MCP configuration
- Verify file paths are absolute
- Ensure Node.js version compatibility

## 📄 License

This project is licensed under the Creative Commons Attribution 4.0 International License by Cyber RISE, Inc - see the [LICENSE](LICENSE) file for details.

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution** — You must give appropriate credit to Cyber RISE, Inc, provide a link to the license, and indicate if changes were made

## 🙏 Acknowledgments

- **Center for Internet Security (CIS)** for the CIS Controls Framework
- **Pax8** and community contributors for the CIS Controls visualizations
- **Anthropic** for the Model Context Protocol and Claude Code

## 📞 Support

- 📧 **Issues**: [GitHub Issues](https://github.com/therealcybermattlee/FrameworkMCP/issues)
- 📖 **Documentation**: [Project Wiki](https://github.com/therealcybermattlee/FrameworkMCP/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/therealcybermattlee/FrameworkMCP/discussions)
- 🐦 **Updates**: Follow [@cybermattlee](https://twitter.com/cybermattlee) for project updates

---

**Built with ❤️ for the cybersecurity community by [Matt Lee](https://github.com/therealcybermattlee)**