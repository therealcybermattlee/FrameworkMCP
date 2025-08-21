#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { CapabilityAnalyzer } from '../../core/capability-analyzer.js';
import { SafeguardManager } from '../../core/safeguard-manager.js';

export class FrameworkMcpServer {
  private server: Server;
  private capabilityAnalyzer: CapabilityAnalyzer;
  private safeguardManager: SafeguardManager;

  constructor() {
    this.server = new Server(
      {
        name: 'framework-analyzer',
        version: '1.3.6',
      }
    );

    this.capabilityAnalyzer = new CapabilityAnalyzer();
    this.safeguardManager = new SafeguardManager();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'validate_vendor_mapping',
            description: 'PRIMARY: Validate vendor capability claims with domain validation and evidence analysis',
            inputSchema: {
              type: 'object',
              properties: {
                vendor_name: {
                  type: 'string',
                  description: 'Name of the vendor/tool being analyzed'
                },
                safeguard_id: {
                  type: 'string',
                  description: 'CIS safeguard ID (e.g., "1.1", "5.1")'
                },
                claimed_capability: {
                  type: 'string',
                  description: 'Claimed capability role',
                  enum: ['full', 'partial', 'facilitates', 'governance', 'validates']
                },
                supporting_text: {
                  type: 'string',
                  description: 'Vendor text supporting their capability claim'
                }
              },
              required: ['vendor_name', 'safeguard_id', 'claimed_capability', 'supporting_text']
            }
          } as Tool,
          {
            name: 'analyze_vendor_response',
            description: 'Determine vendor tool capability role for specific safeguard',
            inputSchema: {
              type: 'object',
              properties: {
                vendor_name: {
                  type: 'string',
                  description: 'Name of the vendor'
                },
                safeguard_id: {
                  type: 'string',
                  description: 'CIS safeguard ID (e.g., "1.1", "5.1")'
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
            description: 'Get detailed safeguard breakdown',
            inputSchema: {
              type: 'object',
              properties: {
                safeguard_id: {
                  type: 'string',
                  description: 'CIS safeguard ID (e.g., "1.1", "5.1")'
                },
                include_examples: {
                  type: 'boolean',
                  description: 'Include implementation examples (default: false)'
                }
              },
              required: ['safeguard_id']
            }
          } as Tool,
          {
            name: 'list_available_safeguards',
            description: 'List all available CIS safeguards',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          } as Tool,
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'validate_vendor_mapping':
            return await this.validateVendorMapping(args);

          case 'analyze_vendor_response':
            return await this.analyzeVendorResponse(args);

          case 'get_safeguard_details':
            return await this.getSafeguardDetails(args);

          case 'list_available_safeguards':
            return await this.listAvailableSafeguards();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = this.formatErrorMessage(error, name);
        console.error(`[Framework MCP] Tool execution error: ${name}`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                error: errorMessage,
                timestamp: new Date().toISOString()
              }, null, 2),
            },
          ],
        };
      }
    });
  }

  private async validateVendorMapping(args: any) {
    const { vendor_name = 'Unknown Vendor', safeguard_id, claimed_capability, supporting_text } = args;

    // Input validation
    this.validateTextInput(supporting_text, 'Supporting text');
    this.validateCapability(claimed_capability);
    this.safeguardManager.validateSafeguardId(safeguard_id);

    const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found`);
    }

    const validation = this.capabilityAnalyzer.validateVendorMapping(
      vendor_name, 
      safeguard_id,
      claimed_capability,
      supporting_text,
      safeguard
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

  private async analyzeVendorResponse(args: any) {
    const { vendor_name = 'Unknown Vendor', safeguard_id, response_text } = args;

    this.validateTextInput(response_text, 'Response text');
    this.safeguardManager.validateSafeguardId(safeguard_id);

    const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found`);
    }

    const analysis = this.capabilityAnalyzer.performCapabilityAnalysis(vendor_name, safeguard, response_text);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }

  private async getSafeguardDetails(args: any) {
    const { safeguard_id, include_examples = false } = args;

    this.safeguardManager.validateSafeguardId(safeguard_id);

    const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id, include_examples);
    if (!safeguard) {
      throw new Error(`Safeguard ${safeguard_id} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(safeguard, null, 2),
        },
      ],
    };
  }

  private async listAvailableSafeguards() {
    const safeguards = this.safeguardManager.listAvailableSafeguards();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            safeguards,
            total: safeguards.length,
            framework: 'CIS Controls v8.1',
            version: '1.3.6'
          }, null, 2),
        },
      ],
    };
  }

  private validateTextInput(text: string, fieldName: string): void {
    if (typeof text !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    if (text.length < 10) {
      throw new Error(`${fieldName} must be at least 10 characters long`);
    }
    
    if (text.length > 10000) {
      throw new Error(`${fieldName} must be less than 10,000 characters`);
    }
  }

  private validateCapability(capability: string): void {
    const validCapabilities = ['full', 'partial', 'facilitates', 'governance', 'validates'];
    
    if (!validCapabilities.includes(capability.toLowerCase())) {
      throw new Error(`Invalid capability '${capability}'. Valid options: ${validCapabilities.join(', ')}`);
    }
  }

  private formatErrorMessage(error: unknown, toolName: string): string {
    if (error instanceof Error) {
      // Provide helpful guidance for common errors
      if (error.message.includes('Safeguard') && error.message.includes('not found')) {
        return `${error.message}. Use list_available_safeguards to see all available options.`;
      }
      
      if (error.message.includes('Invalid capability')) {
        return `${error.message}. Capability roles determine what function the vendor tool plays in safeguard implementation.`;
      }
      
      if (error.message.includes('characters')) {
        return `${error.message}. Ensure your input text is substantive enough for analysis.`;
      }
      
      return error.message;
    }
    
    return `Unknown error in tool ${toolName}`;
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('🤖 Framework MCP Server v1.3.6 running via stdio');
    console.error('📊 Capability assessment with domain validation enabled');
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new FrameworkMcpServer();
  server.run().catch(console.error);
}