const Conversation = require('./conversation.model');
const Message = require('./message.model');
const Product = require('../products/product.model');
const { encryptChatContent, decryptChatContent } = require('../../common/utils/chat-crypto.util');

/**
 * Chat Service
 * Handles conversation and message management
 */

function toClientMessage(messageDoc) {
  if (!messageDoc) {
    return messageDoc;
  }

  const message = typeof messageDoc.toObject === 'function'
    ? messageDoc.toObject()
    : { ...messageDoc };

  if (typeof message.content === 'string') {
    try {
      // Giai ma truoc khi tra ve client de UI hien plaintext.
      message.content = decryptChatContent(message.content);
    } catch (error) {
      // Khong nem loi de tranh vo luong chat; hien thong bao de user biet.
      message.content = '[Tin nhắn không thể giải mã]';
    }
  }

  return message;
}

/**
 * Create or get existing conversation
 */
async function createConversation(buyerId, sellerId, productId) {
  // Validate that buyer and seller are different
  if (buyerId.toString() === sellerId.toString()) {
    throw new Error('Không thể tạo cuộc trò chuyện với chính mình');
  }
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }
  
  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    buyerId,
    sellerId,
    productId
  }).populate('productId', 'title price images status')
    .populate('buyerId', 'fullName avatar')
    .populate('sellerId', 'fullName avatar');
  
  if (conversation) {
    return conversation;
  }
  
  // Create new conversation
  conversation = await Conversation.create({
    buyerId,
    sellerId,
    productId
  });
  
  // Populate details
  await conversation.populate([
    { path: 'productId', select: 'title price images status' },
    { path: 'buyerId', select: 'fullName avatar' },
    { path: 'sellerId', select: 'fullName avatar' }
  ]);
  
  return conversation;
}

/**
 * Get user's conversations
 */
async function getConversations(userId, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  // Find conversations where user is buyer or seller
  const conversations = await Conversation.find({
    $or: [
      { buyerId: userId },
      { sellerId: userId }
    ],
    status: 'active'
  })
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('productId', 'title price images status')
    .populate('buyerId', 'fullName avatar')
    .populate('sellerId', 'fullName avatar');
  
  const total = await Conversation.countDocuments({
    $or: [
      { buyerId: userId },
      { sellerId: userId }
    ],
    status: 'active'
  });
  
  return {
    conversations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get conversation by ID
 */
async function getConversationById(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId)
    .populate('productId', 'title price images status')
    .populate('buyerId', 'fullName avatar')
    .populate('sellerId', 'fullName avatar');
  
  if (!conversation) {
    throw new Error('Cuộc trò chuyện không tồn tại');
  }
  
  // Check authorization
  if (conversation.buyerId._id.toString() !== userId.toString() && 
      conversation.sellerId._id.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền truy cập cuộc trò chuyện này');
  }
  
  return conversation;
}

/**
 * Get messages in a conversation
 */
async function getMessages(conversationId, userId, pagination = {}) {
  // Verify user has access to conversation
  await getConversationById(conversationId, userId);
  
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 50;
  const skip = (page - 1) * limit;
  
  const messages = await Message.find({ conversationId })
    .sort({ createdAt: -1 }) // Latest first
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'fullName avatar');
  
  const total = await Message.countDocuments({ conversationId });
  
  // Reverse to show oldest first
  messages.reverse();

  const normalizedMessages = messages.map(toClientMessage);
  
  return {
    messages: normalizedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Send a message
 */
async function sendMessage(conversationId, senderId, payload) {
  // payload ho tro 2 kieu: text truyen thong va object cho image.
  const isPayloadObject = payload && typeof payload === 'object';
  const messageType = isPayloadObject ? (payload.type || 'text') : 'text';
  const rawContent = isPayloadObject ? payload.content : payload;
  const content = String(rawContent || '').trim();
  const metadata = isPayloadObject ? (payload.metadata || null) : null;

  if (!['text', 'image'].includes(messageType)) {
    throw new Error('Loại tin nhắn không hợp lệ');
  }

  if (messageType === 'text') {
    if (!content) {
      throw new Error('Nội dung tin nhắn không được để trống');
    }

    if (content.length > 1000) {
      throw new Error('Tin nhắn không được vượt quá 1000 ký tự');
    }
  }

  if (messageType === 'image') {
    // Tin nhan anh bat buoc phai co imageUrl trong metadata.
    if (!metadata?.imageUrl) {
      throw new Error('Thiếu đường dẫn ảnh để gửi');
    }

    if (content.length > 500) {
      throw new Error('Chú thích ảnh không được vượt quá 500 ký tự');
    }
  }
  
  // Get conversation
  const conversation = await getConversationById(conversationId, senderId);
  
  // Create message
  const normalizedContent = messageType === 'image'
    ? (content || 'Đã gửi một ảnh')
    : content;

  const encryptedContent = encryptChatContent(normalizedContent);

  const message = await Message.create({
    conversationId,
    senderId,
    // Chi luu ciphertext trong DB.
    content: encryptedContent,
    type: messageType,
    metadata
  });
  
  // Update conversation
  // Preview doan chat hien "Hinh anh" de dung voi UX tin nhan anh.
  const conversationPreview = messageType === 'image'
    ? '📷 Hình ảnh'
    : normalizedContent;
  await conversation.updateLastMessage(conversationPreview);
  
  // Increment unread count for the other user
  const otherUserId = conversation.buyerId._id.toString() === senderId.toString() 
    ? conversation.sellerId._id 
    : conversation.buyerId._id;
  
  await conversation.incrementUnreadCount(otherUserId);
  
  // Populate sender details
  await message.populate('senderId', 'fullName avatar');
  
  return toClientMessage(message);
}

/**
 * Mark messages as read
 */
async function markMessagesAsRead(conversationId, userId) {
  // Verify user has access to conversation
  const conversation = await getConversationById(conversationId, userId);
  
  // Mark all unread messages as read
  await Message.markAllAsRead(conversationId, userId);
  
  // Reset unread count for this user
  await conversation.resetUnreadCount(userId);
  
  return { success: true };
}

/**
 * Get unread message count for user
 */
async function getUnreadCount(userId) {
  const conversations = await Conversation.find({
    $or: [
      { buyerId: userId },
      { sellerId: userId }
    ],
    status: 'active'
  });
  
  let totalUnread = 0;
  
  for (const conversation of conversations) {
    totalUnread += conversation.getUnreadCount(userId);
  }
  
  return totalUnread;
}

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount
};
