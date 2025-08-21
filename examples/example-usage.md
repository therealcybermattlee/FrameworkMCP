# Framework MCP Usage Examples

## 🔧 Available Tools (4 Total)

| Tool | Purpose | Example Use Case |
|------|---------|------------------|
| `validate_vendor_mapping` | **PRIMARY** - Validate claimed capabilities | "Does CrowdStrike really provide FULL coverage for asset inventory?" |
| `analyze_vendor_response` | Determine appropriate capability role | "What capability should we assign to this vendor response?" |
| `get_safeguard_details` | Get safeguard breakdown | "Show me all requirements for safeguard 5.1" |
| `list_available_safeguards` | List all CIS safeguards | "What safeguards are available for analysis?" |

---

## 1. validate_vendor_mapping (PRIMARY Tool)

**Purpose**: Evidence-based validation of vendor capability claims with domain validation

### Example 1: FULL Capability Validation (Domain Match)
```bash
claude-code "Use validate_vendor_mapping to validate:
Vendor: AssetMax Pro
Safeguard: 1.1
Claimed Capability: full
Supporting Text: Our platform provides comprehensive automated discovery, detailed inventory management with hardware/software tracking, enterprise asset ownership records, departmental assignments, network address management, and documented bi-annual review processes for all enterprise devices."
```

**Expected Result**: SUPPORTED (high confidence, no auto-downgrade)

### Example 2: FULL Capability Validation (Domain Mismatch - Auto-Downgrade)
```bash
claude-code "Use validate_vendor_mapping to validate:
Vendor: ThreatIntel Pro
Safeguard: 1.1  
Claimed Capability: full
Supporting Text: Our threat intelligence platform discovers network devices during security scans and maintains detailed vulnerability databases with comprehensive asset visibility."
```

**Expected Result**: Auto-downgraded from FULL → FACILITATES (domain mismatch: threat_intelligence ≠ inventory)

### Example 3: FACILITATES Capability Validation
```bash
claude-code "Use validate_vendor_mapping to validate:
Vendor: SecureAudit Plus
Safeguard: 5.1
Claimed Capability: facilitates  
Supporting Text: Our audit platform enhances existing identity management by providing detailed account usage analytics, compliance reporting, and risk-based account prioritization that strengthens account inventory processes."
```

**Expected Result**: SUPPORTED (facilitation language present, no domain restrictions)

---

## 2. analyze_vendor_response

**Purpose**: Determine appropriate capability role when unknown

### Example 1: Identity Management Analysis
```bash
claude-code "Use analyze_vendor_response to analyze:
Vendor: Microsoft Entra ID
Safeguard: 5.1
Response Text: We provide centralized identity management with automated user provisioning, comprehensive account lifecycle management, role-based access controls, detailed user directories with departmental tracking, and automated quarterly access reviews with compliance reporting."
```

**Expected Result**: FULL capability (identity_management tool for identity safeguard)

### Example 2: Cross-Domain Tool Analysis  
```bash
claude-code "Use analyze_vendor_response to analyze:
Vendor: Nessus Vulnerability Scanner
Safeguard: 1.1
Response Text: During vulnerability assessments, we perform comprehensive network discovery and maintain detailed device databases with operating system detection, service enumeration, and hardware fingerprinting."
```

**Expected Result**: FACILITATES capability (vulnerability_management tool for asset safeguard)

---

## 3. get_safeguard_details

**Purpose**: Understand safeguard requirements and structure

### Example 1: Basic Safeguard Details
```bash
claude-code "Use get_safeguard_details for safeguard 1.1"
```

### Example 2: Detailed Safeguard with Examples
```bash  
claude-code "Use get_safeguard_details for safeguard 5.1 with include_examples set to true"
```

### Example 3: Multiple Safeguards Research
```bash
claude-code "Use get_safeguard_details to show me the requirements for safeguards 1.1, 5.1, and 6.3, then explain the differences in their governance elements"
```

---

## 4. list_available_safeguards

**Purpose**: Discover available CIS safeguards for analysis

### Example 1: Complete Safeguard List
```bash
claude-code "Use list_available_safeguards to show all available CIS safeguards"
```

### Example 2: Safeguard Discovery for Planning
```bash
claude-code "Use list_available_safeguards then identify which safeguards are most relevant for endpoint security vendor assessment"
```

---

## 🎯 Advanced Workflow Examples

### Comprehensive Vendor Assessment
```bash
# Step 1: Research the safeguard
claude-code "Use get_safeguard_details for safeguard 1.1 to understand requirements"

# Step 2: Analyze vendor response  
claude-code "Use analyze_vendor_response for vendor 'Lansweeper' and safeguard '1.1' with response: 'Our IT asset management platform provides automated network discovery, comprehensive hardware and software inventory, detailed asset tracking with ownership and location data, and customizable reporting for compliance requirements.'"

# Step 3: Validate specific capability claim
claude-code "Use validate_vendor_mapping to validate Lansweeper's claim of 'full' capability for safeguard 1.1 with the same response text"
```

### Bulk Vendor Analysis
```bash
# Create vendors.json file first
claude-code "Use analyze_vendor_response for each vendor in this list:
1. Vendor: CrowdStrike, Safeguard: 1.1, Response: 'Falcon provides real-time asset visibility...'
2. Vendor: Qualys VMDR, Safeguard: 1.1, Response: 'Our scanner discovers and inventories...'  
3. Vendor: ServiceNow CMDB, Safeguard: 1.1, Response: 'Complete asset lifecycle management...'"
```

### Domain Validation Testing
```bash
# Test auto-downgrade protection
claude-code "Use validate_vendor_mapping to test domain validation:
Vendor: Splunk SIEM
Safeguard: 1.1 (Asset Inventory)
Claimed: full
Supporting Text: Our SIEM platform logs all network device activity and maintains comprehensive asset visibility through log analysis and network monitoring."
```

**Expected**: Auto-downgrade from FULL → FACILITATES (SIEM ≠ inventory tool)

---

## 📊 Sample Responses

### Successful FULL Validation
```json
{
  "vendor_name": "ServiceNow CMDB",
  "safeguard_id": "1.1",
  "validation_status": "SUPPORTED",
  "confidence_score": 92,
  "validated_capability": "full",
  "domain_validation": {
    "tool_type": "cmdb",
    "domain_appropriate": true,
    "auto_downgrade_applied": false
  },
  "evidence_analysis": {
    "core_requirements_score": 95,
    "sub_elements_score": 85,
    "governance_elements_score": 90,
    "language_consistency_score": 98
  }
}
```

### Auto-Downgrade Example
```json
{
  "vendor_name": "Nessus Scanner", 
  "safeguard_id": "1.1",
  "validation_status": "QUESTIONABLE",
  "confidence_score": 65,
  "claimed_capability": "full",
  "validated_capability": "facilitates",
  "domain_validation": {
    "tool_type": "vulnerability_management",
    "domain_appropriate": false,
    "auto_downgrade_applied": true,
    "downgrade_reason": "Tool type mismatch: vulnerability scanners cannot provide FULL asset inventory coverage"
  }
}
```

---

## 🔍 Real-World Scenarios

### GRC Team Assessment
```bash
# Scenario: Evaluating vendors for CIS Control 5 (Account Management)
claude-code "Use get_safeguard_details for safeguard 5.1 then analyze these vendor responses for capability roles:

1. Okta: 'Comprehensive identity lifecycle management with automated provisioning, detailed user directories, and quarterly access reviews'
2. Active Directory: 'Centralized user account management with group policies and basic reporting'  
3. SailPoint: 'Identity governance with automated access reviews, certification campaigns, and detailed account analytics'"
```

### Security Tool Validation
```bash
# Scenario: Vendor claims validation for compliance audit
claude-code "Use validate_vendor_mapping to validate these capability claims:

Vendor: CyberArk PAM
Safeguard: 5.1
Claimed: full  
Supporting Text: Our privileged access management solution maintains comprehensive inventories of all privileged accounts, implements automated lifecycle management, provides detailed access tracking with ownership records, and includes quarterly certification processes with full audit trails."
```

### Multi-Safeguard Assessment
```bash
# Scenario: Comprehensive vendor evaluation across multiple controls
claude-code "Analyze this vendor across multiple safeguards:

Vendor: Microsoft Defender for Endpoint
Safeguards to assess: 1.1, 1.2, 7.1
Vendor Response: 'Our endpoint protection platform provides comprehensive asset discovery and inventory, unauthorized device detection and blocking, continuous vulnerability assessment with automated patch management, and detailed security reporting across all enterprise endpoints.'"
```

---

## 💡 Pro Tips

### 1. Understanding Domain Validation
- **Asset safeguards** (1.1, 1.2): Only inventory/CMDB tools can claim FULL/PARTIAL
- **Identity safeguards** (5.1, 6.3): Only identity management tools can claim FULL/PARTIAL  
- **Vulnerability safeguards** (7.1): Only vulnerability/patch management tools can claim FULL/PARTIAL
- **All tools** can claim FACILITATES, GOVERNANCE, or VALIDATES regardless of domain

### 2. Optimizing Confidence Scores
- **High scores (80-100%)**: Comprehensive coverage with specific implementation details
- **Medium scores (50-79%)**: Good coverage but missing some elements  
- **Low scores (0-49%)**: Limited coverage or vague responses

### 3. Common Validation Patterns
- **SUPPORTED**: Evidence strongly aligns with claimed capability
- **QUESTIONABLE**: Partial support or domain mismatch (auto-downgrade)
- **UNSUPPORTED**: Evidence does not support the claimed capability

### 4. Best Practices
- Always research safeguard requirements first using `get_safeguard_details`
- Use `analyze_vendor_response` when capability role is unknown
- Use `validate_vendor_mapping` when testing specific capability claims
- Include detailed vendor response text for better analysis accuracy

---

## 🚀 Integration Examples

### Claude Code Commands
```bash
# Quick capability check
claude-code "What capability role should Rapid7 InsightVM have for safeguard 7.1?"

# Detailed validation
claude-code "Validate whether Lansweeper can provide FULL coverage for asset inventory (safeguard 1.1)"

# Comparative analysis  
claude-code "Compare the capability roles of ServiceNow CMDB vs Lansweeper vs Device42 for safeguard 1.1"
```

### HTTP API Examples
```bash
# Health check
curl https://your-api.com/health

# List safeguards
curl https://your-api.com/api/safeguards

# Validate capability
curl -X POST https://your-api.com/api/validate-vendor-mapping \
  -H "Content-Type: application/json" \
  -d '{"vendor_name":"Test Vendor","safeguard_id":"1.1","claimed_capability":"facilitates","supporting_text":"Our tool enhances existing asset management systems with additional discovery capabilities and detailed reporting features."}'
```

---

**📝 Note**: All examples use real CIS Controls v8.1 safeguards and demonstrate actual vendor assessment scenarios.