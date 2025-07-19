import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { 
  Users, 
  Building, 
  CreditCard, 
  Settings,
  UserPlus,
  Shield,
  Activity,
  BarChart3,
  FileText,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Plus,
  Check,
  X
} from 'lucide-react';

interface SubAdmin {
  id: string;
  email: string;
  fullName: string;
  permissions: any;
  isActive: boolean;
  createdBy: string;
  lastLogin?: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const { admin, hasPermission, getSubAdmins, createSubAdmin, updateSubAdmin, deleteSubAdmin, resetSubAdminPassword } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdmin | null>(null);
  const [loading, setLoading] = useState(false);

  const [newSubAdmin, setNewSubAdmin] = useState({
    email: '',
    fullName: '',
    permissions: {
      users: { read: false, write: false, delete: false },
      companies: { read: false, write: false, delete: false },
      subscriptions: { read: false, write: false, delete: false },
      payments: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      admins: { read: false, write: false, delete: false },
      reports: { read: false, write: false, delete: false }
    }
  });

  useEffect(() => {
    if (activeTab === 'admins' && hasPermission('admins', 'read')) {
      loadSubAdmins();
    }
  }, [activeTab]);

  const loadSubAdmins = async () => {
    setLoading(true);
    try {
      const data = await getSubAdmins();
      setSubAdmins(data);
    } catch (error) {
      console.error('Failed to load sub-admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSubAdmin(newSubAdmin);
      setShowCreateModal(false);
      setNewSubAdmin({
        email: '',
        fullName: '',
        permissions: {
          users: { read: false, write: false, delete: false },
          companies: { read: false, write: false, delete: false },
          subscriptions: { read: false, write: false, delete: false },
          payments: { read: false, write: false, delete: false },
          settings: { read: false, write: false, delete: false },
          admins: { read: false, write: false, delete: false },
          reports: { read: false, write: false, delete: false }
        }
      });
      loadSubAdmins();
    } catch (error) {
      console.error('Failed to create sub-admin:', error);
    }
  };

  const handleResetPassword = async (subAdminId: string) => {
    if (confirm('Are you sure you want to reset this sub-admin\'s password?')) {
      try {
        await resetSubAdminPassword(subAdminId);
      } catch (error) {
        console.error('Failed to reset password:', error);
      }
    }
  };

  const handleDeleteSubAdmin = async (subAdminId: string) => {
    if (confirm('Are you sure you want to delete this sub-admin? This action cannot be undone.')) {
      try {
        await deleteSubAdmin(subAdminId);
        loadSubAdmins();
      } catch (error) {
        console.error('Failed to delete sub-admin:', error);
      }
    }
  };

  const updatePermission = (module: string, action: string, value: boolean) => {
    setNewSubAdmin(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: value
        }
      }
    }));
  };

  const stats = [
    {
      title: 'Total Users',
      value: '12,847',
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Companies',
      value: '234',
      icon: Building,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Active Plans',
      value: '3',
      icon: CreditCard,
      color: 'bg-purple-500',
      change: '+2'
    },
    {
      title: 'Monthly Revenue',
      value: '$45,230',
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3, permission: null },
    { id: 'users', label: 'Users', icon: Users, permission: 'users' },
    { id: 'companies', label: 'Companies', icon: Building, permission: 'companies' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, permission: 'subscriptions' },
    { id: 'payments', label: 'Payments', icon: DollarSign, permission: 'payments' },
    { id: 'admins', label: 'Sub-Admins', icon: Shield, permission: 'admins' },
    { id: 'settings', label: 'Settings', icon: Settings, permission: 'settings' }
  ];

  const visibleTabs = tabs.filter(tab => 
    !tab.permission || hasPermission(tab.permission as any, 'read')
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {admin?.fullName}! ({admin?.role === 'super_admin' ? 'Super Admin' : 'Sub Admin'})
              </p>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Admin Panel</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 overflow-x-auto">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Activity className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">New user registration</p>
                          <p className="text-xs text-gray-500">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">Payment received</p>
                          <p className="text-xs text-gray-500">5 minutes ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">System Status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Database</span>
                        <span className="text-sm text-green-600">Online</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium">Payment Gateway</span>
                        <span className="text-sm text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admins' && hasPermission('admins', 'read') && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Sub-Admin Management</h3>
                  {hasPermission('admins', 'write') && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Sub-Admin</span>
                    </button>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Admin Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subAdmins.map((subAdmin) => (
                        <tr key={subAdmin.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{subAdmin.fullName}</div>
                              <div className="text-sm text-gray-500">{subAdmin.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedSubAdmin(subAdmin);
                                setShowPermissionsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Permissions
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              subAdmin.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {subAdmin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {subAdmin.lastLogin 
                              ? new Date(subAdmin.lastLogin).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleResetPassword(subAdmin.id)}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Reset Password"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              {hasPermission('admins', 'delete') && (
                                <button
                                  onClick={() => handleDeleteSubAdmin(subAdmin.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Sub-Admin"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Other tabs content */}
            {activeTab !== 'overview' && activeTab !== 'admins' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {tabs.find(tab => tab.id === activeTab)?.label} Management
                </h3>
                <p className="text-gray-600">
                  {hasPermission(activeTab as any, 'read') 
                    ? `${tabs.find(tab => tab.id === activeTab)?.label} management interface will be displayed here.`
                    : 'You do not have permission to access this section.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Sub-Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Sub-Admin</h3>
            <form onSubmit={handleCreateSubAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={newSubAdmin.fullName}
                  onChange={(e) => setNewSubAdmin(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={newSubAdmin.email}
                  onChange={(e) => setNewSubAdmin(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Permissions</label>
                <div className="space-y-4">
                  {Object.keys(newSubAdmin.permissions).map((module) => (
                    <div key={module} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">{module}</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {['read', 'write', 'delete'].map((action) => (
                          <label key={action} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newSubAdmin.permissions[module][action]}
                              onChange={(e) => updatePermission(module, action, e.target.checked)}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="ml-2 text-sm text-gray-700 capitalize">{action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Create Sub-Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedSubAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              Permissions for {selectedSubAdmin.fullName}
            </h3>
            <div className="space-y-3">
              {Object.entries(selectedSubAdmin.permissions).map(([module, perms]: [string, any]) => (
                <div key={module} className="border border-gray-200 rounded-lg p-3">
                  <h4 className="font-medium text-gray-900 mb-2 capitalize">{module}</h4>
                  <div className="flex space-x-4 text-sm">
                    <span className={`flex items-center ${perms.read ? 'text-green-600' : 'text-gray-400'}`}>
                      {perms.read ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                      Read
                    </span>
                    <span className={`flex items-center ${perms.write ? 'text-green-600' : 'text-gray-400'}`}>
                      {perms.write ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                      Write
                    </span>
                    <span className={`flex items-center ${perms.delete ? 'text-green-600' : 'text-gray-400'}`}>
                      {perms.delete ? <Check className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                      Delete
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;