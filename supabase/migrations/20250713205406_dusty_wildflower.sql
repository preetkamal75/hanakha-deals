/*
  # Add User Activity Logs Table

  1. New Tables
    - `user_activity_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `activity_type` (text) - login, logout, registration, etc.
      - `ip_address` (text) - user's IP address
      - `user_agent` (text) - browser/device info
      - `login_time` (timestamptz) - when user logged in
      - `logout_time` (timestamptz) - when user logged out
      - `session_duration` (interval) - calculated session length
      - `created_at` (timestamptz) - record creation time

  2. Security
    - Enable RLS on `user_activity_logs` table
    - Add policy for users to read their own activity logs
    - Add policy for admins to read all activity logs

  3. Indexes
    - Index on user_id for fast lookups
    - Index on activity_type for filtering
    - Index on login_time for date range queries
*/

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('login', 'logout', 'registration', 'password_reset', 'profile_update')),
  ip_address text,
  user_agent text,
  login_time timestamptz,
  logout_time timestamptz,
  session_duration interval GENERATED ALWAYS AS (logout_time - login_time) STORED,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_login_time ON user_activity_logs(login_time);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);

-- RLS Policies
CREATE POLICY "Users can read own activity logs"
  ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all activity logs"
  ON user_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );