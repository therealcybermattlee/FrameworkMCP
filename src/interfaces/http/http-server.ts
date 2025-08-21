#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { CapabilityAnalyzer } from '../../core/capability-analyzer.js';
import { SafeguardManager } from '../../core/safeguard-manager.js';

interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

export class FrameworkHttpServer {
  private app: express.Application;
  private capabilityAnalyzer: CapabilityAnalyzer;
  private safeguardManager: SafeguardManager;
  private port: number;

  constructor(port: number = 8080) {
    this.app = express();
    this.capabilityAnalyzer = new CapabilityAnalyzer();
    this.safeguardManager = new SafeguardManager();
    this.port = port;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    }));

    // Compression and parsing
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging in production
    if (process.env.NODE_ENV === 'production') {
      this.app.use((req, res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes(): void {
    // Health check endpoint (required for DigitalOcean App Services)
    this.app.get('/health', (req, res) => {
      const metrics = this.capabilityAnalyzer.getPerformanceMetrics();
      res.json({
        status: 'healthy',
        uptime: Math.round((Date.now() - metrics.uptime) / 1000),
        totalRequests: metrics.totalRequests,
        errorCount: metrics.errorCount,
        version: '1.2.0',
        timestamp: new Date().toISOString()
      });
    });

    // Primary validation endpoint
    this.app.post('/api/validate-vendor-mapping', async (req, res) => {
      try {
        const { vendor_name, safeguard_id, claimed_capability, supporting_text } = req.body;

        // Input validation
        this.validateInput(req.body, [
          'vendor_name',
          'safeguard_id', 
          'claimed_capability',
          'supporting_text'
        ]);

        this.validateTextInput(supporting_text, 'Supporting text');
        this.validateCapability(claimed_capability);
        this.safeguardManager.validateSafeguardId(safeguard_id);

        const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
        if (!safeguard) {
          return res.status(404).json(this.createErrorResponse('Safeguard not found'));
        }

        const result = this.capabilityAnalyzer.validateVendorMapping(
          vendor_name,
          safeguard_id,
          claimed_capability,
          supporting_text,
          safeguard
        );

        res.json(result);
      } catch (error) {
        console.error('[HTTP Server] validate-vendor-mapping error:', error);
        res.status(400).json(this.createErrorResponse(error instanceof Error ? error.message : 'Unknown error'));
      }
    });

    // Capability analysis endpoint
    this.app.post('/api/analyze-vendor-response', async (req, res) => {
      try {
        const { vendor_name, safeguard_id, response_text } = req.body;

        this.validateInput(req.body, ['vendor_name', 'safeguard_id', 'response_text']);
        this.validateTextInput(response_text, 'Response text');
        this.safeguardManager.validateSafeguardId(safeguard_id);

        const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
        if (!safeguard) {
          return res.status(404).json(this.createErrorResponse('Safeguard not found'));
        }

        const result = this.capabilityAnalyzer.performCapabilityAnalysis(
          vendor_name,
          safeguard,
          response_text
        );

        res.json(result);
      } catch (error) {
        console.error('[HTTP Server] analyze-vendor-response error:', error);
        res.status(400).json(this.createErrorResponse(error instanceof Error ? error.message : 'Unknown error'));
      }
    });

    // Coverage claim validation endpoint
    this.app.post('/api/validate-coverage-claim', async (req, res) => {
      try {
        const { vendor_name, safeguard_id, claimed_capability, response_text } = req.body;

        this.validateInput(req.body, ['vendor_name', 'safeguard_id', 'claimed_capability', 'response_text']);
        this.validateTextInput(response_text, 'Response text');
        this.validateCapability(claimed_capability);
        this.safeguardManager.validateSafeguardId(safeguard_id);

        const safeguard = this.safeguardManager.getSafeguardDetails(safeguard_id);
        if (!safeguard) {
          return res.status(404).json(this.createErrorResponse('Safeguard not found'));
        }

        // Use the primary validation method for coverage claims
        const result = this.capabilityAnalyzer.validateVendorMapping(
          vendor_name,
          safeguard_id,
          claimed_capability,
          response_text,
          safeguard
        );

        res.json(result);
      } catch (error) {
        console.error('[HTTP Server] validate-coverage-claim error:', error);
        res.status(400).json(this.createErrorResponse(error instanceof Error ? error.message : 'Unknown error'));
      }
    });

    // Get safeguard details endpoint
    this.app.get('/api/safeguards/:safeguardId', (req, res) => {
      try {
        const { safeguardId } = req.params;
        const includeExamples = req.query.include_examples === 'true';

        this.safeguardManager.validateSafeguardId(safeguardId);

        const safeguard = this.safeguardManager.getSafeguardDetails(safeguardId, includeExamples);
        if (!safeguard) {
          return res.status(404).json(this.createErrorResponse('Safeguard not found'));
        }

        res.json(safeguard);
      } catch (error) {
        console.error('[HTTP Server] get-safeguard-details error:', error);
        res.status(400).json(this.createErrorResponse(error instanceof Error ? error.message : 'Unknown error'));
      }
    });

    // List all safeguards endpoint
    this.app.get('/api/safeguards', (req, res) => {
      try {
        const safeguards = this.safeguardManager.listAvailableSafeguards();
        
        res.json({
          safeguards,
          total: safeguards.length,
          framework: 'CIS Controls v8.1',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[HTTP Server] list-safeguards error:', error);
        res.status(500).json(this.createErrorResponse('Internal server error'));
      }
    });

    // Performance metrics endpoint
    this.app.get('/api/metrics', (req, res) => {
      try {
        const metrics = this.capabilityAnalyzer.getPerformanceMetrics();
        
        res.json({
          uptime_seconds: Math.round((Date.now() - metrics.uptime) / 1000),
          total_requests: metrics.totalRequests,
          error_count: metrics.errorCount,
          error_rate: metrics.totalRequests > 0 ? 
            ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(2) + '%' : '0%',
          request_counts: Object.fromEntries(metrics.requestCounts),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[HTTP Server] metrics error:', error);
        res.status(500).json(this.createErrorResponse('Metrics unavailable'));
      }
    });

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Framework MCP HTTP API',
        version: '1.2.0',
        description: 'Dual-architecture HTTP API for vendor capability assessment against CIS Controls Framework',
        endpoints: {
          'POST /api/validate-vendor-mapping': 'Primary capability validation with domain validation',
          'POST /api/analyze-vendor-response': 'Capability role determination for vendor responses',
          'POST /api/validate-coverage-claim': 'Validate FULL/PARTIAL implementation claims',
          'GET /api/safeguards': 'List all available CIS safeguards',
          'GET /api/safeguards/:id': 'Get detailed safeguard breakdown',
          'GET /health': 'Health check endpoint',
          'GET /api/metrics': 'Performance metrics',
          'GET /api': 'This documentation'
        },
        capabilities: [
          'FULL - Complete implementation of safeguard',
          'PARTIAL - Limited scope implementation', 
          'FACILITATES - Enhancement capabilities',
          'GOVERNANCE - Policy/process management',
          'VALIDATES - Evidence collection and reporting'
        ],
        domain_validation: 'Auto-downgrade protection for inappropriate capability claims',
        framework: 'CIS Controls v8.1 (153 safeguards)',
        deployment: 'DigitalOcean App Services compatible'
      });
    });

    // Root endpoint redirect
    this.app.get('/', (req, res) => {
      res.redirect('/api');
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json(this.createErrorResponse(
        `Endpoint not found: ${req.method} ${req.originalUrl}`,
        'Use GET /api for available endpoints'
      ));
    });

    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('[HTTP Server] Unhandled error:', error);
      
      if (!res.headersSent) {
        res.status(500).json(this.createErrorResponse(
          'Internal server error',
          process.env.NODE_ENV === 'development' ? error.message : undefined
        ));
      }
    });
  }

  private validateInput(body: any, requiredFields: string[]): void {
    if (!body || typeof body !== 'object') {
      throw new Error('Request body is required and must be valid JSON');
    }

    for (const field of requiredFields) {
      if (!body[field] || typeof body[field] !== 'string') {
        throw new Error(`Field '${field}' is required and must be a non-empty string`);
      }
    }
  }

  private validateTextInput(text: string, fieldName: string): void {
    if (typeof text !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    if (text.length < 10) {
      throw new Error(`${fieldName} must be at least 10 characters long`);
    }
    
    if (text.length > 10000) {
      throw new Error(`${fieldName} must be less than 10,000 characters`);
    }
  }

  private validateCapability(capability: string): void {
    const validCapabilities = ['full', 'partial', 'facilitates', 'governance', 'validates'];
    
    if (!validCapabilities.includes(capability.toLowerCase())) {
      throw new Error(`Invalid capability '${capability}'. Valid options: ${validCapabilities.join(', ')}`);
    }
  }

  private createErrorResponse(error: string, details?: string): ErrorResponse {
    return {
      error,
      details,
      timestamp: new Date().toISOString()
    };
  }

  public start(): void {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 Framework MCP HTTP Server v1.2.0 running on port ${this.port}`);
      console.log(`📊 Health check: http://localhost:${this.port}/health`);
      console.log(`📖 API docs: http://localhost:${this.port}/api`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⚡ DigitalOcean App Services compatible`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🔄 Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('🔄 Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '8080', 10);
  const server = new FrameworkHttpServer(port);
  server.start();
}