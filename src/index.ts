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

