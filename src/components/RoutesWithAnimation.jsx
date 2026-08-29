import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './animations/PageTransition';
import { useAuth } from '../context/AuthContext';
import AuthWrapper from './auth/AuthWrapper';

// Import all your components here
import LoginForm from './auth/LoginForm';
import RegisterForm from './auth/RegisterForm';
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import SubscriptionPrompt from './subscription/SubscriptionPrompt';
import Dashboard from './Dashboard';
import BrowseProperties from './properties/BrowseProperties';
import AddProperty from './properties/AddProperty';
import MyProperties from './properties/MyProperties';
import EditProperty from './properties/EditProperty';
import PropertyDetail from './properties/PropertyDetail';
import IDUpload from './tenant/IDUpload';
import VerificationDashboard from './landlord/VerificationDashboard';
import ApplicationsDashboard from './landlord/ApplicationsDashboard';
import MyApplications from './tenant/MyApplications';
import MyBookings from './tenant/MyBookings';
import AdminDashboard from './admin/AdminDashboard';
import UserManagement from './admin/UserManagement';
import PropertyManagement from './admin/PropertyManagement';
import ApplicationManagement from './admin/ApplicationManagement';
import SubscriptionManagement from './admin/SubscriptionManagement';
import Messages from './messages/Messages';
import FavoritesList from './favorites/FavoritesList';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications'; // ✅ ADDED

// Wrapper components
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, hasActiveSubscription } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>;
  if (!isAuthenticated) return <AuthWrapper />;
  if (!hasActiveSubscription) return <SubscriptionPrompt onSubscriptionComplete={() => window.location.href = '/'} />;
  return children;
};

// ✅ UPDATED: Admin route wrapper with better admin detection
const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>;
  if (!isAuthenticated) return <AuthWrapper />;
  
  // ✅ Check both isAdmin and role for flexibility
  const isAdmin = user?.isAdmin === true || user?.role === 'admin';
  
  if (!isAdmin) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600">You do not have admin privileges.</p>
        <button onClick={() => window.location.href = '/'} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Go Home</button>
      </div>
    </div>
  );
  return children;
};

const RoutesWithAnimation = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        {/* Public Routes */}
        <Route path="/forgot-password" element={<PageTransition key={location.key}><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password/:token" element={<PageTransition key={location.key}><ResetPassword /></PageTransition>} />
        <Route path="/about" element={<PageTransition key={location.key}><About /></PageTransition>} />
        <Route path="/terms" element={<PageTransition key={location.key}><Terms /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition key={location.key}><Privacy /></PageTransition>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><PageTransition key={location.key}><AdminDashboard /></PageTransition></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><PageTransition key={location.key}><UserManagement /></PageTransition></AdminRoute>} />
        <Route path="/admin/properties" element={<AdminRoute><PageTransition key={location.key}><PropertyManagement /></PageTransition></AdminRoute>} />
        <Route path="/admin/applications" element={<AdminRoute><PageTransition key={location.key}><ApplicationManagement /></PageTransition></AdminRoute>} />
        <Route path="/admin/subscriptions" element={<AdminRoute><PageTransition key={location.key}><SubscriptionManagement /></PageTransition></AdminRoute>} />
        
        {/* Messages & Favorites */}
        <Route path="/messages" element={<ProtectedRoute><PageTransition key={location.key}><Messages /></PageTransition></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><PageTransition key={location.key}><FavoritesList /></PageTransition></ProtectedRoute>} />
        
        {/* Property Detail Route */}
        <Route path="/property/:id" element={<ProtectedRoute><PageTransition key={location.key}><PropertyDetail /></PageTransition></ProtectedRoute>} />
        
        {/* ✅ Notifications Route - ADDED */}
        <Route path="/notifications" element={
          <ProtectedRoute>
            <PageTransition key={location.key}>
              <Notifications />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Profile & Settings Routes */}
        <Route path="/profile" element={<ProtectedRoute><PageTransition key={location.key}><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition key={location.key}><Settings /></PageTransition></ProtectedRoute>} />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><PageTransition key={location.key}><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition key={location.key}><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/browse" element={<ProtectedRoute><PageTransition key={location.key}><BrowseProperties /></PageTransition></ProtectedRoute>} />
        <Route path="/my-properties" element={<ProtectedRoute>{user?.role === 'landlord' ? <PageTransition key={location.key}><MyProperties /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        <Route path="/add-property" element={<ProtectedRoute>{user?.role === 'landlord' ? <PageTransition key={location.key}><AddProperty /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        <Route path="/edit-property/:id" element={<ProtectedRoute>{user?.role === 'landlord' ? <PageTransition key={location.key}><EditProperty /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        <Route path="/id-upload" element={<ProtectedRoute>{user?.role !== 'landlord' ? <PageTransition key={location.key}><IDUpload /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        <Route path="/id-verifications" element={<ProtectedRoute>{user?.role === 'landlord' ? <PageTransition key={location.key}><VerificationDashboard /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute>{user?.role === 'landlord' ? <PageTransition key={location.key}><ApplicationsDashboard /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        <Route path="/my-applications" element={<ProtectedRoute>{user?.role !== 'landlord' ? <PageTransition key={location.key}><MyApplications /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute>{user?.role !== 'landlord' ? <PageTransition key={location.key}><MyBookings /></PageTransition> : <PageTransition key={location.key}><Dashboard /></PageTransition>}</ProtectedRoute>} />
        
        {/* Subscription Route */}
        <Route path="/subscription" element={<ProtectedRoute><PageTransition key={location.key}><div className="bg-white rounded-lg shadow p-6"><h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription</h2><div className="space-y-4"><div><label className="block text-sm font-medium text-gray-700">Status</label><p className="mt-1 text-sm text-green-600 capitalize">{user?.subscriptionStatus}</p></div>{user?.subscriptionExpiryDate && <div><label className="block text-sm font-medium text-gray-700">Expires On</label><p className="mt-1 text-sm text-gray-900">{new Date(user.subscriptionExpiryDate).toLocaleDateString()}</p></div>}</div></div></PageTransition></ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

export default RoutesWithAnimation;