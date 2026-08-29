import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthWrapper from './components/auth/AuthWrapper';
import SubscriptionPrompt from './components/subscription/SubscriptionPrompt';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/layout/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import RoutesWithAnimation from './components/RoutesWithAnimation';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, hasActiveSubscription } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AuthWrapper />;
  }
  
  if (!hasActiveSubscription) {
    return (
      <SubscriptionPrompt 
        onSubscriptionComplete={() => {
          window.location.href = '/';
        }} 
      />
    );
  }
  
  return children;
};

// Admin route wrapper
const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AuthWrapper />;
  }
  
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have admin privileges.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

// Main app layout with navigation
const AppLayout = ({ children, isAdmin }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const getActiveTab = () => {
    const path = location.pathname;
    
    // ✅ Admin routes - return correct admin tab IDs
    if (path === '/admin') return 'dashboard';
    if (path === '/admin/users') return 'users';
    if (path === '/admin/properties') return 'properties';
    if (path === '/admin/applications') return 'applications';
    if (path === '/admin/subscriptions') return 'subscriptions';
    
    // Regular routes
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path === '/my-properties') return 'my-properties';
    if (path === '/add-property') return 'add-property';
    if (path === '/browse') return 'browse';
    if (path === '/profile') return 'profile';
    if (path === '/subscription') return 'subscription';
    if (path.startsWith('/edit-property')) return 'edit-property';
    if (path === '/id-upload') return 'id-upload';
    if (path === '/id-verifications') return 'id-verifications';
    if (path === '/applications') return 'applications';
    if (path === '/my-applications') return 'my-applications';
    if (path === '/my-bookings') return 'my-bookings';
    if (path === '/messages') return 'messages';
    if (path === '/favorites') return 'favorites';
    if (path === '/about' || path === '/terms' || path === '/privacy') return 'dashboard';
    if (path.startsWith('/reset-password')) return 'dashboard';
    if (path === '/forgot-password') return 'dashboard';
    if (path.startsWith('/property/')) return 'browse';
    
    return 'dashboard';
  };

  const handleTabChange = (tab) => {
    const routeMap = {
      'dashboard': '/',
      'my-properties': '/my-properties',
      'add-property': '/add-property',
      'browse': '/browse',
      'profile': '/profile',
      'subscription': '/subscription',
      'id-upload': '/id-upload',
      'id-verifications': '/id-verifications',
      'applications': '/applications',
      'my-applications': '/my-applications',
      'my-bookings': '/my-bookings',
      'messages': '/messages',
      'favorites': '/favorites',
      'edit-property': '/my-properties'
    };
    
    const adminRouteMap = {
      'dashboard': '/admin',
      'users': '/admin/users',
      'properties': '/admin/properties',
      'applications': '/admin/applications',
      'subscriptions': '/admin/subscriptions'
    };
    
    if (isAdmin && adminRouteMap[tab]) {
      navigate(adminRouteMap[tab]);
    } else if (routeMap[tab]) {
      navigate(routeMap[tab]);
    }
    
    // ✅ Update active tab immediately
    setActiveTab(tab);
  };

  // ✅ Update active tab when location changes
  useEffect(() => {
    const newActiveTab = getActiveTab();
    setActiveTab(newActiveTab);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isAdmin={isAdmin}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-h-screen">
        <Header 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        <div className="p-4 md:p-6 flex-grow">
          {children}
        </div>

        <Footer />
        <MobileBottomNav activeTab={activeTab} onNavigate={handleTabChange} />
      </main>
    </div>
  );
};

// Main app content with routes
const AppContent = () => {
  const { user, loading } = useAuth();
  const isAdmin = user?.isAdmin === true || user?.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout isAdmin={isAdmin}>
        <RoutesWithAnimation />
      </AppLayout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;