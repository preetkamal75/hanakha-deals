import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, sendOTP, verifyOTP as verifyOTPAPI, sessionManager } from '../lib/supabase';
import { useNotification } from '../components/ui/NotificationProvider';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  userType: 'customer' | 'company' | 'admin';
  sponsorshipNumber?: string;
  parentId?: string;
  isVerified: boolean;
  hasActivePlan: boolean;
  mobileVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, userType: string) => Promise<void>;
  register: (userData: any, userType: string) => Promise<string>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  sendOTPToUser: (userId: string, contactInfo: string, otpType: 'email' | 'mobile') => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const notification = useNotification();

  useEffect(() => {
    // Initialize session from sessionStorage
    const initializeSession = async () => {
      try {
        // First try to restore session from sessionStorage
        const restoredSession = await sessionManager.restoreSession();
        
        if (restoredSession) {
          await fetchUserData(restoredSession.user.id);
        } else {
          // Check if there's a current session in Supabase
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // Save the session to sessionStorage
            sessionManager.saveSession(session);
            await fetchUserData(session.user.id);
          }
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Save session to sessionStorage
        sessionManager.saveSession(session);
        await fetchUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        // Remove session from sessionStorage
        sessionManager.removeSession();
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Update session in sessionStorage
        sessionManager.saveSession(session);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      console.log('🔍 Fetching user data for:', userId);
      // Try to get user data, but handle RLS gracefully
      let userData = null;
      try {
        const { data: userDataArray, error: userError } = await supabase
          .from('tbl_users')
          .select('*')
          .eq('tu_id', userId);

        if (userError) {
          console.log('⚠️ RLS blocking users table access:', userError.message);
          console.warn('RLS blocking users table access:', userError);
        } else if (userDataArray && userDataArray.length > 0) {
          userData = userDataArray[0];
        }
      } catch (relsError) {
        console.warn('RLS blocking users table:', relsError);
      }

      // Try to get profile data
      let profileData = null;
      try {
        const { data: profileDataArray } = await supabase
          .from('tbl_user_profiles')
          .select('*')
          .eq('tup_user_id', userId);
        console.log('📋 Profile data retrieved:', profileDataArray?.length || 0, 'records');
        profileData = profileDataArray?.[0];
      } catch (profileRlsError) {
        console.warn('RLS blocking user_profiles table:', profileRlsError);
      }

      // Try to get company data if user is a company
      let companyData = null;
      if (userData?.tu_user_type === 'company') {
        try {
          const { data: companyDataArray } = await supabase
            .from('tbl_companies')
            .select('*')
            .eq('tc_user_id', userId);
          console.log('🏢 Company data retrieved:', companyDataArray?.length || 0, 'records');
          companyData = companyDataArray?.[0];
        } catch (companyRlsError) {
          console.warn('RLS blocking companies table:', companyRlsError);
        }
      }

      // Try to check for active subscription
      let subscriptionData = null;
      try {
        const { data: subscriptionDataArray } = await supabase
          .from('tbl_user_subscriptions')
          .select('*')
          .eq('tus_user_id', userId)
          .eq('tus_status', 'active')
          .gte('tus_end_date', new Date().toISOString());
        console.log('💳 Subscription data retrieved:', subscriptionDataArray?.length || 0, 'records');
        subscriptionData = subscriptionDataArray?.[0];
      } catch (subscriptionRlsError) {
        console.warn('RLS blocking user_subscriptions table:', subscriptionRlsError);
      }

      // Get current session to get email
      const { data: { session } } = await supabase.auth.getSession();
      
      const user: User = {
        id: userId,
        email: session?.user?.email || userData?.tu_email || 'unknown@example.com',
        firstName: profileData?.tup_first_name,
        lastName: profileData?.tup_last_name,
        companyName: companyData?.tc_company_name,
        userType: userData?.tu_user_type || 'customer', // Default to customer if RLS blocks access
        sponsorshipNumber: profileData?.tup_sponsorship_number,
        parentId: profileData?.tup_parent_account,
        isVerified: userData?.tu_is_verified || false,
        hasActivePlan: true, // Set to true for demo mode to allow dashboard access
        mobileVerified: userData?.tu_mobile_verified || false
      };

      console.log('✅ User data compiled:', user);
      setUser(user);
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      console.error('Error fetching user data:', error);
      // Don't show error notification for RLS issues, just log them
      console.warn('Some user data may be incomplete due to RLS policies');
    }
  };

  const login = async (emailOrUsername: string, password: string, userType: string) => {
    try {
      console.log('🔍 Attempting production login for:', emailOrUsername);
      
      // Determine if input is email or username
      const isEmail = emailOrUsername.includes('@');
      let actualEmail = emailOrUsername;
      
      // If username provided, we need to get the email from user_profiles
      if (!isEmail) {
        const { data: profileData, error: profileError } = await supabase
          .from('tbl_user_profiles')
          .select('tup_user_id, tbl_users!inner(tu_email)')
          .eq('tup_username', emailOrUsername)
          .single();
        
        if (profileError || !profileData) {
          throw new Error('Username not found');
        }
        
        actualEmail = profileData.tbl_users.tu_email;
      }
      
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: actualEmail,
        password: password
      });
      
      if (authError) {
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error('Authentication failed');
      }
      
      // Fetch user data will be handled by the useEffect hook
      // Log login activity
      await supabase
        .from('tbl_user_activity_logs')
        .insert({
          tual_user_id: authData.user.id,
          tual_activity_type: 'login',
          tual_ip_address: 'unknown',
          tual_user_agent: navigator.userAgent,
          tual_login_time: new Date().toISOString()
        });
      
      notification.showSuccess('Login Successful!', 'Welcome back!');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Login failed';
      notification.showError('Login Failed', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: any, userType: string) => {
    try {
      console.log('🔍 Attempting production registration for:', userData.email);
      
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: undefined // Disable email confirmation for demo
        }
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        console.error('No user data returned from Supabase');
        throw new Error('Registration failed');
      }
      
      console.log('✅ Supabase auth successful, user ID:', authData.user.id);
      
      // Save session immediately if available
      if (authData.session) {
        console.log('💾 Saving session to sessionStorage');
        sessionManager.saveSession(authData.session);
      }
      
      // Use the appropriate registration function based on user type
      if (userType === 'customer') {
        console.log('📝 Registering customer profile...');
        const { error: regError } = await supabase.rpc('register_customer', {
          p_user_id: authData.user.id,
          p_email: userData.email,
          p_first_name: userData.firstName,
          p_last_name: userData.lastName,
          p_username: userData.userName,
          p_mobile: userData.mobile,
          p_gender: userData.gender,
          p_parent_account: userData.parentAccount
        });
        
        if (regError) {
          console.error('Customer registration error:', regError);
          throw new Error(regError.message);
        }
        console.log('✅ Customer profile created successfully');
      } else if (userType === 'company') {
        console.log('📝 Registering company profile...');
        const { error: regError } = await supabase.rpc('register_company', {
          p_user_id: authData.user.id,
          p_email: userData.email,
          p_company_name: userData.companyName,
          p_brand_name: userData.brandName,
          p_business_type: userData.businessType,
          p_business_category: userData.businessCategory,
          p_registration_number: userData.registrationNumber,
          p_gstin: userData.gstin,
          p_website_url: userData.websiteUrl,
          p_official_email: userData.officialEmail,
          p_affiliate_code: userData.affiliateCode
        });
        
        if (regError) {
          console.error('Company registration error:', regError);
          throw new Error(regError.message);
        }
        console.log('✅ Company profile created successfully');
      }
      
      // Log registration activity
      console.log('📊 Logging registration activity...');
      await supabase
        .from('tbl_user_activity_logs')
        .insert({
          tual_user_id: authData.user.id,
          tual_activity_type: 'registration',
          tual_ip_address: 'unknown',
          tual_user_agent: navigator.userAgent,
          tual_login_time: new Date().toISOString()
        });
      
      console.log('✅ Registration completed successfully');
      notification.showSuccess('Registration Successful!', 'Your account has been created successfully.');
      
      // Fetch user data immediately after successful registration
      if (authData.session) {
        await fetchUserData(authData.user.id);
      }

      return authData.user.id;

    } catch (error) {
      console.error('❌ Registration failed:', error);
      const errorMessage = error.message || 'Registration failed';
      notification.showError('Registration Failed', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    // Log logout activity before signing out
    if (user) {
      supabase
        .from('tbl_user_activity_logs')
        .insert({
          tual_user_id: user.id,
          tual_activity_type: 'logout',
          tual_ip_address: 'unknown',
          tual_user_agent: navigator.userAgent,
          tual_logout_time: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) console.warn('Failed to log logout activity:', error);
        });
    }
    
    // Remove session from sessionStorage
    sessionManager.removeSession();
    
    supabase.auth.signOut();
    setUser(null);
    notification.showInfo('Logged Out', 'You have been successfully logged out.');
  };

  const forgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      notification.showSuccess('Reset Email Sent', 'Please check your email for password reset instructions.');
    } catch (error) {
      notification.showError('Reset Failed', error.message || 'Failed to send reset email');
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      notification.showSuccess('Password Reset', 'Your password has been updated successfully.');
    } catch (error) {
      notification.showError('Reset Failed', error.message || 'Failed to reset password');
      throw error;
    }
  };

  const verifyOTP = async (otp: string) => {
    try {
      if (!user) {
        throw new Error('No user found');
      }
      
      console.log('🔍 Starting OTP verification for user:', user.id)
      const result = await verifyOTPAPI(user.id, otp, 'mobile');
      
      if (!result.success) {
        throw new Error(result.error || 'OTP verification failed');
      }
      
      console.log('✅ OTP verification successful')
      // Update user state
      setUser({ ...user, mobileVerified: true });
      notification.showSuccess('Verification Successful', 'Mobile number verified successfully.');
    } catch (error) {
      console.error('❌ OTP verification failed:', error)
      notification.showError('Verification Failed', error.message || 'Invalid OTP code');
      throw error;
    }
  };

  const sendOTPToUser = async (userId: string, contactInfo: string, otpType: 'email' | 'mobile') => {
    try {
      console.log('📤 Sending OTP to user:', { userId, contactInfo, otpType });
      const result = await sendOTP(userId, contactInfo, otpType);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send OTP');
      }
      
      console.log('✅ OTP sent successfully');
      notification.showSuccess('OTP Sent', `Verification code sent to ${contactInfo}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to send OTP:', error);
      notification.showError('Send Failed', error.message || 'Failed to send OTP');
      throw error;
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyOTP,
    sendOTPToUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};