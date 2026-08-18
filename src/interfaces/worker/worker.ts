/**
 * Cloudflare Workers entry point.
 *
 * Mirrors the Express HTTP API in ../http/http-server.ts route-for-route,
 * but runs on the Workers fetch handler with no Node.js dependencies.
 * SafeguardManager is pure in-memory data, so it drops straight in.
 */

import { SafeguardManager } from '../../core/safeguard-manager.js';

const VERSION = '3.1.0';

/** Cloudflare rate-limiting binding (optional; configured in wrangler.jsonc). */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  ALLOWED_ORIGINS?: string;
  RATE_LIMITER?: RateLimiter;
}

// One instance per isolate — the data is static and building it is the only cost.
const safeguardManager = new SafeguardManager();

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy':
    "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data: https:",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim());
  const origin = request.headers.get('Origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
  if (origin && (allowed.includes('*') || allowed.includes(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

function errorResponse(error: string, status: number, details?: string): Response {
  return json({ error, details, timestamp: new Date().toISOString() }, status);
}

async function route(request: Request, url: URL): Promise<Response> {
  const { pathname } = url;
  const method = request.method;

  if (method !== 'GET' && method !== 'HEAD') {
    return errorResponse(`Endpoint not found: ${method} ${pathname}`, 404, 'Use GET /api for available endpoints');
  }

  if (pathname === '/health') {
    return json({ status: 'healthy', version: VERSION, timestamp: new Date().toISOString() });
  }

  if (pathname === '/api/health/safeguards') {
    try {
      const total = Object.keys(safeguardManager.getAllSafeguards()).length;
      return json({
        status: 'healthy',
        safeguards: { total, expected: 153, complete: total === 153 },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return json({
        status: 'error',
        message: 'Failed to validate safeguards data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, 500);
    }
  }

  if (pathname === '/api/safeguards') {
    try {
      const safeguards = safeguardManager.listAvailableSafeguards();
      return json({
        safeguards,
        total: safeguards.length,
        framework: 'CIS Controls v8.1',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Worker] list-safeguards error:', error);
      return errorResponse('Internal server error', 500);
    }
  }

  const detail = pathname.match(/^\/api\/safeguards\/([^/]+)$/);
  if (detail) {
    try {
      const safeguardId = decodeURIComponent(detail[1]);
      const includeExamples = url.searchParams.get('include_examples') === 'true';
      safeguardManager.validateSafeguardId(safeguardId);
      const safeguard = safeguardManager.getSafeguardDetails(safeguardId, includeExamples);
      if (!safeguard) return errorResponse('Safeguard not found', 404);
      return json(safeguard);
    } catch (error) {
      console.error('[Worker] get-safeguard-details error:', error);
      return errorResponse(error instanceof Error ? error.message : 'Unknown error', 400);
    }
  }

  if (pathname === '/api') {
    return json({
      name: 'Framework MCP HTTP API',
      version: VERSION,
      description: 'Pure Data Provider serving authentic CIS Controls Framework data',
      endpoints: {
        'GET /api/safeguards': 'List all available CIS safeguards',
        'GET /api/safeguards/:id': 'Get detailed safeguard breakdown',
        'GET /health': 'Health check endpoint',
        'GET /api': 'This documentation',
      },
      framework: 'CIS Controls v8.1 (153 safeguards)',
      deployment: 'Cloudflare Workers',
    });
  }

  if (pathname === '/') {
    return Response.redirect(new URL('/api', url).toString(), 302);
  }

  return errorResponse(`Endpoint not found: ${method} ${pathname}`, 404, 'Use GET /api for available endpoints');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...cors, ...SECURITY_HEADERS } });
    }

    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) {
        console.log(`[Rate Limit] IP ${ip} exceeded limit`);
        return json(
          { error: 'Too many requests', retryAfter: 'See Retry-After header', timestamp: new Date().toISOString() },
          429,
          { 'Retry-After': '60', ...cors, ...SECURITY_HEADERS },
        );
      }
    }

    let response: Response;
    try {
      response = await route(request, url);
    } catch (error) {
      console.error('[Worker] Unhandled error:', error);
      response = errorResponse('Internal server error', 500);
    }

    // Response.redirect() returns an immutable Response; clone before adding headers.
    response = new Response(response.body, response);
    for (const [k, v] of Object.entries({ ...cors, ...SECURITY_HEADERS })) {
      response.headers.set(k, v);
    }
    return response;
  },
};
