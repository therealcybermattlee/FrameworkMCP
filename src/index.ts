#!/usr/bin/env node

// Re-export the MCP server for backward compatibility
import { FrameworkMcpServer } from './interfaces/mcp/mcp-server.js';

// Start MCP server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new FrameworkMcpServer();
  server.run().catch(console.error);
}

export { FrameworkMcpServer } from './interfaces/mcp/mcp-server.js';
export { FrameworkHttpServer } from './interfaces/http/http-server.js';
export { CapabilityAnalyzer } from './core/capability-analyzer.js';
export { SafeguardManager } from './core/safeguard-manager.js';

// Clean architecture - all safeguards data moved to SafeguardManager

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SafeguardManager } from './core/safeguard-manager.js';

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
  // Primary capability categorization - what role does this tool play?
  capability: 'full' | 'partial' | 'facilitates' | 'governance' | 'validates';
  // Detailed capability breakdown
  capabilities: {
    full: boolean;        // Directly implements the core safeguard functionality
    partial: boolean;     // Implements limited aspects of the safeguard
    facilitates: boolean; // Enhances or enables safeguard implementation by others
    governance: boolean;  // Provides policy, process, and oversight capabilities
    validates: boolean;   // Provides evidence, audit, and validation reporting
  };
  confidence: number;
  reasoning: string;
  evidence: string[];
  // Capability-focused descriptions (replaces element coverage scoring)
  toolCapabilityDescription: string;  // What type of tool this is and its role
  recommendedUse: string;             // How practitioners should use this tool
}

interface AnalysisResult {
  summary: {
    totalVendors: number;
    safeguardId: string;
    safeguardTitle: string;
    byCapability: {
      full: number;         // Count of vendors doing full safeguard
      partial: number;      // Count of vendors doing partial safeguard  
      facilitates: number;  // Count of vendors facilitating safeguard
      governance: number;   // Count of vendors providing governance
      validates: number;    // Count of vendors providing validation
      none: number;         // Count of vendors with no relevant capability
    };
    elementCoverage: {
      coreRequirements: {
        total: number;
        coveredByAtLeastOne: number;
      };
      subTaxonomicalElements: {
        total: number;
        coveredByAtLeastOne: number;
      };
    };
  };
  vendors: VendorAnalysis[];
  recommendations: string[];
}

interface ValidationResult {
  vendor: string;
  safeguard_id: string;
  safeguard_title: string;
  claimed_capability: string;
  validation_status: 'SUPPORTED' | 'QUESTIONABLE' | 'UNSUPPORTED';
  confidence_score: number; // 0-100
  actual_capability_detected: string; // What capability the tool actually provides
  capability_confidence: number; // Confidence in the detected capability
  tool_capability_description: string; // Description of what type of tool this is
  recommended_use: string; // How practitioners should use this tool
  domain_validation: {
    required_tool_type: string;
    detected_tool_type: string;
    domain_match: boolean;
    capability_adjusted: boolean;
    original_claim?: string;
  };
  gaps_identified: string[];
  strengths_identified: string[];
  recommendations: string[];
  detailed_feedback: string;
}

// Domain-specific validation mapping
const SAFEGUARD_DOMAIN_REQUIREMENTS: Record<string, {
  domain: string;
  required_tool_types: string[];
  description: string;
}> = {
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

// CIS_SAFEGUARDS removed - data now managed by SafeguardManager class
// Legacy data removed to eliminate duplication and ensure single source of truth

export class GRCAnalysisServer {
  private server: Server;
  private safeguardManager: SafeguardManager;

  constructor() {
    this.server = new Server(
      {
        name: 'framework-mcp',
        version: '1.0.0',
      }
    );
    
    this.safeguardManager = new SafeguardManager();

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_vendor_response',
          description: 'Analyze a vendor response to determine their tool capability role (Full Implementation, Partial Implementation, Facilitates, Governance, or Validates) for a specific CIS Control safeguard',
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
                description: 'Vendor response text describing their tool capabilities for the safeguard'
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
        } as Tool,
        {
          name: 'validate_vendor_mapping',
          description: 'Validate whether a vendor\'s claimed capability role (Full Implementation/Partial Implementation/Facilitates/Governance/Validates) is actually supported by their supporting evidence for a specific CIS safeguard',
          inputSchema: {
            type: 'object',
            properties: {
              vendor_name: {
                type: 'string',
                description: 'Name of the vendor (optional)',
                default: 'Unknown Vendor'
              },
              safeguard_id: {
                type: 'string',
                description: 'CIS Control safeguard ID (e.g., "5.1", "1.1", "6.3")',
                pattern: '^[0-9]+\\.[0-9]+$'
              },
              claimed_capability: {
                type: 'string',
                enum: ['full', 'partial', 'facilitates', 'governance', 'validates'],
                description: 'Vendor\'s claimed capability role: full (complete implementation), partial (limited implementation), facilitates (enables/enhances), governance (policies/processes), validates (evidence/reporting)'
              },
              supporting_text: {
                type: 'string',
                description: 'Vendor\'s supporting evidence explaining how their tool fulfills the claimed capability role'
              }
            },
            required: ['safeguard_id', 'claimed_capability', 'supporting_text']
          }
        } as Tool
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      try {
        let result;
        switch (name) {
          case 'analyze_vendor_response':
            result = await this.analyzeVendorResponse(args);
            break;
          case 'get_safeguard_details':
            result = await this.getSafeguardDetails(args);
            break;
          case 'list_available_safeguards':
            result = await this.listAvailableSafeguards(args);
            break;
          case 'validate_vendor_mapping':
            result = await this.validateVendorMapping(args);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        // Record successful execution time
        const executionTime = Date.now() - startTime;
        this.recordToolExecution(name, executionTime);
        
        return result;
      } catch (error) {
        // Record error and performance metrics
        this.performanceMetrics.errorCount++;
        const executionTime = Date.now() - startTime;
        this.recordToolExecution(`${name}_error`, executionTime);
        
        const errorMessage = this.formatErrorMessage(error, name);
        console.error(`[FrameworkMCP] Tool execution error: ${name}`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
        };
      }
    });
  }

  private async getSafeguardDetails(args: any) {
    const { safeguard_id, include_examples = true } = args;
    
    // Input validation
    this.validateSafeguardId(safeguard_id);
    
    // Check cache first
    const cached = this.getCachedSafeguardDetails(safeguard_id, include_examples);
    if (cached) {
      return cached;
    }
    
    const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found`);
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

    const response = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };

    // Cache the result for future requests
    this.setCachedSafeguardDetails(safeguard_id, include_examples, response);

    return response;
  }

  private async listAvailableSafeguards(args: any) {
    const { implementation_group, security_function } = args;
    
    // Check cache for complete safeguard list (only if no filters applied)
    if (!implementation_group && !security_function && this.cache.safeguardList) {
      const cacheAge = Date.now() - this.cache.safeguardList.timestamp;
      if (cacheAge < 10 * 60 * 1000) { // 10 minute cache for safeguard list
        return this.cache.safeguardList.data;
      }
    }
    
    let safeguards = Object.values(this.safeguardManager.getAllSafeguards());
    
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

    const response = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };

    // Cache the complete list if no filters were applied
    if (!implementation_group && !security_function) {
      this.cache.safeguardList = {
        data: response,
        timestamp: Date.now()
      };
    }

    return response;
  }

  private async analyzeVendorResponse(args: any) {
    const { vendor_name, safeguard_id, response_text } = args;

    // Input validation
    this.validateSafeguardId(safeguard_id);
    this.validateTextInput(response_text, 'Response text');
    
    if (!vendor_name || typeof vendor_name !== 'string' || vendor_name.trim().length === 0) {
      throw new Error('Vendor name is required');
    }

    const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found`);
    }

    const analysis = this.performCapabilityAnalysis(vendor_name, safeguard, response_text);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }


  private performCapabilityAnalysis(vendorName: string, safeguard: SafeguardElement, responseText: string): VendorAnalysis {
    const text = responseText.toLowerCase();
    
    // Step 1: Determine what type of capability this tool is claiming
    const claimedCapability = this.determineClaimedCapability(text, safeguard);
    
    // Step 2: Assess how well the tool executes that specific capability type  
    const qualityAssessment = this.assessCapabilityQuality(text, safeguard, claimedCapability);
    
    // Step 3: Generate capability-focused analysis
    return this.generateCapabilityAnalysis(vendorName, safeguard, responseText, claimedCapability, qualityAssessment);
  }

  private determineClaimedCapability(text: string, safeguard: SafeguardElement): 'full' | 'partial' | 'facilitates' | 'governance' | 'validates' {
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

  private assessCapabilityQuality(text: string, safeguard: SafeguardElement, claimedCapability: string): {
    quality: 'excellent' | 'good' | 'fair' | 'poor',
    confidence: number,
    evidence: string[],
    gaps: string[]
  } {
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
      case 'governance':
        qualityScore = this.assessGovernanceQuality(text, safeguard, evidence, gaps);
        break;
      case 'facilitates':
        qualityScore = this.assessFacilitationQuality(text, safeguard, evidence, gaps);
        break;
      case 'validates':
        qualityScore = this.assessValidationQuality(text, safeguard, evidence, gaps);
        break;
    }
    
    // Convert score to quality rating
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (qualityScore >= 0.8) quality = 'excellent';
    else if (qualityScore >= 0.6) quality = 'good';
    else if (qualityScore >= 0.4) quality = 'fair';
    else quality = 'poor';
    
    return {
      quality,
      confidence: Math.round(qualityScore * 100),
      evidence: evidence.slice(0, 5), // Top 5 pieces of evidence
      gaps: gaps.slice(0, 3) // Top 3 gaps identified
    };
  }

  private assessImplementationQuality(text: string, safeguard: SafeguardElement, evidence: string[], gaps: string[]): number {
    // Assess quality of direct implementation capability
    const implementationIndicators = this.getImplementationIndicators(safeguard.id);
    let score = 0;
    
    // Check for strong implementation language
    const strongIndicators = implementationIndicators.filter(indicator => text.includes(indicator.toLowerCase()));
    if (strongIndicators.length > 0) {
      score += 0.4;
      evidence.push(`Strong implementation indicators: ${strongIndicators.join(', ')}`);
    }
    
    // Check for comprehensive functionality description
    if (text.includes('comprehensive') || text.includes('complete') || text.includes('full')) {
      score += 0.2;
      evidence.push('Claims comprehensive functionality');
    }
    
    // Check for automated vs manual implementation
    if (text.includes('automat') || text.includes('real-time') || text.includes('continuous')) {
      score += 0.2;
      evidence.push('Automated implementation capability');
    }
    
    // Identify potential gaps
    if (strongIndicators.length === 0) {
      gaps.push('No clear implementation indicators found');
    }
    
    return Math.min(score, 1.0);
  }

  private assessGovernanceQuality(text: string, safeguard: SafeguardElement, evidence: string[], gaps: string[]): number {
    const governanceIndicators = ['policy', 'process', 'governance', 'compliance', 'documentation', 'oversight'];
    let score = 0;
    
    const foundIndicators = governanceIndicators.filter(indicator => text.includes(indicator));
    if (foundIndicators.length >= 3) {
      score += 0.5;
      evidence.push(`Strong governance capability: ${foundIndicators.join(', ')}`);
    }
    
    if (text.includes('documented') && text.includes('process')) {
      score += 0.3;
      evidence.push('Documented process management');
    }
    
    return Math.min(score, 1.0);
  }

  private assessFacilitationQuality(text: string, safeguard: SafeguardElement, evidence: string[], gaps: string[]): number {
    const facilitationIndicators = ['enhance', 'enable', 'support', 'facilitate', 'improve', 'optimize'];
    let score = 0;
    
    const foundIndicators = facilitationIndicators.filter(indicator => text.includes(indicator));
    if (foundIndicators.length >= 2) {
      score += 0.4;
      evidence.push(`Clear facilitation capability: ${foundIndicators.join(', ')}`);
    }
    
    return Math.min(score, 1.0);
  }

  private assessValidationQuality(text: string, safeguard: SafeguardElement, evidence: string[], gaps: string[]): number {
    const validationIndicators = ['audit', 'report', 'monitor', 'track', 'verify', 'validate'];
    let score = 0;
    
    const foundIndicators = validationIndicators.filter(indicator => text.includes(indicator));
    if (foundIndicators.length >= 2) {
      score += 0.4;
      evidence.push(`Strong validation capability: ${foundIndicators.join(', ')}`);
    }
    
    return Math.min(score, 1.0);
  }

  private generateCapabilityAnalysis(vendorName: string, safeguard: SafeguardElement, responseText: string, 
                                   claimedCapability: string, qualityAssessment: any): VendorAnalysis {
    // Generate the new capability-focused analysis result
    return {
      vendor: vendorName,
      safeguardId: safeguard.id,
      safeguardTitle: safeguard.title,
      capability: claimedCapability as 'full' | 'partial' | 'facilitates' | 'governance' | 'validates',
      capabilities: {
        full: claimedCapability === 'full',
        partial: claimedCapability === 'partial',
        facilitates: claimedCapability === 'facilitates',
        governance: claimedCapability === 'governance',
        validates: claimedCapability === 'validates'
      },
      confidence: qualityAssessment.confidence,
      reasoning: this.generateCapabilityReasoning(claimedCapability, qualityAssessment, safeguard),
      evidence: qualityAssessment.evidence,
      // Note: elementsCovered is now less relevant in capability-focused analysis
      // We focus on tool capability rather than element coverage
      toolCapabilityDescription: this.generateToolCapabilityDescription(claimedCapability, qualityAssessment),
      recommendedUse: this.generateRecommendedUse(claimedCapability, safeguard)
    };
  }

  private generateCapabilityReasoning(claimedCapability: string, qualityAssessment: any, safeguard: SafeguardElement): string {
    const capabilityDescriptions = {
      full: "directly implements the core functionality of this safeguard",
      partial: "implements limited aspects of this safeguard with clear scope boundaries", 
      facilitates: "enhances or enables the implementation of this safeguard by others",
      governance: "provides governance, policy, and oversight capabilities for this safeguard",
      validates: "provides evidence, audit, and compliance validation for this safeguard"
    };
    
    const qualityDescriptor = qualityAssessment.quality;
    const description = capabilityDescriptions[claimedCapability as keyof typeof capabilityDescriptions];
    
    return `This tool ${description} with ${qualityDescriptor} capability quality. ${qualityAssessment.evidence.length > 0 ? 'Evidence: ' + qualityAssessment.evidence.join('; ') : ''}`;
  }

  private generateToolCapabilityDescription(claimedCapability: string, qualityAssessment: any): string {
    const roleDescriptions = {
      full: "Core Implementation Tool - Directly performs the safeguard functionality",
      partial: "Focused Implementation Tool - Performs specific aspects of the safeguard",
      facilitates: "Enablement Tool - Helps organizations implement the safeguard more effectively",
      governance: "Governance Tool - Manages policies, processes, and oversight for the safeguard", 
      validates: "Compliance Tool - Provides audit, evidence, and validation capabilities"
    };
    
    return roleDescriptions[claimedCapability as keyof typeof roleDescriptions] || "Support Tool";
  }

  private generateRecommendedUse(claimedCapability: string, safeguard: SafeguardElement): string {
    const recommendations = {
      full: `Use as primary implementation tool for ${safeguard.title}. Ensure proper configuration and integration.`,
      partial: `Use as part of a multi-tool strategy for ${safeguard.title}. Supplement with additional capabilities as needed.`,
      facilitates: `Use to enhance existing safeguard implementation. Combine with direct implementation tools.`,
      governance: `Use for policy management and governance oversight. Pair with implementation and validation tools.`,
      validates: `Use for compliance monitoring and evidence collection. Combine with implementation tools for complete coverage.`
    };
    
    return recommendations[claimedCapability as keyof typeof recommendations] || "Evaluate specific use case alignment.";
  }

  private calculateKeywordScore(text: string, keywords: string[]): number {
    let matchedKeywords = 0;
    let totalMatches = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.replace(/\s+/g, '\\s+'), 'gi');
      const keywordMatches = (text.match(regex) || []).length;
      if (keywordMatches > 0) {
        matchedKeywords++;
        totalMatches += keywordMatches;
      }
    });

    // Return percentage of keywords that were found, with bonus for multiple matches
    const baseScore = matchedKeywords / keywords.length;
    const matchBonus = Math.min(totalMatches * 0.1, 0.5); // Up to 50% bonus for multiple matches
    return Math.min(baseScore + matchBonus, 1.0);
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

  private analyzeBinaryElementCoverage(text: string, elements: string[]): {
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

    // Validate coverage claims
    if (claim === 'FULL') {
      const meetsFullCriteria = analysis.capabilities.full;
      validation.coverageClaimValid = meetsFullCriteria;
      
      if (!meetsFullCriteria) {
        validation.gaps.push(`FULL implementation capability claim not supported: Tool does not demonstrate direct implementation of core safeguard functionality`);
      }
    } else if (claim === 'PARTIAL') {
      const meetsPartialCriteria = analysis.capabilities.partial || analysis.capabilities.full;
      validation.coverageClaimValid = meetsPartialCriteria;
      
      if (!meetsPartialCriteria) {
        validation.gaps.push(`PARTIAL implementation capability claim questionable: No core or sub-taxonomical elements clearly addressed`);
      }
    }

    // Validate capability claims
    capabilities.forEach(capability => {
      switch (capability.toLowerCase()) {
        case 'governance':
          validation.capabilityClaimsValid[capability] = analysis.capabilities.governance;
          if (!analysis.capabilities.governance) {
            validation.gaps.push(`Governance capability not evidenced in response`);
          }
          break;
        case 'facilitates':
          validation.capabilityClaimsValid[capability] = analysis.capabilities.facilitates;
          if (!analysis.capabilities.facilitates) {
            validation.gaps.push(`Facilitates capability not evidenced in response`);
          }
          break;
        case 'validates':
          validation.capabilityClaimsValid[capability] = analysis.capabilities.validates;
          if (!analysis.capabilities.validates) {
            validation.gaps.push(`Validates capability not evidenced in response`);
          }
          break;
        case 'full':
          validation.capabilityClaimsValid[capability] = analysis.capabilities.full;
          if (!analysis.capabilities.full) {
            validation.gaps.push(`Full coverage capability not evidenced in response`);
          }
          break;
        case 'partial':
          validation.capabilityClaimsValid[capability] = analysis.capabilities.partial;
          if (!analysis.capabilities.partial) {
            validation.gaps.push(`Partial coverage capability not evidenced in response`);
          }
          break;
      }
    });

    // Generate recommendations
    if (validation.gaps.length === 0) {
      validation.recommendations.push(`Claims appear to be well-supported by the vendor response`);
    } else {
      validation.recommendations.push(`Consider requesting additional information about: ${validation.gaps.join(', ')}`);
      
      // Capability-based recommendations
      if (analysis.capability === 'facilitates') {
        validation.recommendations.push('Consider pairing with direct implementation tools for complete safeguard coverage');
      } else if (analysis.capability === 'partial') {
        validation.recommendations.push('Evaluate scope limitations and identify complementary tools for full coverage');
      } else if (analysis.capability === 'governance') {
        validation.recommendations.push('Combine with technical implementation tools for complete safeguard execution');
      } else if (analysis.capability === 'validates') {
        validation.recommendations.push('Pair with implementation tools to ensure both execution and validation coverage');
      }
      
      if (!analysis.capabilities.validates && capabilities.includes('Validates')) {
        validation.recommendations.push(`Request examples of audit trails, reporting capabilities, and compliance evidence`);
      }
    }

    return validation;
  }

  private async validateVendorMapping(args: any) {
    const { vendor_name = 'Unknown Vendor', safeguard_id, claimed_capability, supporting_text } = args;

    // Input validation
    this.validateSafeguardId(safeguard_id);
    this.validateTextInput(supporting_text, 'Supporting text');
    this.validateCapability(claimed_capability);

    const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found`);
    }

    const validation = this.validateCapabilityClaim(
      vendor_name, 
      safeguard, 
      claimed_capability, 
      supporting_text
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(validation, null, 2),
        },
      ],
    };
  }

  private validateCapabilityClaim(
    vendorName: string,
    safeguard: SafeguardElement,
    claimedCapability: string,
    supportingText: string
  ): ValidationResult {
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

    return {
      vendor: vendorName,
      safeguard_id: safeguard.id,
      safeguard_title: safeguard.title,
      claimed_capability: claimedCapability,
      validation_status: validation.status,
      confidence_score: validation.confidence,
      actual_capability_detected: actualAnalysis.capability,
      capability_confidence: actualAnalysis.confidence,
      tool_capability_description: actualAnalysis.toolCapabilityDescription,
      recommended_use: actualAnalysis.recommendedUse,
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
  }

  private assessCapabilityClaimAlignment(
    claimedCapability: string,
    effectiveCapability: string,
    actualAnalysis: VendorAnalysis,
    domainValidation: any,
    text: string
  ): {
    status: 'SUPPORTED' | 'QUESTIONABLE' | 'UNSUPPORTED';
    confidence: number;
    gaps: string[];
    strengths: string[];
    recommendations: string[];
    feedback: string;
  } {
    const gaps: string[] = [];
    const strengths: string[] = [];
    const recommendations: string[] = [];
    
    // Compare claimed capability with what we actually detected
    const claimedLower = claimedCapability.toLowerCase();
    const effectiveLower = effectiveCapability.toLowerCase();
    const actualCapability = actualAnalysis.capability;
    
    let alignmentScore = 0;
    
    // Check if claim aligns with actual analysis
    if (claimedLower === actualCapability) {
      alignmentScore = actualAnalysis.confidence;
      strengths.push(`Claimed capability '${claimedCapability}' aligns with detected capability`);
      strengths.push(`Tool demonstrates appropriate ${actualAnalysis.toolCapabilityDescription.toLowerCase()}`);
    } else if (effectiveLower === actualCapability) {
      // Domain validation adjusted the capability and it matches the analysis
      alignmentScore = Math.max(actualAnalysis.confidence - 20, 30);
      gaps.push(`Original claim '${claimedCapability}' doesn't match tool type, adjusted to '${effectiveCapability}'`);
      strengths.push(`Adjusted capability '${effectiveCapability}' aligns with tool analysis`);
    } else {
      // Neither claimed nor effective capability matches the analysis
      alignmentScore = Math.max(actualAnalysis.confidence - 40, 10);
      gaps.push(`Claimed capability '${claimedCapability}' doesn't align with detected capability '${actualCapability}'`);
      gaps.push(`Tool appears to be: ${actualAnalysis.toolCapabilityDescription}`);
    }
    
    // Add evidence from the capability analysis
    if (actualAnalysis.evidence && actualAnalysis.evidence.length > 0) {
      strengths.push(`Supporting evidence: ${actualAnalysis.evidence.slice(0, 2).join('; ')}`);
    }
    
    // Domain validation feedback
    if (!domainValidation.domain_match) {
      gaps.push(`Tool type '${domainValidation.detected_tool_type}' not appropriate for this safeguard domain`);
    }
    
    // Determine overall status based on alignment score
    let status: 'SUPPORTED' | 'QUESTIONABLE' | 'UNSUPPORTED';
    if (alignmentScore >= 70) {
      status = 'SUPPORTED';
    } else if (alignmentScore >= 40) {
      status = 'QUESTIONABLE';
    } else {
      status = 'UNSUPPORTED';
    }
    
    // Generate capability-focused recommendations
    recommendations.push(actualAnalysis.recommendedUse);
    
    if (status === 'QUESTIONABLE') {
      recommendations.push('Consider clarifying tool capabilities or adjusting capability claim');
    }
    
    if (!domainValidation.domain_match) {
      recommendations.push(`For ${actualCapability.toUpperCase()} capability, focus on how the tool ${actualCapability === 'facilitates' ? 'enables and enhances' : actualCapability === 'governance' ? 'manages policies and processes for' : actualCapability === 'validates' ? 'provides evidence and reporting on' : 'directly implements'} this safeguard`);
    }
    
    const feedback = this.generateCapabilityValidationFeedback(claimedCapability, effectiveCapability, actualCapability, status, alignmentScore, domainValidation);

    return {
      status,
      confidence: Math.round(alignmentScore),
      gaps,
      strengths,
      recommendations,
      feedback
    };
  }

  private hasFacilitationLanguage(text: string): boolean {
    const facilitationPatterns = [
      'enables', 'facilitates', 'supports', 'helps', 'provides framework',
      'creates infrastructure', 'enables organizations', 'supports compliance',
      'provides data', 'enriches', 'supplements', 'feeds data'
    ];
    return facilitationPatterns.some(pattern => text.includes(pattern));
  }

  private hasScopeBoundaries(text: string): boolean {
    const boundaryPatterns = [
      'covers', 'but not', 'limited to', 'specifically', 'only', 'excludes',
      'scope includes', 'scope excludes', 'within', 'applies to'
    ];
    return boundaryPatterns.some(pattern => text.includes(pattern));
  }

  private hasDirectImplementationLanguage(text: string): boolean {
    const implementationPatterns = [
      'directly implements', 'performs', 'executes', 'scans', 'catalogs',
      'inventories', 'manages assets', 'controls access', 'blocks threats'
    ];
    return implementationPatterns.some(pattern => text.includes(pattern));
  }

  private assessImplementationLanguage(text: string): number {
    const implementationKeywords = [
      'implements', 'performs', 'executes', 'manages', 'controls', 'maintains',
      'establishes', 'configures', 'monitors', 'tracks', 'inventories'
    ];
    return this.calculateKeywordScore(text, implementationKeywords) * 100;
  }

  private assessFacilitationLanguage(text: string): number {
    const facilitationKeywords = [
      'enables', 'facilitates', 'supports', 'helps', 'enhances', 'improves',
      'streamlines', 'automates', 'optimizes', 'provides framework'
    ];
    return this.calculateKeywordScore(text, facilitationKeywords) * 100;
  }

  private assessGovernanceLanguage(text: string): number {
    const governanceKeywords = [
      'policy', 'governance', 'compliance', 'oversight', 'management',
      'framework', 'procedures', 'processes', 'controls', 'standards'
    ];
    return this.calculateKeywordScore(text, governanceKeywords) * 100;
  }

  private assessValidationLanguage(text: string): number {
    const validationKeywords = [
      'audit', 'validate', 'verify', 'report', 'evidence', 'monitor',
      'assess', 'check', 'review', 'attest', 'compliance', 'compliance tracking',
      'compliance reports', 'audit capabilities', 'audit trail', 'reporting capabilities'
    ];
    return this.calculateKeywordScore(text, validationKeywords) * 100;
  }

  private detectToolType(text: string, safeguardId?: string): string {
    const lowerText = text.toLowerCase();
    
    // Enhanced keyword definitions with scoring weights and context
    const toolTypePatterns = {
      'inventory': {
        primary: [
          'asset management', 'inventory management', 'cmdb', 'configuration management database',
          'asset discovery', 'hardware inventory', 'software inventory', 'device inventory', 
          'asset tracking', 'it asset management', 'endpoint discovery', 'asset lifecycle'
        ],
        secondary: [
          'inventory', 'discovery', 'device management', 'endpoint management',
          'configuration management', 'asset database', 'equipment tracking'
        ],
        weight: { primary: 3, secondary: 1 }
      },
      'identity_management': {
        primary: [
          'identity management', 'iam', 'active directory', 'identity provider',
          'single sign-on', 'sso', 'multi-factor authentication', 'mfa',
          'user management', 'account management', 'directory service'
        ],
        secondary: [
          'ldap', 'authentication', 'access management', 'identity access management',
          'user directory', 'account lifecycle', 'privileged access'
        ],
        weight: { primary: 3, secondary: 1 }
      },
      'vulnerability_management': {
        primary: [
          'vulnerability management', 'vulnerability scanner', 'patch management',
          'security scanning', 'vulnerability assessment', 'penetration testing'
        ],
        secondary: [
          'vuln scan', 'security scanner', 'network scanner', 'scanning capabilities',
          'security assessment', 'vulnerability scanning', 'patch deployment'
        ],
        weight: { primary: 3, secondary: 1 }
      },
      'threat_intelligence': {
        primary: [
          'threat intelligence', 'cyber threat intelligence', 'threat intel',
          'threat feed', 'ioc feed', 'security intelligence', 'threat data'
        ],
        secondary: [
          'enrichment', 'data feed', 'contextual data', 'risk intelligence',
          'threat indicators', 'intelligence platform', 'threat correlation'
        ],
        weight: { primary: 3, secondary: 1 }
      },
      'network_security': {
        primary: [
          'firewall', 'network access control', 'nac', 'intrusion detection',
          'network security', 'network segmentation'
        ],
        secondary: [
          'network monitoring', 'traffic analysis', 'perimeter security',
          'network protection', 'network filtering'
        ],
        weight: { primary: 3, secondary: 1 }
      },
      'governance': {
        primary: [
          'grc', 'governance risk compliance', 'compliance management',
          'policy management', 'risk management', 'audit management'
        ],
        secondary: [
          'governance', 'compliance platform', 'policy enforcement',
          'regulatory compliance', 'framework management'
        ],
        weight: { primary: 3, secondary: 1 }
      },
      'security_analytics': {
        primary: [
          'siem', 'security information event management', 'security analytics',
          'soar', 'security orchestration', 'log management'
        ],
        secondary: [
          'security monitoring', 'event correlation', 'log analysis',
          'security intelligence', 'incident response platform'
        ],
        weight: { primary: 3, secondary: 1 }
      }
    };
    
    // Calculate scores for each tool type
    const toolScores: Record<string, number> = {};
    
    for (const [toolType, patterns] of Object.entries(toolTypePatterns)) {
      let score = 0;
      
      // Check primary keywords
      for (const keyword of patterns.primary) {
        if (lowerText.includes(keyword)) {
          score += patterns.weight.primary;
        }
      }
      
      // Check secondary keywords
      for (const keyword of patterns.secondary) {
        if (lowerText.includes(keyword)) {
          score += patterns.weight.secondary;
        }
      }
      
      toolScores[toolType] = score;
    }
    
    // Apply safeguard-specific context weighting if provided
    if (safeguardId && toolScores) {
      const contextBonus = 1; // Small bonus for domain alignment
      
      // Asset inventory safeguards (1.1, 1.2) favor inventory tools
      if (['1.1', '1.2'].includes(safeguardId) && toolScores['inventory'] > 0) {
        toolScores['inventory'] += contextBonus;
      }
      
      // Account inventory safeguards (5.1, 5.2, 5.3) favor identity tools
      if (['5.1', '5.2', '5.3'].includes(safeguardId) && toolScores['identity_management'] > 0) {
        toolScores['identity_management'] += contextBonus;
      }
      
      // Authentication safeguards (6.1, 6.2, 6.3) favor identity tools
      if (['6.1', '6.2', '6.3'].includes(safeguardId) && toolScores['identity_management'] > 0) {
        toolScores['identity_management'] += contextBonus;
      }
      
      // Vulnerability safeguards (7.1-7.7) favor vulnerability management tools
      if (['7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7'].includes(safeguardId) && toolScores['vulnerability_management'] > 0) {
        toolScores['vulnerability_management'] += contextBonus;
      }
    }
    
    // Find the tool type with highest score
    let maxScore = 0;
    let detectedType = 'unknown';
    
    for (const [toolType, score] of Object.entries(toolScores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = toolType;
      }
    }
    
    // Require minimum score threshold to avoid false positives
    return maxScore >= 2 ? detectedType : 'unknown';
  }

  private validateDomainMatch(
    safeguardId: string, 
    claimedCapability: string, 
    detectedToolType: string
  ): {
    domain_match: boolean;
    required_tool_types: string[];
    should_adjust_capability: boolean;
    adjusted_capability?: string;
    reasoning: string;
  } {
    const domainReq = SAFEGUARD_DOMAIN_REQUIREMENTS[safeguardId];
    
    if (!domainReq) {
      return {
        domain_match: true,
        required_tool_types: [],
        should_adjust_capability: false,
        reasoning: 'No domain restrictions defined for this safeguard'
      };
    }
    
    const isFullOrPartial = ['full', 'partial'].includes(claimedCapability.toLowerCase());
    const toolTypeMatches = domainReq.required_tool_types.includes(detectedToolType);
    
    if (isFullOrPartial && !toolTypeMatches) {
      return {
        domain_match: false,
        required_tool_types: domainReq.required_tool_types,
        should_adjust_capability: true,
        adjusted_capability: 'facilitates',
        reasoning: `${domainReq.domain} safeguard requires ${domainReq.required_tool_types.join('/')} tool types for FULL/PARTIAL implementation capability. Detected tool type '${detectedToolType}' can only facilitate implementation.`
      };
    }
    
    return {
      domain_match: true,
      required_tool_types: domainReq.required_tool_types,
      should_adjust_capability: false,
      reasoning: toolTypeMatches ? 
        `Tool type '${detectedToolType}' is appropriate for ${domainReq.domain} safeguard` :
        'No domain validation required for this capability type'
    };
  }

  private generateCapabilityValidationFeedback(
    claimedCapability: string,
    effectiveCapability: string,
    actualCapability: string,
    status: string,
    score: number,
    domainValidation: any
  ): string {
    let feedback = `Capability Validation: ${claimedCapability.toUpperCase()} claim is ${status} (${Math.round(score)}% confidence)\n\n`;
    
    // Analysis summary
    feedback += `ANALYSIS:\n`;
    feedback += `• Claimed: ${claimedCapability.toUpperCase()}\n`;
    if (effectiveCapability !== claimedCapability) {
      feedback += `• Domain Adjusted: ${effectiveCapability.toUpperCase()} (${domainValidation.reasoning})\n`;
    }
    feedback += `• Detected: ${actualCapability.toUpperCase()}\n`;
    feedback += `• Tool Type: ${domainValidation.detected_tool_type}\n\n`;
    
    // Assessment
    feedback += `ASSESSMENT: `;
    if (claimedCapability.toLowerCase() === actualCapability) {
      feedback += 'Claimed capability aligns perfectly with tool analysis.';
    } else if (effectiveCapability.toLowerCase() === actualCapability) {
      feedback += 'After domain validation adjustment, capability aligns with tool analysis.';
    } else {
      feedback += `Capability mismatch detected. Tool functions as ${actualCapability.toUpperCase()} rather than claimed ${claimedCapability.toUpperCase()}.`;
    }
    
    return feedback;
  }

  private generateValidationFeedback(
    claimedCapability: string,
    status: string,
    gaps: string[],
    strengths: string[],
    score: number
  ): string {
    let feedback = `Validation of ${claimedCapability.toUpperCase()} capability role claim: ${status} (${Math.round(score)}% alignment)\n\n`;
    
    if (strengths.length > 0) {
      feedback += `STRENGTHS:\n${strengths.map(s => `• ${s}`).join('\n')}\n\n`;
    }
    
    if (gaps.length > 0) {
      feedback += `GAPS IDENTIFIED:\n${gaps.map(g => `• ${g}`).join('\n')}\n\n`;
    }
    
    feedback += `ASSESSMENT: `;
    switch (status) {
      case 'SUPPORTED':
        feedback += 'The vendor\'s supporting evidence strongly aligns with their claimed capability role.';
        break;
      case 'QUESTIONABLE':
        feedback += 'The vendor\'s evidence partially supports their claim but has notable gaps or inconsistencies.';
        break;
      case 'UNSUPPORTED':
        feedback += 'The vendor\'s evidence does not adequately support their claimed capability role.';
        break;
    }
    
    return feedback;
  }

  // Enhanced error handling and formatting
  private formatErrorMessage(error: unknown, toolName: string): string {
    if (error instanceof Error) {
      // Production-friendly error messages
      switch (error.message) {
        case /^Safeguard .+ not found/.test(error.message) ? error.message : '':
          return `❌ Invalid safeguard ID. Use 'list_available_safeguards' to see available CIS Control safeguards.`;
        case /^Unknown tool/.test(error.message) ? error.message : '':
          return `❌ Tool '${toolName}' is not available. Available tools: analyze_vendor_response, validate_vendor_mapping, get_safeguard_details, list_available_safeguards.`;
        default:
          return `❌ Error in ${toolName}: ${error.message}`;
      }
    }
    return `❌ Unexpected error in ${toolName}: ${String(error)}`;
  }

  // Performance monitoring and caching
  private performanceMetrics = {
    toolExecutionTimes: new Map<string, number[]>(),
    startTime: Date.now(),
    totalRequests: 0,
    errorCount: 0
  };

  // Simple cache for safeguard details (most commonly requested data)
  private cache = {
    safeguardDetails: new Map<string, any>(),
    safeguardList: null as any,
    lastCacheCleanup: Date.now()
  };

  private getCachedSafeguardDetails(safeguardId: string, includeExamples: boolean): any | null {
    const cacheKey = `${safeguardId}_${includeExamples}`;
    const cached = this.cache.safeguardDetails.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) { // 5 minute cache
      return cached.data;
    }
    
    return null;
  }

  private setCachedSafeguardDetails(safeguardId: string, includeExamples: boolean, data: any): void {
    const cacheKey = `${safeguardId}_${includeExamples}`;
    this.cache.safeguardDetails.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    // Periodic cache cleanup to prevent memory leaks
    if (Date.now() - this.cache.lastCacheCleanup > 10 * 60 * 1000) { // 10 minutes
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    // Clean up safeguard details cache
    for (const [key, value] of this.cache.safeguardDetails.entries()) {
      if (now - value.timestamp > maxAge) {
        this.cache.safeguardDetails.delete(key);
      }
    }

    this.cache.lastCacheCleanup = now;
  }

  private recordToolExecution(toolName: string, executionTime: number) {
    this.performanceMetrics.totalRequests++;
    
    if (!this.performanceMetrics.toolExecutionTimes.has(toolName)) {
      this.performanceMetrics.toolExecutionTimes.set(toolName, []);
    }
    
    const times = this.performanceMetrics.toolExecutionTimes.get(toolName)!;
    times.push(executionTime);
    
    // Keep only last 100 measurements for memory efficiency
    if (times.length > 100) {
      times.shift();
    }
  }

  private getPerformanceStats(): string {
    const uptime = Date.now() - this.performanceMetrics.startTime;
    const avgTimes = Array.from(this.performanceMetrics.toolExecutionTimes.entries())
      .map(([tool, times]) => {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        return `${tool}: ${avg.toFixed(2)}ms`;
      });
    
    return `Performance Stats (Uptime: ${(uptime / 1000).toFixed(1)}s, Requests: ${this.performanceMetrics.totalRequests}, Errors: ${this.performanceMetrics.errorCount})\n${avgTimes.join(', ')}`;
  }

  // Input validation and sanitization
  private validateSafeguardId(safeguardId: string): void {
    if (!safeguardId || typeof safeguardId !== 'string') {
      throw new Error('Safeguard ID is required and must be a string');
    }
    
    if (!/^[0-9]+\.[0-9]+$/.test(safeguardId)) {
      throw new Error('Safeguard ID must be in format "X.Y" (e.g., "1.1", "5.1")');
    }
    
    if (!this.safeguardManager.getSafeguardDetails(safeguardId)) {
      throw new Error(`Safeguard ${safeguardId} not found`);
    }
  }

  private validateTextInput(text: string, fieldName: string): void {
    if (!text || typeof text !== 'string') {
      throw new Error(`${fieldName} is required and must be a string`);
    }
    
    if (text.length > 10000) {
      throw new Error(`${fieldName} must be less than 10,000 characters`);
    }
    
    if (text.trim().length < 10) {
      throw new Error(`${fieldName} must contain at least 10 meaningful characters`);
    }
  }

  private validateCapability(capability: string): void {
    const validCapabilities = ['full', 'partial', 'facilitates', 'governance', 'validates'];
    if (!validCapabilities.includes(capability.toLowerCase())) {
      throw new Error(`Invalid capability. Must be one of: ${validCapabilities.join(', ')}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('FrameworkMCP server running on stdio');
    
    // Log performance stats every 5 minutes in production
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        console.error(`[FrameworkMCP] ${this.getPerformanceStats()}`);
      }, 5 * 60 * 1000);
    }
  }
}

const server = new GRCAnalysisServer();
server.run().catch(console.error);