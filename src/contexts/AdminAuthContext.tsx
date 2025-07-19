import React, { createContext, useContext, useState, useEffect } from 'react';
import { sessionManager } from '../lib/supabase';
import { useNotification } from '../components/ui/NotificationProvider';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'sub_admin';
  permissions: {
    users: { read: boolean; write: boolean; delete: boolean };
    companies: { read: boolean; write: boolean; delete: boolean };
    subscriptions: { read: boolean; write: boolean; delete: boolean };
    payments: { read: boolean; write: boolean; delete: boolean };
    settings: { read: boolean; write: boolean; delete: boolean };
    admins: { read: boolean; write: boolean; delete: boolean };
    reports: { read: boolean; write: boolean; delete: boolean };
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface SubAdmin {
  id: string;
  email: string;
  fullName: string;
  permissions: AdminUser['permissions'];
  isActive: boolean;
  createdBy: string;
  lastLogin?: string;
  createdAt: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  createSubAdmin: (data: {
    email: string;
    fullName: string;
    permissions: AdminUser['permissions'];
  }) => Promise<void>;
  updateSubAdmin: (id: string, data: Partial<SubAdmin>) => Promise<void>;
  deleteSubAdmin: (id: string) => Promise<void>;
  resetSubAdminPassword: (id: string) => Promise<string>;
  getSubAdmins: () => Promise<SubAdmin[]>;
  hasPermission: (module: keyof AdminUser['permissions'], action: 'read' | 'write' | 'delete') => boolean;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const notification = useNotification();

  useEffect(() => {
    // Check for existing admin session in sessionStorage
    const sessionToken = sessionStorage.getItem('admin_session_token');
    if (sessionToken) {
      validateSession(sessionToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateSession = async (sessionToken: string) => {
    try {
      // In demo mode, create a mock admin user
      const mockAdmin: AdminUser = {
        id: 'admin-1',
        email: 'admin@mlmplatform.com',
        fullName: 'Super Administrator',
        role: 'super_admin',
        permissions: {
          users: { read: true, write: true, delete: true },
          companies: { read: true, write: true, delete: true },
          subscriptions: { read: true, write: true, delete: true },
          payments: { read: true, write: true, delete: true },
          settings: { read: true, write: true, delete: true },
          admins: { read: true, write: true, delete: true },
          reports: { read: true, write: true, delete: true }
        },
        isActive: true,
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      setAdmin(mockAdmin);
    } catch (error) {
      sessionStorage.removeItem('admin_session_token');
      console.error('Session validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Demo mode login
      if (email === 'admin@mlmplatform.com' && password === 'Admin@123456') {
        const sessionToken = 'demo-admin-session-' + Date.now();
        sessionStorage.setItem('admin_session_token', sessionToken);
        
        const mockAdmin: AdminUser = {
          id: 'admin-1',
          email: 'admin@mlmplatform.com',
          fullName: 'Super Administrator',
          role: 'super_admin',
          permissions: {
            users: { read: true, write: true, delete: true },
            companies: { read: true, write: true, delete: true },
            subscriptions: { read: true, write: true, delete: true },
            payments: { read: true, write: true, delete: true },
            settings: { read: true, write: true, delete: true },
            admins: { read: true, write: true, delete: true },
            reports: { read: true, write: true, delete: true }
          },
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        setAdmin(mockAdmin);
        notification.showSuccess('Welcome Back!', 'Successfully logged into admin panel.');
        return;
      }
      
      throw new Error('Invalid credentials');
    } catch (error) {
      notification.showError('Login Failed', error.message || 'Invalid email or password');
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('admin_session_token');
    setAdmin(null);
    notification.showInfo('Logged Out', 'Successfully logged out of admin panel.');
  };

  const createSubAdmin = async (data: {
    email: string;
    fullName: string;
    permissions: AdminUser['permissions'];
  }) => {
    try {
      // Generate temporary password
      const tempPassword = generateTempPassword();
      
      // In demo mode, simulate creation
      const newSubAdmin = {
        id: 'sub-admin-' + Date.now(),
        ...data,
        role: 'sub_admin' as const,
        isActive: true,
        createdBy: admin!.id,
        createdAt: new Date().toISOString()
      };
      
      // Simulate sending email with credentials
      console.log('Email would be sent to:', data.email);
      console.log('Temporary password:', tempPassword);
      
      notification.showSuccess(
        'Sub-Admin Created', 
        `Sub-admin created successfully. Login credentials have been sent to ${data.email}`
      );
    } catch (error) {
      notification.showError('Creation Failed', error.message || 'Failed to create sub-admin');
      throw error;
    }
  };

  const updateSubAdmin = async (id: string, data: Partial<SubAdmin>) => {
    try {
      // In demo mode, simulate update
      notification.showSuccess('Sub-Admin Updated', 'Sub-admin details updated successfully.');
    } catch (error) {
      notification.showError('Update Failed', error.message || 'Failed to update sub-admin');
      throw error;
    }
  };

  const deleteSubAdmin = async (id: string) => {
    try {
      // In demo mode, simulate deletion
      notification.showSuccess('Sub-Admin Deleted', 'Sub-admin deleted successfully.');
    } catch (error) {
      notification.showError('Deletion Failed', error.message || 'Failed to delete sub-admin');
      throw error;
    }
  };

  const resetSubAdminPassword = async (id: string): Promise<string> => {
    try {
      const newPassword = generateTempPassword();
      // In demo mode, simulate password reset
      notification.showSuccess(
        'Password Reset', 
        'New password has been sent to the sub-admin\'s email address.'
      );
      return newPassword;
    } catch (error) {
      notification.showError('Reset Failed', error.message || 'Failed to reset password');
      throw error;
    }
  };

  const getSubAdmins = async (): Promise<SubAdmin[]> => {
    try {
      // In demo mode, return mock sub-admins
      return [
        {
          id: 'sub-admin-1',
          email: 'john@mlmplatform.com',
          fullName: 'John Manager',
          permissions: {
            users: { read: true, write: true, delete: false },
            companies: { read: true, write: false, delete: false },
            subscriptions: { read: true, write: false, delete: false },
            payments: { read: true, write: false, delete: false },
            settings: { read: false, write: false, delete: false },
            admins: { read: false, write: false, delete: false },
            reports: { read: true, write: false, delete: false }
          },
          isActive: true,
          createdBy: admin!.id,
          lastLogin: new Date(Date.now() - 86400000).toISOString(),
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
        },
        {
          id: 'sub-admin-2',
          email: 'sarah@mlmplatform.com',
          fullName: 'Sarah Support',
          permissions: {
            users: { read: true, write: false, delete: false },
            companies: { read: true, write: false, delete: false },
            subscriptions: { read: true, write: false, delete: false },
            payments: { read: true, write: false, delete: false },
            settings: { read: false, write: false, delete: false },
            admins: { read: false, write: false, delete: false },
            reports: { read: true, write: false, delete: false }
          },
          isActive: true,
          createdBy: admin!.id,
          lastLogin: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
        }
      ];
    } catch (error) {
      notification.showError('Fetch Failed', 'Failed to fetch sub-admins');
      return [];
    }
  };

  const hasPermission = (module: keyof AdminUser['permissions'], action: 'read' | 'write' | 'delete'): boolean => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    return admin.permissions[module][action];
  };

  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const value = {
    admin,
    login,
    logout,
    createSubAdmin,
    updateSubAdmin,
    deleteSubAdmin,
    resetSubAdminPassword,
    getSubAdmins,
    hasPermission,
    loading
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};