import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      loadUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token) => {
    try {
      const userData = await authService.getProfile(token);
      setUser(userData);
      setToken(token);
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem('token', result.token);
  };

  const register = async (email, password, fullName) => {
    const result = await authService.register(email, password, fullName);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem('token', result.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
