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
    title: "Establish and Maintain Detailed Enterprise Asset Inventory",
    description: "Establish and maintain an accurate, detailed, and up-to-date inventory of all enterprise assets with the potential to store or process data, to include: end-user devices (including portable and mobile), network devices, non-computing/IoT devices, and servers. Ensure the inventory records the network address (if static), hardware address, machine name, enterprise asset owner, department for each asset, and whether the asset has been approved to connect to the network. For mobile end-user devices, MDM type tools can support this process, where appropriate. This inventory includes assets connected to the infrastructure physically, virtually, remotely, and those within cloud environments. Additionally, it includes assets that are regularly connected to the enterprise’s network infrastructure, even if they are not under control of the enterprise. Review and update the inventory of all enterprise assets bi-annually, or more frequently.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Review and update the inventory of all enterprise assets",
      "Establish",
      "Up-to-date",
      "more frequently",
      "bi-annually",
      "Maintain",
      "Ensure"
    ],
    coreRequirements: [ // Green - The "what"
      "Asset Inventory"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Connected to Infrastructure",
      "Potential to store or process data",
      "Remotely",
      "Virtually",
      "Physically",
      "End-User Devices",
      "IOT Devices",
      "Network Devices",
      "Servers",
      "Detailed",
      "Accurate",
      "Mobile",
      "Portable",
      "Those within cloud environments",
      "Regularly Connected Devices - NOT Under Control of Enterprise",
      "Machine Name",
      "Network Address (IF STATIC)",
      "Hardware Address",
      "Enterprise asset owner",
      "Department for each asset",
      "Asset has been approved to connect to the network"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "For mobile end-user devices, MDM type tools can support this process, where appropriate"
    ],
    relatedSafeguards: ["1.2", "1.3", "1.4", "1.5", "2.1", "3.2", "4.1", "5.1"]  },
  "1.2": {
    id: "1.2",
    title: "Address Unauthorized Assets",
    description: "Ensure that a process exists to address unauthorized assets on a weekly basis. The enterprise may choose to remove the asset from the network, deny the asset from connecting remotely to the network, or quarantine the asset.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "On a weekly basis"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Remove the asset from the network",
      "Deny the Asset from connecting remotely to the network",
      "Quarantine the asset"
    ],
    relatedSafeguards: ["1.1", "1.3"]  },
  "1.3": {
    id: "1.3",
    title: "Utilize an Active Discovery Tool",
    description: "Utilize an active discovery tool to identify assets connected to the enterprise’s network. Configure the active discovery tool to execute daily, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Utilize",
      "Configure",
      "Execute daily",
      "Execute daily, or more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Active discovery tool"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Identify Assets Connected To Network"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "1.2", "1.4", "1.5"]  },
  "1.4": {
    id: "1.4", 
    title: "Use Dynamic Host Configuration Protocol (DHCP) Logging to Update Enterprise Asset Inventory",
    description: "Use DHCP logging on all DHCP servers or Internet Protocol (IP) address management tools to update the enterprise’s asset inventory. Review and use logs to update the enterprise’s asset inventory weekly, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Review and Use Logs",
      "Update asset inventory",
      "Weekly",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "IPAM Tool",
      "DHCP Logging on all DHCP servers",
      "IPAM"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "1.2", "1.3", "1.5"]  },
  "1.5": {
    id: "1.5",
    title: "Use a Passive Asset Discovery Tool",
    description: "Use a passive discovery tool to identify assets connected to the enterprise’s network. Review and use scans to update the enterprise’s asset inventory at least weekly, or more frequently.",
    implementationGroup: "IG3",
    assetType: ["Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Review and Use scans",
      "Update asset inventory",
      "Weekly",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Passive Discovery Tool"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Identify Assets Connected To Network"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "1.2", "1.3", "1.4"]  },
  "2.1": {
    id: "2.1",
    title: "Establish and Maintain a Software Inventory",
    description: "Establish and maintain a detailed inventory of all licensed software installed on enterprise assets. The software inventory must document the title, publisher, initial install/use date, and business purpose for each entry; where appropriate, include the Uniform Resource Locator (URL), app store(s), version(s), deployment mechanism, decommission date, and number of licenses. Review and update the software inventory bi-annually, or more frequently.",
    implementationGroup: "IG1",
    assetType: ["Software"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update software inventory",
      "bi-annually",
      "More Frequently",
      "Must Document",
      "Where appropriate"
    ],
    coreRequirements: [ // Green - The "what"
      "Detailed inventory of all licensed software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Installed* on enterprise Assets",
      "Business Purpose",
      "Title",
      "Publisher",
      "Initial Install / Use Date",
      "Decomm. Date",
      "Deployment mechanism",
      "URL",
      "App Store(s)",
      "App Version(s)"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7"]  },
  "2.2": {
    id: "2.2",
    title: "Ensure Authorized Software is Currently Supported",
    description: "Ensure that only currently supported software is designated as authorized in the software inventory for enterprise assets. If software is unsupported, yet necessary for the fulfillment of the enterprise’s mission, document an exception detailing mitigating controls and residual risk acceptance. For any unsupported software without an exception documentation, designate as unauthorized. Review the software list to verify software support at least monthly, or more frequently.",
    implementationGroup: "IG1",
    assetType: ["Software"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "Review the software list",
      "Monthly",
      "More frequently",
      "Unsupported"
    ],
    coreRequirements: [ // Green - The "what"
      "Currently supported software",
      "Authorized in the software inventory"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Document Exception detailing mitigating controls",
      "Determine if Authorized Software Is Currently Supported",
      "Determine Necessity for Business",
      "Document Residual risk acceptance"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "2.3", "2.4", "2.5", "2.6", "2.7"]  },
  "2.3": {
    id: "2.3",
    title: "Address Unauthorized Software",
    description: "Ensure that unauthorized software is either removed from use on enterprise assets or receives a documented exception. Review monthly, or more frequently.",
    implementationGroup: "IG1",
    assetType: ["Software"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "Review",
      "Monthly",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Document Exception",
      "Remove from use"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "2.2", "2.4", "2.5", "2.6", "2.7"]  },
  "2.4": {
    id: "2.4",
    title: "Utilize Automated Software Inventory Tools",
    description: "Utilize software inventory tools, when possible, throughout the enterprise to automate the discovery and documentation of installed software.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Utilize",
      "when possible"
    ],
    coreRequirements: [ // Green - The "what"
      "software inventory tools"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Automate Discovery",
      "Automate Documentation",
      "Installed Software"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.5", "2.6", "2.7"]  },
  "2.5": {
    id: "2.5",
    title: "Allowlist Authorized Software",
    description: "Use technical controls, such as application allowlisting, to ensure that only authorized software can execute or be accessed. Reassess bi-annually, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Ensure",
      "Reassess",
      "Bi-Annually",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "technical controls",
      "Accessed",
      "Execute"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Application Allowlisting"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.6", "2.7"]  },
  "2.6": {
    id: "2.6",
    title: "Allowlist Authorized Libraries",
    description: "Use technical controls to ensure that only authorized software libraries, such as specific .dll, .ocx, and .so files, are allowed to load into a system process. Block unauthorized libraries from loading into a system process. Reassess bi-annually, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Ensure",
      "Reassess",
      "Bi-Annually",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "only authorized software libraries",
      "are allowed to load into a system process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Technical Controls",
      "Block unauthorized libraries from loading into a system process"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Specific .so files",
      "Specific .dll files",
      "Specific .ocx files"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.7"]  },
  "2.7": {
    id: "2.7",
    title: "Allowlist Authorized Scripts",
    description: "Use technical controls, such as digital signatures and version control, to ensure that only authorized scripts, such as specific .ps1 and .py files, are allowed to execute. Block unauthorized scripts from executing. Reassess bi-annually, or more frequently.",
    implementationGroup: "IG3",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "Ensure",
      "Reassess",
      "Bi-Annually",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "only authorized files are allowed to execute"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Technical Controls",
      "Block unauthorized scripts from executing"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Specific .ps1 files",
      "Specific .py files",
      "Digital signatures",
      "Version control"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"]  },
  "3.1": {
    id: "3.1",
    title: "Establish and Maintain a Data Management Process",
    description: "Establish and maintain a documented data management process. In the process, address data sensitivity, data owner, handling of data, data retention limits, and disposal requirements, based on sensitivity and retention standards for the enterprise. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update documentation",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented data management process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Data Sensitivity",
      "Data Owner",
      "Retention Standards",
      "Data Retention Limits",
      "Disposal Requirements",
      "Data Handling"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14"]  },
  "3.2": {
    id: "3.2",
    title: "Establish and Maintain a Data Inventory",
    description: "Establish and maintain a data inventory based on the enterprise’s data management process. Inventory sensitive data, at a minimum. Review and update inventory annually, at a minimum, with a priority on sensitive data.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Annually, at a minimum",
      "Review and update inventory",
      "Priority on sensitive data"
    ],
    coreRequirements: [ // Green - The "what"
      "data inventory"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Based on Data Management process",
      "Sensitive Data at a Minimum"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "3.1", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14"]  },
  "3.3": {
    id: "3.3",
    title: "Configure Data Access Control Lists",
    description: "Configure data access control lists based on a user’s need to know. Apply data access control lists, also known as access permissions, to local and remote file systems, databases, and applications.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Configure"
    ],
    coreRequirements: [ // Green - The "what"
      "data access control lists"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "ACLS - \"aka\" Access Permissions",
      "Based on \"Need to Know\"",
      "Local",
      "Remote File Systems",
      "Applications",
      "Databases"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.2", "3.4", "3.5", "3.6", "5.1", "6.1", "6.2"]  },
  "3.4": {
    id: "3.4",
    title: "Enforce Data Retention",
    description: "Retain data according to the enterprise’s documented data management process. Data retention must include both minimum and maximum timelines.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Retain",
      "Enforce",
      "Must Include"
    ],
    coreRequirements: [ // Green - The "what"
      "Data retention"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Minimum Timelines",
      "Maximum timelines"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.2", "3.5", "3.6", "3.10"]  },
  "3.5": {
    id: "3.5",
    title: "Securely Dispose of Data",
    description: "Securely dispose of data as outlined in the enterprise’s documented data management process. Ensure the disposal process and method are commensurate with the data sensitivity.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "Disposal process and method are commensurate with the data sensitivity"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.2", "3.4", "3.6", "3.10"]  },
  "3.6": {
    id: "3.6",
    title: "Encrypt Data on End-User Devices",
    description: "Encrypt data on end-user devices containing sensitive data. Example implementations can include: Windows BitLocker®, Apple FileVault®, Linux® dm-crypt.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Encrypt"
    ],
    coreRequirements: [ // Green - The "what"
      "data on end-user devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Sensitive data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Windows Bitlocker",
      "Apple FileVault",
      "Linux dm-crypt"
    ],
    relatedSafeguards: ["1.1", "3.1", "3.2", "3.7", "3.8", "3.9", "3.11"]  },
  "3.7": {
    id: "3.7",
    title: "Establish and Maintain a Data Classification Scheme",
    description: "Establish and maintain an overall data classification scheme for the enterprise. Enterprises may use labels, such as “Sensitive,” “Confidential,” and “Public,” and classify their data according to those labels. Review and update the classification scheme annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update classification scheme",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "data classification scheme"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Classify their data according to labels"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Sensitive",
      "Confidential",
      "Public"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.3", "3.8", "3.9", "3.10", "3.11", "3.12"]  },
  "3.8": {
    id: "3.8",
    title: "Document Data Flows",
    description: "Document data flows. Data flow documentation includes service provider data flows and should be based on the enterprise’s data management process. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Review and update documentation",
      "When significant enterprise changes occur that could impact this Safeguard",
      "Annually"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Data Flows",
      "Service Provider Data Flows"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.2", "3.7", "3.9", "3.10", "3.11"]  },
  "3.9": {
    id: "3.9",
    title: "Encrypt Data on Removable Media",
    description: "Encrypt data on removable media.",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Maintain"
    ],
    coreRequirements: [ // Green - The "what"
      "Data on Removable Media"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.6", "3.7", "3.10", "3.11"]  },
  "3.10": {
    id: "3.10",
    title: "Encrypt Sensitive Data in Transit",
    description: "Encrypt sensitive data in transit. Example implementations can include: Transport Layer Security (TLS) and Open Secure Shell (OpenSSH).",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Encrypt"
    ],
    coreRequirements: [ // Green - The "what"
      "Sensitive data in transit"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "TLS",
      "OpenSSH"
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "3.11", "13.1", "13.2"]  },
  "3.11": {
    id: "3.11",
    title: "Encrypt Sensitive Data at Rest",
    description: "Encrypt sensitive data at rest on servers, applications, and databases. Storage-layer encryption, also known as server-side encryption, meets the minimum requirement of this Safeguard. Additional encryption methods may include application-layer encryption, also known as client-side encryption, where access to the data storage device(s) does not permit access to the plain-text data.",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Encrypt",
      "Minimum Requirement"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Servers",
      "Applications",
      "Databases",
      "Storage Layer (server side) encryption"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Application layer (client-side) encryption",
      "Where access to the data storage device(s) does not permit access to the plain-text data"
    ],
    relatedSafeguards: ["3.1", "3.6", "3.7", "3.9", "3.10", "11.1"]  },
  "3.12": {
    id: "3.12",
    title: "Segment Data Processing and Storage Based on Sensitivity",
    description: "Segment data processing and storage based on the sensitivity of the data. Do not process sensitive data on enterprise assets intended for lower sensitivity data.",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Do not process sensitive data on enterprise assets intended for lower sensitivity data"
    ],
    coreRequirements: [ // Green - The "what"
      "Based on the sensitivity of data",
      "Segment data processing (compute)",
      "Segment Storage"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.7", "12.1", "12.2", "12.3"]  },
  "3.13": {
    id: "3.13",
    title: "Deploy a Data Loss Prevention Solution",
    description: "Implement an automated tool, such as a host-based Data Loss Prevention (DLP) tool to identify all sensitive data stored, processed, or transmitted through enterprise assets, including those located onsite or at a remote service provider, and update the enterprise's data inventory.",
    implementationGroup: "IG3",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Implement"
    ],
    coreRequirements: [ // Green - The "what"
      "Automated DLP Tool",
      "Identify all sensitive Data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Stored",
      "Processed",
      "Transmitte d",
      "Update Data Inventory",
      "Remote Service Provider",
      "Onsite Data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Host-based Data loss Prevention (DLP) tool"
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "3.10", "3.11"]  },
  "3.14": {
    id: "3.14",
    title: "Log Sensitive Data Access",
    description: "Log sensitive data access, including modification and disposal.",
    implementationGroup: "IG3",
    assetType: ["Data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Log"
    ],
    coreRequirements: [ // Green - The "what"
      "Sensitive Data access",
      "Access",
      "Modification",
      "Disposal"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "8.1", "8.2"]  },
  "4.1": {
    id: "4.1",
    title: "Establish and Maintain a Secure Configuration Process",
    description: "Establish and maintain a documented secure configuration process for enterprise assets (end-user devices, including portable and mobile, non-computing/IoT devices, and servers) and software (operating systems and applications). Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Docuemntation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update documentati on",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented secure configuration process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise assets",
      "Software",
      "OS",
      "Applications",
      "End-user devices",
      "Non-computing/I oT devices",
      "Servers",
      "Mobile",
      "Portable"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "4.12"]  },
  "4.2": {
    id: "4.2",
    title: "Establish and Maintain a Secure Configuration Process for Network Infrastructure",
    description: "Establish and maintain a documented secure configuration process for network devices. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update documentation",
      "When significant enterprise changes occur that could impact this Safeguard",
      "Annually"
    ],
    coreRequirements: [ // Green - The "what"
      "Documented Secure Network Configuration Process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Network devices"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "3.10", "4.1", "6.4", "8.1", "12.1", "12.2", "12.3", "12.4", "12.5", "13.3", "13.4", "13.6", "13.8", "13.9", "13.10"]  },
  "4.3": {
    id: "4.3",
    title: "Configure Automatic Session Locking on Enterprise Assets",
    description: "Configure automatic session locking on enterprise assets after a defined period of inactivity. For general purpose operating systems, the period must not exceed 15 minutes. For mobile end-user devices, the period must not exceed 2 minutes.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Configure",
      "Period must not exceed for 15 Minutes",
      "Period must not exceed for 2 Minutes"
    ],
    coreRequirements: [ // Green - The "what"
      "Automatic Session Locking"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Period of inactivity",
      "General Purpose OS's",
      "Mobile end-user devices"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "4.4": {
    id: "4.4",
    title: "Implement and Manage a Firewall on Servers",
    description: "Implement and manage a firewall on servers, where supported. Example implementations include a virtual firewall, operating system firewall, or a third-party firewall agent.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Implement",
      "Manage",
      "Where Supported"
    ],
    coreRequirements: [ // Green - The "what"
      "Server Firewall"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Virtual Firewall",
      "OS Firewall",
      "Third Party Firewall"
    ],
    relatedSafeguards: ["4.1"]  },
  "4.5": {
    id: "4.5",
    title: "Implement and Manage a Firewall on End-User Devices",
    description: "Implement and manage a host-based firewall or port-filtering tool on end-user devices, with a default-deny rule that drops all traffic except those services and ports that are explicitly allowed.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Implement",
      "Manage"
    ],
    coreRequirements: [ // Green - The "what"
      "Port Host-Filtering based Tool Firewall",
      "End User Devices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Default Deny Rule that drops all traffic",
      "Except Explicitly Allowed",
      "Services",
      "Ports"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "4.6": {
    id: "4.6",
    title: "Securely Manage Enterprise Assets and Software",
    description: "Securely manage enterprise assets and software. Example implementations include managing configuration through version-controlled Infrastructure-as-Code (IaC) and accessing administrative interfaces over secure network protocols, such as Secure Shell (SSH) and Hypertext Transfer Protocol Secure (HTTPS). Do not use insecure management protocols, such as Telnet (Teletype Network) and HTTP, unless operationally essential.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Do not use insecure management protocols"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Unless operationally essential"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Manage configuration through version-controlled Infrastructure-as-Code (IaC)",
      "Accessing administrative interfaces over secure network protocols",
      "Telnet (Teletype Network)",
      "HTTP",
      "SSH",
      "HTTPS"
    ],
    relatedSafeguards: ["4.1", "12.3"]  },
  "4.7": {
    id: "4.7",
    title: "Manage Default Accounts on Enterprise Assets and Software",
    description: "Manage default accounts on enterprise assets and software, such as root, administrator, and other pre-configured vendor accounts. Example implementations can include: disabling default accounts or making them unusable.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Manage"
    ],
    coreRequirements: [ // Green - The "what"
      "default accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise assets",
      "Software"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Disabling",
      "Unusable",
      "Root",
      "Administrator",
      "Other pre-configured vendor accounts"
    ],
    relatedSafeguards: ["4.1"]  },
  "4.8": {
    id: "4.8",
    title: "Uninstall or Disable Unnecessary Services on Enterprise Assets and Software",
    description: "Uninstall or disable unnecessary services on enterprise assets and software, such as an unused file sharing service, web application module, or service function.",
    implementationGroup: "IG2",
    assetType: ["Devices", "Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Uninstall",
      "Disable"
    ],
    coreRequirements: [ // Green - The "what"
      "unnecessary services"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise assets",
      "Software"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Unused file sharing service",
      "Web Application Module",
      "Service Function"
    ],
    relatedSafeguards: ["4.1"]  },
  "4.9": {
    id: "4.9",
    title: "Configure Trusted DNS Servers on Enterprise Assets",
    description: "Configure trusted DNS servers on network infrastructure. Example implementations include configuring network devices to use enterprise-controlled DNS servers and/or reputable externally accessible DNS servers.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Configure"
    ],
    coreRequirements: [ // Green - The "what"
      "trusted DNS servers"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Configuring assets to use enterprise-controlled DNS servers",
      "Reputable externally accessible DNS servers"
    ],
    relatedSafeguards: ["4.1", "8.6", "9.2"]  },
  "4.10": {
    id: "4.10",
    title: "Enforce Automatic Device Lockout on Portable End-User Devices",
    description: "Enforce automatic device lockout following a predetermined threshold of local failed authentication attempts on portable end-user devices, where supported. For laptops, do not allow more than 20 failed authentication attempts; for tablets and smartphones, no more than 10 failed authentication attempts. Example implementations include Microsoft® InTune Device Lock and Apple® Configuration Profile maxFailedAttempts.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Enforce",
      "Where supported",
      "Do not allow more than 20 Failed Authentication Attempts",
      "No more than 10 Failed Authentication Attempts"
    ],
    coreRequirements: [ // Green - The "what"
      "automatic device lockout"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Predetermined threshold of local failed authentication attempts",
      "Portable end-user devices",
      "Laptops",
      "Tablets and smartphones"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Microsoft® InTune Device Lock",
      "Apple® Configuration Profile maxFailedAttempts"
    ],
    relatedSafeguards: ["4.1"]  },
  "4.11": {
    id: "4.11",
    title: "Enforce Remote Wipe Capability on Portable End-User Devices",
    description: "Remotely wipe enterprise data from enterprise-owned portable end-user devices when deemed appropriate such as lost or stolen devices, or when an individual no longer supports the enterprise.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "When deemed appropriate"
    ],
    coreRequirements: [ // Green - The "what"
      "Remotely wipe enterprise data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Portable end-user devices"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Lost devices",
      "Stolen devices",
      "When an individual no longer supports the enterprise"
    ],
    relatedSafeguards: ["4.1"]  },
  "4.12": {
    id: "4.12",
    title: "Separate Enterprise Workspaces on Mobile End-User Devices",
    description: "Ensure separate enterprise workspaces are used on mobile end-user devices, where supported. Example implementations include using an Apple® Configuration Profile or Android™ Work Profile to separate enterprise applications and data from personal applications and data.",
    implementationGroup: "IG3",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "Where Supported"
    ],
    coreRequirements: [ // Green - The "what"
      "Separate enterprise workspaces",
      "On Mobile Devices",
      "Separate"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Data",
      "Enterprise Applications",
      "Personal Data",
      "Personal Applications"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Apple® Configuration Profile",
      "AndroidTM Work Profile"
    ],
    relatedSafeguards: ["4.1"]  },
  "5.1": {
    id: "5.1",
    title: "Establish and Maintain an Inventory of Accounts",
    description: "Establish and maintain an inventory of all accounts managed in the enterprise. The inventory must at a minimum include user, administrator, and service accounts. The inventory, at a minimum, should contain the person’s name, username, start/stop dates, and department. Validate that all active accounts are authorized, on a recurring schedule at a minimum quarterly, or more frequently.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Validate that all active accounts are authorized",
      "Recurring schedule",
      "Must include",
      "Minimum Quarterly",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Inventory of Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "User Accounts",
      "Administrator Accounts",
      "Name",
      "Username",
      "Start Stop Dates",
      "Department"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "5.2", "5.3", "5.4", "5.5", "5.6", "6.1", "6.2", "6.7", "12.8"]  },
  "5.2": {
    id: "5.2",
    title: "Use Unique Passwords",
    description: "Use unique passwords for all enterprise assets. Best practice implementation includes, at a minimum, an 8-character password for accounts using Multi-Factor Authentication (MFA) and a 14-character password for accounts not using MFA.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "At a minimum",
      "8-character password for accounts using MFA",
      "14-character password for accounts not using MFA"
    ],
    coreRequirements: [ // Green - The "what"
      "Unique Passwords"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "All Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["5.1"]  },
  "5.3": {
    id: "5.3",
    title: "Disable Dormant Accounts",
    description: "Delete or disable any dormant accounts after a period of 45 days of inactivity, where supported.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Disable",
      "Delete",
      "Period of 45 days of inactivity",
      "where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "Dormant Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["5.1"]  },
  "5.4": {
    id: "5.4",
    title: "Restrict Administrator Privileges to Dedicated Administrator Accounts",
    description: "Restrict administrator privileges to dedicated administrator accounts on enterprise assets. Conduct general computing activities, such as internet browsing, email, and productivity suite use, from the user’s primary, non-privileged account.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Restrict"
    ],
    coreRequirements: [ // Green - The "what"
      "Administrator Privileges",
      "Dedicated Admin Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise assets",
      "User's primary, non-privileged account",
      "General Computing Activities"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Internet browsing",
      "Email",
      "Productivity suite use"
    ],
    relatedSafeguards: ["4.1", "5.1"]  },
  "5.5": {
    id: "5.5",
    title: "Establish and Maintain an Inventory of Service Accounts",
    description: "Establish and maintain an inventory of service accounts. The inventory, at a minimum, must contain department owner, review date, and purpose. Perform service account reviews to validate that all active accounts are authorized, on a recurring schedule at a minimum quarterly, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Perform service account reviews to validate that all active accounts are authorized",
      "at a minimum, must contain",
      "On a recurring schedule",
      "At a minimum quarterly",
      "More frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "Inventory of Service Accounts"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Department Owner",
      "Review date",
      "Purpose"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["5.1"]  },
  "5.6": {
    id: "5.6",
    title: "Centralize Account Management",
    description: "Centralize account management through a directory or identity service.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Centralize"
    ],
    coreRequirements: [ // Green - The "what"
      "Account Management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Directory Service",
      "Identity Service"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["5.1", "6.6", "6.7", "12.5"]  },
  "6.1": {
    id: "6.1",
    title: "Establish an Access Granting Process",
    description: "Establish and follow a documented process, preferably automated, for granting access to enterprise assets upon new hire or role change of a user.",
    implementationGroup: "IG1",
    assetType: ["Documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Follow"
    ],
    coreRequirements: [ // Green - The "what"
      "Documented Access Granting Process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "New Hire",
      "Role Change",
      "Enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Preferably automated"
    ],
    relatedSafeguards: ["5.1", "6.7", "6.8"]  },
  "6.2": {
    id: "6.2",
    title: "Establish an Access Revoking Process",
    description: "Establish and follow a process, preferably automated, for revoking access to enterprise assets, through disabling accounts immediately upon termination, rights revocation, or role change of a user. Disabling accounts, instead of deleting accounts, may be necessary to preserve audit trails.",
    implementationGroup: "IG1",
    assetType: ["Documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Follow",
      "Disabling Accounts, instead of Deleting accounts, may be necessary to preserve audit trails"
    ],
    coreRequirements: [ // Green - The "what"
      "Access Revoking Process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Role Change",
      "Termination",
      "Enterprise assets",
      "Rights revocation",
      "Disabling accounts immediately"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Preferably Automated"
    ],
    relatedSafeguards: ["5.1", "6.7"]  },
  "6.3": {
    id: "6.3", 
    title: "Require MFA for Externally-Exposed Applications",
    description: "Require all externally-exposed enterprise or third-party applications to enforce MFA, where supported. Enforcing MFA through a directory service or SSO provider is a satisfactory implementation of this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Require",
      "Enforce",
      "Where Supported"
    ],
    coreRequirements: [ // Green - The "what"
      "MFA",
      "ALL Externally Exposed Applications"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Enforcing MFA Through",
      "Directory service",
      "SSO Provider"
    ],
    relatedSafeguards: ["2.1", "4.1"]  },
  "6.4": {
    id: "6.4",
    title: "Require MFA for Remote Network Access",
    description: "Require MFA for remote network access.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Require"
    ],
    coreRequirements: [ // Green - The "what"
      "MFA",
      "Remote Network Access"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.2", "12.7"]  },
  "6.5": {
    id: "6.5",
    title: "Require MFA for Administrative Access",
    description: "Require MFA for all administrative access accounts, where supported, on all enterprise assets, whether managed on-site or through a service provider.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Require",
      "Where Supported"
    ],
    coreRequirements: [ // Green - The "what"
      "All Admin Access Accounts",
      "MFA"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Onsite Management",
      "Service Provider",
      "All enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "6.6": {
    id: "6.6",
    title: "Establish and Maintain an Inventory of Authentication and Authorization Systems",
    description: "Establish and maintain an inventory of the enterprise’s authentication and authorization systems, including those hosted on-site or at a remote service provider. Review and update the inventory, at a minimum, annually, or more frequently.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "maintain",
      "Review and update inventory",
      "At a minimum Annually",
      "More frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "inventory of the enterprise's authentication and authorization systems"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "hosted on-site",
      "Remote Service Provider"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "3.3", "5.6", "6.7"]  },
  "6.7": {
    id: "6.7",
    title: "Centralize Access Control",
    description: "Centralize access control for all enterprise assets through a directory service or SSO provider, where supported.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Centralize",
      "Where Supported"
    ],
    coreRequirements: [ // Green - The "what"
      "access control"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Directory Service",
      "SSO Provider",
      "All enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1", "5.1", "5.6", "6.1", "6.2", "6.6", "12.5", "12.7"]  },
  "6.8": {
    id: "6.8",
    title: "Define and Maintain Role-Based Access Control",
    description: "Define and maintain role-based access control, through determining and documenting the access rights necessary for each role within the enterprise to successfully carry out its assigned duties. Perform access control reviews of enterprise assets to validate that all privileges are authorized, on a recurring schedule at a minimum annually, or more frequently.",
    implementationGroup: "IG3",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Define",
      "maintain",
      "Perform access control reviews of enterprise assets to validate that all privileges are authorized, on a recurring schedule",
      "At a minimum Annually",
      "More frequently",
      "Necessary"
    ],
    coreRequirements: [ // Green - The "what"
      "role-based access control"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Determining",
      "Documenting",
      "Access rights",
      "Each Role",
      "carry out its assigned duties"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Identity and Access management Tool"
    ],
    relatedSafeguards: ["3.3", "4.1", "6.1"]  },
  "7.1": {
    id: "7.1",
    title: "Establish and Maintain a Vulnerability Management Process",
    description: "Establish and maintain a documented vulnerability management process for enterprise assets. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update documentation",
      "When significant enterprise changes occur that could impact this Safeguard",
      "Annually"
    ],
    coreRequirements: [ // Green - The "what"
      "vulnerability management process",
      "documented"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"]  },
  "7.2": {
    id: "7.2",
    title: "Establish and Maintain a Remediation Process",
    description: "Establish and maintain a risk-based remediation strategy documented in a remediation process, with monthly, or more frequent, reviews.",
    implementationGroup: "IG1",
    assetType: ["Software"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Reviews",
      "Monthly",
      "More frequent"
    ],
    coreRequirements: [ // Green - The "what"
      "remediation process",
      "Documented",
      "Risk based Remediation strategy"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["7.1", "7.3", "7.4", "7.5", "7.6", "7.7"]  },
  "7.3": {
    id: "7.3",
    title: "Perform Automated Operating System Patch Management",
    description: "Perform operating system updates on enterprise assets through automated patch management on a monthly, or more frequent, basis.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Perform",
      "Monthly",
      "More frequent"
    ],
    coreRequirements: [ // Green - The "what"
      "Patch Management",
      "Automated"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Assets",
      "Operating System Updates"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "4.1", "7.1", "7.2", "7.4", "7.5"]  },
  "7.4": {
    id: "7.4",
    title: "Perform Automated Application Patch Management",
    description: "Perform application updates on enterprise assets through automated patch management on a monthly, or more frequent, basis.",
    implementationGroup: "IG1",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Perform",
      "Monthly",
      "More frequent"
    ],
    coreRequirements: [ // Green - The "what"
      "Patch Management",
      "Automated"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Application Updates",
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "2.2", "7.1", "7.2", "7.3", "7.5"]  },
  "7.5": {
    id: "7.5",
    title: "Perform Automated Vulnerability Scans of Internal Enterprise Assets",
    description: "Perform automated vulnerability scans of internal enterprise assets on a quarterly, or more frequent, basis. Conduct both authenticated and unauthenticated scans.",
    implementationGroup: "IG2",
    assetType: ["Devices", "Software"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Perform",
      "Quarterly",
      "More frequent"
    ],
    coreRequirements: [ // Green - The "what"
      "Vulnerability Scans",
      "Automated",
      "Internal Assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Authenticated",
      "Unauthenticated",
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "7.1", "7.2", "7.3", "7.4", "7.6", "7.7"]  },
  "7.6": {
    id: "7.6",
    title: "Perform Automated Vulnerability Scans of Externally-Exposed Enterprise Assets",
    description: "Perform automated vulnerability scans of externally-exposed enterprise assets. Perform scans on a monthly, or more frequent, basis.",
    implementationGroup: "IG2",
    assetType: ["Devices", "Software"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Perform",
      "Perform scans",
      "Monthly",
      "More frequent"
    ],
    coreRequirements: [ // Green - The "what"
      "Vulnerability Scans",
      "Automated",
      "Externally Exposed"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "7.1", "7.2", "7.5", "7.7"]  },
  "7.7": {
    id: "7.7",
    title: "Remediate Detected Vulnerabilities",
    description: "Remediate detected vulnerabilities in software through processes and tooling on a monthly, or more frequent, basis, based on the remediation process.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Remediate",
      "Monthly",
      "More frequent",
      "Through"
    ],
    coreRequirements: [ // Green - The "what"
      "Vulnerability Remediation Process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Software",
      "Processes",
      "Tooling"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6"]  },
  "8.1": {
    id: "8.1",
    title: "Establish and Maintain an Audit Log Management Process",
    description: "Establish and maintain a documented audit log management process that defines the enterprise’s logging requirements. At a minimum, address the collection, review, and retention of audit logs for enterprise assets. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update documentation",
      "when significant enterprise changes occur that could impact this Safeguard",
      "annually",
      "minimum"
    ],
    coreRequirements: [ // Green - The "what"
      "documented audit log management process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enterprise assets",
      "Audit logs",
      "enterprise's logging requirements",
      "collection",
      "review",
      "retention"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.2", "8.3", "8.5", "8.6", "8.7", "8.8", "8.9", "8.10", "8.11", "8.12"]  },
  "8.2": {
    id: "8.2", 
    title: "Collect Audit Logs",
    description: "Collect audit logs. Ensure that logging, per the enterprise’s audit log management process, has been enabled across enterprise assets.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Collect",
      "per the enterprise's audit log management process"
    ],
    coreRequirements: [ // Green - The "what"
      "Audit Logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Logging",
      "enabled",
      "enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.1"]  },
  "8.3": {
    id: "8.3",
    title: "Ensure Adequate Audit Log Storage", 
    description: "Ensure that logging destinations maintain adequate storage to comply with the enterprise’s audit log management process.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "maintain",
      "comply",
      "The Enterprise's audit log management process"
    ],
    coreRequirements: [ // Green - The "what"
      "Adequate Storage (for Logs)"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "logging destinations"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.1", "8.9", "8.10"]  },
  "8.4": {
    id: "8.4",
    title: "Standardize Time Synchronization",
    description: "Standardize time synchronization. Configure at least two synchronized time sources across enterprise assets, where supported.",
    implementationGroup: "IG2", 
    assetType: ["enterprise assets", "Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Standardize",
      "Configure",
      "at least two",
      "where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "Time Syncronization"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enterprise assets",
      "time sources",
      "synchronized"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "8.5": {
    id: "8.5",
    title: "Collect Detailed Audit Logs",
    description: "Configure detailed audit logging for enterprise assets containing sensitive data. Include event source, date, username, timestamp, source addresses, destination addresses, and other useful elements that could assist in a forensic investigation.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "Data"],
    securityFunction: ["Detect"], 
    governanceElements: [ // Orange - MUST be met
      "Configure"
    ],
    coreRequirements: [ // Green - The "what"
      "Detailed Audit Logs",
      "enterprise assets containing sensitive data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Could Assist in a Forensic Investigation",
      "event source",
      "date",
      "username",
      "timestamp",
      "source addresses",
      "destination addresses",
      "other useful elements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.1", "1.1", "3.2"]  },
  "8.6": {
    id: "8.6",
    title: "Collect DNS Query Audit Logs", 
    description: "Collect DNS query audit logs on enterprise assets, where appropriate and supported.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "Data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "where appropriate",
      "Collect",
      "where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "DNS query logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.1", "4.9"]  },
  "8.7": {
    id: "8.7",
    title: "Collect URL Request Audit Logs",
    description: "Collect URL request audit logs on enterprise assets, where appropriate and supported.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "Data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "where appropriate",
      "Collect",
      "where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "URL request audit logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.1"]  },
  "8.8": {
    id: "8.8",
    title: "Collect Command-Line Audit Logs",
    description: "Collect command-line audit logs. Example implementations include collecting audit logs from PowerShell®, BASH™, and remote administrative terminals.",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Collect"
    ],
    coreRequirements: [ // Green - The "what"
      "command-line audit logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Collecting Audit Logs From:",
      "PowerShell",
      "BASHTM",
      "remote administrative terminals"
    ],
    relatedSafeguards: ["8.1"]  },
  "8.9": {
    id: "8.9",
    title: "Centralize Audit Logs",
    description: "Centralize, to the extent possible, audit log collection and retention across enterprise assets in accordance with the documented audit log management process. Example implementations primarily include leveraging a SIEM tool to centralize multiple log sources.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "Data"],
    securityFunction: ["Detect"], 
    governanceElements: [ // Orange - MUST be met
      "Centralize",
      "to the extent possible"
    ],
    coreRequirements: [ // Green - The "what"
      "audit log collection",
      "audit log retention"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enterprise assets",
      "in accordance with documented audit log management process"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Leveraging a SIEM tool to centralize multiple log sources"
    ],
    relatedSafeguards: ["8.1", "8.3", "12.5", "13.1"]  },
  "8.10": {
    id: "8.10",
    title: "Retain Audit Logs", 
    description: "Retain audit logs across enterprise assets for a minimum of 90 days.",
    implementationGroup: "IG2",
    assetType: ["enterprise assets", "Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Retain",
      "minimum of 90 days"
    ],
    coreRequirements: [ // Green - The "what"
      "Audit Logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.1", "8.3"]  },
  "8.11": {
    id: "8.11",
    title: "Conduct Audit Log Reviews",
    description: "Conduct reviews of audit logs to detect anomalies or abnormal events that could indicate a potential threat. Conduct reviews on a weekly, or more frequent, basis.",
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Conduct Reviews",
      "weekly",
      "more frequent"
    ],
    coreRequirements: [ // Green - The "what"
      "Review Audit Logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Could Indicate a potential threat",
      "anomalies",
      "abnormal events"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.1", "8.12"]  },
  "8.12": {
    id: "8.12",
    title: "Collect Service Provider Logs",
    description: "Collect service provider logs, where supported. Example implementations include collecting authentication and authorization events, data creation and disposal events, and user management events.",
    implementationGroup: "IG3",
    assetType: ["Data"], 
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Collect",
      "where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "Service provider logs"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Collecting authentication events",
      "Collecting authorization events",
      "data creation events",
      "disposal events",
      "user management events"
    ],
    relatedSafeguards: ["8.1", "8.11", "15.1"]  },
  "9.1": {
    id: "9.1",
    title: "Ensure Use of Only Fully Supported Browsers and Email Clients",
    description: "Ensure only fully supported browsers and email clients are allowed to execute in the enterprise, only using the latest version of browsers and email clients provided through the vendor.",
    implementationGroup: "IG1",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "only using the latest version provided through the vendor"
    ],
    coreRequirements: [ // Green - The "what"
      "Only Fully Supported",
      "Browsers",
      "Email Clients"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Allowed to execute"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "4.1", "7.4"]  },
  "9.2": {
    id: "9.2",
    title: "Use DNS Filtering Services",
    description: "Use DNS filtering services on all end-user devices, including remote and on-premises assets, to block access to known malicious domains.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use"
    ],
    coreRequirements: [ // Green - The "what"
      "DNS Filtering Service"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "All End-user devices",
      "Remote assets",
      "On-premise assets",
      "Block Access to Known Malicious Domains"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1", "4.9"]  },
  "9.3": {
    id: "9.3",
    title: "Maintain and Enforce Network-Based URL Filters",
    description: "Enforce and update network-based URL filters to limit an enterprise asset from connecting to potentially malicious or unapproved websites. Example implementations include category-based filtering, reputation-based filtering, or through the use of block lists. Enforce filters for all enterprise assets.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Enforce",
      "Update",
      "Enforce Filters"
    ],
    coreRequirements: [ // Green - The "what"
      "network-based URL filters"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Limit enterprise Asset from connecting to",
      "Unapproved Websites",
      "Potentially Malicious Websites"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "block lists",
      "reputation-based filtering",
      "Category based methods"
    ],
    relatedSafeguards: ["4.1"]  },
  "9.4": {
    id: "9.4",
    title: "Restrict Unnecessary or Unauthorized Browser and Email Client Extensions",
    description: "Restrict, either through uninstalling or disabling, any unauthorized or unnecessary browser or email client plugins, extensions, and add-on applications.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Restrict"
    ],
    coreRequirements: [ // Green - The "what"
      "Uninstalling",
      "Disabling",
      "Unauthorized",
      "Unnecessary"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Browser Client Plugins",
      "Email Client Plugins",
      "Browser Extensions",
      "Browser / Email Client Add-on applications"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "9.5": {
    id: "9.5",
    title: "Implement DMARC",
    description: "To lower the chance of spoofed or modified emails from valid domains, implement DMARC policy and verification, starting with implementing the Sender Policy Framework (SPF) and the DomainKeys Identified Mail (DKIM) standards.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Implement",
      "Implement Verification",
      "Standards"
    ],
    coreRequirements: [ // Green - The "what"
      "DMARC policy"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Sender Policy Framework (SPF)",
      "DomainKeys Identified Mail (DKIM)",
      "to lower the chance of spoofed or modified emails from valid domains"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "9.6": {
    id: "9.6",
    title: "Block Unnecessary File Types",
    description: "Block unnecessary file types attempting to enter the enterprise’s email gateway.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Block"
    ],
    coreRequirements: [ // Green - The "what"
      "Unnecessary file types",
      "At the Email Gateway"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "9.7": {
    id: "9.7",
    title: "Deploy and Maintain Email Server Anti-Malware Protections",
    description: "Deploy and maintain email server anti-malware protections, such as attachment scanning and/or sandboxing.",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Deploy",
      "Maintain"
    ],
    coreRequirements: [ // Green - The "what"
      "email server anti-malware protections"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Attachment Scanning",
      "Sandboxing"
    ],
    relatedSafeguards: ["4.1", "10.1"]  },
  "10.1": {
    id: "10.1",
    title: "Deploy and Maintain Anti-Malware Software",
    description: "Deploy and maintain anti-malware software on all enterprise assets.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "deploy",
      "maintain"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-malware software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "all enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1", "10.2", "10.4", "10.6", "10.7", "13.5"]  },
  "10.2": {
    id: "10.2",
    title: "Configure Automatic Anti-Malware Signature Updates",
    description: "Configure automatic updates for anti-malware signature files on all enterprise assets.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "configure"
    ],
    coreRequirements: [ // Green - The "what"
      "automatic updates",
      "anti-malware signature files"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "all enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["10.1"]  },
  "10.3": {
    id: "10.3", 
    title: "Disable Autorun and Autoplay for Removable Media",
    description: "Disable autorun and autoplay auto-execute functionality for removable media.",
    implementationGroup: "IG1",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "disable"
    ],
    coreRequirements: [ // Green - The "what"
      "Auto Run",
      "autoplay",
      "Auto-execute"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "removable media"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.1"]  },
  "10.4": {
    id: "10.4",
    title: "Configure Automatic Anti-Malware Scanning of Removable Media", 
    description: "Configure anti-malware software to automatically scan removable media.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "configure"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-malware software",
      "automatically scan"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "removable media"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["10.1"]  },
  "10.5": {
    id: "10.5",
    title: "Enable Anti-Exploitation Features",
    description: "Enable anti-exploitation features on enterprise assets and software, where possible, such as Microsoft® Data Execution Prevention (DEP), Windows® Defender Exploit Guard (WDEG), or Apple® System Integrity Protection (SIP) and Gatekeeper™.",
    implementationGroup: "IG2", 
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "enable",
      "where possible"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-exploitation features"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "enterprise assets",
      "software"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Microsoft® Data Execution Prevention (DEP)",
      "Windows® Defender Exploit Guard (WDEG)",
      "Apple® System Integrity Protection (SIP)",
      "GatekeeperTM"
    ],
    relatedSafeguards: ["4.1"]  },
  "10.6": {
    id: "10.6",
    title: "Centrally Manage Anti-Malware Software", 
    description: "Centrally manage anti-malware software.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "centrally manage"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-malware software"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["10.1"]  },
  "10.7": {
    id: "10.7",
    title: "Use Behavior-Based Anti-Malware Software",
    description: "Use behavior-based anti-malware software.", 
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "use"
    ],
    coreRequirements: [ // Green - The "what"
      "anti-malware software",
      "behavior-based"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["10.1"]  },
  "11.1": {
    id: "11.1",
    title: "Establish and Maintain a Data Recovery Process",
    description: "Establish and maintain a documented data recovery process that includes detailed backup procedures. In the process, address the scope of data recovery activities, recovery prioritization, and the security of backup data. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish",
      "maintain",
      "review and update documentation",
      "when significant enterprise changes occur that could impact this Safeguard",
      "annually"
    ],
    coreRequirements: [ // Green - The "what"
      "documented data recovery process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "scope of data recovery activities",
      "recovery prioritization",
      "security of backup data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.2", "3.4", "3.5", "3.8", "11.2", "11.3", "11.4", "11.5"]  },
  "11.2": {
    id: "11.2", 
    title: "Perform Automated Backups",
    description: "Perform automated backups of in-scope enterprise assets. Run backups weekly, or more frequently, based on the sensitivity of the data.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "perform",
      "run backups",
      "weekly",
      "more frequently",
      "Based on Sensitivity"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Scope",
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "2.1", "11.1"]  },
  "11.3": {
    id: "11.3",
    title: "Protect Recovery Data", 
    description: "Protect recovery data with equivalent controls to the original data. Reference encryption or data separation, based on requirements.",
    implementationGroup: "IG1",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "protect",
      "based on requirements",
      "reference encryption",
      "data separation"
    ],
    coreRequirements: [ // Green - The "what"
      "recovery data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "equivalent controls to original data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["3.3", "3.10", "3.11", "11.1"]  },
  "11.4": {
    id: "11.4",
    title: "Establish and Maintain an Isolated Instance of Recovery Data",
    description: "Establish and maintain an isolated instance of recovery data. Example implementations include, version controlling backup destinations through offline, cloud, or off-site systems or services.",
    implementationGroup: "IG1", 
    assetType: ["Data"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "establish",
      "maintain"
    ],
    coreRequirements: [ // Green - The "what"
      "isolated instance of recovery data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "version controlling backup destinations",
      "offline",
      "cloud",
      "off-site systems",
      "services"
    ],
    relatedSafeguards: ["11.1"]  },
  "11.5": {
    id: "11.5",
    title: "Test Data Recovery",
    description: "Test backup recovery quarterly, or more frequently, for a sampling of in-scope enterprise assets.", 
    implementationGroup: "IG2",
    assetType: ["Data"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "quarterly",
      "more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "test backup recovery"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "sampling",
      "In-Scope",
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["11.1"]  },
  "12.1": {
    id: "12.1",
    title: "Ensure Network Infrastructure is Up-to-Date",
    description: "Ensure network infrastructure is kept up-to-date. Example implementations include running the latest stable release of software and/or using currently supported network as a service (NaaS) offerings. Review software versions monthly, or more frequently, to verify software support.",
    implementationGroup: "IG1",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "ensure",
      "Review software versions to verify software support",
      "monthly",
      "more frequently"
    ],
    coreRequirements: [ // Green - The "what"
      "network infrastructure is kept up-to-date"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "running the latest stable release of software",
      "using currently supported network-as-a-service (NaaS) offerings"
    ],
    relatedSafeguards: ["4.2", "7.3"]  },
  "12.2": {
    id: "12.2",
    title: "Establish and Maintain a Secure Network Architecture",
    description: "Design and maintain a secure network architecture. A secure network architecture must address segmentation, least privilege, and availability, at a minimum. Example implementations may include documentation, policy, and design components.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "design",
      "maintain",
      "must address",
      "Minimum"
    ],
    coreRequirements: [ // Green - The "what"
      "secure network architecture"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "segmentation",
      "POLP - Least Privilege",
      "availability"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "documentation",
      "policy",
      "design components"
    ],
    relatedSafeguards: ["3.3", "3.10", "4.2", "12.4", "13.3", "13.4", "13.6", "13.8", "13.9", "13.10"]  },
  "12.3": {
    id: "12.3",
    title: "Securely Manage Network Infrastructure",
    description: "Securely manage network infrastructure. Example implementations include version-controlled Infrastructure-as-Code (IaC), and the use of secure network protocols, such as SSH and HTTPS.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
    ],
    coreRequirements: [ // Green - The "what"
      "secure network management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network management and monitoring tool",
      "version-controlled infrastructure-as-code",
      "Use of Secure Protocols",
      "SSH",
      "HTTPS"
    ],
    relatedSafeguards: ["4.2", "12.6"]  },
  "12.4": {
    id: "12.4",
    title: "Establish and Maintain Architecture Diagram(s)",
    description: "Establish and maintain architecture diagram(s) and/or other network system documentation. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["documentation"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish",
      "maintain",
      "review and update documentation",
      "annually",
      "when significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Architecture Diagram(s)",
      "network system documentation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network architecture diagramming tool"
    ],
    relatedSafeguards: ["3.8", "4.2", "12.2"]  },
  "12.5": {
    id: "12.5",
    title: "Centralize Network Authentication, Authorization, and Auditing (AAA)",
    description: "Centralize network AAA.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "centralize"
    ],
    coreRequirements: [ // Green - The "what"
      "network AAA"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "authentication",
      "authorization",
      "auditing"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["4.2", "5.6", "6.7", "8.9", "12.6", "12.7"]  },
  "12.6": {
    id: "12.6",
    title: "Use of Secure Network Management and Communication Protocols",
    description: "Adopt secure network management protocols (e.g., 802.1X) and secure communication protocols (e.g., Wi-Fi Protected Access 2 (WPA2) Enterprise or more secure alternatives).",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use",
      "greater"
    ],
    coreRequirements: [ // Green - The "what"
      "secure network management",
      "secure communication protocols"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "802.1X",
      "WPA2 Enterprise"
    ],
    relatedSafeguards: ["12.3", "12.5"]  },
  "12.7": {
    id: "12.7",
    title: "Ensure Remote Devices Utilize a VPN and are Connecting to an Enterprise’s AAA Infrastructure",
    description: "Require users to authenticate to enterprise-managed VPN and authentication services prior to accessing enterprise resources on end-user devices.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "require",
      "prior to accessing enterprise resources on end-user devices"
    ],
    coreRequirements: [ // Green - The "what"
      "enterprise-managed VPN",
      "authentication services",
      "Users Required to Authenticate"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["6.4", "12.5"]  },
  "12.8": {
    id: "12.8",
    title: "Establish and Maintain Dedicated Computing Resources for All Administrative Work",
    description: "Establish and maintain dedicated computing resources, either physically or logically separated, for all administrative tasks or tasks requiring administrative access. The computing resources should be segmented from the enterprise's primary network and not be allowed internet access.",
    implementationGroup: "IG3",
    assetType: ["Devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "establish",
      "maintain"
    ],
    coreRequirements: [ // Green - The "what"
      "dedicated computing resources (SAW)",
      "For all administrative tasks",
      "tasks requiring administrative access"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "segmented from primary network",
      "No Internet",
      "Physically",
      "Logically"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "5.1"]  },
  "13.1": {
    id: "13.1",
    title: "Centralize Security Event Alerting",
    description: "Centralize security event alerting across enterprise assets for log correlation and analysis. Best practice implementation requires the use of a SIEM, which includes vendor-defined event correlation alerts. A log analytics platform configured with security-relevant correlation alerts also satisfies this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["network", "Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Centralize"
    ],
    coreRequirements: [ // Green - The "what"
      "Security Event Alerting"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Log Correlation",
      "Analysis",
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "SIEM",
      "Log Analytics Platform",
      "Vendor-defined Event Correlation Alerts",
      "Security-relevant correlation alerts"
    ],
    relatedSafeguards: ["8.1", "8.2", "8.11", "13.2", "13.3", "13.11"]  },
  "13.2": {
    id: "13.2", 
    title: "Deploy a Host-Based Intrusion Detection Solution",
    description: "Deploy a host-based intrusion detection solution on enterprise assets, where appropriate and/or supported.",
    implementationGroup: "IG2",
    assetType: ["Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "deploy",
      "Where appropriate",
      "Where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "host-based intrusion detection solution"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["1.1", "13.1", "13.3", "13.7"]  },
  "13.3": {
    id: "13.3",
    title: "Deploy a Network Intrusion Detection Solution", 
    description: "Deploy a network intrusion detection solution on enterprise assets, where appropriate. Example implementations include the use of a Network Intrusion Detection System (NIDS) or equivalent cloud service provider (CSP) service.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "deploy",
      "Where Appropriate"
    ],
    coreRequirements: [ // Green - The "what"
      "network intrusion detection solution"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Network Intrusion Detection System (NIDS)",
      "Equivalent CSP Service"
    ],
    relatedSafeguards: ["13.1", "13.2", "13.8"]  },
  "13.4": {
    id: "13.4",
    title: "Perform Traffic Filtering Between Network Segments",
    description: "Perform traffic filtering between network segments, where appropriate.",
    implementationGroup: "IG2", 
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Perform",
      "Where Appropriate"
    ],
    coreRequirements: [ // Green - The "what"
      "traffic filtering between network segments"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["12.2", "12.3", "13.9"]  },
  "13.5": {
    id: "13.5",
    title: "Manage Access Control for Remote Assets",
    description: "Manage access control for assets remotely connecting to enterprise resources. Determine amount of access to enterprise resources based on: up-to-date anti-malware software installed, configuration compliance with the enterprise’s secure configuration process, and ensuring the operating system and applications are up-to-date.",
    implementationGroup: "IG2",
    assetType: ["Devices", "network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Manage"
    ],
    coreRequirements: [ // Green - The "what"
      "Access Control",
      "Remote Assets"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Connecting to Enterprise Resources",
      "Determine Amount of access Based on:",
      "Anti Malware Software Installed",
      "Up to date Anti Malware Signatures / Version",
      "Up to Date OS",
      "Up to date Applications",
      "Compliant with Configuration Process"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["6.1", "10.1", "10.7", "12.1", "13.2"]  },
  "13.6": {
    id: "13.6",
    title: "Collect Network Traffic Flow Logs",
    description: "Collect network traffic flow logs and/or network traffic to review and alert upon from network devices.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Collect"
    ],
    coreRequirements: [ // Green - The "what"
      "Network Traffic Flow logs",
      "Network Traffic"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Network Devices",
      "Review",
      "Alert"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["8.5", "13.1", "13.3"]  },
  "13.7": {
    id: "13.7",
    title: "Deploy a Host-Based Intrusion Prevention Solution",
    description: "Deploy a host-based intrusion prevention solution on enterprise assets, where appropriate and/or supported. Example implementations include use of an Endpoint Detection and Response (EDR) client or host-based IPS agent.",
    implementationGroup: "IG3",
    assetType: ["Devices"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "deploy",
      "Where appropriate",
      "Where supported"
    ],
    coreRequirements: [ // Green - The "what"
      "Host-based Intrusion Prevention Solution (IPS)"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "EDR",
      "Host Based IPS Agent"
    ],
    relatedSafeguards: ["13.2", "13.8"]  },
  "13.8": {
    id: "13.8",
    title: "Deploy a Network Intrusion Prevention Solution",
    description: "Deploy a network intrusion prevention solution, where appropriate. Example implementations include the use of a Network Intrusion Prevention System (NIPS) or equivalent CSP service.",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "deploy",
      "Where Appropriate"
    ],
    coreRequirements: [ // Green - The "what"
      "network intrusion prevention solution"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["13.3", "13.7"]  },
  "13.9": {
    id: "13.9",
    title: "Deploy Port-Level Access Control",
    description: "Deploy port-level access control. Port-level access control utilizes 802.1x, or similar network access control protocols, such as certificates, and may incorporate user and/or device authentication.",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Deploy"
    ],
    coreRequirements: [ // Green - The "what"
      "port-level access control"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "802.1x",
      "similar network access control protocols",
      "User Authentication",
      "Device Authentication"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Certificate Based"
    ],
    relatedSafeguards: ["12.7", "13.4"]  },
  "13.10": {
    id: "13.10",
    title: "Perform Application Layer Filtering",
    description: "Perform application layer filtering. Example implementations include a filtering proxy, application layer firewall, or gateway.",
    implementationGroup: "IG3",
    assetType: ["network", "Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Perform"
    ],
    coreRequirements: [ // Green - The "what"
      "application layer filtering"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Filtering Proxy",
      "Application Layer Firewall",
      "Gateway"
    ],
    relatedSafeguards: ["13.4", "16.11"]  },
  "13.11": {
    id: "13.11",
    title: "Tune Security Event Alerting Thresholds",
    description: "Tune security event alerting thresholds monthly, or more frequently.",
    implementationGroup: "IG3",
    assetType: ["network", "Devices"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Tune Alerts",
      "monthly",
      "More Frequently"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["13.1", "8.11"]  },
  "14.1": {
    id: "14.1",
    title: "Establish and Maintain a Security Awareness Program",
    description: "Establish and maintain a security awareness program. The purpose of a security awareness program is to educate the enterprise’s workforce on how to interact with enterprise assets and data in a secure manner. Conduct training at hire and, at a minimum, annually. Review and update content annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "conduct training at hire",
      "Minimum, annually",
      "Review and update Content",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Security Awareness program",
      "Educate the enterprise’s workforce on how to interact in a secure manner"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Enterprise Assets",
      "Data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8", "14.9"]  },
  "14.2": {
    id: "14.2",
    title: "Train Workforce Members to Recognize Social Engineering Attacks",
    description: "Train workforce members to recognize social engineering attacks, such as phishing, business email compromise (BEC), pretexting, and tailgating.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
    ],
    coreRequirements: [ // Green - The "what"
      "Train workforce to recognize Social Engineering Attacks"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Phishing",
      "Business Email Compromise (BEC)"
    ],
    relatedSafeguards: ["14.1"]  },
  "14.3": {
    id: "14.3",
    title: "Train Workforce Members on Authentication Best Practices",
    description: "Train workforce members on authentication best practices. Example topics include MFA, password composition, and credential management.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
    ],
    coreRequirements: [ // Green - The "what"
      "Train workforce on Authentication Best Practices"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "MFA",
      "Password Composition",
      "Credential Management"
    ],
    relatedSafeguards: ["14.1", "6.2", "6.3"]  },
  "14.4": {
    id: "14.4",
    title: "Train Workforce on Data Handling Best Practices",
    description: "Train workforce members on how to identify and properly store, transfer, archive, and destroy sensitive data. This also includes training workforce members on clear screen and desk best practices, such as locking their screen when they step away from their enterprise asset, erasing physical and virtual whiteboards at the end of meetings, and storing data and assets securely.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
    ],
    coreRequirements: [ // Green - The "what"
      "train workforce members on how to",
      "Identify",
      "Transfer",
      "Archive",
      "Destroy",
      "Properly Store",
      "Sensitive Data"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Clear Screen",
      "Clear Desk"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Locking their screen when they step away from their enterprise asset",
      "Erase physical Whiteboards after meetings",
      "Erase virtual Whiteboards after meetings",
      "Storing Data Securely",
      "Storing Assets Securely"
    ],
    relatedSafeguards: ["14.1", "3.1", "3.2"]  },
  "14.5": {
    id: "14.5",
    title: "Train Workforce Members on Causes of Unintentional Data Exposure",
    description: "Train workforce members to be aware of causes for unintentional data exposure. Example topics include mis-delivery of sensitive data, losing a portable end-user device, or publishing data to unintended audiences.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
    ],
    coreRequirements: [ // Green - The "what"
      "train workforce members to be aware of causes for unintentional data exposure"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Mis-Delivery of Sensitive Data",
      "Losing a Portable End user Device",
      "Publishing data to unintended Audiences"
    ],
    relatedSafeguards: ["14.1", "3.3"]  },
  "14.6": {
    id: "14.6",
    title: "Train Workforce Members on Recognizing and Reporting Security Incidents",
    description: "Train workforce members to be able to recognize a potential incident and be able to report such an incident.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Be able to"
    ],
    coreRequirements: [ // Green - The "what"
      "train workforce members",
      "Recognize a potential Security Incident",
      "Report such an incident"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["14.1", "17.3"]  },
  "14.7": {
    id: "14.7",
    title: "Train Workforce on How to Identify and Report if Their Enterprise Assets are Missing Security Updates",
    description: "Train workforce to understand how to verify and report out-of-date software patches or any failures in automated processes and tools. Part of this training should include notifying IT personnel of any failures in automated processes and tools.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
    ],
    coreRequirements: [ // Green - The "what"
      "Train Workforce members on how to",
      "Verify",
      "Report",
      "out-of-date software patches",
      "Any failures in automated processes",
      "Any failures in automated tools"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Training Should Include",
      "Notifying IT personnel of any failures in automated processes",
      "Notifying IT personnel of any failures in automated tools"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["14.1", "7.3", "7.4"]  },
  "14.8": {
    id: "14.8",
    title: "Train Workforce on the Dangers of Connecting to and Transmitting Enterprise Data Over Insecure Networks",
    description: "Train workforce members on the dangers of connecting to, and transmitting data over, insecure networks for enterprise activities. If the enterprise has remote workers, training must include guidance to ensure that all users securely configure their home network infrastructure.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Must Include"
    ],
    coreRequirements: [ // Green - The "what"
      "Train workforce members on",
      "The dangers of",
      "connecting to insecure networks",
      "transmitting data over insecure networks",
      "Guidance to ensure that all users securely configure their home network infrastructure"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Remote Workers",
      "Enterprise Activities"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["14.1", "12.1"]  },
  "14.9": {
    id: "14.9",
    title: "Conduct Role-Specific Security Awareness and Skills Training",
    description: "Conduct role-specific security awareness and skills training. Example implementations include secure system administration courses for IT professionals, OWASP® Top 10 vulnerability awareness and prevention training for web application developers, and advanced social engineering awareness training for high-profile roles.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Conduct"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "IT Professionals",
      "Web Developers",
      "High-profile roles",
      "Secure system administration courses",
      "OWASP® Top 10 vulnerability awareness and prevention training",
      "advanced social engineering awareness training for high-profile roles"
    ],
    relatedSafeguards: ["14.1", "16.9"]  },
  "15.1": {
    id: "15.1",
    title: "Establish and Maintain an Inventory of Service Providers",
    description: "Establish and maintain an inventory of service providers. The inventory is to list all known service providers, include classification(s), and designate an enterprise contact for each service provider. Review and update the inventory annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update Content",
      "Annually",
      "when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Inventory of Service Providers"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "list all known service providers",
      "Classification(s)",
      "designate an enterprise contact for each service provider"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["2.1", "8.12", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7"]  },
  "15.2": {
    id: "15.2",
    title: "Establish and Maintain a Service Provider Management Policy",
    description: "Establish and maintain a service provider management policy. Ensure the policy addresses the classification, inventory, assessment, monitoring, and decommissioning of service providers. Review and update the policy annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Ensure the policy addresses",
      "Review and update Content",
      "Annually",
      "when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Service Provider Management Policy"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Classification(s)",
      "Inventory",
      "Assessment",
      "Monitoring",
      "Decommissioning of service providers"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["15.1", "15.3", "15.4", "15.5", "15.6", "15.7"]  },
  "15.3": {
    id: "15.3",
    title: "Classify Service Providers",
    description: "Classify service providers. Classification consideration may include one or more characteristics, such as data sensitivity, data volume, availability requirements, applicable regulations, inherent risk, and mitigated risk. Update and review classifications annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Update and Review Classifications",
      "Classify",
      "Annually",
      "when significant enterprise changes occur that could impact this safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Service Providers"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "May Include",
      "One Characteristic",
      "More Characteristics",
      "Data Sensitivity",
      "Data volume",
      "Availability requirements",
      "Applicable regulations",
      "Inherent Risk",
      "Mitigated Risk"
    ],
    relatedSafeguards: ["15.1", "15.2"]  },
  "15.4": {
    id: "15.4",
    title: "Ensure Service Provider Contracts Include Security Requirements",
    description: "Ensure service provider contracts include security requirements. Example requirements may include minimum security program requirements, security incident and/or data breach notification and response, data encryption requirements, and data disposal commitments. These security requirements must be consistent with the enterprise’s service provider management policy. Review service provider contracts annually to ensure contracts are not missing security requirements.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "Must",
      "review service provider contracts annually to ensure contracts are not missing security requirements"
    ],
    coreRequirements: [ // Green - The "what"
      "Service provider contracts include security requirements"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Include Security requirements Consistent with the enterprise's service provider management policy"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Contract Management",
      "minimum security program requirements",
      "security incident and/or data breach notification and response",
      "data encryption requirements",
      "data disposal commitments"
    ],
    relatedSafeguards: ["15.1", "15.2"]  },
  "15.5": {
    id: "15.5",
    title: "Assess Service Providers",
    description: "Assess service providers consistent with the enterprise’s service provider management policy. Assessment scope may vary based on classification(s), and may include review of standardized assessment reports, such as Service Organization Control 2 (SOC 2) and Payment Card Industry (PCI) Attestation of Compliance (AoC), customized questionnaires, or other appropriately rigorous processes. Reassess service providers annually, at a minimum, or with new and renewed contracts.",
    implementationGroup: "IG3",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Consistent with the enterprise's service provider management policy",
      "Reassess service Providers",
      "At a Minimum Annually",
      "With new renewed contracts"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Third-Party Risk Management Tool",
      "Review of Standardized Assesments",
      "other appropriately rigorous processes",
      "PCI-DSS (AoC)",
      "SOC2",
      "Customized questionnaire"
    ],
    relatedSafeguards: ["15.1", "15.2"]  },
  "15.6": {
    id: "15.6",
    title: "Monitor Service Providers",
    description: "Monitor service providers consistent with the enterprise’s service provider management policy. Monitoring may include periodic reassessment of service provider compliance, monitoring service provider release notes, and dark web monitoring.",
    implementationGroup: "IG3",
    assetType: ["Data"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "consistent with enterprise's service provider management policy"
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Third-Party Risk Management Tool",
      "Periodic reassessment of service provider compliance",
      "Monitoring service provider notes",
      "dark web monitoring"
    ],
    relatedSafeguards: ["15.1", "15.2"]  },
  "15.7": {
    id: "15.7",
    title: "Securely Decommission Service Providers",
    description: "Securely decommission service providers. Example considerations include user and service account deactivation, termination of data flows, and secure disposal of enterprise data within service provider systems.",
    implementationGroup: "IG3",
    assetType: ["Data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
    ],
    coreRequirements: [ // Green - The "what"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "user and service account deactivation",
      "termination of data flows",
      "secure disposal of enterprise data within service provider systems"
    ],
    relatedSafeguards: ["15.1", "15.2"]  },
  "16.1": {
    id: "16.1",
    title: "Establish and Maintain a Secure Application Development Process",
    description: "Establish and maintain a secure application development process. In the process, address such items as: secure application design standards, secure coding practices, developer training, vulnerability management, security of third-party code, and application security testing procedures. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review and update documentation",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "secure application development process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure application design standards",
      "secure coding practices",
      "developer training",
      "vulnerability management",
      "security of third-party code",
      "Application security testing procedure"
    ],
    relatedSafeguards: ["16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8", "16.9", "16.10", "16.11", "16.12", "16.13", "16.14"]  },
  "16.2": {
    id: "16.2",
    title: "Establish and Maintain a Process to Accept and Address Software Vulnerabilities",
    description: "Establish and maintain a process to accept and address reports of software vulnerabilities, including providing a means for external entities to report. The process is to include such items as: a vulnerability handling policy that identifies reporting process, responsible party for handling vulnerability reports, and a process for intake, assignment, remediation, and remediation testing. As part of the process, use a vulnerability tracking system that includes severity ratings and metrics for measuring timing for identification, analysis, and remediation of vulnerabilities. Review and update documentation annually, or when significant enterprise changes occur that could impact this Safeguard. Third-party application developers need to consider this an externally-facing policy that helps to set expectations for outside stakeholders.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Review and update documentation",
      "Establish",
      "Maintain",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "process to accept and address software vulnerabilities"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Third Party Application Developer",
      "Need to consider this an externally-facing policy that helps to set expectations for outside stakeholders",
      "provide a means for external entities to report vulnerabilities",
      "Vulnerability tracking system that includes",
      "severity ratings",
      "Metrics for measuring timing for",
      "Identification of Vulnerabilities",
      "Analysis of Vulnerabilities",
      "Remediation of Vulnerabilites",
      "Remediation",
      "Assignment",
      "Remediation testing"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vulnerability handling policy that identifies reporting process",
      "responsible party for handling vulnerability reports",
      "process for intake"
    ],
    relatedSafeguards: ["16.1", "16.3", "16.6"]  },
  "16.3": {
    id: "16.3",
    title: "Perform Root Cause Analysis on Security Vulnerabilities",
    description: "Perform root cause analysis on security vulnerabilities. When reviewing vulnerabilities, root cause analysis is the task of evaluating underlying issues that create vulnerabilities in code, and allows development teams to move beyond just fixing individual vulnerabilities as they arise.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Perform"
    ],
    coreRequirements: [ // Green - The "what"
      "Root Cause Analysis on Vulnerabilities"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Reviewing vulnerabilites",
      "Root cause analysis",
      "Definition - \"Task of evaluating underlying issues that create vulnerabilities in code, and allows development teams to move beyond just fixing individual vulnerabilities as they arise\""
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["16.1", "16.2"]  },
  "16.4": {
    id: "16.4",
    title: "Establish and Manage an Inventory of Third-Party Software Components",
    description: "Establish and manage an updated inventory of third-party components used in development, often referred to as a “bill of materials,” as well as components slated for future use. This inventory is to include any risks that each third-party component could pose. Evaluate the list at least monthly to identify any changes or updates to these components, and validate that the component is still supported.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Manage",
      "Updated",
      "Evaluate list at least monthly",
      "Identify",
      "Validate Support"
    ],
    coreRequirements: [ // Green - The "what"
      "Inventory of Third-Party Software Components \"Aka\" (SBOM)",
      "Third-Party Software Components Slated for future use"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "any risks that each third-party component could pose",
      "Any changes or updates to the components and are supported"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["16.1", "16.5"]  },
  "16.5": {
    id: "16.5",
    title: "Use Up-to-Date and Trusted Third-Party Software Components",
    description: "Use up-to-date and trusted third-party software components. When possible, choose established and proven frameworks and libraries that provide adequate security. Acquire these components from trusted sources or evaluate the software for vulnerabilities before use.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use"
    ],
    coreRequirements: [ // Green - The "what"
      "Up to Date",
      "Trusted",
      "Third-Party Software Components"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "acquire these components from trusted sources",
      "evaluate the software for vulnerabilities before use"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Choose established and proven frameworks and libraries",
      "Who provide Adequate Security"
    ],
    relatedSafeguards: ["16.1", "16.4", "16.11", "7.1"]  },
  "16.6": {
    id: "16.6",
    title: "Establish and Maintain a Severity Rating System and Process for Application Vulnerabilities",
    description: "Establish and maintain a severity rating system and process for application vulnerabilities that facilitates prioritizing the order in which discovered vulnerabilities are fixed. This process includes setting a minimum level of security acceptability for releasing code or applications. Severity ratings bring a systematic way of triaging vulnerabilities that improves risk management and helps ensure the most severe bugs are fixed first. Review and update the system and process annually.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "review and update the system and process annually"
    ],
    coreRequirements: [ // Green - The "what"
      "severity rating system",
      "process for application vulnerabilities"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "systematic way of triaging vulnerabilities",
      "facilitates prioritizing the order in which discovered vulnerabilities are fixed",
      "setting a minimum level of security acceptability for releasing code or applications",
      "helps ensure the most severe bugs are fixed first"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["16.1", "16.2"]  },
  "16.7": {
    id: "16.7",
    title: "Use Standard Hardening Configuration Templates for Application Infrastructure",
    description: "Use standard, industry-recommended hardening configuration templates for application infrastructure components. This includes underlying servers, databases, and web servers, and applies to cloud containers, Platform as a Service (PaaS) components, and SaaS components. Do not allow in-house developed software to weaken configuration hardening.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Use",
      "do not allow in-house developed software to weaken configuration hardening"
    ],
    coreRequirements: [ // Green - The "what"
      "Standard Hardening Configuration Templates for Application Infrastructure"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "underlying servers",
      "databases",
      "web servers",
      "cloud containers",
      "PaaS",
      "SaaS"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["16.1"]  },
  "16.8": {
    id: "16.8",
    title: "Separate Production and Non-Production Systems",
    description: "Maintain separate environments for production and non-production systems.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Maintain"
    ],
    coreRequirements: [ // Green - The "what"
      "production systems",
      "Separate Environments For",
      "non-production systems"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["16.1"]  },
  "16.9": {
    id: "16.9",
    title: "Train Developers in Application Security Concepts and Secure Coding",
    description: "Ensure that all software development personnel receive training in writing secure code for their specific development environment and responsibilities. Training can include general security principles and application security standard practices. Conduct training at least annually and design in a way to promote security within the development team, and build a culture of security among the developers.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Ensure",
      "conduct training at least annually"
    ],
    coreRequirements: [ // Green - The "what"
      "All software development personnel recieve training"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Writing secure code",
      "design in a way to promote security within the development team",
      "build a culture of security among the developers",
      "Specific development environment",
      "Specific development responsibilities"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "general security principles",
      "application security standard practices"
    ],
    relatedSafeguards: ["16.1", "14.1", "14.9"]  },
  "16.10": {
    id: "16.10",
    title: "Apply Secure Design Principles in Application Architectures",
    description: "Apply secure design principles in application architectures. Secure design principles include the concept of least privilege and enforcing mediation to validate every operation that the user makes, promoting the concept of \"never trust user input.\" Examples include ensuring that explicit error checking is performed and documented for all input, including for size, data type, and acceptable ranges or formats. Secure design also means minimizing the application infrastructure attack surface, such as turning off unprotected ports and services, removing unnecessary programs and files, and renaming or removing default accounts.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Apply"
    ],
    coreRequirements: [ // Green - The "what"
      "Secure design principles in application architectures"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "secure design principles",
      "concept of least privilege",
      "enforcing mediation",
      "minimizing the application infrastructure attack surface",
      "Concept of “never trust user input",
      "validate every operation that the user makes"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Ensuring that explicit error checking is performed for all input",
      "Explicit error checking is documented for all input",
      "Size",
      "Data type",
      "Acceptable Ranges",
      "Acceptable Formats",
      "turning off unprotected ports and services",
      "removing unnecessary programs and files",
      "renaming or removing default accounts"
    ],
    relatedSafeguards: ["16.1"]  },
  "16.11": {
    id: "16.11",
    title: "Leverage Vetted Modules or Services for Application Security Components",
    description: "Leverage vetted modules or services for application security components, such as identity management, encryption, auditing, and logging. Using platform features in critical security functions will reduce developers’ workload and minimize the likelihood of design or implementation errors. Modern operating systems provide effective mechanisms for identification, authentication, and authorization and make those mechanisms available to applications. Use only standardized, currently accepted, and extensively reviewed encryption algorithms. Operating systems also provide mechanisms to create and maintain secure audit logs.",
    implementationGroup: "IG2",
    assetType: ["Software"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "Leverage",
      "Use Only"
    ],
    coreRequirements: [ // Green - The "what"
      "Vetted Services",
      "Vetted Modules",
      "application security components"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Encryption Algorithms",
      "Standardized",
      "Currently accepted",
      "Extensively reviewed"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Modern operating systems provide effective mechanisms for identification, authentication, and authorization and make those mechanisms available to applications",
      "Using platform features in critical security functions will reduce developers’ workload and minimize the likelihood of design or implementation errors",
      "operating systems also provide mechanisms to create and maintain secure audit logs",
      "identity management",
      "encryption",
      "Auditing",
      "Logging"
    ],
    relatedSafeguards: ["16.1", "16.5"]  },
  "16.12": {
    id: "16.12",
    title: "Implement Code-Level Security Checks",
    description: "Apply static and dynamic analysis tools within the application life cycle to verify that secure coding practices are being followed.",
    implementationGroup: "IG3",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Apply",
      "Verify",
      "Practices are being followed"
    ],
    coreRequirements: [ // Green - The "what"
      "Static Dynamic analysis analysis tools tools",
      "Code Level Security Checks"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "application life cycle",
      "Secure coding practices"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["16.1"]  },
  "16.13": {
    id: "16.13",
    title: "Conduct Application Penetration Testing",
    description: "Conduct application penetration testing. For critical applications, authenticated penetration testing is better suited to finding business logic vulnerabilities than code scanning and automated security testing. Penetration testing relies on the skill of the tester to manually manipulate an application as an authenticated and unauthenticated user.",
    implementationGroup: "IG3",
    assetType: ["Software"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Conduct"
    ],
    coreRequirements: [ // Green - The "what"
      "application penetration testing"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Critical applications",
      "Non-Critical Applications",
      "Authenticated penetration testing",
      "Code scanning",
      "Automated security testing",
      "business logic vulnerabilities",
      "Penetration testing relies on the skill of the tester to MANUALLY manipulate an application",
      "Authenticated user",
      "Unauthenticated user"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Better Suited to finding"
    ],
    relatedSafeguards: ["16.1"]  },
  "16.14": {
    id: "16.14",
    title: "Conduct Threat Modeling",
    description: "Conduct threat modeling. Threat modeling is the process of identifying and addressing application security design flaws within a design, before code is created. It is conducted through specially trained individuals who evaluate the application design and gauge security risks for each entry point and access level. The goal is to map out the application, architecture, and infrastructure in a structured way to understand its weaknesses.",
    implementationGroup: "IG3",
    assetType: ["Software"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Conduct"
    ],
    coreRequirements: [ // Green - The "what"
      "threat modeling"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "before code is created",
      "Conducted Through",
      "Map out the application to understand its weakness in a structured way",
      "specially trained individuals",
      "Architecture",
      "Infrastructure",
      "Identifying",
      "Addressing",
      "Evaluate Application Design For Each:",
      "Application security design flaws within an design",
      "Entry point",
      "Access level"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["16.1"]  },
  "17.1": {
    id: "17.1",
    title: "Designate Personnel to Manage Incident Handling",
    description: "Designate one key person, and at least one backup, who will manage the enterprise’s incident handling process. Management personnel are responsible for the coordination and documentation of incident response and recovery efforts and can consist of employees internal to the enterprise, service providers, or a hybrid approach. If using a service provider, designate at least one person internal to the enterprise to oversee any third-party work. Review annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Designate",
      "Review",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "One Key Person",
      "at least one backup person",
      "Personnel to Manage Incident Handling"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Responsible for",
      "Coordination",
      "Documentation",
      "Incident Response",
      "Recovery efforts"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Employees internal to the enterprise",
      "Service Provider",
      "Hybrid Approach",
      "Designate one person internal to the enterprise to oversee any third-party work"
    ],
    relatedSafeguards: ["17.4"]  },
  "17.2": {
    id: "17.2",
    title: "Establish and Maintain Contact Information for Reporting Security Incidents",
    description: "Establish and maintain contact information for parties that need to be informed of security incidents. Contacts may include internal staff, service providers, law enforcement, cyber insurance providers, relevant government agencies, Information Sharing and Analysis Center (ISAC) partners, or other stakeholders. Verify contacts annually to ensure that information is up-to-date.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "establish and maintain contact information for parties that need to be informed of security incidents",
      "verify contacts annually to ensure information is up-to-date"
    ],
    coreRequirements: [ // Green - The "what"
      "contact information for parties to notify about security incidents",
      "internal and external notification contacts",
      "annual verification of contact information"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "contacts may include internal staff",
      "service providers",
      "law enforcement",
      "cyber insurance providers",
      "relevant government agencies",
      "Information Sharing and Analysis Center (ISAC) partners",
      "or other stakeholders",
      "verify contacts annually"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "incident notification contact directory",
      "emergency contact lists",
      "stakeholder contact registers",
      "annual contact verification process"
    ],
    relatedSafeguards: ["17.3", "17.4"]  },
  "17.3": {
    id: "17.3",
    title: "Establish and Maintain an Enterprise Process for Reporting Incidents",
    description: "Establish and maintain a documented enterprise process for the workforce to report security incidents. The process includes reporting timeframe, personnel to report to, mechanism for reporting, and the minimum information to be reported. Ensure the process is publicly available to all of the workforce. Review annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG1",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard",
      "Ensure"
    ],
    coreRequirements: [ // Green - The "what"
      "documented enterprise process for reporting incidents"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "The Process Includes",
      "Publicly available to all of the workforce",
      "reporting timeframe",
      "personnel to report to",
      "mechanism for reporting",
      "minimum information to be reported"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["17.2", "17.4", "14.6"]  },
  "17.4": {
    id: "17.4",
    title: "Establish and Maintain an Incident Response Process",
    description: "Establish and maintain a documented incident response process that addresses roles and responsibilities, compliance requirements, and a communication plan. Review annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Review",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "documented incident response process"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "That Addresses",
      "Roles",
      "Responsibilites",
      "compliance requirements",
      "communication plan"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["17.1", "17.3", "17.5", "17.6", "17.7", "17.8", "17.9"]  },
  "17.5": {
    id: "17.5",
    title: "Assign Key Roles and Responsibilities",
    description: "Assign key roles and responsibilities for incident response, including staff from legal, IT, information security, facilities, public relations, human resources, incident responders, analysts, and relevant third parties. Review annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Assign",
      "Review",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Incident Response"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Including Staff from",
      "Legal",
      "IT",
      "information security",
      "Facilities",
      "Public relations",
      "Human resources",
      "incident responders",
      "analysts"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["17.4"]  },
  "17.6": {
    id: "17.6",
    title: "Define Mechanisms for Communicating During Incident Response",
    description: "Determine which primary and secondary mechanisms will be used to communicate and report during a security incident. Mechanisms can include phone calls, emails, secure chat, or notification letters. Keep in mind that certain mechanisms, such as emails, can be affected during a security incident. Review annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "Determine",
      "Review",
      "Annually",
      "When significant enterprise changes occur that could impact this Safeguard"
    ],
    coreRequirements: [ // Green - The "what"
      "Mechanisms for Communicating During Incident Response",
      "Primary",
      "Secondary",
      "Communicate",
      "Report"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Phone calls",
      "Emails",
      "Secure Chat",
      "Notification Letters"
    ],
    relatedSafeguards: ["17.4"]  },
  "17.7": {
    id: "17.7",
    title: "Conduct Routine Incident Response Exercises",
    description: "Plan and conduct routine incident response exercises and scenarios for key personnel involved in the incident response process to prepare for responding to real-world incidents. Exercises need to test communication channels, decision making, and workflows. Conduct testing on an annual basis, at a minimum.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "Plan",
      "Conduct",
      "At a minimum",
      "Conduct testing on an annual basis"
    ],
    coreRequirements: [ // Green - The "what"
      "routine incident response exercises",
      "Routine Scenarios"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "key personnel involved in the incident response process",
      "prepare for responding to real-world incidents",
      "Exercises Need to",
      "test communication channels",
      "test decision-making",
      "test workflows"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["17.4"]  },
  "17.8": {
    id: "17.8",
    title: "Conduct Post-Incident Reviews",
    description: "Conduct post-incident reviews. Post-incident reviews help prevent incident recurrence through identifying lessons learned and follow-up action.",
    implementationGroup: "IG2",
    assetType: ["Users"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "Conduct",
      "Help prevent incident recurrence"
    ],
    coreRequirements: [ // Green - The "what"
      "post-incident reviews"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "identifying lessons learned",
      "follow-up action"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["17.4"]  },
  "17.9": {
    id: "17.9",
    title: "Establish and Maintain Security Incident Thresholds",
    description: "Establish and maintain security incident thresholds, including, at a minimum, differentiating between an incident and an event. Examples can include: abnormal activity, security vulnerability, security weakness, data breach, privacy incident, etc. Review annually, or when significant enterprise changes occur that could impact this Safeguard.",
    implementationGroup: "IG3",
    assetType: ["Users"],
    securityFunction: ["Recover"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Ensure",
      "Review",
      "At a minimum",
      "When significant enterprise changes occur that could impact this Safeguard",
      "Annually"
    ],
    coreRequirements: [ // Green - The "what"
      "security incident thresholds"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Differentiating between",
      "Incident",
      "Event"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Abnormal Activity",
      "Security vulnerability",
      "Data breach",
      "Security weakness",
      "Privacy incident"
    ],
    relatedSafeguards: ["17.4"]  },
  "18.1": {
    id: "18.1",
    title: "Establish and Maintain a Penetration Testing Program",
    description: "Establish and maintain a penetration testing program appropriate to the size, complexity, industry, and maturity of the enterprise. Penetration testing program characteristics include scope, such as network, web application, Application Programming Interface (API), hosted services, and physical premise controls; frequency; limitations, such as acceptable hours, and excluded attack types; point of contact information; remediation, such as how findings will be routed internally; and retrospective requirements.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "Establish",
      "Maintain",
      "Appropriate",
      "Complexity",
      "Size",
      "industry",
      "Maturity",
      "Of the Enterprise"
    ],
    coreRequirements: [ // Green - The "what"
      "penetration testing program"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Characteristics include",
      "Scope",
      "Frequency",
      "Limitations",
      "POC info",
      "Remediation"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Network",
      "Hosted Services",
      "Web Applications",
      "API",
      "Acceptable hours",
      "excluded attack types",
      "How findings will be routed internally",
      "retrospective requirements"
    ],
    relatedSafeguards: ["18.2", "18.3", "18.4", "18.5"]  },
  "18.2": {
    id: "18.2",
    title: "Perform Periodic External Penetration Tests",
    description: "Perform periodic external penetration tests based on program requirements, no less than annually. External penetration testing must include enterprise and environmental reconnaissance to detect exploitable information. Penetration testing requires specialized skills and experience and must be conducted through a qualified party. The testing may be clear box or opaque box.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Perform periodic",
      "based on program requirements",
      "Must be conducted through a qualified party",
      "no less than annually",
      "Must Include"
    ],
    coreRequirements: [ // Green - The "what"
      "External Penetration Tests"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Clear box",
      "Opaque box",
      "enterprise reconnaissance",
      "environmental reconnaissance",
      "to detect exploitable information"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["18.1", "18.3", "18.4"]  },
  "18.3": {
    id: "18.3",
    title: "Remediate Penetration Test Findings",
    description: "Remediate penetration test findings based on the enterprise’s documented vulnerability remediation process. This should include determining a timeline and level of effort based on the impact and prioritization of each identified finding.",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Remediate",
      "Based on enterprise's policy"
    ],
    coreRequirements: [ // Green - The "what"
      "Penetration Test Findings"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Impact",
      "Prioritization",
      "Timeline",
      "Level of effort"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["18.1", "18.2", "18.5"]  },
  "18.4": {
    id: "18.4",
    title: "Validate Security Measures",
    description: "Validate security measures after each penetration test. If deemed necessary, modify rulesets and capabilities to detect the techniques used during testing.",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "Validate",
      "if deemed necessary"
    ],
    coreRequirements: [ // Green - The "what"
      "Security measures after each penetration test"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Modify",
      "Rulesets",
      "Capabilities",
      "to detect the techniques used during testing"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["18.1", "18.2", "18.5"]  },
  "18.5": {
    id: "18.5",
    title: "Perform Periodic Internal Penetration Tests",
    description: "Perform periodic internal penetration tests based on program requirements, no less than annually. The testing may be clear box or opaque box.",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "Perform Periodic",
      "based on program requirements",
      "no less than annually"
    ],
    coreRequirements: [ // Green - The "what"
      "Internal Penetration Tests"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "Clear box",
      "Opaque box"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
    ],
    relatedSafeguards: ["18.1", "18.3", "18.4"]  }
};
  }
}
