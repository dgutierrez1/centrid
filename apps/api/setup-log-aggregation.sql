-- Supabase Edge Functions Log Aggregation Setup
-- Run this SQL in your Supabase SQL Editor to enable remote log access

-- Create function_logs table for storing structured logs
CREATE TABLE IF NOT EXISTS function_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  request_id TEXT,
  function_name TEXT,
  level TEXT,
  message TEXT,
  context JSONB,
  duration INTEGER,
  error JSONB,
  user_id TEXT,
  thread_id TEXT,
  project_id TEXT,
  -- Additional metadata for better filtering
  operation TEXT,
  step TEXT,
  environment TEXT DEFAULT 'production'
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_function_logs_created_at ON function_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_function_logs_request_id ON function_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_function_name ON function_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_logs_level ON function_logs(level);
CREATE INDEX IF NOT EXISTS idx_function_logs_user_id ON function_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_thread_id ON function_logs(thread_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_project_id ON function_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_function_logs_operation ON function_logs(operation);

-- Add comments for documentation
COMMENT ON TABLE function_logs IS 'Stores structured logs from Supabase Edge Functions for remote debugging';
COMMENT ON COLUMN function_logs.request_id IS 'Unique identifier for request correlation';
COMMENT ON COLUMN function_logs.function_name IS 'Name of the Edge Function that generated the log';
COMMENT ON COLUMN function_logs.level IS 'Log level: debug, info, warn, error';
COMMENT ON COLUMN function_logs.context IS 'Structured context data (JSON)';
COMMENT ON COLUMN function_logs.duration IS 'Operation duration in milliseconds';
COMMENT ON COLUMN function_logs.error IS 'Error details (JSON) when applicable';
COMMENT ON COLUMN function_logs.operation IS 'Business operation being performed';
COMMENT ON COLUMN function_logs.step IS 'Step within the operation';

-- Enable Row Level Security (RLS)
ALTER TABLE function_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for reading logs (only within same project)
CREATE POLICY "Users can view logs from their project" ON function_logs
  FOR SELECT USING (
    project_id = current_setting('app.current_project_id', true)
  );

-- Create policy for inserting logs (functions can write their own logs)
CREATE POLICY "Functions can insert logs" ON function_logs
  FOR INSERT WITH CHECK (
    project_id = current_setting('app.current_project_id', true)
  );

-- Create a function to get current project ID from JWT
CREATE OR REPLACE FUNCTION get_current_project_id()
RETURNS TEXT AS $$
BEGIN
  -- Extract project_id from JWT claims
  RETURN current_setting('request.jwt.claims', true)::json->>'project_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easier log querying
CREATE OR REPLACE VIEW function_logs_view AS
SELECT
  id,
  created_at,
  request_id,
  function_name,
  level,
  message,
  context,
  duration,
  error,
  user_id,
  thread_id,
  project_id,
  operation,
  step,
  environment
FROM function_logs
WHERE project_id = get_current_project_id();

-- Add sample data for testing (optional)
-- INSERT INTO function_logs (request_id, function_name, level, message, context, project_id)
-- VALUES (
--   'req-test-123',
--   'test-function',
--   'info',
--   'Sample log entry for testing',
--   '{"userId": "user-456", "operation": "test"}',
--   'your-project-id'
-- );

-- Cleanup function to remove old logs (optional)
-- Keeps only last 30 days of logs
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM function_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON function_logs TO authenticated;
GRANT SELECT ON function_logs TO anon;
GRANT SELECT ON function_logs_view TO authenticated;
GRANT SELECT ON function_logs_view TO anon;