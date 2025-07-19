/*
  # Optimize Registration Performance

  1. Database Optimizations
    - Add indexes for faster lookups
    - Optimize RLS policies
    - Add database functions for atomic operations

  2. Performance Improvements
    - Faster username/email checks
    - Optimized user creation process
*/

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optimize RLS policies for better performance
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create function for atomic user registration
CREATE OR REPLACE FUNCTION register_customer(
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_username text,
  p_mobile text,
  p_gender text,
  p_parent_account text
) RETURNS void AS $$
BEGIN
  -- Insert user record
  INSERT INTO users (id, email, user_type)
  VALUES (p_user_id, p_email, 'customer');
  
  -- Insert profile record
  INSERT INTO user_profiles (
    user_id, first_name, last_name, username, 
    mobile, gender, parent_account
  ) VALUES (
    p_user_id, p_first_name, p_last_name, p_username,
    p_mobile, p_gender, p_parent_account
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for atomic company registration
CREATE OR REPLACE FUNCTION register_company(
  p_user_id uuid,
  p_email text,
  p_company_name text,
  p_brand_name text,
  p_business_type text,
  p_business_category text,
  p_registration_number text,
  p_gstin text,
  p_website_url text,
  p_official_email text,
  p_affiliate_code text
) RETURNS void AS $$
BEGIN
  -- Insert user record
  INSERT INTO users (id, email, user_type)
  VALUES (p_user_id, p_email, 'company');
  
  -- Insert company record
  INSERT INTO companies (
    user_id, company_name, brand_name, business_type,
    business_category, registration_number, gstin,
    website_url, official_email, affiliate_code
  ) VALUES (
    p_user_id, p_company_name, p_brand_name, p_business_type,
    p_business_category, p_registration_number, p_gstin,
    p_website_url, p_official_email, p_affiliate_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_customer TO authenticated;
GRANT EXECUTE ON FUNCTION register_company TO authenticated;