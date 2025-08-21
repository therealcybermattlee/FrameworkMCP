# Framework MCP Deployment Guide

## Dual Architecture: MCP + HTTP API

Framework MCP v1.3.5 features a **dual architecture** that solves the DigitalOcean App Services stdio vs HTTP mismatch:

- **MCP Interface**: stdio-based for Claude Code integration
- **HTTP Interface**: REST API for cloud deployment

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

### Primary Validation
```bash
POST /api/validate-vendor-mapping
{
  "vendor_name": "AssetMax Pro",
  "safeguard_id": "1.1", 
  "claimed_capability": "full",
  "supporting_text": "Comprehensive asset management..."
}
```

### Capability Analysis
```bash
POST /api/analyze-vendor-response
{
  "vendor_name": "VendorName",
  "safeguard_id": "5.1",
  "response_text": "Our identity management solution..."
}
```

### Safeguards
```bash
GET /api/safeguards              # List all safeguards
GET /api/safeguards/1.1         # Get safeguard details
GET /api/safeguards/1.1?include_examples=true
```

### Performance
```bash
GET /api/metrics                # Performance metrics
```

---

## Architecture Benefits

### HTTP Interface Advantages
- ✅ **DigitalOcean Compatible**: Uses HTTP instead of stdio
- ✅ **REST API**: Standard HTTP endpoints
- ✅ **Health Checks**: Platform monitoring support
- ✅ **CORS Enabled**: Web application integration
- ✅ **Production Ready**: Error handling, security, compression

### MCP Interface Advantages  
- ✅ **Claude Code Integration**: Native stdio communication
- ✅ **Tool Discovery**: Automatic tool registration
- ✅ **Type Safety**: Full MCP schema validation
- ✅ **Rich Responses**: Structured tool responses

### Shared Core Benefits
- ✅ **Identical Functionality**: Both interfaces use same logic
- ✅ **Domain Validation**: Auto-downgrade protection in both
- ✅ **Performance**: 95% cache optimization in both
- ✅ **Consistency**: Same capability assessment results

---

## Migration Guide

### From MCP-Only to Dual Architecture

1. **No Breaking Changes**: Existing MCP integrations continue working
2. **New HTTP Option**: Add cloud deployment capability
3. **Gradual Adoption**: Choose interface based on use case

### Use Case Guidelines

**Use MCP Interface When:**
- Integrating with Claude Code
- Local development and testing
- Tool-based LLM interactions

**Use HTTP Interface When:**
- Cloud deployment required
- Web application integration
- API-based access needed
- DigitalOcean App Services deployment

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
- ✅ Domain validation auto-downgrade works correctly
- ✅ All 5 capability roles determined accurately
- ✅ Performance metrics show >95% cache efficiency

### Ready for Production When:
- ✅ Build completes without errors
- ✅ Both MCP and HTTP interfaces tested
- ✅ DigitalOcean deployment successful
- ✅ API endpoints return expected capability analysis results

---

**🎉 Framework MCP v1.3.4 solves the DigitalOcean stdio vs HTTP architecture mismatch while preserving full MCP functionality!**