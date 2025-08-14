# Installation Guide

## System Requirements

- Node.js 18.0 or higher
- npm 8.0 or higher  
- Claude Code CLI tool

## Installation Methods

### Method 1: npm Global Install

```bash
npm install -g framework-mcp
```

### Method 2: Local Development Install

```bash
git clone https://github.com/therealcybermattlee/FrameworkMCP.git
cd FrameworkMCP
npm install
npm run build
```

## Configuration

### Claude Code MCP Setup

1. Locate your Claude Code MCP configuration file:
   - macOS/Linux: `~/.config/claude-code/mcp.json`
   - Windows: `%APPDATA%\claude-code\mcp.json`

2. Add the Framework MCP server:

```json
{
  "mcpServers": {
    "framework-analyzer": {
      "command": "node",
      "args": ["/absolute/path/to/FrameworkMCP/dist/index.js"],
      "env": {}
    }
  }
}
```

3. Restart Claude Code

### Verification

```bash
claude-code "List available CIS Control safeguards"
```

Expected output should include available safeguards like 1.1, 5.1, 6.3, etc.

## Troubleshooting

### Permission Issues
```bash
chmod +x dist/index.js
```

### Path Issues
Ensure you use absolute paths in the MCP configuration.

### Build Issues
```bash
npm run build
```
