# Framework MCP

[![npm version](https://badge.fury.io/js/framework-mcp.svg)](https://badge.fury.io/js/framework-mcp)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

A Model Context Protocol (MCP) server providing **authoritative CIS Controls Framework data** for LLM-driven vendor capability analysis. Access all 153 CIS v8.1 safeguards through MCP or HTTP API.

> **Breaking Change in v2.0**: The API now returns five capability-specific prompt fields instead of a single `systemPrompt`. See [Migration Guide](docs/migration-v2.0.md).

## Quick Start

### Install from npm
```bash
npm install -g framework-mcp
```

### Install from source
```bash
git clone https://github.com/therealcybermattlee/FrameworkMCP.git
cd FrameworkMCP
npm install && npm run build
```

## Configuration

### MCP Integration (Claude Code)

Add to `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "framework-analyzer": {
      "command": "framework-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

Or if installed from source:
```json
{
  "mcpServers": {
    "framework-analyzer": {
      "command": "node",
      "args": ["/path/to/FrameworkMCP/dist/index.js"],
      "env": {}
    }
  }
}
```

### HTTP API (Local)

```bash
npm run start:http
# Server runs on http://localhost:8080
```

## API Reference

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_safeguard_details` | Get detailed safeguard breakdown with capability-specific prompts |
| `list_available_safeguards` | List all 153 CIS safeguards |

### HTTP Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /api` | API documentation |
| `GET /api/safeguards` | List all safeguards |
| `GET /api/safeguards/:id` | Get safeguard details |
| `GET /api/safeguards/:id?include_examples=true` | Include implementation examples |

## Usage Examples

### MCP (Claude Code)
```bash
claude-code "Use get_safeguard_details for safeguard 1.1"
claude-code "List all available CIS safeguards"
```

### HTTP API
```bash
curl http://localhost:8080/api/safeguards
curl http://localhost:8080/api/safeguards/1.1
curl http://localhost:8080/api/safeguards/5.1?include_examples=true
```

## The 5 Capability Roles

Each safeguard includes prompts for five assessment types:

| Role | Field | Use Case |
|------|-------|----------|
| **Full** | `systemPromptFull` | Vendor claims complete implementation |
| **Partial** | `systemPromptPartial` | Vendor provides limited features |
| **Facilitates** | `systemPromptFacilitates` | Tool enables others to implement |
| **Governance** | `systemPromptGovernance` | Policy/process/oversight capabilities |
| **Validates** | `systemPromptValidates` | Audit/evidence/reporting capabilities |

## Cloud Deployment

### DigitalOcean App Services
```bash
doctl apps create .do/app.yaml
```

### Railway
```bash
railway login && railway up
```

### Render
- **Build**: `npm install && npm run build`
- **Start**: `npm run start:http`
- **Port**: 8080

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | HTTP server port |
| `NODE_ENV` | development | Environment mode |
| `ALLOWED_ORIGINS` | localhost:3000 | CORS allowed origins (comma-separated) |
| `RATE_LIMIT_WINDOW_MS` | 60000 | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |

## CIS Controls Coverage

- **153 safeguards** across 18 controls
- **CIS Controls v8.1** framework
- **Color-coded elements**: Governance (orange), Core (green), Sub-elements (yellow), Suggestions (gray)

## Development

```bash
npm run build        # Compile TypeScript
npm run start:mcp    # Run MCP server
npm run start:http   # Run HTTP server
npm run dev          # Build + run MCP
npm run dev:http     # Build + run HTTP
```

## License

Creative Commons Attribution 4.0 International License - [Cyber RISE, Inc](https://cyberrise.org)

## Support

- [GitHub Issues](https://github.com/therealcybermattlee/FrameworkMCP/issues)
- [GitHub Discussions](https://github.com/therealcybermattlee/FrameworkMCP/discussions)
