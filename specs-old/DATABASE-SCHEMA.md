# Centrid - Database Schema

**Version**: 1.0 (Context-First MVP)  
**Date**: 2025-01-15  
**Database**: PostgreSQL 15+ with pgvector via Supabase

---

## 🎯 Core Features

- ✅ Multi-chat system with unlimited independent conversations
- ✅ Persistent document context across all chats (RAG with pgvector)
- ✅ Vector search for semantic retrieval (1536-dim embeddings)
- ✅ Document management with folder organization
- ✅ Context citations tracking (which docs informed each response)
- ✅ Subscription billing via Stripe

---

## 📋 Tables Overview

### **User Management**

#### **`user_profiles`**

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  name TEXT,
  avatar_url TEXT,

  -- Subscription (Stripe)
  plan TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'paid', 'cancelled', 'expired'
  subscription_status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'cancelled', 'past_due', 'expired'
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,

  -- Usage Counters
  message_count INTEGER DEFAULT 0 NOT NULL,
  document_count INTEGER DEFAULT 0 NOT NULL,
  chat_count INTEGER DEFAULT 0 NOT NULL,
  storage_used_bytes BIGINT DEFAULT 0 NOT NULL,

  -- Preferences
  language TEXT DEFAULT 'en', -- 'en', 'es'
  theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active_at TIMESTAMPTZ
);

CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_subscription_status ON user_profiles(subscription_status);
```

---

### **Document Management**

#### **`documents`**

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- File Info
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'markdown', 'text', 'pdf'
  file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- Max 10MB
  file_path TEXT NOT NULL, -- Supabase Storage path

  -- Content
  content_text TEXT,
  word_count INTEGER DEFAULT 0,

  -- Organization
  folder_path TEXT DEFAULT '/', -- '/', '/projects/', '/notes/'

  -- Processing
  processing_status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  processing_error TEXT,
  processed_at TIMESTAMPTZ,

  -- Full-Text Search
  search_vector TSVECTOR,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_folder_path ON documents(user_id, folder_path);
CREATE INDEX idx_documents_processing_status ON documents(processing_status) WHERE processing_status IN ('pending', 'processing');
CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);
```

#### **`document_chunks`** (Vector Embeddings for RAG)

```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Chunk Content
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL CHECK (token_count > 0 AND token_count <= 8192),

  -- Context
  section_title TEXT,
  start_char INTEGER CHECK (start_char >= 0),
  end_char INTEGER CHECK (end_char > start_char),

  -- Vector Embeddings (pgvector)
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(document_id, chunk_index)
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_user_id ON document_chunks(user_id);

-- Vector similarity search (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

---

### **Multi-Chat System**

#### **`chats`**

```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Chat Info
  title TEXT NOT NULL DEFAULT 'New Chat',
  description TEXT,

  -- Stats
  message_count INTEGER DEFAULT 0 NOT NULL CHECK (message_count >= 0),
  last_message_at TIMESTAMPTZ,

  -- Organization
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_user_active ON chats(user_id, is_archived) WHERE is_archived = FALSE;
CREATE INDEX idx_chats_last_message ON chats(user_id, last_message_at DESC);
```

#### **`messages`**

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,

  -- AI Model (for assistant messages)
  model TEXT, -- e.g., 'claude-3-5-sonnet-20241022'
  model_provider TEXT, -- 'anthropic', 'openai'

  -- Token Usage & Cost
  prompt_tokens INTEGER CHECK (prompt_tokens >= 0),
  completion_tokens INTEGER CHECK (completion_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens >= 0),
  estimated_cost_usd DECIMAL(10, 6),

  -- Context Metadata
  context_retrieved BOOLEAN DEFAULT FALSE,
  context_chunk_count INTEGER DEFAULT 0 CHECK (context_chunk_count >= 0),

  -- Status
  status TEXT DEFAULT 'completed' NOT NULL, -- 'pending', 'streaming', 'completed', 'failed'
  error_message TEXT,

  -- Sequence & Timing
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  response_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(chat_id, sequence_number)
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id, sequence_number);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_status ON messages(status) WHERE status IN ('pending', 'streaming');
```

#### **`message_context_chunks`** (Context Citations)

```sql
CREATE TABLE message_context_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  document_chunk_id UUID NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Relevance
  similarity_score FLOAT CHECK (similarity_score >= 0 AND similarity_score <= 1),
  rank_order INTEGER NOT NULL CHECK (rank_order > 0),
  used_in_context BOOLEAN DEFAULT TRUE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(message_id, document_chunk_id)
);

CREATE INDEX idx_message_context_message_id ON message_context_chunks(message_id);
CREATE INDEX idx_message_context_document_id ON message_context_chunks(document_id);
```

---

### **Usage & Billing**

#### **`usage_events`**

```sql
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL, -- 'message_sent', 'document_uploaded', 'chat_created', 'ai_request'

  -- Resource References
  chat_id UUID REFERENCES chats(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

  -- Metrics
  tokens_used INTEGER DEFAULT 0 CHECK (tokens_used >= 0),
  cost_usd DECIMAL(10, 6),
  model TEXT,
  model_provider TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_date DATE GENERATED ALWAYS AS (created_at::DATE) STORED
);

CREATE INDEX idx_usage_events_user_id ON usage_events(user_id, created_at DESC);
CREATE INDEX idx_usage_events_date ON usage_events(user_id, event_date);
```

#### **`billing_events`** (Stripe Webhooks)

```sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Stripe Event
  stripe_event_id TEXT UNIQUE NOT NULL,
  stripe_event_type TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_invoice_id TEXT,

  -- Payment
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  payment_status TEXT, -- 'succeeded', 'failed', 'pending'

  -- Raw Data
  event_data JSONB NOT NULL,

  -- Processing
  processed BOOLEAN DEFAULT FALSE NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_billing_events_stripe_customer ON billing_events(stripe_customer_id);
CREATE INDEX idx_billing_events_processed ON billing_events(processed) WHERE processed = FALSE;
```

---

## 🔐 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_context_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users access own data" ON user_profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users access own data" ON documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own data" ON document_chunks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users access own data" ON chats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own data" ON messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own data" ON usage_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users access own data" ON billing_events FOR SELECT USING (auth.uid() = user_id);

-- Message context accessible via messages
CREATE POLICY "Users view own message context" ON message_context_chunks FOR SELECT
  USING (EXISTS (SELECT 1 FROM messages WHERE messages.id = message_context_chunks.message_id AND messages.user_id = auth.uid()));
```

---

## 🔧 Key Functions & Triggers

### **Auto-create User Profile**

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, trial_ends_at) VALUES (NEW.id, NOW() + INTERVAL '7 days');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### **Update Chat on New Message**

```sql
CREATE OR REPLACE FUNCTION update_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chats SET message_count = message_count + 1, last_message_at = NEW.created_at, updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_chat_on_message();
```

### **Full-Text Search Vector Update**

```sql
CREATE OR REPLACE FUNCTION documents_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.filename, '')), 'A') || setweight(to_tsvector('english', COALESCE(NEW.content_text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_vector_trigger BEFORE INSERT OR UPDATE OF filename, content_text ON documents FOR EACH ROW EXECUTE FUNCTION documents_search_vector_update();
```

### **Auto-update updated_at**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔍 Essential Queries

### **Semantic Search (RAG)**

```sql
-- Find most relevant document chunks for context retrieval
SELECT
  dc.id, dc.content, dc.section_title, d.filename,
  1 - (dc.embedding <=> $2::vector) as similarity_score
FROM document_chunks dc
JOIN documents d ON d.id = dc.document_id
WHERE dc.user_id = $1 AND d.processing_status = 'completed'
ORDER BY dc.embedding <=> $2::vector
LIMIT 10;
-- $1: user_id, $2: query_embedding (VECTOR(1536))
```

### **Get Chat with Messages**

```sql
SELECT c.*, json_agg(json_build_object('id', m.id, 'role', m.role, 'content', m.content, 'created_at', m.created_at) ORDER BY m.sequence_number) as messages
FROM chats c
LEFT JOIN messages m ON m.chat_id = c.id
WHERE c.id = $1 AND c.user_id = $2
GROUP BY c.id;
```

### **Get Document Citations**

```sql
SELECT d.filename, dc.content, dc.section_title, mcc.similarity_score, mcc.rank_order
FROM message_context_chunks mcc
JOIN document_chunks dc ON dc.id = mcc.document_chunk_id
JOIN documents d ON d.id = mcc.document_id
WHERE mcc.message_id = $1 AND mcc.used_in_context = TRUE
ORDER BY mcc.rank_order;
```

---

## 📊 Storage Estimates

**Per User (Average):**

- 50 documents × 50KB = 2.5MB
- 2,500 chunks (50/doc) × 10KB = 25MB
- 20 chats × 100 messages × 2KB = 4MB
- **Total: ~32MB per active user**

**At Scale:**

- 1,000 users = ~32GB
- 10,000 users = ~320GB

---

## ✅ Setup Checklist

1. Enable extensions: `CREATE EXTENSION IF NOT EXISTS "vector";`
2. Run migrations in order (see `/supabase/migrations/`)
3. Apply RLS policies
4. Create functions and triggers
5. Test with sample data
6. Verify vector search performance

---

## 📝 Migration Files Order

1. `001_create_user_profiles.sql`
2. `002_create_documents.sql`
3. `003_create_document_chunks.sql`
4. `004_create_chats.sql`
5. `005_create_messages.sql`
6. `006_create_context_tracking.sql`
7. `007_create_usage_billing.sql`
8. `008_apply_rls_policies.sql`
9. `009_create_functions_triggers.sql`
