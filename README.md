# Framework MCP

[![npm version](https://badge.fury.io/js/framework-mcp.svg)](https://badge.fury.io/js/framework-mcp)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

A Model Context Protocol (MCP) server providing **authoritative CIS Controls Framework data** for LLM-driven vendor capability analysis. Access all 153 CIS v8.1 safeguards through MCP or HTTP API.

## Quick Start

### Install from npm
```bash
npm install -g framework-mcp
```

### Install from source
```bash
git clone https://github.com/Cyber-RISE/FrameworkMCP.git
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

### HTTP API (Cloudflare Workers)

The HTTP API is hosted on Cloudflare Workers. The Worker entry point
(`src/interfaces/worker/worker.ts`) serves the same routes as the Express
server from the same in-memory `SafeguardManager`.

```bash
npm run dev:worker   # local Worker via wrangler dev
npm run deploy       # wrangler deploy (needs `npx wrangler login`)
```

Production deploys use Cloudflare's Git integration (Workers Builds): the
Worker is connected to this GitHub repository in the Cloudflare dashboard,
and every push to `main` is cloned, built, and deployed by Cloudflare
directly. Non-`main` branches get preview deployments. No deploy tokens
live in GitHub. CORS origins and rate limits are configured in `wrangler.jsonc`.

## Element provenance

Every safeguard's four element buckets (`governanceElements`, `coreRequirements`,
`subTaxonomicalElements`, `implementationSuggestions`) are transcribed
element-for-element from the colour-coded shapes in the
[CIS v8.1 Safeguard Visualisations](https://frameworkmaps.org/assets/CISv8.1-Visualisations-2025-5_MattLee.pdf)
(orange hexagon, green box, yellow parallelogram, gray trapezoid respectively).
Titles and descriptions are verbatim CIS v8.1.2 text. Both are enforced by
`npm test` (`scripts/verify-cis-text.mjs`, `scripts/verify-cis-elements.mjs`)
against the canonical files in `data/`. Element strings are a public contract:
any change to them is released as a major version with a per-safeguard record
in [CHANGELOG.md](CHANGELOG.md).

## API Reference

### MCP Tools

| Tool | Description |
|------|-------------|
| `get_safeguard_details` | Get detailed safeguard breakdown (governance elements, core requirements, sub-taxonomical elements, implementation suggestions) |
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

## Assessing a Tool Against a Safeguard

> **This framework assesses one tool in isolation against one safeguard.**
> Satisfying a safeguard is a *portfolio* property — it typically takes several
> tools across several asset types. No verdict below means a safeguard is met,
> covered, or compliant.

### Element completeness — what this framework *can* assess

A tool is assessed on how many of the safeguard's **taxonomical elements** it addresses:

| `elementsAddressed` | Meaning |
|------|-------------|
| **`all`** | The tool addresses every taxonomical element of the safeguard |
| **`some`** | The tool addresses some, but not all, taxonomical elements |
| **`none`** | The tool addresses no taxonomical elements of this safeguard |

The companion `notAddressed` list — which elements the tool *doesn't* reach — is
often more useful than the verdict itself, because it names what you still need.

### Estate scope — what this framework *cannot* assess

`elementsAddressed: "all"` is **not** estate coverage. A tool that addresses every
element of safeguard 9.2 still only protects the devices it is actually deployed on.
Whether *your* estate is protected depends on your asset inventory, deployment
footprint, and licensing — none of which are visible in a vendor response. Every
assessment therefore carries a `scopeLimits` block stating what remains unassessed.

Deliberately absent vocabulary: *meets, satisfies, covers, achieves, compliant.*
Each of those terminates the sentence and implies the practitioner is finished.

### GRC / policy services

Whether a tool is a GRC or policy service is a **single yes/no question asked once
per tool** (`isGrcOrPolicyService`), not a per-safeguard classification — it is a
property of the product, not of its relationship to any one safeguard.

## Cloud Deployment

The HTTP server is compatible with any cloud platform that supports Node.js.

- **Build**: `npm install && npm run build`
- **Start**: `npm run start:http`
- **Port**: 8080 (configurable via `PORT` env var)
- **Health check**: `GET /health`

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

- [GitHub Issues](https://github.com/Cyber-RISE/FrameworkMCP/issues)
- [GitHub Discussions](https://github.com/Cyber-RISE/FrameworkMCP/discussions)
