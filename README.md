# GRC Vendor Analyzer MCP Server

[![npm version](https://badge.fury.io/js/framework-mcp.svg)](https://badge.fury.io/js/framework-mcp)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)
[![GitHub](https://img.shields.io/github/stars/therealcybermattlee/FrameworkMCP?style=social)](https://github.com/therealcybermattlee/FrameworkMCP)

A Model Context Protocol (MCP) server that analyzes vendor responses against the **CIS Controls Framework** using a 4-attribute GRC (Governance, Risk, and Compliance) methodology. This tool helps security professionals evaluate vendor capabilities against specific CIS Control safeguards with detailed sub-taxonomical analysis.

## 🎯 Purpose

This MCP server enables security teams to:
- **Analyze vendor responses** against specific CIS Control safeguards (1.1, 5.1, 6.3, etc.)
- **Validate coverage claims** (FULL/PARTIAL) with evidence-based assessment
- **Categorize vendor capabilities** across 4 key attributes: Governance, Facilitates, Coverage, and Validates
- **Generate detailed reports** showing sub-element coverage and compliance gaps

## 🔧 The 4 GRC Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| **Governance** | GRC platform capabilities for policy/process management | Policy management, documented processes, compliance workflows |
| **Facilitates** | Enhancement capabilities that make safeguards better/faster/stronger | Automation, optimization, streamlined implementation |
| **Coverage** | Scope of safeguard elements addressed (Full/Partial) | Percentage of sub-taxonomical elements covered |
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

## 📊 Sample Output

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

## 🔧 Available Tools

| Tool | Description |
|------|-------------|
| `analyze_vendor_response` | Analyze vendor response for specific safeguard |
| `validate_coverage_claim` | Validate FULL/PARTIAL coverage claims |
| `get_safeguard_details` | Get detailed safeguard breakdown |
| `list_available_safeguards` | List all available CIS safeguards |
| `generate_coverage_report` | Generate detailed coverage analysis |
| `export_analysis` | Export results to JSON/CSV/Markdown |

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

## 🎯 CIS Controls Coverage

Currently supports key safeguards including:
- **1.1** - Enterprise Asset Inventory
- **1.2** - Address Unauthorized Assets  
- **5.1** - Inventory of Accounts
- **6.3** - MFA for Externally-Exposed Applications
- **7.1** - Vulnerability Management Process

*Additional safeguards can be easily added to the framework.*

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