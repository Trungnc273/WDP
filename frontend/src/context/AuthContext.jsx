import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tai thong tin nguoi dung tu localStorage khi component mount
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
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      // Token khong hop le hoac da het han
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
    localStorage.setItem('user', JSON.stringify(result.user)); 
    return result.user;
  };

  const register = async (email, password, fullName, phone, address) => {
    const result = await authService.register(email, password, fullName, phone, address);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem('token', result.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
