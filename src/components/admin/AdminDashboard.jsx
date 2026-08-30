import React, { useState, useEffect } from 'react';
import { Users, Home, FileText, CreditCard, DollarSign, TrendingUp, UserPlus, Building, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/stats`);
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers);
      setRecentProperties(response.data.recentProperties);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      change: '+12%'
    },
    { 
      title: 'Properties', 
      value: stats?.totalProperties || 0, 
      icon: Home, 
      color: 'bg-green-500',
      change: '+5%'
    },
    { 
      title: 'Applications', 
      value: stats?.totalApplications || 0, 
      icon: FileText, 
      color: 'bg-yellow-500',
      change: '+8%'
    },
    { 
      title: 'Bookings', 
      value: stats?.totalBookings || 0, 
      icon: Calendar, 
      color: 'bg-purple-500',
      change: '+3%'
    },
    { 
      title: 'Revenue', 
      value: `$${stats?.totalRevenue || 0}`, 
      icon: DollarSign, 
      color: 'bg-red-500',
      change: '+15%'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">{stat.change}</span>
                <span className="text-sm text-gray-400 ml-1">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
              Recent Users
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-sm">No users yet</p>
            ) : (
              recentUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {u.subscriptionStatus || 'inactive'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Properties */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-500" />
              Recent Properties
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {recentProperties.length === 0 ? (
              <p className="text-gray-500 text-sm">No properties yet</p>
            ) : (
              recentProperties.map((p) => (
                <div key={p._id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500">${p.rentPrice}/month</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.availability === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.availability || 'available'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;