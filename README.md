# Vendor Framework Analyzer MCP Server

[![npm version](https://badge.fury.io/js/framework-mcp.svg)](https://badge.fury.io/js/framework-mcp)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![GitHub](https://img.shields.io/github/stars/therealcybermattlee/FrameworkMCP?style=social)](https://github.com/therealcybermattlee/FrameworkMCP)
[![Website](https://img.shields.io/badge/Website-cyberrise.org-blue)](https://cyberrise.org)

A Model Context Protocol (MCP) server providing **authoritative CIS Controls Framework data** to empower LLMs with sophisticated, context-aware vendor capability analysis. This Pure Data Provider architecture enables security professionals to perform flexible, intelligent assessment of vendor tool capabilities against specific CIS Control safeguards.

> **🚨 Breaking Change in v2.0**: The API structure has changed from a single `systemPrompt` field to five capability-specific prompt fields. See [Migration Guide](docs/migration-v2.0.md) for upgrade instructions.

## 🎯 Purpose

This MCP server empowers security teams to:
- **Access authoritative CIS Controls data** for all 153 safeguards across 18 controls
- **Leverage LLM intelligence** for sophisticated, context-aware vendor capability analysis
- **Perform flexible assessment** across 5 capability types: Full, Partial, Facilitates, Governance, and Validates
- **Apply custom analysis methodologies** with complete transparency and reasoning

## 🎯 The 5 Capability Roles

| Capability Role | Description | LLM Analysis Approach |
|-----------------|-------------|----------------------| 
| **FULL** | Complete implementation of safeguard requirements | LLMs assess comprehensive coverage against detailed safeguard data |
| **PARTIAL** | Limited scope implementation with clear boundaries | LLMs identify scope limitations and coverage gaps |
| **FACILITATES** | Enhancement capabilities that enable others to implement safeguards better/faster/stronger | LLMs recognize facilitation patterns and indirect support capabilities |
| **GOVERNANCE** | Policy/process management and oversight capabilities | LLMs evaluate governance elements and process management features |
| **VALIDATES** | Verification capabilities providing evidence and reporting | LLMs assess audit, monitoring, and reporting capabilities |

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
Description: Validate vendor capability claims against CIS Controls through content analysis
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

## 📋 LLM-Driven Analysis Examples

### Basic Vendor Capability Assessment

```bash
claude-code "Get safeguard details for 5.1, then analyze this vendor response: SecureIAM Corp - 'Our tool is a full identity provider with comprehensive account management. We maintain detailed user inventories including names, usernames, departments, and access rights. Automated quarterly reviews ensure all accounts are authorized and compliant.' Determine appropriate capability role and provide confidence assessment."
```

### Context-Aware Analysis

```bash
claude-code "Get safeguard 8.2 details. For a high-risk financial services environment, analyze this logging solution: 'We collect endpoint telemetry and forward logs to SIEM platforms.' Consider regulatory requirements (SOX, PCI-DSS) and determine capability role with implementation recommendations."
```

### Multi-Vendor Comparative Analysis

```bash
claude-code "Get safeguard 1.1 details. Compare these asset management solutions and rank by implementation completeness for a 500-employee company: 1) Lansweeper: 'Complete network discovery and automated inventory' 2) ServiceNow: 'CMDB with manual asset entry workflows' 3) Microsoft Intune: 'Managed device tracking with Azure AD integration'. Provide deployment complexity assessment."
```

### Bulk Analysis from File

Create `vendors.csv`:
```csv
vendor,safeguard,response
VendorA,5.1,"Complete IAM solution with policy management and quarterly reviews"
VendorB,5.1,"Basic user directory with manual account tracking"
VendorC,6.3,"MFA enforcement for all external applications with SSO integration"
```

```bash
claude-code "Get details for safeguards referenced in vendors.csv. Analyze each vendor response, determine capability roles, and provide implementation roadmap recommendations based on organizational gaps."
```

### Claim Validation Assessment

```bash
claude-code "Get safeguard 12.4 details. This vendor claims FULL capability for network boundary monitoring: 'We monitor all network traffic, identify unauthorized devices, and generate real-time alerts.' Validate this claim against the specific safeguard requirements and provide evidence-based assessment."
```

### Risk-Based Analysis

```bash
claude-code "Get safeguard 11.1 details. For a healthcare organization with HIPAA requirements, assess Veeam Backup's capability: 'Automated daily backups with 99.9% recovery success rate and quarterly recovery testing.' Focus on governance and validation aspects."
```

## 📊 Sample LLM Analysis Patterns

### Context-Aware Assessment Response
```
ASSESSMENT: SecureIAM Corp - Safeguard 5.1 Analysis

CAPABILITY DETERMINATION: FULL + GOVERNANCE + VALIDATES
CONFIDENCE: 87%

ANALYSIS:
Based on safeguard 5.1 requirements for comprehensive account inventory management:

✅ CORE REQUIREMENTS COVERAGE:
- Complete user inventory (names, usernames, departments)
- Access rights tracking and management  
- Identity provider capabilities with centralized management

✅ GOVERNANCE ELEMENTS:
- Automated quarterly review processes
- Compliance verification workflows
- Policy enforcement capabilities

✅ VALIDATION CAPABILITIES:
- Continuous monitoring and reporting
- Authorization verification
- Compliance status tracking

EVIDENCE QUALITY: High - Specific implementation details provided
SCOPE DEFINITION: Comprehensive enterprise account management

RECOMMENDATION: Strong FULL capability alignment with additional governance and validation roles. Suitable for enterprise Implementation Group 2-3 deployments.
```

### Multi-Vendor Comparison Response
```
COMPARATIVE ANALYSIS: Asset Management Solutions for Safeguard 1.1

RANKING BY IMPLEMENTATION COMPLETENESS:

1. 🥇 LANSWEEPER (FULL + VALIDATES)
   - Comprehensive automated discovery
   - Network-wide asset visibility
   - Strong for 500-employee deployment
   - Implementation: Medium complexity

2. 🥈 MICROSOFT INTUNE (PARTIAL + GOVERNANCE)
   - Managed device focus (limited scope)
   - Strong Azure AD integration
   - Governance capabilities present
   - Implementation: Low complexity (if using Microsoft stack)

3. 🥉 SERVICENOW (FACILITATES + GOVERNANCE)
   - CMDB foundation requires manual processes
   - Strong workflow and governance features
   - Facilitates comprehensive asset management
   - Implementation: High complexity

RECOMMENDATION: Lansweeper provides best immediate coverage for IG1 requirements. Consider Intune if Microsoft-centric environment, ServiceNow for complex enterprise with mature processes.
```

### Risk-Based Healthcare Analysis
```
HIPAA-FOCUSED ANALYSIS: Veeam Backup vs Safeguard 11.1

CAPABILITY: FULL + VALIDATES
COMPLIANCE CONFIDENCE: 92%

HIPAA CONSIDERATIONS:
✅ Recovery time objectives meet healthcare uptime requirements
✅ Quarterly testing demonstrates due diligence
✅ 99.9% success rate supports business continuity

GOVERNANCE ALIGNMENT:
- Documented recovery procedures (required for HIPAA)
- Regular testing and validation processes
- Performance metrics and reporting

GAPS TO ADDRESS:
- Verify encryption at rest/in transit for PHI
- Confirm audit logging capabilities
- Validate access controls for backup systems

IMPLEMENTATION RECOMMENDATION: Strong foundation for HIPAA compliance. Supplement with documented encryption policies and access control procedures.
```

## 🔧 Available Tools

| Tool | Description |
|------|-------------|
| `get_safeguard_details` | **PRIMARY** Get detailed safeguard breakdown with structured CIS data for LLM analysis |
| `list_available_safeguards` | List all available CIS safeguards (153 total) for framework exploration |

**Pure Data Provider Architecture**: Framework MCP provides authoritative CIS Controls data while LLMs perform sophisticated, context-aware capability analysis with unlimited flexibility.

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

## 🚀 LLM-Driven Analysis Advantages

Framework MCP v1.4.0's **Pure Data Provider architecture** empowers LLMs to perform sophisticated vendor capability analysis with unprecedented flexibility and intelligence.

### Key Benefits Over Hardcoded Analysis

| Advantage | Description | LLM Capability |
|-----------|-------------|----------------|
| **Context Awareness** | Analysis considers industry, risk profile, and organizational needs | LLMs understand sector-specific requirements and compliance frameworks |
| **Analytical Flexibility** | Apply custom methodologies and assessment criteria | Multiple analysis approaches: strict compliance, risk-based, comparative |
| **Transparent Reasoning** | Complete visibility into analysis logic and evidence evaluation | LLMs explain their reasoning and provide detailed justifications |
| **Adaptive Intelligence** | Dynamic assessment based on evolving requirements | LLMs can adjust analysis based on new information or changing priorities |
| **Natural Language** | Complex analysis requests in plain English | No need for rigid tool parameters or predefined validation rules |

### Enhanced Analysis Capabilities

**Multi-Dimensional Assessment**: LLMs can simultaneously evaluate:
- Technical capability alignment with safeguard requirements
- Deployment complexity and organizational fit
- Risk mitigation effectiveness and compliance coverage
- Integration potential with existing technology stacks
- Cost-benefit analysis and implementation roadmaps

**Advanced Analysis Patterns**:
- **Comparative Vendor Evaluation**: Rank multiple solutions against specific criteria
- **Gap Analysis**: Identify coverage gaps and recommend complementary tools
- **Risk-Based Assessment**: Prioritize capability importance based on threat landscape
- **Compliance Mapping**: Align vendor capabilities with regulatory requirements
- **Implementation Planning**: Generate deployment strategies and success metrics

### Flexibility Examples

```bash
# Custom compliance-focused analysis
claude-code "Get safeguard 8.3 details. For PCI-DSS Level 1 compliance, assess Splunk Enterprise Security considering cardholder data environment requirements and provide implementation timeline recommendations."

# Technology stack integration assessment  
claude-code "Get safeguard 16.1 details. We use Azure DevOps and GitHub. Analyze how SonarQube integrates with our pipeline for secure code analysis and recommend configuration best practices."

# Risk-based prioritization
claude-code "Get details for safeguards 13.1, 13.3, and 13.6. Our organization faces advanced persistent threats. Rank these network monitoring vendors by threat detection capability: 1) CrowdStrike Falcon 2) SentinelOne 3) Microsoft Defender for Endpoint."
```

## 🎯 CIS Controls Coverage

**Complete CIS Controls v8.1 Framework Implementation**
- **153 total safeguards** across all 18 controls
- **Full framework coverage** from Controls 1-18
- **Comprehensive vendor analysis** capability for all CIS safeguards

### v1.4.0 Pure Data Provider Highlights
- ✅ **Simplified Architecture** - Clean data provision without analysis complexity
- ✅ **LLM-Powered Analysis** - Sophisticated, context-aware capability assessment
- ✅ **Enhanced Flexibility** - Custom methodologies and unlimited analysis approaches  
- ✅ **Complete Framework** - All 18 Controls with 153 safeguards for comprehensive evaluation
- ✅ **Transparent Reasoning** - Full visibility into analysis logic and evidence evaluation

## 🛠️ Development

### Build from Source
```bash
git clone https://github.com/therealcybermattlee/FrameworkMCP.git
cd FrameworkMCP
npm install
npm run build
```

### Add New Safeguards
Edit `src/core/safeguard-manager.ts` and add to the `initializeSafeguards()` method:

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