# Centrid.ai Deployment & Monitoring - Implementation PRD

**Version**: 4.0 (MVP Aligned - Basic Monitoring Only)  
**Date**: 2024-01-15  
**Status**: Ready for Implementation  
**Estimated Time**: 16 hours (Week 4-5)  
**Priority**: Production Readiness - Required for launch  
**Dependencies**: Backend, Frontend, Edge Functions  
**Key Changes**: Basic error tracking only (Sentry), simple metrics, NO detailed analytics, NO A/B testing, NO admin dashboard

---

## 🎯 **OVERVIEW**

### **Objective (MVP - Simplified)**

Deploy MVP to production on Vercel + Supabase with basic error tracking (Sentry) and simple monitoring. No detailed analytics, no A/B testing, no admin dashboard.

### **Success Criteria (MVP)**

- **Production deployment** on Vercel + Supabase
- **Basic error tracking** via Sentry
- **Simple metrics**: Request counter per user for billing
- **Zero-downtime deployments** built-in with Vercel
- **Performance Target**: Sub-3 second page loads
- **NO DETAILED ANALYTICS**: Just error tracking and basic counters for MVP
- **NO A/B TESTING**: Single version for launch

---

## 🏗️ **DEPLOYMENT ARCHITECTURE**

### **Production Infrastructure Stack**

**Pure Supabase + Vercel Stack**:

- **Frontend**: Vercel Pro with global edge network and automatic scaling
- **Backend**: Supabase Edge Functions (no separate backend servers needed)
- **Database**: Supabase Pro with connection pooling and global read replicas
- **File Storage**: Supabase Storage with global CDN and image optimization
- **Authentication**: Supabase Auth (no separate auth service needed)
- **Real-time**: Supabase Real-time (no WebSocket servers needed)
- **Cache**: Built-in Supabase connection pooling + Apollo Client cache

**CI/CD Pipeline**:

- **Source Control**: GitHub with protected main branch
- **CI/CD**: GitHub Actions with automated testing and deployment
- **Environment Management**: Staging, Preview, and Production environments
- **Security**: Automated security scanning and dependency updates

### **Scalability Architecture**

```mermaid
graph TD
    A[Global Users] --> B[Vercel Edge Network]
    B --> C[Next.js App]
    C --> D[Load Balancer]
    D --> E[API Instances]
    D --> F[API Instances]
    E --> G[Primary DB]
    F --> G
    G --> H[Read Replica]
    E --> I[Redis Cache]
    F --> I
    E --> J[File Storage]
    F --> J
```

---

## 📋 **IMPLEMENTATION REQUIREMENTS**

### **Phase 1: Production Infrastructure Setup (Weeks 7-8 - 25 hours)**

#### **1.1 Environment Configuration & Secrets Management (8 hours)**

**Environment Structure**:

```typescript
// Environment configuration matrix
const environments = {
  development: {
    database: "supabase-local",
    api: "localhost:3000",
    redis: "local-redis",
    mercadopago: "test-keys",
    ai_providers: "test-keys",
  },
  staging: {
    database: "supabase-staging",
    api: "staging-api.aidocs.com",
    redis: "redis-staging",
    mercadopago: "test-keys",
    ai_providers: "production-keys",
  },
  production: {
    database: "supabase-production",
    api: "api.aidocs.com",
    redis: "redis-production",
    mercadopago: "live-keys",
    ai_providers: "production-keys",
  },
};

// Environment validation
const requiredEnvVars = [
  "DATABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "MERCADOPAGO_ACCESS_TOKEN",
  "MERCADOPAGO_WEBHOOK_SECRET",
  "REDIS_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  console.log("✅ Environment configuration validated");
}
```

**Secure Secrets Management**:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          MERCADOPAGO_ACCESS_TOKEN: ${{ secrets.MERCADOPAGO_ACCESS_TOKEN }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./
          scope: ${{ secrets.TEAM_ID }}
```

**Infrastructure as Code**:

```typescript
// infrastructure/database.sql
-- Production database optimizations
-- Connection pooling settings
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_user_created
ON documents(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_similarity
ON embeddings USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_tracking_period
ON usage_tracking(user_id, period_start, period_end);

-- Automated maintenance
CREATE OR REPLACE FUNCTION auto_vacuum_embeddings()
RETURNS void AS $$
BEGIN
  -- Clean up old embeddings from deleted documents
  DELETE FROM embeddings
  WHERE chunk_id NOT IN (SELECT id FROM document_chunks);

  -- Update statistics
  ANALYZE embeddings;
  ANALYZE document_chunks;
  ANALYZE documents;
END;
$$ LANGUAGE plpgsql;

-- Schedule maintenance (via pg_cron if available)
SELECT cron.schedule('vacuum-embeddings', '0 2 * * *', 'SELECT auto_vacuum_embeddings();');
```

**Deliverable**: Production-ready infrastructure with secure configuration management

#### **1.2 CI/CD Pipeline Implementation (10 hours)**

**Automated Testing Pipeline**:

```yaml
# .github/workflows/test.yml
name: Automated Testing

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: |
          npm run db:migrate
          npm run db:seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run unit tests
        run: npm run test:unit
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          OPENAI_API_KEY: ${{ secrets.OPENAI_TEST_KEY }}

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Security audit
        run: npm audit --audit-level high

      - name: Dependency vulnerability scan
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=medium
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**Blue-Green Deployment Strategy**:

```typescript
// scripts/deploy.ts
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface DeploymentConfig {
  environment: "staging" | "production";
  healthCheckUrl: string;
  rollbackOnFailure: boolean;
  maxHealthCheckRetries: number;
}

class BlueGreenDeployer {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting ${this.config.environment} deployment...`);

    try {
      // 1. Deploy to staging slot (blue environment)
      await this.deployToStaging();

      // 2. Run health checks
      await this.performHealthChecks();

      // 3. Run smoke tests
      await this.runSmokeTests();

      // 4. Switch traffic to new deployment (green environment)
      await this.switchTraffic();

      // 5. Final health check
      await this.performHealthChecks();

      console.log("✅ Deployment completed successfully");

      // 6. Clean up old deployment
      await this.cleanupOldDeployment();
    } catch (error) {
      console.error("❌ Deployment failed:", error);

      if (this.config.rollbackOnFailure) {
        await this.rollback();
      }

      throw error;
    }
  }

  private async deployToStaging(): Promise<void> {
    console.log("📦 Deploying to staging slot...");

    await execAsync("vercel --prod --confirm", {
      env: {
        ...process.env,
        VERCEL_ENV: "preview",
      },
    });
  }

  private async performHealthChecks(): Promise<void> {
    console.log("🔍 Performing health checks...");

    let retries = 0;
    const maxRetries = this.config.maxHealthCheckRetries;

    while (retries < maxRetries) {
      try {
        const response = await fetch(
          `${this.config.healthCheckUrl}/api/health`
        );

        if (response.ok) {
          const health = await response.json();

          if (health.status === "healthy") {
            console.log("✅ Health check passed");
            return;
          }
        }

        throw new Error(`Health check failed: ${response.status}`);
      } catch (error) {
        retries++;
        console.log(`⚠️ Health check attempt ${retries}/${maxRetries} failed`);

        if (retries === maxRetries) {
          throw new Error("Health checks failed after maximum retries");
        }

        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10s
      }
    }
  }

  private async runSmokeTests(): Promise<void> {
    console.log("🧪 Running smoke tests...");

    const smokeTests = [
      this.testAuthentication,
      this.testAgentRequest,
      this.testDocumentUpload,
      this.testBilling,
    ];

    for (const test of smokeTests) {
      await test.call(this);
    }
  }

  private async testAuthentication(): Promise<void> {
    // Test basic auth flow
    const response = await fetch(
      `${this.config.healthCheckUrl}/api/auth/session`
    );
    if (!response.ok) {
      throw new Error("Authentication smoke test failed");
    }
  }

  private async testAgentRequest(): Promise<void> {
    // Test agent request with test credentials
    const response = await fetch(
      `${this.config.healthCheckUrl}/api/trpc/agents.test`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TEST_API_TOKEN}`,
        },
        body: JSON.stringify({ test: true }),
      }
    );

    if (!response.ok) {
      throw new Error("Agent request smoke test failed");
    }
  }
}

// Health check endpoint
// pages/api/health.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check database connectivity
    const { data: dbHealth } = await supabase
      .from("user_profiles")
      .select("count")
      .limit(1);

    // Check Redis connectivity
    const redis = new Redis(process.env.REDIS_URL);
    await redis.ping();
    await redis.disconnect();

    // Check AI API connectivity
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const models = await openai.models.list();

    // Check Mercado Pago connectivity
    const mercadoPago = new MercadoPago({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
    await mercadoPago.plans.search({ limit: 1 });

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      services: {
        database: "healthy",
        redis: "healthy",
        openai: "healthy",
        mercadopago: "healthy",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
}
```

**Deliverable**: Complete CI/CD pipeline with automated testing and blue-green deployment

#### **1.3 Performance Optimization & CDN Setup (7 hours)**

**Frontend Performance Optimization**:

```typescript
// next.config.js - Production optimizations
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ["supabase.co", "avatars.githubusercontent.com"],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Bundle analysis
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev) {
      // Bundle analyzer in production builds
      if (process.env.ANALYZE === "true") {
        const BundleAnalyzerPlugin =
          require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: "static",
            openAnalyzer: false,
          })
        );
      }

      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
            ai: {
              test: /[\\/]node_modules[\\/](openai|@anthropic-ai)[\\/]/,
              name: "ai-vendors",
              chunks: "all",
            },
          },
        },
      };
    }

    return config;
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
```

**Database Performance Optimization**:

```sql
-- Production database optimizations
-- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slow query monitoring
CREATE OR REPLACE FUNCTION monitor_slow_queries()
RETURNS void AS $$
DECLARE
    slow_query record;
BEGIN
    -- Log queries taking >5 seconds
    FOR slow_query IN
        SELECT query, mean_exec_time, calls, total_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 5000
        ORDER BY mean_exec_time DESC
        LIMIT 10
    LOOP
        RAISE LOG 'Slow query detected: % (avg: %ms, calls: %)',
            slow_query.query, slow_query.mean_exec_time, slow_query.calls;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Connection pooling optimization
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET work_mem = '16MB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Vector search optimization
SET hnsw.ef_search = 100;
SET max_parallel_workers_per_gather = 4;

-- Automated statistics updates
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    ANALYZE documents;
    ANALYZE document_chunks;
    ANALYZE embeddings;
    ANALYZE usage_tracking;
    ANALYZE user_profiles;
END;
$$ LANGUAGE plpgsql;

-- Schedule via cron
SELECT cron.schedule('update-stats', '0 */6 * * *', 'SELECT update_table_statistics();');
```

**API Performance Monitoring**:

```typescript
// lib/performance/monitor.ts
import { performance } from "perf_hooks";

export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric[]> = new Map();

  static startTimer(operation: string): () => number {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
      return duration;
    };
  }

  static async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const timer = this.startTimer(operation);

    try {
      const result = await fn();
      timer();
      return result;
    } catch (error) {
      timer();
      this.recordError(operation, error);
      throw error;
    }
  }

  private static recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const metrics = this.metrics.get(operation)!;
    metrics.push({
      duration,
      timestamp: Date.now(),
    });

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    // Alert on slow operations
    if (duration > 5000) {
      // 5 seconds
      console.warn(
        `Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`
      );

      if (process.env.NODE_ENV === "production") {
        // Send to monitoring service
        this.sendAlert("slow_operation", { operation, duration });
      }
    }
  }

  static getMetrics(operation: string): PerformanceStats {
    const metrics = this.metrics.get(operation) || [];

    if (metrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0 };
    }

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);

    return {
      count: durations.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p95: durations[Math.floor(durations.length * 0.95)],
    };
  }

  private static async sendAlert(type: string, data: any): Promise<void> {
    // Integration with monitoring service (Sentry, DataDog, etc.)
    console.error(`ALERT [${type}]:`, data);
  }
}

// Middleware for API performance monitoring
export const withPerformanceMonitoring = (handler: any) => {
  return async (req: any, res: any) => {
    const operation = `${req.method} ${req.url}`;

    return await PerformanceMonitor.measureAsync(operation, () => {
      return handler(req, res);
    });
  };
};
```

**Deliverable**: Optimized production deployment with performance monitoring and CDN acceleration

### **Phase 2: Monitoring & Observability (Weeks 9-10 - 20 hours)**

#### **2.1 Application Monitoring & Error Tracking (8 hours)**

**Sentry Integration for Error Tracking**:

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from "@sentry/nextjs";

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Don't send certain expected errors
      if (event.exception) {
        const error = hint.originalException;

        if (error && typeof error === "object" && "message" in error) {
          const message = error.message as string;

          // Filter out client-side network errors
          if (message.includes("Network Error") || message.includes("fetch")) {
            return null;
          }

          // Filter out authentication errors (expected)
          if (
            message.includes("Unauthorized") ||
            message.includes("Forbidden")
          ) {
            return null;
          }
        }
      }

      return event;
    },

    // User context
    beforeSendTransaction(event) {
      // Add performance context
      event.contexts = {
        ...event.contexts,
        app: {
          version: process.env.npm_package_version,
          build: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
        },
      };

      return event;
    },

    // Environment setup
    environment: process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,

    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Capture interactions
        routingInstrumentation: Sentry.nextRouterInstrumentation({}),
      }),
    ],
  });
};

// Error boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: errorInfo,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We've been notified of the issue and are working to fix it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Custom Analytics & User Behavior Tracking**:

```typescript
// lib/analytics/tracker.ts
export class AnalyticsTracker {
  private static events: AnalyticsEvent[] = [];
  private static batchSize = 50;
  private static flushInterval = 30000; // 30 seconds

  static init() {
    if (typeof window !== "undefined") {
      // Flush events periodically
      setInterval(() => {
        this.flush();
      }, this.flushInterval);

      // Flush on page unload
      window.addEventListener("beforeunload", () => {
        this.flush();
      });
    }
  }

  static track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
      },
      session_id: this.getSessionId(),
      user_id: this.getUserId(),
    };

    this.events.push(analyticsEvent);

    // Batch flush when we reach batch size
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  static async flush() {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: eventsToSend }),
      });
    } catch (error) {
      console.error("Failed to send analytics events:", error);
      // Put events back in queue
      this.events.unshift(...eventsToSend);
    }
  }

  // Business metrics tracking
  static trackAgentUsage(
    agentType: string,
    success: boolean,
    duration: number
  ) {
    this.track("agent_used", {
      agent_type: agentType,
      success,
      duration_ms: duration,
    });
  }

  static trackUserEngagement(action: string, context?: Record<string, any>) {
    this.track("user_engagement", {
      action,
      ...context,
    });
  }

  static trackConversion(event: string, value?: number) {
    this.track("conversion", {
      conversion_event: event,
      value,
    });
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem("analytics_session");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("analytics_session", sessionId);
    }
    return sessionId;
  }

  private static getUserId(): string | null {
    // Get from auth context or local storage
    return localStorage.getItem("user_id");
  }
}

// Hook for tracking user interactions
export const useAnalytics = () => {
  const trackClick = (element: string, context?: Record<string, any>) => {
    AnalyticsTracker.track("click", { element, ...context });
  };

  const trackPageView = (page: string) => {
    AnalyticsTracker.track("page_view", { page });
  };

  const trackFeatureUsage = (feature: string, usage_type: string) => {
    AnalyticsTracker.track("feature_usage", { feature, usage_type });
  };

  return {
    trackClick,
    trackPageView,
    trackFeatureUsage,
    track: AnalyticsTracker.track,
  };
};
```

**System Health Dashboard**:

```typescript
// pages/admin/health.tsx (Internal admin dashboard)
export default function HealthDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const [metricsRes, alertsRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch("/api/admin/alerts"),
      ]);

      setMetrics(await metricsRes.json());
      setAlerts(await alertsRes.json());
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* System Status */}
      <SystemStatusCard metrics={metrics} />

      {/* Performance Metrics */}
      <PerformanceMetricsCard metrics={metrics} />

      {/* Active Alerts */}
      <AlertsCard alerts={alerts} />

      {/* Usage Analytics */}
      <UsageAnalyticsCard metrics={metrics} />

      {/* Error Tracking */}
      <ErrorTrackingCard />
    </div>
  );
}

// API endpoint for system metrics
// pages/api/admin/metrics.ts
export default withAuth(async (req, res) => {
  // Verify admin access
  if (!req.user.profile?.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  try {
    const metrics = await Promise.all([
      getSystemHealth(),
      getPerformanceMetrics(),
      getUsageStats(),
      getErrorRates(),
    ]);

    res.status(200).json({
      system_health: metrics[0],
      performance: metrics[1],
      usage: metrics[2],
      errors: metrics[3],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

async function getSystemHealth(): Promise<SystemHealth> {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkAIServices(),
    checkMercadoPago(),
  ]);

  return {
    database: checks[0].status === "fulfilled" ? "healthy" : "unhealthy",
    redis: checks[1].status === "fulfilled" ? "healthy" : "unhealthy",
    ai_services: checks[2].status === "fulfilled" ? "healthy" : "unhealthy",
    billing: checks[3].status === "fulfilled" ? "healthy" : "unhealthy",
    overall: checks.every((check) => check.status === "fulfilled")
      ? "healthy"
      : "degraded",
  };
}
```

**Deliverable**: Complete error tracking and system health monitoring with admin dashboard

#### **2.2 Performance Monitoring & Alerting (6 hours)**

**Real-time Performance Monitoring**:

```typescript
// lib/monitoring/performance.ts
export class RealTimeMonitor {
  private static wsConnection: WebSocket | null = null;
  private static reconnectInterval: NodeJS.Timeout | null = null;

  static init() {
    if (typeof window !== "undefined") {
      this.connect();

      // Monitor Core Web Vitals
      this.monitorWebVitals();

      // Monitor user interactions
      this.monitorUserInteractions();
    }
  }

  private static connect() {
    const wsUrl = `${process.env.NODE_ENV === "production" ? "wss" : "ws"}://${
      window.location.host
    }/api/monitoring/ws`;

    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onopen = () => {
      console.log("Performance monitoring connected");

      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    };

    this.wsConnection.onclose = () => {
      console.log("Performance monitoring disconnected");

      // Reconnect after 5 seconds
      this.reconnectInterval = setTimeout(() => {
        this.connect();
      }, 5000);
    };
  }

  private static monitorWebVitals() {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => this.sendMetric("CLS", metric.value));
      getFID((metric) => this.sendMetric("FID", metric.value));
      getFCP((metric) => this.sendMetric("FCP", metric.value));
      getLCP((metric) => this.sendMetric("LCP", metric.value));
      getTTFB((metric) => this.sendMetric("TTFB", metric.value));
    });
  }

  private static monitorUserInteractions() {
    let interactionCount = 0;
    let frustratedInteractions = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "event") {
          interactionCount++;

          // Track frustrated interactions (>100ms)
          if (entry.duration > 100) {
            frustratedInteractions++;
          }
        }
      }

      // Send metrics every 30 seconds
      setTimeout(() => {
        this.sendMetric("interactions_total", interactionCount);
        this.sendMetric("interactions_frustrated", frustratedInteractions);

        interactionCount = 0;
        frustratedInteractions = 0;
      }, 30000);
    });

    observer.observe({ entryTypes: ["event"] });
  }

  private static sendMetric(name: string, value: number) {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(
        JSON.stringify({
          type: "metric",
          name,
          value,
          timestamp: Date.now(),
          url: window.location.href,
        })
      );
    }
  }
}

// Server-side performance monitoring
// pages/api/monitoring/ws.ts
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("Client connected to performance monitoring");

  ws.on("message", (data) => {
    try {
      const metric = JSON.parse(data.toString());

      // Process real-time metrics
      processRealtimeMetric(metric);

      // Check for alerts
      checkPerformanceAlerts(metric);
    } catch (error) {
      console.error("Failed to process metric:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected from performance monitoring");
  });
});

function processRealtimeMetric(metric: PerformanceMetric) {
  // Store in time-series database
  storeMetric(metric);

  // Update real-time dashboard
  broadcastToAdmins("metric_update", metric);
}

function checkPerformanceAlerts(metric: PerformanceMetric) {
  const alerts = [];

  // Core Web Vitals thresholds
  if (metric.name === "LCP" && metric.value > 2500) {
    alerts.push({
      type: "performance",
      severity: metric.value > 4000 ? "critical" : "warning",
      message: `LCP is ${metric.value}ms (threshold: 2500ms)`,
      url: metric.url,
    });
  }

  if (metric.name === "FID" && metric.value > 100) {
    alerts.push({
      type: "performance",
      severity: metric.value > 300 ? "critical" : "warning",
      message: `FID is ${metric.value}ms (threshold: 100ms)`,
      url: metric.url,
    });
  }

  if (metric.name === "CLS" && metric.value > 0.1) {
    alerts.push({
      type: "performance",
      severity: metric.value > 0.25 ? "critical" : "warning",
      message: `CLS is ${metric.value} (threshold: 0.1)`,
      url: metric.url,
    });
  }

  // Send alerts
  alerts.forEach((alert) => sendAlert(alert));
}
```

**Automated Alerting System**:

```typescript
// lib/monitoring/alerts.ts
interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  severity: "info" | "warning" | "critical";
  channels: AlertChannel[];
  cooldownMinutes: number;
}

interface AlertChannel {
  type: "email" | "slack" | "webhook";
  config: Record<string, any>;
}

export class AlertManager {
  private static alertHistory: Map<string, number> = new Map();

  private static alertRules: AlertRule[] = [
    {
      id: "high_error_rate",
      name: "High Error Rate",
      condition: (metrics) => metrics.errors.rate_5min > 5, // >5% error rate
      severity: "critical",
      channels: [
        { type: "email", config: { to: "alerts@aidocs.com" } },
        {
          type: "slack",
          config: { channel: "#alerts", webhook: process.env.SLACK_WEBHOOK },
        },
      ],
      cooldownMinutes: 10,
    },
    {
      id: "slow_response_time",
      name: "Slow API Response Time",
      condition: (metrics) => metrics.performance.api_response_p95 > 5000, // >5 seconds
      severity: "warning",
      channels: [
        {
          type: "slack",
          config: {
            channel: "#performance",
            webhook: process.env.SLACK_WEBHOOK,
          },
        },
      ],
      cooldownMinutes: 30,
    },
    {
      id: "database_connection_issues",
      name: "Database Connection Issues",
      condition: (metrics) => metrics.system_health.database !== "healthy",
      severity: "critical",
      channels: [
        { type: "email", config: { to: "ops@aidocs.com" } },
        { type: "webhook", config: { url: process.env.PAGERDUTY_WEBHOOK } },
      ],
      cooldownMinutes: 5,
    },
    {
      id: "high_usage_spike",
      name: "Unusual Usage Spike",
      condition: (metrics) => metrics.usage.requests_per_minute > 1000, // >1000 RPM
      severity: "info",
      channels: [
        {
          type: "slack",
          config: { channel: "#growth", webhook: process.env.SLACK_WEBHOOK },
        },
      ],
      cooldownMinutes: 60,
    },
  ];

  static async checkAlerts(metrics: SystemMetrics) {
    for (const rule of this.alertRules) {
      if (rule.condition(metrics)) {
        await this.triggerAlert(rule, metrics);
      }
    }
  }

  private static async triggerAlert(rule: AlertRule, metrics: SystemMetrics) {
    const lastAlert = this.alertHistory.get(rule.id);
    const cooldownMs = rule.cooldownMinutes * 60 * 1000;

    // Check cooldown
    if (lastAlert && Date.now() - lastAlert < cooldownMs) {
      return;
    }

    // Update alert history
    this.alertHistory.set(rule.id, Date.now());

    // Send to all configured channels
    const alertPromises = rule.channels.map((channel) =>
      this.sendAlert(channel, rule, metrics)
    );

    try {
      await Promise.all(alertPromises);
      console.log(`Alert sent: ${rule.name}`);
    } catch (error) {
      console.error(`Failed to send alert: ${rule.name}`, error);
    }
  }

  private static async sendAlert(
    channel: AlertChannel,
    rule: AlertRule,
    metrics: SystemMetrics
  ) {
    const message = this.formatAlertMessage(rule, metrics);

    switch (channel.type) {
      case "email":
        await this.sendEmailAlert(channel.config, message);
        break;
      case "slack":
        await this.sendSlackAlert(channel.config, message);
        break;
      case "webhook":
        await this.sendWebhookAlert(channel.config, message);
        break;
    }
  }

  private static async sendSlackAlert(config: any, message: AlertMessage) {
    const response = await fetch(config.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: config.channel,
        text: `🚨 ${message.title}`,
        attachments: [
          {
            color: message.severity === "critical" ? "danger" : "warning",
            fields: [
              {
                title: "Description",
                value: message.description,
                short: false,
              },
              { title: "Timestamp", value: message.timestamp, short: true },
              {
                title: "Severity",
                value: message.severity.toUpperCase(),
                short: true,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack alert failed: ${response.statusText}`);
    }
  }

  private static formatAlertMessage(
    rule: AlertRule,
    metrics: SystemMetrics
  ): AlertMessage {
    return {
      title: rule.name,
      description: this.generateAlertDescription(rule, metrics),
      severity: rule.severity,
      timestamp: new Date().toISOString(),
      metrics: this.extractRelevantMetrics(rule, metrics),
    };
  }
}
```

**Deliverable**: Real-time performance monitoring with automated alerting system

#### **2.3 Log Management & Analytics (6 hours)**

**Structured Logging System**:

```typescript
// lib/logging/logger.ts
import winston from "winston";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(
    ({ timestamp, level, message, service, userId, requestId, ...meta }) => {
      const log = {
        timestamp,
        level,
        message,
        service: service || "main",
        ...(userId && { userId }),
        ...(requestId && { requestId }),
        ...meta,
      };

      return JSON.stringify(log);
    }
  )
);

// Create logger instance
export const logger = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  format: logFormat,
  defaultMeta: {
    service: "ai-docs",
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  },
  transports: [
    // Console output (development)
    ...(isDevelopment
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : []),

    // File logging (production)
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 10485760, // 10MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 10485760, // 10MB
            maxFiles: 5,
          }),
        ]
      : []),

    // External logging service (production)
    ...(isProduction && process.env.LOG_SERVICE_URL
      ? [
          new winston.transports.Http({
            host: process.env.LOG_SERVICE_HOST,
            port: process.env.LOG_SERVICE_PORT,
            path: "/logs",
            ssl: true,
            auth: {
              username: process.env.LOG_SERVICE_USER,
              password: process.env.LOG_SERVICE_PASSWORD,
            },
          }),
        ]
      : []),
  ],
});

// Contextual logging helpers
export class ContextLogger {
  private context: Record<string, any>;

  constructor(context: Record<string, any> = {}) {
    this.context = context;
  }

  info(message: string, meta: Record<string, any> = {}) {
    logger.info(message, { ...this.context, ...meta });
  }

  error(message: string, error?: Error, meta: Record<string, any> = {}) {
    logger.error(message, {
      ...this.context,
      ...meta,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
    });
  }

  warn(message: string, meta: Record<string, any> = {}) {
    logger.warn(message, { ...this.context, ...meta });
  }

  debug(message: string, meta: Record<string, any> = {}) {
    logger.debug(message, { ...this.context, ...meta });
  }
}

// Request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const requestId = req.headers["x-request-id"] || Math.random().toString(36);
  const startTime = Date.now();

  req.logger = new ContextLogger({
    requestId,
    userId: req.user?.id,
    method: req.method,
    url: req.url,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  // Log request start
  req.logger.info("Request started");

  // Log response
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    req.logger.info("Request completed", {
      statusCode: res.statusCode,
      duration,
      contentLength: res.get("content-length"),
    });
  });

  next();
};
```

**Business Analytics & Insights**:

```typescript
// lib/analytics/business-insights.ts
export class BusinessInsightTracker {
  // User journey tracking
  static trackUserJourney(
    userId: string,
    event: string,
    properties: Record<string, any> = {}
  ) {
    logger.info("User journey event", {
      category: "user_journey",
      userId,
      event,
      properties,
      timestamp: new Date().toISOString(),
    });
  }

  // Feature adoption tracking
  static trackFeatureAdoption(
    userId: string,
    feature: string,
    action: "first_use" | "regular_use" | "abandoned"
  ) {
    logger.info("Feature adoption", {
      category: "feature_adoption",
      userId,
      feature,
      action,
      timestamp: new Date().toISOString(),
    });
  }

  // Conversion funnel tracking
  static trackConversionFunnel(
    userId: string,
    stage: string,
    success: boolean,
    metadata?: Record<string, any>
  ) {
    logger.info("Conversion funnel", {
      category: "conversion",
      userId,
      stage,
      success,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // AI agent performance tracking
  static trackAgentPerformance(
    userId: string,
    agentType: string,
    metrics: {
      responseTime: number;
      quality: number;
      userSatisfaction: number;
      approved: boolean;
    }
  ) {
    logger.info("Agent performance", {
      category: "ai_performance",
      userId,
      agentType,
      responseTime: metrics.responseTime,
      quality: metrics.quality,
      userSatisfaction: metrics.userSatisfaction,
      approved: metrics.approved,
      timestamp: new Date().toISOString(),
    });
  }

  // Revenue tracking
  static trackRevenueEvent(
    userId: string,
    event:
      | "subscription_started"
      | "subscription_upgraded"
      | "subscription_cancelled",
    amount: number,
    plan: string
  ) {
    logger.info("Revenue event", {
      category: "revenue",
      userId,
      event,
      amount,
      plan,
      timestamp: new Date().toISOString(),
    });
  }
}

// Analytics dashboard data processing
export class AnalyticsDashboard {
  static async getUserEngagementMetrics(
    timeRange: "1d" | "7d" | "30d" = "7d"
  ): Promise<EngagementMetrics> {
    // This would typically query a data warehouse or analytics service
    // For MVP, we can query logs or database directly

    const startDate = new Date();
    startDate.setDate(
      startDate.getDate() - parseInt(timeRange.replace("d", ""))
    );

    const metrics = await Promise.all([
      this.getActiveUsers(startDate),
      this.getFeatureUsage(startDate),
      this.getConversionRates(startDate),
      this.getAgentUsageStats(startDate),
    ]);

    return {
      activeUsers: metrics[0],
      featureUsage: metrics[1],
      conversionRates: metrics[2],
      agentUsage: metrics[3],
    };
  }

  private static async getActiveUsers(since: Date) {
    // Query user activity from logs or database
    const { data } = await supabase
      .from("usage_tracking")
      .select("user_id")
      .gte("created_at", since.toISOString())
      .gt("requests_used", 0);

    return {
      total: new Set(data?.map((d) => d.user_id)).size || 0,
      daily: await this.getDailyActiveUsers(since),
    };
  }

  private static async getFeatureUsage(since: Date) {
    // This would analyze feature usage from logs
    // For MVP, track key features in database
    return {
      agent_requests: await this.countFeatureUsage("agent_request", since),
      document_uploads: await this.countFeatureUsage("document_upload", since),
      search_queries: await this.countFeatureUsage("search_query", since),
    };
  }
}
```

**Log Analysis & Search**:

```typescript
// pages/api/admin/logs.ts
export default withAuth(async (req, res) => {
  if (!req.user.profile?.is_admin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  const { query, level, service, startDate, endDate, limit = 100 } = req.query;

  try {
    const logs = await searchLogs({
      query: query as string,
      level: level as string,
      service: service as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
    });

    res.status(200).json({ logs });
  } catch (error) {
    console.error("Log search error:", error);
    res.status(500).json({ error: "Failed to search logs" });
  }
});

async function searchLogs(filters: LogSearchFilters): Promise<LogEntry[]> {
  // In production, this would use a log aggregation service like ELK stack
  // For MVP, we can search log files directly or use database logging

  const fs = require("fs").promises;
  const path = require("path");

  try {
    const logFile = path.join(process.cwd(), "logs/combined.log");
    const logContent = await fs.readFile(logFile, "utf-8");
    const logLines = logContent.split("\n").filter((line) => line.trim());

    let logs = logLines
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    // Apply filters
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.message?.toLowerCase().includes(queryLower) ||
          JSON.stringify(log).toLowerCase().includes(queryLower)
      );
    }

    if (filters.level) {
      logs = logs.filter((log) => log.level === filters.level);
    }

    if (filters.service) {
      logs = logs.filter((log) => log.service === filters.service);
    }

    if (filters.startDate) {
      logs = logs.filter(
        (log) => new Date(log.timestamp) >= filters.startDate!
      );
    }

    if (filters.endDate) {
      logs = logs.filter((log) => new Date(log.timestamp) <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return logs.slice(0, filters.limit);
  } catch (error) {
    console.error("Failed to search logs:", error);
    return [];
  }
}
```

**Deliverable**: Complete logging system with business analytics and log search capabilities

### **Phase 3: Production Optimization (Weeks 11-12 - 10 hours)**

#### **3.1 Load Testing & Performance Validation (5 hours)**

**Load Testing Setup**:

```typescript
// tests/load/agent-requests.test.ts
import { check, sleep } from "k6";
import http from "k6/http";

export let options = {
  stages: [
    { duration: "2m", target: 10 }, // Ramp up
    { duration: "5m", target: 10 }, // Stay at 10 users
    { duration: "2m", target: 20 }, // Ramp up to 20 users
    { duration: "5m", target: 20 }, // Stay at 20 users
    { duration: "2m", target: 50 }, // Ramp up to 50 users
    { duration: "5m", target: 50 }, // Stay at 50 users
    { duration: "5m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<5000"], // 95% of requests under 5s
    http_req_failed: ["rate<0.1"], // Error rate under 10%
  },
};

const BASE_URL = __ENV.BASE_URL || "https://api.aidocs.com";
const API_KEY = __ENV.API_KEY;

export function setup() {
  // Create test users and get auth tokens
  const response = http.post(
    `${BASE_URL}/api/test/setup`,
    {
      count: 50, // Create 50 test users
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.json();
}

export default function (data) {
  const userIndex = Math.floor(Math.random() * data.users.length);
  const user = data.users[userIndex];

  // Test agent request
  const agentResponse = http.post(
    `${BASE_URL}/api/trpc/agents.executeAgent`,
    JSON.stringify({
      content: "Create a summary of my project documentation",
      agentType: "create",
    }),
    {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    }
  );

  check(agentResponse, {
    "agent request succeeded": (r) => r.status === 200,
    "agent response time OK": (r) => r.timings.duration < 10000, // 10s
  });

  // Test document search
  const searchResponse = http.get(
    `${BASE_URL}/api/trpc/search.semantic?query=authentication`,
    {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    }
  );

  check(searchResponse, {
    "search request succeeded": (r) => r.status === 200,
    "search response time OK": (r) => r.timings.duration < 2000, // 2s
  });

  sleep(1); // 1 second between requests
}

export function teardown(data) {
  // Clean up test users
  http.post(
    `${BASE_URL}/api/test/cleanup`,
    {
      users: data.users.map((u) => u.id),
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
}
```

**Performance Benchmarking**:

```bash
#!/bin/bash
# scripts/benchmark.sh

echo "🚀 Starting performance benchmark..."

# Run load tests
echo "Running load tests..."
k6 run tests/load/agent-requests.test.ts

# Run Lighthouse audit
echo "Running Lighthouse audit..."
npm run lighthouse:audit

# Database performance test
echo "Testing database performance..."
npm run test:db-performance

# Memory leak detection
echo "Checking for memory leaks..."
npm run test:memory

# Bundle size analysis
echo "Analyzing bundle size..."
npm run analyze:bundle

echo "✅ Benchmark complete!"
```

**Deliverable**: Comprehensive load testing and performance validation suite

#### **3.2 Security Hardening & Compliance (3 hours)**

**Security Configuration**:

```typescript
// Security middleware and configurations
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Security headers
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
        "https://www.mercadopago.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://api.anthropic.com",
      ],
      frameSrc: ["https://www.mercadopago.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Rate limiting
export const createRateLimiter = (windowMs: number, max: number) =>
  rateLimit({
    windowMs,
    max,
    message: "Too many requests from this IP",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/api/health";
    },
  });

// API rate limits
export const apiRateLimit = createRateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authRateLimit = createRateLimiter(15 * 60 * 1000, 10); // 10 auth attempts per 15 minutes
export const aiRateLimit = createRateLimiter(60 * 1000, 10); // 10 AI requests per minute

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .trim();
};
```

**GDPR Compliance Implementation**:

```typescript
// lib/compliance/gdpr.ts
export class GDPRCompliance {
  static async exportUserData(userId: string): Promise<UserDataExport> {
    const [profile, documents, usage, billing] = await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", userId),
      supabase.from("documents").select("*").eq("user_id", userId),
      supabase.from("usage_tracking").select("*").eq("user_id", userId),
      supabase.from("billing_events").select("*").eq("user_id", userId),
    ]);

    return {
      personal_information: profile.data,
      documents: documents.data,
      usage_history: usage.data,
      billing_history: billing.data,
      export_date: new Date().toISOString(),
      format_version: "1.0",
    };
  }

  static async deleteUserData(
    userId: string,
    keepBillingRecords = true
  ): Promise<void> {
    // Delete user documents and content
    await supabase.from("documents").delete().eq("user_id", userId);
    await supabase.from("usage_tracking").delete().eq("user_id", userId);

    if (!keepBillingRecords) {
      await supabase.from("billing_events").delete().eq("user_id", userId);
    }

    // Anonymize profile (keep for business analytics)
    await supabase
      .from("user_profiles")
      .update({
        email: `deleted-${userId}@deleted.local`,
        full_name: null,
        avatar_url: null,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  static async logConsentChange(
    userId: string,
    consentType: string,
    granted: boolean
  ): Promise<void> {
    await supabase.from("consent_log").insert({
      user_id: userId,
      consent_type: consentType,
      granted,
      timestamp: new Date().toISOString(),
      ip_address: "masked", // IP addresses should be masked for privacy
    });
  }
}
```

**Deliverable**: Security-hardened production deployment with GDPR compliance

#### **3.3 Documentation & Runbooks (2 hours)**

**Operational Runbooks**:

````markdown
# Production Operations Runbook

## 🚨 Incident Response

### High Error Rate Alert

1. Check system health dashboard
2. Review recent deployments (last 2 hours)
3. Check AI API status (OpenAI, Anthropic)
4. Review error logs for patterns
5. If database issue: Check connection pool
6. If AI API issue: Implement circuit breaker
7. Document incident in incident log

### Database Performance Issues

1. Check current connections: `SELECT count(*) FROM pg_stat_activity;`
2. Check slow queries: `SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;`
3. Check locks: `SELECT * FROM pg_locks WHERE NOT granted;`
4. Consider scaling read replicas
5. Contact Supabase support if needed

### AI API Rate Limits

1. Check current usage in OpenAI dashboard
2. Review rate limiting logs
3. Implement request queuing if needed
4. Consider upgrading API tier
5. Notify users of potential delays

## 🔄 Deployment Procedures

### Standard Deployment

1. Merge PR to main branch
2. GitHub Actions automatically runs tests
3. If tests pass, deployment starts automatically
4. Monitor deployment logs
5. Run post-deployment health checks
6. Verify in staging environment first

### Emergency Rollback

1. Identify the last known good deployment
2. Use Vercel dashboard to rollback frontend
3. Rollback database migrations if needed:

   ```sql
   -- Check migration history
   SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;

   -- Rollback if needed
   npm run migrate:rollback
   ```
````

4. Clear CDN cache if needed
5. Notify team of rollback

## 📊 Monitoring Checklist

### Daily Checks

- [ ] System health dashboard green
- [ ] Error rate <1%
- [ ] API response time <2s average
- [ ] No critical alerts in past 24h
- [ ] AI API costs within budget

### Weekly Checks

- [ ] Database performance metrics
- [ ] Security scan results
- [ ] Backup integrity tests
- [ ] User feedback review
- [ ] Performance trend analysis

````

**API Documentation**:
```typescript
// Auto-generated API documentation
// swagger.json configuration for production API docs

export const swaggerConfig = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Docs API',
      version: '1.0.0',
      description: 'AI-powered document management and processing API',
    },
    servers: [
      {
        url: 'https://api.aidocs.com',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.aidocs.com',
        description: 'Staging server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./pages/api/**/*.ts'], // Path to the API docs
};

/**
 * @swagger
 * /api/trpc/agents.executeAgent:
 *   post:
 *     summary: Execute AI agent request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The user's request to the AI agent
 *               agentType:
 *                 type: string
 *                 enum: [create, edit, research]
 *                 description: Type of AI agent to use
 *     responses:
 *       200:
 *         description: Agent response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 content:
 *                   type: string
 *                 confidence:
 *                   type: number
 *                 sources:
 *                   type: array
 *                   items:
 *                     type: object
 */
````

**Deliverable**: Complete operational documentation and runbooks for production support

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Weeks 7-8 Deliverables**

- [ ] Production environment configuration with secrets management
- [ ] CI/CD pipeline with automated testing and deployment
- [ ] Blue-green deployment strategy implementation
- [ ] Performance optimization and CDN setup
- [ ] Database optimization and connection pooling
- [ ] Health check endpoints and monitoring setup

### **Weeks 9-10 Deliverables**

- [ ] Sentry integration for error tracking and performance monitoring
- [ ] Custom analytics system with user behavior tracking
- [ ] System health dashboard with real-time metrics
- [ ] Automated alerting system with multiple channels
- [ ] Real-time performance monitoring with Core Web Vitals
- [ ] Log management system with search and analysis

### **Weeks 11-12 Deliverables**

- [ ] Load testing suite with K6 and performance validation
- [ ] Security hardening with rate limiting and input sanitization
- [ ] GDPR compliance implementation with data export/deletion
- [ ] Production runbooks and incident response procedures
- [ ] Complete API documentation with Swagger
- [ ] Monitoring dashboards and alerting validation

### **Quality Gates**

- [ ] 99.5% uptime achieved in staging environment
- [ ] All load tests pass with <5s 95th percentile response time
- [ ] Security scan shows no high/critical vulnerabilities
- [ ] GDPR compliance verified with legal review
- [ ] All monitoring alerts tested and functional
- [ ] Complete runbook documentation reviewed and approved

---

## 📊 **SUCCESS METRICS**

### **System Reliability**

- **Uptime**: 99.5% uptime with automated failover
- **Response Time**: <3 seconds 95th percentile for all API endpoints
- **Error Rate**: <1% overall error rate
- **Mean Time to Recovery**: <15 minutes for any service disruption

### **Performance**

- **Concurrent Users**: Support 1000+ concurrent active users
- **API Throughput**: Handle 10,000+ requests per minute
- **Database Performance**: <500ms average query response time
- **CDN Performance**: <1 second first contentful paint globally

### **Operations**

- **Deployment Success**: 100% successful automated deployments
- **Alert Response Time**: <5 minutes mean time to acknowledge alerts
- **Incident Resolution**: <2 hours mean time to resolution
- **Security Compliance**: Zero high/critical security vulnerabilities

---

## 🚀 **VERCEL + SUPABASE DEPLOYMENT ARCHITECTURE ADVANTAGES**

### **Deployment Revolution - Complex Infrastructure → Managed Services Migration**

**This document has been updated to reflect the Pure Supabase + Vercel architecture. Key advantages:**

#### **Infrastructure Simplification**

- **From**: Multiple services (backend servers, database, auth, real-time, file storage, monitoring)
- **To**: Two managed platforms (Vercel + Supabase) handling everything
- **Benefit**: 80% reduction in infrastructure complexity, zero server management

#### **Deployment Pipeline Automation**

- **From**: Custom CI/CD with server provisioning, database migrations, service orchestration
- **To**: Git-based deployment with automatic edge functions + database sync
- **Benefit**: Zero-downtime deployments, automatic rollbacks, instant scaling

#### **Global Performance Architecture**

- **From**: Regional deployment with manual CDN configuration
- **To**: Global edge deployment with automatic geographic distribution
- **Benefit**: Sub-100ms response times worldwide, automatic traffic routing

#### **Monitoring & Observability Built-in**

- **From**: Custom monitoring setup with external services (DataDog, New Relic, Sentry)
- **To**: Built-in monitoring dashboards and alerts in both platforms
- **Benefit**: Real-time metrics, automatic error tracking, zero configuration

### **Implementation Timeline Transformation**

| Component                    | Traditional Infrastructure | Vercel + Supabase            | Time Saved        |
| ---------------------------- | -------------------------- | ---------------------------- | ----------------- |
| **Server Setup & Config**    | 15 hours                   | 0 hours (managed)            | 100% faster       |
| **Database Deployment**      | 8 hours                    | 1 hour (Supabase project)    | 87% faster        |
| **CI/CD Pipeline Setup**     | 12 hours                   | 3 hours (GitHub integration) | 75% faster        |
| **Monitoring Setup**         | 10 hours                   | 2 hours (dashboard config)   | 80% faster        |
| **Performance Optimization** | 8 hours                    | 2 hours (edge config)        | 75% faster        |
| **Security Configuration**   | 6 hours                    | 1 hour (RLS + auth)          | 83% faster        |
| **Load Testing & Scaling**   | 4 hours                    | 1 hour (verify scaling)      | 75% faster        |
| **Documentation & Runbooks** | 3 hours                    | 2 hours (simplified ops)     | 33% faster        |
| **Total**                    | **66 hours**               | **12 hours**                 | **82% reduction** |

### **Enhanced Performance Characteristics**

| Metric                   | Traditional Setup | Vercel + Supabase   | Improvement        |
| ------------------------ | ----------------- | ------------------- | ------------------ |
| **Global Response Time** | 200-500ms         | 50-150ms            | 60-70% faster      |
| **Concurrent Users**     | 1,000             | 5,000+              | 5x improvement     |
| **API Throughput**       | 10K req/min       | 50K+ req/min        | 5x improvement     |
| **Uptime SLA**           | 99.5%             | 99.9%               | Better reliability |
| **Deployment Time**      | 10-30 minutes     | 30 seconds          | 95% faster         |
| **Scaling Response**     | Manual (hours)    | Automatic (seconds) | Real-time scaling  |

### **Cost Optimization Benefits**

#### **Infrastructure Cost Comparison**

```
Traditional Monthly Costs:
- Server hosting: $200-500/month
- Database hosting: $100-300/month
- CDN & storage: $50-150/month
- Monitoring tools: $50-200/month
- Load balancing: $50-100/month
Total: $450-1,250/month

Vercel + Supabase:
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Additional usage: $50-200/month
Total: $95-245/month

Savings: 70-80% cost reduction
```

### **Business Impact & Launch Acceleration**

✅ **82% faster deployment setup**: 66 hours → 12 hours  
✅ **70-80% cost reduction**: $450-1,250 → $95-245/month  
✅ **99.9% uptime guarantee**: Better than self-managed infrastructure  
✅ **5x performance improvement**: 50K+ req/min, 5K+ concurrent users  
✅ **60-70% faster global response times**: Sub-150ms worldwide  
✅ **Zero operational overhead**: No servers, updates, or scaling management  
✅ **Instant global distribution**: Available worldwide from day one  
✅ **Enterprise-grade security**: SOC 2, GDPR, HIPAA compliant out of the box

### **Launch Timeline Acceleration**

**Week 4**: Production deployment ready (vs Week 12 traditional)  
**Week 8**: Handling 1000+ concurrent users smoothly  
**Week 16**: Global performance optimized, 5000+ users  
**Week 20**: Enterprise-grade infrastructure supporting any scale

---

**This Vercel + Supabase deployment architecture for Centrid delivers enterprise-grade reliability, performance, and security while eliminating 82% of deployment complexity and reducing infrastructure costs by 70-80%, enabling rapid scaling from MVP to global platform.**
