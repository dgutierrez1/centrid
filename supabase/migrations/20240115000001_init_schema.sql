-- Centrid AI Filesystem - Initial Schema Migration
-- Version: 3.1 - Supabase Plus MVP Architecture
-- Date: 2024-01-15

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    usage_count INTEGER DEFAULT 0,
    subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
    subscription_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Events Table (for billing and analytics)
CREATE TABLE usage_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('ai_request', 'document_processing', 'text_search')),
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0,
    model_used TEXT,
    request_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents Table (MVP Simplified)
CREATE TABLE documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('markdown', 'text', 'pdf')),
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    content_text TEXT,
    search_vector tsvector,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document Chunks Table
CREATE TABLE document_chunks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    section_title TEXT,
    search_vector tsvector,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Requests Table
CREATE TABLE agent_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('create', 'edit', 'research')),
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    progress DECIMAL(3,2) DEFAULT 0.00,
    results JSONB DEFAULT '{}',
    context_documents UUID[] DEFAULT '{}',
    model_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Sessions Table (for multi-turn conversations)
CREATE TABLE agent_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_name TEXT,
    request_chain UUID[] DEFAULT '{}',
    context_state JSONB DEFAULT '{}',
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_requests_updated_at BEFORE UPDATE ON agent_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update search vectors
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'documents' THEN
        NEW.search_vector = to_tsvector('english', COALESCE(NEW.filename, '') || ' ' || COALESCE(NEW.content_text, ''));
    ELSIF TG_TABLE_NAME = 'document_chunks' THEN
        NEW.search_vector = to_tsvector('english', COALESCE(NEW.section_title, '') || ' ' || COALESCE(NEW.content, ''));
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for search vector updates
CREATE TRIGGER update_documents_search_vector BEFORE INSERT OR UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_document_chunks_search_vector BEFORE INSERT OR UPDATE ON document_chunks 
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, plan)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name', 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user data beyond auth.users';
COMMENT ON TABLE usage_events IS 'Tracking table for AI requests, tokens, and costs per user';
COMMENT ON TABLE documents IS 'File metadata with full-text search support';
COMMENT ON TABLE document_chunks IS 'Text segments for improved search and context retrieval';
COMMENT ON TABLE agent_requests IS 'AI agent execution tracking with progress and results';
COMMENT ON TABLE agent_sessions IS 'Multi-turn conversation management';
