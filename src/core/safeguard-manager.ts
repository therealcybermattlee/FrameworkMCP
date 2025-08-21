import { SafeguardElement, CacheEntry } from '../shared/types.js';

export class SafeguardManager {
  private cache: Map<string, CacheEntry<any>>;
  private safeguards: Record<string, SafeguardElement> = {};

  constructor() {
    this.cache = new Map();
    this.initializeSafeguards();
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
    // Check cache first
    const cached = this.cache.get('safeguard_list');
    if (cached && (Date.now() - cached.timestamp < 10 * 60 * 1000)) { // 10 minute cache
      return cached.data;
    }

    const safeguardList = Object.keys(this.safeguards).sort((a, b) => {
      const [aMajor, aMinor] = a.split('.').map(Number);
      const [bMajor, bMinor] = b.split('.').map(Number);
      return aMajor - bMajor || aMinor - bMinor;
    });

    // Cache the result
    this.cache.set('safeguard_list', {
      data: safeguardList,
      timestamp: Date.now()
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
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) { // 5 minute cache
      return cached.data;
    }
    
    return null;
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
    // Initialize the complete CIS Controls Framework data
    this.safeguards = {
      "1.1": {
        id: "1.1",
        title: "Establish and Maintain a Detailed Enterprise Asset Inventory",
        description: "Establish and maintain an accurate, detailed, and up-to-date inventory of all enterprise assets with the potential to store or process data",
        implementationGroup: "IG1",
        assetType: ["end-user devices", "network devices", "IoT devices", "servers"],
        securityFunction: ["Identify"],
        governanceElements: [
          "establish inventory process",
          "maintain inventory process", 
          "documented process",
          "review and update bi-annually",
          "enterprise asset management policy"
        ],
        coreRequirements: [
          "accurate inventory",
          "detailed inventory", 
          "up-to-date inventory",
          "all enterprise assets",
          "potential to store or process data"
        ],
        subTaxonomicalElements: [
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
        implementationSuggestions: [
          "MDM type tools for mobile devices",
          "enterprise and software asset management tool",
          "asset discovery tools",
          "DHCP logging",
          "passive discovery tools"
        ],
        relatedSafeguards: ["1.2", "1.3", "1.4", "1.5", "2.1", "3.2", "4.1", "5.1"],
        keywords: ["asset", "inventory", "device", "network", "mobile", "IoT", "server", "detailed", "accurate", "up-to-date"]
      },
      "1.2": {
        id: "1.2",
        title: "Address Unauthorized Assets",
        description: "Ensure that a process exists to address unauthorized assets on a weekly basis",
        implementationGroup: "IG1",
        assetType: ["devices"],
        securityFunction: ["Respond"],
        governanceElements: [
          "ensure process exists",
          "weekly basis requirement",
          "unauthorized asset handling policy"
        ],
        coreRequirements: [
          "address unauthorized assets",
          "process to handle unauthorized devices",
          "weekly execution"
        ],
        subTaxonomicalElements: [
          "unauthorized asset detection",
          "asset classification",
          "response timeline",
          "documentation requirements",
          "quarantine procedures",
          "removal procedures"
        ],
        implementationSuggestions: [
          "network access control (NAC) solutions",
          "automated asset discovery tools",
          "network monitoring systems",
          "SIEM integration"
        ],
        relatedSafeguards: ["1.1", "1.3", "12.1", "13.1"],
        keywords: ["unauthorized", "assets", "weekly", "address", "process", "detection", "quarantine"]
      },
      "5.1": {
        id: "5.1",
        title: "Establish and Maintain an Inventory of Accounts",
        description: "Establish and maintain an inventory of all accounts managed in the enterprise",
        implementationGroup: "IG1",
        assetType: ["users"],
        securityFunction: ["Identify"],
        governanceElements: [
          "establish inventory process",
          "maintain inventory process",
          "validate all active accounts are authorized",
          "recurring schedule minimum quarterly",
          "account management policy"
        ],
        coreRequirements: [
          "inventory of all accounts",
          "user accounts", 
          "administrator accounts",
          "managed in the enterprise"
        ],
        subTaxonomicalElements: [
          "person's name",
          "username", 
          "start/stop dates",
          "department",
          "account status",
          "account type",
          "access rights",
          "last login date"
        ],
        implementationSuggestions: [
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
        governanceElements: [
          "require MFA enforcement",
          "policy for externally-exposed applications",
          "MFA compliance verification"
        ],
        coreRequirements: [
          "multi-factor authentication",
          "all externally-exposed applications",
          "enterprise applications",
          "third-party applications",
          "enforce MFA where supported"
        ],
        subTaxonomicalElements: [
          "authentication factors",
          "something you know (password)",
          "something you have (token)",
          "something you are (biometric)",
          "external access points",
          "application inventory",
          "exposure assessment"
        ],
        implementationSuggestions: [
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
        governanceElements: [
          "establish documented process",
          "maintain vulnerability management process",
          "review and update documentation annually",
          "update when significant enterprise changes occur",
          "vulnerability management policy"
        ],
        coreRequirements: [
          "vulnerability management process",
          "enterprise assets scope",
          "documented procedures",
          "vulnerability identification",
          "vulnerability assessment"
        ],
        subTaxonomicalElements: [
          "vulnerability scanning procedures",
          "risk assessment criteria", 
          "remediation prioritization",
          "patch management integration",
          "vulnerability tracking",
          "reporting requirements",
          "roles and responsibilities",
          "escalation procedures"
        ],
        implementationSuggestions: [
          "vulnerability scanning tools",
          "patch management systems",
          "vulnerability databases",
          "CVSS scoring",
          "automated scanning",
          "vulnerability management platforms"
        ],
        relatedSafeguards: ["1.1", "2.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"],
        keywords: ["vulnerability", "management", "process", "documented", "annual", "review", "enterprise", "assets"]
      }
    };
  }
}