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
export { SafeguardManager } from './core/safeguard-manager.js';

// Pure Data Provider architecture - authentic CIS Controls data via SafeguardManager

