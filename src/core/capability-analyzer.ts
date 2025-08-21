import { 
  SafeguardElement, 
  VendorAnalysis, 
  DomainValidationResult,
  PerformanceMetrics,
  CacheEntry,
  QualityAssessment,
  CapabilityType,
  DomainRequirement,
  ToolTypeWeights
} from '../shared/types.js';

// Domain-specific validation mapping
const SAFEGUARD_DOMAIN_REQUIREMENTS: Record<string, DomainRequirement> = {
  "1.1": {
    domain: "Asset Inventory",
    required_tool_types: ["inventory", "asset_management", "cmdb", "discovery"],
    description: "Only asset inventory and discovery tools can provide FULL/PARTIAL implementation capability"
  },
  "1.2": {
    domain: "Asset Management", 
    required_tool_types: ["inventory", "asset_management", "network_security", "nac"],
    description: "Asset management or network access control tools required for FULL/PARTIAL implementation capability"
  },
  "5.1": {
    domain: "Account Management",
    required_tool_types: ["identity_management", "iam", "directory", "account_management"],
    description: "Identity and account management tools required for FULL/PARTIAL implementation capability"
  },
  "6.3": {
    domain: "Authentication",
    required_tool_types: ["mfa", "authentication", "identity_management", "iam"],
    description: "Multi-factor authentication and identity tools required for FULL/PARTIAL implementation capability"
  },
  "7.1": {
    domain: "Vulnerability Management",
    required_tool_types: ["vulnerability_management", "vulnerability_scanner", "patch_management"],
    description: "Vulnerability management and scanning tools required for FULL/PARTIAL implementation capability"
  }
};

// Tool type detection weights for enhanced accuracy
const TOOL_TYPE_DETECTION_WEIGHTS: ToolTypeWeights = {
  inventory: {
    keywords: ['inventory', 'asset discovery', 'device enumeration', 'cmdb', 'configuration management database'],
    baseWeight: 3,
    contextBonuses: ['asset', 'device', 'hardware', 'software', 'endpoint']
  },
  asset_management: {
    keywords: ['asset management', 'asset tracking', 'asset lifecycle', 'asset monitoring'],
    baseWeight: 3,
    contextBonuses: ['lifecycle', 'tracking', 'monitoring', 'management']
  },
  identity_management: {
    keywords: ['identity', 'iam', 'identity management', 'user management', 'directory'],
    baseWeight: 3,
    contextBonuses: ['user', 'account', 'authentication', 'authorization', 'ldap', 'active directory']
  },
  vulnerability_management: {
    keywords: ['vulnerability', 'vuln', 'security scanning', 'penetration testing', 'patch management'],
    baseWeight: 3,
    contextBonuses: ['scan', 'test', 'patch', 'remediation', 'cve']
  },
  threat_intelligence: {
    keywords: ['threat intelligence', 'threat feeds', 'ioc', 'indicators', 'threat data'],
    baseWeight: 2,
    contextBonuses: ['intelligence', 'feeds', 'indicators', 'malware', 'threat']
  },
  governance: {
    keywords: ['grc', 'governance', 'compliance management', 'policy management', 'risk management'],
    baseWeight: 2,
    contextBonuses: ['policy', 'compliance', 'governance', 'risk', 'audit']
  }
};

export class CapabilityAnalyzer {
  private cache: Map<string, CacheEntry<any>>;
  private performanceMetrics: PerformanceMetrics;

  constructor() {
    this.cache = new Map();
    this.performanceMetrics = {
      uptime: Date.now(),
      totalRequests: 0,
      errorCount: 0,
      requestCounts: new Map(),
      executionTimes: new Map(),
      lastStatsLog: Date.now()
    };

    // Set up periodic cache cleanup
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  public performCapabilityAnalysis(vendorName: string, safeguard: SafeguardElement, responseText: string): VendorAnalysis {
    const startTime = Date.now();
    try {
      this.performanceMetrics.totalRequests++;
      
      const text = responseText.toLowerCase();
      
      // Step 1: Determine what type of capability this tool is claiming
      const claimedCapability = this.determineClaimedCapability(text, safeguard);
      
      // Step 2: Assess how well the tool executes that specific capability type  
      const qualityAssessment = this.assessCapabilityQuality(text, safeguard, claimedCapability);
      
      // Step 3: Generate capability-focused analysis
      const result = this.generateCapabilityAnalysis(vendorName, safeguard, responseText, claimedCapability, qualityAssessment);
      
      // Record performance metrics
      this.recordToolExecution('performCapabilityAnalysis', Date.now() - startTime);
      
      return result;
    } catch (error) {
      this.performanceMetrics.errorCount++;
      this.recordToolExecution('performCapabilityAnalysis_error', Date.now() - startTime);
      throw error;
    }
  }

  public validateVendorMapping(
    vendorName: string,
    safeguardId: string,
    claimedCapability: string,
    supportingText: string,
    safeguard: SafeguardElement
  ): DomainValidationResult {
    const startTime = Date.now();
    try {
      this.performanceMetrics.totalRequests++;
      
      const text = supportingText.toLowerCase();
      
      // Detect tool type and validate domain match
      const detectedToolType = this.detectToolType(supportingText, safeguard.id);
      const domainValidation = this.validateDomainMatch(safeguard.id, claimedCapability, detectedToolType);
      
      // Adjust capability if domain mismatch detected
      let effectiveCapability = claimedCapability;
      let originalClaim: string | undefined;
      
      if (domainValidation.should_adjust_capability) {
        originalClaim = claimedCapability;
        effectiveCapability = domainValidation.adjusted_capability!;
      }
      
      // Perform capability-focused analysis of the supporting text
      const actualAnalysis = this.performCapabilityAnalysis(vendorName, safeguard, supportingText);
      
      // Validate claimed capability against actual capability analysis and domain requirements
      const validation = this.assessCapabilityClaimAlignment(
        claimedCapability,
        effectiveCapability, 
        actualAnalysis,
        domainValidation,
        text
      );
      
      // Add domain validation gaps if capability was adjusted
      if (domainValidation.should_adjust_capability) {
        validation.gaps.unshift(`Domain mismatch: ${domainValidation.reasoning}`);
        validation.recommendations.unshift(`Correct capability mapping should be '${effectiveCapability.toUpperCase()}' for ${detectedToolType} tools`);
        // Reduce confidence for domain mismatches
        validation.confidence = Math.max(validation.confidence - 20, 0);
      }

      const result: DomainValidationResult = {
        vendor: vendorName,
        safeguard_id: safeguard.id,
        safeguard_title: safeguard.title,
        claimed_capability: claimedCapability,
        validation_status: validation.status as 'SUPPORTED' | 'QUESTIONABLE' | 'UNSUPPORTED',
        confidence_score: validation.confidence,
        evidence_analysis: {
          core_requirements_coverage: validation.core_requirements_coverage || 0,
          sub_elements_coverage: validation.sub_elements_coverage || 0,
          governance_alignment: validation.governance_alignment || 0,
          language_consistency: validation.language_consistency || 0
        },
        domain_validation: {
          required_tool_type: domainValidation.required_tool_types.join('/'),
          detected_tool_type: detectedToolType,
          domain_match: domainValidation.domain_match,
          capability_adjusted: domainValidation.should_adjust_capability,
          original_claim: originalClaim
        },
        gaps_identified: validation.gaps,
        strengths_identified: validation.strengths,
        recommendations: validation.recommendations,
        detailed_feedback: validation.feedback
      };

      // Record performance metrics
      this.recordToolExecution('validateVendorMapping', Date.now() - startTime);
      
      return result;
    } catch (error) {
      this.performanceMetrics.errorCount++;
      this.recordToolExecution('validateVendorMapping_error', Date.now() - startTime);
      throw error;
    }
  }

  private determineClaimedCapability(text: string, safeguard: SafeguardElement): CapabilityType {
    // Capability detection keywords - focused on what the tool DOES, not what elements it covers
    const governanceIndicators = [
      'policy', 'policies', 'manage', 'process', 'workflow', 'governance', 'grc', 
      'compliance management', 'documented', 'establish', 'maintain', 'procedure',
      'control', 'controls', 'framework', 'standard', 'enterprise risk management',
      'centralized management', 'oversight'
    ];
    
    const facilitatesIndicators = [
      'improve', 'enhance', 'optimize', 'faster', 'better', 'stronger', 'automate', 
      'streamline', 'efficiency', 'facilitate', 'support', 'enable', 'accelerate',
      'api', 'integration', 'data', 'export', 'import', 'sync', 'feed',
      'provides data', 'data source', 'data feeds', 'enrichment', 'data enrichment',
      'supplemental data', 'additional data', 'contextual data', 'threat data',
      'intelligence feeds', 'data aggregation', 'data collection', 'data gathering',
      'feeds data', 'populates', 'informs', 'enriches', 'supplements',
      'enables compliance', 'facilitates implementation', 'supports compliance',
      'creates framework', 'enables organizations', 'infrastructure', 'foundation',
      'template', 'templates', 'workflow automation', 'orchestration'
    ];
    
    const validatesIndicators = [
      'audit', 'report', 'evidence', 'verify', 'validate', 'check', 'monitor', 
      'compliance', 'compliance report', 'assessment', 'logging', 'tracking', 'review', 'attest',
      'dashboard', 'metrics', 'analytics', 'visibility', 'alert', 'attestation',
      'compliance tracking', 'audit trail', 'reporting capabilities', 'audit capabilities'
    ];

    // Direct implementation indicators (tools that actually perform the safeguard)
    const implementationIndicators = this.getImplementationIndicators(safeguard.id);
    
    // Calculate keyword presence scores
    const governanceScore = this.calculateKeywordScore(text, governanceIndicators);
    const facilitatesScore = this.calculateKeywordScore(text, facilitatesIndicators);
    const validatesScore = this.calculateKeywordScore(text, validatesIndicators);
    const implementationScore = this.calculateKeywordScore(text, implementationIndicators);
    
    // Determine claimed capability based on strongest indicators and patterns
    if (implementationScore > 0.2 && implementationScore >= Math.max(facilitatesScore, governanceScore, validatesScore)) {
      // Tool claims to directly implement the safeguard
      return implementationScore > 0.5 ? 'full' : 'partial';
    } else if (governanceScore > 0.2 && governanceScore >= Math.max(facilitatesScore, validatesScore)) {
      return 'governance';
    } else if (validatesScore > 0.2 && validatesScore >= facilitatesScore) {
      return 'validates';
    } else {
      return 'facilitates';
    }
  }

  private getImplementationIndicators(safeguardId: string): string[] {
    // Return specific indicators for what constitutes direct implementation for each safeguard
    const implementationMap: Record<string, string[]> = {
      "1.1": ['inventory', 'discovery', 'asset management', 'catalog', 'enumerate', 'scan devices', 'device database'],
      "1.2": ['unauthorized', 'rogue', 'detect', 'identify unauthorized', 'quarantine', 'block unauthorized'],
      "5.1": ['account inventory', 'user management', 'identity management', 'account lifecycle', 'user provisioning'],
      "6.3": ['multi-factor', 'mfa', '2fa', 'authentication', 'two-factor', 'multi-factor authentication'],
      "7.1": ['vulnerability', 'vuln', 'scanning', 'vulnerability management', 'security testing', 'penetration testing']
    };
    
    return implementationMap[safeguardId] || [];
  }

  private assessCapabilityQuality(text: string, safeguard: SafeguardElement, claimedCapability: string): QualityAssessment {
    // Assess how well the tool executes the claimed capability type
    const evidence: string[] = [];
    const gaps: string[] = [];
    
    // Quality assessment based on capability type
    let qualityScore = 0;
    
    switch (claimedCapability) {
      case 'full':
      case 'partial':
        qualityScore = this.assessImplementationQuality(text, safeguard, evidence, gaps);
        break;
      case 'facilitates':
        qualityScore = this.assessFacilitationQuality(text, evidence, gaps);
        break;
      case 'governance':
        qualityScore = this.assessGovernanceQuality(text, evidence, gaps);
        break;
      case 'validates':
        qualityScore = this.assessValidationQuality(text, evidence, gaps);
        break;
    }
    
    const quality = qualityScore >= 0.8 ? 'excellent' :
                   qualityScore >= 0.6 ? 'good' :
                   qualityScore >= 0.4 ? 'fair' : 'poor';
    
    return {
      quality,
      confidence: Math.round(qualityScore * 100),
      evidence,
      gaps
    };
  }

  private assessImplementationQuality(text: string, safeguard: SafeguardElement, evidence: string[], gaps: string[]): number {
    let score = 0;
    
    // Check for core implementation elements
    const coreScore = this.calculateElementCoverage(text, safeguard.coreRequirements);
    const subElementScore = this.calculateElementCoverage(text, safeguard.subTaxonomicalElements);
    const governanceScore = this.calculateElementCoverage(text, safeguard.governanceElements);
    
    if (coreScore > 0.5) {
      evidence.push('Strong coverage of core requirements');
      score += 0.4;
    } else if (coreScore > 0.2) {
      evidence.push('Partial coverage of core requirements');
      score += 0.2;
    } else {
      gaps.push('Limited coverage of core requirements');
    }
    
    if (subElementScore > 0.3) {
      evidence.push('Good coverage of sub-taxonomical elements');
      score += 0.3;
    } else {
      gaps.push('Limited sub-element coverage');
    }
    
    if (governanceScore > 0.3) {
      evidence.push('Addresses governance requirements');
      score += 0.3;
    } else {
      gaps.push('Limited governance element coverage');
    }
    
    return Math.min(score, 1.0);
  }

  private assessFacilitationQuality(text: string, evidence: string[], gaps: string[]): number {
    let score = 0;
    
    const facilitationKeywords = ['enhance', 'improve', 'optimize', 'enable', 'support', 'facilitate', 'streamline'];
    const integrationKeywords = ['api', 'integration', 'data feed', 'export', 'import', 'sync'];
    const automationKeywords = ['automate', 'automated', 'orchestration', 'workflow'];
    
    if (this.calculateKeywordScore(text, facilitationKeywords) > 0.1) {
      evidence.push('Clear facilitation capabilities');
      score += 0.4;
    }
    
    if (this.calculateKeywordScore(text, integrationKeywords) > 0.1) {
      evidence.push('Integration and data sharing capabilities');
      score += 0.3;
    }
    
    if (this.calculateKeywordScore(text, automationKeywords) > 0.1) {
      evidence.push('Automation and workflow capabilities');
      score += 0.3;
    }
    
    if (score < 0.4) {
      gaps.push('Limited evidence of facilitation capabilities');
    }
    
    return Math.min(score, 1.0);
  }

  private assessGovernanceQuality(text: string, evidence: string[], gaps: string[]): number {
    let score = 0;
    
    const policyKeywords = ['policy', 'policies', 'procedure', 'standard', 'framework'];
    const processKeywords = ['process', 'workflow', 'governance', 'management', 'oversight'];
    const complianceKeywords = ['compliance', 'grc', 'audit', 'risk management'];
    
    if (this.calculateKeywordScore(text, policyKeywords) > 0.1) {
      evidence.push('Policy and procedure management');
      score += 0.4;
    }
    
    if (this.calculateKeywordScore(text, processKeywords) > 0.1) {
      evidence.push('Process and workflow capabilities');
      score += 0.3;
    }
    
    if (this.calculateKeywordScore(text, complianceKeywords) > 0.1) {
      evidence.push('Compliance and risk management features');
      score += 0.3;
    }
    
    if (score < 0.4) {
      gaps.push('Limited governance capabilities evident');
    }
    
    return Math.min(score, 1.0);
  }

  private assessValidationQuality(text: string, evidence: string[], gaps: string[]): number {
    let score = 0;
    
    const auditKeywords = ['audit', 'audit trail', 'evidence', 'verification', 'validation'];
    const reportingKeywords = ['report', 'reporting', 'dashboard', 'metrics', 'analytics'];
    const monitoringKeywords = ['monitor', 'monitoring', 'tracking', 'logging', 'alerting'];
    
    if (this.calculateKeywordScore(text, auditKeywords) > 0.1) {
      evidence.push('Audit and evidence collection capabilities');
      score += 0.4;
    }
    
    if (this.calculateKeywordScore(text, reportingKeywords) > 0.1) {
      evidence.push('Reporting and analytics features');
      score += 0.3;
    }
    
    if (this.calculateKeywordScore(text, monitoringKeywords) > 0.1) {
      evidence.push('Monitoring and tracking capabilities');
      score += 0.3;
    }
    
    if (score < 0.4) {
      gaps.push('Limited validation and evidence capabilities');
    }
    
    return Math.min(score, 1.0);
  }

  private generateCapabilityAnalysis(
    vendorName: string,
    safeguard: SafeguardElement,
    responseText: string,
    claimedCapability: CapabilityType,
    qualityAssessment: QualityAssessment
  ): VendorAnalysis {
    const capabilities = {
      full: claimedCapability === 'full',
      partial: claimedCapability === 'partial',
      facilitates: claimedCapability === 'facilitates',
      governance: claimedCapability === 'governance',
      validates: claimedCapability === 'validates'
    };

    const toolCapabilityDescription = this.generateToolCapabilityDescription(claimedCapability, qualityAssessment);
    const recommendedUse = this.generateRecommendedUse(claimedCapability, safeguard);

    return {
      vendor: vendorName,
      safeguardId: safeguard.id,
      safeguardTitle: safeguard.title,
      capability: claimedCapability,
      capabilities,
      confidence: qualityAssessment.confidence,
      reasoning: `Primary capability: ${claimedCapability.toUpperCase()} (${qualityAssessment.quality} quality)`,
      evidence: qualityAssessment.evidence,
      toolCapabilityDescription,
      recommendedUse
    };
  }

  private generateToolCapabilityDescription(capability: CapabilityType, quality: QualityAssessment): string {
    const qualityDescriptions = {
      excellent: 'comprehensive and well-implemented',
      good: 'solid and effective',
      fair: 'basic but functional',
      poor: 'limited or unclear'
    };

    const capabilityDescriptions = {
      full: 'directly implements the complete safeguard functionality',
      partial: 'implements specific aspects of the safeguard with defined scope',
      facilitates: 'enhances and enables safeguard implementation by other tools or processes',
      governance: 'provides policy, process management, and oversight capabilities',
      validates: 'provides evidence collection, audit, and compliance validation capabilities'
    };

    return `This tool ${capabilityDescriptions[capability]} with ${qualityDescriptions[quality.quality]} capabilities.`;
  }

  private generateRecommendedUse(capability: CapabilityType, safeguard: SafeguardElement): string {
    const recommendations = {
      full: `Use as the primary implementation tool for ${safeguard.title}. Ensure comprehensive deployment and configuration.`,
      partial: `Use as a component within a broader safeguard implementation strategy. Supplement with additional tools or processes.`,
      facilitates: `Use to enhance and optimize existing safeguard implementation. Integrate with primary implementation tools.`,
      governance: `Use for policy management, process oversight, and compliance framework establishment for ${safeguard.title}.`,
      validates: `Use for evidence collection, audit preparation, and compliance validation of ${safeguard.title} implementation.`
    };

    return recommendations[capability];
  }

  private detectToolType(text: string, safeguardId: string): string {
    const lowerText = text.toLowerCase();
    let bestMatch = 'unknown';
    let highestScore = 0;

    for (const [toolType, config] of Object.entries(TOOL_TYPE_DETECTION_WEIGHTS)) {
      let score = 0;
      
      // Base keyword matching
      for (const keyword of config.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          score += config.baseWeight;
        }
      }
      
      // Context bonus keywords
      for (const bonus of config.contextBonuses) {
        if (lowerText.includes(bonus.toLowerCase())) {
          score += 1;
        }
      }
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = toolType;
      }
    }

    return bestMatch;
  }

  private validateDomainMatch(safeguardId: string, claimedCapability: string, detectedToolType: string) {
    const domainReq = SAFEGUARD_DOMAIN_REQUIREMENTS[safeguardId];
    
    if (!domainReq) {
      return {
        domain_match: true,
        should_adjust_capability: false,
        required_tool_types: ['any'],
        reasoning: 'No specific domain requirements for this safeguard'
      };
    }

    const needsDomainValidation = ['full', 'partial'].includes(claimedCapability.toLowerCase());
    
    if (!needsDomainValidation) {
      return {
        domain_match: true,
        should_adjust_capability: false,
        required_tool_types: domainReq.required_tool_types,
        reasoning: 'Domain validation not required for this capability type'
      };
    }

    const domainMatch = domainReq.required_tool_types.includes(detectedToolType);
    
    return {
      domain_match: domainMatch,
      should_adjust_capability: !domainMatch,
      adjusted_capability: !domainMatch ? 'facilitates' : undefined,
      required_tool_types: domainReq.required_tool_types,
      reasoning: !domainMatch ? 
        `Tool type '${detectedToolType}' cannot provide ${claimedCapability.toUpperCase()} coverage for ${domainReq.domain} safeguards` :
        'Tool type matches domain requirements'
    };
  }

  private assessCapabilityClaimAlignment(
    claimedCapability: string,
    effectiveCapability: string,
    actualAnalysis: VendorAnalysis,
    domainValidation: any,
    text: string
  ) {
    const gaps: string[] = [];
    const strengths: string[] = [];
    const recommendations: string[] = [];
    
    let confidence = actualAnalysis.confidence;
    let status = 'SUPPORTED';

    // Assess alignment between claimed and detected capabilities
    if (actualAnalysis.capability !== effectiveCapability.toLowerCase()) {
      gaps.push(`Claimed capability '${claimedCapability}' differs from detected capability '${actualAnalysis.capability}'`);
      confidence = Math.max(confidence - 15, 0);
    }

    // Add evidence from actual analysis
    if (actualAnalysis.evidence.length > 0) {
      strengths.push(...actualAnalysis.evidence);
    }

    // Determine final validation status
    if (confidence < 40) {
      status = 'UNSUPPORTED';
    } else if (confidence < 70 || !domainValidation.domain_match) {
      status = 'QUESTIONABLE';
    }

    return {
      status,
      confidence,
      gaps,
      strengths,
      recommendations,
      feedback: this.generateValidationFeedback(claimedCapability, actualAnalysis, domainValidation, confidence, status),
      core_requirements_coverage: 85, // Placeholder - would calculate from actual analysis
      sub_elements_coverage: 75,
      governance_alignment: 80,
      language_consistency: 90
    };
  }

  private generateValidationFeedback(
    claimedCapability: string,
    actualAnalysis: VendorAnalysis,
    domainValidation: any,
    confidence: number,
    status: string
  ): string {
    let feedback = `Validation of ${claimedCapability.toUpperCase()} capability claim: ${status} (${confidence}% alignment)\n\n`;
    
    if (domainValidation.should_adjust_capability) {
      feedback += `DOMAIN VALIDATION: Tool type '${domainValidation.detected_tool_type}' cannot provide ${claimedCapability.toUpperCase()} coverage for this safeguard. Capability automatically adjusted to FACILITATES.\n\n`;
    }
    
    if (actualAnalysis.evidence.length > 0) {
      feedback += 'STRENGTHS:\n';
      actualAnalysis.evidence.forEach(evidence => {
        feedback += `• ${evidence}\n`;
      });
      feedback += '\n';
    }
    
    feedback += `ASSESSMENT: ${actualAnalysis.toolCapabilityDescription}\n\n`;
    feedback += `RECOMMENDED USE: ${actualAnalysis.recommendedUse}`;
    
    return feedback;
  }

  private calculateKeywordScore(text: string, keywords: string[]): number {
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    return keywords.length > 0 ? matches / keywords.length : 0;
  }

  private calculateElementCoverage(text: string, elements: string[]): number {
    let matches = 0;
    for (const element of elements) {
      if (text.includes(element.toLowerCase())) {
        matches++;
      }
    }
    return elements.length > 0 ? matches / elements.length : 0;
  }

  private recordToolExecution(toolName: string, executionTime: number): void {
    // Update request count
    const currentCount = this.performanceMetrics.requestCounts.get(toolName) || 0;
    this.performanceMetrics.requestCounts.set(toolName, currentCount + 1);

    // Update execution times (keep last 100 measurements for rolling average)
    const times = this.performanceMetrics.executionTimes.get(toolName) || [];
    times.push(executionTime);
    if (times.length > 100) {
      times.shift(); // Remove oldest measurement
    }
    this.performanceMetrics.executionTimes.set(toolName, times);

    // Log performance stats every 5 minutes in production
    if (process.env.NODE_ENV === 'production' && 
        Date.now() - this.performanceMetrics.lastStatsLog > 5 * 60 * 1000) {
      this.logPerformanceStats();
    }
  }

  private logPerformanceStats(): void {
    const uptime = Math.round((Date.now() - this.performanceMetrics.uptime) / 1000);
    const errorRate = (this.performanceMetrics.errorCount / this.performanceMetrics.totalRequests * 100).toFixed(1);

    console.log(`[Framework MCP Performance] Uptime: ${uptime}s, Requests: ${this.performanceMetrics.totalRequests}, Error Rate: ${errorRate}%`);
    
    // Log per-tool average execution times
    for (const [toolName, times] of this.performanceMetrics.executionTimes.entries()) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`[Framework MCP Performance] ${toolName}: ${Math.round(avgTime)}ms avg`);
    }

    this.performanceMetrics.lastStatsLog = Date.now();
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      // Cache TTL: 5 minutes for most entries
      if (now - entry.timestamp > 5 * 60 * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`[Framework MCP Cache] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }
}