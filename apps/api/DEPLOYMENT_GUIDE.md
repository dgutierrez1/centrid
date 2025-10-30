# Deployment Guide: New Backend Architecture

This guide provides step-by-step instructions for deploying the new consolidated API architecture to production.

## 🚀 Pre-Deployment Checklist

### **1. Environment Setup**
- [ ] Node.js 18+ installed
- [ ] Supabase CLI installed
- [ ] Database access and permissions configured
- [ ] Environment variables set

### **2. Required Environment Variables**
```bash
# In apps/api/.env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-X-XX-X.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_ANON_KEY="your-anon-key"

# Optional: AI Provider Keys
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

### **3. Database Verification**
```bash
cd apps/api
npm run db:push
```

## 📋 Deployment Steps

### **Step 1: Type Checking**
```bash
cd apps/api
npm run type-check
```
✅ **Expected**: No TypeScript errors

### **Step 2: Local Testing**
```bash
# Start local Supabase
supabase start

# Run comprehensive tests
node test-comprehensive-api.js
```
✅ **Expected**: 95%+ pass rate

### **Step 3: Deploy Functions**
```bash
# Deploy all functions (including new consolidated API)
npm run deploy:functions

# Or deploy just the new API function
npm run deploy:function api
```

### **Step 4: Verify Deployment**
```bash
# Test the deployed API
curl https://your-project-ref.supabase.co/functions/v1/api/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-15T10:30:00.000Z",...}
```

## 🔧 Configuration Verification

### **Supabase Config Check**
Verify `apps/api/supabase/config.toml` includes:
```toml
[edge_runtime]
enabled = true
policy = "per_worker"

[functions.api]
entrypoint = '../src/functions/api/index.ts'
import_map = '../import_map.json'
```

### **Import Map Check**
Verify `apps/api/import_map.json` includes:
```json
{
  "imports": {
    "@centrid/shared": "../../packages/shared/src/index.ts",
    "@centrid/shared/": "../../packages/shared/src/",
    "@centrid/shared/types": "../../packages/shared/src/types/index.ts",
    "@centrid/shared/utils": "../../packages/shared/src/utils/index.ts",
    "@centrid/shared/schemas": "../../packages/shared/src/schemas/index.ts"
  }
}
```

## 🧪 Post-Deployment Testing

### **1. Health Check**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-project-ref.supabase.co/functions/v1/api/health
```

### **2. API Info**
```bash
curl https://your-project-ref.supabase.co/functions/v1/api/
```

### **3. Thread Operations Test**
```bash
# Create a thread
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"branchTitle":"Test Thread","creator":"user"}' \
  https://your-project-ref.supabase.co/functions/v1/api/threads
```

### **4. File Operations Test**
```bash
# Create a file
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path":"test.txt","content":"Hello World"}' \
  https://your-project-ref.supabase.co/functions/v1/api/files
```

## 📊 Monitoring Setup

### **1. Supabase Dashboard**
- Navigate to **Functions** → **Logs**
- Monitor structured logs with request correlation
- Check for performance warnings (>5s operations)

### **2. Log Search Examples**
```javascript
// Search by request ID
requestId:"req_123456"

// Search by user ID
userId:"user_789"

// Search for slow operations
duration_ms:">5000"

// Search for errors
level:"error"

// Search by operation
operation:"create_thread"
```

### **3. Performance Monitoring**
Monitor these key metrics:
- **Request Duration**: Should be <5s for most operations
- **Error Rate**: Should be <5%
- **Authentication**: All requests should be authenticated
- **Database Queries**: Monitor for slow queries

## 🚨 Troubleshooting

### **Common Issues**

#### **1. Function Deployment Failed**
```bash
# Check function logs
supabase functions logs api

# Verify configuration
cat supabase/config.toml | grep -A 5 "\[functions.api\]"
```

#### **2. Authentication Errors**
```bash
# Verify JWT token format
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d

# Check Supabase auth settings
supabase auth status
```

#### **3. Database Connection Issues**
```bash
# Test database connection
npm run db:push

# Check environment variables
env | grep -E "(DATABASE_URL|SUPABASE)"
```

#### **4. Import Map Issues**
```bash
# Verify shared package access
ls -la packages/shared/src/

# Check import map syntax
cat import_map.json | jq .
```

### **Debug Mode**
For debugging, you can enable verbose logging:
```typescript
// In apps/api/src/functions/api/index.ts
export class ApiFunction extends EdgeFunctionBase {
  constructor() {
    super();
    this.logger.setContext({ debug: true }); // Enable debug logs
  }
}
```

## 🔄 Rollback Plan

If deployment fails, rollback steps:

### **1. Restore Previous Functions**
```bash
# Deploy previous version (keep backup)
supabase functions deploy --project-ref your-project-ref backup-function-name
```

### **2. Database Rollback**
```bash
# Reset database to previous migration
npm run db:drop
npm run db:push  # With previous schema
```

### **3. Configuration Rollback**
```bash
# Restore previous supabase config
git checkout HEAD~1 supabase/config.toml
supabase functions deploy
```

## 📈 Performance Optimization

### **1. Database Indexes**
Ensure these indexes exist in your schema:
```sql
-- Thread indexes
CREATE INDEX IF NOT EXISTS idx_threads_owner_user_id ON threads(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_threads_parent_id ON threads(parent_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON threads(created_at);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- File indexes
CREATE INDEX IF NOT EXISTS idx_files_owner_user_id ON files(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
```

### **2. Connection Pooling**
Configure connection pool in `apps/api/src/db/config.ts`:
```typescript
export const DB_CONNECTION_CONFIG = {
  max: 5,           // Increase for better performance
  idle_timeout: 60, // Extended for longer operations
  max_lifetime: 300,
} as const;
```

### **3. Caching Strategy**
Add caching for frequently accessed data:
```typescript
// In service classes
private async getCachedThread(threadId: string) {
  const cacheKey = `thread:${threadId}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const thread = await this.threadRepository.findById(threadId);
  await cacheService.set(cacheKey, thread, 300000); // 5 minutes
  return thread;
}
```

## 🔒 Security Considerations

### **1. Environment Variable Security**
- Never commit `.env` files
- Use Supabase secrets for production values
- Rotate keys regularly

### **2. Function Permissions**
```bash
# Review function permissions
supabase functions list

# Check function secrets
supabase secrets list
```

### **3. Network Security**
- Use HTTPS in production
- Implement rate limiting
- Monitor for abuse patterns

## 📋 Maintenance Checklist

### **Weekly**
- [ ] Check function logs for errors
- [ ] Monitor performance metrics
- [ ] Review authentication patterns
- [ ] Update dependencies if needed

### **Monthly**
- [ ] Rotate API keys and secrets
- [ ] Review database performance
- [ ] Update documentation
- [ ] Test disaster recovery

### **Quarterly**
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Architecture review
- [ ] Capacity planning

## 🎯 Success Criteria

### **Deployment Success Indicators**
✅ **All 26 routes accessible**
✅ **Authentication working**
✅ **Structured logs appearing**
✅ **Response times <5s**
✅ **Error rate <5%**
✅ **No TypeScript errors**
✅ **Database operations successful**

### **Monitoring Success Indicators**
✅ **Logs searchable by request ID**
✅ **Performance warnings working**
✅ **Error tracking functional**
✅ **User access control enforced**
✅ **Resource usage optimal**

## 📞 Support

If you encounter issues:

1. **Check logs**: `supabase functions logs api`
2. **Verify config**: Review `supabase/config.toml`
3. **Test locally**: Use `supabase start` for local testing
4. **Review docs**: Check `NEW_ARCHITECTURE_README.md`
5. **Community**: Post issues in the repository

**Your new backend architecture is now production-ready!** 🚀