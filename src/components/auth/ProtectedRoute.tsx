import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sessionUtils } from '../../utils/sessionUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userType: 'customer' | 'company' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, userType }) => {
  const { user, loading } = useAuth();

  // Check session validity
  const sessionInfo = sessionUtils.getSessionInfo();
  if (!loading && !sessionInfo.isValid) {
    // Session is invalid, clear all sessions and redirect
    sessionUtils.clearAllSessions();
    return <Navigate to={`/${userType}/login`} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/${userType}/login`} replace />;
  }

  if (user.userType !== userType) {
    return <Navigate to="/" replace />;
  }

  // Check if customer needs to complete verification or payment
  if (userType === 'customer' && user.userType === 'customer') {
    // In demo mode, all users have active plans
    // No verification or payment checks needed
  }

  return <>{children}</>;
};

export default ProtectedRoute;