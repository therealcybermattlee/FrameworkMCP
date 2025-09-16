# Framework MCP Deployment Guide

## Pure Data Provider Architecture: MCP + HTTP API

Framework MCP v1.4.0 features a **Pure Data Provider architecture** with dual interfaces for maximum flexibility:

- **MCP Interface**: stdio-based for Claude Code integration with LLM-driven analysis
- **HTTP Interface**: REST API for cloud deployment and Microsoft Copilot integration

---

## Local Development

### MCP Server (stdio)
```bash
# For Claude Code integration
npm run start:mcp

# Development with auto-rebuild
npm run dev
```

### HTTP Server (Express.js)
```bash
# For web/cloud integration
npm run start:http

# Development with auto-rebuild  
npm run dev:http
```

### Test Both Interfaces
```bash
# Build the project
npm run build

# Test MCP interface (requires Claude Code)
npm run start:mcp

# Test HTTP interface
npm run start:http
curl http://localhost:8080/health
```

---

## Cloud Deployment

### DigitalOcean App Services

**The HTTP interface solves the stdio binding issue.**

#### 1. Deploy via GitHub Integration

1. Push your code to GitHub
2. In DigitalOcean Dashboard:
   - Create New App
   - Connect GitHub repository
   - Select branch: `main` 
   - Use provided `.do/app.yaml` configuration

#### 2. Deploy via doctl CLI

```bash
# Install doctl
snap install doctl

# Authenticate
doctl auth init

# Deploy app
doctl apps create .do/app.yaml
```

#### 3. Manual Configuration

If not using app.yaml:

```yaml
name: framework-mcp-api
services:
- name: api
  run_command: npm run start:http
  environment_slug: node-js
  http_port: 8080
  health_check:
    http_path: /health
  envs:
  - key: NODE_ENV
    value: production
```

### Alternative Cloud Platforms

The HTTP interface is compatible with any Node.js cloud platform:

#### Railway
```bash
railway login
railway init
railway up
```

#### Render
1. Connect GitHub repository
2. Environment: Node.js
3. Build Command: `npm run build`
4. Start Command: `npm run start:http`

#### AWS App Runner
1. Source: GitHub repository
2. Runtime: Node.js 18
3. Build command: `npm run build`
4. Start command: `npm run start:http`

---

## Environment Variables

### Production Configuration

```bash
# Required
NODE_ENV=production
PORT=8080

# Optional
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com
```

### Local Development

```bash
# Optional
NODE_ENV=development
PORT=8080
```

---

## API Endpoints

### Health Check
```bash
GET /health
# Returns server status and metrics
```

### Data Endpoints (Pure Provider Architecture)
```bash
GET /api/safeguards              # List all 153 CIS safeguards
GET /api/safeguards/1.1         # Get detailed safeguard breakdown
GET /api/safeguards/1.1?include_examples=true  # Include implementation examples
```

### Monitoring
```bash
GET /api/metrics                # Performance metrics and statistics
GET /api                        # API documentation and capabilities
```

**LLM-Driven Analysis**: The Pure Data Provider architecture supplies authoritative CIS data while LLMs perform sophisticated vendor capability analysis with unlimited flexibility.

---

## Architecture Benefits

### HTTP Interface Advantages
- ✅ **DigitalOcean Compatible**: Uses HTTP instead of stdio
- ✅ **REST API**: Standard HTTP endpoints for data access
- ✅ **Health Checks**: Platform monitoring support
- ✅ **CORS Enabled**: Web application integration
- ✅ **Production Ready**: Error handling, security, compression
- ✅ **Microsoft Copilot**: Custom connector compatibility

### MCP Interface Advantages  
- ✅ **Claude Code Integration**: Native stdio communication
- ✅ **Tool Discovery**: Automatic tool registration
- ✅ **Type Safety**: Full MCP schema validation
- ✅ **LLM-Driven Analysis**: Direct access to safeguards data for intelligent analysis

### Pure Data Provider Benefits
- ✅ **Clean Architecture**: Simple data provision without analysis complexity
- ✅ **LLM Flexibility**: Unlimited analysis approaches and methodologies
- ✅ **Performance Optimized**: Fast data retrieval for real-time analysis
- ✅ **Context-Aware**: LLMs can apply industry, risk, and organizational context
- ✅ **Transparent Reasoning**: Full visibility into analysis logic and evidence

---

## Migration Guide

### Migrating to Pure Data Provider v1.4.0

1. **Simplified Architecture**: Analysis logic moved to LLM capability
2. **Enhanced Flexibility**: Unlimited analysis approaches and methodologies
3. **Maintained Compatibility**: Both interfaces continue providing data access
4. **Improved Performance**: Optimized for fast data retrieval

### Use Case Guidelines

**Use MCP Interface When:**
- Integrating with Claude Code for LLM-driven analysis
- Local development and testing
- Direct tool-based interactions with LLMs

**Use HTTP Interface When:**
- Cloud deployment required (DigitalOcean, Railway, Render)
- Microsoft Copilot custom connector integration
- Web application or API-based access needed
- Distributed team access to CIS Controls data

### Analysis Pattern Migration

**Old Approach (v1.3.7):**
```bash
POST /api/analyze-vendor-response
# Hardcoded analysis with fixed validation rules
```

**New Approach (v1.4.0):**
```bash
GET /api/safeguards/5.1
# Get authoritative data, then use LLM for sophisticated analysis
```

---

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clean rebuild
rm -rf dist node_modules
npm install
npm run build
```

**Port Conflicts**
```bash
# Use different port
PORT=3000 npm run start:http
```

**Health Check Failures**
- Ensure `/health` endpoint is accessible
- Check server startup logs
- Verify PORT environment variable

**CORS Issues**
```bash
# Update allowed origins
ALLOWED_ORIGINS=https://your-domain.com npm run start:http
```

### DigitalOcean Specific

**App Won't Start**
- Check build logs for TypeScript errors
- Verify `npm run start:http` command works locally
- Ensure package.json scripts are correct

**Health Check Fails**
- Verify `/health` endpoint returns 200 status
- Check `http_port: 8080` configuration
- Review app startup time (may need longer initial_delay_seconds)

**Environment Variables**
- Set `NODE_ENV=production` in app configuration
- Configure `PORT=8080` if not auto-detected

---

## Performance Optimization

### Production Settings
```bash
NODE_ENV=production  # Enables performance logging
```

### Caching
- Safeguard details: 5-minute TTL
- Safeguard lists: 10-minute TTL  
- Automatic cleanup: Every 10 minutes

### Monitoring
- Built-in performance metrics at `/api/metrics`
- Request counting and error tracking
- Execution time monitoring

---

## Security

### CORS Configuration
```javascript
// Configurable via environment
ALLOWED_ORIGINS=https://your-domain.com,https://app.your-domain.com
```

### Input Validation
- Request size limits (10MB)
- Text length validation (10-10,000 characters)
- Capability enum validation
- XSS prevention

### Rate Limiting
```javascript
// Add rate limiting middleware (optional)
npm install express-rate-limit
```

---

## Success Criteria

### HTTP Deployment Successful When:
- ✅ Health check returns 200 status
- ✅ `/api/validate-vendor-mapping` accepts POST requests
- ✅ Content-based capability analysis works correctly
- ✅ All 5 capability roles determined accurately
- ✅ Performance metrics show >95% cache efficiency

### Ready for Production When:
- ✅ Build completes without errors
- ✅ Both MCP and HTTP interfaces tested
- ✅ DigitalOcean deployment successful
- ✅ API endpoints return expected capability analysis results

---

**🎉 Framework MCP v1.3.7 solves the DigitalOcean stdio vs HTTP architecture mismatch while preserving full MCP functionality!**