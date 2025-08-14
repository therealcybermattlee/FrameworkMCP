# Example Usage

## Basic Vendor Analysis

```bash
# Analyze a single vendor response
claude-code "Analyze this vendor response for safeguard 5.1:
Vendor: SecureIAM Corp
Response: 'Our IAM platform maintains comprehensive account inventories with automated quarterly reviews ensuring all user and administrator accounts are properly documented and authorized.'"
```

## Coverage Validation

```bash
# Validate a vendor's coverage claim
claude-code "Validate this coverage claim:
Vendor: ComplianceBot  
Safeguard: 5.1
Claim: FULL coverage with Governance and Validates
Response: 'We provide complete account management with policy enforcement and audit reporting.'"
```

## Bulk Analysis

```bash
# Analyze multiple vendors from a file
claude-code "Analyze all vendor responses in examples/vendors.json and provide a comparison report"
```

## Safeguard Research

```bash
# Get detailed information about a safeguard
claude-code "Show me the complete breakdown of safeguard 5.1 including all governance elements, core requirements, and sub-taxonomical components"
```

## Generate Reports

```bash
# Create a comprehensive coverage report
claude-code "Generate a detailed coverage report for safeguard 5.1 showing how well each vendor addresses the governance, core, and sub-element requirements"
```
