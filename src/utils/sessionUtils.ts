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
        // Check session validity when tab becomes visible
        const sessionInfo = sessionUtils.getSessionInfo();
        if (!sessionInfo.isValid) {
          sessionUtils.clearAllSessions();
          // Optionally redirect to login
          window.location.href = '/customer/login';
        }
      }
    });

    // Handle storage events (for multi-tab synchronization)
    window.addEventListener('storage', (e) => {
      if (e.key === 'supabase-session' && e.newValue === null) {
        // Session was cleared in another tab
        sessionUtils.clearAllSessions();
        window.location.href = '/customer/login';
      }
    });
  }
};

// Auto-setup session listeners when module is imported
if (typeof window !== 'undefined') {
  sessionUtils.setupSessionListeners();
}