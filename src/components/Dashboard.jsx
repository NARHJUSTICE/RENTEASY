import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Users, DollarSign, TrendingUp, 
  Calendar, MessageSquare, Heart, FileText,
  Building2, Bed, Bath, UserPlus, Eye
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine which endpoint to use based on user role
      let endpoint = '';
      if (user?.isAdmin || user?.role === 'admin') {
        endpoint = `${API_BASE_URL}/analytics/admin`;
      } else if (user?.role === 'landlord') {
        endpoint = `${API_BASE_URL}/analytics/landlord`;
      } else {
        endpoint = `${API_BASE_URL}/analytics/tenant`;
      }

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Admin Dashboard
  if (user?.isAdmin || user?.role === 'admin') {
    return <AdminDashboard data={dashboardData} />;
  }

  // Landlord Dashboard
  if (user?.role === 'landlord') {
    return <LandlordDashboard data={dashboardData} />;
  }

  // Tenant Dashboard
  return <TenantDashboard data={dashboardData} />;
};

// ✅ Tenant Dashboard
const TenantDashboard = ({ data }) => {
  const { user } = useAuth();
  const stats = data?.stats || {};
  const recentApplications = data?.recentApplications || [];

  const statCards = [
    {
      title: 'Applications',
      value: stats.totalApplications || 0,
      icon: FileText,
      color: 'bg-blue-500',
      details: `${stats.pendingApplications || 0} pending`
    },
    {
      title: 'Favorites',
      value: stats.totalFavorites || 0,
      icon: Heart,
      color: 'bg-red-500',
      details: 'Saved properties'
    },
    {
      title: 'Bookings',
      value: stats.totalBookings || 0,
      icon: Calendar,
      color: 'bg-green-500',
      details: `${stats.upcomingBookings || 0} upcoming`
    },
    {
      title: 'Reviews',
      value: stats.totalReviews || 0,
      icon: MessageSquare,
      color: 'bg-purple-500',
      details: `Rating: ${stats.averageRating || 0} ⭐`
    }
  ];

  // Application status counts
  const statusCounts = {
    pending: stats.pendingApplications || 0,
    approved: stats.approvedApplications || 0,
    rejected: stats.rejectedApplications || 0
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your applications.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.details}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Application Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-700">{statusCounts.pending}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-700">Approved</p>
          <p className="text-2xl font-bold text-green-700">{statusCounts.approved}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-700">Rejected</p>
          <p className="text-2xl font-bold text-red-700">{statusCounts.rejected}</p>
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Applications</h3>
        {recentApplications.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No recent applications</p>
        ) : (
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div key={app._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-800">{app.property?.title || 'Unknown Property'}</p>
                  <p className="text-sm text-gray-500">
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {app.status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Landlord Dashboard
const LandlordDashboard = ({ data }) => {
  const { user } = useAuth();
  const stats = data?.stats || {};
  const recentApplications = data?.recentApplications || [];
  const recentProperties = data?.recentProperties || [];

  const statCards = [
    {
      title: 'Properties',
      value: stats.totalProperties || 0,
      icon: Home,
      color: 'bg-blue-500',
      details: `${stats.availableProperties || 0} available`
    },
    {
      title: 'Rooms',
      value: stats.totalRooms || 0,
      icon: Bed,
      color: 'bg-green-500',
      details: `${stats.availableRooms || 0} available`
    },
    {
      title: 'Applications',
      value: stats.totalApplications || 0,
      icon: FileText,
      color: 'bg-purple-500',
      details: `${stats.pendingApplications || 0} pending`
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue || 0}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      details: `Monthly rent`
    }
  ];

  // Property occupancy
  const occupancyRate = stats.occupancyRate || 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {user?.name?.split(' ')[0] || 'User'}! 🏠</h1>
        <p className="text-gray-500 mt-1">Manage your properties and applications.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.details}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Occupancy Rate */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Occupancy Rate</p>
            <p className="text-2xl font-bold text-gray-800">{occupancyRate}%</p>
          </div>
          <div className="w-32 h-32">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray={`${occupancyRate * 3.39} 339.3`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">{occupancyRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Applications</h3>
          {recentApplications.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No recent applications</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div key={app._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">{app.tenant?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{app.property?.title}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Properties */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Recent Properties</h3>
          {recentProperties.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No properties yet</p>
          ) : (
            <div className="space-y-3">
              {recentProperties.map((property) => (
                <div key={property._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">{property.title}</p>
                    <p className="text-sm text-gray-500">${property.rentPrice}/month</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.availability === 'available' ? 'bg-green-100 text-green-800' :
                    property.availability === 'rented' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {property.availability || 'available'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Admin Dashboard
const AdminDashboard = ({ data }) => {
  const { user } = useAuth();
  const stats = data?.stats || {};
  const recentUsers = data?.recentUsers || [];
  const recentProperties = data?.recentProperties || [];
  const recentApplications = data?.recentApplications || [];
  const monthlyStats = data?.monthlyStats || [];

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
      details: `${stats.totalLandlords || 0} landlords, ${stats.totalTenants || 0} tenants`
    },
    {
      title: 'Properties',
      value: stats.totalProperties || 0,
      icon: Home,
      color: 'bg-green-500',
      details: `${stats.availableProperties || 0} available`
    },
    {
      title: 'Applications',
      value: stats.totalApplications || 0,
      icon: FileText,
      color: 'bg-purple-500',
      details: `${stats.pendingApplications || 0} pending`
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue || 0}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      details: `Total revenue`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 🚀</h1>
        <p className="text-gray-500 mt-1">Here's an overview of the entire platform.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.details}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">Total Rooms</p>
          <p className="text-xl font-bold text-gray-800">{stats.totalRooms || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">Occupied Rooms</p>
          <p className="text-xl font-bold text-gray-800">{stats.occupiedRooms || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">Occupancy Rate</p>
          <p className="text-xl font-bold text-gray-800">{stats.occupancyRate || 0}%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <p className="text-sm text-gray-500">Avg Rating</p>
          <p className="text-xl font-bold text-gray-800">{stats.averageRating || 0} ⭐</p>
        </div>
      </div>

      {/* Monthly Stats Chart */}
      {monthlyStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Monthly Activity (Last 6 Months)</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end space-x-4 h-48 min-w-[400px]">
              {monthlyStats.map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center space-x-1">
                    <div 
                      className="bg-blue-500 rounded-t w-6"
                      style={{ height: `${Math.max(5, (month.users / 20) * 100)}px` }}
                      title={`Users: ${month.users}`}
                    />
                    <div 
                      className="bg-green-500 rounded-t w-6"
                      style={{ height: `${Math.max(5, (month.properties / 20) * 100)}px` }}
                      title={`Properties: ${month.properties}`}
                    />
                    <div 
                      className="bg-purple-500 rounded-t w-6"
                      style={{ height: `${Math.max(5, (month.applications / 20) * 100)}px` }}
                      title={`Applications: ${month.applications}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{month.month}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center space-x-6 mt-4 text-xs text-gray-500">
            <span><span className="inline-block w-3 h-3 bg-blue-500 rounded mr-1"></span> Users</span>
            <span><span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span> Properties</span>
            <span><span className="inline-block w-3 h-3 bg-purple-500 rounded mr-1"></span> Applications</span>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Users</h3>
          {recentUsers.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No users</p>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((user) => (
                <div key={user._id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {user.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Properties */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Properties</h3>
          {recentProperties.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No properties</p>
          ) : (
            <div className="space-y-2">
              {recentProperties.map((property) => (
                <div key={property._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate">{property.title}</p>
                    <p className="text-xs text-gray-500">${property.rentPrice}/month</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    property.availability === 'available' ? 'bg-green-100 text-green-800' :
                    property.availability === 'rented' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {property.availability || 'available'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Recent Applications</h3>
          {recentApplications.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No applications</p>
          ) : (
            <div className="space-y-2">
              {recentApplications.map((app) => (
                <div key={app._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate">{app.tenant?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{app.property?.title}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {app.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;