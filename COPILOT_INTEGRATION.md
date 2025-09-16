# Microsoft Copilot Integration Guide

This guide provides step-by-step instructions for integrating Framework MCP v1.4.0's Pure Data Provider architecture with Microsoft Copilot using custom connectors.

## Overview

Framework MCP v1.4.0 provides a **Pure Data Provider architecture** with dual interfaces enabling both Model Context Protocol (MCP) integration with Claude Code and HTTP API integration with Microsoft Copilot. This empowers security professionals to access authoritative CIS Controls data through their preferred AI platform for sophisticated, LLM-driven vendor capability analysis.

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
  "version": "1.4.0",
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
   - **Name**: Framework MCP - Pure Data Provider
   - **Description**: Authoritative CIS Controls Framework data for LLM-driven analysis
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

## Data Actions Configuration

### Primary Action: Get Safeguard Details

Configure this action for detailed CIS safeguard information:

**Action Details:**
- **Name**: Get CIS Safeguard Details
- **Description**: Retrieve detailed CIS Controls safeguard breakdown for LLM analysis
- **Connector**: Framework MCP Custom Connector
- **Operation**: `getSafeguardDetails`

**Parameters:**
- **safeguardId** (Required): CIS safeguard ID (e.g., "1.1", "5.1", "12.8")
- **include_examples** (Optional): Include implementation examples (true/false)

**Sample Input:**
```json
{
  "safeguardId": "5.1",
  "include_examples": true
}
```

### Secondary Action: List All Safeguards

Configure this action for safeguard discovery:

**Action Details:**
- **Name**: List CIS Safeguards
- **Description**: Get complete list of available CIS Controls safeguards
- **Connector**: Framework MCP Custom Connector
- **Operation**: `listSafeguards`

**No Parameters Required**

## Example User Interactions

Once configured, users can interact with your Copilot using natural language for LLM-driven analysis:

### LLM-Driven Capability Assessment

```
"Get details for safeguard 1.1, then analyze Microsoft Defender for Endpoint's capability: 'Microsoft Defender provides comprehensive asset discovery, detailed hardware and software inventory, and real-time asset status monitoring across all enterprise endpoints.' Determine appropriate capability role and provide confidence assessment."

"Retrieve safeguard 5.1 requirements and assess CrowdStrike Falcon: 'We offer centralized identity integration with detailed user account tracking and automated access reviews.' Consider enterprise environment and provide implementation recommendations."

"Get safeguard 6.3 details. For a financial services organization with strict compliance requirements, analyze Okta's MFA solution: 'We provide comprehensive multi-factor authentication for all external applications with adaptive authentication policies, risk-based assessments, and SSO integration.'"
```

### Comparative Analysis Examples

```
"Get safeguard 7.1 details and compare these vulnerability management solutions: 1) Rapid7 InsightVM: 'Continuous vulnerability scanning with automated remediation guidance' 2) Qualys VMDR: 'Cloud-based vulnerability scanning with patch prioritization' 3) Tenable Nessus: 'Comprehensive vulnerability assessment with compliance reporting'. Rank by implementation completeness."

"Retrieve details for safeguards 13.1, 13.3, and 13.6. Analyze how SentinelOne addresses these network monitoring requirements and identify any coverage gaps."
```

### Data Discovery Requests

```
"Show me all available CIS safeguards related to identity and access management."

"Get detailed breakdown of safeguard 11.1 including all sub-elements and governance requirements."

"List all Implementation Group 1 (IG1) safeguards for a small business security assessment."
```

## Advanced Configuration

### Custom Prompts and Instructions

Add these instructions to your Copilot's system message:

```
You are a CIS Controls expert powered by Framework MCP's Pure Data Provider architecture. You help security professionals perform sophisticated vendor capability analysis using authoritative CIS Controls data.

Key Principles:
1. Always retrieve detailed safeguard data using get_safeguard_details before analysis
2. Apply context-aware analysis considering industry, risk profile, and organizational needs
3. Explain the 5 capability roles: FULL, PARTIAL, FACILITATES, GOVERNANCE, VALIDATES
4. Provide transparent reasoning with evidence-based assessments
5. Offer implementation recommendations and deployment guidance

Analysis Approach:
1. Get safeguard requirements using the data actions
2. Analyze vendor capabilities against detailed CIS requirements
3. Consider organizational context (industry, size, risk tolerance)
4. Provide capability role determination with confidence assessment
5. Include implementation recommendations and integration considerations
6. For comparative analysis, rank vendors and explain reasoning

Flexibility: Adapt analysis methodology based on user needs - strict compliance, risk-based assessment, technology integration, or custom evaluation criteria.
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