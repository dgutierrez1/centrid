import { Hono } from 'hono';

const app = new Hono();

// Hono in Supabase gets requests at the function path
// So we need to handle requests without assuming a base path
app.all('*', (c) => {
  const path = new URL(c.req.url).pathname;
  
  if (path.endsWith('/health')) {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Default root response
  return c.json({
    name: 'Centrid API',
    version: '3.0.5-minimal-fixed',
    status: 'operational',
    timestamp: new Date().toISOString(),
    path: path,
    method: c.req.method,
  });
});

Deno.serve(app.fetch);
