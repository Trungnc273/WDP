import api from './api';

const chatService = {
  // Get user's conversations
  getConversations: async (page = 1, limit = 20) => {
    const response = await api.get(`/chat/conversations?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Get conversation by ID
  getConversationById: async (conversationId) => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data.data;
  },

  // Get messages in a conversation
  getMessages: async (conversationId, page = 1, limit = 50) => {
    const response = await api.get(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  // Create a new conversation
  createConversation: async (sellerId, productId) => {
    const response = await api.post('/chat/conversations', {
      sellerId,
      productId
    });
    return response.data.data;
  },

  // Send a message (REST fallback)
  sendMessage: async (conversationId, content) => {
    const response = await api.post('/chat/messages', {
      conversationId,
      content
    });
    return response.data.data;
  }
};

export default chatService;