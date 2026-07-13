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

// Public type contract. Exported so the assessment vocabulary is reachable by
// consumers -- the previous taxonomy rotted precisely because it was defined
// but never exported, and so drifted unnoticed across four minor versions.
export type {
  SafeguardElement,
  ElementsAddressed,
  ScopeLimits,
  VendorAssessment,
  VendorProfile,
} from './shared/types.js';

// Pure Data Provider architecture - authentic CIS Controls data via SafeguardManager

