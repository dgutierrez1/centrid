-- Centrid AI Filesystem - Row Level Security Policies
-- Version: 3.1 - Supabase Plus MVP Architecture
-- Date: 2024-01-15

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Usage Events Policies
-- Users can only view their own usage data
CREATE POLICY "Users can view own usage events" ON usage_events
    FOR SELECT USING (auth.uid() = user_id);

-- Insert usage events (system/service account only via service role)
CREATE POLICY "Service role can insert usage events" ON usage_events
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Documents Policies
-- Users can manage their own documents
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (auth.uid() = user_id);

-- Document Chunks Policies
-- Users can access chunks of their own documents
CREATE POLICY "Users can view chunks of own documents" ON document_chunks
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM documents WHERE id = document_chunks.document_id
        )
    );

CREATE POLICY "Users can insert chunks for own documents" ON document_chunks
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM documents WHERE id = document_chunks.document_id
        )
    );

CREATE POLICY "Users can update chunks of own documents" ON document_chunks
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM documents WHERE id = document_chunks.document_id
        )
    );

CREATE POLICY "Users can delete chunks of own documents" ON document_chunks
    FOR DELETE USING (
        auth.uid() IN (
            SELECT user_id FROM documents WHERE id = document_chunks.document_id
        )
    );

-- Agent Requests Policies
-- Users can manage their own agent requests
CREATE POLICY "Users can view own agent requests" ON agent_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent requests" ON agent_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent requests" ON agent_requests
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent requests" ON agent_requests
    FOR DELETE USING (auth.uid() = user_id);

-- Service role can update agent requests (for backend processing)
CREATE POLICY "Service role can update agent requests" ON agent_requests
    FOR UPDATE USING (auth.role() = 'service_role');

-- Agent Sessions Policies  
-- Users can manage their own agent sessions
CREATE POLICY "Users can view own agent sessions" ON agent_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent sessions" ON agent_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent sessions" ON agent_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent sessions" ON agent_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Plan-based Usage Limits Function
-- Check if user has exceeded their plan limits
CREATE OR REPLACE FUNCTION check_usage_limits(user_id UUID, request_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_plan TEXT;
    monthly_usage INTEGER;
    plan_limit INTEGER;
BEGIN
    -- Get user's current plan
    SELECT plan INTO user_plan FROM user_profiles WHERE id = user_id;
    
    -- Get current month's usage
    SELECT COUNT(*) INTO monthly_usage 
    FROM usage_events 
    WHERE user_id = user_id 
    AND event_type = request_type
    AND created_at >= date_trunc('month', NOW());
    
    -- Set limits based on plan
    CASE user_plan
        WHEN 'free' THEN plan_limit := 100;
        WHEN 'pro' THEN plan_limit := 1000;
        WHEN 'enterprise' THEN plan_limit := 10000;
        ELSE plan_limit := 100;
    END CASE;
    
    RETURN monthly_usage < plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage Limit Enforcement Policy
-- Prevent new agent requests if user has exceeded limits
CREATE POLICY "Enforce usage limits on agent requests" ON agent_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        check_usage_limits(auth.uid(), 'ai_request')
    );

-- Create helper functions for RLS policies
-- Function to check if user owns document
CREATE OR REPLACE FUNCTION user_owns_document(doc_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM documents 
        WHERE id = doc_id AND documents.user_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's document IDs (for complex queries)
CREATE OR REPLACE FUNCTION get_user_document_ids(user_id UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT id FROM documents WHERE documents.user_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions for functions
GRANT EXECUTE ON FUNCTION check_usage_limits(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_document(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_document_ids(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "Users can view own profile" ON user_profiles IS 'Users can only access their own profile data';
COMMENT ON POLICY "Users can view own documents" ON documents IS 'Users can only access documents they own';
COMMENT ON POLICY "Users can view chunks of own documents" ON document_chunks IS 'Users can only access chunks from their own documents';
COMMENT ON POLICY "Users can view own agent requests" ON agent_requests IS 'Users can only access their own AI agent requests';
COMMENT ON POLICY "Enforce usage limits on agent requests" ON agent_requests IS 'Prevent users from exceeding their plan limits';
COMMENT ON FUNCTION check_usage_limits(UUID, TEXT) IS 'Check if user has exceeded their monthly plan limits';
