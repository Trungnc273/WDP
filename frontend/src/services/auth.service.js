import api from "./api";

export const authService = {
  async register(email, password, fullName, phone, address) {
    try {
      const response = await api.post("/auth/register", {
        email,
        password,
        fullName,
        phone,
        address,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Đăng ký thất bại");
      }
    } catch (error) {
      throw error;
    }
  },

  async login(email, password) {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Đăng nhập thất bại");
      }
    } catch (error) {
      throw error;
    }
  },

  async loginWithGoogle(idToken) {
    try {
      const response = await api.post("/auth/google", { idToken });
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Đăng nhập Google thất bại");
      }
    } catch (error) {
      throw error;
    }
  },

  async getProfile(token) {
    try {
      const response = await api.get("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Không thể lấy thông tin profile",
        );
      }
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    // Tam thoi xu ly dang xuat o client bang cach xoa token
    // Sau nay co the bo sung endpoint backend de vo hieu hoa token
    localStorage.removeItem("token");
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      throw error;
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post("/auth/forgot-password", { email });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Yêu cầu đặt lại mật khẩu thất bại",
        );
      }
    } catch (error) {
      throw error;
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Đặt lại mật khẩu thất bại");
      }
    } catch (error) {
      throw error;
    }
  },
};
