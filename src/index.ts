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
  // Primary capability categorization
  capability: 'full' | 'partial' | 'facilitates' | 'governance' | 'validates' | 'none';
  // Detailed breakdown for complex products
  capabilities: {
    full: boolean;        // Does the safeguard completely (all core + sub-taxonomical elements)
    partial: boolean;     // Does some of the safeguard elements  
    facilitates: boolean; // Helps with data or automation for the safeguard
    governance: boolean;  // Controls policy, process, procedures
    validates: boolean;   // Provides evidence of safeguard implementation
  };
  confidence: number;
  reasoning: string;
  evidence: string[];
  // Coverage analysis (binary: met or not met)
  elementsCovered: {
    coreRequirements: string[];        // Green elements addressed
    subTaxonomicalElements: string[];  // Yellow elements addressed  
    governanceElements: string[];      // Orange elements addressed
    implementationMethods: string[];   // Gray elements used
  };
  elementsNotCovered: {
    coreRequirements: string[];
    subTaxonomicalElements: string[];
  };
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
  },
  "1.3": {
    id: "1.3",
    title: "Utilize an Active Discovery Tool",
    description: "Use an active discovery tool to identify assets connected to the enterprise's network",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "use active discovery tool",
      "identify assets requirement",
      "network discovery policy",
      "discovery tool management"
    ],
    coreRequirements: [ // Green - The "what"
      "active discovery tool",
      "identify assets connected to network",
      "enterprise network coverage",
      "asset discovery capability"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network scanning",
      "asset identification",
      "network mapping",
      "device fingerprinting",
      "service discovery",
      "port scanning",
      "protocol analysis",
      "network topology discovery"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network discovery scanners",
      "SNMP-based discovery",
      "ping sweeps",
      "ARP table analysis",
      "network monitoring tools",
      "automated discovery systems"
    ],
    relatedSafeguards: ["1.1", "1.2", "1.4", "1.5"],
    keywords: ["active", "discovery", "tool", "identify", "assets", "network", "scanning", "mapping"]
  },
  "1.4": {
    id: "1.4", 
    title: "Use Dynamic Host Configuration Protocol (DHCP) Logging to Update Asset Inventory",
    description: "Use DHCP logging functionality to update the enterprise asset inventory",
    implementationGroup: "IG2",
    assetType: ["network"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "use DHCP logging",
      "update asset inventory requirement",
      "DHCP log management policy",
      "inventory integration process"
    ],
    coreRequirements: [ // Green - The "what"
      "DHCP logging functionality",
      "update enterprise asset inventory",
      "network device tracking",
      "IP address assignment logging"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "DHCP lease information",
      "IP address assignments",
      "MAC address mapping",
      "device hostnames",
      "lease duration tracking",
      "DHCP server logs",
      "network join events",
      "device identification data"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "DHCP server log analysis",
      "automated parsing tools",
      "inventory integration scripts",
      "SIEM integration",
      "log aggregation systems",
      "real-time monitoring"
    ],
    relatedSafeguards: ["1.1", "1.2", "1.3", "1.5"],
    keywords: ["DHCP", "logging", "update", "asset", "inventory", "IP", "address", "network", "tracking"]
  },
  "1.5": {
    id: "1.5",
    title: "Use a Passive Asset Discovery Tool",
    description: "Use a passive discovery tool to identify assets connected to the enterprise's network",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "use passive discovery tool",
      "identify assets requirement",
      "passive monitoring policy",
      "discovery tool governance"
    ],
    coreRequirements: [ // Green - The "what"
      "passive discovery tool",
      "identify assets connected to network",
      "non-intrusive asset identification",
      "network traffic analysis"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network traffic monitoring",
      "passive packet analysis",
      "protocol identification",
      "device behavior analysis",
      "communication pattern analysis",
      "network flow analysis",
      "asset fingerprinting",
      "service identification"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network tap monitoring",
      "span port analysis",
      "flow analysis tools", 
      "packet capture systems",
      "network behavior analysis",
      "passive scanning tools"
    ],
    relatedSafeguards: ["1.1", "1.2", "1.3", "1.4"],
    keywords: ["passive", "discovery", "tool", "identify", "assets", "network", "traffic", "monitoring", "non-intrusive"]
  },
  "2.1": {
    id: "2.1",
    title: "Establish and Maintain a Software Inventory",
    description: "Establish and maintain a detailed inventory of all licensed software installed on enterprise assets",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish inventory process",
      "maintain inventory process",
      "detailed software inventory requirement",
      "licensed software tracking",
      "enterprise asset coverage"
    ],
    coreRequirements: [ // Green - The "what"
      "detailed inventory",
      "all licensed software",
      "installed on enterprise assets",
      "software asset management",
      "comprehensive coverage"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "software name",
      "version",
      "publisher",
      "install date",
      "business purpose",
      "supported vs. unsupported software",
      "authorized vs. unauthorized software",
      "licensing information",
      "installation location"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "software asset management tools",
      "automated discovery agents",
      "network-based scanning",
      "endpoint detection tools",
      "software metering solutions"
    ],
    relatedSafeguards: ["1.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7"],
    keywords: ["software", "inventory", "licensed", "detailed", "enterprise", "assets", "applications"]
  },
  "2.2": {
    id: "2.2",
    title: "Ensure That Only Currently Supported Software Is Designated as Authorized",
    description: "Ensure that only currently supported software is designated as authorized in the software inventory",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "ensure only supported software authorized",
      "authorization designation process",
      "supported software verification",
      "software lifecycle management"
    ],
    coreRequirements: [ // Green - The "what"
      "currently supported software only",
      "designated as authorized",
      "software inventory integration",
      "support status verification"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "software support status",
      "end-of-life identification",
      "vendor support agreements",
      "patch availability",
      "security update availability",
      "authorization workflows",
      "approval processes"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "vendor support databases",
      "automated support checking",
      "software lifecycle tracking",
      "end-of-life notifications",
      "authorization workflow tools"
    ],
    relatedSafeguards: ["2.1", "2.3", "2.4", "2.5", "2.6", "2.7"],
    keywords: ["supported", "software", "authorized", "designated", "inventory", "lifecycle", "end-of-life"]
  },
  "2.3": {
    id: "2.3",
    title: "Address Unauthorized Software",
    description: "Ensure that unauthorized software is either removed from use on enterprise assets or approved for use",
    implementationGroup: "IG1",
    assetType: ["applications"],
    securityFunction: ["Respond"],
    governanceElements: [ // Orange - MUST be met
      "ensure unauthorized software addressed",
      "removal or approval requirement",
      "unauthorized software handling policy"
    ],
    coreRequirements: [ // Green - The "what"
      "unauthorized software identification",
      "removed from use",
      "approved for use",
      "enterprise assets coverage"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "unauthorized software detection",
      "software classification",
      "approval workflows",
      "removal procedures",
      "business justification",
      "exception processes",
      "documentation requirements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "automated removal tools",
      "application control systems",
      "software whitelisting",
      "policy enforcement tools",
      "approval workflow systems"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.4", "2.5", "2.6", "2.7"],
    keywords: ["unauthorized", "software", "removed", "approved", "enterprise", "assets", "address"]
  },
  "2.4": {
    id: "2.4",
    title: "Utilize Automated Software Inventory Tools",
    description: "Utilize automated software inventory tools, where possible, throughout the enterprise",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "utilize automated tools",
      "where possible requirement",
      "throughout enterprise coverage",
      "automated inventory management"
    ],
    coreRequirements: [ // Green - The "what"
      "automated software inventory tools",
      "enterprise-wide deployment",
      "comprehensive coverage",
      "automated discovery capability"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "automated discovery agents",
      "network-based scanning",
      "agent-based collection",
      "real-time inventory updates",
      "centralized reporting",
      "integration capabilities",
      "deployment strategies"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "endpoint agents",
      "network scanners",
      "SCCM integration",
      "vulnerability scanners",
      "asset management platforms"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.5", "2.6", "2.7"],
    keywords: ["automated", "software", "inventory", "tools", "enterprise", "deployment", "discovery"]
  },
  "2.5": {
    id: "2.5",
    title: "Allowlist Authorized Software",
    description: "Use technical controls, such as application allowlisting, to ensure that only authorized software can execute",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use technical controls",
      "ensure only authorized execution",
      "allowlisting implementation requirement"
    ],
    coreRequirements: [ // Green - The "what"
      "technical controls",
      "application allowlisting",
      "only authorized software execution",
      "execution prevention"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "allowlist management",
      "signature-based controls",
      "hash-based controls",
      "path-based controls",
      "certificate-based controls",
      "execution monitoring",
      "policy enforcement"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "application control software",
      "Windows AppLocker",
      "endpoint protection platforms",
      "code signing enforcement",
      "execution prevention tools"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.6", "2.7"],
    keywords: ["allowlist", "authorized", "software", "technical", "controls", "application", "execution"]
  },
  "2.6": {
    id: "2.6",
    title: "Allowlist Authorized Libraries",
    description: "Use technical controls to ensure that only authorized software libraries, such as specific .dll, .ocx, .so files, can load into a system process",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use technical controls",
      "ensure only authorized libraries",
      "system process protection requirement"
    ],
    coreRequirements: [ // Green - The "what"
      "technical controls",
      "only authorized software libraries",
      "dll ocx so files",
      "system process loading"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "library allowlisting",
      "dynamic link library control",
      "shared object control",
      "process injection prevention",
      "library loading monitoring",
      "signature verification",
      "integrity checking"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "library control tools",
      "process monitoring solutions",
      "endpoint detection platforms",
      "kernel-level controls",
      "signature enforcement"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.7"],
    keywords: ["allowlist", "authorized", "libraries", "dll", "ocx", "so", "system", "process", "technical"]
  },
  "2.7": {
    id: "2.7",
    title: "Allowlist Authorized Scripts",
    description: "Use technical controls, such as digital signatures and version control systems, to ensure that only authorized scripts can execute",
    implementationGroup: "IG3",
    assetType: ["applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use technical controls",
      "ensure only authorized script execution",
      "script authorization requirement"
    ],
    coreRequirements: [ // Green - The "what"
      "technical controls",
      "digital signatures",
      "version control systems",
      "only authorized scripts execution"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "script allowlisting",
      "digital signature verification",
      "version control integration",
      "script integrity checking",
      "execution policy enforcement",
      "script source validation",
      "runtime monitoring"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "PowerShell execution policies",
      "script signing infrastructure",
      "version control systems",
      "script execution monitors",
      "code signing certificates"
    ],
    relatedSafeguards: ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"],
    keywords: ["allowlist", "authorized", "scripts", "digital", "signatures", "version", "control", "execution"]
  },
  "3.1": {
    id: "3.1",
    title: "Establish and Maintain a Data Management Process",
    description: "Establish and maintain a data management process",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish data management process",
      "maintain data management process",
      "documented data governance",
      "data management policy"
    ],
    coreRequirements: [ // Green - The "what"
      "data management process",
      "data governance framework",
      "data handling procedures",
      "data lifecycle management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "data classification scheme",
      "data inventory procedures",
      "data retention policies",
      "data disposal procedures",
      "data handling standards",
      "data access controls",
      "data sharing agreements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data governance platforms",
      "data discovery tools",
      "data classification tools",
      "policy management systems",
      "data lineage tracking"
    ],
    relatedSafeguards: ["3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14"],
    keywords: ["data", "management", "process", "establish", "maintain", "governance", "lifecycle"]
  },
  "3.2": {
    id: "3.2",
    title: "Establish and Maintain a Data Inventory",
    description: "Establish and maintain a data inventory, based on the enterprise's data management process",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish data inventory",
      "maintain data inventory",
      "based on data management process",
      "inventory management requirements"
    ],
    coreRequirements: [ // Green - The "what"
      "data inventory",
      "enterprise data coverage",
      "data asset identification",
      "data location tracking"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "data types",
      "data locations",
      "data owners",
      "data classifications",
      "data sensitivity levels",
      "data volumes",
      "data formats",
      "data repositories"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data discovery scanners",
      "database inventory tools",
      "file system crawlers",
      "cloud data discovery",
      "automated data cataloging"
    ],
    relatedSafeguards: ["1.1", "3.1", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10", "3.11", "3.12", "3.13", "3.14"],
    keywords: ["data", "inventory", "enterprise", "management", "process", "identification", "tracking"]
  },
  "3.3": {
    id: "3.3",
    title: "Configure Data Access Control Lists",
    description: "Configure data access control lists based on a user's need to know",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "configure access control lists",
      "based on need to know",
      "data access governance",
      "access control policy"
    ],
    coreRequirements: [ // Green - The "what"
      "data access control lists",
      "user need to know basis",
      "access restriction enforcement",
      "granular access controls"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "user access requirements",
      "role-based permissions",
      "data sensitivity matching",
      "access review processes",
      "permission inheritance",
      "group-based access",
      "individual permissions"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "file system ACLs",
      "database permissions",
      "application-level controls",
      "identity management systems",
      "access governance tools"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.4", "3.5", "3.6", "5.1", "6.1", "6.2"],
    keywords: ["data", "access", "control", "lists", "need", "know", "user", "permissions"]
  },
  "3.4": {
    id: "3.4",
    title: "Enforce Data Retention",
    description: "Retain data according to the enterprise's data management process",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "retain data according to process",
      "enterprise data management process",
      "data retention governance",
      "retention policy enforcement"
    ],
    coreRequirements: [ // Green - The "what"
      "data retention enforcement",
      "retention schedule compliance",
      "data lifecycle management",
      "retention period adherence"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "retention schedules",
      "legal requirements",
      "business requirements",
      "retention categories",
      "disposal timelines",
      "archive procedures",
      "retention monitoring"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "automated retention tools",
      "data lifecycle management",
      "archival systems",
      "retention scheduling tools",
      "compliance monitoring"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.5", "3.6", "3.10"],
    keywords: ["data", "retention", "enterprise", "management", "process", "lifecycle", "schedule"]
  },
  "3.5": {
    id: "3.5",
    title: "Securely Dispose of Data",
    description: "Securely dispose of data as outlined in the enterprise's data management process",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "securely dispose data",
      "outlined in management process",
      "data disposal governance",
      "secure disposal policy"
    ],
    coreRequirements: [ // Green - The "what"
      "secure data disposal",
      "data management process alignment",
      "disposal method security",
      "data destruction assurance"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "disposal methods",
      "data sanitization",
      "media destruction",
      "digital shredding",
      "disposal verification",
      "disposal documentation",
      "certificate of destruction"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data wiping tools",
      "media destruction services",
      "cryptographic erasure",
      "physical destruction",
      "disposal tracking systems"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.4", "3.6", "3.10"],
    keywords: ["securely", "dispose", "data", "enterprise", "management", "process", "destruction"]
  },
  "3.6": {
    id: "3.6",
    title: "Encrypt Data on End-User Devices",
    description: "Encrypt data on end-user devices containing sensitive data",
    implementationGroup: "IG1",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "encrypt data requirement",
      "end-user devices coverage",
      "sensitive data identification",
      "encryption policy enforcement"
    ],
    coreRequirements: [ // Green - The "what"
      "data encryption",
      "end-user devices",
      "sensitive data protection",
      "encryption implementation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "full disk encryption",
      "file-level encryption",
      "encryption algorithms",
      "key management",
      "device types coverage",
      "mobile device encryption",
      "laptop encryption"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "BitLocker encryption",
      "FileVault encryption",
      "third-party encryption tools",
      "mobile device management",
      "encryption key management"
    ],
    relatedSafeguards: ["1.1", "3.1", "3.2", "3.7", "3.8", "3.9", "3.11"],
    keywords: ["encrypt", "data", "end-user", "devices", "sensitive", "protection", "encryption"]
  },
  "3.7": {
    id: "3.7",
    title: "Establish and Maintain a Data Classification Scheme",
    description: "Establish and maintain a data classification scheme based on the sensitivity of data",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish classification scheme",
      "maintain classification scheme",
      "based on data sensitivity",
      "classification governance"
    ],
    coreRequirements: [ // Green - The "what"
      "data classification scheme",
      "sensitivity-based classification",
      "classification standards",
      "data labeling system"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "classification levels",
      "sensitivity criteria",
      "classification labels",
      "handling requirements",
      "protection levels",
      "access requirements",
      "classification workflows"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data classification tools",
      "automated labeling",
      "classification policies",
      "sensitivity scanners",
      "classification workflows"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.3", "3.8", "3.9", "3.10", "3.11", "3.12"],
    keywords: ["establish", "maintain", "data", "classification", "scheme", "sensitivity", "labeling"]
  },
  "3.8": {
    id: "3.8",
    title: "Document Data Flows",
    description: "Document data flows for sensitive data",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "document data flows",
      "sensitive data coverage",
      "data flow documentation requirement",
      "flow mapping governance"
    ],
    coreRequirements: [ // Green - The "what"
      "data flow documentation",
      "sensitive data flows",
      "data movement tracking",
      "flow visualization"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "data sources",
      "data destinations",
      "processing locations",
      "data transformations",
      "data transit paths",
      "integration points",
      "data boundaries"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "data lineage tools",
      "flow mapping software",
      "data discovery tools",
      "process documentation",
      "network flow analysis"
    ],
    relatedSafeguards: ["3.1", "3.2", "3.7", "3.9", "3.10", "3.11"],
    keywords: ["document", "data", "flows", "sensitive", "mapping", "tracking", "lineage"]
  },
  "3.9": {
    id: "3.9",
    title: "Encrypt Data on Removable Media",
    description: "Encrypt data on removable media",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "encrypt data requirement",
      "removable media coverage",
      "encryption policy enforcement",
      "removable media governance"
    ],
    coreRequirements: [ // Green - The "what"
      "data encryption",
      "removable media",
      "portable storage protection",
      "encryption implementation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "USB drives",
      "external hard drives",
      "optical media",
      "memory cards",
      "encryption methods",
      "key management",
      "access controls"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "encrypted USB drives",
      "device encryption tools",
      "removable media controls",
      "encryption management",
      "key escrow systems"
    ],
    relatedSafeguards: ["3.1", "3.6", "3.7", "3.10", "3.11"],
    keywords: ["encrypt", "data", "removable", "media", "portable", "storage", "USB"]
  },
  "3.10": {
    id: "3.10",
    title: "Encrypt Sensitive Data in Transit",
    description: "Encrypt sensitive data in transit",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "encrypt sensitive data",
      "in transit requirement",
      "transmission encryption policy",
      "transit encryption governance"
    ],
    coreRequirements: [ // Green - The "what"
      "sensitive data encryption",
      "data in transit",
      "transmission protection",
      "communication security"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network protocols",
      "encryption protocols",
      "TLS/SSL implementation",
      "VPN tunneling",
      "secure communication channels",
      "certificate management",
      "key exchange"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "TLS encryption",
      "VPN solutions",
      "secure email gateways",
      "encrypted file transfer",
      "secure messaging systems"
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "3.11", "13.1", "13.2"],
    keywords: ["encrypt", "sensitive", "data", "transit", "transmission", "TLS", "communication"]
  },
  "3.11": {
    id: "3.11",
    title: "Encrypt Sensitive Data at Rest",
    description: "Encrypt sensitive data at rest",
    implementationGroup: "IG2",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "encrypt sensitive data",
      "at rest requirement",
      "storage encryption policy",
      "rest encryption governance"
    ],
    coreRequirements: [ // Green - The "what"
      "sensitive data encryption",
      "data at rest",
      "storage protection",
      "persistent data security"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "database encryption",
      "file system encryption",
      "application-level encryption",
      "cloud storage encryption",
      "backup encryption",
      "key management systems",
      "encryption algorithms"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "transparent data encryption",
      "column-level encryption",
      "file-level encryption",
      "key management services",
      "hardware security modules"
    ],
    relatedSafeguards: ["3.1", "3.6", "3.7", "3.9", "3.10", "11.1"],
    keywords: ["encrypt", "sensitive", "data", "rest", "storage", "database", "persistent"]
  },
  "3.12": {
    id: "3.12",
    title: "Segment Data Processing and Storage Based on Classification",
    description: "Segment data processing and storage based on the classification of the data",
    implementationGroup: "IG3",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "segment data processing",
      "segment data storage",
      "based on classification",
      "segmentation governance"
    ],
    coreRequirements: [ // Green - The "what"
      "data segmentation",
      "processing segregation",
      "storage segregation",
      "classification-based separation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network segmentation",
      "logical separation",
      "physical separation",
      "processing environments",
      "storage zones",
      "access boundaries",
      "isolation controls"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network segmentation tools",
      "virtualization platforms",
      "container isolation",
      "zone-based architecture",
      "micro-segmentation"
    ],
    relatedSafeguards: ["3.1", "3.7", "12.1", "12.2", "12.3"],
    keywords: ["segment", "data", "processing", "storage", "classification", "separation", "isolation"]
  },
  "3.13": {
    id: "3.13",
    title: "Deploy a Data Loss Prevention Solution",
    description: "Deploy a data loss prevention solution on assets containing sensitive data",
    implementationGroup: "IG3",
    assetType: ["data"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "deploy DLP solution",
      "assets containing sensitive data",
      "data loss prevention requirement",
      "DLP governance"
    ],
    coreRequirements: [ // Green - The "what"
      "data loss prevention solution",
      "sensitive data assets",
      "data leakage prevention",
      "data exfiltration controls"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "endpoint DLP",
      "network DLP",
      "email DLP",
      "web DLP",
      "cloud DLP",
      "content inspection",
      "policy enforcement"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "DLP platforms",
      "content analysis engines",
      "policy management systems",
      "incident response integration",
      "monitoring and alerting"
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "3.10", "3.11"],
    keywords: ["deploy", "data", "loss", "prevention", "solution", "sensitive", "DLP"]
  },
  "3.14": {
    id: "3.14",
    title: "Log Sensitive Data Access",
    description: "Log sensitive data access, including modification and disposal",
    implementationGroup: "IG3",
    assetType: ["data"],
    securityFunction: ["Detect"],
    governanceElements: [ // Orange - MUST be met
      "log sensitive data access",
      "including modification disposal",
      "data access logging requirement",
      "access monitoring governance"
    ],
    coreRequirements: [ // Green - The "what"
      "sensitive data access logging",
      "modification logging",
      "disposal logging",
      "comprehensive access tracking"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "access events",
      "user identification",
      "timestamp recording",
      "operation type logging",
      "data identification",
      "source system logging",
      "audit trail maintenance"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "database audit logs",
      "file access monitoring",
      "SIEM integration",
      "log management platforms",
      "activity monitoring tools"
    ],
    relatedSafeguards: ["3.1", "3.7", "3.8", "8.1", "8.2"],
    keywords: ["log", "sensitive", "data", "access", "modification", "disposal", "audit"]
  },
  "4.1": {
    id: "4.1",
    title: "Establish and Maintain a Secure Configuration Process",
    description: "Establish and maintain a secure configuration process for enterprise assets and software",
    implementationGroup: "IG1",
    assetType: ["devices", "applications"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish secure configuration process",
      "maintain secure configuration process",
      "enterprise assets and software coverage",
      "configuration management governance"
    ],
    coreRequirements: [ // Green - The "what"
      "secure configuration process",
      "configuration management framework",
      "standardized configuration procedures",
      "configuration lifecycle management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "configuration standards",
      "baseline configurations",
      "configuration templates",
      "hardening procedures",
      "configuration validation",
      "change management integration",
      "compliance checking"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "configuration management tools",
      "policy management platforms",
      "automated configuration systems",
      "compliance scanning tools",
      "baseline management systems"
    ],
    relatedSafeguards: ["1.1", "2.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9", "4.10", "4.11", "4.12"],
    keywords: ["establish", "maintain", "secure", "configuration", "process", "enterprise", "assets", "software"]
  },
  "4.2": {
    id: "4.2",
    title: "Establish and Maintain a Secure Configuration Process for Network Infrastructure",
    description: "Establish and maintain a secure configuration process for network infrastructure",
    implementationGroup: "IG1",
    assetType: ["network"],
    securityFunction: ["Govern"],
    governanceElements: [ // Orange - MUST be met
      "establish network configuration process",
      "maintain network configuration process",
      "network infrastructure coverage",
      "network security governance"
    ],
    coreRequirements: [ // Green - The "what"
      "secure network configuration process",
      "network infrastructure management",
      "network security standards",
      "network configuration lifecycle"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network device configurations",
      "routing configurations",
      "switching configurations",
      "firewall configurations",
      "wireless configurations",
      "network segmentation",
      "access control configurations"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network configuration tools",
      "network automation platforms",
      "configuration templates",
      "network compliance scanners",
      "infrastructure as code"
    ],
    relatedSafeguards: ["1.1", "4.1", "4.3", "4.4", "4.5", "12.1", "12.2"],
    keywords: ["establish", "maintain", "secure", "configuration", "network", "infrastructure", "process"]
  },
  "4.3": {
    id: "4.3",
    title: "Configure Automatic Session Locking on Enterprise Assets",
    description: "Configure automatic session locking on enterprise assets after a defined period of inactivity",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "configure automatic session locking",
      "enterprise assets coverage",
      "defined period requirement",
      "session security policy"
    ],
    coreRequirements: [ // Green - The "what"
      "automatic session locking",
      "defined inactivity period",
      "session timeout enforcement",
      "unauthorized access prevention"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "timeout configurations",
      "screen saver activation",
      "workstation locking",
      "mobile device locking",
      "server console locking",
      "application session timeouts",
      "idle session detection"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "group policy settings",
      "mobile device management",
      "screen saver configurations",
      "application timeout settings",
      "automated locking mechanisms"
    ],
    relatedSafeguards: ["1.1", "4.1", "4.2", "5.1", "6.1"],
    keywords: ["configure", "automatic", "session", "locking", "enterprise", "assets", "inactivity", "timeout"]
  },
  "4.4": {
    id: "4.4",
    title: "Implement and Manage a Firewall on Servers",
    description: "Implement and manage a firewall on servers",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "implement firewall on servers",
      "manage firewall on servers",
      "server protection requirement",
      "firewall management governance"
    ],
    coreRequirements: [ // Green - The "what"
      "firewall implementation",
      "firewall management",
      "server protection",
      "network traffic filtering"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "firewall rules configuration",
      "port access control",
      "protocol filtering",
      "traffic monitoring",
      "rule optimization",
      "logging configuration",
      "exception management"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "host-based firewalls",
      "operating system firewalls",
      "third-party firewall software",
      "firewall management tools",
      "centralized rule management"
    ],
    relatedSafeguards: ["1.1", "4.1", "4.2", "4.5", "12.1", "13.1"],
    keywords: ["implement", "manage", "firewall", "servers", "protection", "filtering", "rules"]
  },
  "4.5": {
    id: "4.5",
    title: "Implement and Manage a Firewall on End-User Devices",
    description: "Implement and manage a firewall on end-user devices",
    implementationGroup: "IG1",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "implement firewall on end-user devices",
      "manage firewall on end-user devices",
      "end-user device protection",
      "firewall policy enforcement"
    ],
    coreRequirements: [ // Green - The "what"
      "firewall implementation",
      "firewall management",
      "end-user device protection",
      "personal firewall deployment"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "desktop firewall configuration",
      "laptop firewall configuration",
      "mobile device firewall",
      "application-based rules",
      "network profile management",
      "exception handling",
      "centralized management"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Windows Defender Firewall",
      "macOS firewall",
      "third-party endpoint firewalls",
      "mobile device management",
      "centralized firewall management"
    ],
    relatedSafeguards: ["1.1", "4.1", "4.2", "4.4", "5.1"],
    keywords: ["implement", "manage", "firewall", "end-user", "devices", "personal", "protection"]
  },
  "4.6": {
    id: "4.6",
    title: "Securely Manage Enterprise Assets and Software",
    description: "Securely manage enterprise assets and software",
    implementationGroup: "IG2",
    assetType: ["devices", "applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "securely manage enterprise assets",
      "securely manage software",
      "secure management practices",
      "asset and software governance"
    ],
    coreRequirements: [ // Green - The "what"
      "secure asset management",
      "secure software management",
      "management security controls",
      "administrative access protection"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "administrative access controls",
      "privileged account management",
      "secure remote management",
      "management interface protection",
      "configuration change controls",
      "management tool security",
      "secure maintenance procedures"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "privileged access management",
      "secure remote access tools",
      "configuration management systems",
      "change management platforms",
      "secure administration protocols"
    ],
    relatedSafeguards: ["1.1", "2.1", "4.1", "4.7", "5.1", "5.4"],
    keywords: ["securely", "manage", "enterprise", "assets", "software", "administrative", "privileged"]
  },
  "4.7": {
    id: "4.7",
    title: "Manage Default Accounts on Enterprise Assets and Software",
    description: "Manage default accounts on enterprise assets and software",
    implementationGroup: "IG2",
    assetType: ["devices", "applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "manage default accounts",
      "enterprise assets coverage",
      "software coverage",
      "default account governance"
    ],
    coreRequirements: [ // Green - The "what"
      "default account management",
      "account security controls",
      "default credential elimination",
      "account hardening"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "default password changes",
      "default account disabling",
      "vendor default credentials",
      "system account management",
      "service account management",
      "account enumeration prevention",
      "credential strength requirements"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "credential management tools",
      "account discovery scanners",
      "password management systems",
      "automated account hardening",
      "vulnerability scanners"
    ],
    relatedSafeguards: ["1.1", "2.1", "4.1", "4.6", "5.1", "5.2", "5.3"],
    keywords: ["manage", "default", "accounts", "enterprise", "assets", "software", "credentials", "passwords"]
  },
  "4.8": {
    id: "4.8",
    title: "Uninstall or Disable Unnecessary Services on Enterprise Assets and Software",
    description: "Uninstall or disable unnecessary services on enterprise assets and software",
    implementationGroup: "IG2",
    assetType: ["devices", "applications"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "uninstall unnecessary services",
      "disable unnecessary services",
      "enterprise assets coverage",
      "service minimization governance"
    ],
    coreRequirements: [ // Green - The "what"
      "unnecessary service removal",
      "service disabling",
      "attack surface reduction",
      "minimal service deployment"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "service inventory",
      "service necessity assessment",
      "running services analysis",
      "port closure requirements",
      "daemon management",
      "startup service control",
      "service hardening"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "service management tools",
      "port scanning tools",
      "configuration baselines",
      "system hardening guides",
      "automated service management"
    ],
    relatedSafeguards: ["1.1", "2.1", "4.1", "4.9", "4.10"],
    keywords: ["uninstall", "disable", "unnecessary", "services", "enterprise", "assets", "minimization", "hardening"]
  },
  "4.9": {
    id: "4.9",
    title: "Configure Trusted DNS Servers on Enterprise Assets",
    description: "Configure trusted DNS servers on enterprise assets",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "configure trusted DNS servers",
      "enterprise assets coverage",
      "DNS security requirement",
      "trusted DNS governance"
    ],
    coreRequirements: [ // Green - The "what"
      "trusted DNS server configuration",
      "DNS security controls",
      "secure name resolution",
      "DNS poisoning prevention"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "DNS server selection",
      "DNS filtering implementation",
      "malicious domain blocking",
      "DNS over HTTPS configuration",
      "DNS over TLS configuration",
      "internal DNS management",
      "DNS monitoring"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "secure DNS services",
      "DNS filtering solutions",
      "internal DNS servers",
      "DNS security tools",
      "network-level DNS controls"
    ],
    relatedSafeguards: ["1.1", "4.1", "4.2", "4.8", "13.1"],
    keywords: ["configure", "trusted", "DNS", "servers", "enterprise", "assets", "secure", "resolution"]
  },
  "4.10": {
    id: "4.10",
    title: "Enforce Automatic Device Lockout on Portable End-User Devices",
    description: "Enforce automatic device lockout on portable end-user devices",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "enforce automatic device lockout",
      "portable end-user devices",
      "lockout policy enforcement",
      "device security governance"
    ],
    coreRequirements: [ // Green - The "what"
      "automatic device lockout",
      "portable device protection",
      "unauthorized access prevention",
      "device lock enforcement"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "mobile device lockout",
      "laptop lockout policies",
      "tablet lockout configuration",
      "biometric lockout options",
      "PIN/password lockout",
      "failed attempt thresholds",
      "lockout duration settings"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "mobile device management",
      "device policy enforcement",
      "biometric authentication",
      "automated lockout systems",
      "device compliance tools"
    ],
    relatedSafeguards: ["1.1", "4.3", "4.5", "5.1", "6.1"],
    keywords: ["enforce", "automatic", "device", "lockout", "portable", "end-user", "devices", "mobile"]
  },
  "4.11": {
    id: "4.11",
    title: "Enforce Remote Wipe Capability on Portable End-User Devices",
    description: "Enforce remote wipe capability on portable end-user devices",
    implementationGroup: "IG2",
    assetType: ["devices"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "enforce remote wipe capability",
      "portable end-user devices",
      "remote wipe governance",
      "device data protection policy"
    ],
    coreRequirements: [ // Green - The "what"
      "remote wipe capability",
      "portable device data protection",
      "emergency data removal",
      "lost device security"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "mobile device wipe",
      "laptop remote wipe",
      "tablet data removal",
      "selective wipe capabilities",
      "full device wipe options",
      "wipe trigger mechanisms",
      "wipe verification"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "mobile device management",
      "remote wipe solutions",
      "cloud-based device management",
      "enterprise mobility management",
      "device tracking systems"
    ],
    relatedSafeguards: ["1.1", "3.5", "4.10", "5.1"],
    keywords: ["enforce", "remote", "wipe", "capability", "portable", "end-user", "devices", "data", "removal"]
  },
  "4.12": {
    id: "4.12",
    title: "Separate Enterprise Workloads from Untrusted Networks",
    description: "Separate enterprise workloads from untrusted networks",
    implementationGroup: "IG3",
    assetType: ["network"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "separate enterprise workloads",
      "from untrusted networks",
      "network separation requirement",
      "workload isolation governance"
    ],
    coreRequirements: [ // Green - The "what"
      "enterprise workload separation",
      "untrusted network isolation",
      "network boundary controls",
      "secure network architecture"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "network segmentation",
      "VLAN separation",
      "subnet isolation",
      "firewall boundaries",
      "DMZ implementation",
      "air gap controls",
      "network access controls"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "network segmentation tools",
      "VLAN management systems",
      "next-generation firewalls",
      "network access control systems",
      "micro-segmentation platforms"
    ],
    relatedSafeguards: ["4.1", "4.2", "4.4", "12.1", "12.2", "12.3"],
    keywords: ["separate", "enterprise", "workloads", "untrusted", "networks", "isolation", "segmentation"]
  },
  "5.2": {
    id: "5.2",
    title: "Use Unique Passwords",
    description: "Use unique passwords for all enterprise assets",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "use unique passwords",
      "all enterprise assets",
      "password uniqueness requirement",
      "password governance policy"
    ],
    coreRequirements: [ // Green - The "what"
      "unique passwords",
      "password uniqueness enforcement",
      "no password reuse",
      "distinct credentials"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "password complexity requirements",
      "password history tracking",
      "password reuse prevention",
      "account-specific passwords",
      "service account passwords",
      "system account passwords",
      "password strength validation"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "password management systems",
      "password policy enforcement",
      "active directory policies",
      "password generators",
      "credential vaults"
    ],
    relatedSafeguards: ["5.1", "5.3", "5.4", "5.5", "5.6"],
    keywords: ["unique", "passwords", "enterprise", "assets", "password", "reuse", "complexity"]
  },
  "5.3": {
    id: "5.3",
    title: "Disable Dormant Accounts",
    description: "Delete or disable any dormant accounts after a period of 45 days of inactivity",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "delete or disable dormant accounts",
      "45 days inactivity period",
      "dormant account management",
      "account lifecycle governance"
    ],
    coreRequirements: [ // Green - The "what"
      "dormant account identification",
      "account deletion or disabling",
      "inactivity period monitoring",
      "automated account management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "account activity monitoring",
      "login tracking",
      "last access timestamps",
      "account status management",
      "deactivation procedures",
      "account archival processes",
      "reactivation workflows"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "identity management systems",
      "automated account lifecycle tools",
      "activity monitoring solutions",
      "account governance platforms",
      "directory service automation"
    ],
    relatedSafeguards: ["5.1", "5.2", "5.4", "5.5", "5.6"],
    keywords: ["disable", "dormant", "accounts", "45", "days", "inactivity", "delete", "lifecycle"]
  },
  "5.4": {
    id: "5.4",
    title: "Restrict Administrator Privileges to Dedicated Administrator Accounts",
    description: "Restrict administrator privileges to dedicated administrator accounts on enterprise assets",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "restrict administrator privileges",
      "dedicated administrator accounts",
      "enterprise assets coverage",
      "privilege separation governance"
    ],
    coreRequirements: [ // Green - The "what"
      "administrator privilege restriction",
      "dedicated admin accounts",
      "privilege separation",
      "role-based access control"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "privileged account identification",
      "admin account separation",
      "regular user accounts",
      "privilege escalation controls",
      "admin account monitoring",
      "privileged access workflows",
      "least privilege enforcement"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "privileged access management",
      "role-based access control systems",
      "admin account management tools",
      "privilege escalation monitoring",
      "just-in-time access"
    ],
    relatedSafeguards: ["4.6", "5.1", "5.2", "5.3", "5.5", "5.6", "6.1", "6.2"],
    keywords: ["restrict", "administrator", "privileges", "dedicated", "accounts", "enterprise", "assets", "privileged"]
  },
  "5.5": {
    id: "5.5",
    title: "Establish and Maintain an Inventory of Service Accounts",
    description: "Establish and maintain an inventory of service accounts",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish service account inventory",
      "maintain service account inventory",
      "service account governance",
      "inventory management requirements"
    ],
    coreRequirements: [ // Green - The "what"
      "service account inventory",
      "service account identification",
      "account classification",
      "service account tracking"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "service account names",
      "associated services",
      "account purposes",
      "account owners",
      "privilege levels",
      "account dependencies",
      "credential management"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "service account discovery tools",
      "identity management platforms",
      "account inventory systems",
      "automated discovery agents",
      "credential scanning tools"
    ],
    relatedSafeguards: ["1.1", "2.1", "5.1", "5.2", "5.3", "5.4", "5.6"],
    keywords: ["establish", "maintain", "inventory", "service", "accounts", "identification", "tracking"]
  },
  "5.6": {
    id: "5.6",
    title: "Centralize Account Management",
    description: "Centralize account management through a directory service or identity provider",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "centralize account management",
      "directory service or identity provider",
      "centralized management requirement",
      "identity governance"
    ],
    coreRequirements: [ // Green - The "what"
      "centralized account management",
      "directory service integration",
      "identity provider deployment",
      "unified account control"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "directory service implementation",
      "identity provider integration",
      "single sign-on capabilities",
      "federated identity management",
      "account provisioning automation",
      "centralized authentication",
      "identity synchronization"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Active Directory services",
      "LDAP directories",
      "cloud identity providers",
      "identity management platforms",
      "federation services"
    ],
    relatedSafeguards: ["5.1", "5.2", "5.3", "5.4", "5.5", "6.1", "6.2", "6.3"],
    keywords: ["centralize", "account", "management", "directory", "service", "identity", "provider"]
  },
  "6.1": {
    id: "6.1",
    title: "Establish an Access Granting Process",
    description: "Establish and follow a process for granting access to enterprise assets upon new hire, promotion, or role change",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "establish access granting process",
      "follow access granting process",
      "new hire promotion role change coverage",
      "access governance framework"
    ],
    coreRequirements: [ // Green - The "what"
      "access granting process",
      "new hire access provisioning",
      "promotion access updates",
      "role change access management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "access request workflows",
      "manager approval processes",
      "role-based access assignment",
      "access provisioning procedures",
      "onboarding access checklists",
      "access documentation requirements",
      "approval audit trails"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "identity governance platforms",
      "access request systems",
      "workflow automation tools",
      "role-based provisioning systems",
      "approval workflow tools"
    ],
    relatedSafeguards: ["5.1", "5.4", "5.6", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8"],
    keywords: ["establish", "access", "granting", "process", "new", "hire", "promotion", "role", "change"]
  },
  "6.2": {
    id: "6.2",
    title: "Establish an Access Revoking Process",
    description: "Establish and follow a process for revoking access to enterprise assets upon termination, demotion, or role change",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "establish access revoking process",
      "follow access revoking process",
      "termination demotion role change coverage",
      "access revocation governance"
    ],
    coreRequirements: [ // Green - The "what"
      "access revoking process",
      "termination access removal",
      "demotion access reduction",
      "role change access adjustment"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "termination procedures",
      "access revocation checklists",
      "account deactivation processes",
      "credential recovery procedures",
      "system access removal",
      "physical access revocation",
      "asset return procedures"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "identity governance platforms",
      "automated deprovisioning",
      "HR system integration",
      "access revocation workflows",
      "termination checklist systems"
    ],
    relatedSafeguards: ["5.1", "5.3", "5.4", "5.6", "6.1", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8"],
    keywords: ["establish", "access", "revoking", "process", "termination", "demotion", "role", "change"]
  },
  "6.4": {
    id: "6.4",
    title: "Require MFA for Remote Network Access",
    description: "Require MFA for remote network access",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "require MFA for remote access",
      "remote network access coverage",
      "MFA enforcement policy",
      "remote access governance"
    ],
    coreRequirements: [ // Green - The "what"
      "multi-factor authentication",
      "remote network access",
      "MFA enforcement",
      "remote access security"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "VPN access controls",
      "remote desktop authentication",
      "cloud service access",
      "mobile device access",
      "authentication factors",
      "MFA token management",
      "backup authentication methods"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "VPN with MFA integration",
      "remote access gateways",
      "cloud identity providers",
      "MFA token systems",
      "biometric authentication"
    ],
    relatedSafeguards: ["5.6", "6.1", "6.2", "6.3", "6.5", "6.6"],
    keywords: ["require", "MFA", "remote", "network", "access", "multi-factor", "authentication", "VPN"]
  },
  "6.5": {
    id: "6.5",
    title: "Require MFA for Administrative Access",
    description: "Require MFA for administrative access to enterprise assets",
    implementationGroup: "IG1",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "require MFA for administrative access",
      "enterprise assets coverage",
      "administrative access governance",
      "MFA policy enforcement"
    ],
    coreRequirements: [ // Green - The "what"
      "multi-factor authentication",
      "administrative access",
      "privileged account protection",
      "MFA enforcement"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "administrator account protection",
      "privileged access controls",
      "system administration access",
      "database administration access",
      "network administration access",
      "security administration access",
      "emergency access procedures"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "privileged access management",
      "administrative MFA systems",
      "just-in-time access",
      "privileged session management",
      "administrative workstations"
    ],
    relatedSafeguards: ["5.4", "5.6", "6.1", "6.2", "6.3", "6.4", "6.6"],
    keywords: ["require", "MFA", "administrative", "access", "enterprise", "assets", "privileged", "protection"]
  },
  "6.6": {
    id: "6.6",
    title: "Establish and Maintain an Inventory of Authentication and Authorization Systems",
    description: "Establish and maintain an inventory of authentication and authorization systems",
    implementationGroup: "IG2",
    assetType: ["applications"],
    securityFunction: ["Identify"],
    governanceElements: [ // Orange - MUST be met
      "establish auth system inventory",
      "maintain auth system inventory",
      "authentication authorization coverage",
      "auth system governance"
    ],
    coreRequirements: [ // Green - The "what"
      "authentication system inventory",
      "authorization system inventory",
      "identity system tracking",
      "access control system management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "identity providers",
      "authentication servers",
      "authorization systems",
      "single sign-on systems",
      "directory services",
      "access control lists",
      "federation services"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "identity system discovery tools",
      "authentication inventory platforms",
      "system catalog management",
      "integration mapping tools",
      "identity architecture documentation"
    ],
    relatedSafeguards: ["1.1", "2.1", "5.1", "5.6", "6.1", "6.2", "6.3", "6.4", "6.5", "6.7", "6.8"],
    keywords: ["establish", "maintain", "inventory", "authentication", "authorization", "systems", "identity"]
  },
  "6.7": {
    id: "6.7",
    title: "Centralize Access Control",
    description: "Centralize access control for all enterprise assets through a directory service or SSO provider",
    implementationGroup: "IG2",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "centralize access control",
      "all enterprise assets",
      "directory service or SSO provider",
      "centralized control governance"
    ],
    coreRequirements: [ // Green - The "what"
      "centralized access control",
      "directory service integration",
      "SSO provider deployment",
      "unified access management"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "single sign-on implementation",
      "directory service integration",
      "federated authentication",
      "centralized authorization",
      "access policy management",
      "identity federation",
      "cross-platform integration"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "Active Directory integration",
      "SAML-based SSO",
      "OAuth implementations",
      "identity federation platforms",
      "centralized access gateways"
    ],
    relatedSafeguards: ["5.6", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.8"],
    keywords: ["centralize", "access", "control", "enterprise", "assets", "directory", "service", "SSO"]
  },
  "6.8": {
    id: "6.8",
    title: "Define and Maintain Role-Based Access Control",
    description: "Define and maintain role-based access control, through determining and documenting the access rights necessary for each role within the enterprise",
    implementationGroup: "IG3",
    assetType: ["users"],
    securityFunction: ["Protect"],
    governanceElements: [ // Orange - MUST be met
      "define role-based access control",
      "maintain role-based access control",
      "determine access rights for each role",
      "document access rights"
    ],
    coreRequirements: [ // Green - The "what"
      "role-based access control",
      "access rights determination",
      "role documentation",
      "RBAC implementation"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "role definitions",
      "permission matrices",
      "access entitlements",
      "role hierarchies",
      "job function mapping",
      "segregation of duties",
      "role certification processes"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "RBAC management systems",
      "role mining tools",
      "access certification platforms",
      "permission analysis tools",
      "role governance systems"
    ],
    relatedSafeguards: ["5.1", "5.4", "6.1", "6.2", "6.6", "6.7"],
    keywords: ["define", "maintain", "role-based", "access", "control", "RBAC", "roles", "permissions"]
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
    keywords: ["establish", "maintain", "remediation", "process", "SLA", "security", "vulnerabilities"]
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
    keywords: ["perform", "automated", "operating", "system", "patch", "management", "enterprise", "assets"]
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
    keywords: ["perform", "automated", "application", "patch", "management", "enterprise", "assets", "updates"]
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
    keywords: ["perform", "automated", "vulnerability", "scans", "internal", "enterprise", "assets", "quarterly"]
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
    keywords: ["perform", "automated", "vulnerability", "scans", "externally-exposed", "enterprise", "assets"]
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
    keywords: ["remediate", "detected", "vulnerabilities", "software", "monthly", "processes", "tooling"]
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
    keywords: ["audit log management", "logging requirements", "collection", "review", "retention", "process", "documented"]
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
    keywords: ["collect", "audit logs", "logging", "enabled", "enterprise assets"]
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
    keywords: ["adequate storage", "logging destinations", "maintain", "comply"]
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
    keywords: ["time synchronization", "synchronized", "time sources", "configure", "standardize"]
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
    keywords: ["detailed audit logging", "sensitive data", "forensic investigation", "event source", "timestamp"]
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
    keywords: ["DNS query", "audit logs", "collect", "DNS", "query logs"]
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
    keywords: ["URL request", "audit logs", "collect", "URL", "web logs"]
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
    keywords: ["command-line", "audit logs", "PowerShell", "BASH", "terminal", "administrative"]
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
    keywords: ["centralize", "audit logs", "collection", "retention", "SIEM", "log sources"]
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
    keywords: ["retain", "audit logs", "90 days", "retention", "minimum"]
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
    keywords: ["audit log reviews", "anomalies", "abnormal events", "threat", "weekly", "reviews"]
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
    keywords: ["service provider logs", "authentication", "authorization", "data creation", "disposal", "user management"]
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
    keywords: ["deploy", "maintain", "anti-malware", "software", "enterprise", "assets", "endpoint", "protection"]
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
      "enterprise assets coverage",
      "signature currency maintenance"
    ],
    subTaxonomicalElements: [ // Yellow - Sub-taxonomical elements
      "configure",
      "automatic updates",
      "anti-malware signature files",
      "all enterprise assets"
    ],
    implementationSuggestions: [ // Gray - Implementation suggestions
      "automatic update systems",
      "signature distribution mechanisms",
      "centralized update management",
      "update scheduling tools"
    ],
    relatedSafeguards: ["10.1"],
    keywords: ["configure", "automatic", "updates", "signature", "files", "anti-malware", "enterprise", "assets"]
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
    keywords: ["disable", "autorun", "autoplay", "auto-execute", "removable", "media", "configuration"]
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
    keywords: ["configure", "anti-malware", "software", "automatically", "scan", "removable", "media"]
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
    keywords: ["enable", "anti-exploitation", "features", "enterprise", "assets", "software", "DEP", "WDEG", "SIP", "gatekeeper"]
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
    keywords: ["centrally", "manage", "anti-malware", "software", "centralized", "management"]
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
    keywords: ["use", "behavior-based", "anti-malware", "software", "behavioral", "analysis", "advanced", "detection"]
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
    keywords: ["establish", "maintain", "documented", "data", "recovery", "process", "backup", "prioritization"]
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
    keywords: ["perform", "automated", "backups", "enterprise", "assets", "weekly", "frequency", "sensitivity"]
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
    keywords: ["protect", "recovery", "data", "equivalent", "controls", "encryption", "separation", "requirements"]
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
    keywords: ["establish", "maintain", "isolated", "instance", "recovery", "data", "offline", "cloud", "off-site"]
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
    keywords: ["test", "backup", "recovery", "quarterly", "frequently", "sampling", "enterprise", "assets"]
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
    keywords: ["ensure", "network", "infrastructure", "up-to-date", "software", "versions", "monthly", "NaaS"]
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
    keywords: ["establish", "maintain", "secure", "network", "architecture", "segmentation", "least", "privilege", "availability"]
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
    keywords: ["securely", "manage", "network", "infrastructure", "version-controlled", "SSH", "HTTPS", "protocols"]
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
    keywords: ["establish", "maintain", "architecture", "diagrams", "documentation", "annually", "enterprise", "changes"]
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
    keywords: ["centralize", "network", "AAA", "authentication", "authorization", "auditing"]
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
    keywords: ["use", "secure", "network", "management", "communication", "protocols", "802.1X", "WPA2", "enterprise"]
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
    keywords: ["require", "users", "authenticate", "enterprise-managed", "VPN", "authentication", "services", "devices"]
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
    keywords: ["establish", "maintain", "dedicated", "computing", "resources", "administrative", "work", "segmented", "SAW"]
  },

  // Control 13: Network Monitoring and Defense
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
    keywords: ["centralize", "security", "event", "alerting", "log", "correlation", "analysis", "exploitation"]
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
    keywords: ["deploy", "host-based", "intrusion", "detection", "solution", "enterprise", "assets"]
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
    keywords: ["deploy", "network", "intrusion", "detection", "solution", "ruleset", "threats", "industry"]
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
    keywords: ["perform", "traffic", "filtering", "network", "segments", "technically", "feasible"]
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
    keywords: ["manage", "access", "control", "remote", "assets", "connecting", "enterprise", "networks"]
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
    keywords: ["collect", "network", "traffic", "flow", "logs", "review", "alert"]
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
    keywords: ["deploy", "host-based", "intrusion", "prevention", "solution", "enterprise", "assets"]
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
    keywords: ["deploy", "network", "intrusion", "prevention", "solution", "block", "malicious", "real-time"]
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
    keywords: ["deploy", "port-level", "access", "control", "802.1x", "network", "protocols", "certificates"]
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
    keywords: ["perform", "application", "layer", "filtering", "protect", "network-based", "attacks"]
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
    keywords: ["tune", "security", "event", "alerting", "thresholds", "monthly", "frequently"]
  },

  // Control 9: Email and Web Browser Protections
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
    keywords: ["ensure", "fully", "supported", "browsers", "email", "clients", "latest", "version", "vendor"]
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
    keywords: ["use", "DNS", "filtering", "services", "end-user", "devices", "block", "malicious", "domains"]
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
    keywords: ["maintain", "enforce", "network-based", "URL", "filters", "limit", "malicious", "unapproved", "websites"]
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
    keywords: ["restrict", "unauthorized", "unnecessary", "browser", "email", "plugins", "extensions", "add-on"]
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
    keywords: ["implement", "DMARC", "policy", "verification", "SPF", "DKIM", "spoofed", "modified", "emails"]
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
    keywords: ["block", "unnecessary", "file", "types", "email", "gateway", "enterprise"]
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
    keywords: ["deploy", "maintain", "email", "server", "anti-malware", "protections", "attachment", "scanning", "sandboxing"]
  }
};

export class GRCAnalysisServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'framework-mcp',
        version: '1.0.0',
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
    
    // Capability detection keywords
    const governanceKeywords = [
      'policy', 'policies', 'manage', 'process', 'workflow', 'governance', 'grc', 
      'compliance management', 'documented', 'establish', 'maintain', 'procedure',
      'control', 'controls', 'framework', 'standard', 'enterprise risk management',
      'centralized management', 'oversight'
    ];
    
    const facilitatesKeywords = [
      // Technical facilitation (original keywords)
      'improve', 'enhance', 'optimize', 'faster', 'better', 'stronger', 'automate', 
      'streamline', 'efficiency', 'facilitate', 'support', 'enable', 'accelerate',
      'api', 'integration', 'data', 'export', 'import', 'sync', 'feed',
      // Governance/process facilitation (new keywords for tools like Upolicy)
      'enables compliance', 'facilitates implementation', 'supports compliance',
      'creates framework', 'enables organizations', 'infrastructure', 'foundation',
      'compliance infrastructure', 'audit infrastructure', 'policy framework',
      'enables effective', 'working together', 'comprehensive coverage',
      'template', 'templates', 'workflow automation', 'orchestration'
    ];
    
    const validatesKeywords = [
      'audit', 'report', 'evidence', 'verify', 'validate', 'check', 'monitor', 
      'compliance report', 'assessment', 'logging', 'tracking', 'review', 'attest',
      'dashboard', 'metrics', 'analytics', 'visibility', 'alert', 'attestation',
      'compliance tracking', 'audit trail', 'reporting capabilities'
    ];

    // Analyze element coverage (binary: covered or not)
    const coreCoverage = this.analyzeBinaryElementCoverage(text, safeguard.coreRequirements);
    const subElementCoverage = this.analyzeBinaryElementCoverage(text, safeguard.subTaxonomicalElements);
    const governanceCoverage = this.analyzeBinaryElementCoverage(text, safeguard.governanceElements);
    const implementationCoverage = this.analyzeBinaryElementCoverage(text, safeguard.implementationSuggestions);

    // Enhanced capability detection with better scoring
    const governanceScore = this.calculateKeywordScore(text, governanceKeywords);
    const facilitatesScore = this.calculateKeywordScore(text, facilitatesKeywords);
    const validatesScore = this.calculateKeywordScore(text, validatesKeywords);
    
    const governanceCapability = governanceScore > 0.3;
    const facilitatesCapability = facilitatesScore > 0.3;
    const validatesCapability = validatesScore > 0.3;
    
    // Check for specific facilitation patterns (tools that enable/support compliance)
    const facilitationPatterns = [
      'enables compliance', 'facilitates implementation', 'creates framework',
      'policy framework', 'compliance infrastructure', 'audit infrastructure',
      'enables organizations', 'enables effective', 'working together',
      'creates the policy framework', 'enables organizations to implement',
      'facilitates implementation of', 'compliance infrastructure facilitates'
    ];
    const hasFacilitationPattern = facilitationPatterns.some(pattern => text.includes(pattern));
    
    // Check for explicit non-implementation language
    const nonImplementationPatterns = [
      'don\'t scan', 'don\'t catalog', 'doesn\'t scan', 'doesn\'t catalog',
      'not scan', 'not catalog', 'even though we don\'t', 'we don\'t directly',
      'rather than direct', 'instead of direct'
    ];
    const hasNonImplementationLanguage = nonImplementationPatterns.some(pattern => text.includes(pattern));
    
    // Determine if full or partial coverage (based on core + sub-taxonomical elements)
    const totalCoreAndSubElements = safeguard.coreRequirements.length + safeguard.subTaxonomicalElements.length;
    const coveredCoreAndSubElements = coreCoverage.coveredElements.length + subElementCoverage.coveredElements.length;
    
    let fullCapability = false;
    let partialCapability = false;
    
    if (totalCoreAndSubElements > 0) {
      if (coveredCoreAndSubElements === totalCoreAndSubElements) {
        fullCapability = true;
      } else if (coveredCoreAndSubElements > 0) {
        partialCapability = true;
      }
    }

    // Enhanced primary capability logic
    let primaryCapability: 'full' | 'partial' | 'facilitates' | 'governance' | 'validates' | 'none' = 'none';
    
    if (fullCapability) {
      primaryCapability = 'full';
    } else if (hasFacilitationPattern || hasNonImplementationLanguage || 
               (facilitatesScore > 0.4 && facilitatesScore > governanceScore * 1.2)) {
      // Prioritize facilitation when:
      // 1. Clear facilitation language patterns detected, OR
      // 2. Explicit non-implementation language (tool doesn't directly implement), OR  
      // 3. Facilitates score is substantial AND significantly higher than governance
      primaryCapability = 'facilitates';
    } else if (partialCapability) {
      primaryCapability = 'partial';
    } else if (governanceCapability && (facilitatesCapability || validatesCapability)) {
      // Tools that primarily manage governance but also facilitate/validate
      primaryCapability = 'governance';
    } else if (governanceScore > facilitatesScore && governanceCapability) {
      // Pure governance tools
      primaryCapability = 'governance';
    } else if (validatesScore > facilitatesScore && validatesCapability) {
      // Validation-focused tools
      primaryCapability = 'validates';
    } else if (facilitatesCapability) {
      // Default facilitation
      primaryCapability = 'facilitates';
    }

    // Extract evidence
    const evidence = this.extractEnhancedEvidence(responseText, safeguard);

    // Calculate confidence based on evidence strength and keyword matches
    const keywordConfidence = (governanceScore + facilitatesScore + validatesScore) / 3;
    
    const coverageConfidence = totalCoreAndSubElements > 0 ? 
      coveredCoreAndSubElements / totalCoreAndSubElements : 0;
    
    const confidence = Math.min(
      (keywordConfidence * 0.4 + coverageConfidence * 0.6) * 100,
      100
    );

    return {
      vendor: vendorName,
      safeguardId: safeguard.id,
      safeguardTitle: safeguard.title,
      capability: primaryCapability,
      capabilities: {
        full: fullCapability,
        partial: partialCapability,
        facilitates: facilitatesCapability,
        governance: governanceCapability,
        validates: validatesCapability
      },
      confidence: Math.round(confidence),
      reasoning: this.generateCapabilityReasoning(primaryCapability, fullCapability, partialCapability, governanceCapability, facilitatesCapability, validatesCapability, coreCoverage, subElementCoverage, safeguard, hasFacilitationPattern, hasNonImplementationLanguage),
      evidence,
      elementsCovered: {
        coreRequirements: coreCoverage.coveredElements,
        subTaxonomicalElements: subElementCoverage.coveredElements,
        governanceElements: governanceCoverage.coveredElements,
        implementationMethods: implementationCoverage.coveredElements
      },
      elementsNotCovered: {
        coreRequirements: coreCoverage.uncoveredElements,
        subTaxonomicalElements: subElementCoverage.uncoveredElements
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

  private generateCapabilityReasoning(
    primaryCapability: string,
    full: boolean,
    partial: boolean, 
    governance: boolean,
    facilitates: boolean,
    validates: boolean,
    coreCoverage: any,
    subElementCoverage: any,
    safeguard: SafeguardElement,
    hasFacilitationPattern: boolean = false,
    hasNonImplementationLanguage: boolean = false
  ): string {
    const reasons = [];
    
    // Primary capability explanation
    switch (primaryCapability) {
      case 'full':
        reasons.push(`Provides FULL coverage of ${safeguard.title} - directly implements all core and sub-taxonomical elements`);
        break;
      case 'partial':
        reasons.push(`Provides PARTIAL coverage of ${safeguard.title} - directly implements some but not all core and sub-taxonomical elements`);
        break;
      case 'facilitates':
        if (hasFacilitationPattern || hasNonImplementationLanguage || governance) {
          reasons.push(`FACILITATES ${safeguard.title} by creating governance frameworks, policy infrastructure, and compliance processes that enable organizations to implement the control effectively`);
        } else {
          reasons.push(`FACILITATES ${safeguard.title} through data integration, automation, or technical capabilities that support implementation`);
        }
        break;
      case 'governance':
        reasons.push(`Provides GOVERNANCE capabilities for ${safeguard.title} through centralized policy management, process controls, and compliance oversight`);
        break;
      case 'validates':
        reasons.push(`VALIDATES ${safeguard.title} implementation through evidence collection, compliance reporting, and audit capabilities`);
        break;
      default:
        reasons.push(`No clear capability identified for ${safeguard.title}`);
    }
    
    // Coverage details
    if (coreCoverage.coveredElements.length > 0) {
      reasons.push(`Core elements addressed: ${coreCoverage.coveredElements.length}/${safeguard.coreRequirements.length}`);
    }
    if (subElementCoverage.coveredElements.length > 0) {
      reasons.push(`Sub-taxonomical elements addressed: ${subElementCoverage.coveredElements.length}/${safeguard.subTaxonomicalElements.length}`);
    }
    
    // Additional context for facilitation tools
    if (primaryCapability === 'facilitates') {
      if (hasFacilitationPattern || hasNonImplementationLanguage || governance) {
        reasons.push(`Note: This type of facilitation tool works alongside technical implementation solutions (asset scanners, MDM tools, etc.) to provide comprehensive control coverage`);
      }
      if (hasNonImplementationLanguage) {
        reasons.push(`Tool explicitly enables compliance through governance/process rather than direct technical implementation`);
      }
    }
    
    // Multi-capability products
    const capabilityFlags = [governance, facilitates, validates].filter(Boolean);
    if (capabilityFlags.length > 1) {
      const capabilities = [];
      if (governance) capabilities.push('governance');
      if (facilitates) capabilities.push('facilitates');
      if (validates) capabilities.push('validates');
      reasons.push(`Multi-capability product with: ${capabilities.join(', ')}`);
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
        const totalElements = safeguard.coreRequirements.length + safeguard.subTaxonomicalElements.length;
        const coveredElements = analysis.elementsCovered.coreRequirements.length + analysis.elementsCovered.subTaxonomicalElements.length;
        validation.gaps.push(`FULL coverage claim not supported: Only ${coveredElements}/${totalElements} core and sub-taxonomical elements covered`);
      }
    } else if (claim === 'PARTIAL') {
      const meetsPartialCriteria = analysis.capabilities.partial || analysis.capabilities.full;
      validation.coverageClaimValid = meetsPartialCriteria;
      
      if (!meetsPartialCriteria) {
        validation.gaps.push(`PARTIAL coverage claim questionable: No core or sub-taxonomical elements clearly addressed`);
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
      
      // Specific recommendations based on gaps
      if (analysis.elementsNotCovered.coreRequirements.length > 0) {
        validation.recommendations.push(`Request details on how these core elements are addressed: ${analysis.elementsNotCovered.coreRequirements.slice(0,3).join(', ')}${analysis.elementsNotCovered.coreRequirements.length > 3 ? '...' : ''}`);
      }
      
      if (analysis.elementsNotCovered.subTaxonomicalElements.length > 0) {
        validation.recommendations.push(`Ask for specifics on these sub-taxonomical elements: ${analysis.elementsNotCovered.subTaxonomicalElements.slice(0,3).join(', ')}${analysis.elementsNotCovered.subTaxonomicalElements.length > 3 ? '...' : ''}`);
      }
      
      if (!analysis.capabilities.validates && capabilities.includes('Validates')) {
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