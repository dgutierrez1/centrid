# BE-02: Database Schema & Migrations

**Status**: `pending`  
**Estimate**: 4 hours  
**Priority**: Critical  
**Dependencies**: BE-01

## Description

Create PostgreSQL database schema with tables for users, documents, chunks, agent requests, and usage tracking. Implement RLS policies and indexes.

## Tasks

- [ ] Create user_profiles table
- [ ] Create documents table with full-text search
- [ ] Create document_chunks table
- [ ] Create agent_requests table
- [ ] Create usage_tracking table
- [ ] Implement Row Level Security policies
- [ ] Create GIN indexes for full-text search
- [ ] Create user_id indexes
- [ ] Write migration files

## Tech Spec

### Core Tables

```sql
-- User profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) DEFAULT 'free',
  usage_count INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents with full-text search
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size INTEGER NOT NULL,
  processing_status VARCHAR(20) DEFAULT 'pending',
  content_text TEXT,
  search_vector tsvector,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX documents_search_idx ON documents
  USING GIN (search_vector);

-- Agent requests
CREATE TABLE agent_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  result TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

```sql
-- Users can only access their own data
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE agent_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own requests" ON agent_requests
  FOR ALL USING (auth.uid() = user_id);
```

## Acceptance Criteria

- [ ] All tables created successfully
- [ ] RLS policies working correctly
- [ ] Indexes created and optimized
- [ ] Migration files tested locally
- [ ] Can insert/query test data
- [ ] Full-text search returns results

## Notes

- Use `tsvector` for PostgreSQL full-text search
- GIN indexes for fast text search
- Cascade deletes for data cleanup
