# Framework MCP Integration Guide

## Claude Code MCP Integration

This guide shows how to integrate Framework MCP with Claude Code for CIS Controls capability assessment.

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

## 🔧 MCP Tool Usage

### 1. validate_vendor_mapping (PRIMARY)

**Most Important Tool**: Evidence-based validation with domain validation

```bash
# Validate FULL capability claim (should pass)
claude-code "Use validate_vendor_mapping with vendor_name 'ServiceNow CMDB', safeguard_id '1.1', claimed_capability 'full', and supporting_text 'Our CMDB provides comprehensive asset lifecycle management with automated discovery, detailed hardware and software inventory tracking, enterprise asset ownership records, departmental assignments, and documented bi-annual review processes.'"

# Validate FULL capability claim (should auto-downgrade)  
claude-code "Use validate_vendor_mapping with vendor_name 'Splunk SIEM', safeguard_id '1.1', claimed_capability 'full', and supporting_text 'Our SIEM platform provides comprehensive network visibility through log analysis and maintains detailed asset information through security event correlation.'"

# Validate FACILITATES capability claim
claude-code "Use validate_vendor_mapping with vendor_name 'Nessus Scanner', safeguard_id '1.1', claimed_capability 'facilitates', and supporting_text 'Our vulnerability scanner enhances existing asset management by providing additional device discovery and detailed software inventory during security assessments.'"
```

### 2. analyze_vendor_response

**Purpose**: Determine appropriate capability role when unknown

```bash
# Analyze identity management vendor
claude-code "Use analyze_vendor_response with vendor_name 'Okta', safeguard_id '5.1', and response_text 'We provide comprehensive identity lifecycle management with automated account provisioning, detailed user directories, quarterly access reviews, and full compliance reporting with audit trails.'"

# Analyze cross-domain vendor
claude-code "Use analyze_vendor_response with vendor_name 'CrowdStrike Falcon', safeguard_id '1.1', and response_text 'Our endpoint protection platform provides real-time asset visibility with comprehensive device inventory, software tracking, and continuous asset monitoring across all enterprise endpoints.'"
```

### 3. get_safeguard_details

**Purpose**: Research safeguard requirements before assessment

```bash
# Basic safeguard details
claude-code "Use get_safeguard_details with safeguard_id '1.1'"

# Detailed safeguard with examples
claude-code "Use get_safeguard_details with safeguard_id '5.1' and include_examples true"

# Research multiple safeguards
claude-code "Use get_safeguard_details for safeguard 6.3 then explain what makes this safeguard different from 5.1"
```

### 4. list_available_safeguards  

**Purpose**: Discover available safeguards for planning

```bash
# Complete safeguard list
claude-code "Use list_available_safeguards"

# Targeted safeguard discovery
claude-code "Use list_available_safeguards then identify which safeguards are most relevant for identity management vendor assessment"
```

## 📋 Common MCP Workflows

### Workflow 1: New Vendor Assessment
```bash
# Step 1: Research the safeguard
claude-code "Use get_safeguard_details for safeguard 1.1 to understand all requirements"

# Step 2: Analyze vendor response (capability unknown)
claude-code "Use analyze_vendor_response for vendor 'Device42' with safeguard '1.1' and response 'Our IT asset management platform provides comprehensive device discovery, detailed inventory tracking, and complete asset lifecycle management.'"

# Step 3: Validate specific claim (if vendor claims specific capability)
claude-code "Use validate_vendor_mapping to validate Device42's claim of 'full' capability for safeguard 1.1"
```

### Workflow 2: Claims Validation Audit
```bash
# Validate high-confidence claim
claude-code "Use validate_vendor_mapping for vendor 'Microsoft Entra ID', safeguard '5.1', claimed capability 'full', with supporting text 'Complete identity management with automated provisioning, detailed account inventories, quarterly reviews, and comprehensive compliance reporting.'"

# Validate questionable claim  
claude-code "Use validate_vendor_mapping for vendor 'Network Scanner Pro', safeguard '1.1', claimed capability 'full', with supporting text 'We scan networks and find devices.'"
```

### Workflow 3: Multi-Safeguard Vendor Analysis
```bash
# Analyze vendor across multiple safeguards
claude-code "Use analyze_vendor_response for Microsoft Defender for Endpoint across these scenarios:
1. Safeguard 1.1: 'Comprehensive endpoint asset discovery and inventory'
2. Safeguard 7.1: 'Continuous vulnerability assessment and patch management'  
3. Safeguard 1.2: 'Unauthorized device detection and blocking'"
```

## 🎯 Domain Validation Examples

### Asset Management Domain (Safeguards 1.1, 1.2)
```bash
# Appropriate tool type (should pass)
claude-code "Use validate_vendor_mapping for 'Lansweeper', safeguard '1.1', claimed 'full', with 'Complete IT asset management with automated discovery, comprehensive inventory, and detailed asset tracking.'"

# Inappropriate tool type (should auto-downgrade)
claude-code "Use validate_vendor_mapping for 'Qualys VMDR', safeguard '1.1', claimed 'full', with 'Vulnerability scanning with network discovery and asset databases.'"
```

### Identity Management Domain (Safeguards 5.1, 6.3)
```bash
# Appropriate tool type (should pass)
claude-code "Use validate_vendor_mapping for 'SailPoint', safeguard '5.1', claimed 'full', with 'Identity governance with comprehensive account management, lifecycle automation, and quarterly certifications.'"

# Inappropriate tool type (should auto-downgrade)
claude-code "Use validate_vendor_mapping for 'Splunk', safeguard '5.1', claimed 'full', with 'Account activity monitoring and user behavior analytics through log analysis.'"
```

## 🚀 Advanced MCP Usage

### Custom Analysis Prompts
```bash
# Comparative assessment
claude-code "Use validate_vendor_mapping to compare these FULL capability claims for safeguard 1.1: ServiceNow CMDB vs Device42 vs Lansweeper. Analyze domain validation, evidence quality, and confidence scores."

# Gap analysis
claude-code "Use get_safeguard_details for safeguard 5.1, then use analyze_vendor_response for Vendor 'BasicIAM' with response 'We provide user directories and password management.' Identify capability gaps."

# Compliance planning
claude-code "Use list_available_safeguards to identify all safeguards in Controls 1-3, then recommend which vendor types would be needed for comprehensive coverage."
```

### Error Handling Examples
```bash
# Invalid safeguard ID
claude-code "Use get_safeguard_details with safeguard_id '99.99'"
# Expected: Error with available safeguards suggestion

# Invalid capability role
claude-code "Use validate_vendor_mapping with claimed_capability 'super-full'"
# Expected: Error listing valid capability roles

# Insufficient supporting text
claude-code "Use validate_vendor_mapping with supporting_text 'Good tool'"  
# Expected: Error requiring minimum 10 characters
```

## 📊 Understanding MCP Responses

### Successful Validation Response
```json
{
  "vendor_name": "ServiceNow CMDB",
  "safeguard_id": "1.1", 
  "claimed_capability": "full",
  "validated_capability": "full",
  "validation_status": "SUPPORTED",
  "confidence_score": 88,
  "domain_validation": {
    "tool_type": "cmdb",
    "domain_appropriate": true,
    "auto_downgrade_applied": false
  },
  "evidence_analysis": {
    "core_requirements_score": 95,
    "governance_elements_score": 80,
    "sub_elements_score": 85,
    "language_consistency_score": 92
  },
  "reasoning": "Strong evidence for FULL capability with appropriate tool type",
  "recommendations": []
}
```

### Auto-Downgrade Response
```json
{
  "vendor_name": "Nessus Scanner",
  "safeguard_id": "1.1",
  "claimed_capability": "full", 
  "validated_capability": "facilitates",
  "validation_status": "QUESTIONABLE",
  "confidence_score": 60,
  "domain_validation": {
    "tool_type": "vulnerability_management",
    "domain_appropriate": false,
    "auto_downgrade_applied": true
  },
  "reasoning": "Auto-downgraded from FULL to FACILITATES due to domain mismatch",
  "recommendations": [
    "Consider repositioning as FACILITATES capability to align with tool type"
  ]
}
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