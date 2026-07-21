-- Password Reset System Migration
-- Migrated from database/migrations/password_reset_system.sql

-- Create password reset codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  reset_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '15 minutes'),
  used_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(reset_code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id ON password_reset_codes(user_id);

-- Enable RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reset codes" ON password_reset_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert reset codes" ON password_reset_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own reset codes" ON password_reset_codes
  FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON password_reset_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON password_reset_codes TO anon;

-- Create email queue table for custom SMTP
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email text NOT NULL,
  subject text NOT NULL,
  body_text text,
  body_html text,
  email_type text DEFAULT 'password_reset',
  status text DEFAULT 'pending', -- pending, sent, failed
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  error_message text,
  metadata jsonb
);

-- Create indexes for email queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_email_type ON email_queue(email_type);

-- Enable RLS for email queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email queue
CREATE POLICY "Service role can manage email queue" ON email_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can insert emails" ON email_queue
  FOR INSERT WITH CHECK (true);

-- Grant permissions on email queue
GRANT SELECT, INSERT, UPDATE ON email_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE ON email_queue TO anon;

-- Function to clean up expired reset codes
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_codes 
  WHERE expires_at < now() - interval '1 day';
END;
$$;

-- Function to clean up old email queue entries
CREATE OR REPLACE FUNCTION cleanup_old_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM email_queue 
  WHERE created_at < now() - interval '7 days'
  AND status IN ('sent', 'failed');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_reset_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_emails() TO authenticated;

-- Create a function to get user info for password reset
CREATE OR REPLACE FUNCTION get_user_for_reset(user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_info json;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name
  ) INTO user_info
  FROM profiles p
  WHERE p.email = user_email;
  
  RETURN user_info;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_for_reset(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_for_reset(text) TO anon;

-- Add comment to tables
COMMENT ON TABLE password_reset_codes IS 'Stores password reset codes for custom reset flow';
COMMENT ON TABLE email_queue IS 'Queue for emails to be sent via custom SMTP server';
