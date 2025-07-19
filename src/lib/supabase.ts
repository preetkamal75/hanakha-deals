import { createClient } from '@supabase/supabase-js'

// Use fallback values for demo purposes when environment variables are not available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'
console.log(supabaseUrl);
console.log(supabaseAnonKey);
// Only log in development
if (import.meta.env.DEV) {
  console.log('Environment check:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'Present' : 'Missing',
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'mlm-platform'
    }
  },
  db: {
    schema: 'public'
  }
})

// Custom session storage utilities
export const sessionManager = {
  // Save session to sessionStorage
  saveSession: (session: any) => {
    if (typeof window !== 'undefined' && session) {
      try {
        console.log('💾 Saving session to sessionStorage:', {
          user_id: session.user?.id,
          expires_at: session.expires_at,
          token_type: session.token_type
        });
        sessionStorage.setItem('supabase-session', JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: session.user
        }));
      } catch (error) {
        console.error('❌ Failed to save session to sessionStorage:', error);
        console.error('Failed to save session to sessionStorage:', error);
      }
    }
  },

  // Get session from sessionStorage
  getSession: () => {
    if (typeof window !== 'undefined') {
      try {
        const sessionData = sessionStorage.getItem('supabase-session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          // Check if session is expired
          if (session.expires_at && new Date(session.expires_at * 1000) > new Date()) {
            console.log('✅ Valid session found in sessionStorage');
            return session;
          } else {
            // Session expired, remove it
            console.log('⏰ Session expired, removing from sessionStorage');
            sessionManager.removeSession();
            return null;
          }
        }
      } catch (error) {
        console.error('❌ Failed to get session from sessionStorage:', error);
        console.error('Failed to get session from sessionStorage:', error);
        sessionManager.removeSession();
      }
    }
    console.log('❌ No valid session found in sessionStorage');
    return null;
  },

  // Remove session from sessionStorage
  removeSession: () => {
    if (typeof window !== 'undefined') {
      try {
        console.log('🗑️ Removing session from sessionStorage');
        sessionStorage.removeItem('supabase-session');
      } catch (error) {
        console.error('Failed to remove session from sessionStorage:', error);
      }
    }
  },

  // Check if session exists and is valid
  hasValidSession: () => {
    const session = sessionManager.getSession();
    return session !== null;
  },

  // Restore session to Supabase client
  restoreSession: async () => {
    const session = sessionManager.getSession();
    if (session) {
      try {
        console.log('🔄 Restoring session to Supabase client');
        // Set the session in Supabase client
        const { data, error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
        
        if (error) {
          console.error('❌ Failed to restore session:', error);
          console.error('Failed to restore session:', error);
          sessionManager.removeSession();
          return null;
        }
        
        console.log('✅ Session restored successfully');
        return data.session;
      } catch (error) {
        console.error('Failed to restore session:', error);
        sessionManager.removeSession();
        return null;
      }
    }
    return null;
  }
};

// Database types
export interface User {
  id: string
  email: string
  tu_user_type: 'customer' | 'company' | 'admin'
  tu_is_verified: boolean
  tu_email_verified: boolean
  tu_mobile_verified: boolean
  tu_is_active: boolean
  tu_created_at: string
  tu_updated_at: string
}

export interface UserProfile {
  id: string
  tup_user_id: string
  tup_first_name?: string
  tup_last_name?: string
  tup_username?: string
  tup_mobile?: string
  tup_gender?: string
  tup_sponsorship_number?: string
  tup_parent_account?: string
  tup_created_at: string
  tup_updated_at: string
}

export interface Company {
  id: string
  tc_user_id: string
  tc_company_name: string
  tc_brand_name?: string
  tc_business_type?: string
  tc_business_category?: string
  tc_registration_number: string
  tc_gstin: string
  tc_website_url?: string
  tc_official_email: string
  tc_affiliate_code?: string
  tc_verification_status: 'pending' | 'verified' | 'rejected'
  tc_created_at: string
  tc_updated_at: string
}

export interface SubscriptionPlan {
  id: string
  tsp_name: string
  tsp_description?: string
  tsp_price: number
  tsp_duration_days: number
  tsp_features: string[]
  tsp_is_active: boolean
  tsp_created_at: string
  tsp_updated_at: string
}

export interface MLMTreeNode {
  id: string
  tmt_user_id: string
  tmt_parent_id?: string
  tmt_left_child_id?: string
  tmt_right_child_id?: string
  tmt_level: number
  tmt_position: 'left' | 'right' | 'root'
  tmt_sponsorship_number: string
  tmt_is_active: boolean
  tmt_created_at: string
  tmt_updated_at: string
}

export interface OTPVerification {
  id: string
  tov_user_id: string
  tov_otp_code: string
  tov_otp_type: 'email' | 'mobile' | 'password_reset'
  tov_contact_info: string
  tov_is_verified: boolean
  tov_expires_at: string
  tov_attempts: number
  tov_created_at: string
}

// API functions
export const sendOTP = async (userId: string, contactInfo: string, otpType: 'email' | 'mobile') => {
  console.log('📤 Sending OTP via Supabase edge function:', { userId, contactInfo, otpType })
  
  const { data, error } = await supabase.functions.invoke('send-otp', {
    body: {
      user_id: userId,
      contact_info: contactInfo,
      otp_type: otpType
    }
  })

  if (error) {
    console.error('❌ Send OTP error:', error)
    throw error
  }
  
  console.log('✅ OTP sent successfully:', data)
  return data
}

export const verifyOTP = async (userId: string, otpCode: string, otpType: 'email' | 'mobile') => {
  console.log('🔍 Verifying OTP via Supabase edge function:', { userId, otpCode, otpType })
  
  const { data, error } = await supabase.functions.invoke('verify-otp', {
    body: {
      user_id: userId,
      otp_code: otpCode,
      otp_type: otpType
    }
  })

  if (error) {
    console.error('❌ Verify OTP error:', error)
    throw error
  }
  
  console.log('✅ OTP verified successfully:', data)
  return data
}

export const getSubscriptionPlans = async () => {
  const { data, error } = await supabase
    .from('tbl_subscription_plans')
    .select('*')
    .eq('tsp_is_active', true)
    .order('tsp_price')

  if (error) throw error
  return data
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('tbl_user_profiles')
    .select('*')
    .eq('tup_user_id', userId)
    .single()

  if (error) throw error
  return data
}

export const getMLMTreeNode = async (userId: string) => {
  const { data, error } = await supabase
    .from('tbl_mlm_tree')
    .select('*')
    .eq('tmt_user_id', userId)
    .single()

  if (error) throw error
  return data
}

export const getSystemSettings = async () => {
  const { data, error } = await supabase
    .from('tbl_system_settings')
    .select('*')

  if (error) throw error
  
  // Convert to key-value object
  const settings: Record<string, any> = {}
  data.forEach(setting => {
    settings[setting.tss_setting_key] = setting.tss_setting_value
  })
  
  return settings
}