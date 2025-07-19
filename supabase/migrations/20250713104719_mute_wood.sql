/*
  # Initial MLM Platform Database Schema

  1. New Tables
    - `users` - Main user authentication and basic info
    - `user_profiles` - Extended customer profile information  
    - `companies` - Company registration details
    - `mlm_tree` - Binary tree structure for MLM network
    - `subscription_plans` - Available subscription plans
    - `user_subscriptions` - User subscription records
    - `payments` - Payment transaction history
    - `otp_verifications` - OTP verification system
    - `system_settings` - Platform configuration settings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure admin-only access for system settings

  3. Functions
    - Auto-generate sponsorship numbers
    - Binary tree placement algorithm
    - OTP generation and validation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('customer', 'company', 'admin')),
  is_verified boolean DEFAULT false,
  email_verified boolean DEFAULT false,
  mobile_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  username text UNIQUE,
  mobile text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  sponsorship_number text UNIQUE,
  parent_account text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  brand_name text,
  business_type text,
  business_category text,
  registration_number text NOT NULL,
  gstin text NOT NULL,
  website_url text,
  official_email text NOT NULL,
  affiliate_code text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MLM Tree structure
CREATE TABLE IF NOT EXISTS mlm_tree (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES mlm_tree(id),
  left_child_id uuid REFERENCES mlm_tree(id),
  right_child_id uuid REFERENCES mlm_tree(id),
  level integer DEFAULT 0,
  position text CHECK (position IN ('left', 'right', 'root')),
  sponsorship_number text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  duration_days integer NOT NULL,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  payment_amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_subscriptions(id),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  gateway_response jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- OTP verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  otp_code text NOT NULL,
  otp_type text NOT NULL CHECK (otp_type IN ('email', 'mobile', 'password_reset')),
  contact_info text NOT NULL,
  is_verified boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  attempts integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mlm_tree ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_profiles table
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for companies table
CREATE POLICY "Companies can read own data" ON companies
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can update own data" ON companies
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Companies can insert own data" ON companies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscription_plans table
CREATE POLICY "Anyone can read active plans" ON subscription_plans
  FOR SELECT TO authenticated
  USING (is_active = true);

-- RLS Policies for user_subscriptions table
CREATE POLICY "Users can read own subscriptions" ON user_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for payments table
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for otp_verifications table
CREATE POLICY "Users can read own OTP" ON otp_verifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OTP" ON otp_verifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OTP" ON otp_verifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate sponsorship numbers
CREATE OR REPLACE FUNCTION generate_sponsorship_number()
RETURNS text AS $$
DECLARE
  new_number text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate a random 8-digit number
    new_number := 'SP' || LPAD(floor(random() * 100000000)::text, 8, '0');
    
    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE sponsorship_number = new_number) INTO exists_check;
    
    -- If it doesn't exist, we can use it
    IF NOT exists_check THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate sponsorship number on profile insert
CREATE OR REPLACE FUNCTION auto_generate_sponsorship_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.sponsorship_number IS NULL THEN
    NEW.sponsorship_number := generate_sponsorship_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating sponsorship numbers
CREATE TRIGGER trigger_auto_sponsorship_number
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_sponsorship_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, duration_days, features, is_active) VALUES
('Basic Plan', 'Perfect for getting started with MLM', 99.00, 30, '["MLM Tree Access", "Basic Dashboard", "Email Support", "Mobile App Access"]', true),
('Premium Plan', 'Advanced features for serious networkers', 199.00, 30, '["MLM Tree Access", "Advanced Dashboard", "Priority Support", "Analytics & Reports", "Mobile App Access", "Marketing Tools"]', true),
('Enterprise Plan', 'Complete solution for MLM professionals', 399.00, 30, '["MLM Tree Access", "Enterprise Dashboard", "24/7 Support", "Advanced Analytics", "Mobile App Access", "Marketing Tools", "Custom Branding", "API Access"]', true)
ON CONFLICT DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', '"MLM Platform"', 'Website name'),
('logo_url', '"https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"', 'Logo URL'),
('email_verification_required', 'true', 'Require email verification'),
('mobile_verification_required', 'true', 'Require mobile verification'),
('referral_mandatory', 'false', 'Make referral mandatory'),
('sms_gateway_provider', '"twilio"', 'SMS gateway provider'),
('sms_gateway_account_sid', '"ACtest123456789"', 'SMS gateway account SID'),
('sms_gateway_auth_token', '"test_auth_token_123"', 'SMS gateway auth token'),
('sms_gateway_from_number', '"+15005550006"', 'SMS gateway from number'),
('smtp_host', '"smtp.mailtrap.io"', 'SMTP host'),
('smtp_port', '2525', 'SMTP port'),
('smtp_username', '"test_username"', 'SMTP username'),
('smtp_password', '"test_password"', 'SMTP password'),
('smtp_encryption', '"tls"', 'SMTP encryption')
ON CONFLICT (setting_key) DO NOTHING;