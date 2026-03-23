import React, { createContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tai thong tin nguoi dung tu localStorage khi component mount
    const storedToken = localStorage.getItem("token");
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
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      // Token khong hop le hoac da het han
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) {
      return null;
    }

    const userData = await authService.getProfile(currentToken);
    setUser(userData);
    setToken(currentToken);
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  };

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    return result.user;
  };

  const loginWithGoogle = async (idToken) => {
    const result = await authService.loginWithGoogle(idToken);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    return result.user;
  };

  const requestRegisterOtp = async (
    email,
    password,
    fullName,
    phone,
    address,
  ) => {
    return await authService.requestRegisterOtp(
      email,
      password,
      fullName,
      phone,
      address,
    );
  };

  const verifyAndRegister = async (email, otpCode) => {
    const result = await authService.verifyAndRegister(email, otpCode);
    setUser(result.user);
    setToken(result.token);
    localStorage.setItem("token", result.token);
    localStorage.setItem("user", JSON.stringify(result.user));
    return result.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const changePassword = async (currentPassword, newPassword) => {
    await authService.changePassword(currentPassword, newPassword);
  };

  const forgotPassword = async (email) => {
    return authService.forgotPassword(email);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    requestRegisterOtp,
    verifyAndRegister,
    logout,
    changePassword,
    forgotPassword,
    refreshUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
