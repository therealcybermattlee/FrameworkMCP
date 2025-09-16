# LLM Analysis Patterns for Framework MCP v1.4.0

This guide demonstrates advanced analysis patterns enabled by Framework MCP's Pure Data Provider architecture. LLMs can now perform sophisticated, context-aware vendor capability analysis with unprecedented flexibility.

## 🎯 Core Analysis Philosophy

**Pure Data + Intelligent Analysis**: Framework MCP provides authoritative CIS Controls data while LLMs apply sophisticated reasoning, context awareness, and custom methodologies for vendor assessment.

## 📋 Standard Analysis Patterns

### 1. Basic Capability Assessment

**Pattern**: Get safeguard data → Analyze vendor response → Determine capability role

```bash
claude-code "Get safeguard details for 5.1, then analyze this vendor response: 
Okta - 'Our identity platform provides centralized user management, automated provisioning workflows, role-based access controls, and quarterly access reviews with compliance reporting.'

Determine the appropriate capability role and provide confidence assessment."
```

**Expected LLM Analysis**:
```
CAPABILITY ASSESSMENT: Okta vs Safeguard 5.1

PRIMARY ROLE: FULL
ADDITIONAL ROLES: GOVERNANCE, VALIDATES
CONFIDENCE: 89%

REASONING:
✅ Core Requirements: Complete user inventory and centralized management
✅ Sub-Elements: Automated workflows and role-based controls
✅ Governance: Quarterly review processes and compliance frameworks
✅ Validation: Reporting and audit capabilities

RECOMMENDATION: Strong FULL capability with governance and validation features. Suitable for IG2-IG3 implementations.
```

### 2. Comparative Multi-Vendor Analysis

**Pattern**: Get safeguard data → Compare multiple vendors → Rank and recommend

```bash
claude-code "Get safeguard 1.1 details. Compare these asset management solutions for a 500-employee technology company:

1. Lansweeper: 'Automated network discovery, comprehensive hardware/software inventory, real-time asset tracking'
2. ServiceNow CMDB: 'Configuration management database, workflow automation, change tracking'  
3. Microsoft Intune: 'Managed device inventory, Azure AD integration, mobile device management'

Rank by implementation completeness and provide deployment recommendations."
```

**Expected LLM Analysis**:
```
COMPARATIVE ANALYSIS: Asset Management Solutions (Safeguard 1.1)

RANKING BY IMPLEMENTATION COMPLETENESS:

🥇 LANSWEEPER (FULL + VALIDATES)
- Comprehensive automated discovery
- Real-time tracking capabilities  
- Strong technical implementation
- Deployment: Medium complexity, 2-3 months

🥈 MICROSOFT INTUNE (PARTIAL + GOVERNANCE)
- Limited to managed devices only
- Strong Azure integration advantage
- Good governance capabilities
- Deployment: Low complexity (if Microsoft stack), 1-2 months

🥉 SERVICENOW CMDB (FACILITATES + GOVERNANCE)  
- Requires manual data entry processes
- Excellent workflow and governance
- Facilitates comprehensive tracking
- Deployment: High complexity, 4-6 months

RECOMMENDATION FOR 500-EMPLOYEE TECH COMPANY:
- Primary: Lansweeper for immediate IG1 compliance
- Consider: Intune if Microsoft-centric environment  
- Future: ServiceNow for enterprise maturity and complex workflows
```

## 🎨 Advanced Analysis Patterns

### 3. Compliance-Focused Assessment

**Pattern**: Get safeguard data → Apply compliance framework → Assess vendor capability

```bash
claude-code "Get safeguard 8.2 details. For a PCI-DSS Level 1 merchant processing 10M+ transactions annually, analyze Splunk Enterprise Security:

'Centralized log management, real-time security monitoring, automated threat detection, compliance reporting, and data retention policies.'

Focus on PCI-DSS requirements and provide implementation timeline."
```

**Expected LLM Analysis**:
```
PCI-DSS COMPLIANCE ANALYSIS: Splunk Enterprise Security vs Safeguard 8.2

CAPABILITY: FULL + VALIDATES + GOVERNANCE
PCI-DSS ALIGNMENT: 94%

PCI-DSS REQUIREMENT MAPPING:
✅ 10.2 - Automated log generation for security events
✅ 10.3 - Record keeping for all system components  
✅ 10.5 - File integrity monitoring capabilities
✅ 10.6 - Daily log review processes
✅ 10.7 - Retention policies (1 year online, 3 years archive)

STRENGTHS FOR PCI-DSS:
- Real-time monitoring meets continuous compliance
- Automated reporting reduces manual audit burden
- Centralized architecture supports scope reduction
- Built-in retention policies align with requirements

IMPLEMENTATION TIMELINE:
- Phase 1 (Months 1-2): Core deployment and log source integration
- Phase 2 (Months 3-4): Compliance dashboard and reporting setup
- Phase 3 (Months 5-6): Advanced threat detection and response automation

GAP CONSIDERATIONS:
- Ensure cardholder data environment (CDE) log segregation
- Configure specific PCI-DSS compliance reports
- Establish incident response playbooks
```

### 4. Risk-Based Threat Assessment

**Pattern**: Get safeguard data → Consider threat landscape → Assess defensive capability

```bash
claude-code "Get details for safeguards 13.1, 13.3, and 13.6. Our financial services organization faces advanced persistent threats (APTs) and ransomware. 

Analyze CrowdStrike Falcon's network monitoring capability: 'Cloud-native endpoint detection, behavioral analytics, threat intelligence integration, automated response, and real-time network visibility.'

Prioritize safeguards by threat mitigation effectiveness."
```

**Expected LLM Analysis**:
```
THREAT-FOCUSED ANALYSIS: CrowdStrike Falcon vs Network Monitoring Safeguards

THREAT CONTEXT: Financial Services + APTs + Ransomware

SAFEGUARD PRIORITY RANKING:

1. 🚨 SAFEGUARD 13.1 (CRITICAL - FULL + VALIDATES)
   Network Boundary Monitoring
   - Real-time visibility detects lateral movement
   - Critical for APT detection and containment
   - Threat Score: 95% (Highest priority for APTs)

2. 🔍 SAFEGUARD 13.3 (HIGH - FULL + VALIDATES)  
   Network Traffic Flow Monitoring
   - Behavioral analytics identify anomalous patterns
   - Essential for ransomware early detection
   - Threat Score: 88% (High priority for data exfiltration)

3. 🛡️ SAFEGUARD 13.6 (MEDIUM - PARTIAL + FACILITATES)
   Deny Network Communications
   - Automated response supports blocking
   - Limited without network infrastructure integration
   - Threat Score: 72% (Effective but requires orchestration)

APT MITIGATION STRENGTHS:
- Cloud-native architecture resists tampering
- Behavioral analytics detect living-off-the-land techniques
- Threat intelligence provides IOC correlation
- Automated response reduces dwell time

RANSOMWARE PROTECTION:
- Early detection of encryption activities
- Network segmentation enforcement support
- Rapid containment and isolation capabilities

RECOMMENDATION:
Primary strength in 13.1 and 13.3 for threat detection. Supplement 13.6 with network access control integration for complete coverage.
```

### 5. Technology Stack Integration Assessment

**Pattern**: Get safeguard data → Consider existing technology → Assess integration potential

```bash
claude-code "Get safeguard 16.1 details. Our development team uses:
- Azure DevOps for CI/CD
- GitHub for source control  
- Docker containers
- Kubernetes orchestration

Analyze SonarQube's secure development capability: 'Static application security testing, code quality analysis, DevOps integration, policy enforcement, and security reporting.'

Recommend integration approach and configuration."
```

**Expected LLM Analysis**:
```
DEVOPS INTEGRATION ANALYSIS: SonarQube vs Safeguard 16.1

CAPABILITY: FULL + GOVERNANCE + VALIDATES
INTEGRATION FIT: 92% (Excellent)

TECHNOLOGY STACK ALIGNMENT:

✅ AZURE DEVOPS INTEGRATION
- Native YAML pipeline support
- Quality gates and build blocking
- Automated policy enforcement
- Pull request decoration

✅ GITHUB INTEGRATION  
- GitHub Actions compatibility
- PR checks and status updates
- Branch protection policy support
- Security advisory correlation

✅ CONTAINER/K8S SUPPORT
- Docker image scanning capabilities
- Kubernetes manifest analysis
- Infrastructure-as-Code security
- Container registry integration

IMPLEMENTATION APPROACH:

Phase 1: Core Integration (Weeks 1-2)
```yaml
# Azure DevOps Pipeline Integration
- task: SonarQubePrepare@4
  inputs:
    SonarQube: 'SonarQube-Connection'
    scannerMode: 'MSBuild'
    projectKey: 'MyProject'
    
- task: SonarQubeAnalyze@4

- task: SonarQubePublish@4
  inputs:
    pollingTimeoutSec: '300'
```

Phase 2: Quality Gates (Weeks 3-4)
- Configure quality profiles for your tech stack
- Set up security-focused quality gates
- Implement branch protection policies
- Enable automated PR blocking

Phase 3: Advanced Security (Weeks 5-6)
- Security hotspot review workflows
- SAST integration with SIEM/SOAR
- Compliance reporting automation
- Developer security training integration

CONFIGURATION RECOMMENDATIONS:
- Enable security-focused quality profiles
- Configure OWASP Top 10 rule sets
- Implement mandatory security reviews
- Set up vulnerability tracking integration
```

## 🔄 Dynamic Analysis Patterns

### 6. Gap Analysis and Roadmap Planning

**Pattern**: Get multiple safeguard data → Assess current coverage → Plan implementation roadmap

```bash
claude-code "Get details for safeguards 5.1, 5.2, 5.3, and 5.4 (all account management safeguards). 

Our current IAM stack:
- Azure AD for authentication
- Basic user provisioning  
- Manual quarterly reviews
- No privileged account management

Analyze gaps against CIS requirements and create 12-month implementation roadmap."
```

**Expected LLM Analysis**:
```
IAM GAP ANALYSIS & ROADMAP: Current State vs CIS Account Management (5.1-5.4)

CURRENT CAPABILITY ASSESSMENT:

✅ 5.1 (Account Inventory) - PARTIAL
- Azure AD provides user directory
- Missing automated inventory processes
- Gap: Real-time account tracking

❌ 5.2 (Automated Provisioning) - MINIMAL  
- Basic provisioning only
- Manual deprovisioning processes
- Gap: Lifecycle automation

❌ 5.3 (Privileged Account Management) - MISSING
- No PAM solution in place
- Shared admin accounts
- Gap: Complete privileged access control

🔍 5.4 (Account Access Review) - PARTIAL
- Quarterly manual reviews
- No automated workflows
- Gap: Continuous monitoring and automation

12-MONTH IMPLEMENTATION ROADMAP:

QUARTER 1 (Months 1-3): Foundation
- Deploy Azure AD Premium (automated provisioning)
- Implement automated user lifecycle management
- Establish privileged account inventory
- Target: 5.1 → FULL, 5.2 → PARTIAL

QUARTER 2 (Months 4-6): Privileged Access  
- Deploy CyberArk or Azure PIM
- Migrate shared accounts to PAM
- Implement just-in-time access
- Target: 5.3 → FULL

QUARTER 3 (Months 7-9): Review Automation
- Deploy access review automation
- Implement risk-based reviews
- Set up compliance reporting
- Target: 5.4 → FULL

QUARTER 4 (Months 10-12): Optimization
- Fine-tune automated processes
- Implement advanced analytics
- Establish continuous monitoring
- Target: All safeguards → FULL + VALIDATES

BUDGET CONSIDERATIONS:
- Azure AD Premium: $6/user/month
- PAM solution: $30-50/privileged user/month  
- Implementation services: $150K-200K
- Training and change management: $50K

SUCCESS METRICS:
- Time to provision/deprovision: <4 hours
- Privileged access review frequency: Weekly
- Account accuracy: >99%
- Compliance audit score: >95%
```

### 7. Custom Assessment Methodology

**Pattern**: Define custom criteria → Get safeguard data → Apply methodology → Assess vendor

```bash
claude-code "Get safeguard 12.4 details. Using a 'Zero Trust Network Architecture' assessment methodology, analyze Palo Alto Prisma:

'Next-generation firewall, cloud security, advanced threat detection, micro-segmentation, identity-based policies.'

Assessment criteria:
1. Identity verification (40% weight)
2. Device verification (25% weight)  
3. Network micro-segmentation (25% weight)
4. Continuous monitoring (10% weight)

Provide weighted scoring and Zero Trust alignment assessment."
```

**Expected LLM Analysis**:
```
ZERO TRUST ASSESSMENT: Palo Alto Prisma vs Safeguard 12.4

ZERO TRUST METHODOLOGY SCORING:

1. IDENTITY VERIFICATION (40% weight) - Score: 85/100
   ✅ Identity-based policy enforcement
   ✅ User and device context awareness
   ⚠️ Limited behavioral analytics (compared to dedicated UEBA)
   Weighted Score: 34/40

2. DEVICE VERIFICATION (25% weight) - Score: 90/100
   ✅ Advanced device fingerprinting
   ✅ Continuous device trust assessment
   ✅ Integration with endpoint protection
   Weighted Score: 22.5/25

3. NETWORK MICRO-SEGMENTATION (25% weight) - Score: 95/100
   ✅ Application-level micro-segmentation
   ✅ Dynamic policy enforcement
   ✅ East-west traffic inspection
   Weighted Score: 23.75/25

4. CONTINUOUS MONITORING (10% weight) - Score: 88/100
   ✅ Real-time threat detection
   ✅ Automated response capabilities
   ✅ Advanced analytics and ML
   Weighted Score: 8.8/10

OVERALL ZERO TRUST SCORE: 89.05/100

ZERO TRUST ALIGNMENT ASSESSMENT:

STRENGTHS:
- Excellent micro-segmentation capabilities align with Zero Trust principles
- Strong device verification and policy enforcement
- Comprehensive east-west traffic visibility
- Integration with cloud and on-premises environments

AREAS FOR ENHANCEMENT:
- Identity verification could benefit from UEBA integration
- Consider supplementing with dedicated identity analytics
- Enhance behavioral-based risk scoring

SAFEGUARD 12.4 MAPPING:
- CAPABILITY: FULL + VALIDATES
- Zero Trust Readiness: EXCELLENT (89%)
- Implementation Complexity: MEDIUM-HIGH

RECOMMENDATION:
Strong foundation for Zero Trust network architecture. Supplement with identity analytics platform for comprehensive Zero Trust implementation.
```

## 🎓 Educational Analysis Patterns

### 8. Learning-Focused Assessment

**Pattern**: Get safeguard data → Explain requirements → Demonstrate analysis thinking

```bash
claude-code "Get safeguard 11.1 details and explain each element in detail. Then analyze Acronis Cyber Backup:

'Automated backup scheduling, versioning, encryption, cloud replication, recovery testing, and compliance reporting.'

Walk through your analysis process step-by-step to demonstrate how to assess vendor capabilities against CIS requirements."
```

**Expected Educational LLM Analysis**:
```
EDUCATIONAL ANALYSIS: Understanding CIS Safeguard 11.1 Assessment

STEP 1: UNDERSTANDING THE SAFEGUARD
Safeguard 11.1: "Establish and Maintain a Data Recovery Process"

CORE REQUIREMENTS (What MUST be done):
- Automated backup processes
- Regular backup verification  
- Recovery procedures documentation
- Testing of recovery capabilities

SUB-ELEMENTS (Detailed components):
- Backup scheduling and automation
- Data encryption and protection
- Off-site storage and replication
- Recovery time/point objectives
- Documentation and procedures

GOVERNANCE ELEMENTS (Policy/Process):
- Backup policies and procedures
- Recovery testing schedules
- Compliance and audit requirements
- Roles and responsibilities

STEP 2: VENDOR RESPONSE ANALYSIS
Acronis Cyber Backup Claims Analysis:

✅ "Automated backup scheduling"
→ Directly addresses core requirement for automation
→ Evidence: Strong implementation language
→ Assessment: FULL capability indicator

✅ "Versioning"
→ Addresses sub-element for point-in-time recovery
→ Evidence: Technical capability mentioned
→ Assessment: FULL capability support

✅ "Encryption"  
→ Addresses sub-element for data protection
→ Evidence: Security capability present
→ Assessment: FULL capability component

✅ "Cloud replication"
→ Addresses sub-element for off-site storage
→ Evidence: Geographic separation capability
→ Assessment: FULL capability element

✅ "Recovery testing"
→ Directly addresses core requirement for verification
→ Evidence: Testing capability explicitly mentioned
→ Assessment: VALIDATES capability (provides evidence)

✅ "Compliance reporting"
→ Addresses governance element for audit
→ Evidence: Governance capability present
→ Assessment: GOVERNANCE + VALIDATES capability

STEP 3: CAPABILITY ROLE DETERMINATION

Primary Analysis Questions:
1. Does vendor directly implement the safeguard? → YES (automation, encryption, testing)
2. Does vendor provide complete coverage? → YES (all core elements covered)
3. Does vendor enhance governance? → YES (compliance reporting)
4. Does vendor provide validation? → YES (testing and reporting)

STEP 4: CONFIDENCE ASSESSMENT

Evidence Quality Evaluation:
- Specificity: HIGH (technical details provided)
- Coverage: COMPREHENSIVE (all elements addressed)  
- Implementation Language: STRONG (direct capability claims)
- Technical Depth: GOOD (encryption, automation, testing mentioned)

Confidence Factors:
+ Comprehensive coverage of requirements ✅
+ Strong technical implementation language ✅
+ Explicit testing and validation capabilities ✅
+ Governance and compliance features ✅
- Could use more detail on RTO/RPO objectives ⚠️

FINAL ASSESSMENT:

CAPABILITY ROLES: FULL + GOVERNANCE + VALIDATES
CONFIDENCE: 87%

REASONING:
Acronis demonstrates strong alignment with all core requirements and sub-elements of safeguard 11.1. The solution provides direct implementation (FULL), governance capabilities through compliance reporting (GOVERNANCE), and validation through recovery testing and reporting (VALIDATES).

LEARNING TAKEAWAY:
Effective vendor assessment requires:
1. Understanding each safeguard element
2. Mapping vendor capabilities to specific requirements
3. Evaluating evidence quality and specificity
4. Considering governance and validation aspects
5. Assigning confidence based on evidence strength
```

## 🔧 Implementation Best Practices

### Pattern Selection Guidelines

1. **Basic Assessment**: Single vendor, single safeguard
2. **Comparative Analysis**: Multiple vendors, single safeguard  
3. **Compliance Focus**: Single vendor, regulatory requirements
4. **Risk-Based**: Single vendor, threat landscape consideration
5. **Integration Assessment**: Single vendor, technology stack fit
6. **Gap Analysis**: Current state vs multiple safeguards
7. **Custom Methodology**: Specialized assessment criteria
8. **Educational**: Learning-focused detailed analysis

### Optimization Tips

- **Be Specific**: Include organizational context, risk profile, and technical environment
- **Request Structure**: Ask for confidence scores, reasoning, and recommendations
- **Compare Options**: Use comparative analysis for vendor selection decisions
- **Consider Integration**: Factor in existing technology stacks and processes
- **Plan Implementation**: Request timelines, costs, and success metrics
- **Learn Continuously**: Use educational patterns to build assessment expertise

---

**The Pure Data Provider architecture enables unlimited analysis creativity - these patterns are just the beginning of what's possible with authoritative CIS data and LLM intelligence.**