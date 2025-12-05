// Shared TypeScript types for dual architecture

// Enhanced relationship type system for v1.5.4+
export type RelationshipType =
  | 'dependency'      // Must be implemented for this to work
  | 'prerequisite'    // Should be implemented first
  | 'complement'      // Work together synergistically
  | 'supports'        // Enhanced by this safeguard
  | 'validates'       // Provides evidence/validation
  | 'governance'      // Provides oversight/policy
  | 'sequence';       // Part of logical implementation sequence

export type RelationshipStrength =
  | 'critical'        // Essential relationship
  | 'strong'         // Important relationship
  | 'moderate'       // Useful relationship
  | 'weak';          // Minor relationship

export interface SafeguardRelationship {
  id: string;                    // Target safeguard ID
  type: RelationshipType;        // Why they're related
  strength: RelationshipStrength; // How important the relationship is
  context: string;               // Brief human-readable explanation
  bidirectional: boolean;        // Whether reverse relationship exists
  controlGroup?: string;         // Optional CIS Control grouping
}

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

  // Backward compatibility - existing consumers still get string[]
  relatedSafeguards: string[];

  // Enhanced relationships - new optional field for rich relationship data
  enhancedRelationships?: SafeguardRelationship[];

  // Capability-specific system prompts for different evaluation levels
  systemPromptFull?: {
    role: string;           // e.g., "asset_inventory_expert", "access_control_specialist"
    context: string;        // Brief context about the safeguard for AI understanding
    objective: string;      // What the AI should accomplish
    guidelines: string[];   // Specific evaluation criteria and methods
    outputFormat: string;   // Expected response structure for n8n processing
  };
  systemPromptPartial?: {
    role: string;
    context: string;
    objective: string;
    guidelines: string[];
    outputFormat: string;
  };
  systemPromptFacilitates?: {
    role: string;
    context: string;
    objective: string;
    guidelines: string[];
    outputFormat: string;
  };
  systemPromptGovernance?: {
    role: string;
    context: string;
    objective: string;
    guidelines: string[];
    outputFormat: string;
  };
  systemPromptValidates?: {
    role: string;
    context: string;
    objective: string;
    guidelines: string[];
    outputFormat: string;
  };
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

// Utility functions for enhanced relationship system

/**
 * Converts SafeguardRelationship[] to string[] for backward compatibility
 */
export function relationshipsToStringArray(relationships: SafeguardRelationship[]): string[] {
  return relationships.map(rel => rel.id);
}

/**
 * Converts string[] to basic SafeguardRelationship[] (when migrating legacy data)
 */
export function stringArrayToRelationships(
  ids: string[],
  defaultType: RelationshipType = 'supports',
  defaultStrength: RelationshipStrength = 'moderate'
): SafeguardRelationship[] {
  return ids.map(id => ({
    id,
    type: defaultType,
    strength: defaultStrength,
    context: `Legacy relationship to ${id}`,
    bidirectional: false
  }));
}

/**
 * Validates that all referenced safeguard IDs exist in the provided set
 */
export function validateSafeguardReferences(
  relationships: SafeguardRelationship[],
  validSafeguardIds: Set<string>
): ValidationResult {
  const invalidIds: string[] = [];

  for (const rel of relationships) {
    if (!validSafeguardIds.has(rel.id)) {
      invalidIds.push(rel.id);
    }
  }

  return {
    isValid: invalidIds.length === 0,
    errors: invalidIds.map(id => `Invalid safeguard ID reference: ${id}`)
  };
}

/**
 * Validates bidirectional relationship consistency
 * Returns relationships that claim to be bidirectional but lack reverse relationships
 */
export function validateBidirectionalConsistency(
  safeguardId: string,
  relationships: SafeguardRelationship[],
  allSafeguards: Map<string, SafeguardElement>
): ValidationResult {
  const errors: string[] = [];

  for (const rel of relationships) {
    if (rel.bidirectional) {
      const targetSafeguard = allSafeguards.get(rel.id);
      if (!targetSafeguard?.enhancedRelationships) {
        errors.push(`Bidirectional relationship with ${rel.id} but target has no enhanced relationships`);
        continue;
      }

      const reverseRelExists = targetSafeguard.enhancedRelationships.some(
        reverseRel => reverseRel.id === safeguardId && reverseRel.bidirectional
      );

      if (!reverseRelExists) {
        errors.push(`Bidirectional relationship with ${rel.id} but no reverse relationship found`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates relationship data integrity for a single safeguard
 */
export function validateSafeguardRelationships(
  safeguard: SafeguardElement,
  allSafeguards: Map<string, SafeguardElement>
): ValidationResult {
  const errors: string[] = [];

  if (!safeguard.enhancedRelationships) {
    // Only validate basic string array consistency
    if (safeguard.relatedSafeguards.length === 0) {
      return { isValid: true, errors: [] };
    }

    const validIds = new Set(allSafeguards.keys());
    const invalidBasicRefs = safeguard.relatedSafeguards.filter(id => !validIds.has(id));
    if (invalidBasicRefs.length > 0) {
      errors.push(...invalidBasicRefs.map(id => `Invalid basic reference: ${id}`));
    }
  } else {
    // Validate enhanced relationships
    const validIds = new Set(allSafeguards.keys());
    const refValidation = validateSafeguardReferences(safeguard.enhancedRelationships, validIds);
    errors.push(...refValidation.errors);

    const bidirValidation = validateBidirectionalConsistency(
      safeguard.id,
      safeguard.enhancedRelationships,
      allSafeguards
    );
    errors.push(...bidirValidation.errors);

    // Validate consistency between legacy and enhanced relationships
    const enhancedIds = new Set(relationshipsToStringArray(safeguard.enhancedRelationships));
    const legacyIds = new Set(safeguard.relatedSafeguards);

    // Check if legacy array matches enhanced relationships
    if (enhancedIds.size !== legacyIds.size ||
        !Array.from(enhancedIds).every(id => legacyIds.has(id))) {
      errors.push('Mismatch between relatedSafeguards and enhancedRelationships arrays');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Finds potential circular dependencies in relationships
 */
export function detectCircularDependencies(
  allSafeguards: Map<string, SafeguardElement>
): ValidationResult {
  const errors: string[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(safeguardId: string, path: string[]): void {
    if (recursionStack.has(safeguardId)) {
      errors.push(`Circular dependency detected: ${[...path, safeguardId].join(' -> ')}`);
      return;
    }

    if (visited.has(safeguardId)) {
      return;
    }

    visited.add(safeguardId);
    recursionStack.add(safeguardId);

    const safeguard = allSafeguards.get(safeguardId);
    if (safeguard?.enhancedRelationships) {
      const dependencies = safeguard.enhancedRelationships.filter(
        rel => rel.type === 'dependency' || rel.type === 'prerequisite'
      );

      for (const dep of dependencies) {
        dfs(dep.id, [...path, safeguardId]);
      }
    }

    recursionStack.delete(safeguardId);
  }

  // Check all safeguards for circular dependencies
  for (const safeguardId of allSafeguards.keys()) {
    if (!visited.has(safeguardId)) {
      dfs(safeguardId, []);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

