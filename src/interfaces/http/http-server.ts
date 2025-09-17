#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { SafeguardManager } from '../../core/safeguard-manager.js';

interface ErrorResponse {
  error: string;
  details?: string;
  timestamp: string;
}

export class FrameworkHttpServer {
  private app: express.Application;
  private safeguardManager: SafeguardManager;
  private port: number;

  constructor(port: number = 8080) {
    this.app = express();
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
      res.json({
        status: 'healthy',
        uptime: Math.round(process.uptime()),
        version: '1.4.0',
        timestamp: new Date().toISOString()
      });
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
        version: '1.4.0',
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
      console.log(`🚀 Framework MCP HTTP Server v1.5.1 running on port ${this.port}`);
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