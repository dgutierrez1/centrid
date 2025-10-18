-- Centrid AI Filesystem - Performance Indexes
-- Version: 3.1 - Supabase Plus MVP Architecture
-- Date: 2024-01-15

-- Full-Text Search Indexes (GIN indexes for fast text search)
-- Documents full-text search
CREATE INDEX CONCURRENTLY idx_documents_search_vector ON documents USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_documents_filename_search ON documents USING GIN(to_tsvector('english', filename));

-- Document chunks full-text search
CREATE INDEX CONCURRENTLY idx_document_chunks_search_vector ON document_chunks USING GIN(search_vector);
CREATE INDEX CONCURRENTLY idx_document_chunks_content_search ON document_chunks USING GIN(to_tsvector('english', content));

-- User-based Query Indexes (for RLS and data filtering)
-- User profile queries
CREATE INDEX CONCURRENTLY idx_user_profiles_user_id ON user_profiles(id);
CREATE INDEX CONCURRENTLY idx_user_profiles_plan ON user_profiles(plan);
CREATE INDEX CONCURRENTLY idx_user_profiles_subscription_status ON user_profiles(subscription_status);

-- Usage events for billing and analytics
CREATE INDEX CONCURRENTLY idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX CONCURRENTLY idx_usage_events_user_created ON usage_events(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_usage_events_event_type ON usage_events(event_type);
CREATE INDEX CONCURRENTLY idx_usage_events_monthly ON usage_events(user_id, event_type, created_at) 
    WHERE created_at >= date_trunc('month', NOW());

-- Document queries
CREATE INDEX CONCURRENTLY idx_documents_user_id ON documents(user_id);
CREATE INDEX CONCURRENTLY idx_documents_user_created ON documents(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_documents_user_type ON documents(user_id, file_type);
CREATE INDEX CONCURRENTLY idx_documents_processing_status ON documents(processing_status);
CREATE INDEX CONCURRENTLY idx_documents_user_status ON documents(user_id, processing_status);

-- Document chunks queries
CREATE INDEX CONCURRENTLY idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX CONCURRENTLY idx_document_chunks_document_chunk ON document_chunks(document_id, chunk_index);

-- Agent Request Indexes (for status tracking and performance)
-- Agent requests queries
CREATE INDEX CONCURRENTLY idx_agent_requests_user_id ON agent_requests(user_id);
CREATE INDEX CONCURRENTLY idx_agent_requests_user_created ON agent_requests(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_agent_requests_user_type ON agent_requests(user_id, agent_type);
CREATE INDEX CONCURRENTLY idx_agent_requests_status ON agent_requests(status);
CREATE INDEX CONCURRENTLY idx_agent_requests_user_status ON agent_requests(user_id, status);
CREATE INDEX CONCURRENTLY idx_agent_requests_session_id ON agent_requests(session_id);

-- Agent sessions queries
CREATE INDEX CONCURRENTLY idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX CONCURRENTLY idx_agent_sessions_user_activity ON agent_sessions(user_id, last_activity_at);

-- Time-based Indexes (for analytics and monitoring)
-- Created at indexes for time-based queries
CREATE INDEX CONCURRENTLY idx_documents_created_at ON documents(created_at);
CREATE INDEX CONCURRENTLY idx_agent_requests_created_at ON agent_requests(created_at);
CREATE INDEX CONCURRENTLY idx_usage_events_created_at ON usage_events(created_at);

-- Updated at indexes for change tracking
CREATE INDEX CONCURRENTLY idx_documents_updated_at ON documents(updated_at);
CREATE INDEX CONCURRENTLY idx_agent_requests_updated_at ON agent_requests(updated_at);

-- Composite Indexes for Complex Queries
-- Document search with user context
CREATE INDEX CONCURRENTLY idx_documents_user_search ON documents(user_id, file_type, processing_status);

-- Agent request performance tracking
CREATE INDEX CONCURRENTLY idx_agent_requests_performance ON agent_requests(user_id, agent_type, status, created_at);

-- Usage analytics queries
CREATE INDEX CONCURRENTLY idx_usage_analytics ON usage_events(user_id, event_type, created_at, tokens_used);

-- Session activity tracking
CREATE INDEX CONCURRENTLY idx_session_activity ON agent_sessions(user_id, last_activity_at, created_at);

-- JSON/JSONB Indexes (for metadata queries)
-- Document metadata queries
CREATE INDEX CONCURRENTLY idx_documents_metadata ON documents USING GIN(metadata);

-- Agent request results queries
CREATE INDEX CONCURRENTLY idx_agent_requests_results ON agent_requests USING GIN(results);

-- Agent session context queries
CREATE INDEX CONCURRENTLY idx_agent_sessions_context ON agent_sessions USING GIN(context_state);

-- Usage event metadata queries
CREATE INDEX CONCURRENTLY idx_usage_events_metadata ON usage_events USING GIN(metadata);

-- Specialized Indexes for Performance Optimization
-- Context document arrays (for agent requests)
CREATE INDEX CONCURRENTLY idx_agent_requests_context_docs ON agent_requests USING GIN(context_documents);

-- Request chain arrays (for agent sessions)
CREATE INDEX CONCURRENTLY idx_agent_sessions_request_chain ON agent_sessions USING GIN(request_chain);

-- Unique Constraints for Data Integrity
-- Ensure unique document chunks per document
CREATE UNIQUE INDEX CONCURRENTLY idx_document_chunks_unique ON document_chunks(document_id, chunk_index);

-- Ensure unique storage paths
CREATE UNIQUE INDEX CONCURRENTLY idx_documents_storage_path ON documents(storage_path);

-- Partial Indexes for Active Records (optimization)
-- Active documents only
CREATE INDEX CONCURRENTLY idx_documents_active ON documents(user_id, created_at) 
    WHERE processing_status = 'completed';

-- Recent agent requests (last 30 days)
CREATE INDEX CONCURRENTLY idx_agent_requests_recent ON agent_requests(user_id, status, created_at) 
    WHERE created_at >= NOW() - INTERVAL '30 days';

-- Active agent sessions (accessed in last 7 days)
CREATE INDEX CONCURRENTLY idx_agent_sessions_active ON agent_sessions(user_id, last_activity_at) 
    WHERE last_activity_at >= NOW() - INTERVAL '7 days';

-- Create statistics for query optimizer
-- Update statistics for better query planning
ANALYZE user_profiles;
ANALYZE usage_events;
ANALYZE documents;
ANALYZE document_chunks;
ANALYZE agent_requests;
ANALYZE agent_sessions;

-- Add comments for documentation
COMMENT ON INDEX idx_documents_search_vector IS 'GIN index for full-text search on documents';
COMMENT ON INDEX idx_document_chunks_search_vector IS 'GIN index for full-text search on document chunks';
COMMENT ON INDEX idx_usage_events_monthly IS 'Optimized index for monthly usage limit checks';
COMMENT ON INDEX idx_documents_user_search IS 'Composite index for user document searches';
COMMENT ON INDEX idx_agent_requests_performance IS 'Composite index for agent request performance tracking';
COMMENT ON INDEX idx_documents_active IS 'Partial index for completed documents only';
COMMENT ON INDEX idx_agent_requests_recent IS 'Partial index for recent agent requests';
COMMENT ON INDEX idx_agent_sessions_active IS 'Partial index for active sessions';
