# Microsoft Copilot Integration Guide

This guide provides step-by-step instructions for integrating Framework MCP with Microsoft Copilot using custom connectors.

## Overview

Framework MCP provides a dual-architecture solution that enables both Model Context Protocol (MCP) integration with Claude Code and HTTP API integration with Microsoft Copilot. This allows security professionals to access CIS Controls capability assessment through their preferred AI platform.

## Prerequisites

- **Microsoft Copilot Studio** access (Microsoft 365 Business license or higher)
- **Deployed Framework MCP HTTP API** (DigitalOcean, Railway, Render, or other cloud platform)
- **Administrative permissions** in your Microsoft environment

## Quick Start

### 1. Deploy the HTTP API

First, deploy Framework MCP to a cloud platform. Choose one of these options:

#### Option A: DigitalOcean App Services (Recommended)
```bash
git clone https://github.com/therealcybermattlee/FrameworkMCP.git
cd FrameworkMCP
doctl apps create .do/app.yaml
```

#### Option B: Railway
```bash
railway login
railway up
```

#### Option C: Render
1. Connect your GitHub repository to Render
2. Use these settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:http`
   - **Port**: 8080

### 2. Verify Deployment

Test your deployed API:
```bash
curl https://your-api-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 1234,
  "totalRequests": 0,
  "errorCount": 0,
  "version": "1.3.7",
  "timestamp": "2025-08-21T01:00:00.000Z"
}
```

### 3. Create Custom Connector in Copilot Studio

1. **Open Microsoft Copilot Studio**
   - Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com)
   - Sign in with your Microsoft 365 account

2. **Access Custom Connectors**
   - In the left navigation, click **Data**
   - Select **Custom connectors**

3. **Import OpenAPI Specification**
   - Click **+ New custom connector**
   - Choose **Import from OpenAPI file**
   - Upload the `swagger.json` file from the Framework MCP repository
   - Click **Continue**

4. **Configure Connector Details**
   - **Name**: Framework MCP - CIS Controls Capability Assessment
   - **Description**: Validate vendor capability claims against CIS Controls Framework
   - **Host**: Update to your deployed API URL (e.g., `your-app.ondigitalocean.app`)
   - **Base URL**: `/`

5. **Review and Save**
   - Review the imported endpoints
   - Click **Create connector**

### 4. Test the Connection

1. **Create Test Connection**
   - Click **Test** in your custom connector
   - No authentication is required (public API)
   - Click **Create connection**

2. **Test Health Endpoint**
   - Select the `healthCheck` operation
   - Click **Test operation**
   - Verify you receive a 200 response with health status

### 5. Create Your Copilot

1. **Create New Copilot**
   - Go to **Copilots** in Copilot Studio
   - Click **+ New copilot**
   - Choose **Conversational** type
   - Name: "CIS Controls Capability Assessor"

2. **Add Custom Actions**
   - In your copilot, go to **Actions**
   - Click **+ Add action**
   - Select **Custom connector**
   - Choose your Framework MCP connector

## Custom Actions Configuration

### Primary Action: Validate Vendor Capability

Configure this action for evidence-based validation:

**Action Details:**
- **Name**: Validate Vendor Capability Mapping
- **Description**: Validate vendor capability claims against CIS Controls with domain validation and auto-downgrade protection
- **Connector**: Framework MCP Custom Connector
- **Operation**: `validateVendorMapping`

**Parameters:**
- **vendor_name** (Required): Name of the vendor/tool being analyzed
- **safeguard_id** (Required): CIS safeguard ID (e.g., "1.1", "5.1", "12.8")
- **claimed_capability** (Required): Capability role (full, partial, facilitates, governance, validates)
- **supporting_text** (Required): Vendor response supporting their capability claim

**Sample Input:**
```json
{
  "vendor_name": "CrowdStrike Falcon",
  "safeguard_id": "1.1",
  "claimed_capability": "full",
  "supporting_text": "Our platform provides comprehensive enterprise asset inventory with real-time discovery, automated classification, and continuous monitoring of all hardware and software assets across the organization."
}
```

### Secondary Action: Analyze Vendor Response

Configure this action for capability determination:

**Action Details:**
- **Name**: Analyze Vendor Response
- **Description**: Determine appropriate capability role for vendor response text
- **Connector**: Framework MCP Custom Connector
- **Operation**: `analyzeVendorResponse`

**Parameters:**
- **vendor_name** (Required): Name of the vendor
- **safeguard_id** (Required): CIS safeguard ID
- **response_text** (Required): Vendor response text to analyze

### Additional Actions: Safeguard Information

**Get Safeguard Details:**
- **Operation**: `getSafeguardDetails`
- **Parameters**: safeguard_id, include_examples (optional)

**List Available Safeguards:**
- **Operation**: `listAvailableSafeguards`  
- **Parameters**: None

## Example User Interactions

Once configured, users can interact with your Copilot using natural language:

### Capability Validation Examples

```
"Validate this vendor capability: Microsoft Defender for Endpoint claims FULL coverage for safeguard 1.1. Their response: 'Microsoft Defender provides comprehensive asset discovery, detailed hardware and software inventory, and real-time asset status monitoring across all enterprise endpoints.'"

"Check if CrowdStrike Falcon can provide PARTIAL coverage for safeguard 5.1 based on this: 'We offer centralized identity integration with detailed user account tracking and automated access reviews.'"

"Validate this FACILITATES claim: Qualys VMDR for safeguard 1.1 - 'Our vulnerability scanner enhances existing asset management by providing additional device discovery and detailed software inventory during security assessments.'"
```

### Response Analysis Examples

```
"Analyze this vendor response for safeguard 6.3: Okta - 'We provide comprehensive multi-factor authentication for all external applications with adaptive authentication policies, risk-based assessments, and SSO integration.'"

"What capability role should we assign to this response for safeguard 7.1: Rapid7 InsightVM - 'Our platform performs continuous vulnerability scanning, provides automated remediation guidance, and tracks patch deployment across the infrastructure.'"
```

### Information Requests

```
"What are the requirements for CIS safeguard 1.1?"

"Show me all available CIS safeguards in the inventory domain."

"What's the difference between FULL and PARTIAL capability roles?"
```

## Advanced Configuration

### Custom Prompts and Instructions

Add these instructions to your Copilot's system message:

```
You are a CIS Controls capability assessment expert. You help security professionals evaluate vendor tool capabilities against specific CIS Control safeguards.

Key Principles:
1. Use validate_vendor_mapping for evidence-based validation of capability claims
2. Use analyze_vendor_response when the capability role is unknown
3. Always explain the 5 capability roles: FULL, PARTIAL, FACILITATES, GOVERNANCE, VALIDATES
4. Highlight domain validation results and auto-downgrade protection
5. Provide actionable recommendations for capability improvements

When users provide vendor responses:
1. Ask for the specific CIS safeguard ID if not provided
2. Determine if they want validation (they have a claimed capability) or analysis (no claimed capability)
3. Use the appropriate action and explain the results in plain language
4. Highlight any domain mismatches or auto-downgrades that occurred
```

### Environment Variables

If deploying with authentication or custom configuration:

```bash
# Optional environment variables for your deployed API
NODE_ENV=production
PORT=8080
ALLOWED_ORIGINS=https://copilotstudio.microsoft.com,https://your-domain.com
```

### Rate Limiting and Monitoring

Monitor your API usage through the `/api/metrics` endpoint:

```bash
curl https://your-api-url.com/api/metrics
```

Response includes:
- Request counts by endpoint
- Error rates
- Uptime statistics
- Performance metrics

## Troubleshooting

### Common Issues

**Connection Failed:**
- Verify your API URL is accessible publicly
- Check that the `/health` endpoint returns 200
- Ensure no authentication is required

**Operations Not Working:**
- Verify the `swagger.json` was imported correctly
- Check that operation IDs match: `validateVendorMapping`, `analyzeVendorResponse`, etc.
- Test operations individually in the connector test interface

**Invalid Responses:**
- Check request body format matches the schema
- Verify required fields are provided
- Review API error messages for validation details

**Performance Issues:**
- Monitor the `/api/metrics` endpoint for high error rates
- Consider upgrading your cloud deployment plan
- Check network connectivity from Microsoft's servers

### Testing Checklist

Before going live, test these scenarios:

- [ ] Health check endpoint responds correctly
- [ ] Validate vendor mapping with FULL claim (domain match)
- [ ] Validate vendor mapping with FULL claim (domain mismatch - should auto-downgrade)
- [ ] Analyze vendor response for capability determination
- [ ] Get safeguard details for a specific safeguard
- [ ] List all available safeguards
- [ ] Handle invalid inputs gracefully

### Support Resources

- **Framework MCP Issues**: [GitHub Issues](https://github.com/therealcybermattlee/FrameworkMCP/issues)
- **Microsoft Copilot Studio Docs**: [Microsoft Documentation](https://docs.microsoft.com/en-us/microsoft-copilot-studio/)
- **OpenAPI Connector Guide**: [Custom Connectors in Copilot Studio](https://docs.microsoft.com/en-us/connectors/custom-connectors/)

## Best Practices

### Security Considerations

1. **Deploy with HTTPS**: Always use HTTPS for production deployments
2. **Monitor Usage**: Regularly check the `/api/metrics` endpoint
3. **Rate Limiting**: Consider implementing rate limiting for high-traffic scenarios
4. **Access Logs**: Enable logging in production for audit trails

### Performance Optimization

1. **CDN**: Consider using a CDN for global deployments
2. **Caching**: The API includes intelligent caching for repeated requests
3. **Scaling**: Use cloud platform auto-scaling for high demand
4. **Monitoring**: Set up health check monitoring with your cloud provider

### User Experience

1. **Clear Instructions**: Provide users with example prompts
2. **Error Handling**: Explain what to do when validation fails
3. **Capability Education**: Help users understand the 5 capability roles
4. **Domain Validation**: Explain why auto-downgrades occur

## Success Metrics

Track these metrics to measure integration success:

- **Request Volume**: Total API calls per day/week
- **Error Rate**: Percentage of failed requests (target: <5%)
- **Response Time**: Average API response time (target: <500ms)
- **User Satisfaction**: Feedback on capability assessment accuracy
- **Coverage**: Number of unique safeguards being assessed

## Next Steps

After successful integration:

1. **Train Users**: Provide training on the 5 capability roles and domain validation
2. **Create Templates**: Develop standard prompts for common assessment scenarios
3. **Integration Workflows**: Connect with existing GRC tools and processes
4. **Feedback Loop**: Collect user feedback for continuous improvement
5. **Scale Usage**: Expand to additional teams and use cases

---

**Questions or Issues?**
- 📧 Create an issue: [GitHub Issues](https://github.com/therealcybermattlee/FrameworkMCP/issues)
- 💬 Start a discussion: [GitHub Discussions](https://github.com/therealcybermattlee/FrameworkMCP/discussions)
- 🐦 Follow updates: [@cybermattlee](https://twitter.com/cybermattlee)