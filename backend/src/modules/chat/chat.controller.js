const chatService = require('./chat.service');
const { sendSuccess, sendError } = require('../../common/utils/response.util');

/**
 * Get user's conversations
 * GET /api/chat/conversations
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await chatService.getConversations(userId, pagination);
    
    sendSuccess(res, 200, result, 'Lấy danh sách cuộc trò chuyện thành công');
  } catch (error) {
    console.error('Error getting conversations:', error);
    sendError(res, 500, error.message || 'Không thể lấy danh sách cuộc trò chuyện');
  }
};

/**
 * Get messages in a conversation
 * GET /api/chat/conversations/:id/messages
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const result = await chatService.getMessages(conversationId, userId, pagination);
    
    sendSuccess(res, 200, result, 'Lấy tin nhắn thành công');
  } catch (error) {
    console.error('Error getting messages:', error);
    sendError(res, 500, error.message || 'Không thể lấy tin nhắn');
  }
};

/**
 * Create a new conversation
 * POST /api/chat/conversations
 */
const createConversation = async (req, res) => {
  try {
    const buyerId = req.user.userId;
    const { sellerId, productId } = req.body;

    // Validate required fields
    if (!sellerId || !productId) {
      return sendError(res, 400, 'sellerId và productId là bắt buộc');
    }

    // Check if user is trying to chat with themselves
    if (buyerId === sellerId) {
      return sendError(res, 400, 'Không thể tạo cuộc trò chuyện với chính mình');
    }

    const conversation = await chatService.createConversation(buyerId, sellerId, productId);
    
    sendSuccess(res, 200, conversation, 'Tạo cuộc trò chuyện thành công');
  } catch (error) {
    console.error('Error creating conversation:', error);
    sendError(res, 500, error.message || 'Không thể tạo cuộc trò chuyện');
  }
};

/**
 * Send a message (REST fallback)
 * POST /api/chat/messages
 */
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { conversationId, content } = req.body;

    // Validate required fields
    if (!conversationId || !content) {
      return sendError(res, 400, 'conversationId và content là bắt buộc');
    }

    // Validate content length
    if (content.trim().length === 0) {
      return sendError(res, 400, 'Nội dung tin nhắn không được để trống');
    }

    if (content.length > 1000) {
      return sendError(res, 400, 'Nội dung tin nhắn không được quá 1000 ký tự');
    }

    const message = await chatService.sendMessage(conversationId, senderId, content.trim());
    
    sendSuccess(res, 200, message, 'Gửi tin nhắn thành công');
  } catch (error) {
    console.error('Error sending message:', error);
    sendError(res, 500, error.message || 'Không thể gửi tin nhắn');
  }
};

/**
 * Get conversation by ID
 * GET /api/chat/conversations/:id
 */
const getConversationById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id: conversationId } = req.params;

    const conversation = await chatService.getConversationById(conversationId, userId);
    
    sendSuccess(res, 200, conversation, 'Lấy thông tin cuộc trò chuyện thành công');
  } catch (error) {
    console.error('Error getting conversation:', error);
    sendError(res, 500, error.message || 'Không thể lấy thông tin cuộc trò chuyện');
  }
};

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  getConversationById
};