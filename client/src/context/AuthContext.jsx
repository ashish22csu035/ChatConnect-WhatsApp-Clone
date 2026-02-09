import { createContext, useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const checkAuth = async () => {
    try {
      const { data } = await authAPI.getCurrentUser();
      console.log(' User authenticated:', data.name);
      setUser(data);
    } catch (error) {
      console.log(' Not authenticated');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  window.location.href = `${apiUrl}/auth/google`;
};


  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};