# Centrid.ai Backend Architecture - Technical PRD

**Version**: 4.0 - MVP Backend (Aligned with COMPLETE-SYSTEM-REQUIREMENTS.md v2.0)  
**Date**: 2024-01-15  
**Status**: Ready for Implementation  
**Estimated Time**: 24 hours (Week 1)  
**Priority**: Critical Path - Simplified MVP Foundation  
**Key Changes**: WebSocket/SSE for real-time, Claude Sonnet only, PostgreSQL full-text search (no vectors), Mercado Pago billing

---

## 🎯 **ARCHITECTURE OVERVIEW**

### **Objective**

Define the **simplified MVP backend architecture** needed to fulfill core system requirements using Supabase Plus stack optimized for rapid launch with clear scale path.

### **Success Criteria**

- Support all agent execution workflows (Create, Edit, Research)
- Handle multi-format document processing with PostgreSQL full-text search
- Provide real-time progress updates for long-running AI operations
- Scale to 1,000+ concurrent users with <10 second agent response times
- Maintain 99.5% uptime with comprehensive monitoring

---

## 🏗️ **CORE ARCHITECTURE STACK**

### **Service Layer Architecture**

**Platform Foundation**: Supabase (Database + Auth + Storage + Edge Functions + Real-time)  
**Enhanced Tooling**: Zod validation + Valtio state + postgres.js for complex queries  
**Deployment**: Vercel frontend + Supabase backend

### **Application Layers**

1. **Presentation Layer**: Next.js PWA with real-time UI updates
2. **API Gateway Layer**: Supabase PostgREST + Custom Edge Functions
3. **Business Logic Layer**: AI Agent orchestration + Document processing
4. **Data Access Layer**: PostgreSQL + pgvector + Supabase Storage
5. **External Services Layer**: OpenAI API + Anthropic API + Mercado Pago

### **Core Services Architecture**

#### **Agent Execution Service**

- **Purpose**: Orchestrate Create, Edit, Research agent workflows
- **Technology**: Supabase Edge Functions (Deno runtime)
- **Responsibilities**: Request routing, context building, AI API integration, progress tracking
- **Performance**: Handle 15+ minute operations, global edge deployment

#### **Document Processing Service**

- **Purpose**: Multi-format file processing and embedding generation
- **Technology**: Supabase Edge Functions + Storage
- **Responsibilities**: File parsing, chunking, embedding generation, metadata extraction
- **Formats**: Markdown, Plain Text, PDF support

#### **Text Search Service (MVP - No Vector Search)**

- **Purpose**: Full-text search across user document collection
- **Technology**: PostgreSQL built-in full-text search ONLY (to_tsvector, to_tsquery)
- **Responsibilities**: Document content search, filename search, context retrieval for AI agents
- **Performance**: <300ms response times for text queries
- **Note**: NO vector embeddings, NO pgvector, NO semantic search in MVP

#### **Real-time Communication Service (MVP - WebSocket/SSE)**

- **Purpose**: Live progress updates for AI agent processing
- **Technology**: WebSocket or Server-Sent Events (SSE)
- **Responsibilities**: Real-time AI agent progress updates, document processing status
- **Architecture**: WebSocket/SSE connection for sub-second live updates (no polling)

#### **Authentication & Authorization Service**

- **Purpose**: User management and access control
- **Technology**: Supabase Auth + Row Level Security
- **Responsibilities**: Social login, session management, data access policies
- **Methods**: Google, Apple, GitHub OAuth + email/password

## 📋 **DATABASE SCHEMA DESIGN**

### **Core Data Models**

#### **User & Authentication Tables**

- **auth.users**: Managed by Supabase Auth (email, metadata, timestamps)
- **user_profiles**: Extended user data (name, plan, usage_count, subscription_status)
- **usage_events**: Tracking table for AI requests, tokens, costs per user

#### **Document Management Tables (MVP Simplified)**

- **documents**: File metadata (filename, type, size, processing_status, user_id, content_text, search_vector)
- **document_chunks**: Text segments (content, chunk_index, section_title, search_vector)

#### **AI Agent Tables**

- **agent_requests**: Agent execution tracking (type, content, status, progress, results, costs)
- **agent_sessions**: Multi-turn conversations (session_id, request_chain, context_state)

### **Database Relationships**

- **Users → Documents**: One-to-many with cascade delete
- **Documents → Chunks**: One-to-many with cascade delete
- **Users → Agent Requests**: One-to-many with cascade delete
- **Users → Usage Events**: One-to-many for billing/analytics

### **Security & Access Control**

#### **Row Level Security Policies**

- **Documents**: Users can only access their own documents
- **Agent Requests**: Users can only view/modify their own requests
- **Usage Events**: Users can only view their own usage data
- **Plan-based Limits**: Usage quotas enforced at database level

#### **Indexes & Performance**

- **Full-Text Search**: GIN indexes on search_vector columns for fast text search
- **User Queries**: Indexes on user_id across all tables
- **Status Lookups**: Indexes on processing_status and agent request status
- **Time-based Queries**: Indexes on created_at for analytics and billing

## 🔄 **KEY WORKFLOWS**

### **Document Processing Workflow**

1. **File Upload**: Client uploads to Supabase Storage via signed URL
2. **Processing Trigger**: Edge Function processes uploaded file
3. **Content Extraction**: Parse file format, extract text and structure
4. **Simple Chunking**: Break content into readable segments for search indexing
5. **Full-Text Indexing**: Generate PostgreSQL search vectors using to_tsvector
6. **Storage**: Store chunks with searchable text vectors in database
7. **Status Updates**: Real-time progress via Supabase subscriptions

### **AI Agent Request Workflow**

1. **Request Classification**: Determine agent type (Create/Edit/Research) and complexity
2. **Context Retrieval**: Full-text search across user's document collection
3. **Context Assembly**: Build context within token limits, include user patterns
4. **AI Processing**: Execute agent with appropriate model (GPT-4o, Claude, GPT-4o-mini)
5. **Quality Validation**: Validate response quality and format
6. **Preview Generation**: Create preview with source attribution and alternatives
7. **User Approval**: Present for user review, edit, and approval
8. **Application**: Apply approved changes to documents with version control

### **Real-time Synchronization Workflow**

1. **Change Detection**: Database triggers detect document/agent updates
2. **Event Broadcasting**: Supabase real-time broadcasts change events
3. **Client Updates**: Frontend receives events via subscriptions
4. **State Synchronization**: Valtio state updates trigger UI re-renders
5. **Conflict Resolution**: Last-write-wins with timestamp-based resolution

## 📁 **PROJECT STRUCTURE**

### **Backend/Edge Functions Structure**

```
supabase/
├── functions/
│   ├── process-document/         # File processing & text indexing
│   ├── execute-ai-agent/         # AI agent orchestration
│   ├── text-search/              # Full-text search operations
│   ├── billing-webhook/          # Mercado Pago webhook handling
│   └── sync-operations/          # Cross-device synchronization
├── migrations/
│   ├── 20240115000001_init_schema.sql
│   ├── 20240115000002_create_rls_policies.sql
│   └── 20240115000003_create_indexes.sql
└── config.toml                  # Supabase configuration
```

### **Frontend Application Structure**

```
src/
├── lib/
│   ├── supabase.ts              # Supabase client setup
│   ├── validation.ts            # Zod schemas
│   ├── state.ts                 # Valtio global state
│   └── queries.ts               # Enhanced query functions
├── components/
│   ├── agents/                  # AI agent interfaces
│   ├── documents/               # Document management
│   └── ui/                      # Shared UI components
├── pages/
│   ├── api/                     # API route handlers (if needed)
│   ├── auth/                    # Authentication pages
│   ├── dashboard/               # Main application
│   └── settings/                # User preferences
└── types/
    └── database.types.ts        # Auto-generated from Supabase
```

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **Development Environment**

- **Local Database**: Supabase local development with Docker
- **Edge Functions**: Local Deno runtime with hot reloading
- **Frontend**: Next.js development server with real-time client
- **External APIs**: Mock/sandbox environments for AI services

### **Staging Environment**

- **Database**: Supabase staging project with test data
- **Frontend**: Vercel preview deployments
- **Edge Functions**: Supabase staging functions
- **Testing**: Automated testing with realistic data loads

### **Production Environment**

- **Frontend**: Vercel production with global CDN
- **Database**: Supabase production with connection pooling
- **Edge Functions**: Global edge deployment across regions
- **Monitoring**: Built-in Supabase monitoring + Sentry error tracking

### **CI/CD Pipeline**

- **Code Quality**: ESLint, Prettier, TypeScript checks
- **Database**: Automated migrations with rollback capability
- **Testing**: Unit tests, integration tests, E2E testing
- **Deployment**: Automated deployment on merge to main branch

## 🔧 **EXTERNAL INTEGRATIONS**

### **AI Service Integration (MVP - Claude Only)**

- **Anthropic API**: Claude Sonnet ONLY for all AI agent operations (Create, Edit, Research)
- **NO OpenAI**: Simplified to single model for consistency and cost optimization
- **NO Embeddings**: No vector embeddings generation in MVP
- **Rate Limiting**: Basic retry logic with exponential backoff
- **Monitoring**: Simple token usage tracking per user/request

### **Payment & Billing Integration (MVP - Mercado Pago)**

- **Mercado Pago Suscripciones**: Subscription billing in colombia
- **Payment Methods**: Credit/debit cards via Mercado Pago (local Colombian methods as available)
- **Webhook Handling**: Secure webhook processing for subscription events
- **Usage Metering**: Real-time usage tracking with accurate request counting
- **Usage Limits**: Real-time enforcement of usage limits based on plan
- **Automated Billing**: Simple monthly billing with email receipts

### **Monitoring & Analytics Integration**

- **Supabase Analytics**: Built-in database and function monitoring
- **Vercel Analytics**: Frontend performance and user behavior
- **Sentry**: Error tracking and performance monitoring
- **Custom Metrics**: Business KPIs, conversion tracking, agent success rates

## 📊 **TECHNICAL REQUIREMENTS**

### **Performance Requirements**

- **API Response Time**: <300ms for standard queries, <10s for AI agent operations
- **Text Search**: <300ms for full-text queries across 10,000+ documents
- **Concurrent Users**: Support 1,000+ concurrent active users
- **Real-time Latency**: <100ms for live updates via Supabase subscriptions
- **File Processing**: Handle 10MB files with progress tracking

### **Scalability Requirements**

- **Database**: PostgreSQL with built-in full-text search, GIN indexing
- **Edge Functions**: Auto-scaling Deno runtime across global regions
- **Storage**: Supabase Storage with CDN for global file delivery
- **Connection Pooling**: Built-in Supabase connection management
- **Caching**: Multi-level caching (browser, CDN, database query cache)

### **Security Requirements**

- **Authentication**: Supabase Auth with social logins + email/password
- **Authorization**: Database-level Row Level Security (RLS) policies
- **Data Protection**: AES-256 encryption at rest, TLS 1.3 in transit
- **Input Validation**: Zod schemas for runtime type safety
- **File Security**: Type validation, size limits, secure signed URLs

### **Mobile & PWA Requirements**

- **Offline Support**: Service worker with background sync capabilities
- **Real-time Sync**: Cross-device synchronization with conflict resolution
- **Touch Optimization**: Mobile-first interface with gesture support
- **Performance**: <3 second initial load, 60fps interactions
- **Battery Efficiency**: Event-driven updates vs polling

## ⚙️ **TECHNICAL DECISIONS**

### **Technology Stack Rationale**

#### **Supabase Plus Architecture Selection**

- **Database**: PostgreSQL with built-in full-text search for fast document queries
- **Real-time**: Built-in subscriptions eliminate WebSocket server management
- **Authentication**: Zero-configuration social logins and session management
- **Edge Functions**: Unlimited execution time for complex AI operations
- **Global Distribution**: Automatic worldwide deployment without configuration

#### **Enhanced Tooling Selection**

- **Type Safety**: Auto-generated types + Zod runtime validation prevent bugs
- **State Management**: Valtio provides reactive state with minimal boilerplate
- **Query Enhancement**: postgres.js enables complex operations when needed
- **Bundle Optimization**: ~120KB total vs 400KB+ traditional stacks

#### **AI Integration Architecture**

- **Multi-Model**: GPT-4o for general tasks, Claude for analysis, GPT-4o-mini for speed
- **Context Management**: 6000 token limit with intelligent relevance filtering
- **Real-time Progress**: Sub-second updates for long-running operations
- **Cost Optimization**: Model selection based on complexity and user preferences

### **Scalability Strategy**

- **MVP**: Single Supabase instance handles 1,000+ concurrent users
- **Growth**: Built-in auto-scaling, connection pooling, global edge deployment
- **Enterprise**: No rewrites needed - all tools scale naturally
- **Migration Path**: Enhanced tooling layers on top of Supabase foundation

---

## 📊 **SUCCESS CRITERIA**

### **Technical Performance**

- **API Response Time**: <300ms for standard queries, <10s for AI operations
- **Text Search Performance**: <300ms for full-text queries across 10,000+ documents
- **Real-time Latency**: <100ms for live progress updates
- **Uptime**: 99.5% availability with automatic failover
- **Scalability**: Support 1,000+ concurrent users without performance degradation

### **Business Requirements Fulfillment**

- **Agent Execution**: Support all agent types (Create, Edit, Research) with 85%+ user approval
- **Document Processing**: Handle all required formats (Markdown, Text, PDF) up to 10MB
- **Multi-format Support**: Process and search across all document types seamlessly
- **Real-time Updates**: Live progress for all long-running operations
- **Cross-platform**: 90% code sharing between web and mobile platforms

### **Security & Compliance**

- **Data Protection**: AES-256 encryption, GDPR compliance, secure file handling
- **Authentication**: Support all required methods (Google, Apple, GitHub, email/password)
- **Authorization**: Database-level access control with Row Level Security
- **Usage Control**: Real-time quota enforcement and billing integration

---

**This backend architecture provides the foundation to fulfill all system requirements for Centrid - delivering a mobile-first AI agent workspace with enterprise-grade security and performance.**
