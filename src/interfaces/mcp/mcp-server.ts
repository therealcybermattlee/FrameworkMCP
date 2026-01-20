#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { SafeguardManager } from '../../core/safeguard-manager.js';

export class FrameworkMcpServer {
  private server: Server;
  private safeguardManager: SafeguardManager;

  constructor() {
    this.server = new Server(
      {
        name: 'framework-analyzer',
        version: '2.2.0',
      }
    );

    this.safeguardManager = new SafeguardManager();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
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
            version: '1.5.3'
          }, null, 2),
        },
      ],
    };
  }

  private formatErrorMessage(error: unknown, toolName: string): string {
    if (error instanceof Error) {
      // Provide helpful guidance for common errors
      if (error.message.includes('Safeguard') && error.message.includes('not found')) {
        return `${error.message}. Use list_available_safeguards to see all available options.`;
      }
      
      return error.message;
    }
    
    return `Unknown error in tool ${toolName}`;
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('🤖 Framework MCP Server v1.5.3 running via stdio');
    console.error('📊 Pure Data Provider for CIS Controls v8.1');
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new FrameworkMcpServer();
  server.run().catch(console.error);
}