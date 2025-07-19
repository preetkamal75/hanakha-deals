import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Users,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    DollarSign
} from 'lucide-react';

interface Customer {
    tu_id: string;
    tu_email: string;
    tu_is_verified: boolean;
    tu_email_verified: boolean;
    tu_mobile_verified: boolean;
    tu_is_active: boolean;
    tu_created_at: string;
    tbl_user_profiles: {
        tup_first_name: string;
        tup_last_name: string;
        tup_username: string;
        tup_mobile: string;
        tup_sponsorship_number: string;
        tup_gender: string;
    } | null;
}

const CustomerManagement: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerDetails, setShowCustomerDetails] = useState(false);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tbl_users')
                .select(`
          tu_id,
          tu_email,
          tu_is_verified,
          tu_email_verified,
          tu_mobile_verified,
          tu_is_active,
          tu_created_at,
          tbl_user_profiles (
            tup_first_name,
            tup_last_name,
            tup_username,
            tup_mobile,
            tup_sponsorship_number,
            tup_gender
          )
        `)
                .eq('tu_user_type', 'customer')
                .order('tu_created_at', { ascending: false });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Failed to load customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch =
            customer.tu_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.tbl_user_profiles?.tup_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.tbl_user_profiles?.tup_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.tbl_user_profiles?.tup_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.tbl_user_profiles?.tup_sponsorship_number?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && customer.tu_is_active) ||
            (statusFilter === 'inactive' && !customer.tu_is_active);

        const matchesVerification =
            verificationFilter === 'all' ||
            (verificationFilter === 'verified' && customer.tu_is_verified) ||
            (verificationFilter === 'unverified' && !customer.tu_is_verified);

        return matchesSearch && matchesStatus && matchesVerification;
    });

    const handleViewCustomer = (customer: Customer) => {
        setSelectedCustomer(customer);
        setShowCustomerDetails(true);
    };

    const handleToggleStatus = async (customerId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('tbl_users')
                .update({ tu_is_active: !currentStatus })
                .eq('tu_id', customerId);

            if (error) throw error;

            // Reload customers
            loadCustomers();
        } catch (error) {
            console.error('Failed to update customer status:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (showCustomerDetails && selectedCustomer) {
        return (
            <CustomerDetails
                customer={selectedCustomer}
                onBack={() => setShowCustomerDetails(false)}
                onUpdate={loadCustomers}
            />
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Customer Management</h3>
                            <p className="text-gray-600">Manage and monitor customer accounts</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        Total: {customers.length} customers
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Search by name, email, username, or sponsorship number..."
                            />
                        </div>
                    </div>

                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <select
                            value={verificationFilter}
                            onChange={(e) => setVerificationFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Verification</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Verification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                        <tr key={customer.tu_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {customer.tbl_user_profiles?.tup_first_name?.charAt(0) || 'U'}
                        </span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {customer.tbl_user_profiles?.tup_first_name} {customer.tbl_user_profiles?.tup_last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            @{customer.tbl_user_profiles?.tup_username}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {customer.tbl_user_profiles?.tup_sponsorship_number}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{customer.tu_email}</div>
                                <div className="text-sm text-gray-500">{customer.tbl_user_profiles?.tup_mobile}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        customer.tu_email_verified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                      <Mail className="h-3 w-3 mr-1" />
                        {customer.tu_email_verified ? 'Email ✓' : 'Email ✗'}
                    </span>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        customer.tu_mobile_verified
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                      <Phone className="h-3 w-3 mr-1" />
                                        {customer.tu_mobile_verified ? 'Mobile ✓' : 'Mobile ✗'}
                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      customer.tu_is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.tu_is_active ? (
                        <>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                        </>
                    ) : (
                        <>
                            <UserX className="h-3 w-3 mr-1" />
                            Inactive
                        </>
                    )}
                  </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(customer.tu_created_at).toLocaleDateString()}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleViewCustomer(customer)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="View Details"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(customer.tu_id, customer.tu_is_active)}
                                        className={`${
                                            customer.tu_is_active
                                                ? 'text-red-600 hover:text-red-800'
                                                : 'text-green-600 hover:text-green-800'
                                        }`}
                                        title={customer.tu_is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {customer.tu_is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                    <p className="text-gray-600">
                        {searchTerm || statusFilter !== 'all' || verificationFilter !== 'all'
                            ? 'Try adjusting your search criteria'
                            : 'No customers have registered yet'
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

// Customer Details Component
const CustomerDetails: React.FC<{
    customer: Customer;
    onBack: () => void;
    onUpdate: () => void;
}> = ({ customer, onBack, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [transactions, setTransactions] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'transactions') {
            loadTransactions();
        } else if (activeTab === 'members') {
            loadMembers();
        }
    }, [activeTab]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tbl_payments')
                .select(`
          tp_id,
          tp_amount,
          tp_currency,
          tp_payment_method,
          tp_payment_status,
          tp_created_at,
          tbl_user_subscriptions (
            tbl_subscription_plans (
              tsp_name
            )
          )
        `)
                .eq('tp_user_id', customer.tu_id)
                .order('tp_created_at', { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async () => {
        setLoading(true);
        try {
            // This would load referrals/downline members
            // For now, showing mock data
            setMembers([]);
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={onBack}
                            className="text-gray-600 hover:text-gray-800"
                        >
                            ← Back to Customers
                        </button>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {customer.tbl_user_profiles?.tup_first_name} {customer.tbl_user_profiles?.tup_last_name}
                            </h3>
                            <p className="text-gray-600">Customer Details</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'profile', label: 'Profile Details', icon: Users },
                            { id: 'transactions', label: 'Transactions', icon: DollarSign },
                            { id: 'members', label: 'Network Members', icon: Users }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="p-6">
                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Personal Information</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                                    <p className="text-gray-900">
                                        {customer.tbl_user_profiles?.tup_first_name} {customer.tbl_user_profiles?.tup_last_name}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Username</label>
                                    <p className="text-gray-900">@{customer.tbl_user_profiles?.tup_username}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Email</label>
                                    <p className="text-gray-900">{customer.tu_email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Mobile</label>
                                    <p className="text-gray-900">{customer.tbl_user_profiles?.tup_mobile}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Gender</label>
                                    <p className="text-gray-900 capitalize">{customer.tbl_user_profiles?.tup_gender}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Account Information</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Sponsorship Number</label>
                                    <p className="text-gray-900 font-mono">{customer.tbl_user_profiles?.tup_sponsorship_number}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                                    <p className="text-gray-900">{new Date(customer.tu_created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        customer.tu_is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                    {customer.tu_is_active ? 'Active' : 'Inactive'}
                  </span>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Verification Status</label>
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full ${customer.tu_email_verified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="text-sm">Email {customer.tu_email_verified ? 'Verified' : 'Not Verified'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-2 h-2 rounded-full ${customer.tu_mobile_verified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="text-sm">Mobile {customer.tu_mobile_verified ? 'Verified' : 'Not Verified'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'transactions' && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-4">Transaction History</h4>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((transaction: any) => (
                                    <div key={transaction.tp_id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{transaction.tbl_user_subscriptions?.tbl_subscription_plans?.tsp_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {new Date(transaction.tp_created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">${transaction.tp_amount}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    transaction.tp_payment_status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                          {transaction.tp_payment_status}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No transactions found</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div>
                        <h4 className="font-medium text-gray-900 mb-4">Network Members</h4>
                        <div className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">Network member data will be displayed here</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerManagement;