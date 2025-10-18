# BE-01: Supabase Project Setup

**Status**: `pending`  
**Estimate**: 2 hours  
**Priority**: Critical  
**Dependencies**: None

## Description

Set up Supabase project for development and production environments with proper configuration for Edge Functions, Storage, Auth, and Database.

## Tasks

- [ ] Create Supabase project (prod + staging)
- [ ] Configure Edge Functions runtime
- [ ] Set up Supabase Storage buckets for documents
- [ ] Configure authentication providers (email/password only)
- [ ] Set up environment variables
- [ ] Initialize local development environment
- [ ] Connect to GitHub for CI/CD

## Tech Spec

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ANTHROPIC_API_KEY=xxx
MERCADOPAGO_ACCESS_TOKEN=xxx
```

### Storage Buckets

- `documents` - Private bucket for user files (.md, .txt, .pdf)
- Max file size: 10MB
- RLS enabled

### Edge Functions Setup

```bash
supabase functions new process-document
supabase functions new execute-ai-agent
supabase functions new billing-webhook
```

## Acceptance Criteria

- [ ] Supabase project accessible and configured
- [ ] Local development environment working
- [ ] Storage buckets created with proper RLS
- [ ] Environment variables documented
- [ ] Edge Functions scaffolding ready

## Notes

- Use Supabase CLI v1.x
- Keep staging and production separate
- Document all API keys in 1Password/secrets manager

