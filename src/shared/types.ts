// Shared TypeScript types for dual architecture

// Enhanced relationship type system.
//
// Describes how one safeguard relates to another -- NOT how a vendor tool
// relates to a safeguard. The former 'validates' and 'governance' members were
// removed with the capability-role taxonomy: even on this different axis, the
// words invite the compliance misreading the taxonomy retirement exists to
// prevent. Do not reintroduce them.
export type RelationshipType =
  | 'dependency'      // Must be implemented for this to work
  | 'prerequisite'    // Should be implemented first
  | 'complement'      // Work together synergistically
  | 'supports'        // Enhanced by this safeguard
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
}

/**
 * How many of a safeguard's taxonomical elements a tool addresses.
 *
 * This is deliberately NOT a statement about whether the safeguard is met.
 * 'all' means the tool addresses every taxonomical element of the safeguard --
 * it does NOT mean the enterprise is covered, compliant, or done. Estate
 * coverage depends on asset inventory, deployment footprint, and licensing,
 * none of which are assessable from a vendor response. See ScopeLimits.
 */
export type ElementsAddressed = 'all' | 'some' | 'none';

/**
 * What this framework explicitly CANNOT determine from a vendor response.
 * Carried alongside every assessment so that element completeness is never
 * mistaken for estate coverage.
 */
export interface ScopeLimits {
  /** Asset types the vendor claims to support. */
  vendorStatedAssetTypes: string[];
  /** Asset types CIS assigns to this safeguard. */
  safeguardAssetTypes: string[];
  /** Human-readable statement of what remains unassessed. */
  note: string;
}

/**
 * Assessment of a single tool against a single safeguard.
 *
 * Unit of analysis is one tool in isolation. Satisfying a safeguard is a
 * portfolio property: it typically requires multiple tools across asset types.
 * This shape cannot express that, and must not be read as if it does.
 */
export interface VendorAssessment {
  vendor: string;
  safeguardId: string;
  safeguardTitle: string;

  /** Axis 1 -- assessable from a vendor response. */
  elementsAddressed: ElementsAddressed;
  elementsAddressedDetail: {
    coreRequirements: string[];
    subTaxonomicalElements: string[];
    /** Elements the tool does NOT address. Often the most useful field here. */
    notAddressed: string[];
  };

  /** Axis 2 -- NOT assessable from a vendor response; stated, not guessed. */
  scopeLimits: ScopeLimits;

  confidence: number;
  reasoning: string;
  evidence: string[];
}

/**
 * Tool-level attribute, evaluated once per vendor -- not per safeguard.
 * Replaces the former GOVERNANCE capability role.
 */
export interface VendorProfile {
  vendor: string;
  /** Is this tool or service a GRC or policy service? */
  isGrcOrPolicyService: boolean;
}


export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

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

// Rate Limiting Types

/**
 * Configuration for rate limiting middleware
 */
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  max: number;           // Maximum requests per window
  skipIps?: string[];    // IP addresses to exempt from rate limiting
}

/**
 * Error response returned when rate limit is exceeded
 */
export interface RateLimitErrorResponse {
  error: string;         // Error message
  retryAfter?: number;   // Seconds until rate limit resets
  timestamp: string;     // ISO 8601 timestamp
}

