import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
  return c.json({ message: 'Test API works!', timestamp: new Date().toISOString() });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy' });
});

export default app.fetch;
