# Framework MCP Integration Guide

## Claude Code MCP Integration

This guide shows how to integrate Framework MCP v1.4.0's Pure Data Provider architecture with Claude Code for LLM-driven CIS Controls capability analysis.

## Prerequisites

- **Claude Code CLI** installed and configured
- **Node.js 18+** for running the MCP server
- **Framework MCP** installed locally or from npm

## Installation Options

### Option 1: Install from npm (Recommended)
```bash
npm install -g framework-mcp
```

### Option 2: Build from Source
```bash
git clone https://github.com/therealcybermattlee/FrameworkMCP.git
cd FrameworkMCP
npm install
npm run build
```

## MCP Configuration

### Configure Claude Code MCP Settings

Add Framework MCP to your MCP configuration file:

**Location**: `~/.config/claude-code/mcp.json`

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

### For npm Global Installation
```json
{
  "mcpServers": {
    "framework-analyzer": {
      "command": "framework-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

## Verify Installation

Test your MCP integration:

```bash
claude-code "List all available CIS Control safeguards"
```

Expected response: List of 153 safeguards across 18 CIS Controls

## 🔧 Pure Data Provider Tools

### 1. get_safeguard_details (PRIMARY)

**Primary Tool**: Retrieve detailed CIS safeguard breakdown for LLM analysis

```bash
# Get comprehensive safeguard data for analysis
claude-code "Use get_safeguard_details with safeguard_id '1.1' and include_examples true"

# Research multiple related safeguards
claude-code "Use get_safeguard_details for safeguard 5.1 then explain the key requirements for account inventory management"

# Get data for comparative analysis
claude-code "Use get_safeguard_details for safeguard 6.3 then explain what makes this different from basic authentication controls"
```

### 2. list_available_safeguards  

**Discovery Tool**: Explore available safeguards for planning and assessment

```bash
# Complete safeguard framework exploration
claude-code "Use list_available_safeguards"

# Targeted safeguard discovery
claude-code "Use list_available_safeguards then identify which safeguards are most relevant for identity management vendor assessment"

# Implementation Group planning
claude-code "Use list_available_safeguards then show me all IG1 safeguards for small business security planning"
```

## 📋 LLM-Driven Analysis Workflows

### Workflow 1: Comprehensive Vendor Assessment
```bash
# Step 1: Get authoritative safeguard data
claude-code "Use get_safeguard_details with safeguard_id '1.1' and include_examples true"

# Step 2: Perform LLM-driven analysis
claude-code "Based on the safeguard 1.1 requirements above, analyze Device42's capability: 'Our IT asset management platform provides comprehensive device discovery, detailed inventory tracking, and complete asset lifecycle management.' Determine capability role, provide confidence assessment, and recommend implementation approach."

# Step 3: Context-aware evaluation
claude-code "For our 500-employee technology company, assess whether Device42 meets our asset management needs for IG2 compliance. Consider deployment complexity and integration requirements."
```

### Workflow 2: Multi-Vendor Comparative Analysis
```bash
# Get safeguard requirements
claude-code "Use get_safeguard_details for safeguard 5.1 with examples"

# Comparative analysis with business context
claude-code "Using the safeguard 5.1 requirements above, compare these identity management solutions for our financial services organization: 1) Microsoft Entra ID: 'Complete identity management with automated provisioning and compliance reporting' 2) Okta: 'Cloud identity platform with advanced analytics and risk assessment' 3) Ping Identity: 'Enterprise SSO with detailed audit trails and governance workflows'. Rank by compliance strength and implementation fit."
```

### Workflow 3: Gap Analysis and Roadmap Planning
```bash
# Research multiple related safeguards
claude-code "Use get_safeguard_details for safeguard 5.1, then get details for 5.2, 5.3, and 5.4"

# Comprehensive gap analysis
claude-code "Based on the account management safeguards 5.1-5.4 above, analyze our current IAM capability: Azure AD basic with manual quarterly reviews. Identify gaps, prioritize improvements, and create 12-month implementation roadmap with budget estimates."
```

### Workflow 4: Risk-Based Assessment
```bash
# Get network monitoring safeguards
claude-code "Use get_safeguard_details for safeguard 13.1, then get details for 13.3 and 13.6"

# Risk-focused analysis
claude-code "Using the network monitoring safeguards above, our financial services organization faces advanced persistent threats and ransomware. Analyze Microsoft Defender for Endpoint's network capabilities: 'Real-time endpoint detection, behavioral analytics, automated response, and network traffic monitoring.' Prioritize safeguards by threat mitigation effectiveness and recommend complementary tools."
```

## 🚀 Advanced LLM Analysis Patterns

### Custom Methodology Applications
```bash
# Compliance-focused assessment
claude-code "Use get_safeguard_details for safeguard 8.2. Apply PCI-DSS Level 1 compliance methodology to analyze Splunk Enterprise Security's logging capability: 'Centralized log management, real-time monitoring, compliance reporting, and data retention policies.' Focus on regulatory alignment and audit readiness."

# Technology integration assessment
claude-code "Use get_safeguard_details for safeguard 16.1. Our DevOps pipeline uses Azure DevOps, GitHub, and Kubernetes. Analyze SonarQube's capability: 'Static application security testing with CI/CD integration and policy enforcement.' Recommend implementation approach and configuration."

# Strategic planning
claude-code "Use list_available_safeguards to identify all Implementation Group 1 safeguards, then create vendor selection strategy for a 200-employee company with $500K security budget. Prioritize by business impact and implementation complexity."
```

### Data Validation Examples
```bash
# Invalid safeguard ID
claude-code "Use get_safeguard_details with safeguard_id '99.99'"
# Expected: Error with available safeguards suggestion

# Missing required parameter
claude-code "Use get_safeguard_details without safeguard_id"
# Expected: Error specifying required parameter

# Valid request with detailed response
claude-code "Use get_safeguard_details with safeguard_id '1.1' and include_examples true"
# Expected: Complete safeguard breakdown with implementation examples
```

## 📊 Understanding Pure Data Provider Responses

### Detailed Safeguard Data Response
```json
{
  "id": "1.1",
  "title": "Establish and Maintain Detailed Enterprise Asset Inventory",
  "description": "Establish and maintain an accurate, detailed, and up-to-date inventory of all enterprise assets...",
  "implementationGroup": "IG1",
  "governanceElements": [
    "Maintain detailed inventory procedures",
    "Establish asset classification standards",
    "Define asset ownership responsibilities"
  ],
  "coreRequirements": [
    "Automated discovery of enterprise assets",
    "Detailed hardware and software inventory",
    "Asset ownership and location tracking"
  ],
  "subTaxonomicalElements": [
    "Device identification and classification",
    "Software inventory and licensing",
    "Network topology mapping"
  ],
  "implementationSuggestions": [
    "Deploy automated discovery tools",
    "Implement CMDB solutions",
    "Regular inventory audits and updates"
  ]
}
```

### LLM Analysis Response Pattern
```
CAPABILITY ASSESSMENT: ServiceNow CMDB vs Safeguard 1.1

DETERMINATION: FULL + GOVERNANCE + VALIDATES
CONFIDENCE: 88%

EVIDENCE ANALYSIS:
✅ Core Requirements: Comprehensive CMDB with automated discovery
✅ Governance Elements: Detailed procedures and asset classification
✅ Sub-Elements: Complete device and software inventory tracking
✅ Implementation: Strong technical capabilities and proven enterprise deployment

REASONING: ServiceNow CMDB demonstrates strong alignment with all core requirements and provides additional governance and validation capabilities through workflow automation and compliance reporting.

RECOMMENDATIONS: Excellent foundation for IG2-IG3 implementation. Consider integration with security tools for enhanced asset risk assessment.
```

## 🔍 Troubleshooting

### Common MCP Issues

**MCP Server Not Found:**
```bash
# Check Claude Code MCP configuration
cat ~/.config/claude-code/mcp.json

# Verify file paths are absolute
which node
ls -la /path/to/FrameworkMCP/dist/index.js
```

**Permission Denied:**
```bash
chmod +x /path/to/FrameworkMCP/dist/index.js
```

**Module Not Found:**
```bash
cd /path/to/FrameworkMCP
npm install
npm run build
```

**Tool Not Available:**
```bash
# Restart Claude Code after MCP configuration changes
# Verify MCP server is running in Claude Code logs
```

### Verification Commands

```bash
# Test MCP connection
claude-code "Use list_available_safeguards to verify Framework MCP is working"

# Test all 4 tools
claude-code "Test Framework MCP by using each tool: list_available_safeguards, get_safeguard_details for 1.1, analyze_vendor_response for a test vendor, and validate_vendor_mapping for a test claim"

# Performance test
claude-code "Use validate_vendor_mapping 5 times with different vendors to test caching performance"
```

## 🎉 Success Criteria

Your MCP integration is successful when:

- ✅ `list_available_safeguards` returns 153 safeguards
- ✅ `get_safeguard_details` returns detailed safeguard breakdowns
- ✅ `analyze_vendor_response` determines appropriate capability roles
- ✅ `validate_vendor_mapping` performs evidence-based validation with domain validation
- ✅ Auto-downgrade protection works for domain mismatches
- ✅ All responses include confidence scores and detailed reasoning

---

**🔗 Related Documentation**
- [Main README](README.md) - Project overview and installation
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Cloud deployment options  
- [Copilot Integration](COPILOT_INTEGRATION.md) - Microsoft Copilot setup
- [Example Usage](examples/example-usage.md) - Detailed tool examples