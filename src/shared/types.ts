// Shared TypeScript types for dual architecture

export interface SafeguardElement {
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

export interface VendorAnalysis {
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


export interface PerformanceMetrics {
  uptime: number;
  totalRequests: number;
  errorCount: number;
  requestCounts: Map<string, number>;
  executionTimes: Map<string, number[]>;
  lastStatsLog: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface QualityAssessment {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number;
  evidence: string[];
  gaps: string[];
}

export type CapabilityType = 'full' | 'partial' | 'facilitates' | 'governance' | 'validates';

