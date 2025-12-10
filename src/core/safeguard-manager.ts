import { SafeguardElement, CacheEntry } from '../shared/types.js';

export class SafeguardManager {
  private cache: Map<string, CacheEntry<any>>;
  private safeguards: Record<string, SafeguardElement> = {};
  private static readonly MAX_CACHE_SIZE = 1000; // Prevent unlimited cache growth
  private static readonly CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private safeguardKeysCache: string[] | null = null; // Pre-computed sorted keys
  private lastCleanup: number = 0;

  constructor() {
    this.cache = new Map();
    this.initializeSafeguards();
    this.precomputeSafeguardKeys();
  }

  public getSafeguardDetails(safeguardId: string, includeExamples: boolean = false): SafeguardElement | null {
    // Check cache first
    const cacheKey = `${safeguardId}_${includeExamples}`;
    const cached = this.getCachedSafeguardDetails(cacheKey);
    if (cached) {
      return cached;
    }

    const safeguard = this.safeguards[safeguardId];
    if (!safeguard) {
      return null;
    }

    // Add examples if requested
    let result = { ...safeguard };
    if (includeExamples) {
      result = this.addImplementationExamples(result);
    }

    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  public listAvailableSafeguards(): string[] {
    // Use pre-computed sorted keys for optimal performance
    if (this.safeguardKeysCache) {
      return [...this.safeguardKeysCache]; // Return copy to prevent external modification
    }

    // Fallback to original method if pre-computed cache not available
    const safeguardList = Object.keys(this.safeguards).sort((a, b) => {
      const [aMajor, aMinor] = a.split('.').map(Number);
      const [bMajor, bMinor] = b.split('.').map(Number);
      return aMajor - bMajor || aMinor - bMinor;
    });

    return safeguardList;
  }

  public getAllSafeguards(): Record<string, SafeguardElement> {
    return { ...this.safeguards };
  }

  public validateSafeguardId(safeguardId: string): void {
    if (!safeguardId || typeof safeguardId !== 'string') {
      throw new Error('Safeguard ID is required and must be a string');
    }
    
    if (!/^[0-9]+\.[0-9]+$/.test(safeguardId)) {
      throw new Error('Safeguard ID must be in format "X.Y" (e.g., "1.1", "5.1")');
    }

    if (!this.safeguards[safeguardId]) {
      const availableSafeguards = this.listAvailableSafeguards();
      throw new Error(`Safeguard ${safeguardId} not found. Available safeguards: ${availableSafeguards.join(', ')}`);
    }
  }

  private getCachedSafeguardDetails(cacheKey: string): SafeguardElement | null {
    // Clean up old cache entries periodically
    this.performCacheCleanupIfNeeded();
    
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) { // 5 minute cache
      return cached.data;
    }
    
    return null;
  }

  private precomputeSafeguardKeys(): void {
    // Pre-compute and cache the sorted safeguard keys for optimal listAvailableSafeguards() performance
    this.safeguardKeysCache = Object.keys(this.safeguards).sort((a, b) => {
      const [aMajor, aMinor] = a.split('.').map(Number);
      const [bMajor, bMinor] = b.split('.').map(Number);
      return aMajor - bMajor || aMinor - bMinor;
    });
  }

  private performCacheCleanupIfNeeded(): void {
    const now = Date.now();
    
    // Check if cleanup is needed
    if (now - this.lastCleanup < SafeguardManager.CACHE_CLEANUP_INTERVAL && 
        this.cache.size < SafeguardManager.MAX_CACHE_SIZE) {
      return;
    }

    // Remove expired entries
    const expiredKeys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > 5 * 60 * 1000) { // 5 minute expiry
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    // If still too many entries, remove oldest ones
    if (this.cache.size > SafeguardManager.MAX_CACHE_SIZE) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = sortedEntries.slice(0, this.cache.size - SafeguardManager.MAX_CACHE_SIZE);
      for (const [key] of entriesToRemove) {
        this.cache.delete(key);
      }
    }

    this.lastCleanup = now;
  }

  /**
   * Get cache statistics for monitoring and debugging
   */
  public getCacheStats(): { size: number; lastCleanup: number } {
    return {
      size: this.cache.size,
      lastCleanup: this.lastCleanup
    };
  }

  /**
   * Clear the cache manually if needed
   */
  public clearCache(): void {
    this.cache.clear();
    this.lastCleanup = Date.now();
  }

  private addImplementationExamples(safeguard: SafeguardElement): SafeguardElement {
    // Add implementation examples based on safeguard type
    const examples = this.getImplementationExamples(safeguard.id);
    
    return {
      ...safeguard,
      implementationSuggestions: [
        ...safeguard.implementationSuggestions,
        ...examples
      ]
    };
  }

  private getImplementationExamples(safeguardId: string): string[] {
    const exampleMap: Record<string, string[]> = {
      "1.1": [
        "Example: Use Lansweeper for automated asset discovery",
        "Example: Implement ServiceNow CMDB for centralized tracking",
        "Example: Deploy Microsoft SCCM for Windows asset management"
      ],
      "5.1": [
        "Example: Use Azure AD for centralized account management",
        "Example: Implement Okta for identity lifecycle management",
        "Example: Deploy JumpCloud for directory services"
      ],
      "6.3": [
        "Example: Enable Azure MFA for all external applications",
        "Example: Implement Duo Security for multi-factor authentication",
        "Example: Use Google Workspace SSO with MFA enforcement"
      ],
      "7.1": [
        "Example: Establish Nessus vulnerability scanning schedule",
        "Example: Implement Qualys VMDR for continuous monitoring",
        "Example: Use Rapid7 InsightVM for vulnerability management"
      ]
    };

    return exampleMap[safeguardId] || [];
  }

  private initializeSafeguards(): void {
    this.safeguards = {
  "1.1": {
    id: "1.1",
    title: "Establish and Maintain a Detailed Enterprise Asset Inventory",
    description: "Establish and maintain an accurate, detailed, and up-to-date inventory of all enterprise assets with the potential to store or process data",
    implementationGroup: "IG1",
    assetType: ["end-user devices", "network devices", "IoT devices", "servers"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain", 
      "Enterprise Asset Management Policy / Process",
      "Review and update the inventory of all enterprise assets bi-annually, or more frequently"
    ],
    coreRequirements: [ // Green - The "what" 
      "accurate, detailed, and up-to-date inventory of all enterprise assets with the potential to store or process data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Network Address (IF STATIC)",
      "Hardware Address",
      "Machine Name",
      "Enterprise asset owner",
      "Department for each asset",
      "Asset has been approved to connect to the network",
      "End-User Devices",
      "Mobile",
      "Portable",
      "Network Devices",
      "IOT Devices", 
      "Servers",
      "Connected to Infrastructure",
      "Physically",
      "Virtually", 
      "Remotely",
      "Those within cloud environments",
      "Regularly Connected Devices - NOT Under Control of Enterprise",
      "Detailed",
      "Accurate",
      "Up-to-date",
      "Potential to store or process data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "For mobile end-user devices, MDM type tools can support this process, where appropriate"
    ],
    relatedSafeguards: ["1.2", "1.3", "1.4", "1.5", "2.1", "3.2", "4.1", "5.1"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating enterprise asset inventory solutions against CIS Control 1.1 requirements for comprehensive asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating enterprise asset inventory solutions against CIS Control 1.1 requirements for comprehensive asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating enterprise asset inventory solutions against CIS Control 1.1 requirements for comprehensive asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating enterprise asset inventory solutions against CIS Control 1.1 requirements for comprehensive asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating enterprise asset inventory solutions against CIS Control 1.1 requirements for comprehensive asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "1.2": {
    id: "1.2",
    title: "Address Unauthorized Assets",
    description: "Ensure that a process exists to address unauthorized assets on a weekly basis",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Ensure that a process exists to address unauthorized assets on a weekly basis"
    ],
    coreRequirements: [ // Green - The "what"
      "Address Unauthorized Assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "On a weekly basis",
      "Ensure"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "The enterprise may choose to remove the asset from the network, deny the asset from connecting remotely to the network, or quarantine the asset"
    ],
    relatedSafeguards: ["1.1", "1.3"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating solutions for addressing unauthorized assets against CIS Control 1.2 requirements for weekly remediation processes.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating solutions for addressing unauthorized assets against CIS Control 1.2 requirements for weekly remediation processes.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating solutions for addressing unauthorized assets against CIS Control 1.2 requirements for weekly remediation processes.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating solutions for addressing unauthorized assets against CIS Control 1.2 requirements for weekly remediation processes.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating solutions for addressing unauthorized assets against CIS Control 1.2 requirements for weekly remediation processes.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "1.3": {
    id: "1.3",
    title: "Utilize an Active Discovery Tool",
    description: "Utilize an active discovery tool to identify assets connected to the enterprise's network. Configure the active discovery tool to execute daily, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Utilize an active discovery tool to identify assets connected to the enterprise's network",
      "Configure the active discovery tool to execute daily, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Active discovery tool"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Utilize",
      "Configure",
      "Execute daily",
      "Execute daily, or more frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "1.2", "1.4", "1.5"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating active discovery tools against CIS Control 1.3 requirements for daily network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating active discovery tools against CIS Control 1.3 requirements for daily network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating active discovery tools against CIS Control 1.3 requirements for daily network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating active discovery tools against CIS Control 1.3 requirements for daily network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating active discovery tools against CIS Control 1.3 requirements for daily network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "1.4": {
    id: "1.4", 
    title: "Use Dynamic Host Configuration Protocol (DHCP) Logging to Update Enterprise Asset Inventory",
    description: "Use DHCP logging on all DHCP servers or Internet Protocol (IP) address management tools to update the enterprise's asset inventory. Review and use logs to update the enterprise's asset inventory weekly, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Use DHCP logging on all DHCP servers or Internet Protocol (IP) address management tools to update the enterprise's asset inventory",
      "Review and use logs to update the enterprise's asset inventory weekly, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "DHCP Logging on all DHCP servers",
      "IPAM"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Use",
      "Review and Use Logs",
      "Update asset inventory",
      "Weekly",
      "More Frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "1.2", "1.3", "1.5"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating DHCP logging and IPAM solutions against CIS Control 1.4 requirements for network-based asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating DHCP logging and IPAM solutions against CIS Control 1.4 requirements for network-based asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating DHCP logging and IPAM solutions against CIS Control 1.4 requirements for network-based asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating DHCP logging and IPAM solutions against CIS Control 1.4 requirements for network-based asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating DHCP logging and IPAM solutions against CIS Control 1.4 requirements for network-based asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "1.5": {
    id: "1.5",
    title: "Use a Passive Asset Discovery Tool",
    description: "Use a passive discovery tool to identify assets connected to the enterprise's network. Review and use scans to update the enterprise's asset inventory at least weekly, or more frequently.",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Use a passive discovery tool to identify assets connected to the enterprise's network",
      "Review and use scans to update the enterprise's asset inventory at least weekly, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Passive Discovery Tool"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Use",
      "Review and Use scans",
      "Update asset inventory",
      "Weekly",
      "More Frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "1.2", "1.3", "1.4"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating passive discovery tools against CIS Control 1.5 requirements for non-intrusive network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating passive discovery tools against CIS Control 1.5 requirements for non-intrusive network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating passive discovery tools against CIS Control 1.5 requirements for non-intrusive network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating passive discovery tools against CIS Control 1.5 requirements for non-intrusive network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating passive discovery tools against CIS Control 1.5 requirements for non-intrusive network asset identification.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "2.1": {
    id: "2.1",
    title: "Establish and Maintain a Software Inventory",
    description: "Establish and maintain a detailed inventory of all licensed software installed on enterprise assets",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish and maintain a detailed inventory of all licensed software installed on enterprise assets",
      "The software inventory must document the title, publisher, initial install/use date, and business purpose for each entry; where appropriate, include the Uniform Resource Locator (URL), app store(s), version(s), deployment mechanism, and decommission date",
      "Review and update the software inventory bi-annually, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Detailed inventory of all licensed software",
      "Installed on enterprise Assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Establish",
      "Maintain",
      "Must Document",
      "Title",
      "Publisher",
      "Initial Install / Use Date",
      "Business Purpose",
      "URL",
      "App Store(s)",
      "App Version(s)",
      "Deployment mechanism",
      "Decomm. Date",
      "Where appropriate",
      "bi-annually",
      "More Frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating software inventory solutions against CIS Control 2.1 requirements for comprehensive licensed software tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating software inventory solutions against CIS Control 2.1 requirements for comprehensive licensed software tracking.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating software inventory solutions against CIS Control 2.1 requirements for comprehensive licensed software tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating software inventory solutions against CIS Control 2.1 requirements for comprehensive licensed software tracking.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating software inventory solutions against CIS Control 2.1 requirements for comprehensive licensed software tracking.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "2.2": {
    id: "2.2",
    title: "Ensure That Only Currently Supported Software Is Designated as Authorized",
    description: "Ensure that only currently supported software is designated as authorized in the software inventory",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Ensure that only currently supported software is designated as authorized in the software inventory for enterprise assets. If software is unsupported, yet necessary for the fulfillment of the enterprise's mission, document an exception detailing mitigating controls and residual risk acceptance. For any unsupported software without an exception documentation, designate as unauthorized. Review the software list to verify software support at least monthly, or more frequently."
    ],
    coreRequirements: [ // Green - The "what"
      "Currently supported software",
      "Authorized in the software inventory"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Ensure",
      "Determine if Authorized Software Is Currently Supported",
      "If Unsupported",
      "Determine Necessity for Business",
      "Document Exception detailing mitigating controls",
      "Document Residual risk acceptance",
      "Review the software list",
      "Monthly",
      "More frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "2.3", "2.4", "2.5", "2.6", "2.7"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating software lifecycle management solutions against CIS Control 2.2 requirements for ensuring only supported software is authorized.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating software lifecycle management solutions against CIS Control 2.2 requirements for ensuring only supported software is authorized.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating software lifecycle management solutions against CIS Control 2.2 requirements for ensuring only supported software is authorized.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating software lifecycle management solutions against CIS Control 2.2 requirements for ensuring only supported software is authorized.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating software lifecycle management solutions against CIS Control 2.2 requirements for ensuring only supported software is authorized.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "2.3": {
    id: "2.3",
    title: "Address Unauthorized Software",
    description: "Ensure that unauthorized software is either removed from use on enterprise assets or receives a documented exception. Review monthly, or more frequently.",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "Review monthly, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "unauthorized software is either removed from use on enterprise assets or receives a documented exception"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Address Unauthorized Software",
      "Remove from use",
      "Document Exception",
      "Monthly",
      "More Frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "2.2", "2.4", "2.5", "2.6", "2.7"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating software remediation solutions against CIS Control 2.3 requirements for addressing unauthorized software on enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating software remediation solutions against CIS Control 2.3 requirements for addressing unauthorized software on enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating software remediation solutions against CIS Control 2.3 requirements for addressing unauthorized software on enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating software remediation solutions against CIS Control 2.3 requirements for addressing unauthorized software on enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating software remediation solutions against CIS Control 2.3 requirements for addressing unauthorized software on enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "2.4": {
    id: "2.4",
    title: "Utilize Automated Software Inventory Tools",
    description: "Utilize software inventory tools, when possible, throughout the enterprise to automate the discovery and documentation of installed software.",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Utilize",
      "when possible"
    ],
    coreRequirements: [ // Green - The "what"
      "software inventory tools",
      "automate the discovery and documentation of installed software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Automate Discovery",
      "Automate Documentation",
      "Installed Software",
      "When possible"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.5", "2.6", "2.7"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating automated software inventory tools against CIS Control 2.4 requirements for enterprise-wide software discovery and documentation.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating automated software inventory tools against CIS Control 2.4 requirements for enterprise-wide software discovery and documentation.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating automated software inventory tools against CIS Control 2.4 requirements for enterprise-wide software discovery and documentation.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating automated software inventory tools against CIS Control 2.4 requirements for enterprise-wide software discovery and documentation.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating automated software inventory tools against CIS Control 2.4 requirements for enterprise-wide software discovery and documentation.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "2.5": {
    id: "2.5",
    title: "Allowlist Authorized Software",
    description: "Use technical controls, such as application allowlisting, to ensure that only authorized software can execute or be accessed. Reassess bi-annually, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Ensure",
      "Reassess bi-annually, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "technical controls",
      "only authorized software can execute or be accessed"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Allowlist Authorized Software",
      "Technical Controls",
      "Execute",
      "Accessed",
      "Reassess",
      "Bi-Annually",
      "More Frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Application Allowlisting"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.6", "2.7"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating application allowlisting solutions against CIS Control 2.5 requirements for restricting software execution to authorized applications only.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating application allowlisting solutions against CIS Control 2.5 requirements for restricting software execution to authorized applications only.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating application allowlisting solutions against CIS Control 2.5 requirements for restricting software execution to authorized applications only.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating application allowlisting solutions against CIS Control 2.5 requirements for restricting software execution to authorized applications only.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating application allowlisting solutions against CIS Control 2.5 requirements for restricting software execution to authorized applications only.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "2.6": {
    id: "2.6",
    title: "Allowlist Authorized Libraries",
    description: "Use technical controls to ensure that only authorized software libraries, such as specific .dll, .ocx, .so. files are allowed to load into a system process. Block unauthorized libraries from loading into a system process. Reassess bi-annually, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Ensure",
      "Block unauthorized libraries from loading into a system process",
      "Reassess bi-annually, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "technical controls",
      "only authorized software libraries",
      "are allowed to load into a system process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Only authorized software libraries",
      "Are allowed to load into a system process",
      "Technical Controls",
      "Block unauthorized libraries from loading into a system process",
      "Reassess",
      "Bi-Annually",
      "More Frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Specific .dll files",
      "Specific .ocx files",
      "Specific .so files"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.7"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating library allowlisting solutions against CIS Control 2.6 requirements for restricting software library loading to authorized libraries only.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating library allowlisting solutions against CIS Control 2.6 requirements for restricting software library loading to authorized libraries only.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating library allowlisting solutions against CIS Control 2.6 requirements for restricting software library loading to authorized libraries only.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating library allowlisting solutions against CIS Control 2.6 requirements for restricting software library loading to authorized libraries only.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating library allowlisting solutions against CIS Control 2.6 requirements for restricting software library loading to authorized libraries only.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "2.7": {
    id: "2.7",
    title: "Allowlist Authorized Scripts",
    description: "Use technical controls, such as digital signatures and version control, to ensure that only authorized scripts, such as specific .ps1, .py, files are allowed to execute. Block unauthorized scripts from executing. Reassess bi-annually, or more frequently.",
    implementationGroup: "IG3",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Ensure",
      "Block unauthorized scripts from executing",
      "Reassess bi-annually, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "technical controls",
      "only authorized files are allowed to execute"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Only authorized files are allowed to execute",
      "Technical Controls",
      "Block unauthorized scripts from executing",
      "Reassess",
      "Bi-Annually",
      "More Frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Digital signatures",
      "Version control",
      "Specific .ps1 files",
      "Specific .py files"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"],
    systemPromptFull: {

      role: "asset_inventory_expert",

      context: "You are evaluating script allowlisting solutions against CIS Control 2.7 requirements for restricting script execution to authorized scripts only.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "asset_inventory_expert",

      context: "You are evaluating script allowlisting solutions against CIS Control 2.7 requirements for restricting script execution to authorized scripts only.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "asset_inventory_expert",

      context: "You are evaluating script allowlisting solutions against CIS Control 2.7 requirements for restricting script execution to authorized scripts only.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "asset_inventory_expert",

      context: "You are evaluating script allowlisting solutions against CIS Control 2.7 requirements for restricting script execution to authorized scripts only.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "asset_inventory_expert",

      context: "You are evaluating script allowlisting solutions against CIS Control 2.7 requirements for restricting script execution to authorized scripts only.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.1": {
    id: "3.1",
    title: "Establish and Maintain a Data Management Process",
    description: "Establish and maintain a documented data management process. In the process, address data sensitivity, data owner, handling of data, data retention limits, and disposal requirements, based on sensitivity and retention standards for the enterprise. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented data management process",
      "address data sensitivity, data owner, handling of data, data retention limits, and disposal requirements, based on sensitivity and retention standards for the enterprise"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Documented Data management process",
      "Data Sensitivity",
      "Data Owner",
      "Data Handling",
      "Data Retention Limits",
      "Disposal Requirements",
      "Retention Standards",
      "Review and update documentation",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14"],
    systemPromptFull: {

      role: "data_governance_expert",

      context: "You are evaluating data management solutions against CIS Control 3.1 requirements for comprehensive data governance processes.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_governance_expert",

      context: "You are evaluating data management solutions against CIS Control 3.1 requirements for comprehensive data governance processes.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_governance_expert",

      context: "You are evaluating data management solutions against CIS Control 3.1 requirements for comprehensive data governance processes.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_governance_expert",

      context: "You are evaluating data management solutions against CIS Control 3.1 requirements for comprehensive data governance processes.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_governance_expert",

      context: "You are evaluating data management solutions against CIS Control 3.1 requirements for comprehensive data governance processes.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.2": {
    id: "3.2",
    title: "Establish and Maintain a Data Inventory",
    description: "Establish and maintain a data inventory based on the enterprise's data management process. Inventory sensitive data, at a minimum. Review and update inventory annually, at a minimum, with a priority on sensitive data.",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update inventory annually, at a minimum, with a priority on sensitive data"
    ],
    coreRequirements: [ // Green - The "what"
      "data inventory based on the enterprise's data management process",
      "inventory sensitive data, at a minimum"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Data Inventory",
      "Based on Data Management process",
      "Sensitive Data at a Minimum",
      "Review and update inventory",
      "Annually, at a minimum",
      "Priority on sensitive data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "3.1", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14"],
    systemPromptFull: {

      role: "data_inventory_specialist",

      context: "You are evaluating data inventory solutions against CIS Control 3.2 requirements for comprehensive data asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_inventory_specialist",

      context: "You are evaluating data inventory solutions against CIS Control 3.2 requirements for comprehensive data asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_inventory_specialist",

      context: "You are evaluating data inventory solutions against CIS Control 3.2 requirements for comprehensive data asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_inventory_specialist",

      context: "You are evaluating data inventory solutions against CIS Control 3.2 requirements for comprehensive data asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_inventory_specialist",

      context: "You are evaluating data inventory solutions against CIS Control 3.2 requirements for comprehensive data asset tracking.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.3": {
    id: "3.3",
    title: "Configure Data Access Control Lists",
    description: "Configure data access control lists based on a user's need to know. Apply data access control lists, also known as access permissions, to local and remote file systems, databases, and applications.",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Configure",
      "Apply data access control lists, also known as access permissions, to local and remote file systems, databases, and applications"
    ],
    coreRequirements: [ // Green - The "what"
      "data access control lists based on a user's need to know"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Data Access control lists",
      "Based on \"Need to Know\"",
      "ACLS - \"aka\" Access Permissions",
      "Local",
      "Remote File Systems",
      "Applications",
      "Databases"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.2", "3.4", "3.5", "3.6", "5.1", "6.1", "6.2"],
    systemPromptFull: {

      role: "access_control_specialist",

      context: "You are evaluating data access control solutions against CIS Control 3.3 requirements for need-to-know access management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "access_control_specialist",

      context: "You are evaluating data access control solutions against CIS Control 3.3 requirements for need-to-know access management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "access_control_specialist",

      context: "You are evaluating data access control solutions against CIS Control 3.3 requirements for need-to-know access management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "access_control_specialist",

      context: "You are evaluating data access control solutions against CIS Control 3.3 requirements for need-to-know access management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "access_control_specialist",

      context: "You are evaluating data access control solutions against CIS Control 3.3 requirements for need-to-know access management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.4": {
    id: "3.4",
    title: "Enforce Data Retention",
    description: "Retain data according to the enterprise's documented data management process. Data retention must include both minimum and maximum timelines.",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Retain",
      "Enforce",
      "must include both minimum and maximum timelines"
    ],
    coreRequirements: [ // Green - The "what"
      "data according to the enterprise's documented data management process",
      "Data retention"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Data Retention",
      "Must Include",
      "Minimum Timelines",
      "Maximum timelines"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.2", "3.5", "3.6", "3.10"],
    systemPromptFull: {

      role: "data_retention_specialist",

      context: "You are evaluating data retention solutions against CIS Control 3.4 requirements for enterprise data lifecycle management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_retention_specialist",

      context: "You are evaluating data retention solutions against CIS Control 3.4 requirements for enterprise data lifecycle management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_retention_specialist",

      context: "You are evaluating data retention solutions against CIS Control 3.4 requirements for enterprise data lifecycle management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_retention_specialist",

      context: "You are evaluating data retention solutions against CIS Control 3.4 requirements for enterprise data lifecycle management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_retention_specialist",

      context: "You are evaluating data retention solutions against CIS Control 3.4 requirements for enterprise data lifecycle management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.5": {
    id: "3.5",
    title: "Securely Dispose of Data",
    description: "Securely dispose of data as outlined in the enterprise's data management process. Ensure the disposal process and method are commensurate with the data sensitivity.",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Securely dispose of data",
      "Ensure"
    ],
    coreRequirements: [ // Green - The "what"
      "as outlined in the enterprise's data management process",
      "the disposal process and method are commensurate with the data sensitivity"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Securely dispose of data",
      "Disposal process and method are commensurate with the data sensitivity"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.2", "3.4", "3.6", "3.10"],
    systemPromptFull: {

      role: "data_disposal_expert",

      context: "You are evaluating secure data disposal solutions against CIS Control 3.5 requirements for enterprise data destruction.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_disposal_expert",

      context: "You are evaluating secure data disposal solutions against CIS Control 3.5 requirements for enterprise data destruction.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_disposal_expert",

      context: "You are evaluating secure data disposal solutions against CIS Control 3.5 requirements for enterprise data destruction.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_disposal_expert",

      context: "You are evaluating secure data disposal solutions against CIS Control 3.5 requirements for enterprise data destruction.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_disposal_expert",

      context: "You are evaluating secure data disposal solutions against CIS Control 3.5 requirements for enterprise data destruction.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.6": {
    id: "3.6",
    title: "Encrypt Data on End-User Devices",
    description: "Encrypt data on end-user devices containing sensitive data. Example implementations can include: Windows BitLocker®, Apple FileVault®, Linux® dm-crypt.",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Encrypt"
    ],
    coreRequirements: [ // Green - The "what"
      "data on end-user devices containing sensitive data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Data on end-user devices",
      "Sensitive data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Windows Bitlocker",
      "Apple FileVault",
      "Linux dm-crypt"
    ],
    relatedSafeguards: ["1.1", "3.1", "3.2", "3.7", "3.8", "3.9", "3.11"],
    systemPromptFull: {

      role: "endpoint_encryption_specialist",

      context: "You are evaluating endpoint encryption solutions against CIS Control 3.6 requirements for end-user device data protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "endpoint_encryption_specialist",

      context: "You are evaluating endpoint encryption solutions against CIS Control 3.6 requirements for end-user device data protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "endpoint_encryption_specialist",

      context: "You are evaluating endpoint encryption solutions against CIS Control 3.6 requirements for end-user device data protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "endpoint_encryption_specialist",

      context: "You are evaluating endpoint encryption solutions against CIS Control 3.6 requirements for end-user device data protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "endpoint_encryption_specialist",

      context: "You are evaluating endpoint encryption solutions against CIS Control 3.6 requirements for end-user device data protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.7": {
    id: "3.7",
    title: "Establish and Maintain a Data Classification Scheme",
    description: "Establish and maintain an overall data classification scheme for the enterprise. Enterprises may use labels, such as \"Sensitive,\" \"Confidential,\" and \"Public,\" and classify their data according to those labels. Review and update the classification scheme annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update the classification scheme annually, or when significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "overall data classification scheme for the enterprise",
      "classify their data according to those labels"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Data classification scheme",
      "Classify their data according to labels",
      "Review and update classification scheme",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Sensitive",
      "Confidential", 
      "Public"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.3", "3.8", "3.9", "3.10", "3.11", "3.12"],
    systemPromptFull: {

      role: "data_classification_expert",

      context: "You are evaluating data classification solutions against CIS Control 3.7 requirements for enterprise data sensitivity management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_classification_expert",

      context: "You are evaluating data classification solutions against CIS Control 3.7 requirements for enterprise data sensitivity management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_classification_expert",

      context: "You are evaluating data classification solutions against CIS Control 3.7 requirements for enterprise data sensitivity management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_classification_expert",

      context: "You are evaluating data classification solutions against CIS Control 3.7 requirements for enterprise data sensitivity management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_classification_expert",

      context: "You are evaluating data classification solutions against CIS Control 3.7 requirements for enterprise data sensitivity management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.8": {
    id: "3.8",
    title: "Document Data Flows",
    description: "Document data flows. Data flow documentation includes service provider data flows and should be based on the enterprise's data management process. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Document data flows",
      "Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Data flow documentation includes service provider data flows and should be based on the enterprise's data management process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Document data flows",
      "Enterprise Data Flows",
      "Service Provider Data Flows",
      "Review and update documentation",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Data management systems",
      "Data flow mapping tools",
      "Service provider documentation"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.7", "3.9", "3.10", "3.11"],
    systemPromptFull: {

      role: "data_flow_analyst",

      context: "You are evaluating data flow documentation solutions against CIS Control 3.8 requirements for enterprise data movement tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_flow_analyst",

      context: "You are evaluating data flow documentation solutions against CIS Control 3.8 requirements for enterprise data movement tracking.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_flow_analyst",

      context: "You are evaluating data flow documentation solutions against CIS Control 3.8 requirements for enterprise data movement tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_flow_analyst",

      context: "You are evaluating data flow documentation solutions against CIS Control 3.8 requirements for enterprise data movement tracking.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_flow_analyst",

      context: "You are evaluating data flow documentation solutions against CIS Control 3.8 requirements for enterprise data movement tracking.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.9": {
    id: "3.9",
    title: "Encrypt Data on Removable Media",
    description: "Encrypt Data on Removable Media",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Encrypt Data on Removable Media"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Data on Removable Media",
      "Maintain"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.6", "3.7", "3.10", "3.11"],
    systemPromptFull: {

      role: "removable_media_security_specialist",

      context: "You are evaluating removable media encryption solutions against CIS Control 3.9 requirements for portable storage protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "removable_media_security_specialist",

      context: "You are evaluating removable media encryption solutions against CIS Control 3.9 requirements for portable storage protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "removable_media_security_specialist",

      context: "You are evaluating removable media encryption solutions against CIS Control 3.9 requirements for portable storage protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "removable_media_security_specialist",

      context: "You are evaluating removable media encryption solutions against CIS Control 3.9 requirements for portable storage protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "removable_media_security_specialist",

      context: "You are evaluating removable media encryption solutions against CIS Control 3.9 requirements for portable storage protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.10": {
    id: "3.10",
    title: "Encrypt Sensitive Data in Transit",
    description: "Encrypt sensitive data in transit. Example implementations can include: Transport Layer Security (TLS) and Open Secure Shell (OpenSSH).",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Encrypt"
    ],
    coreRequirements: [ // Green - The "what"
      "sensitive data in transit"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Sensitive data in transit"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "TLS",
      "OpenSSH"
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "3.11", "13.1", "13.2"],
    systemPromptFull: {

      role: "data_in_transit_encryption_expert",

      context: "You are evaluating data-in-transit encryption solutions against CIS Control 3.10 requirements for transmission protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_in_transit_encryption_expert",

      context: "You are evaluating data-in-transit encryption solutions against CIS Control 3.10 requirements for transmission protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_in_transit_encryption_expert",

      context: "You are evaluating data-in-transit encryption solutions against CIS Control 3.10 requirements for transmission protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_in_transit_encryption_expert",

      context: "You are evaluating data-in-transit encryption solutions against CIS Control 3.10 requirements for transmission protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_in_transit_encryption_expert",

      context: "You are evaluating data-in-transit encryption solutions against CIS Control 3.10 requirements for transmission protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.11": {
    id: "3.11",
    title: "Encrypt Sensitive Data at Rest",
    description: "Encrypt sensitive data at rest on servers, applications, and databases. Storage-layer encryption, also known as server-side encryption, meets the minimum requirement of this Safeguard. Additional encryption methods may include application-layer encryption, also known as client-side encryption, where access to the data storage device(s) does not permit access to the plain-text data.",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Encrypt",
      "meets the minimum requirement of this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "sensitive data at rest on servers, applications, and databases",
      "Storage-layer encryption, also known as server-side encryption"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Encrypt Sensitive Data At Rest",
      "Servers",
      "Applications", 
      "Databases",
      "Storage Layer (server side) encryption",
      "Minimum Requirement"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Application layer (client-side) encryption",
      "Where access to the data storage device(s) does not permit access to the plain-text data"
    ],
    relatedSafeguards: ["3.1", "3.6", "3.7", "3.9", "3.10", "11.1"],
    systemPromptFull: {

      role: "data_at_rest_encryption_specialist",

      context: "You are evaluating data-at-rest encryption solutions against CIS Control 3.11 requirements for stored data protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_at_rest_encryption_specialist",

      context: "You are evaluating data-at-rest encryption solutions against CIS Control 3.11 requirements for stored data protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_at_rest_encryption_specialist",

      context: "You are evaluating data-at-rest encryption solutions against CIS Control 3.11 requirements for stored data protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_at_rest_encryption_specialist",

      context: "You are evaluating data-at-rest encryption solutions against CIS Control 3.11 requirements for stored data protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_at_rest_encryption_specialist",

      context: "You are evaluating data-at-rest encryption solutions against CIS Control 3.11 requirements for stored data protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.12": {
    id: "3.12",
    title: "Segment Data Processing and Storage Based on Sensitivity",
    description: "Segment data processing and storage based on the sensitivity of the data. Do not process sensitive data on enterprise assets intended for lower sensitivity data.",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Segment data processing and storage based on the sensitivity of the data",
      "Do not process sensitive data on enterprise assets intended for lower sensitivity data"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Based on the sensitivity of data",
      "Segment data processing (compute)",
      "Segment Storage",
      "Do not process sensitive data on enterprise assets intended for lower sensitivity data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.7", "12.1", "12.2", "12.3"],
    systemPromptFull: {

      role: "data_segmentation_architect",

      context: "You are evaluating data segmentation solutions against CIS Control 3.12 requirements for sensitivity-based data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_segmentation_architect",

      context: "You are evaluating data segmentation solutions against CIS Control 3.12 requirements for sensitivity-based data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_segmentation_architect",

      context: "You are evaluating data segmentation solutions against CIS Control 3.12 requirements for sensitivity-based data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_segmentation_architect",

      context: "You are evaluating data segmentation solutions against CIS Control 3.12 requirements for sensitivity-based data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_segmentation_architect",

      context: "You are evaluating data segmentation solutions against CIS Control 3.12 requirements for sensitivity-based data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.13": {
    id: "3.13",
    title: "Deploy a Data Loss Prevention Solution",
    description: "Implement an automated tool, such as a host-based Data Loss Prevention (DLP) tool to identify all sensitive data stored, processed, or transmitted through enterprise assets, including those located onsite or at a remote service provider, and update the enterprise's data inventory.",
    implementationGroup: "IG3",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Implement",
      "Update Data Inventory"
    ],
    coreRequirements: [ // Green - The "what"
      "automated tool to identify all sensitive data stored, processed, or transmitted through enterprise assets, including those located onsite or at a remote service provider"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Automated DLP Tool",
      "Identify all sensitive Data",
      "Stored",
      "Processed",
      "Transmitted",
      "Onsite Data",
      "Remote Service Provider",
      "Update Data Inventory"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Host-based Data loss Prevention (DLP) tool"
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "3.10", "3.11"],
    systemPromptFull: {

      role: "data_loss_prevention_specialist",

      context: "You are evaluating Data Loss Prevention solutions against CIS Control 3.13 requirements for automated sensitive data identification and protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_loss_prevention_specialist",

      context: "You are evaluating Data Loss Prevention solutions against CIS Control 3.13 requirements for automated sensitive data identification and protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_loss_prevention_specialist",

      context: "You are evaluating Data Loss Prevention solutions against CIS Control 3.13 requirements for automated sensitive data identification and protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_loss_prevention_specialist",

      context: "You are evaluating Data Loss Prevention solutions against CIS Control 3.13 requirements for automated sensitive data identification and protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_loss_prevention_specialist",

      context: "You are evaluating Data Loss Prevention solutions against CIS Control 3.13 requirements for automated sensitive data identification and protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "3.14": {
    id: "3.14",
    title: "Log Sensitive Data Access",
    description: "Log sensitive data access, including modification and disposal.",
    implementationGroup: "IG3",
    assetType: ["data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Log"
    ],
    coreRequirements: [ // Green - The "what"
      "sensitive data access, including modification and disposal"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Sensitive Data access",
      "Access",
      "Modification",
      "Disposal"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "8.1", "8.2"],
    systemPromptFull: {

      role: "data_access_auditing_expert",

      context: "You are evaluating data access logging solutions against CIS Control 3.14 requirements for sensitive data activity monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_access_auditing_expert",

      context: "You are evaluating data access logging solutions against CIS Control 3.14 requirements for sensitive data activity monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_access_auditing_expert",

      context: "You are evaluating data access logging solutions against CIS Control 3.14 requirements for sensitive data activity monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_access_auditing_expert",

      context: "You are evaluating data access logging solutions against CIS Control 3.14 requirements for sensitive data activity monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_access_auditing_expert",

      context: "You are evaluating data access logging solutions against CIS Control 3.14 requirements for sensitive data activity monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.1": {
    id: "4.1",
    title: "Establish and Maintain a Secure Configuration Process",
    description: "Establish and maintain a documented secure configuration process for enterprise assets (end-user devices, including portable and mobile; non-computing/IoT devices; and servers) and software (operating systems and applications). Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["end-user devices", "network devices", "IoT devices", "servers", "applications"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Documented Secure Configuration Process",
      "Review and update documentation",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented secure configuration process for enterprise assets",
      "documented secure configuration process for software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise assets",
      "Software",
      "End-user devices",
      "Mobile",
      "Portable",
      "Non-computing/IoT devices",
      "Servers",
      "OS",
      "Applications"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Secure Configuration Policy / Process",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["1.1", "2.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "4.12"],
    systemPromptFull: {

      role: "secure_configuration_expert",

      context: "You are evaluating secure configuration management solutions against CIS Control 4.1 requirements for enterprise asset hardening.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "secure_configuration_expert",

      context: "You are evaluating secure configuration management solutions against CIS Control 4.1 requirements for enterprise asset hardening.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "secure_configuration_expert",

      context: "You are evaluating secure configuration management solutions against CIS Control 4.1 requirements for enterprise asset hardening.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "secure_configuration_expert",

      context: "You are evaluating secure configuration management solutions against CIS Control 4.1 requirements for enterprise asset hardening.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "secure_configuration_expert",

      context: "You are evaluating secure configuration management solutions against CIS Control 4.1 requirements for enterprise asset hardening.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.2": {
    id: "4.2",
    title: "Establish and Maintain a Secure Configuration Process for Network Infrastructure",
    description: "Establish and maintain a documented secure configuration process for network devices. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["network devices"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Documented Secure Network Configuration Process",
      "Review and update documentation",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented secure configuration process for network devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Network devices"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Secure Configuration Policy / Process",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["1.1", "2.1", "3.10", "4.1", "6.4", "8.1", "12.1", "12.2", "12.3", "12.4", "12.5", "13.3", "13.4", "13.6", "13.8", "13.9", "13.10"],
    systemPromptFull: {

      role: "network_configuration_specialist",

      context: "You are evaluating network infrastructure configuration solutions against CIS Control 4.2 requirements for secure network device management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_configuration_specialist",

      context: "You are evaluating network infrastructure configuration solutions against CIS Control 4.2 requirements for secure network device management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_configuration_specialist",

      context: "You are evaluating network infrastructure configuration solutions against CIS Control 4.2 requirements for secure network device management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_configuration_specialist",

      context: "You are evaluating network infrastructure configuration solutions against CIS Control 4.2 requirements for secure network device management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_configuration_specialist",

      context: "You are evaluating network infrastructure configuration solutions against CIS Control 4.2 requirements for secure network device management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.3": {
    id: "4.3",
    title: "Configure Automatic Session Locking on Enterprise Assets",
    description: "Configure automatic session locking on enterprise assets after a defined period of inactivity. For general purpose operating systems, the period Must Not Exceed 15 minutes. For mobile end-user devices, the period must not exceed 2 minutes.",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Configure",
      "Period must not exceed for 15 Minutes",
      "Period must not exceed for 2 Minutes"
    ],
    coreRequirements: [ // Green - The "what"
      "automatic session locking on enterprise assets after a defined period of inactivity",
      "general purpose operating systems",
      "mobile end-user devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Automatic Session Locking",
      "Period of inactivity",
      "General Purpose OSs",
      "Mobile end-user devices"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "session_security_specialist",

      context: "You are evaluating session management solutions against CIS Control 4.3 requirements for automatic session locking.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "session_security_specialist",

      context: "You are evaluating session management solutions against CIS Control 4.3 requirements for automatic session locking.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "session_security_specialist",

      context: "You are evaluating session management solutions against CIS Control 4.3 requirements for automatic session locking.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "session_security_specialist",

      context: "You are evaluating session management solutions against CIS Control 4.3 requirements for automatic session locking.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "session_security_specialist",

      context: "You are evaluating session management solutions against CIS Control 4.3 requirements for automatic session locking.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.4": {
    id: "4.4",
    title: "Implement and Manage a Firewall on Servers",
    description: "Implement and manage a firewall on servers, where supported. Example implementations include a virtual firewall, operating system firewall, or a third-party firewall agent.",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Implement",
      "Manage",
      "Where Supported"
    ],
    coreRequirements: [ // Green - The "what"
      "firewall on servers"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Server Firewall"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Virtual Firewall",
      "OS Firewall", 
      "Third Party Firewall",
      "Firewall",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "server_firewall_expert",

      context: "You are evaluating server firewall solutions against CIS Control 4.4 requirements for host-based server protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "server_firewall_expert",

      context: "You are evaluating server firewall solutions against CIS Control 4.4 requirements for host-based server protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "server_firewall_expert",

      context: "You are evaluating server firewall solutions against CIS Control 4.4 requirements for host-based server protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "server_firewall_expert",

      context: "You are evaluating server firewall solutions against CIS Control 4.4 requirements for host-based server protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "server_firewall_expert",

      context: "You are evaluating server firewall solutions against CIS Control 4.4 requirements for host-based server protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.5": {
    id: "4.5",
    title: "Implement and Manage a Firewall on End-User Devices",
    description: "Implement and manage a host-based firewall or port-filtering tool on end-user devices, with a default-deny rule that drops all traffic except those services and ports that are explicitly allowed.",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Implement",
      "Manage",
      "Default deny rule that drops all traffic",
      "Except Explicitly Allowed"
    ],
    coreRequirements: [ // Green - The "what"
      "host-based firewall or port-filtering tool on end-user devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Host-based Firewall",
      "Port Filtering Tool",
      "End User Devices",
      "Services",
      "Ports"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Firewall",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "endpoint_firewall_specialist",

      context: "You are evaluating endpoint firewall solutions against CIS Control 4.5 requirements for end-user device protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "endpoint_firewall_specialist",

      context: "You are evaluating endpoint firewall solutions against CIS Control 4.5 requirements for end-user device protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "endpoint_firewall_specialist",

      context: "You are evaluating endpoint firewall solutions against CIS Control 4.5 requirements for end-user device protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "endpoint_firewall_specialist",

      context: "You are evaluating endpoint firewall solutions against CIS Control 4.5 requirements for end-user device protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "endpoint_firewall_specialist",

      context: "You are evaluating endpoint firewall solutions against CIS Control 4.5 requirements for end-user device protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.6": {
    id: "4.6",
    title: "Securely Manage Enterprise Assets and Software",
    description: "Securely manage enterprise assets and software. Example implementations include managing configuration through version-controlled- Infrastructure-as-Code (IaC) and accessing administrative interfaces over secure network protocols, such as Secure Shell (SSH) and Hypertext Transfer Protocol Secure (HTTPS). Do not use insecure management protocols, such as Telnet (Teletype Network) and HTTP, unless operationally essential.",
    implementationGroup: "IG1",
    assetType: ["devices", "applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Do not use insecure management protocols",
      "Unless operationally essential"
    ],
    coreRequirements: [ // Green - The "what"
      "Securely manage enterprise assets and software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Securely manage enterprise assets and software"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Manage configuration through version-controlled Infrastructure-as-Code (IaC)",
      "Accessing administrative interfaces over secure network protocols",
      "SSH",
      "HTTPS",
      "Telnet (Teletype Network)",
      "HTTP",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1", "12.3"],
    systemPromptFull: {

      role: "secure_administration_expert",

      context: "You are evaluating secure administrative interface solutions against CIS Control 4.6 requirements for enterprise asset management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "secure_administration_expert",

      context: "You are evaluating secure administrative interface solutions against CIS Control 4.6 requirements for enterprise asset management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "secure_administration_expert",

      context: "You are evaluating secure administrative interface solutions against CIS Control 4.6 requirements for enterprise asset management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "secure_administration_expert",

      context: "You are evaluating secure administrative interface solutions against CIS Control 4.6 requirements for enterprise asset management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "secure_administration_expert",

      context: "You are evaluating secure administrative interface solutions against CIS Control 4.6 requirements for enterprise asset management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.7": {
    id: "4.7",
    title: "Manage Default Accounts on Enterprise Assets and Software",
    description: "Manage default accounts on enterprise assets and software, such as root, administrator, and other pre-configured vendor accounts. Example implementations can include: disabling default accounts or making them unusable.",
    implementationGroup: "IG1",
    assetType: ["devices", "applications", "users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Manage"
    ],
    coreRequirements: [ // Green - The "what"
      "default accounts on enterprise assets and software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Default accounts",
      "Enterprise assets",
      "Software",
      "Root",
      "Administrator",
      "Other pre-configured vendor accounts"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Disabling",
      "Unusable",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "default_account_security_specialist",

      context: "You are evaluating default account management solutions against CIS Control 4.7 requirements for vendor account security.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "default_account_security_specialist",

      context: "You are evaluating default account management solutions against CIS Control 4.7 requirements for vendor account security.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "default_account_security_specialist",

      context: "You are evaluating default account management solutions against CIS Control 4.7 requirements for vendor account security.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "default_account_security_specialist",

      context: "You are evaluating default account management solutions against CIS Control 4.7 requirements for vendor account security.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "default_account_security_specialist",

      context: "You are evaluating default account management solutions against CIS Control 4.7 requirements for vendor account security.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.8": {
    id: "4.8",
    title: "Uninstall or Disable Unnecessary Services on Enterprise Assets and Software",
    description: "Uninstall or disable unnecessary services on enterprise assets and software, such as an unused file sharing service, web application module, or service function.",
    implementationGroup: "IG2",
    assetType: ["devices", "applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Uninstall",
      "Disable"
    ],
    coreRequirements: [ // Green - The "what"
      "unnecessary services on enterprise assets and software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Unnecessary Services",
      "Enterprise assets",
      "Software",
      "Unused file sharing service",
      "Web application module",
      "Service function"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "service_hardening_expert",

      context: "You are evaluating service management solutions against CIS Control 4.8 requirements for unnecessary service removal.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_hardening_expert",

      context: "You are evaluating service management solutions against CIS Control 4.8 requirements for unnecessary service removal.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_hardening_expert",

      context: "You are evaluating service management solutions against CIS Control 4.8 requirements for unnecessary service removal.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_hardening_expert",

      context: "You are evaluating service management solutions against CIS Control 4.8 requirements for unnecessary service removal.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_hardening_expert",

      context: "You are evaluating service management solutions against CIS Control 4.8 requirements for unnecessary service removal.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.9": {
    id: "4.9",
    title: "Configure Trusted DNS Servers on Enterprise Assets",
    description: "Configure trusted DNS servers on enterprise assets. Example implementations include: configuring assets to use enterprise-controlled DNS servers and/or reputable externally accessible DNS servers.",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Configure"
    ],
    coreRequirements: [ // Green - The "what"
      "trusted DNS servers on enterprise assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Trusted DNS Servers",
      "Enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Configuring assets to use enterprise-controlled DNS servers",
      "Reputable externally accessible DNS servers",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1", "8.6", "9.2"],
    systemPromptFull: {

      role: "dns_security_specialist",

      context: "You are evaluating DNS security solutions against CIS Control 4.9 requirements for trusted DNS server configuration.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "dns_security_specialist",

      context: "You are evaluating DNS security solutions against CIS Control 4.9 requirements for trusted DNS server configuration.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "dns_security_specialist",

      context: "You are evaluating DNS security solutions against CIS Control 4.9 requirements for trusted DNS server configuration.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "dns_security_specialist",

      context: "You are evaluating DNS security solutions against CIS Control 4.9 requirements for trusted DNS server configuration.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "dns_security_specialist",

      context: "You are evaluating DNS security solutions against CIS Control 4.9 requirements for trusted DNS server configuration.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.10": {
    id: "4.10",
    title: "Enforce Automatic Device Lockout on Portable End-User Devices",
    description: "Enforce automatic device lockout following a predetermined threshold of local failed authentication attempts on portable end-user devices, where supported. For laptops, do not allow more than 20 failed authentication attempts; for tablets and smartphones, no more than 10 failed authentication attempts. Example implementations include Microsoft® InTune Device Lock and Apple® Configuration Profile maxFailedAttempts.",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Enforce",
      "Where supported",
      "Do not allow more than 20 Failed Authentication Attempts",
      "No more than 10 Failed Authentication Attempts"
    ],
    coreRequirements: [ // Green - The "what"
      "automatic device lockout following a predetermined threshold of local failed authentication attempts on portable end-user devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Automatic Device Lockout",
      "Predetermined threshold of local failed authentication attempts",
      "Portable end-user devices",
      "Laptops",
      "Tablets and smartphones"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Microsoft® InTune Device Lock",
      "Apple® Configuration Profile maxFailedAttempts",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "device_lockout_security_expert",

      context: "You are evaluating device lockout solutions against CIS Control 4.10 requirements for failed authentication protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "device_lockout_security_expert",

      context: "You are evaluating device lockout solutions against CIS Control 4.10 requirements for failed authentication protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "device_lockout_security_expert",

      context: "You are evaluating device lockout solutions against CIS Control 4.10 requirements for failed authentication protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "device_lockout_security_expert",

      context: "You are evaluating device lockout solutions against CIS Control 4.10 requirements for failed authentication protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "device_lockout_security_expert",

      context: "You are evaluating device lockout solutions against CIS Control 4.10 requirements for failed authentication protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.11": {
    id: "4.11",
    title: "Enforce Remote Wipe Capability on Portable End-User Devices",
    description: "Remotely wipe enterprise data from enterprise-owned portable end-user devices when deemed appropriate such as lost or stolen devices, or when an individual no longer supports the enterprise.",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "When deemed appropriate"
    ],
    coreRequirements: [ // Green - The "what"
      "Remotely wipe enterprise data from enterprise-owned portable end-user devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Remotely Wipe enterprise data",
      "Portable end-user devices",
      "Lost devices",
      "Stolen devices",
      "When an individual no longer supports the enterprise"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "remote_wipe_specialist",

      context: "You are evaluating remote wipe solutions against CIS Control 4.11 requirements for enterprise data protection on portable devices.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "remote_wipe_specialist",

      context: "You are evaluating remote wipe solutions against CIS Control 4.11 requirements for enterprise data protection on portable devices.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "remote_wipe_specialist",

      context: "You are evaluating remote wipe solutions against CIS Control 4.11 requirements for enterprise data protection on portable devices.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "remote_wipe_specialist",

      context: "You are evaluating remote wipe solutions against CIS Control 4.11 requirements for enterprise data protection on portable devices.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "remote_wipe_specialist",

      context: "You are evaluating remote wipe solutions against CIS Control 4.11 requirements for enterprise data protection on portable devices.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "4.12": {
    id: "4.12",
    title: "Separate Enterprise Workspaces on Mobile End-User Devices",
    description: "Ensure separate enterprise workspaces are used on mobile end-user devices, where supported. Example implementations include using an Apple® Configuration Profile or AndroidTM Work Profile to separate enterprise applications and data from personal applications and data.",
    implementationGroup: "IG3",
    assetType: ["devices", "data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "Where Supported"
    ],
    coreRequirements: [ // Green - The "what"
      "separate enterprise workspaces are used on mobile end-user devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Separate enterprise workspaces",
      "On Mobile Devices",
      "Enterprise Applications",
      "Enterprise Data",
      "Personal Applications",
      "Personal Data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Apple® Configuration Profile",
      "AndroidTM Work Profile",
      "Configuration Management Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "mobile_workspace_security_expert",

      context: "You are evaluating mobile workspace separation solutions against CIS Control 4.12 requirements for enterprise and personal data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "mobile_workspace_security_expert",

      context: "You are evaluating mobile workspace separation solutions against CIS Control 4.12 requirements for enterprise and personal data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "mobile_workspace_security_expert",

      context: "You are evaluating mobile workspace separation solutions against CIS Control 4.12 requirements for enterprise and personal data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "mobile_workspace_security_expert",

      context: "You are evaluating mobile workspace separation solutions against CIS Control 4.12 requirements for enterprise and personal data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "mobile_workspace_security_expert",

      context: "You are evaluating mobile workspace separation solutions against CIS Control 4.12 requirements for enterprise and personal data isolation.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "5.1": {
    id: "5.1",
    title: "Establish and Maintain an Inventory of Accounts",
    description: "Establish and maintain an inventory of all accounts managed in the enterprise. The inventory must include both user and administrator accounts. The inventory, at a minimum, should contain the person's name, username, start/stop dates, and department. Validate that all active accounts are authorized, on a recurring schedule at a minimum quarterly, or more frequently.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish and maintain an inventory of all accounts managed in the enterprise",
      "The inventory must include both user and administrator accounts",
      "At a minimum, should contain the person's name, username, start/stop dates, and department",
      "Validate that all active accounts are authorized, on a recurring schedule at a minimum quarterly, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Inventory of Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Establish",
      "Maintain",
      "Validate that all active accounts are authorized",
      "Recurring schedule",
      "Must Include",
      "At a minimum",
      "Minimum Quarterly",
      "More Frequently",
      "User Accounts",
      "Administrator Accounts",
      "Name",
      "Username",
      "Start Stop Dates",
      "Department"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Identity and Access Management Tool"
    ],
    relatedSafeguards: ["1.1", "2.1", "5.2", "5.3", "5.4", "5.5", "5.6", "6.1", "6.2", "6.7", "12.8"],
    systemPromptFull: {

      role: "account_inventory_specialist",

      context: "You are evaluating account management solutions against CIS Control 5.1 requirements for comprehensive account inventory and validation.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "account_inventory_specialist",

      context: "You are evaluating account management solutions against CIS Control 5.1 requirements for comprehensive account inventory and validation.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "account_inventory_specialist",

      context: "You are evaluating account management solutions against CIS Control 5.1 requirements for comprehensive account inventory and validation.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "account_inventory_specialist",

      context: "You are evaluating account management solutions against CIS Control 5.1 requirements for comprehensive account inventory and validation.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "account_inventory_specialist",

      context: "You are evaluating account management solutions against CIS Control 5.1 requirements for comprehensive account inventory and validation.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "5.2": {
    id: "5.2",
    title: "Use Unique Passwords",
    description: "Use unique passwords for all enterprise assets. Best practice implementation includes, at a minimum, an 8-character password for accounts using Multi-Factor Authentication (MFA) and a 14-character password for accounts not using MFA.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use unique passwords for all enterprise assets",
      "Best practice implementation includes, at a minimum, an 8-character password for accounts using Multi-Factor Authentication (MFA) and a 14-character password for accounts not using MFA"
    ],
    coreRequirements: [ // Green - The "what"
      "Unique Passwords"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Use",
      "At a minimum",
      "All Enterprise Assets",
      "8-character password for accounts using MFA",
      "14-character password for accounts not using MFA"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Password Management Tool"
    ],
    relatedSafeguards: ["5.1"],
    systemPromptFull: {

      role: "password_security_expert",

      context: "You are evaluating password management solutions against CIS Control 5.2 requirements for unique password enforcement.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "password_security_expert",

      context: "You are evaluating password management solutions against CIS Control 5.2 requirements for unique password enforcement.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "password_security_expert",

      context: "You are evaluating password management solutions against CIS Control 5.2 requirements for unique password enforcement.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "password_security_expert",

      context: "You are evaluating password management solutions against CIS Control 5.2 requirements for unique password enforcement.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "password_security_expert",

      context: "You are evaluating password management solutions against CIS Control 5.2 requirements for unique password enforcement.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "5.3": {
    id: "5.3",
    title: "Disable Dormant Accounts",
    description: "Delete or disable any dormant accounts after a period of 45 days of inactivity, where supported.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Delete or disable any dormant accounts after a period of 45 days of inactivity, where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "Dormant Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Disable",
      "Delete",
      "Period of 45 days of inactivity",
      "Where Supported"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Identity and Access Management Tool"
    ],
    relatedSafeguards: ["5.1"],
    systemPromptFull: {

      role: "dormant_account_management_specialist",

      context: "You are evaluating dormant account management solutions against CIS Control 5.3 requirements for inactive account cleanup.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "dormant_account_management_specialist",

      context: "You are evaluating dormant account management solutions against CIS Control 5.3 requirements for inactive account cleanup.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "dormant_account_management_specialist",

      context: "You are evaluating dormant account management solutions against CIS Control 5.3 requirements for inactive account cleanup.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "dormant_account_management_specialist",

      context: "You are evaluating dormant account management solutions against CIS Control 5.3 requirements for inactive account cleanup.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "dormant_account_management_specialist",

      context: "You are evaluating dormant account management solutions against CIS Control 5.3 requirements for inactive account cleanup.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "5.4": {
    id: "5.4",
    title: "Restrict Administrator Privileges to Dedicated Administrator Accounts",
    description: "Restrict administrator privileges to dedicated administrator accounts on enterprise assets. Conduct general computing activities, such as internet browsing, email, and productivity suite use, from the user's primary, non-privileged account.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Restrict administrator privileges to dedicated administrator accounts on enterprise assets",
      "Conduct general computing activities, such as internet browsing, email, and productivity suite use, from the user's primary, non-privileged account"
    ],
    coreRequirements: [ // Green - The "what"
      "Administrator Privileges",
      "Dedicated Admin Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Restrict",
      "Enterprise assets",
      "User's primary, non-privileged account",
      "General Computing Activities"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Identity and Access Management Tool",
      "Such as",
      "Internet browsing",
      "Email",
      "Productivity suite use"
    ],
    relatedSafeguards: ["4.1", "5.1"],
    systemPromptFull: {

      role: "privileged_access_specialist",

      context: "You are evaluating privileged access management solutions against CIS Control 5.4 requirements for administrator privilege restriction.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "privileged_access_specialist",

      context: "You are evaluating privileged access management solutions against CIS Control 5.4 requirements for administrator privilege restriction.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "privileged_access_specialist",

      context: "You are evaluating privileged access management solutions against CIS Control 5.4 requirements for administrator privilege restriction.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "privileged_access_specialist",

      context: "You are evaluating privileged access management solutions against CIS Control 5.4 requirements for administrator privilege restriction.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "privileged_access_specialist",

      context: "You are evaluating privileged access management solutions against CIS Control 5.4 requirements for administrator privilege restriction.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "5.5": {
    id: "5.5",
    title: "Establish and Maintain an Inventory of Service Accounts",
    description: "Establish and maintain an inventory of service accounts. The inventory, at a minimum, must contain department owner, review date, and purpose. Perform service account reviews to validate that all active accounts are authorized, on a recurring schedule at a minimum quarterly, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish and maintain an inventory of service accounts",
      "The inventory, at a minimum, must contain department owner, review date, and purpose",
      "Perform service account reviews to validate that all active accounts are authorized, on a recurring schedule at a minimum quarterly, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Inventory of Service Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Establish",
      "Maintain",
      "At a Minimum Must Contain",
      "Perform service account reviews to validate that all active accounts are authorized",
      "On a recurring schedule",
      "Department Owner",
      "Review date",
      "Purpose",
      "At a minimum quarterly",
      "More frequently",
      "Or"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Identity and Access Management Tool"
    ],
    relatedSafeguards: ["5.1"],
    systemPromptFull: {

      role: "service_account_management_expert",

      context: "You are evaluating service account management solutions against CIS Control 5.5 requirements for service account inventory and oversight.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_account_management_expert",

      context: "You are evaluating service account management solutions against CIS Control 5.5 requirements for service account inventory and oversight.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_account_management_expert",

      context: "You are evaluating service account management solutions against CIS Control 5.5 requirements for service account inventory and oversight.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_account_management_expert",

      context: "You are evaluating service account management solutions against CIS Control 5.5 requirements for service account inventory and oversight.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_account_management_expert",

      context: "You are evaluating service account management solutions against CIS Control 5.5 requirements for service account inventory and oversight.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "5.6": {
    id: "5.6",
    title: "Centralize Account Management",
    description: "Centralize account management through a directory or identity service.",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Centralize account management through a directory or identity service"
    ],
    coreRequirements: [ // Green - The "what"
      "Account Management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Centralize",
      "Directory Service",
      "Identity Service",
      "Or"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Identity and Access Management Tool"
    ],
    relatedSafeguards: ["5.1", "6.6", "6.7", "12.5"],
    systemPromptFull: {

      role: "centralized_identity_specialist",

      context: "You are evaluating centralized identity management solutions against CIS Control 5.6 requirements for directory service implementation.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "centralized_identity_specialist",

      context: "You are evaluating centralized identity management solutions against CIS Control 5.6 requirements for directory service implementation.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "centralized_identity_specialist",

      context: "You are evaluating centralized identity management solutions against CIS Control 5.6 requirements for directory service implementation.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "centralized_identity_specialist",

      context: "You are evaluating centralized identity management solutions against CIS Control 5.6 requirements for directory service implementation.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "centralized_identity_specialist",

      context: "You are evaluating centralized identity management solutions against CIS Control 5.6 requirements for directory service implementation.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.1": {
    id: "6.1",
    title: "Establish an Access Granting Process",
    description: "Establish and follow a documented process, preferably automated, for granting access to enterprise assets upon new hire or role change of a user.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Follow",
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process",
      "Documentation"
    ],
    coreRequirements: [ // Green - The "what"
      "documented process",
      "granting access to enterprise assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "preferably automated",
      "upon new hire",
      "role change of a user",
      "New Hire",
      "Role Change",
      "Enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process"
    ],
    relatedSafeguards: ["5.1", "6.7", "6.8"],
    systemPromptFull: {

      role: "access_granting_process_expert",

      context: "You are evaluating access granting solutions against CIS Control 6.1 requirements for establishing documented access provisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "access_granting_process_expert",

      context: "You are evaluating access granting solutions against CIS Control 6.1 requirements for establishing documented access provisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "access_granting_process_expert",

      context: "You are evaluating access granting solutions against CIS Control 6.1 requirements for establishing documented access provisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "access_granting_process_expert",

      context: "You are evaluating access granting solutions against CIS Control 6.1 requirements for establishing documented access provisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "access_granting_process_expert",

      context: "You are evaluating access granting solutions against CIS Control 6.1 requirements for establishing documented access provisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.2": {
    id: "6.2",
    title: "Establish an Access Revoking Process",
    description: "Establish and follow a process, preferably automated, for revoking access to enterprise assets, through disabling accounts immediately upon termination, rights revocation, or role change of a user. Disabling accounts, instead of deleting accounts, may be necessary to preserve audit trails.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Follow",
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process",
      "Documentation"
    ],
    coreRequirements: [ // Green - The "what"
      "process",
      "revoking access to enterprise assets",
      "disabling accounts immediately"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "preferably automated",
      "upon termination",
      "rights revocation",
      "role change of a user",
      "Role Change",
      "Termination",
      "Rights revocation",
      "Enterprise assets",
      "Disabling accounts immediately"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Disabling accounts, instead of deleting accounts, may be necessary to preserve audit trails",
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process"
    ],
    relatedSafeguards: ["5.1", "6.7"],
    systemPromptFull: {

      role: "access_revocation_process_expert",

      context: "You are evaluating access revocation solutions against CIS Control 6.2 requirements for establishing documented access deprovisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "access_revocation_process_expert",

      context: "You are evaluating access revocation solutions against CIS Control 6.2 requirements for establishing documented access deprovisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "access_revocation_process_expert",

      context: "You are evaluating access revocation solutions against CIS Control 6.2 requirements for establishing documented access deprovisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "access_revocation_process_expert",

      context: "You are evaluating access revocation solutions against CIS Control 6.2 requirements for establishing documented access deprovisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "access_revocation_process_expert",

      context: "You are evaluating access revocation solutions against CIS Control 6.2 requirements for establishing documented access deprovisioning processes.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.3": {
    id: "6.3", 
    title: "Require MFA for Externally-Exposed Applications",
    description: "Require all externally-exposed enterprise or third-party applications to enforce MFA, where supported. Enforcing MFA through a directory service or SSO provider is a satisfactory implementation of this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Require",
      "Account and Access Control Management",
      "Multi-Factor Authentication Tool"
    ],
    coreRequirements: [ // Green - The "what"
      "all externally-exposed enterprise or third-party applications to enforce MFA",
      "where supported"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "ALL Externally Exposed Applications",
      "Enforce",
      "Where supported"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Enforcing MFA through a directory service or SSO provider is a satisfactory implementation of this Safeguard",
      "Directory service",
      "SSO Provider",
      "Account and Access Control Management",
      "Multi-Factor Authentication Tool"
    ],
    relatedSafeguards: ["2.1", "4.1"],
    systemPromptFull: {

      role: "multi_factor_authentication_expert",

      context: "You are evaluating multi-factor authentication solutions against CIS Control 6.3 requirements for externally-exposed application protection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "multi_factor_authentication_expert",

      context: "You are evaluating multi-factor authentication solutions against CIS Control 6.3 requirements for externally-exposed application protection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "multi_factor_authentication_expert",

      context: "You are evaluating multi-factor authentication solutions against CIS Control 6.3 requirements for externally-exposed application protection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "multi_factor_authentication_expert",

      context: "You are evaluating multi-factor authentication solutions against CIS Control 6.3 requirements for externally-exposed application protection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "multi_factor_authentication_expert",

      context: "You are evaluating multi-factor authentication solutions against CIS Control 6.3 requirements for externally-exposed application protection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.4": {
    id: "6.4",
    title: "Require MFA for Remote Network Access",
    description: "Require MFA for remote network access.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Require",
      "Account and Access Control Management",
      "Multi-Factor Authentication Tool"
    ],
    coreRequirements: [ // Green - The "what"
      "MFA",
      "remote network access"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Remote Network Access"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Multi-Factor Authentication Tool"
    ],
    relatedSafeguards: ["4.2", "12.7"],
    systemPromptFull: {

      role: "remote_access_security_specialist",

      context: "You are evaluating remote access security solutions against CIS Control 6.4 requirements for MFA on remote network access.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "remote_access_security_specialist",

      context: "You are evaluating remote access security solutions against CIS Control 6.4 requirements for MFA on remote network access.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "remote_access_security_specialist",

      context: "You are evaluating remote access security solutions against CIS Control 6.4 requirements for MFA on remote network access.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "remote_access_security_specialist",

      context: "You are evaluating remote access security solutions against CIS Control 6.4 requirements for MFA on remote network access.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "remote_access_security_specialist",

      context: "You are evaluating remote access security solutions against CIS Control 6.4 requirements for MFA on remote network access.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.5": {
    id: "6.5",
    title: "Require MFA for Administrative Access",
    description: "Require MFA for all administrative access accounts, where supported, on all enterprise assets, whether managed on-site or through a service provider.",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Require",
      "Account and Access Control Management",
      "Multi-Factor Authentication Tool"
    ],
    coreRequirements: [ // Green - The "what"
      "MFA",
      "all administrative access accounts",
      "all enterprise assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "where supported",
      "All Admin Access Accounts",
      "All enterprise assets",
      "Onsite Management",
      "Service Provider",
      "Or"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Multi-Factor Authentication Tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "administrative_access_security_expert",

      context: "You are evaluating administrative access security solutions against CIS Control 6.5 requirements for MFA on administrative accounts.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "administrative_access_security_expert",

      context: "You are evaluating administrative access security solutions against CIS Control 6.5 requirements for MFA on administrative accounts.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "administrative_access_security_expert",

      context: "You are evaluating administrative access security solutions against CIS Control 6.5 requirements for MFA on administrative accounts.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "administrative_access_security_expert",

      context: "You are evaluating administrative access security solutions against CIS Control 6.5 requirements for MFA on administrative accounts.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "administrative_access_security_expert",

      context: "You are evaluating administrative access security solutions against CIS Control 6.5 requirements for MFA on administrative accounts.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.6": {
    id: "6.6",
    title: "Establish and Maintain an Inventory of Authentication and Authorization Systems",
    description: "Establish and maintain an inventory of the enterprise's authentication and authorization systems, including those hosted on-site or at a remote service provider. Review and update the inventory, at a minimum, annually, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["software"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "maintain",
      "Review and update",
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process"
    ],
    coreRequirements: [ // Green - The "what"
      "inventory of the enterprise's authentication and authorization systems"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "including those hosted on-site or at a remote service provider",
      "at a minimum, annually, or more frequently",
      "Hosted on-site",
      "Remote Service Provider",
      "Or",
      "At a minimum Annually",
      "More frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process"
    ],
    relatedSafeguards: ["1.1", "2.1", "3.3", "5.6", "6.7"],
    systemPromptFull: {

      role: "authentication_authorization_inventory_expert",

      context: "You are evaluating authentication and authorization inventory solutions against CIS Control 6.6 requirements for comprehensive system tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "authentication_authorization_inventory_expert",

      context: "You are evaluating authentication and authorization inventory solutions against CIS Control 6.6 requirements for comprehensive system tracking.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "authentication_authorization_inventory_expert",

      context: "You are evaluating authentication and authorization inventory solutions against CIS Control 6.6 requirements for comprehensive system tracking.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "authentication_authorization_inventory_expert",

      context: "You are evaluating authentication and authorization inventory solutions against CIS Control 6.6 requirements for comprehensive system tracking.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "authentication_authorization_inventory_expert",

      context: "You are evaluating authentication and authorization inventory solutions against CIS Control 6.6 requirements for comprehensive system tracking.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.7": {
    id: "6.7",
    title: "Centralize Access Control",
    description: "Centralize access control for all enterprise assets through a directory service or SSO provider, where supported.",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Centralize",
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process",
      "Identity and Access Management Tool"
    ],
    coreRequirements: [ // Green - The "what"
      "access control",
      "all enterprise assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "through a directory service or SSO provider",
      "where supported",
      "Directory Service",
      "SSO Provider",
      "Or",
      "All enterprise assets",
      "Where Supported"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process",
      "Identity and Access Management Tool"
    ],
    relatedSafeguards: ["4.1", "5.1", "5.6", "6.1", "6.2", "6.6", "12.5", "12.7"],
    systemPromptFull: {

      role: "centralized_access_control_expert",

      context: "You are evaluating centralized access control solutions against CIS Control 6.7 requirements for directory service and SSO-based access management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "centralized_access_control_expert",

      context: "You are evaluating centralized access control solutions against CIS Control 6.7 requirements for directory service and SSO-based access management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "centralized_access_control_expert",

      context: "You are evaluating centralized access control solutions against CIS Control 6.7 requirements for directory service and SSO-based access management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "centralized_access_control_expert",

      context: "You are evaluating centralized access control solutions against CIS Control 6.7 requirements for directory service and SSO-based access management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "centralized_access_control_expert",

      context: "You are evaluating centralized access control solutions against CIS Control 6.7 requirements for directory service and SSO-based access management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "6.8": {
    id: "6.8",
    title: "Define and Maintain Role-Based Access Control",
    description: "Define and maintain role-based access control, through determining and documenting the access rights necessary for each role within the enterprise to successfully carry out its assigned duties. Perform access control reviews of enterprise assets to validate that all privileges are authorized, on a recurring schedule at a minimum annually, or more frequently.",
    implementationGroup: "IG3",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Define",
      "maintain",
      "Perform access control reviews of enterprise assets to validate that all privileges are authorized, on a recurring schedule at a minimum annually, or more frequently",
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process",
      "Identity and Access management Tool"
    ],
    coreRequirements: [ // Green - The "what"
      "role-based access control",
      "determining and documenting the access rights necessary for each role within the enterprise to successfully carry out its assigned duties"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Access rights",
      "Each Role",
      "Necessary",
      "Successfully carry out its assigned duties",
      "Determining",
      "Documenting",
      "At a minimum Annually",
      "More frequently",
      "Or"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Account and Access Control Management",
      "Account and Credential Management Policy/Process",
      "Identity and Access management Tool"
    ],
    relatedSafeguards: ["3.3", "4.1", "6.1"],
    systemPromptFull: {

      role: "role_based_access_control_expert",

      context: "You are evaluating role-based access control solutions against CIS Control 6.8 requirements for defining, maintaining, and reviewing role-based permissions.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "role_based_access_control_expert",

      context: "You are evaluating role-based access control solutions against CIS Control 6.8 requirements for defining, maintaining, and reviewing role-based permissions.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "role_based_access_control_expert",

      context: "You are evaluating role-based access control solutions against CIS Control 6.8 requirements for defining, maintaining, and reviewing role-based permissions.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "role_based_access_control_expert",

      context: "You are evaluating role-based access control solutions against CIS Control 6.8 requirements for defining, maintaining, and reviewing role-based permissions.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "role_based_access_control_expert",

      context: "You are evaluating role-based access control solutions against CIS Control 6.8 requirements for defining, maintaining, and reviewing role-based permissions.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
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
    systemPromptFull: {

      role: "vulnerability_management_process_expert",

      context: "You are evaluating vulnerability management solutions against CIS Control 7.1 requirements for establishing documented vulnerability management processes.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "vulnerability_management_process_expert",

      context: "You are evaluating vulnerability management solutions against CIS Control 7.1 requirements for establishing documented vulnerability management processes.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "vulnerability_management_process_expert",

      context: "You are evaluating vulnerability management solutions against CIS Control 7.1 requirements for establishing documented vulnerability management processes.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "vulnerability_management_process_expert",

      context: "You are evaluating vulnerability management solutions against CIS Control 7.1 requirements for establishing documented vulnerability management processes.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "vulnerability_management_process_expert",

      context: "You are evaluating vulnerability management solutions against CIS Control 7.1 requirements for establishing documented vulnerability management processes.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "7.2": {
    id: "7.2",
    title: "Establish and Maintain a Remediation Process",
    description: "Establish and maintain a remediation process and SLA for security vulnerabilities",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "establish remediation process",
      "maintain remediation process",
      "SLA for security vulnerabilities",
      "vulnerability remediation governance"
    ],
    coreRequirements: [ // Green - The "what"
      "remediation process",
      "service level agreement",
      "security vulnerability handling",
      "remediation timeline management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "vulnerability prioritization",
      "remediation timelines",
      "escalation procedures",
      "patch management integration",
      "risk-based remediation",
      "remediation tracking",
      "verification procedures"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vulnerability management platforms",
      "patch management systems",
      "remediation workflow tools",
      "SLA tracking systems",
      "risk scoring frameworks"
    ],
    relatedSafeguards: ["7.1", "7.3", "7.4", "7.5", "7.6", "7.7"],
    systemPromptFull: {

      role: "vulnerability_remediation_process_expert",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.2 requirements for establishing remediation processes and SLAs.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "vulnerability_remediation_process_expert",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.2 requirements for establishing remediation processes and SLAs.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "vulnerability_remediation_process_expert",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.2 requirements for establishing remediation processes and SLAs.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "vulnerability_remediation_process_expert",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.2 requirements for establishing remediation processes and SLAs.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "vulnerability_remediation_process_expert",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.2 requirements for establishing remediation processes and SLAs.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "7.3": {
    id: "7.3",
    title: "Perform Automated Operating System Patch Management",
    description: "Perform automated operating system patch management on enterprise assets",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "perform automated OS patch management",
      "enterprise assets coverage",
      "automated patching requirement",
      "patch management governance"
    ],
    coreRequirements: [ // Green - The "what"
      "automated operating system patching",
      "enterprise asset coverage",
      "patch deployment automation",
      "OS security updates"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "patch deployment scheduling",
      "patch testing procedures",
      "rollback capabilities",
      "patch compliance monitoring",
      "emergency patching procedures",
      "patch approval workflows",
      "system restart management"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Windows Update Services",
      "patch management platforms",
      "configuration management tools",
      "automated patching solutions",
      "system center tools"
    ],
    relatedSafeguards: ["1.1", "4.1", "7.1", "7.2", "7.4", "7.5"],
    systemPromptFull: {

      role: "automated_os_patch_management_expert",

      context: "You are evaluating automated OS patch management solutions against CIS Control 7.3 requirements for automated operating system patching.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "automated_os_patch_management_expert",

      context: "You are evaluating automated OS patch management solutions against CIS Control 7.3 requirements for automated operating system patching.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "automated_os_patch_management_expert",

      context: "You are evaluating automated OS patch management solutions against CIS Control 7.3 requirements for automated operating system patching.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "automated_os_patch_management_expert",

      context: "You are evaluating automated OS patch management solutions against CIS Control 7.3 requirements for automated operating system patching.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "automated_os_patch_management_expert",

      context: "You are evaluating automated OS patch management solutions against CIS Control 7.3 requirements for automated operating system patching.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "7.4": {
    id: "7.4",
    title: "Perform Automated Application Patch Management",
    description: "Perform automated application patch management on enterprise assets",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "perform automated application patching",
      "enterprise assets coverage",
      "automated application updates",
      "application patch governance"
    ],
    coreRequirements: [ // Green - The "what"
      "automated application patching",
      "enterprise asset coverage",
      "application security updates",
      "patch deployment automation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "application update management",
      "third-party software updates",
      "browser plugin updates",
      "security patch prioritization",
      "application compatibility testing",
      "update rollback procedures",
      "vendor patch notifications"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "application update managers",
      "third-party patch solutions",
      "automated deployment tools",
      "software inventory integration",
      "patch compliance scanners"
    ],
    relatedSafeguards: ["2.1", "2.2", "7.1", "7.2", "7.3", "7.5"],
    systemPromptFull: {

      role: "automated_application_patch_management_expert",

      context: "You are evaluating automated application patch management solutions against CIS Control 7.4 requirements for automated application patching.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "automated_application_patch_management_expert",

      context: "You are evaluating automated application patch management solutions against CIS Control 7.4 requirements for automated application patching.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "automated_application_patch_management_expert",

      context: "You are evaluating automated application patch management solutions against CIS Control 7.4 requirements for automated application patching.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "automated_application_patch_management_expert",

      context: "You are evaluating automated application patch management solutions against CIS Control 7.4 requirements for automated application patching.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "automated_application_patch_management_expert",

      context: "You are evaluating automated application patch management solutions against CIS Control 7.4 requirements for automated application patching.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "7.5": {
    id: "7.5",
    title: "Perform Automated Vulnerability Scans of Internal Enterprise Assets",
    description: "Perform automated vulnerability scans of internal enterprise assets on a quarterly or more frequent basis",
    implementationGroup: "IG2",
    assetType: ["devices", "applications"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "perform automated vulnerability scans",
      "internal enterprise assets",
      "quarterly or more frequent basis",
      "vulnerability scanning governance"
    ],
    coreRequirements: [ // Green - The "what"
      "automated vulnerability scanning",
      "internal asset coverage",
      "quarterly scan frequency",
      "vulnerability detection"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network vulnerability scanning",
      "host-based vulnerability scanning",
      "application vulnerability scanning",
      "database vulnerability scanning",
      "scan scheduling",
      "scan result analysis",
      "false positive management"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vulnerability scanners",
      "network security scanners",
      "application security scanners",
      "automated scanning platforms",
      "vulnerability management systems"
    ],
    relatedSafeguards: ["1.1", "2.1", "7.1", "7.2", "7.3", "7.4", "7.6", "7.7"],
    systemPromptFull: {

      role: "internal_vulnerability_scanning_expert",

      context: "You are evaluating internal vulnerability scanning solutions against CIS Control 7.5 requirements for automated vulnerability scanning of internal enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "internal_vulnerability_scanning_expert",

      context: "You are evaluating internal vulnerability scanning solutions against CIS Control 7.5 requirements for automated vulnerability scanning of internal enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "internal_vulnerability_scanning_expert",

      context: "You are evaluating internal vulnerability scanning solutions against CIS Control 7.5 requirements for automated vulnerability scanning of internal enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "internal_vulnerability_scanning_expert",

      context: "You are evaluating internal vulnerability scanning solutions against CIS Control 7.5 requirements for automated vulnerability scanning of internal enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "internal_vulnerability_scanning_expert",

      context: "You are evaluating internal vulnerability scanning solutions against CIS Control 7.5 requirements for automated vulnerability scanning of internal enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "7.6": {
    id: "7.6",
    title: "Perform Automated Vulnerability Scans of Externally-Exposed Enterprise Assets",
    description: "Perform automated vulnerability scans of externally-exposed enterprise assets using either an internal or external vulnerability scanning service",
    implementationGroup: "IG2",
    assetType: ["devices", "applications"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "perform automated vulnerability scans",
      "externally-exposed enterprise assets",
      "internal or external scanning service",
      "external asset scanning governance"
    ],
    coreRequirements: [ // Green - The "what"
      "automated vulnerability scanning",
      "externally-exposed assets",
      "external vulnerability detection",
      "internet-facing asset scanning"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "external network scanning",
      "web application scanning",
      "exposed service scanning",
      "cloud asset scanning",
      "external IP monitoring",
      "internet exposure assessment",
      "attack surface analysis"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "external vulnerability scanners",
      "cloud security scanning",
      "web application scanners",
      "internet asset discovery",
      "third-party scanning services"
    ],
    relatedSafeguards: ["1.1", "2.1", "7.1", "7.2", "7.5", "7.7"],
    systemPromptFull: {

      role: "external_vulnerability_scanning_expert",

      context: "You are evaluating external vulnerability scanning solutions against CIS Control 7.6 requirements for automated vulnerability scanning of externally-exposed enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "external_vulnerability_scanning_expert",

      context: "You are evaluating external vulnerability scanning solutions against CIS Control 7.6 requirements for automated vulnerability scanning of externally-exposed enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "external_vulnerability_scanning_expert",

      context: "You are evaluating external vulnerability scanning solutions against CIS Control 7.6 requirements for automated vulnerability scanning of externally-exposed enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "external_vulnerability_scanning_expert",

      context: "You are evaluating external vulnerability scanning solutions against CIS Control 7.6 requirements for automated vulnerability scanning of externally-exposed enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "external_vulnerability_scanning_expert",

      context: "You are evaluating external vulnerability scanning solutions against CIS Control 7.6 requirements for automated vulnerability scanning of externally-exposed enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "7.7": {
    id: "7.7",
    title: "Remediate Detected Vulnerabilities",
    description: "Remediate detected vulnerabilities in software through processes and tooling on a monthly, or more frequent, basis",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "remediate detected vulnerabilities",
      "software vulnerability remediation",
      "monthly or more frequent basis",
      "vulnerability remediation governance"
    ],
    coreRequirements: [ // Green - The "what"
      "vulnerability remediation",
      "detected vulnerability handling",
      "monthly remediation cycles",
      "software security updates"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "vulnerability assessment",
      "risk-based prioritization",
      "patch deployment",
      "compensating controls",
      "remediation verification",
      "remediation tracking",
      "exception management"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vulnerability management platforms",
      "automated remediation tools",
      "patch management integration",
      "remediation workflow systems",
      "risk assessment tools"
    ],
    relatedSafeguards: ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"],
    systemPromptFull: {

      role: "vulnerability_remediation_specialist",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.7 requirements for monthly remediation of detected vulnerabilities.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "vulnerability_remediation_specialist",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.7 requirements for monthly remediation of detected vulnerabilities.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "vulnerability_remediation_specialist",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.7 requirements for monthly remediation of detected vulnerabilities.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "vulnerability_remediation_specialist",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.7 requirements for monthly remediation of detected vulnerabilities.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "vulnerability_remediation_specialist",

      context: "You are evaluating vulnerability remediation solutions against CIS Control 7.7 requirements for monthly remediation of detected vulnerabilities.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.1": {
    id: "8.1",
    title: "Establish and Maintain an Audit Log Management Process",
    description: "Establish and maintain a documented audit log management process that defines the enterprise's logging requirements. At a minimum, address the collection, review, and retention of audit logs for enterprise assets. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Govern"],
    governanceElements: [
      "establish and maintain",
      "documented audit log management process", 
      "review and update documentation annually",
      "when significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [
      "enterprise's logging requirements",
      "collection, review, and retention of audit logs",
      "enterprise assets"
    ],
    subTaxonomicalElements: [
      "collection",
      "review", 
      "retention",
      "annually",
      "minimum"
    ],
    implementationSuggestions: [
      "log management policy/process",
      "documentation"
    ],
    relatedSafeguards: ["8.2", "8.3", "8.5", "8.6", "8.7", "8.8", "8.9", "8.10", "8.11", "8.12"],
    systemPromptFull: {

      role: "audit_log_management_process_expert",

      context: "You are evaluating audit log management solutions against CIS Control 8.1 requirements for establishing documented audit log management processes.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "audit_log_management_process_expert",

      context: "You are evaluating audit log management solutions against CIS Control 8.1 requirements for establishing documented audit log management processes.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "audit_log_management_process_expert",

      context: "You are evaluating audit log management solutions against CIS Control 8.1 requirements for establishing documented audit log management processes.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "audit_log_management_process_expert",

      context: "You are evaluating audit log management solutions against CIS Control 8.1 requirements for establishing documented audit log management processes.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "audit_log_management_process_expert",

      context: "You are evaluating audit log management solutions against CIS Control 8.1 requirements for establishing documented audit log management processes.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.2": {
    id: "8.2", 
    title: "Collect Audit Logs",
    description: "Collect audit logs. Ensure that logging, per the enterprise's audit log management process, has been enabled across enterprise assets.",
    implementationGroup: "IG1",
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Detect"],
    governanceElements: [
      "per the enterprise's audit log management process"
    ],
    coreRequirements: [
      "collect audit logs",
      "logging enabled", 
      "enterprise assets"
    ],
    subTaxonomicalElements: [
      "enabled"
    ],
    implementationSuggestions: [
      "log management tool",
      "OS dependent"
    ],
    relatedSafeguards: ["8.1"],
    systemPromptFull: {

      role: "audit_log_collection_expert",

      context: "You are evaluating audit log collection solutions against CIS Control 8.2 requirements for comprehensive audit log collection across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "audit_log_collection_expert",

      context: "You are evaluating audit log collection solutions against CIS Control 8.2 requirements for comprehensive audit log collection across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "audit_log_collection_expert",

      context: "You are evaluating audit log collection solutions against CIS Control 8.2 requirements for comprehensive audit log collection across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "audit_log_collection_expert",

      context: "You are evaluating audit log collection solutions against CIS Control 8.2 requirements for comprehensive audit log collection across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "audit_log_collection_expert",

      context: "You are evaluating audit log collection solutions against CIS Control 8.2 requirements for comprehensive audit log collection across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.3": {
    id: "8.3",
    title: "Ensure Adequate Audit Log Storage", 
    description: "Ensure that logging destinations maintain adequate storage to comply with the enterprise's audit log management process.",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [
      "comply with the enterprise's audit log management process"
    ],
    coreRequirements: [
      "logging destinations maintain adequate storage"
    ],
    subTaxonomicalElements: [
      "adequate storage",
      "maintain",
      "comply",
      "logging destinations"
    ],
    implementationSuggestions: [
      "log management tool", 
      "potentially OS dependent"
    ],
    relatedSafeguards: ["8.1", "8.9", "8.10"],
    systemPromptFull: {

      role: "audit_log_storage_expert",

      context: "You are evaluating audit log storage solutions against CIS Control 8.3 requirements for ensuring adequate audit log storage capacity.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "audit_log_storage_expert",

      context: "You are evaluating audit log storage solutions against CIS Control 8.3 requirements for ensuring adequate audit log storage capacity.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "audit_log_storage_expert",

      context: "You are evaluating audit log storage solutions against CIS Control 8.3 requirements for ensuring adequate audit log storage capacity.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "audit_log_storage_expert",

      context: "You are evaluating audit log storage solutions against CIS Control 8.3 requirements for ensuring adequate audit log storage capacity.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "audit_log_storage_expert",

      context: "You are evaluating audit log storage solutions against CIS Control 8.3 requirements for ensuring adequate audit log storage capacity.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.4": {
    id: "8.4",
    title: "Standardize Time Synchronization",
    description: "Standardize time synchronization. Configure at least two synchronized time sources across enterprise assets, where supported.",
    implementationGroup: "IG2", 
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Protect"],
    governanceElements: [
      "standardize time synchronization"
    ],
    coreRequirements: [
      "configure at least two synchronized time sources",
      "enterprise assets", 
      "where supported"
    ],
    subTaxonomicalElements: [
      "at least two",
      "synchronized",
      "time sources",
      "where supported"
    ],
    implementationSuggestions: [
      "secure configuration policy/process",
      "potentially OS dependent"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "time_synchronization_expert",

      context: "You are evaluating time synchronization solutions against CIS Control 8.4 requirements for standardized time synchronization across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "time_synchronization_expert",

      context: "You are evaluating time synchronization solutions against CIS Control 8.4 requirements for standardized time synchronization across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "time_synchronization_expert",

      context: "You are evaluating time synchronization solutions against CIS Control 8.4 requirements for standardized time synchronization across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "time_synchronization_expert",

      context: "You are evaluating time synchronization solutions against CIS Control 8.4 requirements for standardized time synchronization across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "time_synchronization_expert",

      context: "You are evaluating time synchronization solutions against CIS Control 8.4 requirements for standardized time synchronization across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.5": {
    id: "8.5",
    title: "Collect Detailed Audit Logs",
    description: "Configure detailed audit logging for enterprise assets containing sensitive data. Include event source, date, username, timestamp, source addresses, destination addresses, and other useful elements that could assist in a forensic investigation.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Detect"], 
    governanceElements: [
      "configure detailed audit logging"
    ],
    coreRequirements: [
      "enterprise assets containing sensitive data",
      "forensic investigation"
    ],
    subTaxonomicalElements: [
      "event source",
      "date", 
      "username",
      "timestamp",
      "source addresses",
      "destination addresses", 
      "other useful elements"
    ],
    implementationSuggestions: [
      "log management tool",
      "log management policy/process",
      "potentially OS dependent"
    ],
    relatedSafeguards: ["8.1", "1.1", "3.2"],
    systemPromptFull: {

      role: "detailed_audit_logging_expert",

      context: "You are evaluating detailed audit logging solutions against CIS Control 8.5 requirements for comprehensive audit logging of enterprise assets containing sensitive data.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "detailed_audit_logging_expert",

      context: "You are evaluating detailed audit logging solutions against CIS Control 8.5 requirements for comprehensive audit logging of enterprise assets containing sensitive data.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "detailed_audit_logging_expert",

      context: "You are evaluating detailed audit logging solutions against CIS Control 8.5 requirements for comprehensive audit logging of enterprise assets containing sensitive data.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "detailed_audit_logging_expert",

      context: "You are evaluating detailed audit logging solutions against CIS Control 8.5 requirements for comprehensive audit logging of enterprise assets containing sensitive data.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "detailed_audit_logging_expert",

      context: "You are evaluating detailed audit logging solutions against CIS Control 8.5 requirements for comprehensive audit logging of enterprise assets containing sensitive data.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.6": {
    id: "8.6",
    title: "Collect DNS Query Audit Logs", 
    description: "Collect DNS query audit logs on enterprise assets, where appropriate and supported.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Detect"],
    governanceElements: [
      "where appropriate and supported"
    ],
    coreRequirements: [
      "collect DNS query audit logs",
      "enterprise assets"
    ],
    subTaxonomicalElements: [
      "DNS query logs",
      "where appropriate",
      "where supported"
    ],
    implementationSuggestions: [
      "log management tool",
      "secure configuration policy/process", 
      "potentially OS dependent"
    ],
    relatedSafeguards: ["8.1", "4.9"],
    systemPromptFull: {

      role: "dns_audit_logging_expert",

      context: "You are evaluating DNS audit logging solutions against CIS Control 8.6 requirements for DNS query audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "dns_audit_logging_expert",

      context: "You are evaluating DNS audit logging solutions against CIS Control 8.6 requirements for DNS query audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "dns_audit_logging_expert",

      context: "You are evaluating DNS audit logging solutions against CIS Control 8.6 requirements for DNS query audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "dns_audit_logging_expert",

      context: "You are evaluating DNS audit logging solutions against CIS Control 8.6 requirements for DNS query audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "dns_audit_logging_expert",

      context: "You are evaluating DNS audit logging solutions against CIS Control 8.6 requirements for DNS query audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.7": {
    id: "8.7",
    title: "Collect URL Request Audit Logs",
    description: "Collect URL request audit logs on enterprise assets, where appropriate and supported.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Detect"],
    governanceElements: [
      "where appropriate and supported"
    ],
    coreRequirements: [
      "collect URL request audit logs", 
      "enterprise assets"
    ],
    subTaxonomicalElements: [
      "URL request audit logs",
      "where appropriate", 
      "where supported"
    ],
    implementationSuggestions: [
      "log management tool",
      "secure configuration policy/process",
      "potentially OS dependent"
    ],
    relatedSafeguards: ["8.1"],
    systemPromptFull: {

      role: "url_request_audit_logging_expert",

      context: "You are evaluating URL request audit logging solutions against CIS Control 8.7 requirements for URL request audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "url_request_audit_logging_expert",

      context: "You are evaluating URL request audit logging solutions against CIS Control 8.7 requirements for URL request audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "url_request_audit_logging_expert",

      context: "You are evaluating URL request audit logging solutions against CIS Control 8.7 requirements for URL request audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "url_request_audit_logging_expert",

      context: "You are evaluating URL request audit logging solutions against CIS Control 8.7 requirements for URL request audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "url_request_audit_logging_expert",

      context: "You are evaluating URL request audit logging solutions against CIS Control 8.7 requirements for URL request audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.8": {
    id: "8.8",
    title: "Collect Command-Line Audit Logs",
    description: "Collect command-line audit logs. Example implementations include collecting audit logs from PowerShell®, BASH™, and remote administrative terminals.",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Detect"],
    governanceElements: [
      "collect command-line audit logs"
    ],
    coreRequirements: [
      "command-line audit logs"
    ],
    subTaxonomicalElements: [
      "PowerShell",
      "BASH", 
      "remote administrative terminals"
    ],
    implementationSuggestions: [
      "log management tool",
      "secure configuration policy/process",
      "OS dependent"
    ],
    relatedSafeguards: ["8.1"],
    systemPromptFull: {

      role: "command_line_audit_logging_expert",

      context: "You are evaluating command-line audit logging solutions against CIS Control 8.8 requirements for command-line audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "command_line_audit_logging_expert",

      context: "You are evaluating command-line audit logging solutions against CIS Control 8.8 requirements for command-line audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "command_line_audit_logging_expert",

      context: "You are evaluating command-line audit logging solutions against CIS Control 8.8 requirements for command-line audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "command_line_audit_logging_expert",

      context: "You are evaluating command-line audit logging solutions against CIS Control 8.8 requirements for command-line audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "command_line_audit_logging_expert",

      context: "You are evaluating command-line audit logging solutions against CIS Control 8.8 requirements for command-line audit log collection.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.9": {
    id: "8.9",
    title: "Centralize Audit Logs",
    description: "Centralize, to the extent possible, audit log collection and retention across enterprise assets in accordance with the documented audit log management process. Example implementations include leveraging a SIEM tool to centralize multiple log sources.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Detect"], 
    governanceElements: [
      "in accordance with documented audit log management process",
      "to the extent possible"
    ],
    coreRequirements: [
      "centralize audit log collection and retention",
      "enterprise assets"
    ],
    subTaxonomicalElements: [
      "audit log collection",
      "audit log retention",
      "to the extent possible"
    ],
    implementationSuggestions: [
      "SIEM tool",
      "log analytics and centralization tool", 
      "OS dependent"
    ],
    relatedSafeguards: ["8.1", "8.3", "12.5", "13.1"],
    systemPromptFull: {

      role: "centralized_audit_logging_expert",

      context: "You are evaluating centralized audit logging solutions against CIS Control 8.9 requirements for centralized audit log collection and retention.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "centralized_audit_logging_expert",

      context: "You are evaluating centralized audit logging solutions against CIS Control 8.9 requirements for centralized audit log collection and retention.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "centralized_audit_logging_expert",

      context: "You are evaluating centralized audit logging solutions against CIS Control 8.9 requirements for centralized audit log collection and retention.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "centralized_audit_logging_expert",

      context: "You are evaluating centralized audit logging solutions against CIS Control 8.9 requirements for centralized audit log collection and retention.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "centralized_audit_logging_expert",

      context: "You are evaluating centralized audit logging solutions against CIS Control 8.9 requirements for centralized audit log collection and retention.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.10": {
    id: "8.10",
    title: "Retain Audit Logs", 
    description: "Retain audit logs across enterprise assets for a minimum of 90 days.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "data"],
    securityFunction: ["Protect"],
    governanceElements: [
      "minimum of 90 days"
    ],
    coreRequirements: [
      "retain audit logs",
      "enterprise assets"
    ],
    subTaxonomicalElements: [
      "minimum of 90 days"
    ],
    implementationSuggestions: [
      "log analytics and centralization tool"
    ],
    relatedSafeguards: ["8.1", "8.3"],
    systemPromptFull: {

      role: "audit_log_retention_expert",

      context: "You are evaluating audit log retention solutions against CIS Control 8.10 requirements for 90-day minimum audit log retention.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "audit_log_retention_expert",

      context: "You are evaluating audit log retention solutions against CIS Control 8.10 requirements for 90-day minimum audit log retention.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "audit_log_retention_expert",

      context: "You are evaluating audit log retention solutions against CIS Control 8.10 requirements for 90-day minimum audit log retention.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "audit_log_retention_expert",

      context: "You are evaluating audit log retention solutions against CIS Control 8.10 requirements for 90-day minimum audit log retention.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "audit_log_retention_expert",

      context: "You are evaluating audit log retention solutions against CIS Control 8.10 requirements for 90-day minimum audit log retention.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.11": {
    id: "8.11",
    title: "Conduct Audit Log Reviews",
    description: "Conduct reviews of audit logs to detect anomalies or abnormal events that could indicate a potential threat. Conduct reviews on a weekly, or more frequent, basis.",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Detect"],
    governanceElements: [
      "conduct reviews on a weekly, or more frequent, basis"
    ],
    coreRequirements: [
      "detect anomalies or abnormal events",
      "potential threat"
    ],
    subTaxonomicalElements: [
      "weekly", 
      "more frequent",
      "anomalies",
      "abnormal events"
    ],
    implementationSuggestions: [
      "log analytics and centralization tool"
    ],
    relatedSafeguards: ["8.1", "8.12"],
    systemPromptFull: {

      role: "audit_log_review_expert",

      context: "You are evaluating audit log review solutions against CIS Control 8.11 requirements for weekly audit log reviews to detect anomalies and threats.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "audit_log_review_expert",

      context: "You are evaluating audit log review solutions against CIS Control 8.11 requirements for weekly audit log reviews to detect anomalies and threats.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "audit_log_review_expert",

      context: "You are evaluating audit log review solutions against CIS Control 8.11 requirements for weekly audit log reviews to detect anomalies and threats.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "audit_log_review_expert",

      context: "You are evaluating audit log review solutions against CIS Control 8.11 requirements for weekly audit log reviews to detect anomalies and threats.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "audit_log_review_expert",

      context: "You are evaluating audit log review solutions against CIS Control 8.11 requirements for weekly audit log reviews to detect anomalies and threats.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "8.12": {
    id: "8.12",
    title: "Collect Service Provider Logs",
    description: "Collect service provider logs, where supported. Example implementations include collecting authentication and authorization events, data creation and disposal events, and user management events.",
    implementationGroup: "IG3",
    assetType: ["data"], 
    securityFunction: ["Detect"],
    governanceElements: [
      "where supported"
    ],
    coreRequirements: [
      "collect service provider logs"
    ],
    subTaxonomicalElements: [
      "authentication events",
      "authorization events",
      "data creation events", 
      "disposal events",
      "user management events"
    ],
    implementationSuggestions: [
      "log analytics and centralization tool",
      "secure configuration policy/process"
    ],
    relatedSafeguards: ["8.1", "8.11", "15.1"],
    systemPromptFull: {

      role: "service_provider_log_collection_expert",

      context: "You are evaluating service provider log collection solutions against CIS Control 8.12 requirements for collecting service provider logs where supported.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_log_collection_expert",

      context: "You are evaluating service provider log collection solutions against CIS Control 8.12 requirements for collecting service provider logs where supported.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_log_collection_expert",

      context: "You are evaluating service provider log collection solutions against CIS Control 8.12 requirements for collecting service provider logs where supported.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_log_collection_expert",

      context: "You are evaluating service provider log collection solutions against CIS Control 8.12 requirements for collecting service provider logs where supported.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_log_collection_expert",

      context: "You are evaluating service provider log collection solutions against CIS Control 8.12 requirements for collecting service provider logs where supported.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "9.1": {
    id: "9.1",
    title: "Ensure Use of Only Fully Supported Browsers and Email Clients",
    description: "Ensure only fully supported browsers and email clients are allowed to execute in the enterprise, only using the latest version of browsers and email clients provided through the vendor",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "ensure only fully supported browsers and email clients are allowed to execute",
      "only using the latest version provided through the vendor"
    ],
    coreRequirements: [ // Green - The "what"
      "fully supported browsers only",
      "fully supported email clients only", 
      "latest vendor versions only",
      "execution restriction enforcement"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "ensure only fully supported",
      "browsers and email clients",
      "are allowed to execute",
      "in the enterprise",
      "only using the latest version",
      "provided through the vendor"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "enterprise and software asset management tools",
      "application allowlisting",
      "software inventory systems",
      "automated patch management"
    ],
    relatedSafeguards: ["2.1", "4.1", "7.4"],
    systemPromptFull: {

      role: "browser_email_client_security_expert",

      context: "You are evaluating browser and email client security solutions against CIS Control 9.1 requirements for ensuring only fully supported, latest versions are used.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "browser_email_client_security_expert",

      context: "You are evaluating browser and email client security solutions against CIS Control 9.1 requirements for ensuring only fully supported, latest versions are used.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "browser_email_client_security_expert",

      context: "You are evaluating browser and email client security solutions against CIS Control 9.1 requirements for ensuring only fully supported, latest versions are used.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "browser_email_client_security_expert",

      context: "You are evaluating browser and email client security solutions against CIS Control 9.1 requirements for ensuring only fully supported, latest versions are used.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "browser_email_client_security_expert",

      context: "You are evaluating browser and email client security solutions against CIS Control 9.1 requirements for ensuring only fully supported, latest versions are used.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "9.2": {
    id: "9.2",
    title: "Use DNS Filtering Services",
    description: "Use DNS filtering services on all end-user devices, including remote and on-premise assets, to block access to known malicious domains",
    implementationGroup: "IG1",
    assetType: ["devices", "network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use DNS filtering services on all end-user devices",
      "including remote and on-premise assets",
      "to block access to known malicious domains"
    ],
    coreRequirements: [ // Green - The "what"
      "DNS filtering services deployment",
      "all end-user device coverage",
      "malicious domain blocking",
      "remote and on-premise asset inclusion"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "use DNS filtering services",
      "on all end-user devices", 
      "including remote assets",
      "including on-premise assets",
      "to block access",
      "to known malicious domains"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "DNS filtering services",
      "secure DNS servers",
      "DNS security platforms",
      "cloud-based DNS filtering"
    ],
    relatedSafeguards: ["4.1", "4.9"],
    systemPromptFull: {

      role: "dns_filtering_security_expert",

      context: "You are evaluating DNS filtering solutions against CIS Control 9.2 requirements for DNS filtering services to block malicious domains.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "dns_filtering_security_expert",

      context: "You are evaluating DNS filtering solutions against CIS Control 9.2 requirements for DNS filtering services to block malicious domains.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "dns_filtering_security_expert",

      context: "You are evaluating DNS filtering solutions against CIS Control 9.2 requirements for DNS filtering services to block malicious domains.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "dns_filtering_security_expert",

      context: "You are evaluating DNS filtering solutions against CIS Control 9.2 requirements for DNS filtering services to block malicious domains.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "dns_filtering_security_expert",

      context: "You are evaluating DNS filtering solutions against CIS Control 9.2 requirements for DNS filtering services to block malicious domains.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "9.3": {
    id: "9.3",
    title: "Maintain and Enforce Network-Based URL Filters",
    description: "Enforce and update network-based URL filters to limit an enterprise asset from connecting to potentially malicious or unapproved websites. Example implementations include category-based filtering, reputation-based filtering, or through the use of block lists. Enforce filters for all enterprise assets",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "enforce and update network-based URL filters",
      "to limit enterprise asset from connecting to potentially malicious or unapproved websites",
      "enforce filters for all enterprise assets"
    ],
    coreRequirements: [ // Green - The "what"
      "network-based URL filters",
      "enterprise asset connection limiting",
      "malicious website blocking",
      "unapproved website blocking"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enforce network-based URL filters",
      "update network-based URL filters",
      "limit enterprise asset from connecting",
      "to potentially malicious websites",
      "to unapproved websites",
      "enforce filters for all enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "URL filtering tools",
      "category-based filtering",
      "reputation-based filtering", 
      "block lists",
      "web content filtering"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "network_security_filtering_expert",

      context: "You are evaluating network-based URL filtering solutions against CIS Control 9.3 requirements for network-based URL filters to limit enterprise asset connections to malicious or unapproved websites.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_security_filtering_expert",

      context: "You are evaluating network-based URL filtering solutions against CIS Control 9.3 requirements for network-based URL filters to limit enterprise asset connections to malicious or unapproved websites.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_security_filtering_expert",

      context: "You are evaluating network-based URL filtering solutions against CIS Control 9.3 requirements for network-based URL filters to limit enterprise asset connections to malicious or unapproved websites.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_security_filtering_expert",

      context: "You are evaluating network-based URL filtering solutions against CIS Control 9.3 requirements for network-based URL filters to limit enterprise asset connections to malicious or unapproved websites.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_security_filtering_expert",

      context: "You are evaluating network-based URL filtering solutions against CIS Control 9.3 requirements for network-based URL filters to limit enterprise asset connections to malicious or unapproved websites.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "9.4": {
    id: "9.4",
    title: "Restrict Unnecessary or Unauthorized Browser and Email Client Extensions",
    description: "Restrict, either through uninstalling or disabling, any unauthorized or unnecessary browser or email client plugins, extensions, and add-on applications",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "restrict unauthorized or unnecessary browser or email client plugins, extensions, and add-on applications",
      "either through uninstalling or disabling"
    ],
    coreRequirements: [ // Green - The "what"
      "browser plugin restrictions",
      "email client plugin restrictions",
      "browser extension restrictions",
      "add-on application restrictions"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "restrict through uninstalling or disabling",
      "unauthorized browser plugins",
      "unnecessary browser plugins",
      "unauthorized email client plugins",
      "unnecessary email client plugins",
      "unauthorized browser extensions",
      "unnecessary browser extensions",
      "unauthorized add-on applications",
      "unnecessary add-on applications"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "configuration management tools",
      "browser management systems",
      "application control policies",
      "extension management platforms"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "browser_security_management_expert",

      context: "You are evaluating browser and email client extension management solutions against CIS Control 9.4 requirements for restricting unauthorized or unnecessary plugins, extensions, and add-on applications.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "browser_security_management_expert",

      context: "You are evaluating browser and email client extension management solutions against CIS Control 9.4 requirements for restricting unauthorized or unnecessary plugins, extensions, and add-on applications.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "browser_security_management_expert",

      context: "You are evaluating browser and email client extension management solutions against CIS Control 9.4 requirements for restricting unauthorized or unnecessary plugins, extensions, and add-on applications.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "browser_security_management_expert",

      context: "You are evaluating browser and email client extension management solutions against CIS Control 9.4 requirements for restricting unauthorized or unnecessary plugins, extensions, and add-on applications.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "browser_security_management_expert",

      context: "You are evaluating browser and email client extension management solutions against CIS Control 9.4 requirements for restricting unauthorized or unnecessary plugins, extensions, and add-on applications.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "9.5": {
    id: "9.5",
    title: "Implement DMARC",
    description: "To lower the chance of spoofed or modified emails from valid domains, implement DMARC policy and verification, starting with implementing the Sender Policy Framework (SPF) and the DomainKeys Identified Mail (DKIM) standards",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "implement DMARC policy and verification",
      "to lower the chance of spoofed or modified emails from valid domains",
      "starting with implementing SPF and DKIM standards"
    ],
    coreRequirements: [ // Green - The "what"
      "DMARC policy implementation",
      "DMARC verification implementation",
      "SPF standard implementation",
      "DKIM standard implementation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "implement DMARC policy",
      "implement DMARC verification",
      "to lower the chance of spoofed emails",
      "to lower the chance of modified emails",
      "from valid domains",
      "starting with implementing SPF",
      "starting with implementing DKIM",
      "Sender Policy Framework standards",
      "DomainKeys Identified Mail standards"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "DMARC management tools",
      "email authentication services",
      "SPF record management",
      "DKIM signature management"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "email_authentication_security_expert",

      context: "You are evaluating email authentication solutions against CIS Control 9.5 requirements for implementing DMARC policy and verification, including SPF and DKIM standards to prevent spoofed or modified emails.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "email_authentication_security_expert",

      context: "You are evaluating email authentication solutions against CIS Control 9.5 requirements for implementing DMARC policy and verification, including SPF and DKIM standards to prevent spoofed or modified emails.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "email_authentication_security_expert",

      context: "You are evaluating email authentication solutions against CIS Control 9.5 requirements for implementing DMARC policy and verification, including SPF and DKIM standards to prevent spoofed or modified emails.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "email_authentication_security_expert",

      context: "You are evaluating email authentication solutions against CIS Control 9.5 requirements for implementing DMARC policy and verification, including SPF and DKIM standards to prevent spoofed or modified emails.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "email_authentication_security_expert",

      context: "You are evaluating email authentication solutions against CIS Control 9.5 requirements for implementing DMARC policy and verification, including SPF and DKIM standards to prevent spoofed or modified emails.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "9.6": {
    id: "9.6",
    title: "Block Unnecessary File Types",
    description: "Block unnecessary file types attempting to enter the enterprise's email gateway",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "block unnecessary file types attempting to enter the enterprise's email gateway"
    ],
    coreRequirements: [ // Green - The "what"
      "unnecessary file type blocking",
      "email gateway protection",
      "file type filtering"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "block unnecessary file types",
      "attempting to enter",
      "the enterprise's email gateway"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "email security tools",
      "email gateway filtering",
      "file type blocking systems",
      "email content filtering"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "email_gateway_security_expert",

      context: "You are evaluating email gateway security solutions against CIS Control 9.6 requirements for blocking unnecessary file types attempting to enter the enterprise's email gateway.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "email_gateway_security_expert",

      context: "You are evaluating email gateway security solutions against CIS Control 9.6 requirements for blocking unnecessary file types attempting to enter the enterprise's email gateway.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "email_gateway_security_expert",

      context: "You are evaluating email gateway security solutions against CIS Control 9.6 requirements for blocking unnecessary file types attempting to enter the enterprise's email gateway.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "email_gateway_security_expert",

      context: "You are evaluating email gateway security solutions against CIS Control 9.6 requirements for blocking unnecessary file types attempting to enter the enterprise's email gateway.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "email_gateway_security_expert",

      context: "You are evaluating email gateway security solutions against CIS Control 9.6 requirements for blocking unnecessary file types attempting to enter the enterprise's email gateway.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "9.7": {
    id: "9.7",
    title: "Deploy and Maintain Email Server Anti-Malware Protections",
    description: "Deploy and maintain email server anti-malware protections, such as attachment scanning and/or sandboxing",
    implementationGroup: "IG1",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "deploy and maintain email server anti-malware protections",
      "such as attachment scanning and/or sandboxing"
    ],
    coreRequirements: [ // Green - The "what"
      "email server anti-malware protections",
      "attachment scanning capabilities",
      "sandboxing capabilities",
      "deployment and maintenance"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "deploy email server anti-malware protections",
      "maintain email server anti-malware protections",
      "such as attachment scanning",
      "such as sandboxing",
      "attachment scanning and/or sandboxing"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "email security tools",
      "anti-malware platforms",
      "attachment scanning systems",
      "email sandboxing solutions"
    ],
    relatedSafeguards: ["4.1", "10.1"],
    systemPromptFull: {

      role: "email_security_anti_malware_expert",

      context: "You are evaluating email server anti-malware solutions against CIS Control 9.7 requirements for deploying and maintaining email server anti-malware protections including attachment scanning and sandboxing.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "email_security_anti_malware_expert",

      context: "You are evaluating email server anti-malware solutions against CIS Control 9.7 requirements for deploying and maintaining email server anti-malware protections including attachment scanning and sandboxing.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "email_security_anti_malware_expert",

      context: "You are evaluating email server anti-malware solutions against CIS Control 9.7 requirements for deploying and maintaining email server anti-malware protections including attachment scanning and sandboxing.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "email_security_anti_malware_expert",

      context: "You are evaluating email server anti-malware solutions against CIS Control 9.7 requirements for deploying and maintaining email server anti-malware protections including attachment scanning and sandboxing.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "email_security_anti_malware_expert",

      context: "You are evaluating email server anti-malware solutions against CIS Control 9.7 requirements for deploying and maintaining email server anti-malware protections including attachment scanning and sandboxing.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "10.1": {
    id: "10.1",
    title: "Deploy and Maintain Anti-Malware Software",
    description: "Deploy and maintain anti-malware software on all enterprise assets",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "deploy anti-malware software",
      "maintain anti-malware software",
      "all enterprise assets coverage",
      "anti-malware software management"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-malware software deployment",
      "anti-malware software maintenance",
      "enterprise assets protection",
      "malware detection capabilities"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "deploy",
      "maintain", 
      "anti-malware software",
      "all enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "endpoint protection platforms",
      "anti-virus solutions",
      "endpoint detection and response",
      "malware protection tools",
      "security software management"
    ],
    relatedSafeguards: ["4.1", "10.2", "10.4", "10.6", "10.7", "13.5"],
    systemPromptFull: {

      role: "endpoint_security_anti_malware_expert",

      context: "You are evaluating anti-malware solutions against CIS Control 10.1 requirements for deploying and maintaining anti-malware software on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "endpoint_security_anti_malware_expert",

      context: "You are evaluating anti-malware solutions against CIS Control 10.1 requirements for deploying and maintaining anti-malware software on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "endpoint_security_anti_malware_expert",

      context: "You are evaluating anti-malware solutions against CIS Control 10.1 requirements for deploying and maintaining anti-malware software on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "endpoint_security_anti_malware_expert",

      context: "You are evaluating anti-malware solutions against CIS Control 10.1 requirements for deploying and maintaining anti-malware software on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "endpoint_security_anti_malware_expert",

      context: "You are evaluating anti-malware solutions against CIS Control 10.1 requirements for deploying and maintaining anti-malware software on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "10.2": {
    id: "10.2",
    title: "Configure Automatic Anti-Malware Signature Updates",
    description: "Configure automatic updates for anti-malware signature files on all enterprise assets",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "configure automatic updates",
      "anti-malware signature files",
      "all enterprise assets coverage",
      "signature update management"
    ],
    coreRequirements: [ // Green - The "what"
      "automatic updates configuration",
      "anti-malware signature files",
      "enterprise assets coverage"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "configure",
      "automatic updates",
      "anti-malware signature files",
      "all enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "anti-malware software can auto update potentially"
    ],
    relatedSafeguards: ["10.1"],
    systemPromptFull: {

      role: "anti_malware_signature_management_expert",

      context: "You are evaluating anti-malware signature update solutions against CIS Control 10.2 requirements for configuring automatic updates for anti-malware signature files on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "anti_malware_signature_management_expert",

      context: "You are evaluating anti-malware signature update solutions against CIS Control 10.2 requirements for configuring automatic updates for anti-malware signature files on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

       guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "anti_malware_signature_management_expert",

      context: "You are evaluating anti-malware signature update solutions against CIS Control 10.2 requirements for configuring automatic updates for anti-malware signature files on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

       guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "anti_malware_signature_management_expert",

      context: "You are evaluating anti-malware signature update solutions against CIS Control 10.2 requirements for configuring automatic updates for anti-malware signature files on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

       guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "anti_malware_signature_management_expert",

      context: "You are evaluating anti-malware signature update solutions against CIS Control 10.2 requirements for configuring automatic updates for anti-malware signature files on all enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

       guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "10.3": {
    id: "10.3", 
    title: "Disable Autorun and Autoplay for Removable Media",
    description: "Disable autorun and autoplay auto-execute functionality for removable media",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "disable autorun functionality",
      "disable autoplay functionality", 
      "auto-execute prevention",
      "removable media security"
    ],
    coreRequirements: [ // Green - The "what"
      "autorun disabling",
      "autoplay disabling", 
      "auto-execute prevention",
      "removable media protection"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "disable",
      "autorun",
      "autoplay",
      "auto-execute functionality",
      "removable media"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "group policy settings",
      "registry modifications",
      "configuration management tools",
      "secure configuration policy/process"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "removable_media_security_expert",

      context: "You are evaluating removable media security solutions against CIS Control 10.3 requirements for disabling autorun and autoplay auto-execute functionality for removable media.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "removable_media_security_expert",

      context: "You are evaluating removable media security solutions against CIS Control 10.3 requirements for disabling autorun and autoplay auto-execute functionality for removable media.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "removable_media_security_expert",

      context: "You are evaluating removable media security solutions against CIS Control 10.3 requirements for disabling autorun and autoplay auto-execute functionality for removable media.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "removable_media_security_expert",

      context: "You are evaluating removable media security solutions against CIS Control 10.3 requirements for disabling autorun and autoplay auto-execute functionality for removable media.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "removable_media_security_expert",

      context: "You are evaluating removable media security solutions against CIS Control 10.3 requirements for disabling autorun and autoplay auto-execute functionality for removable media.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "10.4": {
    id: "10.4",
    title: "Configure Automatic Anti-Malware Scanning of Removable Media", 
    description: "Configure anti-malware software to automatically scan removable media",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "configure anti-malware software",
      "automatic scanning configuration",
      "removable media scanning",
      "scanning policy management"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-malware software configuration",
      "automatic scanning",
      "removable media protection",
      "malware detection on media"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "configure",
      "anti-malware software",
      "automatically scan",
      "removable media"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "anti-malware software configuration policy/process",
      "endpoint scanning policies",
      "media scanning tools",
      "automated threat detection"
    ],
    relatedSafeguards: ["10.1"],
    systemPromptFull: {

      role: "anti_malware_scanning_configuration_expert",

      context: "You are evaluating anti-malware scanning solutions against CIS Control 10.4 requirements for configuring anti-malware software to automatically scan removable media.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "anti_malware_scanning_configuration_expert",

      context: "You are evaluating anti-malware scanning solutions against CIS Control 10.4 requirements for configuring anti-malware software to automatically scan removable media.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "anti_malware_scanning_configuration_expert",

      context: "You are evaluating anti-malware scanning solutions against CIS Control 10.4 requirements for configuring anti-malware software to automatically scan removable media.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "anti_malware_scanning_configuration_expert",

      context: "You are evaluating anti-malware scanning solutions against CIS Control 10.4 requirements for configuring anti-malware software to automatically scan removable media.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "anti_malware_scanning_configuration_expert",

      context: "You are evaluating anti-malware scanning solutions against CIS Control 10.4 requirements for configuring anti-malware software to automatically scan removable media.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "10.5": {
    id: "10.5",
    title: "Enable Anti-Exploitation Features",
    description: "Enable anti-exploitation features on enterprise assets and software, where possible, such as Microsoft® Data Execution Prevention (DEP), Windows® Defender Exploit Guard (WDEG), or Apple® System Integrity Protection (SIP) and Gatekeeper™",
    implementationGroup: "IG2", 
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "enable anti-exploitation features",
      "enterprise assets coverage", 
      "software protection",
      "where possible implementation"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-exploitation features",
      "enterprise assets protection",
      "software security",
      "exploit prevention"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enable",
      "anti-exploitation features",
      "enterprise assets",
      "software", 
      "where possible"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Microsoft® Data Execution Prevention (DEP)",
      "Windows® Defender Exploit Guard (WDEG)", 
      "Apple® System Integrity Protection (SIP)",
      "Gatekeeper™",
      "configuration management tool"
    ],
    relatedSafeguards: ["4.1"],
    systemPromptFull: {

      role: "anti_exploitation_security_expert",

      context: "You are evaluating anti-exploitation solutions against CIS Control 10.5 requirements for enabling anti-exploitation features on enterprise assets and software, including DEP, WDEG, SIP, and Gatekeeper.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "anti_exploitation_security_expert",

      context: "You are evaluating anti-exploitation solutions against CIS Control 10.5 requirements for enabling anti-exploitation features on enterprise assets and software, including DEP, WDEG, SIP, and Gatekeeper.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "anti_exploitation_security_expert",

      context: "You are evaluating anti-exploitation solutions against CIS Control 10.5 requirements for enabling anti-exploitation features on enterprise assets and software, including DEP, WDEG, SIP, and Gatekeeper.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "anti_exploitation_security_expert",

      context: "You are evaluating anti-exploitation solutions against CIS Control 10.5 requirements for enabling anti-exploitation features on enterprise assets and software, including DEP, WDEG, SIP, and Gatekeeper.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "anti_exploitation_security_expert",

      context: "You are evaluating anti-exploitation solutions against CIS Control 10.5 requirements for enabling anti-exploitation features on enterprise assets and software, including DEP, WDEG, SIP, and Gatekeeper.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "10.6": {
    id: "10.6",
    title: "Centrally Manage Anti-Malware Software", 
    description: "Centrally manage anti-malware software",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "centrally manage anti-malware",
      "centralized management process",
      "anti-malware software governance", 
      "management infrastructure"
    ],
    coreRequirements: [ // Green - The "what"
      "centralized management",
      "anti-malware software",
      "management capabilities",
      "centralized control"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "centrally manage",
      "anti-malware software"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "anti-malware software configuration policy/process",
      "centralized management platforms",
      "security management consoles",
      "enterprise security tools"
    ],
    relatedSafeguards: ["10.1"],
    systemPromptFull: {

      role: "centralized_anti_malware_management_expert",

      context: "You are evaluating centralized anti-malware management solutions against CIS Control 10.6 requirements for centrally managing anti-malware software across the enterprise.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "centralized_anti_malware_management_expert",

      context: "You are evaluating centralized anti-malware management solutions against CIS Control 10.6 requirements for centrally managing anti-malware software across the enterprise.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "centralized_anti_malware_management_expert",

      context: "You are evaluating centralized anti-malware management solutions against CIS Control 10.6 requirements for centrally managing anti-malware software across the enterprise.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "centralized_anti_malware_management_expert",

      context: "You are evaluating centralized anti-malware management solutions against CIS Control 10.6 requirements for centrally managing anti-malware software across the enterprise.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "centralized_anti_malware_management_expert",

      context: "You are evaluating centralized anti-malware management solutions against CIS Control 10.6 requirements for centrally managing anti-malware software across the enterprise.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "10.7": {
    id: "10.7",
    title: "Use Behavior-Based Anti-Malware Software",
    description: "Use behavior-based anti-malware software", 
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "use behavior-based anti-malware",
      "behavioral analysis implementation",
      "advanced threat detection",
      "behavior-based protection"
    ],
    coreRequirements: [ // Green - The "what"
      "behavior-based anti-malware software",
      "behavioral analysis",
      "advanced malware detection",
      "dynamic threat identification"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "use",
      "behavior-based",
      "anti-malware software"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "anti-malware software configuration policy/process", 
      "behavioral analysis tools",
      "advanced endpoint detection",
      "machine learning security"
    ],
    relatedSafeguards: ["10.1"],
    systemPromptFull: {

      role: "behavioral_anti_malware_analysis_expert",

      context: "You are evaluating behavior-based anti-malware solutions against CIS Control 10.7 requirements for using behavior-based anti-malware software with advanced threat detection capabilities.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "behavioral_anti_malware_analysis_expert",

      context: "You are evaluating behavior-based anti-malware solutions against CIS Control 10.7 requirements for using behavior-based anti-malware software with advanced threat detection capabilities.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "behavioral_anti_malware_analysis_expert",

      context: "You are evaluating behavior-based anti-malware solutions against CIS Control 10.7 requirements for using behavior-based anti-malware software with advanced threat detection capabilities.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "behavioral_anti_malware_analysis_expert",

      context: "You are evaluating behavior-based anti-malware solutions against CIS Control 10.7 requirements for using behavior-based anti-malware software with advanced threat detection capabilities.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "behavioral_anti_malware_analysis_expert",

      context: "You are evaluating behavior-based anti-malware solutions against CIS Control 10.7 requirements for using behavior-based anti-malware software with advanced threat detection capabilities.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "11.1": {
    id: "11.1",
    title: "Establish and Maintain a Data Recovery Process",
    description: "Establish and maintain a documented data recovery process. In the process, address the scope of data recovery activities, recovery prioritization, and the security of backup data. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish documented data recovery process",
      "maintain documented data recovery process",
      "review and update documentation annually",
      "when significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented data recovery process",
      "scope of data recovery activities",
      "recovery prioritization", 
      "security of backup data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "establish",
      "maintain",
      "documented data recovery process",
      "scope of data recovery activities",
      "recovery prioritization",
      "security of backup data",
      "review and update documentation",
      "annually",
      "when significant enterprise changes occur"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data recovery policy/process",
      "business continuity documentation",
      "recovery procedures manual",
      "backup and recovery strategy"
    ],
    relatedSafeguards: ["3.2", "3.4", "3.5", "3.8", "11.2", "11.3", "11.4", "11.5"],
    systemPromptFull: {

      role: "data_recovery_governance_expert",

      context: "You are evaluating data recovery governance solutions against CIS Control 11.1 requirements for establishing and maintaining a documented data recovery process with scope, prioritization, and backup security considerations.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_recovery_governance_expert",

      context: "You are evaluating data recovery governance solutions against CIS Control 11.1 requirements for establishing and maintaining a documented data recovery process with scope, prioritization, and backup security considerations.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_recovery_governance_expert",

      context: "You are evaluating data recovery governance solutions against CIS Control 11.1 requirements for establishing and maintaining a documented data recovery process with scope, prioritization, and backup security considerations.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_recovery_governance_expert",

      context: "You are evaluating data recovery governance solutions against CIS Control 11.1 requirements for establishing and maintaining a documented data recovery process with scope, prioritization, and backup security considerations.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_recovery_governance_expert",

      context: "You are evaluating data recovery governance solutions against CIS Control 11.1 requirements for establishing and maintaining a documented data recovery process with scope, prioritization, and backup security considerations.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "11.2": {
    id: "11.2", 
    title: "Perform Automated Backups",
    description: "Perform automated backups of in-scope enterprise assets. Run backups weekly, or more frequently, based on the sensitivity of the data",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "perform automated backups",
      "in-scope enterprise assets",
      "run backups weekly or more frequently",
      "based on sensitivity of data"
    ],
    coreRequirements: [ // Green - The "what"
      "automated backups",
      "in-scope enterprise assets",
      "backup frequency requirements",
      "data sensitivity considerations"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "perform",
      "automated backups",
      "in-scope enterprise assets",
      "run backups",
      "weekly",
      "more frequently", 
      "based on sensitivity of the data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data backup and recovery tool",
      "automated backup systems",
      "backup scheduling software",
      "enterprise backup solutions"
    ],
    relatedSafeguards: ["1.1", "2.1", "11.1"],
    systemPromptFull: {

      role: "automated_backup_systems_expert",

      context: "You are evaluating automated backup solutions against CIS Control 11.2 requirements for performing automated backups of in-scope enterprise assets with weekly or more frequent schedules based on data sensitivity.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "automated_backup_systems_expert",

      context: "You are evaluating automated backup solutions against CIS Control 11.2 requirements for performing automated backups of in-scope enterprise assets with weekly or more frequent schedules based on data sensitivity.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "automated_backup_systems_expert",

      context: "You are evaluating automated backup solutions against CIS Control 11.2 requirements for performing automated backups of in-scope enterprise assets with weekly or more frequent schedules based on data sensitivity.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "automated_backup_systems_expert",

      context: "You are evaluating automated backup solutions against CIS Control 11.2 requirements for performing automated backups of in-scope enterprise assets with weekly or more frequent schedules based on data sensitivity.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "automated_backup_systems_expert",

      context: "You are evaluating automated backup solutions against CIS Control 11.2 requirements for performing automated backups of in-scope enterprise assets with weekly or more frequent schedules based on data sensitivity.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "11.3": {
    id: "11.3",
    title: "Protect Recovery Data", 
    description: "Protect recovery data with equivalent controls to the original data. Reference encryption or data separation, based on requirements",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "protect recovery data",
      "equivalent controls to original data",
      "reference encryption or data separation", 
      "based on requirements"
    ],
    coreRequirements: [ // Green - The "what"
      "recovery data protection",
      "equivalent controls",
      "original data protection parity",
      "requirements-based implementation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "protect",
      "recovery data", 
      "equivalent controls to the original data",
      "reference encryption",
      "data separation",
      "based on requirements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data backup and recovery tool",
      "backup encryption systems",
      "secure backup storage",
      "data separation technologies"
    ],
    relatedSafeguards: ["3.3", "3.10", "3.11", "11.1"],
    systemPromptFull: {

      role: "backup_data_protection_expert",

      context: "You are evaluating backup data protection solutions against CIS Control 11.3 requirements for protecting recovery data with equivalent controls to the original data, including encryption or data separation based on requirements.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "backup_data_protection_expert",

      context: "You are evaluating backup data protection solutions against CIS Control 11.3 requirements for protecting recovery data with equivalent controls to the original data, including encryption or data separation based on requirements.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "backup_data_protection_expert",

      context: "You are evaluating backup data protection solutions against CIS Control 11.3 requirements for protecting recovery data with equivalent controls to the original data, including encryption or data separation based on requirements.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "backup_data_protection_expert",

      context: "You are evaluating backup data protection solutions against CIS Control 11.3 requirements for protecting recovery data with equivalent controls to the original data, including encryption or data separation based on requirements.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "backup_data_protection_expert",

      context: "You are evaluating backup data protection solutions against CIS Control 11.3 requirements for protecting recovery data with equivalent controls to the original data, including encryption or data separation based on requirements.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "11.4": {
    id: "11.4",
    title: "Establish and Maintain an Isolated Instance of Recovery Data",
    description: "Establish and maintain an isolated instance of recovery data. Example implementations include version controlling backup destinations through offline, cloud, or off-site systems or services",
    implementationGroup: "IG1", 
    assetType: ["data"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "establish isolated instance of recovery data",
      "maintain isolated instance of recovery data",
      "version controlling backup destinations",
      "example implementations include offline, cloud, or off-site systems or services"
    ],
    coreRequirements: [ // Green - The "what"
      "isolated instance of recovery data",
      "backup destination control",
      "recovery data isolation",
      "implementation flexibility"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "establish",
      "maintain",
      "isolated instance of recovery data",
      "version controlling backup destinations",
      "offline", 
      "cloud",
      "off-site systems",
      "services"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data backup and recovery tool",
      "offline backup systems",
      "cloud backup services", 
      "off-site storage solutions",
      "version controlling backup destinations"
    ],
    relatedSafeguards: ["11.1"],
    systemPromptFull: {

      role: "isolated_backup_recovery_expert",

      context: "You are evaluating isolated backup recovery solutions against CIS Control 11.4 requirements for establishing and maintaining an isolated instance of recovery data with version controlling backup destinations through offline, cloud, or off-site systems.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "isolated_backup_recovery_expert",

      context: "You are evaluating isolated backup recovery solutions against CIS Control 11.4 requirements for establishing and maintaining an isolated instance of recovery data with version controlling backup destinations through offline, cloud, or off-site systems.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "isolated_backup_recovery_expert",

      context: "You are evaluating isolated backup recovery solutions against CIS Control 11.4 requirements for establishing and maintaining an isolated instance of recovery data with version controlling backup destinations through offline, cloud, or off-site systems.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "isolated_backup_recovery_expert",

      context: "You are evaluating isolated backup recovery solutions against CIS Control 11.4 requirements for establishing and maintaining an isolated instance of recovery data with version controlling backup destinations through offline, cloud, or off-site systems.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "isolated_backup_recovery_expert",

      context: "You are evaluating isolated backup recovery solutions against CIS Control 11.4 requirements for establishing and maintaining an isolated instance of recovery data with version controlling backup destinations through offline, cloud, or off-site systems.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "11.5": {
    id: "11.5",
    title: "Test Data Recovery",
    description: "Test backup recovery quarterly, or more frequently, for a sampling of in-scope enterprise assets", 
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "test backup recovery quarterly or more frequently",
      "sampling of in-scope enterprise assets",
      "recovery testing requirements",
      "testing frequency management"
    ],
    coreRequirements: [ // Green - The "what"
      "backup recovery testing", 
      "quarterly testing frequency",
      "in-scope enterprise assets sampling",
      "recovery validation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "test backup recovery",
      "quarterly",
      "more frequently",
      "sampling",
      "in-scope enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data recovery policy/process",
      "data backup and recovery tool",
      "recovery testing procedures",
      "backup validation systems"
    ],
    relatedSafeguards: ["11.1"],
    systemPromptFull: {

      role: "backup_recovery_testing_expert",

      context: "You are evaluating backup recovery testing solutions against CIS Control 11.5 requirements for testing backup recovery quarterly or more frequently for a sampling of in-scope enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "backup_recovery_testing_expert",

      context: "You are evaluating backup recovery testing solutions against CIS Control 11.5 requirements for testing backup recovery quarterly or more frequently for a sampling of in-scope enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "backup_recovery_testing_expert",

      context: "You are evaluating backup recovery testing solutions against CIS Control 11.5 requirements for testing backup recovery quarterly or more frequently for a sampling of in-scope enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "backup_recovery_testing_expert",

      context: "You are evaluating backup recovery testing solutions against CIS Control 11.5 requirements for testing backup recovery quarterly or more frequently for a sampling of in-scope enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "backup_recovery_testing_expert",

      context: "You are evaluating backup recovery testing solutions against CIS Control 11.5 requirements for testing backup recovery quarterly or more frequently for a sampling of in-scope enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.1": {
    id: "12.1",
    title: "Ensure Network Infrastructure is Up-to-Date",
    description: "Ensure network infrastructure is kept up-to-date. Example implementations include running the latest stable release of software and/or using currently supported network-as-a-service (NaaS) offerings. Review software versions monthly, or more frequently, to verify software support",
    implementationGroup: "IG1",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "ensure network infrastructure is kept up-to-date",
      "review software versions monthly or more frequently",
      "verify software support",
      "network infrastructure maintenance"
    ],
    coreRequirements: [ // Green - The "what"
      "network infrastructure up-to-date",
      "latest stable release of software",
      "currently supported network-as-a-service offerings",
      "software version review"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "ensure",
      "network infrastructure is kept up-to-date",
      "running the latest stable release of software",
      "using currently supported network-as-a-service (NaaS) offerings",
      "review software versions",
      "monthly",
      "more frequently",
      "verify software support"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "enterprise and software asset management tool",
      "network management systems",
      "automated patching tools",
      "network-as-a-service platforms"
    ],
    relatedSafeguards: ["4.2", "7.3"],
    systemPromptFull: {

      role: "network_infrastructure_management_expert",

      context: "You are evaluating network infrastructure management solutions against CIS Control 12.1 requirements for ensuring network infrastructure is kept up-to-date with latest stable software releases and supported NaaS offerings.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_infrastructure_management_expert",

      context: "You are evaluating network infrastructure management solutions against CIS Control 12.1 requirements for ensuring network infrastructure is kept up-to-date with latest stable software releases and supported NaaS offerings.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_infrastructure_management_expert",

      context: "You are evaluating network infrastructure management solutions against CIS Control 12.1 requirements for ensuring network infrastructure is kept up-to-date with latest stable software releases and supported NaaS offerings.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_infrastructure_management_expert",

      context: "You are evaluating network infrastructure management solutions against CIS Control 12.1 requirements for ensuring network infrastructure is kept up-to-date with latest stable software releases and supported NaaS offerings.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_infrastructure_management_expert",

      context: "You are evaluating network infrastructure management solutions against CIS Control 12.1 requirements for ensuring network infrastructure is kept up-to-date with latest stable software releases and supported NaaS offerings.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.2": {
    id: "12.2",
    title: "Establish and Maintain a Secure Network Architecture",
    description: "Design and maintain a secure network architecture. A secure network architecture must address segmentation, least privilege, and availability, at a minimum. Example implementations may include documentation, policy, and design components",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "design secure network architecture",
      "maintain secure network architecture",
      "must address segmentation, least privilege, and availability at minimum",
      "secure network architecture requirements"
    ],
    coreRequirements: [ // Green - The "what"
      "secure network architecture",
      "segmentation",
      "least privilege (POLP)",
      "availability"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "design",
      "maintain", 
      "secure network architecture",
      "must address",
      "segmentation",
      "least privilege",
      "availability",
      "at a minimum"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure network management and design policy/process",
      "documentation",
      "policy", 
      "design components",
      "network architecture tools"
    ],
    relatedSafeguards: ["3.3", "3.10", "4.2", "12.4", "13.3", "13.4", "13.6", "13.8", "13.9", "13.10"],
    systemPromptFull: {

      role: "network_architecture_security_expert",

      context: "You are evaluating secure network architecture solutions against CIS Control 12.2 requirements for designing and maintaining secure network architecture with segmentation, least privilege, and availability considerations.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_architecture_security_expert",

      context: "You are evaluating secure network architecture solutions against CIS Control 12.2 requirements for designing and maintaining secure network architecture with segmentation, least privilege, and availability considerations.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_architecture_security_expert",

      context: "You are evaluating secure network architecture solutions against CIS Control 12.2 requirements for designing and maintaining secure network architecture with segmentation, least privilege, and availability considerations.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_architecture_security_expert",

      context: "You are evaluating secure network architecture solutions against CIS Control 12.2 requirements for designing and maintaining secure network architecture with segmentation, least privilege, and availability considerations.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_architecture_security_expert",

      context: "You are evaluating secure network architecture solutions against CIS Control 12.2 requirements for designing and maintaining secure network architecture with segmentation, least privilege, and availability considerations.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.3": {
    id: "12.3",
    title: "Securely Manage Network Infrastructure",
    description: "Securely manage network infrastructure. Example implementations include version-controlled-infrastructure-as code, and the use of secure network protocols, such as SSH and HTTPS",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "securely manage network infrastructure",
      "secure network protocols usage",
      "infrastructure security management",
      "secure management practices"
    ],
    coreRequirements: [ // Green - The "what"
      "secure network management",
      "version-controlled infrastructure-as-code", 
      "secure network protocols",
      "infrastructure security"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "securely manage",
      "network infrastructure",
      "version-controlled infrastructure-as-code",
      "use of secure network protocols",
      "SSH",
      "HTTPS"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure network management and design policy/process",
      "network management and monitoring tool",
      "infrastructure-as-code platforms",
      "secure protocol implementations"
    ],
    relatedSafeguards: ["4.2", "12.6"],
    systemPromptFull: {

      role: "network_infrastructure_security_management_expert",

      context: "You are evaluating network infrastructure security management solutions against CIS Control 12.3 requirements for securely managing network infrastructure with version-controlled infrastructure-as-code and secure network protocols like SSH and HTTPS.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_infrastructure_security_management_expert",

      context: "You are evaluating network infrastructure security management solutions against CIS Control 12.3 requirements for securely managing network infrastructure with version-controlled infrastructure-as-code and secure network protocols like SSH and HTTPS.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_infrastructure_security_management_expert",

      context: "You are evaluating network infrastructure security management solutions against CIS Control 12.3 requirements for securely managing network infrastructure with version-controlled infrastructure-as-code and secure network protocols like SSH and HTTPS.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_infrastructure_security_management_expert",

      context: "You are evaluating network infrastructure security management solutions against CIS Control 12.3 requirements for securely managing network infrastructure with version-controlled infrastructure-as-code and secure network protocols like SSH and HTTPS.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_infrastructure_security_management_expert",

      context: "You are evaluating network infrastructure security management solutions against CIS Control 12.3 requirements for securely managing network infrastructure with version-controlled infrastructure-as-code and secure network protocols like SSH and HTTPS.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.4": {
    id: "12.4",
    title: "Establish and Maintain Architecture Diagram(s)",
    description: "Establish and maintain architecture diagram(s) and/or other network system documentation. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG2",
    assetType: ["documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish architecture diagrams",
      "maintain architecture diagrams", 
      "review and update documentation annually",
      "when significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "architecture diagrams",
      "network system documentation",
      "documentation review and updates",
      "enterprise change management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "establish",
      "maintain",
      "architecture diagrams",
      "other network system documentation",
      "review and update documentation",
      "annually",
      "when significant enterprise changes occur"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure network management and design policy/process",
      "network architecture diagramming tool",
      "documentation management systems",
      "architecture visualization tools"
    ],
    relatedSafeguards: ["3.8", "4.2", "12.2"],
    systemPromptFull: {

      role: "network_architecture_documentation_expert",

      context: "You are evaluating network architecture documentation solutions against CIS Control 12.4 requirements for establishing and maintaining architecture diagrams and network system documentation with annual reviews and change management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_architecture_documentation_expert",

      context: "You are evaluating network architecture documentation solutions against CIS Control 12.4 requirements for establishing and maintaining architecture diagrams and network system documentation with annual reviews and change management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_architecture_documentation_expert",

      context: "You are evaluating network architecture documentation solutions against CIS Control 12.4 requirements for establishing and maintaining architecture diagrams and network system documentation with annual reviews and change management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_architecture_documentation_expert",

      context: "You are evaluating network architecture documentation solutions against CIS Control 12.4 requirements for establishing and maintaining architecture diagrams and network system documentation with annual reviews and change management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_architecture_documentation_expert",

      context: "You are evaluating network architecture documentation solutions against CIS Control 12.4 requirements for establishing and maintaining architecture diagrams and network system documentation with annual reviews and change management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.5": {
    id: "12.5",
    title: "Centralize Network Authentication, Authorization, and Auditing (AAA)",
    description: "Centralize network AAA",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "centralize network AAA",
      "network authentication centralization",
      "network authorization centralization", 
      "network auditing centralization"
    ],
    coreRequirements: [ // Green - The "what"
      "network AAA centralization",
      "authentication",
      "authorization",
      "auditing"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "centralize",
      "network AAA",
      "authentication",
      "authorization", 
      "auditing"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure network management and design policy/process",
      "identity and access management tool",
      "AAA servers",
      "centralized authentication systems"
    ],
    relatedSafeguards: ["4.2", "5.6", "6.7", "8.9", "12.6", "12.7"],
    systemPromptFull: {

      role: "network_aaa_centralization_expert",

      context: "You are evaluating network AAA centralization solutions against CIS Control 12.5 requirements for centralizing network authentication, authorization, and auditing (AAA) functions.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_aaa_centralization_expert",

      context: "You are evaluating network AAA centralization solutions against CIS Control 12.5 requirements for centralizing network authentication, authorization, and auditing (AAA) functions.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_aaa_centralization_expert",

      context: "You are evaluating network AAA centralization solutions against CIS Control 12.5 requirements for centralizing network authentication, authorization, and auditing (AAA) functions.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_aaa_centralization_expert",

      context: "You are evaluating network AAA centralization solutions against CIS Control 12.5 requirements for centralizing network authentication, authorization, and auditing (AAA) functions.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_aaa_centralization_expert",

      context: "You are evaluating network AAA centralization solutions against CIS Control 12.5 requirements for centralizing network authentication, authorization, and auditing (AAA) functions.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.6": {
    id: "12.6",
    title: "Use of Secure Network Management and Communication Protocols",
    description: "Use secure network management and communication protocols (e.g., 802.1X, Wi-Fi Protected Access 2 (WPA2) Enterprise or greater)",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use secure network management protocols",
      "use secure communication protocols",
      "secure protocol implementation",
      "enterprise-grade security protocols"
    ],
    coreRequirements: [ // Green - The "what"
      "secure network management",
      "secure communication protocols",
      "802.1X implementation",
      "WPA2 Enterprise or greater"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "use",
      "secure network management",
      "communication protocols",
      "802.1X", 
      "Wi-Fi Protected Access 2 (WPA2) Enterprise",
      "greater"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure network management and design policy/process",
      "802.1X authentication systems",
      "enterprise wireless controllers",
      "secure protocol implementations"
    ],
    relatedSafeguards: ["12.3", "12.5"],
    systemPromptFull: {

      role: "secure_network_protocol_expert",

      context: "You are evaluating secure network management and communication protocol solutions against CIS Control 12.6 requirements for implementing enterprise-grade secure protocols.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "secure_network_protocol_expert",

      context: "You are evaluating secure network management and communication protocol solutions against CIS Control 12.6 requirements for implementing enterprise-grade secure protocols.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "secure_network_protocol_expert",

      context: "You are evaluating secure network management and communication protocol solutions against CIS Control 12.6 requirements for implementing enterprise-grade secure protocols.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "secure_network_protocol_expert",

      context: "You are evaluating secure network management and communication protocol solutions against CIS Control 12.6 requirements for implementing enterprise-grade secure protocols.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "secure_network_protocol_expert",

      context: "You are evaluating secure network management and communication protocol solutions against CIS Control 12.6 requirements for implementing enterprise-grade secure protocols.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.7": {
    id: "12.7",
    title: "Ensure Remote Devices Utilize a VPN and are Connecting to an Enterprise's AAA Infrastructure",
    description: "Require users to authenticate to enterprise-managed VPN and authentication services prior to accessing enterprise resources on end-user devices",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "require users to authenticate to enterprise-managed VPN",
      "authenticate to authentication services",
      "prior to accessing enterprise resources on end-user devices",
      "VPN and AAA integration requirements"
    ],
    coreRequirements: [ // Green - The "what"
      "enterprise-managed VPN",
      "authentication services",
      "user authentication requirements",
      "enterprise resource access control"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "require",
      "users to authenticate",
      "enterprise-managed VPN",
      "authentication services",
      "prior to accessing enterprise resources",
      "end-user devices"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure network management and design policy/process",
      "VPN/encryption tool",
      "enterprise VPN solutions",
      "AAA integration systems"
    ],
    relatedSafeguards: ["6.4", "12.5"],
    systemPromptFull: {

      role: "remote_access_vpn_expert",

      context: "You are evaluating remote access VPN and AAA integration solutions against CIS Control 12.7 requirements for ensuring remote devices utilize enterprise-managed VPN and authentication.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "remote_access_vpn_expert",

      context: "You are evaluating remote access VPN and AAA integration solutions against CIS Control 12.7 requirements for ensuring remote devices utilize enterprise-managed VPN and authentication.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "remote_access_vpn_expert",

      context: "You are evaluating remote access VPN and AAA integration solutions against CIS Control 12.7 requirements for ensuring remote devices utilize enterprise-managed VPN and authentication.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "remote_access_vpn_expert",

      context: "You are evaluating remote access VPN and AAA integration solutions against CIS Control 12.7 requirements for ensuring remote devices utilize enterprise-managed VPN and authentication.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "remote_access_vpn_expert",

      context: "You are evaluating remote access VPN and AAA integration solutions against CIS Control 12.7 requirements for ensuring remote devices utilize enterprise-managed VPN and authentication.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "12.8": {
    id: "12.8",
    title: "Establish and Maintain Dedicated Computing Resources for All Administrative Work",
    description: "Establish and maintain dedicated computing resources, either physically or logically separated, for all administrative tasks or tasks requiring administrative access. The computing resources should be segmented from the enterprise's primary network and not be allowed internet access",
    implementationGroup: "IG3",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "establish dedicated computing resources for administrative work",
      "maintain dedicated computing resources",
      "segmented from enterprise's primary network",
      "not allowed internet access"
    ],
    coreRequirements: [ // Green - The "what"
      "dedicated computing resources (SAW)",
      "administrative tasks isolation", 
      "administrative access separation",
      "network segmentation from primary network"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "establish",
      "maintain",
      "dedicated computing resources",
      "physically or logically separated",
      "all administrative tasks",
      "tasks requiring administrative access",
      "segmented from primary network",
      "no internet access"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure network management and design policy/process",
      "secure admin workstations (SAW)",
      "network segmentation tools",
      "administrative isolation systems"
    ],
    relatedSafeguards: ["1.1", "5.1"],
    systemPromptFull: {

      role: "secure_admin_workstation_expert",

      context: "You are evaluating secure administrative workstation (SAW) solutions against CIS Control 12.8 requirements for establishing dedicated computing resources for administrative work.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "secure_admin_workstation_expert",

      context: "You are evaluating secure administrative workstation (SAW) solutions against CIS Control 12.8 requirements for establishing dedicated computing resources for administrative work.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "secure_admin_workstation_expert",

      context: "You are evaluating secure administrative workstation (SAW) solutions against CIS Control 12.8 requirements for establishing dedicated computing resources for administrative work.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "secure_admin_workstation_expert",

      context: "You are evaluating secure administrative workstation (SAW) solutions against CIS Control 12.8 requirements for establishing dedicated computing resources for administrative work.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "secure_admin_workstation_expert",

      context: "You are evaluating secure administrative workstation (SAW) solutions against CIS Control 12.8 requirements for establishing dedicated computing resources for administrative work.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.1": {
    id: "13.1",
    title: "Centralize Security Event Alerting",
    description: "Centralize security event alerting across enterprise assets for log correlation and analysis. Security event alerting includes, at a minimum, active exploitation attempts of enterprise assets",
    implementationGroup: "IG2",
    assetType: ["network", "devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "centralize security event alerting across enterprise assets",
      "log correlation and analysis",
      "active exploitation attempts monitoring"
    ],
    coreRequirements: [ // Green - The "what"
      "centralized security event alerting",
      "log correlation capabilities", 
      "analysis of security events",
      "active exploitation attempt detection"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "centralize security event alerting",
      "across enterprise assets",
      "for log correlation",
      "for analysis",
      "active exploitation attempts",
      "of enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security information and event management (SIEM)",
      "security orchestration, automation and response (SOAR)",
      "log aggregation platforms",
      "event correlation engines"
    ],
    relatedSafeguards: ["8.1", "8.2", "8.11", "13.2", "13.3", "13.11"],
    systemPromptFull: {

      role: "security_event_alerting_expert",

      context: "You are evaluating security event alerting and correlation solutions against CIS Control 13.1 requirements for centralizing security event alerting across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "security_event_alerting_expert",

      context: "You are evaluating security event alerting and correlation solutions against CIS Control 13.1 requirements for centralizing security event alerting across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "security_event_alerting_expert",

      context: "You are evaluating security event alerting and correlation solutions against CIS Control 13.1 requirements for centralizing security event alerting across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "security_event_alerting_expert",

      context: "You are evaluating security event alerting and correlation solutions against CIS Control 13.1 requirements for centralizing security event alerting across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "security_event_alerting_expert",

      context: "You are evaluating security event alerting and correlation solutions against CIS Control 13.1 requirements for centralizing security event alerting across enterprise assets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.2": {
    id: "13.2", 
    title: "Deploy a Host-Based Intrusion Detection Solution",
    description: "Deploy a host-based intrusion detection solution on enterprise assets, where technically feasible",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "deploy host-based intrusion detection solution",
      "on enterprise assets",
      "where technically feasible"
    ],
    coreRequirements: [ // Green - The "what"
      "host-based intrusion detection solution",
      "deployment on enterprise assets",
      "technical feasibility assessment"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "deploy",
      "host-based intrusion detection solution",
      "on enterprise assets", 
      "where technically feasible"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "host-based intrusion detection systems (HIDS)",
      "endpoint detection and response (EDR)",
      "host-based security monitoring",
      "behavioral analysis tools"
    ],
    relatedSafeguards: ["1.1", "13.1", "13.3", "13.7"],
    systemPromptFull: {

      role: "host_intrusion_detection_expert",

      context: "You are evaluating host-based intrusion detection solutions against CIS Control 13.2 requirements for deploying HIDS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "host_intrusion_detection_expert",

      context: "You are evaluating host-based intrusion detection solutions against CIS Control 13.2 requirements for deploying HIDS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "host_intrusion_detection_expert",

      context: "You are evaluating host-based intrusion detection solutions against CIS Control 13.2 requirements for deploying HIDS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "host_intrusion_detection_expert",

      context: "You are evaluating host-based intrusion detection solutions against CIS Control 13.2 requirements for deploying HIDS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "host_intrusion_detection_expert",

      context: "You are evaluating host-based intrusion detection solutions against CIS Control 13.2 requirements for deploying HIDS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.3": {
    id: "13.3",
    title: "Deploy a Network Intrusion Detection Solution", 
    description: "Deploy a network intrusion detection solution with ruleset tuned for threats facing the enterprise's industry sector",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "deploy network intrusion detection solution",
      "ruleset tuned for threats facing enterprise's industry sector"
    ],
    coreRequirements: [ // Green - The "what"
      "network intrusion detection solution",
      "threat-tuned rulesets",
      "industry-specific threat focus"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "deploy",
      "network intrusion detection solution", 
      "with ruleset tuned",
      "for threats facing",
      "the enterprise's industry sector"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network intrusion detection systems (NIDS)",
      "network security monitoring",
      "threat intelligence integration",
      "industry-specific threat feeds"
    ],
    relatedSafeguards: ["13.1", "13.2", "13.8"],
    systemPromptFull: {

      role: "network_intrusion_detection_expert",

      context: "You are evaluating network intrusion detection solutions against CIS Control 13.3 requirements for deploying NIDS with industry-specific threat-tuned rulesets.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_intrusion_detection_expert",

      context: "You are evaluating network intrusion detection solutions against CIS Control 13.3 requirements for deploying NIDS with industry-specific threat-tuned rulesets.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_intrusion_detection_expert",

      context: "You are evaluating network intrusion detection solutions against CIS Control 13.3 requirements for deploying NIDS with industry-specific threat-tuned rulesets.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_intrusion_detection_expert",

      context: "You are evaluating network intrusion detection solutions against CIS Control 13.3 requirements for deploying NIDS with industry-specific threat-tuned rulesets.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_intrusion_detection_expert",

      context: "You are evaluating network intrusion detection solutions against CIS Control 13.3 requirements for deploying NIDS with industry-specific threat-tuned rulesets.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.4": {
    id: "13.4",
    title: "Perform Traffic Filtering Between Network Segments",
    description: "Perform traffic filtering between network segments, where technically feasible",
    implementationGroup: "IG2", 
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "perform traffic filtering between network segments",
      "where technically feasible"
    ],
    coreRequirements: [ // Green - The "what"
      "traffic filtering between network segments",
      "network segmentation controls",
      "technical feasibility assessment"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "perform traffic filtering",
      "between network segments",
      "where technically feasible"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network firewalls",
      "micro-segmentation",
      "network access control",
      "software-defined perimeter"
    ],
    relatedSafeguards: ["12.2", "12.3", "13.9"],
    systemPromptFull: {

      role: "network_traffic_filtering_expert",

      context: "You are evaluating network traffic filtering solutions against CIS Control 13.4 requirements for performing traffic filtering between network segments where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_traffic_filtering_expert",

      context: "You are evaluating network traffic filtering solutions against CIS Control 13.4 requirements for performing traffic filtering between network segments where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_traffic_filtering_expert",

      context: "You are evaluating network traffic filtering solutions against CIS Control 13.4 requirements for performing traffic filtering between network segments where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_traffic_filtering_expert",

      context: "You are evaluating network traffic filtering solutions against CIS Control 13.4 requirements for performing traffic filtering between network segments where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_traffic_filtering_expert",

      context: "You are evaluating network traffic filtering solutions against CIS Control 13.4 requirements for performing traffic filtering between network segments where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.5": {
    id: "13.5",
    title: "Manage Access Control for Remote Assets",
    description: "Manage access control for assets remotely connecting to enterprise networks. Determine amount of access to the enterprise network based on: up-to-date anti-malware software, up-to date system patches, up-to-date host-based firewall, and up-to-date host-based intrusion detection or intrusion prevention system",
    implementationGroup: "IG2",
    assetType: ["devices", "network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "manage access control for assets remotely connecting to enterprise networks",
      "determine amount of access based on security posture"
    ],
    coreRequirements: [ // Green - The "what"
      "access control for remote assets",
      "remote connection management",
      "security posture-based access"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "manage access control",
      "for assets remotely connecting", 
      "to enterprise networks",
      "determine amount of access",
      "up-to-date anti-malware software",
      "up-to-date system patches",
      "up-to-date host-based firewall", 
      "up-to-date host-based intrusion detection or prevention"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network access control (NAC)",
      "zero trust network access",
      "device compliance checking",
      "posture assessment tools"
    ],
    relatedSafeguards: ["6.1", "10.1", "10.7", "12.1", "13.2"],
    systemPromptFull: {

      role: "remote_access_control_expert",

      context: "You are evaluating remote access control solutions against CIS Control 13.5 requirements for managing access control for assets remotely connecting to enterprise networks based on security posture.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "remote_access_control_expert",

      context: "You are evaluating remote access control solutions against CIS Control 13.5 requirements for managing access control for assets remotely connecting to enterprise networks based on security posture.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "remote_access_control_expert",

      context: "You are evaluating remote access control solutions against CIS Control 13.5 requirements for managing access control for assets remotely connecting to enterprise networks based on security posture.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "remote_access_control_expert",

      context: "You are evaluating remote access control solutions against CIS Control 13.5 requirements for managing access control for assets remotely connecting to enterprise networks based on security posture.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "remote_access_control_expert",

      context: "You are evaluating remote access control solutions against CIS Control 13.5 requirements for managing access control for assets remotely connecting to enterprise networks based on security posture.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.6": {
    id: "13.6",
    title: "Collect Network Traffic Flow Logs",
    description: "Collect network traffic flow logs and/or network traffic to review and alert upon",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "collect network traffic flow logs and/or network traffic",
      "to review and alert upon"
    ],
    coreRequirements: [ // Green - The "what"
      "network traffic flow log collection",
      "network traffic monitoring",
      "review and alerting capabilities"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "collect network traffic flow logs",
      "collect network traffic",
      "to review",
      "to alert upon"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network flow analyzers",
      "packet capture systems",
      "network monitoring tools",
      "traffic analysis platforms"
    ],
    relatedSafeguards: ["8.5", "13.1", "13.3"],
    systemPromptFull: {

      role: "network_traffic_monitoring_expert",

      context: "You are evaluating network traffic flow monitoring solutions against CIS Control 13.6 requirements for collecting network traffic flow logs and traffic for review and alerting.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_traffic_monitoring_expert",

      context: "You are evaluating network traffic flow monitoring solutions against CIS Control 13.6 requirements for collecting network traffic flow logs and traffic for review and alerting.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_traffic_monitoring_expert",

      context: "You are evaluating network traffic flow monitoring solutions against CIS Control 13.6 requirements for collecting network traffic flow logs and traffic for review and alerting.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_traffic_monitoring_expert",

      context: "You are evaluating network traffic flow monitoring solutions against CIS Control 13.6 requirements for collecting network traffic flow logs and traffic for review and alerting.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_traffic_monitoring_expert",

      context: "You are evaluating network traffic flow monitoring solutions against CIS Control 13.6 requirements for collecting network traffic flow logs and traffic for review and alerting.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.7": {
    id: "13.7",
    title: "Deploy a Host-Based Intrusion Prevention Solution",
    description: "Deploy a host-based intrusion prevention solution on enterprise assets, where technically feasible",
    implementationGroup: "IG3",
    assetType: ["devices"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "deploy host-based intrusion prevention solution",
      "on enterprise assets",
      "where technically feasible"
    ],
    coreRequirements: [ // Green - The "what"
      "host-based intrusion prevention solution",
      "deployment on enterprise assets",
      "technical feasibility assessment"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "deploy",
      "host-based intrusion prevention solution",
      "on enterprise assets",
      "where technically feasible"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "host-based intrusion prevention systems (HIPS)",
      "endpoint protection platforms",
      "behavioral blocking systems",
      "automated threat response"
    ],
    relatedSafeguards: ["13.2", "13.8"],
    systemPromptFull: {

      role: "host_intrusion_prevention_expert",

      context: "You are evaluating host-based intrusion prevention solutions against CIS Control 13.7 requirements for deploying HIPS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "host_intrusion_prevention_expert",

      context: "You are evaluating host-based intrusion prevention solutions against CIS Control 13.7 requirements for deploying HIPS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "host_intrusion_prevention_expert",

      context: "You are evaluating host-based intrusion prevention solutions against CIS Control 13.7 requirements for deploying HIPS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "host_intrusion_prevention_expert",

      context: "You are evaluating host-based intrusion prevention solutions against CIS Control 13.7 requirements for deploying HIPS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "host_intrusion_prevention_expert",

      context: "You are evaluating host-based intrusion prevention solutions against CIS Control 13.7 requirements for deploying HIPS on enterprise assets where technically feasible.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.8": {
    id: "13.8",
    title: "Deploy a Network Intrusion Prevention Solution",
    description: "Deploy a network intrusion prevention solution to block malicious network traffic in real-time",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "deploy network intrusion prevention solution",
      "to block malicious network traffic in real-time"
    ],
    coreRequirements: [ // Green - The "what"
      "network intrusion prevention solution",
      "malicious traffic blocking",
      "real-time response capabilities"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "deploy",
      "network intrusion prevention solution",
      "to block malicious network traffic",
      "in real-time"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network intrusion prevention systems (NIPS)",
      "inline security appliances",
      "automated blocking systems",
      "real-time threat mitigation"
    ],
    relatedSafeguards: ["13.3", "13.7"],
    systemPromptFull: {

      role: "network_intrusion_prevention_expert",

      context: "You are evaluating network intrusion prevention solutions against CIS Control 13.8 requirements for deploying NIPS to block malicious network traffic in real-time.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_intrusion_prevention_expert",

      context: "You are evaluating network intrusion prevention solutions against CIS Control 13.8 requirements for deploying NIPS to block malicious network traffic in real-time.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_intrusion_prevention_expert",

      context: "You are evaluating network intrusion prevention solutions against CIS Control 13.8 requirements for deploying NIPS to block malicious network traffic in real-time.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_intrusion_prevention_expert",

      context: "You are evaluating network intrusion prevention solutions against CIS Control 13.8 requirements for deploying NIPS to block malicious network traffic in real-time.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_intrusion_prevention_expert",

      context: "You are evaluating network intrusion prevention solutions against CIS Control 13.8 requirements for deploying NIPS to block malicious network traffic in real-time.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.9": {
    id: "13.9",
    title: "Deploy Port-Level Access Control",
    description: "Deploy port-level access control. Port-level access control utilizes 802.1x, or similar network access control protocols, such as certificates",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "deploy port-level access control",
      "utilizes 802.1x or similar network access control protocols"
    ],
    coreRequirements: [ // Green - The "what"
      "port-level access control",
      "802.1x implementation",
      "network access control protocols"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "deploy port-level access control",
      "utilizes 802.1x",
      "similar network access control protocols",
      "such as certificates"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "802.1x authentication",
      "network access control systems",
      "certificate-based authentication",
      "port-based network access control"
    ],
    relatedSafeguards: ["12.7", "13.4"],
    systemPromptFull: {

      role: "port_access_control_expert",

      context: "You are evaluating port-level access control solutions against CIS Control 13.9 requirements for deploying 802.1x or similar network access control protocols for port-level access control.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "port_access_control_expert",

      context: "You are evaluating port-level access control solutions against CIS Control 13.9 requirements for deploying 802.1x or similar network access control protocols for port-level access control.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "port_access_control_expert",

      context: "You are evaluating port-level access control solutions against CIS Control 13.9 requirements for deploying 802.1x or similar network access control protocols for port-level access control.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "port_access_control_expert",

      context: "You are evaluating port-level access control solutions against CIS Control 13.9 requirements for deploying 802.1x or similar network access control protocols for port-level access control.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "port_access_control_expert",

      context: "You are evaluating port-level access control solutions against CIS Control 13.9 requirements for deploying 802.1x or similar network access control protocols for port-level access control.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.10": {
    id: "13.10",
    title: "Perform Application Layer Filtering",
    description: "Perform application layer filtering to protect against the enterprise's most common network-based attacks",
    implementationGroup: "IG3",
    assetType: ["network", "applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "perform application layer filtering",
      "to protect against enterprise's most common network-based attacks"
    ],
    coreRequirements: [ // Green - The "what"
      "application layer filtering",
      "protection against common network-based attacks",
      "enterprise-specific threat focus"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "perform application layer filtering",
      "to protect against",
      "the enterprise's most common",
      "network-based attacks"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "web application firewalls",
      "application layer gateways",
      "deep packet inspection",
      "application-aware filtering"
    ],
    relatedSafeguards: ["13.4", "16.11"],
    systemPromptFull: {

      role: "application_layer_filtering_expert",

      context: "You are evaluating application layer filtering solutions against CIS Control 13.10 requirements for performing application layer filtering to protect against enterprise's most common network-based attacks.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "application_layer_filtering_expert",

      context: "You are evaluating application layer filtering solutions against CIS Control 13.10 requirements for performing application layer filtering to protect against enterprise's most common network-based attacks.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "application_layer_filtering_expert",

      context: "You are evaluating application layer filtering solutions against CIS Control 13.10 requirements for performing application layer filtering to protect against enterprise's most common network-based attacks.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "application_layer_filtering_expert",

      context: "You are evaluating application layer filtering solutions against CIS Control 13.10 requirements for performing application layer filtering to protect against enterprise's most common network-based attacks.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "application_layer_filtering_expert",

      context: "You are evaluating application layer filtering solutions against CIS Control 13.10 requirements for performing application layer filtering to protect against enterprise's most common network-based attacks.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "13.11": {
    id: "13.11",
    title: "Tune Security Event Alerting Thresholds",
    description: "Tune security event alerting thresholds monthly, or more frequently",
    implementationGroup: "IG3",
    assetType: ["network", "devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "tune security event alerting thresholds",
      "monthly or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "security event alerting threshold tuning",
      "monthly tuning frequency",
      "threshold optimization"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "tune security event alerting thresholds",
      "monthly",
      "or more frequently"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "SIEM tuning processes",
      "threshold optimization tools",
      "alert management platforms",
      "false positive reduction"
    ],
    relatedSafeguards: ["13.1", "8.11"],
    systemPromptFull: {

      role: "security_alert_tuning_expert",

      context: "You are evaluating security event alerting threshold tuning solutions against CIS Control 13.11 requirements for tuning security event alerting thresholds monthly or more frequently.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "security_alert_tuning_expert",

      context: "You are evaluating security event alerting threshold tuning solutions against CIS Control 13.11 requirements for tuning security event alerting thresholds monthly or more frequently.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "security_alert_tuning_expert",

      context: "You are evaluating security event alerting threshold tuning solutions against CIS Control 13.11 requirements for tuning security event alerting thresholds monthly or more frequently.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "security_alert_tuning_expert",

      context: "You are evaluating security event alerting threshold tuning solutions against CIS Control 13.11 requirements for tuning security event alerting thresholds monthly or more frequently.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "security_alert_tuning_expert",

      context: "You are evaluating security event alerting threshold tuning solutions against CIS Control 13.11 requirements for tuning security event alerting thresholds monthly or more frequently.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.1": {
    id: "14.1",
    title: "Establish and Maintain a Security Awareness Program",
    description: "Establish and maintain a security awareness program. The purpose of a security awareness program is to educate the enterprise's workforce on how to interact with enterprise assets and data in a secure manner. Conduct training at hire and, at a minimum, annually. Review and update content annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a security awareness program",
      "conduct training at hire and at a minimum annually",
      "review and update content annually or when significant enterprise changes occur"
    ],
    coreRequirements: [ // Green - The "what"
      "security awareness program establishment",
      "workforce education on secure interaction",
      "enterprise assets and data security training",
      "training frequency requirements"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "establish security awareness program",
      "maintain security awareness program",
      "educate enterprise workforce",
      "how to interact with enterprise assets",
      "how to interact with data in secure manner",
      "conduct training at hire",
      "conduct training minimum annually",
      "review and update content annually",
      "when significant enterprise changes occur"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "security training and awareness policy/process",
      "training documentation systems",
      "learning management systems"
    ],
    relatedSafeguards: ["14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8", "14.9"],
    systemPromptFull: {

      role: "security_awareness_program_expert",

      context: "You are evaluating security awareness program solutions against CIS Control 14.1 requirements for establishing and maintaining comprehensive security awareness programs with annual training and content updates.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "security_awareness_program_expert",

      context: "You are evaluating security awareness program solutions against CIS Control 14.1 requirements for establishing and maintaining comprehensive security awareness programs with annual training and content updates.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "security_awareness_program_expert",

      context: "You are evaluating security awareness program solutions against CIS Control 14.1 requirements for establishing and maintaining comprehensive security awareness programs with annual training and content updates.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "security_awareness_program_expert",

      context: "You are evaluating security awareness program solutions against CIS Control 14.1 requirements for establishing and maintaining comprehensive security awareness programs with annual training and content updates.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "security_awareness_program_expert",

      context: "You are evaluating security awareness program solutions against CIS Control 14.1 requirements for establishing and maintaining comprehensive security awareness programs with annual training and content updates.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.2": {
    id: "14.2",
    title: "Train Workforce Members to Recognize Social Engineering Attacks",
    description: "Train workforce members to recognize social engineering attacks, such as phishing, business email compromise (BEC), pretexting, and tailgating",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "train workforce members to recognize social engineering attacks",
      "such as phishing, business email compromise, pretexting, and tailgating"
    ],
    coreRequirements: [ // Green - The "what"
      "workforce training on social engineering recognition",
      "phishing attack awareness",
      "business email compromise awareness",
      "pretexting attack awareness",
      "tailgating attack awareness"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "train workforce members",
      "to recognize social engineering attacks",
      "such as phishing",
      "such as business email compromise (BEC)",
      "such as pretexting",
      "such as tailgating"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "phishing simulation platforms",
      "social engineering awareness training",
      "security awareness modules"
    ],
    relatedSafeguards: ["14.1"],
    systemPromptFull: {

      role: "social_engineering_awareness_expert",

      context: "You are evaluating social engineering awareness training solutions against CIS Control 14.2 requirements for training workforce members to recognize various social engineering attacks.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "social_engineering_awareness_expert",

      context: "You are evaluating social engineering awareness training solutions against CIS Control 14.2 requirements for training workforce members to recognize various social engineering attacks.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "social_engineering_awareness_expert",

      context: "You are evaluating social engineering awareness training solutions against CIS Control 14.2 requirements for training workforce members to recognize various social engineering attacks.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "social_engineering_awareness_expert",

      context: "You are evaluating social engineering awareness training solutions against CIS Control 14.2 requirements for training workforce members to recognize various social engineering attacks.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "social_engineering_awareness_expert",

      context: "You are evaluating social engineering awareness training solutions against CIS Control 14.2 requirements for training workforce members to recognize various social engineering attacks.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.3": {
    id: "14.3",
    title: "Train Workforce Members on Authentication Best Practices",
    description: "Train workforce members on authentication best practices. Example topics include MFA, password composition, and credential management",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "train workforce members on authentication best practices",
      "example topics include MFA, password composition, and credential management"
    ],
    coreRequirements: [ // Green - The "what"
      "authentication best practices training",
      "MFA training",
      "password composition training",
      "credential management training"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "train workforce members",
      "on authentication best practices",
      "example topics include MFA",
      "example topics include password composition",
      "example topics include credential management"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "authentication training modules",
      "password security training",
      "MFA awareness programs"
    ],
    relatedSafeguards: ["14.1", "6.2", "6.3"],
    systemPromptFull: {

      role: "authentication_training_expert",

      context: "You are evaluating authentication best practices training solutions against CIS Control 14.3 requirements for training workforce members on MFA, password composition, and credential management.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "authentication_training_expert",

      context: "You are evaluating authentication best practices training solutions against CIS Control 14.3 requirements for training workforce members on MFA, password composition, and credential management.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "authentication_training_expert",

      context: "You are evaluating authentication best practices training solutions against CIS Control 14.3 requirements for training workforce members on MFA, password composition, and credential management.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "authentication_training_expert",

      context: "You are evaluating authentication best practices training solutions against CIS Control 14.3 requirements for training workforce members on MFA, password composition, and credential management.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "authentication_training_expert",

      context: "You are evaluating authentication best practices training solutions against CIS Control 14.3 requirements for training workforce members on MFA, password composition, and credential management.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.4": {
    id: "14.4",
    title: "Train Workforce on Data Handling Best Practices",
    description: "Train workforce members on how to identify and properly store, transfer, archive, and destroy sensitive data. This also includes training workforce members on clear screen and desk best practices, such as locking their screen when they step away from their enterprise asset, erasing physical and virtual whiteboards at the end of meetings, and storing data and assets securely",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "train workforce members on how to identify and properly store, transfer, archive, and destroy sensitive data",
      "training on clear screen and desk best practices",
      "such as locking screen when stepping away, erasing whiteboards, storing data securely"
    ],
    coreRequirements: [ // Green - The "what"
      "data handling best practices training",
      "sensitive data identification training",
      "secure data storage, transfer, archive, destroy procedures",
      "clear screen and desk policies"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "train workforce members on how to",
      "identify sensitive data",
      "properly store sensitive data",
      "properly transfer sensitive data",
      "properly archive sensitive data",
      "properly destroy sensitive data",
      "clear screen best practices",
      "clear desk best practices",
      "locking screen when stepping away",
      "erasing physical whiteboards at end of meetings",
      "erasing virtual whiteboards at end of meetings",
      "storing data and assets securely"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "data handling training modules",
      "clean desk policy training",
      "data classification training"
    ],
    relatedSafeguards: ["14.1", "3.1", "3.2"],
    systemPromptFull: {

      role: "data_handling_training_expert",

      context: "You are evaluating data handling best practices training solutions against CIS Control 14.4 requirements for training workforce on sensitive data identification, storage, transfer, archival, destruction, and clear screen/desk practices.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_handling_training_expert",

      context: "You are evaluating data handling best practices training solutions against CIS Control 14.4 requirements for training workforce on sensitive data identification, storage, transfer, archival, destruction, and clear screen/desk practices.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_handling_training_expert",

      context: "You are evaluating data handling best practices training solutions against CIS Control 14.4 requirements for training workforce on sensitive data identification, storage, transfer, archival, destruction, and clear screen/desk practices.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_handling_training_expert",

      context: "You are evaluating data handling best practices training solutions against CIS Control 14.4 requirements for training workforce on sensitive data identification, storage, transfer, archival, destruction, and clear screen/desk practices.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_handling_training_expert",

      context: "You are evaluating data handling best practices training solutions against CIS Control 14.4 requirements for training workforce on sensitive data identification, storage, transfer, archival, destruction, and clear screen/desk practices.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.5": {
    id: "14.5",
    title: "Train Workforce Members on Causes of Unintentional Data Exposure",
    description: "Train workforce members to be aware of causes for unintentional data exposure. Example topics include mis-delivery of sensitive data, losing a portable end-user device, or publishing data to unintended audiences",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "train workforce members to be aware of causes for unintentional data exposure",
      "example topics include mis-delivery, losing portable devices, publishing to unintended audiences"
    ],
    coreRequirements: [ // Green - The "what"
      "unintentional data exposure awareness training",
      "mis-delivery prevention training",
      "portable device security awareness",
      "data publication controls training"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "train workforce members",
      "to be aware of causes for unintentional data exposure",
      "example topics include mis-delivery of sensitive data",
      "example topics include losing a portable end-user device",
      "example topics include publishing data to unintended audiences"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "data loss prevention training",
      "device security awareness training",
      "data sharing awareness programs"
    ],
    relatedSafeguards: ["14.1", "3.3"],
    systemPromptFull: {

      role: "data_exposure_awareness_expert",

      context: "You are evaluating unintentional data exposure awareness training solutions against CIS Control 14.5 requirements for training workforce on causes and prevention of unintentional data exposure.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "data_exposure_awareness_expert",

      context: "You are evaluating unintentional data exposure awareness training solutions against CIS Control 14.5 requirements for training workforce on causes and prevention of unintentional data exposure.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "data_exposure_awareness_expert",

      context: "You are evaluating unintentional data exposure awareness training solutions against CIS Control 14.5 requirements for training workforce on causes and prevention of unintentional data exposure.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "data_exposure_awareness_expert",

      context: "You are evaluating unintentional data exposure awareness training solutions against CIS Control 14.5 requirements for training workforce on causes and prevention of unintentional data exposure.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "data_exposure_awareness_expert",

      context: "You are evaluating unintentional data exposure awareness training solutions against CIS Control 14.5 requirements for training workforce on causes and prevention of unintentional data exposure.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.6": {
    id: "14.6",
    title: "Train Workforce Members on Recognizing and Reporting Security Incidents",
    description: "Train workforce members to be able to recognize a potential incident and be able to report such an incident",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "train workforce members to be able to recognize a potential incident",
      "train workforce members to be able to report such an incident"
    ],
    coreRequirements: [ // Green - The "what"
      "security incident recognition training",
      "incident reporting training",
      "potential incident identification",
      "incident reporting procedures"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "train workforce members",
      "to be able to recognize a potential incident",
      "to be able to report such an incident"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "incident response training",
      "security incident awareness programs",
      "incident reporting tools"
    ],
    relatedSafeguards: ["14.1", "17.3"],
    systemPromptFull: {

      role: "incident_recognition_training_expert",

      context: "You are evaluating security incident recognition and reporting training solutions against CIS Control 14.6 requirements for training workforce to recognize potential incidents and report them.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_recognition_training_expert",

      context: "You are evaluating security incident recognition and reporting training solutions against CIS Control 14.6 requirements for training workforce to recognize potential incidents and report them.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_recognition_training_expert",

      context: "You are evaluating security incident recognition and reporting training solutions against CIS Control 14.6 requirements for training workforce to recognize potential incidents and report them.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_recognition_training_expert",

      context: "You are evaluating security incident recognition and reporting training solutions against CIS Control 14.6 requirements for training workforce to recognize potential incidents and report them.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_recognition_training_expert",

      context: "You are evaluating security incident recognition and reporting training solutions against CIS Control 14.6 requirements for training workforce to recognize potential incidents and report them.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.7": {
    id: "14.7",
    title: "Train Workforce on How to Identify and Report if Their Enterprise Assets are Missing Security Updates",
    description: "Train workforce to understand how to verify and report out-of-date software patches or any failures in automated processes and tools. Part of this training should include notifying IT personnel of any failures in automated processes and tools",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "train workforce to understand how to verify and report out-of-date software patches",
      "train on reporting failures in automated processes and tools",
      "include notifying IT personnel of any failures in automated processes and tools"
    ],
    coreRequirements: [ // Green - The "what"
      "security update verification training",
      "out-of-date software patch identification",
      "automated process failure reporting",
      "IT personnel notification procedures"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "train workforce to understand how to",
      "verify out-of-date software patches",
      "report out-of-date software patches",
      "report any failures in automated processes",
      "report any failures in automated tools",
      "training should include notifying IT personnel",
      "of any failures in automated processes",
      "of any failures in automated tools"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "patch management awareness training",
      "IT support reporting procedures",
      "automated system monitoring training"
    ],
    relatedSafeguards: ["14.1", "7.3", "7.4"],
    systemPromptFull: {

      role: "security_update_awareness_expert",

      context: "You are evaluating security update awareness training solutions against CIS Control 14.7 requirements for training workforce to identify and report missing security updates and automated process failures.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "security_update_awareness_expert",

      context: "You are evaluating security update awareness training solutions against CIS Control 14.7 requirements for training workforce to identify and report missing security updates and automated process failures.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "security_update_awareness_expert",

      context: "You are evaluating security update awareness training solutions against CIS Control 14.7 requirements for training workforce to identify and report missing security updates and automated process failures.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "security_update_awareness_expert",

      context: "You are evaluating security update awareness training solutions against CIS Control 14.7 requirements for training workforce to identify and report missing security updates and automated process failures.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "security_update_awareness_expert",

      context: "You are evaluating security update awareness training solutions against CIS Control 14.7 requirements for training workforce to identify and report missing security updates and automated process failures.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.8": {
    id: "14.8",
    title: "Train Workforce on the Dangers of Connecting to and Transmitting Enterprise Data Over Insecure Networks",
    description: "Train workforce members on the dangers of connecting to, and transmitting data over, insecure networks for enterprise activities. If the enterprise has remote workers, training must include guidance to ensure that all users securely configure their home network infrastructure",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "train workforce members on dangers of connecting to and transmitting data over insecure networks",
      "if enterprise has remote workers, training must include guidance for secure home network configuration"
    ],
    coreRequirements: [ // Green - The "what"
      "insecure network dangers training",
      "secure connection practices",
      "enterprise data transmission security",
      "remote worker home network security"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "train workforce members on the dangers of",
      "connecting to insecure networks",
      "transmitting data over insecure networks",
      "for enterprise activities",
      "if enterprise has remote workers",
      "training must include guidance",
      "to ensure all users securely configure",
      "their home network infrastructure"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "network security awareness training",
      "remote work security training",
      "home network configuration guides"
    ],
    relatedSafeguards: ["14.1", "12.1"],
    systemPromptFull: {

      role: "network_security_awareness_expert",

      context: "You are evaluating network security awareness training solutions against CIS Control 14.8 requirements for training workforce on dangers of insecure networks and remote work security including home network configuration.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "network_security_awareness_expert",

      context: "You are evaluating network security awareness training solutions against CIS Control 14.8 requirements for training workforce on dangers of insecure networks and remote work security including home network configuration.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "network_security_awareness_expert",

      context: "You are evaluating network security awareness training solutions against CIS Control 14.8 requirements for training workforce on dangers of insecure networks and remote work security including home network configuration.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "network_security_awareness_expert",

      context: "You are evaluating network security awareness training solutions against CIS Control 14.8 requirements for training workforce on dangers of insecure networks and remote work security including home network configuration.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "network_security_awareness_expert",

      context: "You are evaluating network security awareness training solutions against CIS Control 14.8 requirements for training workforce on dangers of insecure networks and remote work security including home network configuration.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "14.9": {
    id: "14.9",
    title: "Conduct Role-Specific Security Awareness and Skills Training",
    description: "Conduct role-specific security awareness and skills training. Example implementations include secure system administration courses for IT professionals, OWASP Top 10 vulnerability awareness and prevention training for web application developers, and advanced social engineering awareness training for high-profile roles",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "conduct role-specific security awareness and skills training",
      "example implementations include secure system administration courses, OWASP Top 10 training, and advanced social engineering training"
    ],
    coreRequirements: [ // Green - The "what"
      "role-specific security awareness training",
      "role-specific skills training",
      "IT professional system administration courses",
      "developer OWASP Top 10 training",
      "high-profile role advanced social engineering training"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "conduct role-specific security awareness training",
      "conduct role-specific skills training",
      "secure system administration courses for IT professionals",
      "OWASP Top 10 vulnerability awareness and prevention training for web application developers",
      "advanced social engineering awareness training for high-profile roles"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "role-based training programs",
      "specialized security courses",
      "professional development programs"
    ],
    relatedSafeguards: ["14.1", "16.9"],
    systemPromptFull: {

      role: "role_specific_training_expert",

      context: "You are evaluating role-specific security awareness and skills training solutions against CIS Control 14.9 requirements for conducting specialized training including secure system administration, OWASP Top 10, and advanced social engineering awareness.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "role_specific_training_expert",

      context: "You are evaluating role-specific security awareness and skills training solutions against CIS Control 14.9 requirements for conducting specialized training including secure system administration, OWASP Top 10, and advanced social engineering awareness.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "role_specific_training_expert",

      context: "You are evaluating role-specific security awareness and skills training solutions against CIS Control 14.9 requirements for conducting specialized training including secure system administration, OWASP Top 10, and advanced social engineering awareness.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "role_specific_training_expert",

      context: "You are evaluating role-specific security awareness and skills training solutions against CIS Control 14.9 requirements for conducting specialized training including secure system administration, OWASP Top 10, and advanced social engineering awareness.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "role_specific_training_expert",

      context: "You are evaluating role-specific security awareness and skills training solutions against CIS Control 14.9 requirements for conducting specialized training including secure system administration, OWASP Top 10, and advanced social engineering awareness.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "15.1": {
    id: "15.1",
    title: "Establish and Maintain an Inventory of Service Providers",
    description: "Establish and maintain an inventory of service providers. The inventory is to list all known service providers, include classification(s), and designate an enterprise contact for each service provider. Review and update the inventory annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain an inventory of service providers",
      "list all known service providers, include classifications, designate enterprise contact",
      "review and update inventory annually or when significant enterprise changes occur"
    ],
    coreRequirements: [ // Green - The "what"
      "service provider inventory establishment",
      "comprehensive service provider listing",
      "classification system implementation",
      "enterprise contact designation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "establish inventory of service providers",
      "maintain inventory of service providers",
      "list all known service providers",
      "include classifications",
      "designate an enterprise contact for each service provider",
      "review and update the inventory annually",
      "when significant enterprise changes occur that could impact this safeguard"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "third-party risk management tools",
      "service provider management platforms",
      "vendor inventory systems",
      "supplier relationship management tools"
    ],
    relatedSafeguards: ["2.1", "8.12", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7"],
    systemPromptFull: {

      role: "service_provider_inventory_expert",

      context: "You are evaluating service provider inventory management solutions against CIS Control 15.1 requirements for establishing and maintaining comprehensive inventories of service providers with classifications and enterprise contacts.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_inventory_expert",

      context: "You are evaluating service provider inventory management solutions against CIS Control 15.1 requirements for establishing and maintaining comprehensive inventories of service providers with classifications and enterprise contacts.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_inventory_expert",

      context: "You are evaluating service provider inventory management solutions against CIS Control 15.1 requirements for establishing and maintaining comprehensive inventories of service providers with classifications and enterprise contacts.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_inventory_expert",

      context: "You are evaluating service provider inventory management solutions against CIS Control 15.1 requirements for establishing and maintaining comprehensive inventories of service providers with classifications and enterprise contacts.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_inventory_expert",

      context: "You are evaluating service provider inventory management solutions against CIS Control 15.1 requirements for establishing and maintaining comprehensive inventories of service providers with classifications and enterprise contacts.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "15.2": {
    id: "15.2",
    title: "Establish and Maintain a Service Provider Management Policy",
    description: "Establish and maintain a service provider management policy. Ensure the policy addresses the classification, inventory, assessment, monitoring, and decommissioning of service providers. Review and update the policy annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a service provider management policy",
      "ensure policy addresses classification, inventory, assessment, monitoring, and decommissioning",
      "review and update policy annually or when significant enterprise changes occur"
    ],
    coreRequirements: [ // Green - The "what"
      "service provider management policy establishment",
      "comprehensive policy coverage",
      "classification processes",
      "inventory management processes",
      "assessment processes",
      "monitoring processes",
      "decommissioning processes"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "establish service provider management policy",
      "maintain service provider management policy",
      "ensure policy addresses classification",
      "ensure policy addresses inventory", 
      "ensure policy addresses assessment",
      "ensure policy addresses monitoring",
      "ensure policy addresses decommissioning of service providers",
      "review and update policy annually",
      "when significant enterprise changes occur that could impact this safeguard"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "service provider management policy documentation",
      "third-party risk management frameworks",
      "vendor management policy templates",
      "supplier governance documentation"
    ],
    relatedSafeguards: ["15.1", "15.3", "15.4", "15.5", "15.6", "15.7"],
    systemPromptFull: {

      role: "service_provider_policy_expert",

      context: "You are evaluating service provider management policy solutions against CIS Control 15.2 requirements for establishing and maintaining comprehensive policies covering classification, inventory, assessment, monitoring, and decommissioning.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_policy_expert",

      context: "You are evaluating service provider management policy solutions against CIS Control 15.2 requirements for establishing and maintaining comprehensive policies covering classification, inventory, assessment, monitoring, and decommissioning.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_policy_expert",

      context: "You are evaluating service provider management policy solutions against CIS Control 15.2 requirements for establishing and maintaining comprehensive policies covering classification, inventory, assessment, monitoring, and decommissioning.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_policy_expert",

      context: "You are evaluating service provider management policy solutions against CIS Control 15.2 requirements for establishing and maintaining comprehensive policies covering classification, inventory, assessment, monitoring, and decommissioning.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_policy_expert",

      context: "You are evaluating service provider management policy solutions against CIS Control 15.2 requirements for establishing and maintaining comprehensive policies covering classification, inventory, assessment, monitoring, and decommissioning.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "15.3": {
    id: "15.3",
    title: "Classify Service Providers",
    description: "Classify service providers. Classification consideration may include one or more characteristics, such as data sensitivity, data volume, availability requirements, applicable regulations, inherent risk, and mitigated risk. Update and review classifications annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "classify service providers",
      "classification may include data sensitivity, data volume, availability requirements, applicable regulations, inherent risk, mitigated risk",
      "update and review classifications annually or when significant enterprise changes occur"
    ],
    coreRequirements: [ // Green - The "what"
      "service provider classification system",
      "risk-based classification criteria",
      "data sensitivity classification",
      "regulatory compliance classification"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "classify service providers",
      "classification consideration may include one or more characteristics",
      "such as data sensitivity",
      "such as data volume",
      "such as availability requirements",
      "such as applicable regulations",
      "such as inherent risk",
      "such as mitigated risk",
      "update and review classifications annually",
      "when significant enterprise changes occur that could impact this safeguard"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "service provider management policy",
      "risk classification frameworks",
      "data sensitivity classification schemes",
      "regulatory compliance matrices"
    ],
    relatedSafeguards: ["15.1", "15.2"],
    systemPromptFull: {

      role: "service_provider_classification_expert",

      context: "You are evaluating service provider classification solutions against CIS Control 15.3 requirements for classifying service providers based on data sensitivity, volume, availability, regulations, and risk factors.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_classification_expert",

      context: "You are evaluating service provider classification solutions against CIS Control 15.3 requirements for classifying service providers based on data sensitivity, volume, availability, regulations, and risk factors.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_classification_expert",

      context: "You are evaluating service provider classification solutions against CIS Control 15.3 requirements for classifying service providers based on data sensitivity, volume, availability, regulations, and risk factors.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_classification_expert",

      context: "You are evaluating service provider classification solutions against CIS Control 15.3 requirements for classifying service providers based on data sensitivity, volume, availability, regulations, and risk factors.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_classification_expert",

      context: "You are evaluating service provider classification solutions against CIS Control 15.3 requirements for classifying service providers based on data sensitivity, volume, availability, regulations, and risk factors.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "15.4": {
    id: "15.4",
    title: "Ensure Service Provider Contracts Include Security Requirements",
    description: "Ensure service provider contracts include security requirements. Example requirements may include minimum security program requirements, security incident and/or data breach notification and response, data encryption requirements, and data disposal commitments. These security requirements must be consistent with the enterprise's service provider management policy. Review service provider contracts annually to ensure contracts are not missing security requirements",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "ensure service provider contracts include security requirements",
      "security requirements must be consistent with enterprise's service provider management policy",
      "review service provider contracts annually to ensure contracts are not missing security requirements"
    ],
    coreRequirements: [ // Green - The "what"
      "contract security requirements inclusion",
      "minimum security program requirements",
      "security incident and data breach notification requirements",
      "data encryption requirements",
      "data disposal commitments"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "ensure service provider contracts include security requirements",
      "example requirements may include minimum security program requirements",
      "security incident and/or data breach notification and response",
      "data encryption requirements",
      "data disposal commitments",
      "security requirements must be consistent with enterprise's service provider management policy",
      "review service provider contracts annually",
      "to ensure contracts are not missing security requirements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "contract management systems",
      "service provider management policy",
      "legal contract templates",
      "security requirement checklists"
    ],
    relatedSafeguards: ["15.1", "15.2"],
    systemPromptFull: {

      role: "service_provider_contract_security_expert",

      context: "You are evaluating service provider contract security management solutions against CIS Control 15.4 requirements for ensuring contracts include comprehensive security requirements consistent with enterprise policies.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_contract_security_expert",

      context: "You are evaluating service provider contract security management solutions against CIS Control 15.4 requirements for ensuring contracts include comprehensive security requirements consistent with enterprise policies.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_contract_security_expert",

      context: "You are evaluating service provider contract security management solutions against CIS Control 15.4 requirements for ensuring contracts include comprehensive security requirements consistent with enterprise policies.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_contract_security_expert",

      context: "You are evaluating service provider contract security management solutions against CIS Control 15.4 requirements for ensuring contracts include comprehensive security requirements consistent with enterprise policies.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_contract_security_expert",

      context: "You are evaluating service provider contract security management solutions against CIS Control 15.4 requirements for ensuring contracts include comprehensive security requirements consistent with enterprise policies.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "15.5": {
    id: "15.5",
    title: "Assess Service Providers",
    description: "Assess service providers consistent with the enterprise's service provider management policy. Assessment scope may vary based on classification(s), and may include review of standardized assessment reports, such as Service Organization Control 2 (SOC 2) and Payment Card Industry (PCI) Attestation of Compliance (AoC), customized questionnaires, or other appropriately rigorous processes. Reassess service providers annually, at a minimum, or with new and renewed contracts",
    implementationGroup: "IG3",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "assess service providers consistent with enterprise's service provider management policy",
      "assessment scope may vary based on classifications and may include SOC 2, PCI AoC, customized questionnaires, or other rigorous processes",
      "reassess service providers annually at minimum or with new and renewed contracts"
    ],
    coreRequirements: [ // Green - The "what"
      "service provider assessment processes",
      "standardized assessment report reviews",
      "customized questionnaire assessments",
      "rigorous assessment methodologies"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "assess service providers consistent with enterprise's service provider management policy",
      "assessment scope may vary based on classifications",
      "may include review of standardized assessment reports",
      "such as Service Organization Control 2 (SOC 2)",
      "Payment Card Industry (PCI) Attestation of Compliance (AoC)",
      "customized questionnaires",
      "other appropriately rigorous processes",
      "reassess service providers annually at a minimum",
      "or with new and renewed contracts"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "third-party risk management tools",
      "service provider management policy",
      "assessment questionnaire platforms",
      "compliance monitoring systems"
    ],
    relatedSafeguards: ["15.1", "15.2"],
    systemPromptFull: {

      role: "service_provider_assessment_expert",

      context: "You are evaluating service provider assessment solutions against CIS Control 15.5 requirements for conducting rigorous assessments including SOC 2, PCI AoC, customized questionnaires, and annual reassessments.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_assessment_expert",

      context: "You are evaluating service provider assessment solutions against CIS Control 15.5 requirements for conducting rigorous assessments including SOC 2, PCI AoC, customized questionnaires, and annual reassessments.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_assessment_expert",

      context: "You are evaluating service provider assessment solutions against CIS Control 15.5 requirements for conducting rigorous assessments including SOC 2, PCI AoC, customized questionnaires, and annual reassessments.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_assessment_expert",

      context: "You are evaluating service provider assessment solutions against CIS Control 15.5 requirements for conducting rigorous assessments including SOC 2, PCI AoC, customized questionnaires, and annual reassessments.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_assessment_expert",

      context: "You are evaluating service provider assessment solutions against CIS Control 15.5 requirements for conducting rigorous assessments including SOC 2, PCI AoC, customized questionnaires, and annual reassessments.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "15.6": {
    id: "15.6",
    title: "Monitor Service Providers",
    description: "Monitor service providers consistent with the enterprise's service provider management policy. Monitoring may include periodic reassessment of service provider compliance, monitoring service provider release notes, and dark web monitoring",
    implementationGroup: "IG3",
    assetType: ["data"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "monitor service providers consistent with enterprise's service provider management policy",
      "monitoring may include periodic reassessment, release notes monitoring, and dark web monitoring"
    ],
    coreRequirements: [ // Green - The "what"
      "service provider monitoring processes",
      "periodic compliance reassessment",
      "service provider release notes monitoring",
      "dark web monitoring"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "monitor service providers",
      "consistent with enterprise's service provider management policy",
      "monitoring may include periodic reassessment of service provider compliance",
      "monitoring service provider release notes",
      "dark web monitoring"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "third-party risk management tools",
      "service provider management policy",
      "dark web monitoring services",
      "compliance monitoring platforms"
    ],
    relatedSafeguards: ["15.1", "15.2"],
    systemPromptFull: {

      role: "service_provider_monitoring_expert",

      context: "You are evaluating service provider monitoring solutions against CIS Control 15.6 requirements for monitoring service providers including periodic reassessment, release notes monitoring, and dark web monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_monitoring_expert",

      context: "You are evaluating service provider monitoring solutions against CIS Control 15.6 requirements for monitoring service providers including periodic reassessment, release notes monitoring, and dark web monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_monitoring_expert",

      context: "You are evaluating service provider monitoring solutions against CIS Control 15.6 requirements for monitoring service providers including periodic reassessment, release notes monitoring, and dark web monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_monitoring_expert",

      context: "You are evaluating service provider monitoring solutions against CIS Control 15.6 requirements for monitoring service providers including periodic reassessment, release notes monitoring, and dark web monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_monitoring_expert",

      context: "You are evaluating service provider monitoring solutions against CIS Control 15.6 requirements for monitoring service providers including periodic reassessment, release notes monitoring, and dark web monitoring.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "15.7": {
    id: "15.7",
    title: "Securely Decommission Service Providers",
    description: "Securely decommission service providers. Example considerations include user and service account deactivation, termination of data flows, and secure disposal of enterprise data within service provider systems",
    implementationGroup: "IG3",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "securely decommission service providers",
      "example considerations include user and service account deactivation, termination of data flows, secure disposal of enterprise data"
    ],
    coreRequirements: [ // Green - The "what"
      "secure service provider decommissioning",
      "user and service account deactivation",
      "data flow termination",
      "secure enterprise data disposal"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "securely decommission service providers",
      "example considerations include user and service account deactivation",
      "termination of data flows",
      "secure disposal of enterprise data within service provider systems"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "service provider management policy",
      "data destruction procedures",
      "account deactivation processes",
      "secure decommissioning checklists"
    ],
    relatedSafeguards: ["15.1", "15.2"],
    systemPromptFull: {

      role: "service_provider_decommissioning_expert",

      context: "You are evaluating service provider decommissioning solutions against CIS Control 15.7 requirements for securely decommissioning service providers including account deactivation, data flow termination, and secure data disposal.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "service_provider_decommissioning_expert",

      context: "You are evaluating service provider decommissioning solutions against CIS Control 15.7 requirements for securely decommissioning service providers including account deactivation, data flow termination, and secure data disposal.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "service_provider_decommissioning_expert",

      context: "You are evaluating service provider decommissioning solutions against CIS Control 15.7 requirements for securely decommissioning service providers including account deactivation, data flow termination, and secure data disposal.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "service_provider_decommissioning_expert",

      context: "You are evaluating service provider decommissioning solutions against CIS Control 15.7 requirements for securely decommissioning service providers including account deactivation, data flow termination, and secure data disposal.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "service_provider_decommissioning_expert",

      context: "You are evaluating service provider decommissioning solutions against CIS Control 15.7 requirements for securely decommissioning service providers including account deactivation, data flow termination, and secure data disposal.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.1": {
    id: "16.1",
    title: "Establish and Maintain a Secure Application Development Process",
    description: "Establish and maintain a secure application development process. In the process, address such items as: secure application design standards, secure coding practices, developer training, vulnerability management, security of third-party code, and application security testing procedures. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a secure application development process",
      "review and update documentation annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "secure application development process",
      "secure application design standards",
      "secure coding practices",
      "developer training",
      "vulnerability management",
      "security of third-party code",
      "application security testing procedures"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "address such items as secure application design standards",
      "address such items as secure coding practices",
      "address such items as developer training",
      "address such items as vulnerability management",
      "address such items as security of third-party code",
      "address such items as application security testing procedures",
      "review and update documentation annually",
      "when significant enterprise changes occur"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure development lifecycle (SDLC) frameworks",
      "application security policies",
      "development process documentation",
      "security training programs for developers"
    ],
    relatedSafeguards: ["16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8", "16.9", "16.10", "16.11", "16.12", "16.13", "16.14"],
    systemPromptFull: {

      role: "secure_development_process_expert",

      context: "You are evaluating secure application development process solutions against CIS Control 16.1 requirements for establishing comprehensive secure development lifecycles including design standards, coding practices, training, and security testing.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "secure_development_process_expert",

      context: "You are evaluating secure application development process solutions against CIS Control 16.1 requirements for establishing comprehensive secure development lifecycles including design standards, coding practices, training, and security testing.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "secure_development_process_expert",

      context: "You are evaluating secure application development process solutions against CIS Control 16.1 requirements for establishing comprehensive secure development lifecycles including design standards, coding practices, training, and security testing.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "secure_development_process_expert",

      context: "You are evaluating secure application development process solutions against CIS Control 16.1 requirements for establishing comprehensive secure development lifecycles including design standards, coding practices, training, and security testing.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "secure_development_process_expert",

      context: "You are evaluating secure application development process solutions against CIS Control 16.1 requirements for establishing comprehensive secure development lifecycles including design standards, coding practices, training, and security testing.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.2": {
    id: "16.2",
    title: "Establish and Maintain a Process to Accept and Address Software Vulnerabilities",
    description: "Establish and maintain a process to accept and address reports of software vulnerabilities, including providing a means for external entities to report. The process is to include such items as: a vulnerability handling policy that identifies reporting process, responsible party for handling vulnerability reports, and a process for intake, assignment, remediation, and remediation testing. As part of the process, use a vulnerability tracking system that includes severity ratings, and metrics for measuring timing for identification, analysis, and remediation of vulnerabilities. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard. Third-party application developers need to consider this an externally-facing policy that helps to set expectations for outside stakeholders",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a process to accept and address reports of software vulnerabilities",
      "provide a means for external entities to report vulnerabilities",
      "review and update documentation annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "process to accept and address software vulnerabilities",
      "vulnerability handling policy",
      "reporting process",
      "responsible party for handling vulnerability reports",
      "process for intake, assignment, remediation, and remediation testing",
      "vulnerability tracking system",
      "severity ratings",
      "metrics for measuring timing"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "vulnerability handling policy that identifies reporting process",
      "process for intake",
      "process for assignment",
      "process for remediation",
      "process for remediation testing",
      "vulnerability tracking system that includes severity ratings",
      "metrics for measuring timing for identification of vulnerabilities",
      "metrics for measuring timing for analysis of vulnerabilities",
      "metrics for measuring timing for remediation of vulnerabilities",
      "externally-facing policy that helps to set expectations for outside stakeholders"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vulnerability disclosure platforms",
      "bug bounty programs",
      "vulnerability management systems",
      "incident response tools"
    ],
    relatedSafeguards: ["16.1", "16.3", "16.6"],
    systemPromptFull: {

      role: "vulnerability_disclosure_process_expert",

      context: "You are evaluating vulnerability disclosure and handling process solutions against CIS Control 16.2 requirements for accepting and addressing software vulnerability reports including external reporting mechanisms and comprehensive tracking systems.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "vulnerability_disclosure_process_expert",

      context: "You are evaluating vulnerability disclosure and handling process solutions against CIS Control 16.2 requirements for accepting and addressing software vulnerability reports including external reporting mechanisms and comprehensive tracking systems.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "vulnerability_disclosure_process_expert",

      context: "You are evaluating vulnerability disclosure and handling process solutions against CIS Control 16.2 requirements for accepting and addressing software vulnerability reports including external reporting mechanisms and comprehensive tracking systems.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "vulnerability_disclosure_process_expert",

      context: "You are evaluating vulnerability disclosure and handling process solutions against CIS Control 16.2 requirements for accepting and addressing software vulnerability reports including external reporting mechanisms and comprehensive tracking systems.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "vulnerability_disclosure_process_expert",

      context: "You are evaluating vulnerability disclosure and handling process solutions against CIS Control 16.2 requirements for accepting and addressing software vulnerability reports including external reporting mechanisms and comprehensive tracking systems.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.3": {
    id: "16.3",
    title: "Perform Root Cause Analysis on Security Vulnerabilities",
    description: "Perform root cause analysis on security vulnerabilities. When reviewing vulnerabilities, root cause analysis is the task of evaluating underlying issues that create vulnerabilities in code, and allows development teams to move beyond just fixing individual vulnerabilities as they arise",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "perform root cause analysis on security vulnerabilities"
    ],
    coreRequirements: [ // Green - The "what"
      "root cause analysis on security vulnerabilities",
      "evaluating underlying issues that create vulnerabilities in code"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "when reviewing vulnerabilities",
      "root cause analysis is the task of evaluating underlying issues",
      "allows development teams to move beyond just fixing individual vulnerabilities as they arise"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "code analysis tools",
      "vulnerability assessment platforms",
      "development team training on root cause analysis",
      "systematic vulnerability review processes"
    ],
    relatedSafeguards: ["16.1", "16.2"],
    systemPromptFull: {

      role: "vulnerability_root_cause_analysis_expert",

      context: "You are evaluating vulnerability root cause analysis solutions against CIS Control 16.3 requirements for performing systematic root cause analysis on security vulnerabilities to address underlying issues in code.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "vulnerability_root_cause_analysis_expert",

      context: "You are evaluating vulnerability root cause analysis solutions against CIS Control 16.3 requirements for performing systematic root cause analysis on security vulnerabilities to address underlying issues in code.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "vulnerability_root_cause_analysis_expert",

      context: "You are evaluating vulnerability root cause analysis solutions against CIS Control 16.3 requirements for performing systematic root cause analysis on security vulnerabilities to address underlying issues in code.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "vulnerability_root_cause_analysis_expert",

      context: "You are evaluating vulnerability root cause analysis solutions against CIS Control 16.3 requirements for performing systematic root cause analysis on security vulnerabilities to address underlying issues in code.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "vulnerability_root_cause_analysis_expert",

      context: "You are evaluating vulnerability root cause analysis solutions against CIS Control 16.3 requirements for performing systematic root cause analysis on security vulnerabilities to address underlying issues in code.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.4": {
    id: "16.4",
    title: "Establish and Manage an Inventory of Third-Party Software Components",
    description: "Establish and manage an updated inventory of third-party components used in development, often referred to as a \"bill of materials,\" as well as components slated for future use. This inventory is to include any risks that each third-party component could pose. Evaluate the list at least monthly to identify any changes or updates to these components, and validate that the component is still supported",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish and manage an updated inventory of third-party components used in development",
      "evaluate the list at least monthly to identify any changes or updates to these components and validate that the component is still supported"
    ],
    coreRequirements: [ // Green - The "what"
      "updated inventory of third-party components",
      "bill of materials",
      "components slated for future use",
      "risks that each third-party component could pose",
      "monthly evaluation",
      "component support validation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "third-party components used in development",
      "often referred to as bill of materials",
      "components slated for future use",
      "any risks that each third-party component could pose",
      "identify any changes or updates to these components",
      "validate that the component is still supported"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "software composition analysis (SCA) tools",
      "dependency management systems",
      "component vulnerability databases",
      "automated inventory tracking tools"
    ],
    relatedSafeguards: ["16.1", "16.5"],
    systemPromptFull: {

      role: "third_party_component_inventory_expert",

      context: "You are evaluating third-party software component inventory management solutions against CIS Control 16.4 requirements for maintaining bill of materials, risk assessment, and monthly component validation.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "third_party_component_inventory_expert",

      context: "You are evaluating third-party software component inventory management solutions against CIS Control 16.4 requirements for maintaining bill of materials, risk assessment, and monthly component validation.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "third_party_component_inventory_expert",

      context: "You are evaluating third-party software component inventory management solutions against CIS Control 16.4 requirements for maintaining bill of materials, risk assessment, and monthly component validation.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "third_party_component_inventory_expert",

      context: "You are evaluating third-party software component inventory management solutions against CIS Control 16.4 requirements for maintaining bill of materials, risk assessment, and monthly component validation.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "third_party_component_inventory_expert",

      context: "You are evaluating third-party software component inventory management solutions against CIS Control 16.4 requirements for maintaining bill of materials, risk assessment, and monthly component validation.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.5": {
    id: "16.5",
    title: "Use Up-to-Date and Trusted Third-Party Software Components",
    description: "Use up-to-date and trusted third-party software components. When possible, choose established and proven frameworks and libraries that provide adequate security. Acquire these components from trusted sources or evaluate the software for vulnerabilities before use",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use up-to-date and trusted third-party software components"
    ],
    coreRequirements: [ // Green - The "what"
      "up-to-date third-party software components",
      "trusted third-party software components",
      "established and proven frameworks and libraries",
      "adequate security",
      "trusted sources",
      "vulnerability evaluation before use"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "when possible choose established and proven frameworks and libraries",
      "that provide adequate security",
      "acquire these components from trusted sources",
      "evaluate the software for vulnerabilities before use"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "software composition analysis (SCA) tools",
      "trusted software repositories",
      "vulnerability scanning tools",
      "component security assessment processes"
    ],
    relatedSafeguards: ["16.1", "16.4", "16.11", "7.1"],
    systemPromptFull: {

      role: "trusted_component_security_expert",

      context: "You are evaluating trusted third-party software component solutions against CIS Control 16.5 requirements for using up-to-date, trusted components from established sources with adequate security and vulnerability evaluation.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "trusted_component_security_expert",

      context: "You are evaluating trusted third-party software component solutions against CIS Control 16.5 requirements for using up-to-date, trusted components from established sources with adequate security and vulnerability evaluation.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "trusted_component_security_expert",

      context: "You are evaluating trusted third-party software component solutions against CIS Control 16.5 requirements for using up-to-date, trusted components from established sources with adequate security and vulnerability evaluation.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "trusted_component_security_expert",

      context: "You are evaluating trusted third-party software component solutions against CIS Control 16.5 requirements for using up-to-date, trusted components from established sources with adequate security and vulnerability evaluation.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "trusted_component_security_expert",

      context: "You are evaluating trusted third-party software component solutions against CIS Control 16.5 requirements for using up-to-date, trusted components from established sources with adequate security and vulnerability evaluation.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.6": {
    id: "16.6",
    title: "Establish and Maintain a Severity Rating System and Process for Application Vulnerabilities",
    description: "Establish and maintain a severity rating system and process for application vulnerabilities that facilitates prioritizing the order in which discovered vulnerabilities are fixed. This process includes setting a minimum level of security acceptability for releasing code or applications. Severity ratings bring a systematic way of triaging vulnerabilities that improves risk management and helps ensure the most severe bugs are fixed first. Review and update the system and process annually",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a severity rating system and process for application vulnerabilities",
      "review and update the system and process annually"
    ],
    coreRequirements: [ // Green - The "what"
      "severity rating system",
      "process for application vulnerabilities",
      "prioritizing the order in which discovered vulnerabilities are fixed",
      "minimum level of security acceptability for releasing code or applications",
      "systematic way of triaging vulnerabilities"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "facilitates prioritizing the order in which discovered vulnerabilities are fixed",
      "setting a minimum level of security acceptability for releasing code or applications",
      "severity ratings bring a systematic way of triaging vulnerabilities",
      "improves risk management",
      "helps ensure the most severe bugs are fixed first"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "CVSS scoring systems",
      "vulnerability management platforms",
      "risk assessment frameworks",
      "prioritization workflows"
    ],
    relatedSafeguards: ["16.1", "16.2"],
    systemPromptFull: {

      role: "vulnerability_severity_rating_expert",

      context: "You are evaluating vulnerability severity rating system solutions against CIS Control 16.6 requirements for establishing systematic vulnerability prioritization, triaging, and risk management with minimum security acceptability levels.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "vulnerability_severity_rating_expert",

      context: "You are evaluating vulnerability severity rating system solutions against CIS Control 16.6 requirements for establishing systematic vulnerability prioritization, triaging, and risk management with minimum security acceptability levels.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "vulnerability_severity_rating_expert",

      context: "You are evaluating vulnerability severity rating system solutions against CIS Control 16.6 requirements for establishing systematic vulnerability prioritization, triaging, and risk management with minimum security acceptability levels.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "vulnerability_severity_rating_expert",

      context: "You are evaluating vulnerability severity rating system solutions against CIS Control 16.6 requirements for establishing systematic vulnerability prioritization, triaging, and risk management with minimum security acceptability levels.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "vulnerability_severity_rating_expert",

      context: "You are evaluating vulnerability severity rating system solutions against CIS Control 16.6 requirements for establishing systematic vulnerability prioritization, triaging, and risk management with minimum security acceptability levels.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.7": {
    id: "16.7",
    title: "Use Standard Hardening Configuration Templates for Application Infrastructure",
    description: "Use standard, industry-recommended hardening configuration templates for application infrastructure components. This includes underlying servers, databases, and web servers, and applies to cloud containers, Platform as a Service (PaaS) components, and SaaS components. Do not allow in-house developed software to weaken configuration hardening",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use standard, industry-recommended hardening configuration templates for application infrastructure components",
      "do not allow in-house developed software to weaken configuration hardening"
    ],
    coreRequirements: [ // Green - The "what"
      "standard hardening configuration templates",
      "application infrastructure components",
      "underlying servers",
      "databases",
      "web servers",
      "cloud containers",
      "Platform as a Service (PaaS) components",
      "SaaS components"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "industry-recommended hardening configuration templates",
      "includes underlying servers, databases, and web servers",
      "applies to cloud containers",
      "applies to Platform as a Service (PaaS) components",
      "applies to SaaS components"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "configuration baseline tools",
      "infrastructure as code (IaC) templates",
      "security hardening guides",
      "automated configuration management"
    ],
    relatedSafeguards: ["16.1"],
    systemPromptFull: {

      role: "infrastructure_hardening_template_expert",

      context: "You are evaluating infrastructure hardening configuration template solutions against CIS Control 16.7 requirements for using standard industry-recommended hardening templates for application infrastructure including servers, databases, web servers, cloud containers, PaaS, and SaaS components.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "infrastructure_hardening_template_expert",

      context: "You are evaluating infrastructure hardening configuration template solutions against CIS Control 16.7 requirements for using standard industry-recommended hardening templates for application infrastructure including servers, databases, web servers, cloud containers, PaaS, and SaaS components.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "infrastructure_hardening_template_expert",

      context: "You are evaluating infrastructure hardening configuration template solutions against CIS Control 16.7 requirements for using standard industry-recommended hardening templates for application infrastructure including servers, databases, web servers, cloud containers, PaaS, and SaaS components.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "infrastructure_hardening_template_expert",

      context: "You are evaluating infrastructure hardening configuration template solutions against CIS Control 16.7 requirements for using standard industry-recommended hardening templates for application infrastructure including servers, databases, web servers, cloud containers, PaaS, and SaaS components.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "infrastructure_hardening_template_expert",

      context: "You are evaluating infrastructure hardening configuration template solutions against CIS Control 16.7 requirements for using standard industry-recommended hardening templates for application infrastructure including servers, databases, web servers, cloud containers, PaaS, and SaaS components.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.8": {
    id: "16.8",
    title: "Separate Production and Non-Production Systems",
    description: "Maintain separate environments for production and non-production systems",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "maintain separate environments for production and non-production systems"
    ],
    coreRequirements: [ // Green - The "what"
      "separate environments",
      "production systems",
      "non-production systems"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "separate environments for production systems",
      "separate environments for non-production systems"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network segmentation tools",
      "environment isolation technologies",
      "access control systems",
      "deployment pipeline controls"
    ],
    relatedSafeguards: ["16.1"],
    systemPromptFull: {

      role: "environment_separation_expert",

      context: "You are evaluating environment separation solutions against CIS Control 16.8 requirements for maintaining separate environments for production and non-production systems.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "environment_separation_expert",

      context: "You are evaluating environment separation solutions against CIS Control 16.8 requirements for maintaining separate environments for production and non-production systems.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "environment_separation_expert",

      context: "You are evaluating environment separation solutions against CIS Control 16.8 requirements for maintaining separate environments for production and non-production systems.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "environment_separation_expert",

      context: "You are evaluating environment separation solutions against CIS Control 16.8 requirements for maintaining separate environments for production and non-production systems.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "environment_separation_expert",

      context: "You are evaluating environment separation solutions against CIS Control 16.8 requirements for maintaining separate environments for production and non-production systems.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.9": {
    id: "16.9",
    title: "Train Developers in Application Security Concepts and Secure Coding",
    description: "Ensure that all software development personnel receive training in writing secure code for their specific development environment and responsibilities. Training can include general security principles and application security standard practices. Conduct training at least annually and design in a way to promote security within the development team, and build a culture of security among the developers",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "ensure that all software development personnel receive training in writing secure code",
      "conduct training at least annually"
    ],
    coreRequirements: [ // Green - The "what"
      "training in writing secure code",
      "specific development environment and responsibilities",
      "general security principles",
      "application security standard practices",
      "promote security within the development team",
      "build a culture of security among the developers"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "all software development personnel receive training",
      "for their specific development environment and responsibilities",
      "training can include general security principles",
      "training can include application security standard practices",
      "design in a way to promote security within the development team",
      "build a culture of security among the developers"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security training and awareness tools",
      "secure coding training programs",
      "developer security certifications",
      "hands-on security workshops"
    ],
    relatedSafeguards: ["16.1", "14.1", "14.9"],
    systemPromptFull: {

      role: "developer_security_training_expert",

      context: "You are evaluating developer security training solutions against CIS Control 16.9 requirements for training all software development personnel in secure coding, application security principles, and building a security culture.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "developer_security_training_expert",

      context: "You are evaluating developer security training solutions against CIS Control 16.9 requirements for training all software development personnel in secure coding, application security principles, and building a security culture.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "developer_security_training_expert",

      context: "You are evaluating developer security training solutions against CIS Control 16.9 requirements for training all software development personnel in secure coding, application security principles, and building a security culture.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "developer_security_training_expert",

      context: "You are evaluating developer security training solutions against CIS Control 16.9 requirements for training all software development personnel in secure coding, application security principles, and building a security culture.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "developer_security_training_expert",

      context: "You are evaluating developer security training solutions against CIS Control 16.9 requirements for training all software development personnel in secure coding, application security principles, and building a security culture.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.10": {
    id: "16.10",
    title: "Apply Secure Design Principles in Application Architectures",
    description: "Apply secure design principles in application architectures. Secure design principles include the concept of least privilege and enforcing mediation to validate every operation that the user makes, promoting the concept of \"never trust user input.\" Examples include ensuring that explicit error checking is performed and documented for all input, including for size, data type, and acceptable ranges or formats. Secure design also means minimizing the application infrastructure attack surface, such as turning off unprotected ports and services, removing unnecessary programs and files, and renaming or removing default accounts",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "apply secure design principles in application architectures"
    ],
    coreRequirements: [ // Green - The "what"
      "secure design principles",
      "concept of least privilege",
      "enforcing mediation to validate every operation",
      "never trust user input",
      "explicit error checking for all input",
      "minimizing the application infrastructure attack surface"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "concept of least privilege",
      "enforcing mediation",
      "validate every operation that the user makes",
      "promoting the concept of never trust user input",
      "ensuring that explicit error checking is performed and documented for all input",
      "including for size, data type, and acceptable ranges or formats",
      "turning off unprotected ports and services",
      "removing unnecessary programs and files",
      "renaming or removing default accounts"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure architecture frameworks",
      "input validation libraries",
      "access control systems",
      "security design patterns"
    ],
    relatedSafeguards: ["16.1"],
    systemPromptFull: {

      role: "secure_architecture_design_expert",

      context: "You are evaluating secure application architecture design solutions against CIS Control 16.10 requirements for applying secure design principles including least privilege, input validation, and attack surface minimization.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "secure_architecture_design_expert",

      context: "You are evaluating secure application architecture design solutions against CIS Control 16.10 requirements for applying secure design principles including least privilege, input validation, and attack surface minimization.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "secure_architecture_design_expert",

      context: "You are evaluating secure application architecture design solutions against CIS Control 16.10 requirements for applying secure design principles including least privilege, input validation, and attack surface minimization.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "secure_architecture_design_expert",

      context: "You are evaluating secure application architecture design solutions against CIS Control 16.10 requirements for applying secure design principles including least privilege, input validation, and attack surface minimization.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "secure_architecture_design_expert",

      context: "You are evaluating secure application architecture design solutions against CIS Control 16.10 requirements for applying secure design principles including least privilege, input validation, and attack surface minimization.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.11": {
    id: "16.11",
    title: "Leverage Vetted Modules or Services for Application Security Components",
    description: "Leverage vetted modules or services for application security components, such as identity management, encryption, and auditing and logging. Using platform features in critical security functions will reduce developers' workload and minimize the likelihood of design or implementation errors. Modern operating systems provide effective mechanisms for identification, authentication, and authorization and make those mechanisms available to applications. Use only standardized, currently accepted, and extensively reviewed encryption algorithms. Operating systems also provide mechanisms to create and maintain secure audit logs",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "leverage vetted modules or services for application security components",
      "use only standardized, currently accepted, and extensively reviewed encryption algorithms"
    ],
    coreRequirements: [ // Green - The "what"
      "vetted modules or services",
      "application security components",
      "identity management",
      "encryption",
      "auditing and logging",
      "platform features in critical security functions",
      "identification, authentication, and authorization mechanisms",
      "secure audit logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "such as identity management, encryption, and auditing and logging",
      "using platform features in critical security functions will reduce developers' workload",
      "minimize the likelihood of design or implementation errors",
      "modern operating systems provide effective mechanisms for identification, authentication, and authorization",
      "make those mechanisms available to applications",
      "operating systems also provide mechanisms to create and maintain secure audit logs"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "established security libraries",
      "platform security services",
      "cryptographic modules",
      "operating system security features"
    ],
    relatedSafeguards: ["16.1", "16.5"],
    systemPromptFull: {

      role: "vetted_security_module_expert",

      context: "You are evaluating vetted security module and service solutions against CIS Control 16.11 requirements for leveraging established security components including identity management, encryption, auditing, logging, and platform security features.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "vetted_security_module_expert",

      context: "You are evaluating vetted security module and service solutions against CIS Control 16.11 requirements for leveraging established security components including identity management, encryption, auditing, logging, and platform security features.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "vetted_security_module_expert",

      context: "You are evaluating vetted security module and service solutions against CIS Control 16.11 requirements for leveraging established security components including identity management, encryption, auditing, logging, and platform security features.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "vetted_security_module_expert",

      context: "You are evaluating vetted security module and service solutions against CIS Control 16.11 requirements for leveraging established security components including identity management, encryption, auditing, logging, and platform security features.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "vetted_security_module_expert",

      context: "You are evaluating vetted security module and service solutions against CIS Control 16.11 requirements for leveraging established security components including identity management, encryption, auditing, logging, and platform security features.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.12": {
    id: "16.12",
    title: "Implement Code-Level Security Checks",
    description: "Apply static and dynamic analysis tools within the application life cycle to verify that secure coding practices are being followed",
    implementationGroup: "IG3",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "apply static and dynamic analysis tools within the application life cycle to verify that secure coding practices are being followed"
    ],
    coreRequirements: [ // Green - The "what"
      "static analysis tools",
      "dynamic analysis tools",
      "application life cycle",
      "secure coding practices verification"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "apply static analysis tools within the application life cycle",
      "apply dynamic analysis tools within the application life cycle",
      "verify that secure coding practices are being followed"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "code analysis tools",
      "static application security testing (SAST)",
      "dynamic application security testing (DAST)",
      "interactive application security testing (IAST)"
    ],
    relatedSafeguards: ["16.1"],
    systemPromptFull: {

      role: "code_security_analysis_expert",

      context: "You are evaluating code-level security analysis solutions against CIS Control 16.12 requirements for implementing static and dynamic analysis tools within application lifecycles to verify secure coding practices.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "code_security_analysis_expert",

      context: "You are evaluating code-level security analysis solutions against CIS Control 16.12 requirements for implementing static and dynamic analysis tools within application lifecycles to verify secure coding practices.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "code_security_analysis_expert",

      context: "You are evaluating code-level security analysis solutions against CIS Control 16.12 requirements for implementing static and dynamic analysis tools within application lifecycles to verify secure coding practices.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "code_security_analysis_expert",

      context: "You are evaluating code-level security analysis solutions against CIS Control 16.12 requirements for implementing static and dynamic analysis tools within application lifecycles to verify secure coding practices.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "code_security_analysis_expert",

      context: "You are evaluating code-level security analysis solutions against CIS Control 16.12 requirements for implementing static and dynamic analysis tools within application lifecycles to verify secure coding practices.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.13": {
    id: "16.13",
    title: "Conduct Application Penetration Testing",
    description: "Conduct application penetration testing. For critical applications, authenticated penetration testing is better suited to finding business logic vulnerabilities than code scanning and automated security testing. Penetration testing relies on the skill of the tester to manually manipulate an application as an authenticated and unauthenticated user",
    implementationGroup: "IG3",
    assetType: ["applications"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "conduct application penetration testing"
    ],
    coreRequirements: [ // Green - The "what"
      "application penetration testing",
      "authenticated penetration testing for critical applications",
      "business logic vulnerabilities",
      "manual manipulation of application",
      "authenticated and unauthenticated user testing"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "for critical applications",
      "authenticated penetration testing is better suited to finding business logic vulnerabilities",
      "than code scanning and automated security testing",
      "penetration testing relies on the skill of the tester",
      "to manually manipulate an application as an authenticated and unauthenticated user"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "application security testing tools",
      "penetration testing frameworks",
      "security testing methodologies",
      "skilled penetration testers"
    ],
    relatedSafeguards: ["16.1"],
    systemPromptFull: {

      role: "application_penetration_testing_expert",

      context: "You are evaluating application penetration testing solutions against CIS Control 16.13 requirements for conducting penetration testing including authenticated testing for critical applications and business logic vulnerability identification.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "application_penetration_testing_expert",

      context: "You are evaluating application penetration testing solutions against CIS Control 16.13 requirements for conducting penetration testing including authenticated testing for critical applications and business logic vulnerability identification.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "application_penetration_testing_expert",

      context: "You are evaluating application penetration testing solutions against CIS Control 16.13 requirements for conducting penetration testing including authenticated testing for critical applications and business logic vulnerability identification.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "application_penetration_testing_expert",

      context: "You are evaluating application penetration testing solutions against CIS Control 16.13 requirements for conducting penetration testing including authenticated testing for critical applications and business logic vulnerability identification.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "application_penetration_testing_expert",

      context: "You are evaluating application penetration testing solutions against CIS Control 16.13 requirements for conducting penetration testing including authenticated testing for critical applications and business logic vulnerability identification.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "16.14": {
    id: "16.14",
    title: "Conduct Threat Modeling",
    description: "Conduct threat modeling. Threat modeling is the process of identifying and addressing application security design flaws within a design, before code is created. It is conducted through specially trained individuals who evaluate the application design and gauge security risks for each entry point and access level. The goal is to map out the application, architecture, and infrastructure in a structured way to understand its weaknesses",
    implementationGroup: "IG3",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "conduct threat modeling"
    ],
    coreRequirements: [ // Green - The "what"
      "threat modeling",
      "identifying and addressing application security design flaws",
      "before code is created",
      "specially trained individuals",
      "evaluate application design",
      "gauge security risks for each entry point and access level",
      "map out the application, architecture, and infrastructure"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "threat modeling is the process of identifying and addressing application security design flaws within a design",
      "before code is created",
      "conducted through specially trained individuals",
      "who evaluate the application design and gauge security risks",
      "for each entry point and access level",
      "the goal is to map out the application, architecture, and infrastructure in a structured way",
      "to understand its weaknesses"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "threat modeling frameworks",
      "security design review processes",
      "threat modeling tools",
      "security architecture documentation"
    ],
    relatedSafeguards: ["16.1"],
    systemPromptFull: {

      role: "threat_modeling_expert",

      context: "You are evaluating threat modeling solutions against CIS Control 16.14 requirements for conducting threat modeling to identify and address application security design flaws before code creation through specially trained individuals.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "threat_modeling_expert",

      context: "You are evaluating threat modeling solutions against CIS Control 16.14 requirements for conducting threat modeling to identify and address application security design flaws before code creation through specially trained individuals.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "threat_modeling_expert",

      context: "You are evaluating threat modeling solutions against CIS Control 16.14 requirements for conducting threat modeling to identify and address application security design flaws before code creation through specially trained individuals.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "threat_modeling_expert",

      context: "You are evaluating threat modeling solutions against CIS Control 16.14 requirements for conducting threat modeling to identify and address application security design flaws before code creation through specially trained individuals.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "threat_modeling_expert",

      context: "You are evaluating threat modeling solutions against CIS Control 16.14 requirements for conducting threat modeling to identify and address application security design flaws before code creation through specially trained individuals.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.1": {
    id: "17.1",
    title: "Designate Personnel to Manage Incident Handling",
    description: "Designate one key person, and at least one backup, who will manage the enterprise's incident handling process. Management personnel are responsible for the coordination and documentation of incident response and recovery efforts and can consist of employees internal to the enterprise, service providers, or a hybrid approach. If using a service provider, designate at least one person internal to the enterprise to oversee any third-party work. Review annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "designate one key person and at least one backup who will manage the enterprise's incident handling process",
      "review annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "one key person to manage incident handling",
      "at least one backup person",
      "coordination of incident response and recovery efforts",
      "documentation of incident response and recovery efforts",
      "management personnel for incident handling process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "management personnel are responsible for coordination and documentation",
      "can consist of employees internal to the enterprise",
      "can consist of service providers",
      "can consist of a hybrid approach",
      "if using a service provider, designate at least one person internal to the enterprise to oversee any third-party work"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "incident response team structures",
      "incident management roles and responsibilities",
      "coordination tools and processes",
      "documentation templates"
    ],
    relatedSafeguards: ["17.4"],
    systemPromptFull: {

      role: "incident_management_personnel_expert",

      context: "You are evaluating incident management personnel designation solutions against CIS Control 17.1 requirements for designating key personnel and backups to manage enterprise incident handling processes with coordination and documentation responsibilities.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_management_personnel_expert",

      context: "You are evaluating incident management personnel designation solutions against CIS Control 17.1 requirements for designating key personnel and backups to manage enterprise incident handling processes with coordination and documentation responsibilities.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_management_personnel_expert",

      context: "You are evaluating incident management personnel designation solutions against CIS Control 17.1 requirements for designating key personnel and backups to manage enterprise incident handling processes with coordination and documentation responsibilities.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_management_personnel_expert",

      context: "You are evaluating incident management personnel designation solutions against CIS Control 17.1 requirements for designating key personnel and backups to manage enterprise incident handling processes with coordination and documentation responsibilities.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_management_personnel_expert",

      context: "You are evaluating incident management personnel designation solutions against CIS Control 17.1 requirements for designating key personnel and backups to manage enterprise incident handling processes with coordination and documentation responsibilities.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.2": {
    id: "17.2",
    title: "Establish and Maintain Contact Information for Reporting Security Incidents",
    description: "Establish and maintain contact information for reporting security incidents. This information must be available to all workforce members and should include various contact methods (e.g., phone, email) and be regularly updated. Consider the availability of these contact methods in different circumstances, such as when primary communication systems are compromised",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain contact information for reporting security incidents",
      "information must be available to all workforce members"
    ],
    coreRequirements: [ // Green - The "what"
      "contact information for reporting security incidents",
      "available to all workforce members",
      "various contact methods",
      "regularly updated contact information"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "should include various contact methods (e.g., phone, email)",
      "be regularly updated",
      "consider the availability of these contact methods in different circumstances",
      "such as when primary communication systems are compromised"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "incident reporting hotlines",
      "emergency contact lists",
      "multiple communication channels",
      "contact information distribution methods"
    ],
    relatedSafeguards: ["17.3", "17.4"],
    systemPromptFull: {

      role: "incident_contact_information_expert",

      context: "You are evaluating incident contact information management solutions against CIS Control 17.2 requirements for establishing and maintaining comprehensive contact information for reporting security incidents with multiple communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_contact_information_expert",

      context: "You are evaluating incident contact information management solutions against CIS Control 17.2 requirements for establishing and maintaining comprehensive contact information for reporting security incidents with multiple communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_contact_information_expert",

      context: "You are evaluating incident contact information management solutions against CIS Control 17.2 requirements for establishing and maintaining comprehensive contact information for reporting security incidents with multiple communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_contact_information_expert",

      context: "You are evaluating incident contact information management solutions against CIS Control 17.2 requirements for establishing and maintaining comprehensive contact information for reporting security incidents with multiple communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_contact_information_expert",

      context: "You are evaluating incident contact information management solutions against CIS Control 17.2 requirements for establishing and maintaining comprehensive contact information for reporting security incidents with multiple communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.3": {
    id: "17.3",
    title: "Establish and Maintain an Enterprise Process for Reporting Incidents",
    description: "Establish and maintain an documented enterprise process for the workforce to report security incidents. The process includes reporting timeframe, personnel to report to, mechanism for reporting, and the minimum information to be reported. Ensure the process is publicly available to all of the workforce. Review annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a documented enterprise process for the workforce to report security incidents",
      "ensure the process is publicly available to all of the workforce",
      "review annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented enterprise process for reporting incidents",
      "reporting timeframe",
      "personnel to report to",
      "mechanism for reporting",
      "minimum information to be reported"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "the process includes reporting timeframe",
      "the process includes personnel to report to",
      "the process includes mechanism for reporting",
      "the process includes the minimum information to be reported"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "incident reporting procedures",
      "reporting forms and templates",
      "workforce training materials",
      "process communication methods"
    ],
    relatedSafeguards: ["17.2", "17.4", "14.6"],
    systemPromptFull: {

      role: "incident_reporting_process_expert",

      context: "You are evaluating incident reporting process solutions against CIS Control 17.3 requirements for establishing documented enterprise processes including reporting timeframes, personnel, mechanisms, and minimum information requirements.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_reporting_process_expert",

      context: "You are evaluating incident reporting process solutions against CIS Control 17.3 requirements for establishing documented enterprise processes including reporting timeframes, personnel, mechanisms, and minimum information requirements.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_reporting_process_expert",

      context: "You are evaluating incident reporting process solutions against CIS Control 17.3 requirements for establishing documented enterprise processes including reporting timeframes, personnel, mechanisms, and minimum information requirements.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_reporting_process_expert",

      context: "You are evaluating incident reporting process solutions against CIS Control 17.3 requirements for establishing documented enterprise processes including reporting timeframes, personnel, mechanisms, and minimum information requirements.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_reporting_process_expert",

      context: "You are evaluating incident reporting process solutions against CIS Control 17.3 requirements for establishing documented enterprise processes including reporting timeframes, personnel, mechanisms, and minimum information requirements.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.4": {
    id: "17.4",
    title: "Establish and Maintain an Incident Response Process",
    description: "Establish and maintain a documented incident response process that addresses roles and responsibilities, compliance requirements, and a communication plan. Review annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a documented incident response process",
      "review annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented incident response process",
      "roles and responsibilities",
      "compliance requirements",
      "communication plan"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "that addresses roles and responsibilities",
      "that addresses compliance requirements",
      "that addresses a communication plan"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "incident response playbooks",
      "process documentation templates",
      "compliance frameworks",
      "communication protocols"
    ],
    relatedSafeguards: ["17.1", "17.3", "17.5", "17.6", "17.7", "17.8", "17.9"],
    systemPromptFull: {

      role: "incident_response_process_expert",

      context: "You are evaluating incident response process solutions against CIS Control 17.4 requirements for establishing documented incident response processes addressing roles, responsibilities, compliance requirements, and communication plans.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_response_process_expert",

      context: "You are evaluating incident response process solutions against CIS Control 17.4 requirements for establishing documented incident response processes addressing roles, responsibilities, compliance requirements, and communication plans.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_response_process_expert",

      context: "You are evaluating incident response process solutions against CIS Control 17.4 requirements for establishing documented incident response processes addressing roles, responsibilities, compliance requirements, and communication plans.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_response_process_expert",

      context: "You are evaluating incident response process solutions against CIS Control 17.4 requirements for establishing documented incident response processes addressing roles, responsibilities, compliance requirements, and communication plans.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_response_process_expert",

      context: "You are evaluating incident response process solutions against CIS Control 17.4 requirements for establishing documented incident response processes addressing roles, responsibilities, compliance requirements, and communication plans.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.5": {
    id: "17.5",
    title: "Assign Key Roles and Responsibilities",
    description: "Assign key roles and responsibilities for incident response, including staff from legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts. Review annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "assign key roles and responsibilities for incident response",
      "review annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "key roles and responsibilities for incident response",
      "staff from legal",
      "staff from IT",
      "staff from information security",
      "staff from facilities",
      "staff from public relations",
      "staff from human resources",
      "incident responders",
      "analysts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "including staff from legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "incident response team structures",
      "role definition templates",
      "responsibility matrices",
      "cross-functional team coordination"
    ],
    relatedSafeguards: ["17.4"],
    systemPromptFull: {

      role: "incident_response_role_assignment_expert",

      context: "You are evaluating incident response role assignment solutions against CIS Control 17.5 requirements for assigning key roles and responsibilities including legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_response_role_assignment_expert",

      context: "You are evaluating incident response role assignment solutions against CIS Control 17.5 requirements for assigning key roles and responsibilities including legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_response_role_assignment_expert",

      context: "You are evaluating incident response role assignment solutions against CIS Control 17.5 requirements for assigning key roles and responsibilities including legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_response_role_assignment_expert",

      context: "You are evaluating incident response role assignment solutions against CIS Control 17.5 requirements for assigning key roles and responsibilities including legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_response_role_assignment_expert",

      context: "You are evaluating incident response role assignment solutions against CIS Control 17.5 requirements for assigning key roles and responsibilities including legal, IT, information security, facilities, public relations, human resources, incident responders, and analysts.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.6": {
    id: "17.6",
    title: "Define Mechanisms for Communicating During Incident Response",
    description: "Determine which primary and secondary mechanisms will be used to communicate and report during a security incident. Mechanisms can include phone calls, emails, secure chat or notification letters. Keep in mind that certain mechanisms, such as emails, can be affected during a security incident. Review annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "determine which primary and secondary mechanisms will be used to communicate and report during a security incident",
      "review annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "primary mechanisms for communicating during incident response",
      "secondary mechanisms for communicating during incident response",
      "mechanisms to communicate during security incident",
      "mechanisms to report during security incident"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "mechanisms can include phone calls",
      "mechanisms can include emails",
      "mechanisms can include secure chat",
      "mechanisms can include notification letters",
      "keep in mind that certain mechanisms, such as emails, can be affected during a security incident"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "communication platforms",
      "backup communication methods",
      "secure messaging systems",
      "notification systems"
    ],
    relatedSafeguards: ["17.4"],
    systemPromptFull: {

      role: "incident_communication_mechanism_expert",

      context: "You are evaluating incident communication mechanism solutions against CIS Control 17.6 requirements for defining primary and secondary communication mechanisms during security incidents including resilient communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_communication_mechanism_expert",

      context: "You are evaluating incident communication mechanism solutions against CIS Control 17.6 requirements for defining primary and secondary communication mechanisms during security incidents including resilient communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_communication_mechanism_expert",

      context: "You are evaluating incident communication mechanism solutions against CIS Control 17.6 requirements for defining primary and secondary communication mechanisms during security incidents including resilient communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_communication_mechanism_expert",

      context: "You are evaluating incident communication mechanism solutions against CIS Control 17.6 requirements for defining primary and secondary communication mechanisms during security incidents including resilient communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_communication_mechanism_expert",

      context: "You are evaluating incident communication mechanism solutions against CIS Control 17.6 requirements for defining primary and secondary communication mechanisms during security incidents including resilient communication methods.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.7": {
    id: "17.7",
    title: "Conduct Routine Incident Response Exercises",
    description: "Plan and conduct routine incident response exercises and scenarios for key personnel involved in the incident response process to prepare for responding to real-world incidents. Exercises need to test communication channels, decision-making, and workflows. Conduct testing on an annual basis, at a minimum",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "plan and conduct routine incident response exercises and scenarios for key personnel involved in the incident response process",
      "conduct testing on an annual basis, at a minimum"
    ],
    coreRequirements: [ // Green - The "what"
      "routine incident response exercises",
      "scenarios for key personnel",
      "prepare for responding to real-world incidents",
      "test communication channels",
      "test decision-making",
      "test workflows"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "key personnel involved in the incident response process",
      "to prepare for responding to real-world incidents",
      "exercises need to test communication channels, decision-making, and workflows"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "tabletop exercises",
      "simulation scenarios",
      "exercise planning frameworks",
      "testing schedules and protocols"
    ],
    relatedSafeguards: ["17.4"],
    systemPromptFull: {

      role: "incident_response_exercise_expert",

      context: "You are evaluating incident response exercise solutions against CIS Control 17.7 requirements for conducting routine exercises and scenarios for key personnel to test communication channels, decision-making, and workflows.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_response_exercise_expert",

      context: "You are evaluating incident response exercise solutions against CIS Control 17.7 requirements for conducting routine exercises and scenarios for key personnel to test communication channels, decision-making, and workflows.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_response_exercise_expert",

      context: "You are evaluating incident response exercise solutions against CIS Control 17.7 requirements for conducting routine exercises and scenarios for key personnel to test communication channels, decision-making, and workflows.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_response_exercise_expert",

      context: "You are evaluating incident response exercise solutions against CIS Control 17.7 requirements for conducting routine exercises and scenarios for key personnel to test communication channels, decision-making, and workflows.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_response_exercise_expert",

      context: "You are evaluating incident response exercise solutions against CIS Control 17.7 requirements for conducting routine exercises and scenarios for key personnel to test communication channels, decision-making, and workflows.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.8": {
    id: "17.8",
    title: "Conduct Post-Incident Reviews",
    description: "Conduct post-incident reviews. Post-incident reviews help prevent incident recurrence through identifying lessons learned and follow-up action",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "conduct post-incident reviews"
    ],
    coreRequirements: [ // Green - The "what"
      "post-incident reviews",
      "prevent incident recurrence",
      "identifying lessons learned",
      "follow-up action"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "post-incident reviews help prevent incident recurrence",
      "through identifying lessons learned and follow-up action"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "post-incident review templates",
      "lessons learned documentation",
      "improvement action plans",
      "review meeting processes"
    ],
    relatedSafeguards: ["17.4"],
    systemPromptFull: {

      role: "post_incident_review_expert",

      context: "You are evaluating post-incident review solutions against CIS Control 17.8 requirements for conducting post-incident reviews to prevent recurrence through lessons learned identification and follow-up actions.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "post_incident_review_expert",

      context: "You are evaluating post-incident review solutions against CIS Control 17.8 requirements for conducting post-incident reviews to prevent recurrence through lessons learned identification and follow-up actions.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "post_incident_review_expert",

      context: "You are evaluating post-incident review solutions against CIS Control 17.8 requirements for conducting post-incident reviews to prevent recurrence through lessons learned identification and follow-up actions.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "post_incident_review_expert",

      context: "You are evaluating post-incident review solutions against CIS Control 17.8 requirements for conducting post-incident reviews to prevent recurrence through lessons learned identification and follow-up actions.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "post_incident_review_expert",

      context: "You are evaluating post-incident review solutions against CIS Control 17.8 requirements for conducting post-incident reviews to prevent recurrence through lessons learned identification and follow-up actions.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "17.9": {
    id: "17.9",
    title: "Establish and Maintain Security Incident Thresholds",
    description: "Establish and maintain security incident thresholds, including, at a minimum, differentiating between an incident and an event. Examples can include: abnormal activity, security vulnerability, security weakness, data breach, privacy incident, etc. Review annually, or when significant enterprise changes occur that could impact this Safeguard",
    implementationGroup: "IG3",
    assetType: ["users"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain security incident thresholds",
      "review annually or when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "security incident thresholds",
      "differentiating between an incident and an event",
      "incident classification criteria"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "including, at a minimum, differentiating between an incident and an event",
      "examples can include abnormal activity",
      "examples can include security vulnerability",
      "examples can include security weakness",
      "examples can include data breach",
      "examples can include privacy incident"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "incident classification frameworks",
      "threshold definition templates",
      "severity rating systems",
      "incident categorization tools"
    ],
    relatedSafeguards: ["17.4"],
    systemPromptFull: {

      role: "incident_threshold_classification_expert",

      context: "You are evaluating security incident threshold and classification solutions against CIS Control 17.9 requirements for establishing incident thresholds including incident/event differentiation and classification criteria.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "incident_threshold_classification_expert",

      context: "You are evaluating security incident threshold and classification solutions against CIS Control 17.9 requirements for establishing incident thresholds including incident/event differentiation and classification criteria.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "incident_threshold_classification_expert",

      context: "You are evaluating security incident threshold and classification solutions against CIS Control 17.9 requirements for establishing incident thresholds including incident/event differentiation and classification criteria.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "incident_threshold_classification_expert",

      context: "You are evaluating security incident threshold and classification solutions against CIS Control 17.9 requirements for establishing incident thresholds including incident/event differentiation and classification criteria.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "incident_threshold_classification_expert",

      context: "You are evaluating security incident threshold and classification solutions against CIS Control 17.9 requirements for establishing incident thresholds including incident/event differentiation and classification criteria.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "18.1": {
    id: "18.1",
    title: "Establish and Maintain a Penetration Testing Program",
    description: "Establish and maintain a penetration testing program appropriate to the size, complexity, industry, and maturity of the enterprise. Penetration testing program characteristics include scope, such as network, web application, Application Programming Interface (API), hosted services, and physical premise controls; frequency; limitations, such as acceptable hours, and excluded attack types; point of contact information; remediation, such as how findings will be routed internally; and retrospective requirements",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain a penetration testing program appropriate to the size, complexity, industry, and maturity of the enterprise"
    ],
    coreRequirements: [ // Green - The "what"
      "penetration testing program",
      "scope including network, web application, API, hosted services, and physical premise controls",
      "frequency requirements",
      "limitations including acceptable hours and excluded attack types",
      "point of contact information",
      "remediation procedures for routing findings internally",
      "retrospective requirements"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "appropriate to the size, complexity, industry, and maturity of the enterprise",
      "penetration testing program characteristics include scope",
      "such as network, web application, Application Programming Interface (API), hosted services, and physical premise controls",
      "characteristics include frequency",
      "characteristics include limitations, such as acceptable hours, and excluded attack types",
      "characteristics include point of contact information",
      "characteristics include remediation, such as how findings will be routed internally",
      "characteristics include retrospective requirements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "penetration testing frameworks",
      "program documentation templates",
      "scope definition guidelines",
      "testing frequency schedules"
    ],
    relatedSafeguards: ["18.2", "18.3", "18.4", "18.5"],
    systemPromptFull: {

      role: "penetration_testing_program_expert",

      context: "You are evaluating penetration testing program solutions against CIS Control 18.1 requirements for establishing comprehensive programs appropriate to enterprise size, complexity, industry, and maturity with defined scope, frequency, limitations, and remediation procedures.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "penetration_testing_program_expert",

      context: "You are evaluating penetration testing program solutions against CIS Control 18.1 requirements for establishing comprehensive programs appropriate to enterprise size, complexity, industry, and maturity with defined scope, frequency, limitations, and remediation procedures.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "penetration_testing_program_expert",

      context: "You are evaluating penetration testing program solutions against CIS Control 18.1 requirements for establishing comprehensive programs appropriate to enterprise size, complexity, industry, and maturity with defined scope, frequency, limitations, and remediation procedures.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "penetration_testing_program_expert",

      context: "You are evaluating penetration testing program solutions against CIS Control 18.1 requirements for establishing comprehensive programs appropriate to enterprise size, complexity, industry, and maturity with defined scope, frequency, limitations, and remediation procedures.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "penetration_testing_program_expert",

      context: "You are evaluating penetration testing program solutions against CIS Control 18.1 requirements for establishing comprehensive programs appropriate to enterprise size, complexity, industry, and maturity with defined scope, frequency, limitations, and remediation procedures.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "18.2": {
    id: "18.2",
    title: "Perform Periodic External Penetration Tests",
    description: "Perform periodic external penetration tests based on program requirements, no less than annually. External penetration testing must include enterprise and environmental reconnaissance to detect exploitable information. Penetration testing requires specialized skills and experience and must be conducted through a qualified party. The testing may be clear box or opaque box",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "perform periodic external penetration tests based on program requirements, no less than annually",
      "external penetration testing must include enterprise and environmental reconnaissance to detect exploitable information",
      "penetration testing requires specialized skills and experience and must be conducted through a qualified party"
    ],
    coreRequirements: [ // Green - The "what"
      "periodic external penetration tests",
      "enterprise reconnaissance",
      "environmental reconnaissance",
      "detect exploitable information",
      "specialized skills and experience",
      "qualified party to conduct testing"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "based on program requirements",
      "no less than annually",
      "to detect exploitable information",
      "the testing may be clear box or opaque box"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "external penetration testing services",
      "reconnaissance tools and techniques",
      "qualified penetration testing vendors",
      "clear box and opaque box methodologies"
    ],
    relatedSafeguards: ["18.1", "18.3", "18.4"],
    systemPromptFull: {

      role: "external_penetration_testing_expert",

      context: "You are evaluating external penetration testing solutions against CIS Control 18.2 requirements for performing periodic external penetration tests including enterprise and environmental reconnaissance with qualified party execution and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "external_penetration_testing_expert",

      context: "You are evaluating external penetration testing solutions against CIS Control 18.2 requirements for performing periodic external penetration tests including enterprise and environmental reconnaissance with qualified party execution and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "external_penetration_testing_expert",

      context: "You are evaluating external penetration testing solutions against CIS Control 18.2 requirements for performing periodic external penetration tests including enterprise and environmental reconnaissance with qualified party execution and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "external_penetration_testing_expert",

      context: "You are evaluating external penetration testing solutions against CIS Control 18.2 requirements for performing periodic external penetration tests including enterprise and environmental reconnaissance with qualified party execution and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "external_penetration_testing_expert",

      context: "You are evaluating external penetration testing solutions against CIS Control 18.2 requirements for performing periodic external penetration tests including enterprise and environmental reconnaissance with qualified party execution and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "18.3": {
    id: "18.3",
    title: "Remediate Penetration Test Findings",
    description: "Remediate penetration test findings based on the enterprise's documented vulnerability remediation process. This should include determining a timeline and level of effort based on the impact and prioritization of each identified finding",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "remediate penetration test findings based on the enterprise's documented vulnerability remediation process"
    ],
    coreRequirements: [ // Green - The "what"
      "remediate penetration test findings",
      "documented vulnerability remediation process",
      "timeline for remediation",
      "level of effort determination",
      "impact assessment",
      "prioritization of findings"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "this should include determining a timeline and level of effort",
      "based on the impact and prioritization of each identified finding"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vulnerability remediation workflows",
      "finding prioritization frameworks",
      "remediation tracking systems",
      "impact assessment methodologies"
    ],
    relatedSafeguards: ["18.1", "18.2", "18.5"],
    systemPromptFull: {

      role: "penetration_test_remediation_expert",

      context: "You are evaluating penetration test finding remediation solutions against CIS Control 18.3 requirements for remediating findings based on documented vulnerability remediation processes with timeline, effort, impact, and prioritization assessment.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "penetration_test_remediation_expert",

      context: "You are evaluating penetration test finding remediation solutions against CIS Control 18.3 requirements for remediating findings based on documented vulnerability remediation processes with timeline, effort, impact, and prioritization assessment.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "penetration_test_remediation_expert",

      context: "You are evaluating penetration test finding remediation solutions against CIS Control 18.3 requirements for remediating findings based on documented vulnerability remediation processes with timeline, effort, impact, and prioritization assessment.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "penetration_test_remediation_expert",

      context: "You are evaluating penetration test finding remediation solutions against CIS Control 18.3 requirements for remediating findings based on documented vulnerability remediation processes with timeline, effort, impact, and prioritization assessment.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "penetration_test_remediation_expert",

      context: "You are evaluating penetration test finding remediation solutions against CIS Control 18.3 requirements for remediating findings based on documented vulnerability remediation processes with timeline, effort, impact, and prioritization assessment.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "18.4": {
    id: "18.4",
    title: "Validate Security Measures",
    description: "Validate security measures after each penetration test. If deemed necessary, modify rulesets and capabilities to detect the techniques used during testing",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "validate security measures after each penetration test"
    ],
    coreRequirements: [ // Green - The "what"
      "validate security measures",
      "modify rulesets if necessary",
      "modify capabilities if necessary",
      "detect techniques used during testing"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "after each penetration test",
      "if deemed necessary",
      "to detect the techniques used during testing"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "security control validation frameworks",
      "detection rule tuning processes",
      "capability enhancement procedures",
      "technique analysis methodologies"
    ],
    relatedSafeguards: ["18.1", "18.2", "18.5"],
    systemPromptFull: {

      role: "security_measure_validation_expert",

      context: "You are evaluating security measure validation solutions against CIS Control 18.4 requirements for validating security measures after penetration tests and modifying rulesets/capabilities to detect testing techniques.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "security_measure_validation_expert",

      context: "You are evaluating security measure validation solutions against CIS Control 18.4 requirements for validating security measures after penetration tests and modifying rulesets/capabilities to detect testing techniques.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "security_measure_validation_expert",

      context: "You are evaluating security measure validation solutions against CIS Control 18.4 requirements for validating security measures after penetration tests and modifying rulesets/capabilities to detect testing techniques.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "security_measure_validation_expert",

      context: "You are evaluating security measure validation solutions against CIS Control 18.4 requirements for validating security measures after penetration tests and modifying rulesets/capabilities to detect testing techniques.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "security_measure_validation_expert",

      context: "You are evaluating security measure validation solutions against CIS Control 18.4 requirements for validating security measures after penetration tests and modifying rulesets/capabilities to detect testing techniques.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  },
  "18.5": {
    id: "18.5",
    title: "Perform Periodic Internal Penetration Tests",
    description: "Perform periodic internal penetration tests based on program requirements, no less than annually. The testing may be clear box or opaque box",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "perform periodic internal penetration tests based on program requirements, no less than annually"
    ],
    coreRequirements: [ // Green - The "what"
      "periodic internal penetration tests",
      "program requirements compliance",
      "annual testing frequency minimum"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "based on program requirements",
      "no less than annually",
      "the testing may be clear box or opaque box"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "internal penetration testing tools",
      "internal testing methodologies",
      "clear box and opaque box approaches",
      "internal security assessment frameworks"
    ],
    relatedSafeguards: ["18.1", "18.3", "18.4"],
    systemPromptFull: {

      role: "internal_penetration_testing_expert",

      context: "You are evaluating internal penetration testing solutions against CIS Control 18.5 requirements for performing periodic internal penetration tests based on program requirements with annual frequency and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to FULL by the mapping tool. Being mapped to FULL means that the vendor addresses each of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard FULLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptPartial: {

      role: "internal_penetration_testing_expert",

      context: "You are evaluating internal penetration testing solutions against CIS Control 18.5 requirements for performing periodic internal penetration tests based on program requirements with annual frequency and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to PARTIAL by the mapping tool. Being mapped to PARTIAL means that the vendor addresses some but not all of the subtaxonomical elements in some way.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps meet the safeguard PARTIALLY.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptFacilitates: {

      role: "internal_penetration_testing_expert",

      context: "You are evaluating internal penetration testing solutions against CIS Control 18.5 requirements for performing periodic internal penetration tests based on program requirements with annual frequency and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to FACILITATES by the mapping tool. Being mapped to FACILIATES means that the vendors' product or service makes another tool or service, that actually implements the control, better faster or stronger.  Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps FACILITATE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptGovernance: {

      role: "internal_penetration_testing_expert",

      context: "You are evaluating internal penetration testing solutions against CIS Control 18.5 requirements for performing periodic internal penetration tests based on program requirements with annual frequency and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to GOVERNANCE by the mapping tool. Being mapped to GOVERNANCE means that the vendors tool or service helps an organization meet the Governance Elements of a safeguard. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps empower GOVERNANCE.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    },

    systemPromptValidates: {

      role: "internal_penetration_testing_expert",

      context: "You are evaluating internal penetration testing solutions against CIS Control 18.5 requirements for performing periodic internal penetration tests based on program requirements with annual frequency and clear/opaque box methodologies.",

      objective: "The vendor has taken an assessment and has been mapped to VALIDATES by the mapping tool. Being mapped to VALIDATES means that the vendor helps coollect evidence that a safeguard is in place and working as specified. Assess whether their answer CLEARLY educates the end user about how the vendors' tool or service helps VALIDATE the safeguard.",

      guidelines: [
        "Future Use"
      ],

      outputFormat: "Provide a structured assessment, confidence score, and evidence summary"

    }
  }
};
  }
}
