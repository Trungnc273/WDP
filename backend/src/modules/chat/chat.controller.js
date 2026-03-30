const chatService = require('./chat.service');
const Product = require('../products/product.model');
const Order = require('../orders/order.model');
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
   * Get or create a conversation from order context
   * POST /api/chat/orders/:orderId/conversation
   */
  const getOrCreateConversationByOrder = async (req, res) => {
    try {
      const actorId = req.user.userId;
      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .select('buyerId sellerId productId')
        .lean();

      if (!order) {
        return sendError(res, 404, 'Đơn hàng không tồn tại');
      }

      const normalizedActorId = String(actorId);
      const normalizedBuyerId = String(order.buyerId || '');
      const normalizedSellerId = String(order.sellerId || '');
      const normalizedProductId = String(order.productId || '');

      const isParticipant =
        normalizedActorId === normalizedBuyerId ||
        normalizedActorId === normalizedSellerId;

      if (!isParticipant) {
        return sendError(res, 403, 'Bạn không có quyền truy cập cuộc trò chuyện của đơn hàng này');
      }

      if (!normalizedBuyerId || !normalizedSellerId || !normalizedProductId) {
        return sendError(res, 400, 'Thông tin đơn hàng không đầy đủ để mở cuộc trò chuyện');
      }

      const conversation = await chatService.createConversation(
        normalizedBuyerId,
        normalizedSellerId,
        normalizedProductId
      );

      return sendSuccess(res, 200, conversation, 'Mở cuộc trò chuyện theo đơn hàng thành công');
    } catch (error) {
      console.error('Error get/create conversation by order:', error);
      return sendError(res, 500, error.message || 'Không thể mở cuộc trò chuyện theo đơn hàng');
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
    const actorId = req.user.userId;
    const { sellerId: counterpartId, productId } = req.body;

    // Validate required fields
    if (!counterpartId || !productId) {
      return sendError(res, 400, 'sellerId và productId là bắt buộc');
    }

    const product = await Product.findById(productId).select('seller').lean();
    if (!product?.seller) {
      return sendError(res, 404, 'Sản phẩm không tồn tại');
    }

    const normalizedActorId = actorId.toString();
    const normalizedCounterpartId = counterpartId.toString();
    const normalizedSellerId = product.seller.toString();

    if (normalizedActorId === normalizedCounterpartId) {
      return sendError(res, 400, 'Không thể tạo cuộc trò chuyện với chính mình');
    }

    // Canonical role assignment:
    // - seller luôn la chu san pham
    // - buyer la doi tac con lai
    const buyerId = normalizedActorId === normalizedSellerId
      ? normalizedCounterpartId
      : normalizedActorId;

    if (buyerId === normalizedSellerId) {
      return sendError(res, 400, 'Không thể tạo cuộc trò chuyện với chính mình');
    }

    const conversation = await chatService.createConversation(buyerId, normalizedSellerId, productId);
    
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
    // Ho tro REST fallback cho ca text va image payload.
    const { conversationId, content = '', type = 'text', metadata = null } = req.body;

    // Validate required fields
    if (!conversationId) {
      return sendError(res, 400, 'conversationId là bắt buộc');
    }

    if (type === 'text' && !String(content).trim()) {
      return sendError(res, 400, 'Nội dung tin nhắn không được để trống');
    }

    const message = await chatService.sendMessage(conversationId, senderId, {
      content: String(content || '').trim(),
      type,
      metadata
    });
    
    sendSuccess(res, 200, message, 'Gửi tin nhắn thành công');
  } catch (error) {
    console.error('Error sending message:', error);
    sendError(res, 500, error.message || 'Không thể gửi tin nhắn');
  }
};

/**
 * Upload image for chat message
 * POST /api/chat/messages/upload-image
 */
const uploadChatImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { conversationId } = req.body;

    if (!conversationId) {
      return sendError(res, 400, 'conversationId là bắt buộc');
    }

    if (!req.file) {
      return sendError(res, 400, 'Vui lòng chọn ảnh để upload');
    }

    // Chi cho phep upload neu user thuoc conversation.
    await chatService.getConversationById(conversationId, userId);

    const targetId = req.uploadTargetId || conversationId;
    const imagePath = `/uploads/evidence/${targetId}/${req.file.filename}`;

    return sendSuccess(res, 200, {
      imageUrl: imagePath,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    }, 'Upload ảnh chat thành công');
  } catch (error) {
    console.error('Error uploading chat image:', error);
    return sendError(res, 500, error.message || 'Không thể upload ảnh chat');
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
  getOrCreateConversationByOrder,
  getMessages,
  createConversation,
  sendMessage,
  getConversationById,
  uploadChatImage
};