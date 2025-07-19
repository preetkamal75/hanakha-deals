// Session utility functions for enhanced session management
import { sessionManager } from '../lib/supabase';

export interface SessionInfo {
  isValid: boolean;
  expiresAt?: number;
  timeRemaining?: number;
  user?: any;
}

export const sessionUtils = {
  // Get detailed session information
  getSessionInfo: (): SessionInfo => {
    const session = sessionManager.getSession();
    
    if (!session) {
      return { isValid: false };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const timeRemaining = expiresAt - now;

    return {
      isValid: timeRemaining > 0,
      expiresAt,
      timeRemaining,
      user: session.user
    };
  },

  // Check if session will expire soon (within 5 minutes)
  isSessionExpiringSoon: (): boolean => {
    const sessionInfo = sessionUtils.getSessionInfo();
    if (!sessionInfo.isValid || !sessionInfo.timeRemaining) {
      return false;
    }
    
    // Check if expires within 5 minutes (300 seconds)
    return sessionInfo.timeRemaining <= 300;
  },

  // Format time remaining in human readable format
  formatTimeRemaining: (seconds: number): string => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  },

  // Clear all session data (both Supabase and admin)
  clearAllSessions: () => {
    sessionManager.removeSession();
    sessionStorage.removeItem('admin_session_token');
  },

  // Check if current page is a login page
  isOnLoginPage: (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return path.includes('/login') || path.includes('/register') || path.includes('/forgot-password') || path.includes('/reset-password');
  },

  // Check if current page is admin area
  isInAdminArea: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/backpanel');
  },

  // Session event listeners for tab/window events
  setupSessionListeners: () => {
    // Clear session when tab/window is closed
    window.addEventListener('beforeunload', () => {
      // Optional: You might want to keep this for better UX
      // sessionUtils.clearAllSessions();
    });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Only check session if not on login pages
        if (!sessionUtils.isOnLoginPage()) {
          // Check session validity when tab becomes visible
          const sessionInfo = sessionUtils.getSessionInfo();
          const adminSessionToken = sessionStorage.getItem('admin_session_token');
          
          // For admin area, check admin session
          if (sessionUtils.isInAdminArea()) {
            if (!adminSessionToken) {
              // Only redirect if not already on admin login page
              if (window.location.pathname !== '/backpanel/login') {
                window.location.href = '/backpanel/login';
              }
            }
          } else {
            // For customer area, check Supabase session
            if (!sessionInfo.isValid) {
              // Only clear sessions and redirect if user was actually logged in before
              // and not on a public page
              const isPublicPage = ['/', '/about', '/contact', '/faq', '/policies', '/join-customer', '/join-company', '/subscription-plans'].includes(window.location.pathname);
              
              if (!isPublicPage) {
                sessionUtils.clearAllSessions();
                window.location.href = '/customer/login';
              }
            }
          }
        }
      }
    });

    // Handle storage events (for multi-tab synchronization)
    window.addEventListener('storage', (e) => {
      if (e.key === 'supabase-session' && e.newValue === null && !sessionUtils.isOnLoginPage()) {
        // Session was cleared in another tab, only redirect if not on login page
        if (!sessionUtils.isInAdminArea()) {
          sessionUtils.clearAllSessions();
          const isPublicPage = ['/', '/about', '/contact', '/faq', '/policies', '/join-customer', '/join-company', '/subscription-plans'].includes(window.location.pathname);
          if (!isPublicPage) {
            window.location.href = '/customer/login';
          }
        }
      }
      
      if (e.key === 'admin_session_token' && e.newValue === null && sessionUtils.isInAdminArea() && !sessionUtils.isOnLoginPage()) {
        // Admin session was cleared in another tab
        if (window.location.pathname !== '/backpanel/login') {
          window.location.href = '/backpanel/login';
        }
      }
    });
  }
};

// Auto-setup session listeners when module is imported
if (typeof window !== 'undefined') {
  sessionUtils.setupSessionListeners();
}