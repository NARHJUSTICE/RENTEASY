import React from 'react';
import { Home, Building, User, CreditCard, LogOut, Search, Plus, List, Upload, CheckCircle, FileText, Calendar, Users, ShieldCheck, MessageSquare, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navigation = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const getNavigationItems = () => {
    const commonItems = [
      { id: 'browse', label: 'Browse Properties', icon: Search },
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'subscription', label: 'Subscription', icon: CreditCard },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'favorites', label: 'Favorites', icon: Heart }
    ];

    if (user?.role === 'landlord') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'my-properties', label: 'My Properties', icon: Building },
        { id: 'add-property', label: 'Add Property', icon: Plus },
        { id: 'id-verifications', label: 'ID Verifications', icon: ShieldCheck },
        { id: 'applications', label: 'Applications', icon: Users },
        ...commonItems
      ];
    }

    // For tenants (students, government workers, family) - ✅ REMOVED my-bookings
    return [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'id-upload', label: 'Upload ID', icon: Upload },
      { id: 'my-applications', label: 'My Applications', icon: FileText },
      ...commonItems
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-sm border-r border-gray-200 h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">RentEasy</h1>
            <p className="text-sm text-gray-500">House Renting Platform</p>
          </div>
        </div>

        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;