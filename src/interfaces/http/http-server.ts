#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { SafeguardManager } from '../../core/safeguard-manager.js';
import { RateLimitConfig, RateLimitErrorResponse } from '../../shared/types.js';

interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

export class FrameworkHttpServer {
  private app: express.Application;
  private safeguardManager: SafeguardManager;
  private port: number;
  private rateLimitConfig: RateLimitConfig;

  constructor(port: number = 8080) {
    this.app = express();
    this.safeguardManager = new SafeguardManager();
    this.port = port;
    this.rateLimitConfig = this.parseRateLimitConfig();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private parseRateLimitConfig(): RateLimitConfig {
    const skipIpsEnv = process.env.RATE_LIMIT_SKIP_IPS;
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      skipIps: skipIpsEnv ? skipIpsEnv.split(',').map(ip => ip.trim()) : undefined
    };
  }

  private setupMiddleware(): void {
    // Rate limiting middleware - must be before other middleware
    const limiter = rateLimit({
      windowMs: this.rateLimitConfig.windowMs,
      max: this.rateLimitConfig.max,
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => {
        if (this.rateLimitConfig.skipIps && req.ip) {
          return this.rateLimitConfig.skipIps.includes(req.ip);
        }
        return false;
      },
      message: {
        error: 'Too many requests',
        retryAfter: 'See Retry-After header',
        timestamp: new Date().toISOString()
      },
      handler: (req, res, _next, options) => {
        console.log(`[Rate Limit] IP ${req.ip} exceeded limit`);
        res.status(429).json(options.message);
      }
    });

    this.app.use(limiter);

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
      res.json({
        status: 'healthy',
        uptime: Math.round(process.uptime()),
        version: '2.2.0',
        timestamp: new Date().toISOString()
      });
    });

    // Safeguards health check endpoint - validates data completeness
    this.app.get('/api/health/safeguards', (req, res) => {
      try {
        const allSafeguards = this.safeguardManager.getAllSafeguards();
        const safeguardIds = Object.keys(allSafeguards);

        let totalValidated = 0;
        let errors: string[] = [];
        const expectedFields = [
          'systemPromptFull',
          'systemPromptPartial',
          'systemPromptFacilitates',
          'systemPromptGovernance',
          'systemPromptValidates'
        ];

        for (const safeguardId of safeguardIds) {
          const safeguard = allSafeguards[safeguardId];

          // Check all five capability prompts exist and are complete
          for (const field of expectedFields) {
            const prompt = (safeguard as any)[field];
            if (!prompt) {
              errors.push(`${safeguardId}: Missing ${field}`);
              continue;
            }

            if (!prompt.role || !prompt.context || !prompt.objective ||
                !prompt.guidelines || !prompt.outputFormat) {
              errors.push(`${safeguardId}.${field}: Incomplete structure`);
            }
          }

          // Check deprecated field is gone
          if ('systemPrompt' in safeguard) {
            errors.push(`${safeguardId}: Deprecated systemPrompt field exists`);
          }

          totalValidated++;
        }

        res.json({
          status: errors.length === 0 ? 'healthy' : 'unhealthy',
          safeguards: {
            total: totalValidated,
            expected: 153,
            complete: totalValidated === 153 && errors.length === 0
          },
          capabilityPrompts: {
            expectedFields: expectedFields.length,
            validatedFields: expectedFields.length
          },
          errors: errors.length,
          errorDetails: errors.slice(0, 10), // Show first 10 errors only
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to validate safeguards data',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
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


    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Framework MCP HTTP API',
        version: '2.2.0',
        description: 'Pure Data Provider serving authentic CIS Controls Framework data',
        endpoints: {
          'GET /api/safeguards': 'List all available CIS safeguards',
          'GET /api/safeguards/:id': 'Get detailed safeguard breakdown',
          'GET /health': 'Health check endpoint',
          'GET /api': 'This documentation'
        },
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

  private createErrorResponse(error: string, details?: string): ErrorResponse {
    return {
      error,
      details,
      timestamp: new Date().toISOString()
    };
  }

  public start(): void {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`🚀 Framework MCP HTTP Server v2.2.0 running on port ${this.port}`);
      console.log(`📊 Health check: http://localhost:${this.port}/health`);
      console.log(`📖 API docs: http://localhost:${this.port}/api`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Pure Data Provider - CIS Controls v8.1`);
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