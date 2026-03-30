import React, { createContext, useState, useEffect } from "react";
import { authService } from "../services/auth.service";

export const AuthContext = createContext();

function normalizeUser(userData) {
  if (!userData) return null;

  const normalizedId = userData._id || userData.id || null;

  return {
    ...userData,
    _id: normalizedId,
    id: normalizedId,
  };
}

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
      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      setToken(token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
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
    const normalizedUser = normalizeUser(userData);
    setUser(normalizedUser);
    setToken(currentToken);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    return normalizedUser;
  };

  const persistAuthState = async (result) => {
    localStorage.setItem("token", result.token);
    setToken(result.token);

    try {
      const userData = await authService.getProfile(result.token);
      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      return normalizedUser;
    } catch (_) {
      const fallbackUser = normalizeUser(result.user);
      setUser(fallbackUser);
      localStorage.setItem("user", JSON.stringify(fallbackUser));
      return fallbackUser;
    }
  };

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.requires2FA) {
      return result; 
    }
    return await persistAuthState(result);
  };

  const verifyLogin2FA = async (email, otpCode) => {
    const result = await authService.verifyLogin2FA(email, otpCode);
    return await persistAuthState(result);
  };

  const loginWithGoogle = async (idToken) => {
    const result = await authService.loginWithGoogle(idToken);
    return await persistAuthState(result);
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
    return await persistAuthState(result);
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
    verifyLogin2FA,
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
