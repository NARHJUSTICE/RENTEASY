import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, PlusCircle, FileCheck, FileText, Search, User, 
  CreditCard, MessageSquare, Heart, LogOut, ChevronDown,
  Menu, X, LayoutDashboard, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isAdmin, activeTab, setActiveTab, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMyPropertiesOpen, setIsMyPropertiesOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  // Navigation items based on role
  const getMenuItems = () => {
    const role = user?.role?.toLowerCase();
    
    // Admin items
    if (isAdmin) {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { id: 'users', icon: User, label: 'User Management', path: '/admin/users' },
        { id: 'properties', icon: Building2, label: 'Property Management', path: '/admin/properties' },
        { id: 'applications', icon: FileText, label: 'Application Management', path: '/admin/applications' },
        { id: 'subscriptions', icon: CreditCard, label: 'Subscription Management', path: '/admin/subscriptions' },
      ];
    }
    
    // Landlord items
    if (role === 'landlord') {
      return [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { 
          id: 'my-properties', 
          icon: Building2, 
          label: 'My Properties',
          path: '/my-properties',
          subItems: [
            { id: 'add-property', icon: PlusCircle, label: 'Add Property', path: '/add-property' },
            { id: 'id-verifications', icon: FileCheck, label: 'ID Verifications', path: '/id-verifications' },
            { id: 'applications', icon: FileText, label: 'Applications', path: '/applications' },
          ]
        },
        { id: 'browse', icon: Search, label: 'Browse Properties', path: '/browse' },
        { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
        { id: 'subscription', icon: CreditCard, label: 'Subscription', path: '/subscription' },
        { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/messages' },
        { id: 'favorites', icon: Heart, label: 'Favorites', path: '/favorites' },
      ];
    }
    
    // Tenant/Student/Client items
    return [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { id: 'id-upload', icon: FileCheck, label: 'Upload ID', path: '/id-upload' },
      { id: 'my-applications', icon: FileText, label: 'My Applications', path: '/my-applications' },
      { id: 'my-bookings', icon: Home, label: 'My Bookings', path: '/my-bookings' },
      { id: 'browse', icon: Search, label: 'Browse Properties', path: '/browse' },
      { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
      { id: 'subscription', icon: CreditCard, label: 'Subscription', path: '/subscription' },
      { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/messages' },
      { id: 'favorites', icon: Heart, label: 'Favorites', path: '/favorites' },
    ];
  };

  const menuItems = getMenuItems();

  const isItemActive = (id) => {
    return activeTab === id;
  };

  // ✅ FIXED: Only call setActiveTab, NOT navigate directly
  // The parent AppLayout's handleTabChange will handle navigation
  const handleItemClick = (id) => {
    setActiveTab(id);
    onClose();
  };

  // ✅ FIXED: Only call setActiveTab for My Properties
  const handleMyPropertiesClick = () => {
    setIsMyPropertiesOpen(!isMyPropertiesOpen);
    setActiveTab('my-properties');
    onClose();
  };

  return (
    <>
      {/* Overlay - visible when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50
        w-64 h-screen
        bg-white border-r border-gray-200
        flex flex-col overflow-y-auto
        shadow-xl
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative
      `}>
        {/* Close button - only on mobile */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 lg:hidden">
          <Link to="/dashboard" className="flex items-center space-x-2" onClick={onClose}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">RentEasy</h1>
              <p className="text-xs text-gray-500">House Renting Platform</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop logo */}
        <div className="hidden lg:flex justify-between items-center p-4 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">RentEasy</h1>
              <p className="text-xs text-gray-500">House Renting Platform</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.subItems ? (
                <div>
                  <div className="flex items-center">
                    <button
                      onClick={handleMyPropertiesClick}
                      className={`
                        flex-1 flex items-center justify-between px-3 py-2.5 rounded-lg
                        ${isItemActive(item.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                        transition-colors duration-200 text-left
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isItemActive(item.id) ? 'text-blue-700' : 'text-gray-500'}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isMyPropertiesOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  
                  {isMyPropertiesOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleItemClick(subItem.id)}
                          className={`
                            w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left
                            ${isItemActive(subItem.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}
                            transition-colors duration-200
                          `}
                        >
                          <subItem.icon className={`w-4 h-4 flex-shrink-0 ${isItemActive(subItem.id) ? 'text-blue-700' : 'text-gray-400'}`} />
                          <span className="text-sm">{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left
                    ${isItemActive(item.id) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}
                    transition-colors duration-200
                  `}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isItemActive(item.id) ? 'text-blue-700' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center space-x-3 p-2 rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
          
          {/* Sign Out Button - Disabled */}
          {/* 
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 mt-1 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
          */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;