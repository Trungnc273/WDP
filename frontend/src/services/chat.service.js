import api from './api';
import io from 'socket.io-client';
import { NETWORK_CONFIG } from './network.config';

const chatService = {
  // Tạo kết nối socket cho tính năng chat thời gian thực.
  connectSocket: (token) => {
    return io(NETWORK_CONFIG.SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
  },

  // Lấy danh sách cuộc trò chuyện của người dùng.
  getConversations: async (page = 1, limit = 20) => {
    const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Lấy thông tin chi tiết cuộc trò chuyện theo ID.
  getConversationById: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data.data;
  },

  // Lấy danh sách tin nhắn trong một cuộc trò chuyện.
  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Tạo cuộc trò chuyện mới giữa người mua và người bán.
  createConversation: async (sellerId, productId) => {
    const response = await api.post('/chat/conversations', {
      sellerId,
      productId
    });
    return response.data.data;
  },

  // Lay/tao cuoc tro chuyen theo don hang (ho tro ca don chua co tin nhan).
  getOrCreateConversationByOrder: async (orderId) => {
    const response = await api.post(`/chat/orders/${orderId}/conversation`);
    return response.data.data;
  },

  // Gửi tin nhắn qua REST (dùng khi socket không khả dụng).
  sendMessage: async (conversationId, messageData) => {
    // Ho tro ca text string don gian va object payload (text/image + metadata).
    const payload = typeof messageData === 'string'
      ? { content: messageData }
      : messageData;

    const response = await api.post('/chat/messages', {
      conversationId,
      ...payload
    });
    return response.data.data;
  },

  // Upload ảnh để gửi trong chat.
  uploadChatImage: async (conversationId, imageFile) => {
    const formData = new FormData();
    formData.append('conversationId', conversationId);
    formData.append('image', imageFile);

    // targetId giup middleware luu dung thu muc cua conversation.
    const response = await api.post(`/chat/messages/upload-image?targetId=${conversationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  },

  // Người bán tạo đề nghị giá từ cuộc trò chuyện hiện tại.
  createSellerOffer: async ({ conversationId, agreedPrice, message }) => {
    const response = await api.post('/orders/seller-offer', {
      conversationId,
      agreedPrice,
      message
    });
    return response.data.data;
  },

  // Người mua tạo đề nghị giá từ cuộc trò chuyện hiện tại.
  createBuyerOffer: async ({ conversationId, agreedPrice, message }) => {
    const response = await api.post('/orders/buyer-offer', {
      conversationId,
      agreedPrice,
      message
    });
    return response.data.data;
  },

  // Người mua chấp nhận/từ chối đề nghị do người bán khởi tạo.
  respondSellerOffer: async ({ requestId, decision, reason = '' }) => {
    if (decision === 'accept') {
      const response = await api.post(`/orders/${requestId}/accept`);
      return response.data.data;
    }

    const response = await api.post(`/orders/${requestId}/reject`, { reason });
    return response.data.data;
  }
};

export default chatService;