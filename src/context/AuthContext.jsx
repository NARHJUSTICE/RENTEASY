import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(Cookies.get('token'));

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // LOAD USER
  const loadUser = async () => {
    console.log('🔍 [Auth] loadUser called, token:', token ? 'exists' : 'none');
    
    if (token) {
      try {
        console.log('🔍 [Auth] Fetching user from:', `${API_BASE_URL}/auth/me`);
        const response = await axios.get(`${API_BASE_URL}/auth/me`);
        console.log('✅ [Auth] User data received:', response.data);
        
        const userData = {
          ...response.data.user,
          isAdmin: response.data.user?.isAdmin || false
        };
        
        setUser(userData);
        Cookies.set('user', JSON.stringify(userData), { expires: 7 });
        return userData;
      } catch (error) {
        console.error('❌ [Auth] Failed to load user:', error);
        if (error.response?.status === 401) {
          Cookies.remove('token');
          setToken(null);
        }
        setUser(null);
        return null;
      }
    } else {
      console.log('⏭️ [Auth] No token found, skipping user load');
      setUser(null);
      return null;
    }
  };

  // Load user on mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await loadUser();
      setLoading(false);
    };
    initAuth();
  }, [token]);

  // ✅ FIXED: Login function now returns user object
  const login = async (email, password) => {
    try {
      console.log('🔍 [Auth] Attempting login for:', email);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      const { token: newToken, user: userData } = response.data;
      
      console.log('✅ [Auth] Login successful, user:', userData.name);
      console.log('✅ [Auth] isAdmin:', userData.isAdmin);
      
      const userWithAdmin = {
        ...userData,
        isAdmin: userData.isAdmin || false
      };
      
      setToken(newToken);
      setUser(userWithAdmin);
      Cookies.set('token', newToken, { expires: 7 });
      Cookies.set('user', JSON.stringify(userWithAdmin), { expires: 7 });
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Login successful!');
      
      // ✅ Return user object so LoginForm can access it
      return { success: true, user: userWithAdmin };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      console.error('❌ [Auth] Login error:', message);
      toast.error(message);
      return { success: false, error: message, user: null };
    }
  };

  const register = async (userData) => {
    try {
      console.log('🔍 [Auth] Attempting registration for:', userData.email);
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { token: newToken, user: newUser } = response.data;
      
      console.log('✅ [Auth] Registration successful, user:', newUser.name);
      
      const userWithAdmin = {
        ...newUser,
        isAdmin: false
      };
      
      setToken(newToken);
      setUser(userWithAdmin);
      Cookies.set('token', newToken, { expires: 7 });
      Cookies.set('user', JSON.stringify(userWithAdmin), { expires: 7 });
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      toast.success('Registration successful!');
      return { success: true, user: userWithAdmin };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      console.error('❌ [Auth] Registration error:', message);
      toast.error(message);
      return { success: false, error: message, user: null };
    }
  };

  const logout = () => {
    console.log('🔍 [Auth] Logging out');
    setToken(null);
    setUser(null);
    Cookies.remove('token');
    Cookies.remove('user');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    console.log('🔍 [Auth] Updating user:', updatedUser?.name);
    const newUser = {
      ...user,
      ...updatedUser
    };
    setUser(newUser);
    Cookies.set('user', JSON.stringify(newUser), { expires: 7 });
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    loadUser,
    updateUser,
    isAuthenticated: !!user,
    hasActiveSubscription: user?.subscriptionStatus === 'active',
    isAdmin: user?.isAdmin || false
  };

  console.log('🔍 [Auth] Current user state:', user?.name || 'No user');
  console.log('🔍 [Auth] isAdmin:', user?.isAdmin);
  console.log('🔍 [Auth] Subscription status:', user?.subscriptionStatus);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};