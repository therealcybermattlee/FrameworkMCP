#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SafeguardElement {
  id: string;
  title: string;
  description: string;
  implementationGroup: 'IG1' | 'IG2' | 'IG3';
  assetType: string[];
  securityFunction: string[];
  // Color-coded elements from the CIS visualizations
  governanceElements: string[];      // Orange - MUST be met
  coreRequirements: string[];        // Green - The "what" of the safeguard
  subTaxonomicalElements: string[];  // Yellow - Sub-taxonomical elements
  implementationSuggestions: string[]; // Gray - Suggestions for implementation
  relatedSafeguards: string[];
  keywords: string[];
}

interface VendorAnalysis {
  vendor: string;
  safeguardId: string;
  safeguardTitle: string;
  governance: boolean;
  facilitates: boolean;
  coverage: 'full' | 'partial' | 'none';
  validates: boolean;
  confidence: number;
  reasoning: string;
  evidence: string[];
  // Enhanced coverage analysis
  governanceElementsCovered: string[];
  coreRequirementsCovered: string[];
  subElementsCovered: string[];
  implementationMethodsUsed: string[];
  coverageBreakdown: {
    governance: number;    // % of orange elements covered
    core: number;         // % of green elements covered  
    subElements: number;  // % of yellow elements covered
    overall: number;      // Overall percentage
  };
}

interface AnalysisResult {
  summary: {
    totalVendors: number;
    safeguardId: string;
    safeguardTitle: string;
    byAttribute: {
      governance: number;
      facilitates: number;
      validates: number;
      fullCoverage: number;
      partialCoverage: number;
    };
    averageCoverageBreakdown: {
      governance: number;
      core: number;
      subElements: number;
      overall: number;
    };
  };
  vendors: VendorAnalysis[];
  recommendations: string[];
}

// Enhanced CIS Controls Framework Data with color-coded categorization
const CIS_SAFEGUARDS: Record<string, SafeguardElement> = {
  "1.1": {
    id: "1.1",
    title: "Establish and Maintain a Detailed Enterprise Asset Inventory",
    description: "Establish and maintain an accurate, detailed, and up-to-date inventory of all enterprise assets with the potential to store or process data",
    implementationGroup: "IG1",
    assetType: ["end-user devices", "network devices", "IoT devices", "servers"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish inventory process",
      "maintain inventory process", 
      "documented process",
      "review and update bi-annually",
      "enterprise asset management policy"
    ],
    coreRequirements: [ // Green - The "what" 
      "accurate inventory",
      "detailed inventory", 
      "up-to-date inventory",
      "all enterprise assets",
      "potential to store or process data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network address (if static)",
      "hardware address",
      "machine name",
      "enterprise asset owner",
      "department for each asset",
      "approved to connect to network",
      "end-user devices (portable and mobile)",
      "network devices",
      "non-computing/IoT devices", 
      "servers",
      "physical connection",
      "virtual connection", 
      "remote connection",
      "cloud environments",
      "regularly connected devices not under enterprise control"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "MDM type tools for mobile devices",
      "enterprise and software asset management tool",
      "asset discovery tools",
      "DHCP logging",
      "passive discovery tools"
    ],
    relatedSafeguards: ["1.2", "1.3", "1.4", "1.5", "2.1", "3.2", "4.1", "5.1"],
    keywords: ["asset", "inventory", "device", "network", "mobile", "IoT", "server", "detailed", "accurate", "up-to-date"]
  },
  "5.1": {
    id: "5.1",
    title: "Establish and Maintain an Inventory of Accounts",
    description: "Establish and maintain an inventory of all accounts managed in the enterprise",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish inventory process",
      "maintain inventory process",
      "validate all active accounts are authorized",
      "recurring schedule minimum quarterly",
      "account management policy"
    ],
    coreRequirements: [ // Green - The "what"
      "inventory of all accounts",
      "user accounts", 
      "administrator accounts",
      "managed in the enterprise"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "person's name",
      "username", 
      "start/stop dates",
      "department",
      "account status",
      "account type",
      "access rights",
      "last login date"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "identity and access management tool",
      "directory services",
      "automated account provisioning",
      "account lifecycle management",
      "role-based access control system"
    ],
    relatedSafeguards: ["1.1", "2.1", "5.2", "5.3", "5.4", "5.5", "5.6", "6.1", "6.2"],
    keywords: ["accounts", "inventory", "user", "administrator", "name", "username", "dates", "department", "quarterly"]
  },
  "6.3": {
    id: "6.3", 
    title: "Require MFA for Externally-Exposed Applications",
    description: "Require all externally-exposed enterprise or third-party applications to enforce MFA",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "require MFA enforcement",
      "policy for externally-exposed applications",
      "MFA compliance verification"
    ],
    coreRequirements: [ // Green - The "what"
      "multi-factor authentication",
      "all externally-exposed applications",
      "enterprise applications",
      "third-party applications",
      "enforce MFA where supported"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "authentication factors",
      "something you know (password)",
      "something you have (token)",
      "something you are (biometric)",
      "external access points",
      "application inventory",
      "exposure assessment"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "directory service enforcement",
      "SSO provider enforcement", 
      "multi-factor authentication tools",
      "SAML integration",
      "OAuth implementation",
      "conditional access policies"
    ],
    relatedSafeguards: ["2.1", "4.1", "5.1", "6.1", "6.2"],
    keywords: ["MFA", "multi-factor", "authentication", "externally-exposed", "applications", "third-party", "SSO", "directory"]
  },
  "7.1": {
    id: "7.1",
    title: "Establish and Maintain a Vulnerability Management Process",
    description: "Establish and maintain a documented vulnerability management process for enterprise assets",
    implementationGroup: "IG1",
    assetType: ["documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish documented process",
      "maintain vulnerability management process",
      "review and update documentation annually",
      "update when significant enterprise changes occur",
      "vulnerability management policy"
    ],
    coreRequirements: [ // Green - The "what"
      "vulnerability management process",
      "enterprise assets scope",
      "documented procedures",
      "vulnerability identification",
      "vulnerability assessment"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "vulnerability scanning procedures",
      "risk assessment criteria", 
      "remediation prioritization",
      "patch management integration",
      "vulnerability tracking",
      "reporting requirements",
      "roles and responsibilities",
      "escalation procedures"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vulnerability scanning tools",
      "patch management systems",
      "vulnerability databases",
      "CVSS scoring",
      "automated scanning",
      "vulnerability management platforms"
    ],
    relatedSafeguards: ["1.1", "2.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"],
    keywords: ["vulnerability", "management", "process", "documented", "annual", "review", "enterprise", "assets"]
  },
  "1.2": {
    id: "1.2",
    title: "Address Unauthorized Assets",
    description: "Ensure that a process exists to address unauthorized assets on a weekly basis",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "ensure process exists",
      "weekly basis requirement",
      "unauthorized asset handling policy"
    ],
    coreRequirements: [ // Green - The "what"
      "address unauthorized assets",
      "process to handle unauthorized devices",
      "weekly execution"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "unauthorized asset detection",
      "asset classification",
      "response timeline",
      "documentation requirements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "remove asset from network",
      "deny asset from connecting remotely", 
      "quarantine asset",
      "automated response systems",
      "network access control"
    ],
    relatedSafeguards: ["1.1", "1.3"],
    keywords: ["unauthorized", "assets", "weekly", "remove", "deny", "quarantine", "process"]
  }
};

class GRCAnalysisServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'framework-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_vendor_response',
          description: 'Analyze a vendor response for a specific CIS Control safeguard against the 4 GRC attributes with detailed sub-element coverage',
          inputSchema: {
            type: 'object',
            properties: {
              vendor_name: {
                type: 'string',
                description: 'Name of the vendor'
              },
              safeguard_id: {
                type: 'string',
                description: 'CIS Control safeguard ID (e.g., "5.1", "1.1", "6.3")',
                pattern: '^[0-9]+\\.[0-9]+$'
              },
              response_text: {
                type: 'string',
                description: 'Vendor response text to analyze'
              }
            },
            required: ['vendor_name', 'safeguard_id', 'response_text']
          }
        } as Tool,
        {
          name: 'get_safeguard_details',
          description: 'Get detailed information about a CIS Control safeguard including governance requirements, core elements, and sub-taxonomical breakdown',
          inputSchema: {
            type: 'object',
            properties: {
              safeguard_id: {
                type: 'string',
                description: 'CIS Control safeguard ID (e.g., "5.1", "1.1")',
                pattern: '^[0-9]+\\.[0-9]+$'
              },
              include_examples: {
                type: 'boolean',
                description: 'Include implementation examples and suggestions',
                default: true
              }
            },
            required: ['safeguard_id']
          }
        } as Tool,
        {
          name: 'validate_coverage_claim',
          description: 'Validate a vendor\'s coverage claim (FULL/PARTIAL) against specific safeguard requirements',
          inputSchema: {
            type: 'object',
            properties: {
              vendor_name: {
                type: 'string',
                description: 'Name of the vendor'
              },
              safeguard_id: {
                type: 'string',
                description: 'CIS Control safeguard ID',
                pattern: '^[0-9]+\\.[0-9]+$'
              },
              coverage_claim: {
                type: 'string',
                enum: ['FULL', 'PARTIAL'],
                description: 'Vendor\'s coverage claim'
              },
              response_text: {
                type: 'string',
                description: 'Vendor response explaining their coverage'
              },
              capabilities: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of vendor capabilities/attributes (Governance, Facilitates, Validates)'
              }
            },
            required: ['vendor_name', 'safeguard_id', 'coverage_claim', 'response_text', 'capabilities']
          }
        } as Tool,
        {
          name: 'list_available_safeguards',
          description: 'List all available CIS Control safeguards with their categorization',
          inputSchema: {
            type: 'object',
            properties: {
              implementation_group: {
                type: 'string',
                enum: ['IG1', 'IG2', 'IG3'],
                description: 'Filter by implementation group (optional)'
              },
              security_function: {
                type: 'string',
                enum: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover', 'Govern'],
                description: 'Filter by security function (optional)'
              }
            }
          }
        } as Tool
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_vendor_response':
            return await this.analyzeVendorResponse(args);
          case 'get_safeguard_details':
            return await this.getSafeguardDetails(args);
          case 'validate_coverage_claim':
            return await this.validateCoverageClaim(args);
          case 'list_available_safeguards':
            return await this.listAvailableSafeguards(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async getSafeguardDetails(args: any) {
    const { safeguard_id, include_examples = true } = args;
    
    const safeguard = CIS_SAFEGUARDS[safeguard_id];
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found. Use list_available_safeguards to see available safeguards.`);
    }

    const result = {
      ...safeguard,
      elementBreakdown: {
        governanceElements: {
          count: safeguard.governanceElements.length,
          description: "Orange elements - MUST be met for compliance",
          elements: safeguard.governanceElements
        },
        coreRequirements: {
          count: safeguard.coreRequirements.length,
          description: "Green elements - The 'what' of the safeguard",
          elements: safeguard.coreRequirements
        },
        subTaxonomicalElements: {
          count: safeguard.subTaxonomicalElements.length,
          description: "Yellow elements - Detailed sub-taxonomical components",
          elements: safeguard.subTaxonomicalElements
        },
        ...(include_examples && {
          implementationSuggestions: {
            count: safeguard.implementationSuggestions.length,
            description: "Gray elements - Implementation suggestions and methods",
            elements: safeguard.implementationSuggestions
          }
        })
      }
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async listAvailableSafeguards(args: any) {
    const { implementation_group, security_function } = args;
    
    let safeguards = Object.values(CIS_SAFEGUARDS);
    
    if (implementation_group) {
      safeguards = safeguards.filter(s => s.implementationGroup === implementation_group);
    }

    if (security_function) {
      safeguards = safeguards.filter(s => s.securityFunction.includes(security_function));
    }

    const summary = {
      totalSafeguards: safeguards.length,
      byImplementationGroup: {
        IG1: safeguards.filter(s => s.implementationGroup === 'IG1').length,
        IG2: safeguards.filter(s => s.implementationGroup === 'IG2').length,
        IG3: safeguards.filter(s => s.implementationGroup === 'IG3').length,
      },
      safeguards: safeguards.map(s => ({
        id: s.id,
        title: s.title,
        implementationGroup: s.implementationGroup,
        assetType: s.assetType,
        securityFunction: s.securityFunction
      }))
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async analyzeVendorResponse(args: any) {
    const { vendor_name, safeguard_id, response_text } = args;

    const safeguard = CIS_SAFEGUARDS[safeguard_id];
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found. Available safeguards: ${Object.keys(CIS_SAFEGUARDS).join(', ')}`);
    }

    const analysis = this.performEnhancedSafeguardAnalysis(vendor_name, safeguard, response_text);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  private async validateCoverageClaim(args: any) {
    const { vendor_name, safeguard_id, coverage_claim, response_text, capabilities } = args;

    const safeguard = CIS_SAFEGUARDS[safeguard_id];
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found`);
    }

    const analysis = this.performEnhancedSafeguardAnalysis(vendor_name, safeguard, response_text);
    
    // Validate the coverage claim
    const validation = this.validateClaim(coverage_claim, analysis, capabilities, safeguard);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            vendor: vendor_name,
            safeguardId: safeguard_id,
            claimedCoverage: coverage_claim,
            claimedCapabilities: capabilities,
            analysis,
            validation
          }, null, 2),
        },
      ],
    };
  }

  private performEnhancedSafeguardAnalysis(vendorName: string, safeguard: SafeguardElement, responseText: string): VendorAnalysis {
    const text = responseText.toLowerCase();
    
    // Enhanced keywords based on GRC attributes
    const governanceKeywords = [
      'policy', 'policies', 'manage', 'process', 'workflow', 'governance', 'grc', 
      'compliance management', 'documented', 'establish', 'maintain', 'procedure'
    ];
    
    const facilitatesKeywords = [
      'improve', 'enhance', 'optimize', 'faster', 'better', 'stronger', 'automate', 
      'streamline', 'efficiency', 'facilitate', 'support', 'enable', 'accelerate'
    ];
    
    const validatesKeywords = [
      'audit', 'report', 'evidence', 'verify', 'validate', 'check', 'monitor', 
      'compliance report', 'assessment', 'logging', 'tracking', 'review', 'attest'
    ];

    // Calculate GRC attribute scores
    const governanceScore = this.calculateKeywordScore(text, governanceKeywords);
    const facilitatesScore = this.calculateKeywordScore(text, facilitatesKeywords);
    const validatesScore = this.calculateKeywordScore(text, validatesKeywords);

    // Analyze coverage against each category of elements
    const governanceCoverage = this.analyzeElementCoverage(text, safeguard.governanceElements);
    const coreCoverage = this.analyzeElementCoverage(text, safeguard.coreRequirements);
    const subElementCoverage = this.analyzeElementCoverage(text, safeguard.subTaxonomicalElements);
    const implementationCoverage = this.analyzeElementCoverage(text, safeguard.implementationSuggestions);

    // Calculate overall coverage breakdown
    const coverageBreakdown = {
      governance: governanceCoverage.percentage,
      core: coreCoverage.percentage,
      subElements: subElementCoverage.percentage,
      overall: (governanceCoverage.percentage * 0.4 + coreCoverage.percentage * 0.4 + subElementCoverage.percentage * 0.2)
    };

    // Determine coverage level based on comprehensive analysis
    let coverage: 'full' | 'partial' | 'none' = 'none';
    if (coverageBreakdown.governance >= 80 && coverageBreakdown.core >= 70) {
      coverage = 'full';
    } else if (coverageBreakdown.overall >= 25) {
      coverage = 'partial';
    }

    // Extract evidence with enhanced context
    const evidence = this.extractEnhancedEvidence(responseText, safeguard);

    // Calculate confidence based on multiple factors
    const confidence = Math.min(
      (
        (governanceScore + facilitatesScore + validatesScore) / 3 * 0.4 +
        coverageBreakdown.overall / 100 * 0.6
      ) * 100,
      100
    );

    return {
      vendor: vendorName,
      safeguardId: safeguard.id,
      safeguardTitle: safeguard.title,
      governance: governanceScore > 0.3,
      facilitates: facilitatesScore > 0.3,
      coverage,
      validates: validatesScore > 0.3,
      confidence: Math.round(confidence),
      reasoning: this.generateEnhancedReasoning(governanceScore, facilitatesScore, validatesScore, coverageBreakdown, safeguard),
      evidence,
      governanceElementsCovered: governanceCoverage.coveredElements,
      coreRequirementsCovered: coreCoverage.coveredElements,
      subElementsCovered: subElementCoverage.coveredElements,
      implementationMethodsUsed: implementationCoverage.coveredElements,
      coverageBreakdown: {
        governance: Math.round(coverageBreakdown.governance),
        core: Math.round(coverageBreakdown.core),
        subElements: Math.round(coverageBreakdown.subElements),
        overall: Math.round(coverageBreakdown.overall)
      }
    };
  }

  private calculateKeywordScore(text: string, keywords: string[]): number {
    let score = 0;
    let matches = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.replace(/\s+/g, '\\s+'), 'gi');
      const keywordMatches = (text.match(regex) || []).length;
      if (keywordMatches > 0) {
        matches++;
        score += keywordMatches;
      }
    });

    return matches > 0 ? score / text.split(' ').length : 0;
  }

  private analyzeElementCoverage(text: string, elements: string[]): {
    percentage: number;
    coveredElements: string[];
    uncoveredElements: string[];
  } {
    const coveredElements: string[] = [];
    const uncoveredElements: string[] = [];

    elements.forEach(element => {
      const elementKeywords = element.toLowerCase().split(/[\s\-\(\)\/]+/).filter(w => w.length > 2);
      let elementFound = false;

      // Check for keyword matches
      for (const keyword of elementKeywords) {
        if (text.includes(keyword)) {
          elementFound = true;
          break;
        }
      }

      // Check for semantic matches
      if (!elementFound) {
        const regex = new RegExp(element.replace(/[()]/g, '').replace(/\s+/g, '\\s*'), 'gi');
        if (regex.test(text)) {
          elementFound = true;
        }
      }

      if (elementFound) {
        coveredElements.push(element);
      } else {
        uncoveredElements.push(element);
      }
    });

    return {
      percentage: elements.length > 0 ? (coveredElements.length / elements.length) * 100 : 0,
      coveredElements,
      uncoveredElements
    };
  }

  private extractEnhancedEvidence(text: string, safeguard: SafeguardElement): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const evidence: string[] = [];
    
    // Collect all keywords from all categories
    const allKeywords = [
      ...safeguard.keywords,
      ...safeguard.governanceElements,
      ...safeguard.coreRequirements,
      ...safeguard.subTaxonomicalElements
    ];

    // Extract relevant sentences
    allKeywords.forEach(keyword => {
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        const lowerKeyword = keyword.toLowerCase();
        
        if (lowerSentence.includes(lowerKeyword) && 
            !evidence.includes(sentence.trim()) && 
            evidence.length < 8) {
          evidence.push(sentence.trim());
        }
      });
    });

    return evidence;
  }

  private generateEnhancedReasoning(
    governance: number, 
    facilitates: number, 
    validates: number, 
    coverageBreakdown: any,
    safeguard: SafeguardElement
  ): string {
    const reasons = [];
    
    // GRC attribute analysis
    if (governance > 0.3) reasons.push(`Strong governance capabilities for ${safeguard.title}`);
    if (facilitates > 0.3) reasons.push(`Enhancement features that facilitate ${safeguard.id} implementation`);
    if (validates > 0.3) reasons.push(`Validation capabilities for ${safeguard.id} compliance verification`);
    
    // Coverage breakdown analysis
    reasons.push(`Coverage breakdown: ${coverageBreakdown.governance}% governance, ${coverageBreakdown.core}% core requirements, ${coverageBreakdown.subElements}% sub-elements`);
    
    if (coverageBreakdown.governance < 50) {
      reasons.push(`Limited governance element coverage may impact compliance`);
    }
    
    if (coverageBreakdown.core < 50) {
      reasons.push(`Core requirements coverage needs improvement`);
    }
    
    return reasons.join('. ');
  }

  private validateClaim(claim: string, analysis: VendorAnalysis, capabilities: string[], safeguard: SafeguardElement) {
    const validation = {
      coverageClaimValid: false,
      capabilityClaimsValid: {} as Record<string, boolean>,
      gaps: [] as string[],
      recommendations: [] as string[]
    };

    // Validate coverage claim
    if (claim === 'FULL') {
      // For FULL claim, should cover at least 80% of governance elements and 70% of core requirements
      const meetsFullCriteria = analysis.coverageBreakdown.governance >= 80 && 
                               analysis.coverageBreakdown.core >= 70;
      validation.coverageClaimValid = meetsFullCriteria;
      
      if (!meetsFullCriteria) {
        validation.gaps.push(`FULL coverage claim not supported: Governance ${analysis.coverageBreakdown.governance}% (need 80%+), Core ${analysis.coverageBreakdown.core}% (need 70%+)`);
      }
    } else if (claim === 'PARTIAL') {
      // For PARTIAL claim, should cover at least some elements
      const meetsPartialCriteria = analysis.coverageBreakdown.overall >= 20;
      validation.coverageClaimValid = meetsPartialCriteria;
      
      if (!meetsPartialCriteria) {
        validation.gaps.push(`PARTIAL coverage claim questionable: Overall coverage only ${analysis.coverageBreakdown.overall}%`);
      }
    }

    // Validate capability claims
    capabilities.forEach(capability => {
      switch (capability.toLowerCase()) {
        case 'governance':
          validation.capabilityClaimsValid[capability] = analysis.governance;
          if (!analysis.governance) {
            validation.gaps.push(`Governance capability not evidenced in response`);
          }
          break;
        case 'facilitates':
          validation.capabilityClaimsValid[capability] = analysis.facilitates;
          if (!analysis.facilitates) {
            validation.gaps.push(`Facilitates capability not evidenced in response`);
          }
          break;
        case 'validates':
          validation.capabilityClaimsValid[capability] = analysis.validates;
          if (!analysis.validates) {
            validation.gaps.push(`Validates capability not evidenced in response`);
          }
          break;
      }
    });

    // Generate recommendations
    if (validation.gaps.length === 0) {
      validation.recommendations.push(`Claims appear to be well-supported by the vendor response`);
    } else {
      validation.recommendations.push(`Consider requesting additional information about: ${validation.gaps.join(', ')}`);
      
      // Specific recommendations based on gaps
      if (analysis.coverageBreakdown.governance < 80) {
        validation.recommendations.push(`Request details on policy management and documented processes`);
      }
      
      if (analysis.coverageBreakdown.core < 70) {
        validation.recommendations.push(`Ask for specifics on how core safeguard requirements are met`);
      }
      
      if (!analysis.validates && capabilities.includes('Validates')) {
        validation.recommendations.push(`Request examples of audit trails, reporting capabilities, and compliance evidence`);
      }
    }

    return validation;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FrameworkMCP server running on stdio');
  }
}

const server = new GRCAnalysisServer();
server.run().catch(console.error);