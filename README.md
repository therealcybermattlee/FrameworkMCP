# Vendor Framework Analyzer MCP Server

[![npm version](https://badge.fury.io/js/framework-mcp.svg)](https://badge.fury.io/js/framework-mcp)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![GitHub](https://img.shields.io/github/stars/therealcybermattlee/FrameworkMCP?style=social)](https://github.com/therealcybermattlee/FrameworkMCP)
[![Website](https://img.shields.io/badge/Website-cyberrise.org-blue)](https://cyberrise.org)

A Model Context Protocol (MCP) server that determines vendor tool **capability roles** (Full Implementation, Partial Implementation, Facilitates, Governance, Validates) against the **CIS Controls Framework**. This tool helps security professionals accurately categorize vendor capabilities for specific CIS Control safeguards with domain validation and evidence-based assessment.

## 🎯 Purpose

This MCP server enables security teams to:
- **Determine vendor tool capability roles** for specific CIS Control safeguards (1.1, 5.1, 6.3, etc.)
- **Validate implementation capability claims** (FULL/PARTIAL) with domain-appropriate tool type verification
- **Accurately categorize vendor roles** across 5 capability types: Full, Partial, Facilitates, Governance, and Validates
- **Generate evidence-based assessments** showing capability alignment and domain validation results

## 🎯 The 5 Capability Roles

| Capability Role | Description | Domain Requirements |
|-----------------|-------------|--------------------|
| **FULL** | Complete implementation of safeguard requirements | Must use domain-appropriate tool types (e.g., inventory tools for asset safeguards) |
| **PARTIAL** | Limited scope implementation with clear boundaries | Must use domain-appropriate tool types with explicit scope limitations |
| **FACILITATES** | Enhancement capabilities that enable others to implement safeguards better/faster/stronger | No tool type restrictions - any tool can facilitate |
| **GOVERNANCE** | Policy/process management and oversight capabilities | No tool type restrictions - governance applies across domains |
| **VALIDATES** | Verification capabilities providing evidence and reporting | No tool type restrictions - validation applies across domains |

## 🎨 CIS Controls Framework Integration

The server uses the CIS Controls visual framework with color-coded categorization:

- **🟠 Orange Elements**: Governance requirements that MUST be met
- **🟢 Green Elements**: Core "what" of the safeguard  
- **🟡 Yellow Elements**: Sub-taxonomical components
- **⚫ Gray Elements**: Implementation suggestions and methods

## 🚀 Installation & Deployment

### Prerequisites
- Node.js 18+
- Claude Code CLI tool (for MCP usage)
- Microsoft Copilot Studio (for custom connector usage)

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

### Cloud Deployment Options

#### Option 1: DigitalOcean App Services
```bash
# Deploy using the included configuration
doctl apps create .do/app.yaml
```

#### Option 2: Railway
```bash
railway login
railway up
```

#### Option 3: Render
Connect your GitHub repository and use:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:http`
- **Port**: 8080

#### Option 4: Microsoft Copilot Custom Connector
Deploy to any cloud platform and use the included `swagger.json` for Copilot integration.

## ⚙️ Configuration

### Claude Code MCP Integration

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

### Microsoft Copilot Custom Connector Setup

#### Step 1: Deploy HTTP API
Deploy the Framework MCP HTTP API to any cloud platform (DigitalOcean, Railway, Render, etc.)

#### Step 2: Create Custom Connector in Copilot Studio
1. Open **Microsoft Copilot Studio**
2. Navigate to **Data** → **Custom connectors**
3. Click **+ New custom connector** → **Import from OpenAPI file**
4. Upload the `swagger.json` file from this repository
5. Update the **Host** field to your deployed API URL
6. Save and test the connector

#### Step 3: Configure Connection
1. Create a new connection using your custom connector
2. No authentication required (public API)
3. Test with the `/health` endpoint to verify connectivity

#### Step 4: Create Copilot Actions
In your Copilot, create actions for capability assessment:

**Primary Action - Validate Vendor Capability:**
```
Action: Validate Vendor Mapping
Description: Validate vendor capability claims against CIS Controls with domain validation
Connector: Framework MCP Custom Connector
Operation: validateVendorMapping
Parameters:
- vendor_name: {User provided vendor name}
- safeguard_id: {CIS safeguard ID like "1.1"}  
- claimed_capability: {full|partial|facilitates|governance|validates}
- supporting_text: {Vendor response text}
```

**Secondary Action - Analyze Response:**
```
Action: Analyze Vendor Response
Description: Determine appropriate capability role for vendor response
Connector: Framework MCP Custom Connector
Operation: analyzeVendorResponse
Parameters:
- vendor_name: {User provided vendor name}
- safeguard_id: {CIS safeguard ID}
- response_text: {Vendor response to analyze}
```

#### Step 5: Example Copilot Prompts
Once configured, users can interact with your Copilot:

```
"Validate this vendor capability: CrowdStrike Falcon claims FULL coverage for safeguard 1.1 with this response: 'Our platform provides comprehensive enterprise asset inventory with real-time discovery, automated classification, and continuous monitoring of all hardware and software assets.'"

"Analyze this vendor response for safeguard 5.1: Microsoft Entra ID - 'We provide centralized identity management with automated user provisioning, role-based access controls, and integration with all major business applications.'"

"What are the requirements for CIS safeguard 6.3?"
```

### Verify Installation
```bash
# For MCP usage
claude-code "List available CIS Control safeguards"

# For HTTP API usage  
curl https://your-api-url.com/health

# For Copilot testing
curl -X POST https://your-api-url.com/api/validate-vendor-mapping \
  -H "Content-Type: application/json" \
  -d '{"vendor_name":"Test Vendor","safeguard_id":"1.1","claimed_capability":"facilitates","supporting_text":"We provide supplemental asset tracking capabilities that enhance existing inventory systems."}'
```

## 📋 Usage Examples

### Analyze Single Vendor Response

```bash
claude-code "Determine the capability role for this vendor response to safeguard 5.1:
Vendor: SecureIAM Corp
Response: 'Our tool is a full identity provider with comprehensive account management. We maintain detailed user inventories including names, usernames, departments, and access rights. Automated quarterly reviews ensure all accounts are authorized and compliant.'"
```

### Validate Implementation Capability Claims

```bash
claude-code "Validate this implementation capability claim:
Vendor: ComplianceBot
Safeguard: 5.1  
Claimed Capability: FULL
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
claude-code "Determine capability roles for the vendor responses in vendors.csv and provide recommendations"
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

### Standard Capability Role Analysis Output
```json
{
  "vendor": "SecureIAM Corp",
  "safeguardId": "5.1",
  "safeguardTitle": "Establish and Maintain an Inventory of Accounts",
  "capabilityRole": "full",
  "additionalRoles": ["governance", "validates"],
  "confidence": 87,
  "domainValidation": {
    "detectedToolType": "identity_management",
    "domainMatch": true,
    "capabilityAdjusted": false
  },
  "evidenceAnalysis": {
    "coreRequirements": 85,
    "subElements": 75,
    "governance": 90,
    "languageConsistency": 88
  },
  "evidence": [
    "comprehensive account management",
    "detailed user inventories",
    "automated quarterly reviews"
  ]
}
```

### Primary Validation Tool Output (validate_vendor_mapping)
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
| `analyze_vendor_response` | Determine vendor tool capability role for specific safeguard |
| `validate_vendor_mapping` | **PRIMARY** Validate vendor's claimed capability role against supporting evidence with domain validation |
| `validate_coverage_claim` | Validate FULL/PARTIAL implementation capability claims |
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
- **[Microsoft Copilot Integration Guide](COPILOT_INTEGRATION.md)** - Complete setup guide for custom connectors
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Cloud deployment instructions
- [OpenAPI Specification](swagger.json) - Complete API schema for integrations

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