const Order = require('./order.model');
const PurchaseRequest = require('./purchase-request.model');
const Product = require('../products/product.model');
const User = require('../users/user.model');
const Conversation = require('../chat/conversation.model');
const Message = require('../chat/message.model');
const { emitMessageToConversation, emitToUser } = require('../chat/chat.socket');
const { encryptChatContent, decryptChatContent } = require('../../common/utils/chat-crypto.util');
const notificationService = require('../notifications/notification.service');
const mongoose = require('mongoose');

/**
 * Order Service
 * Handles purchase requests and order management
 */

/**
 * Chuẩn hóa message offer để trả về client ở dạng plaintext,
 * trong khi dữ liệu trong DB vẫn lưu encrypted.
 */
function normalizeOfferMessageForClient(messageDoc) {
  if (!messageDoc) {
    return null;
  }

  const message = typeof messageDoc.toObject === 'function'
    ? messageDoc.toObject()
    : { ...messageDoc };

  const rawContent = typeof message.content === 'string' ? message.content : '';

  return {
    ...message,
    content: rawContent ? decryptChatContent(rawContent) : rawContent,
    conversation:
      message?.conversationId?.toString?.() ||
      message?.conversationId ||
      message?.conversation
  };
}

/**
 * Create a purchase request or direct order (for quick buy)
 */
async function createPurchaseRequest(buyerId, listingId, message, agreedPrice) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Validate inputs
    if (!message || message.trim().length === 0) {
      throw new Error('Tin nhắn không được để trống');
    }
    
    if (!agreedPrice || agreedPrice <= 0) {
      throw new Error('Giá đề nghị phải lớn hơn 0');
    }
    
    // Get product details
    const product = await Product.findById(listingId).session(session);
    
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }
    
    if (product.status !== 'active') {
      throw new Error('Sản phẩm không còn khả dụng');
    }
    
    // Check if buyer is trying to buy their own product
    if (product.seller.toString() === buyerId.toString()) {
      throw new Error('Bạn không thể mua sản phẩm của chính mình');
    }
    
    const buyer = await User.findById(buyerId).session(session);
    if (!buyer) {
      throw new Error('Người mua không tồn tại');
    }

    const buyerPhone = String(buyer.phone || '').trim();
    const buyerAddress = String(buyer.address || '').trim();
    if (!buyerPhone || !buyerAddress) {
      throw new Error('Vui lòng cập nhật số điện thoại và địa chỉ trước khi mua hàng');
    }

    const isQuickBuy = message.trim() === 'Mua ngay';
    
    // For quick buy, bypass pending request check and create order directly
    if (isQuickBuy) {
      // Calculate fees
      const platformFee = calculatePlatformFee(agreedPrice);
      const totalToPay = agreedPrice;
      
      // Create order directly
      const order = new Order({
        buyerId: buyerId,
        sellerId: product.seller,
        productId: listingId,
        agreedAmount: agreedPrice,
        platformFee: platformFee,
        totalToPay: totalToPay,
        status: 'awaiting_seller_confirmation',
        paymentStatus: 'unpaid',
        shippingRecipientName: String(buyer.fullName || '').trim(),
        shippingPhone: buyerPhone,
        shippingAddress: buyerAddress
      });
      await order.save({ session });
      
      // Update product status to pending (reserved)
      product.status = 'pending';
      await product.save({ session });
      
      // Create a reference purchase request for tracking (status: accepted)
      const purchaseRequest = new PurchaseRequest({
        listingId: listingId,
        buyerId: buyerId,
        sellerId: product.seller,
        message: message.trim(),
        agreedPrice: agreedPrice,
        status: 'accepted',
        acceptedAt: new Date(),
        initiatedBy: 'buyer'
      });
      await purchaseRequest.save({ session });
      
      await session.commitTransaction();
      
      // Populate and return order
      await order.populate([
        { path: 'buyerId', select: 'fullName email avatar' },
        { path: 'sellerId', select: 'fullName email' },
        { path: 'productId', select: 'title price images' }
      ]);

      try {
        await notificationService.createNotification(product.seller, {
          type: 'order_created',
          orderId: order._id,
          senderId: buyerId,
          title: 'Bạn có đơn mua mới',
          message: `Người mua ${buyer.fullName || 'khách hàng'} vừa tạo đơn cho "${product.title}". Vui lòng xác nhận đơn.`
        });
      } catch (notificationError) {
        console.error('Error sending quick-buy order notification:', notificationError);
      }
      
      return order;
    }
    
    // For normal purchase request, check if there's already a pending request
    const existingRequest = await PurchaseRequest.findOne({
      listingId: listingId,
      buyerId: buyerId,
      status: 'pending'
    }).session(session);
    
    if (existingRequest) {
      throw new Error('Bạn đã gửi yêu cầu mua sản phẩm này rồi');
    }
    
    // Create purchase request
    const purchaseRequest = new PurchaseRequest({
      listingId: listingId,
      buyerId: buyerId,
      sellerId: product.seller,
      message: message.trim(),
      agreedPrice: agreedPrice,
      initiatedBy: 'buyer'
    });
    await purchaseRequest.save({ session });
    
    await session.commitTransaction();
    
    // Populate details
    await purchaseRequest.populate([
      { path: 'listingId', select: 'title price images' },
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email' }
    ]);

    try {
      await notificationService.createNotification(product.seller, {
        type: 'order_created',
        senderId: buyerId,
        title: 'Bạn nhận được yêu cầu mua mới',
        message: `${buyer.fullName || 'Một người dùng'} vừa gửi yêu cầu mua cho sản phẩm "${product.title}".`
      });
    } catch (notificationError) {
      console.error('Error sending purchase-request notification:', notificationError);
    }
    
    return purchaseRequest;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get purchase requests (sent by buyer)
 */
async function getSentPurchaseRequests(buyerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {
    buyerId,
    initiatedBy: filters.initiatedBy || 'buyer'
  };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const requests = await PurchaseRequest.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('listingId', 'title price images status')
    .populate('sellerId', 'fullName avatar rating');
  
  const total = await PurchaseRequest.countDocuments(query);
  
  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Get purchase requests (received by seller)
 */
async function getReceivedPurchaseRequests(sellerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = {
    sellerId,
    initiatedBy: filters.initiatedBy || 'buyer'
  };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const requests = await PurchaseRequest.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('listingId', 'title price images status')
    .populate('buyerId', 'fullName avatar rating');
  
  const total = await PurchaseRequest.countDocuments(query);
  
  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Calculate platform fee (5%)
 */
function calculatePlatformFee(amount) {
  return Math.round(amount * 0.05);
}

/**
 * Accept purchase request and create order
 */
async function acceptPurchaseRequest(requestId, sellerId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get purchase request
    const request = await PurchaseRequest.findById(requestId).session(session);
    
    if (!request) {
      throw new Error('Yêu cầu mua hàng không tồn tại');
    }
    
    // Verify actor based on who initiated the request
    const initiatedBy = request.initiatedBy || 'buyer';
    const isBuyerInitiated = initiatedBy === 'buyer';
    const canAccept = isBuyerInitiated
      ? request.sellerId.toString() === sellerId.toString()
      : request.buyerId.toString() === sellerId.toString();

    if (!canAccept) {
      throw new Error(
        isBuyerInitiated
          ? 'Bạn không có quyền chấp nhận yêu cầu này'
          : 'Bạn không có quyền chấp nhận đề nghị này'
      );
    }
    
    // Check if request is still pending
    if (request.status !== 'pending') {
      throw new Error('Yêu cầu này đã được xử lý rồi');
    }
    
    // Get product
    const product = await Product.findById(request.listingId).session(session);
    
    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }
    
    if (product.status !== 'active') {
      throw new Error('Sản phẩm không còn khả dụng');
    }
    
    // Calculate fees
    const buyer = await User.findById(request.buyerId).session(session);
    if (!buyer) {
      throw new Error('Người mua không tồn tại');
    }

    const buyerPhone = String(buyer.phone || '').trim();
    const buyerAddress = String(buyer.address || '').trim();
    if (!buyerPhone || !buyerAddress) {
      throw new Error('Người mua phải cập nhật số điện thoại và địa chỉ trước khi tạo đơn hàng');
    }

    const agreedAmount = request.agreedPrice;
    const platformFee = calculatePlatformFee(agreedAmount);
    const totalToPay = agreedAmount;
    const skipSellerConfirmation = isBuyerInitiated;
    
    // Create order
    const order = await Order.create([{
      requestId: request._id,
      buyerId: request.buyerId,
      sellerId: request.sellerId,
      productId: request.listingId,
      agreedAmount: agreedAmount,
      platformFee: platformFee,
      totalToPay: totalToPay,
      status: skipSellerConfirmation ? 'awaiting_payment' : 'awaiting_seller_confirmation',
      confirmedBySeller: skipSellerConfirmation,
      confirmedBySellerAt: skipSellerConfirmation ? new Date() : null,
      paymentStatus: 'unpaid',
      shippingRecipientName: String(buyer.fullName || '').trim(),
      shippingPhone: buyerPhone,
      shippingAddress: buyerAddress
    }], { session });
    
    // Update purchase request status
    request.status = 'accepted';
    request.acceptedAt = new Date();
    await request.save({ session });

    await Message.updateOne(
      {
        type: 'offer',
        'metadata.purchaseRequestId': request._id
      },
      {
        $set: {
          'metadata.status': 'accepted',
          'metadata.respondedAt': new Date(),
          'metadata.respondedBy': sellerId.toString()
        }
      },
      { session }
    );
    
    // Update product status to pending (reserved)
    product.status = 'pending';
    await product.save({ session });
    
    await session.commitTransaction();
    
    // Populate order details
    await order[0].populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);

    // Push updated offer status to chat in real-time
    try {
      const updatedOfferMessage = await Message.findOne({
        type: 'offer',
        'metadata.purchaseRequestId': request._id
      }).populate('senderId', 'fullName avatar');

      if (updatedOfferMessage?.conversationId) {
        const normalizedMessage = normalizeOfferMessageForClient(updatedOfferMessage);
        emitMessageToConversation(updatedOfferMessage.conversationId.toString(), normalizedMessage);
      }
    } catch (emitError) {
      console.error('Error emitting accepted offer update:', emitError);
    }

    // Send notification to the user who needs to take next action
    try {
      const buyer = await User.findById(request.buyerId, 'fullName');
      const product = await Product.findById(request.listingId, 'title');

      if (skipSellerConfirmation) {
        await notificationService.createNotification(
          request.buyerId,
          {
            type: 'order_confirmed',
            orderId: order[0]._id,
            senderId: request.sellerId,
            title: 'Đề nghị giá đã được chấp nhận',
            message: `Người bán đã chấp nhận đề nghị cho "${product?.title}". Bạn có thể thanh toán ngay.`
          }
        );
      } else {
        await notificationService.createNotification(
          request.sellerId,
          {
            type: 'order_created',
            orderId: order[0]._id,
            senderId: request.buyerId,
            title: 'Đơn mua mới từ ' + (buyer?.fullName || 'Người dùng'),
            message: `Có đơn mua mới cho sản phẩm "${product?.title}" với giá ${order[0].totalToPay.toLocaleString('vi-VN')}đ. Vui lòng xác nhận.`
          }
        );
      }
    } catch (error) {
      console.error('Error sending order notification:', error);
    }
    
    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Reject purchase request
 */
async function rejectPurchaseRequest(requestId, sellerId, reason = '') {
  // Get purchase request
  const request = await PurchaseRequest.findById(requestId);
  
  if (!request) {
    throw new Error('Yêu cầu mua hàng không tồn tại');
  }
  
  // Verify actor based on who initiated the request
  const initiatedBy = request.initiatedBy || 'buyer';
  const isBuyerInitiated = initiatedBy === 'buyer';
  const canReject = isBuyerInitiated
    ? request.sellerId.toString() === sellerId.toString()
    : request.buyerId.toString() === sellerId.toString();

  if (!canReject) {
    throw new Error(
      isBuyerInitiated
        ? 'Bạn không có quyền từ chối yêu cầu này'
        : 'Bạn không có quyền từ chối đề nghị này'
    );
  }
  
  // Check if request is still pending
  if (request.status !== 'pending') {
    throw new Error('Yêu cầu này đã được xử lý rồi');
  }
  
  // Update request status
  request.status = 'rejected';
  request.rejectedAt = new Date();
  request.sellerResponse = reason;
  await request.save();

  await Message.updateOne(
    {
      type: 'offer',
      'metadata.purchaseRequestId': request._id
    },
    {
      $set: {
        'metadata.status': 'rejected',
        'metadata.respondedAt': new Date(),
        'metadata.respondedBy': sellerId.toString(),
        'metadata.reason': reason || ''
      }
    }
  );

  // Push updated offer status to chat in real-time
  try {
    const updatedOfferMessage = await Message.findOne({
      type: 'offer',
      'metadata.purchaseRequestId': request._id
    }).populate('senderId', 'fullName avatar');

    if (updatedOfferMessage?.conversationId) {
      const normalizedMessage = normalizeOfferMessageForClient(updatedOfferMessage);
      emitMessageToConversation(updatedOfferMessage.conversationId.toString(), normalizedMessage);
    }
  } catch (emitError) {
    console.error('Error emitting rejected offer update:', emitError);
  }

  try {
    const receiverId = isBuyerInitiated ? request.buyerId : request.sellerId;
    const product = await Product.findById(request.listingId, 'title');
    const responder = await User.findById(sellerId, 'fullName');

    await notificationService.createNotification(receiverId, {
      type: 'system',
      senderId: sellerId,
      title: 'Đề nghị đã bị từ chối',
      message: `${responder?.fullName || 'Người dùng'} đã từ chối đề nghị cho sản phẩm "${product?.title || 'Sản phẩm'}".${reason ? ` Lý do: ${reason}` : ''}`
    });
  } catch (notificationError) {
    console.error('Error sending rejected-offer notification:', notificationError);
  }
  
  return request;
}

/**
 * Seller creates an offer directly in a conversation.
 * Buyer can accept/reject this offer using existing accept/reject endpoints.
 */
async function createSellerOfferFromConversation(sellerId, conversationId, message, agreedPrice) {
  if (!conversationId) {
    throw new Error('Thiếu cuộc trò chuyện để gửi đề nghị');
  }

  if (!agreedPrice || Number(agreedPrice) <= 0) {
    throw new Error('Giá đề nghị phải lớn hơn 0');
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('productId', 'title price images status seller')
    .populate('buyerId', 'fullName avatar')
    .populate('sellerId', 'fullName avatar');

  if (!conversation) {
    throw new Error('Cuộc trò chuyện không tồn tại');
  }

  if (conversation.sellerId._id.toString() !== sellerId.toString()) {
    throw new Error('Chỉ người bán trong cuộc trò chuyện mới được gửi đề nghị');
  }

  const listingId = conversation.productId?._id || conversation.productId;
  const buyerId = conversation.buyerId?._id || conversation.buyerId;

  const product = await Product.findById(listingId);
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }

  if (product.status !== 'active') {
    throw new Error('Sản phẩm không còn khả dụng để tạo đề nghị');
  }

  if (product.seller.toString() !== sellerId.toString()) {
    throw new Error('Bạn không phải chủ sở hữu sản phẩm này');
  }

  const existingOffer = await PurchaseRequest.findOne({
    listingId,
    buyerId,
    sellerId,
    status: 'pending',
    initiatedBy: 'seller'
  });

  if (existingOffer) {
    throw new Error('Bạn đã gửi một đề nghị đang chờ phản hồi cho cuộc trò chuyện này');
  }

  const offerMessage = message && message.trim().length > 0
    ? message.trim()
    : 'Người bán đã gửi đề nghị mua hàng cho bạn.';

  const purchaseRequest = await PurchaseRequest.create({
    listingId,
    buyerId,
    sellerId,
    message: offerMessage,
    agreedPrice: Number(agreedPrice),
    initiatedBy: 'seller'
  });

  await purchaseRequest.populate([
    { path: 'listingId', select: 'title price images' },
    { path: 'buyerId', select: 'fullName email avatar' },
    { path: 'sellerId', select: 'fullName email avatar' }
  ]);

  const chatMessage = await Message.create({
    conversationId,
    senderId: sellerId,
    content: encryptChatContent(offerMessage),
    type: 'offer',
    metadata: {
      purchaseRequestId: purchaseRequest._id,
      agreedPrice: Number(agreedPrice),
      listingId,
      initiatedBy: 'seller',
      status: 'pending'
    }
  });

  await chatMessage.populate('senderId', 'fullName avatar');

  await conversation.updateLastMessage(`Người bán gửi đề nghị: ${Number(agreedPrice).toLocaleString('vi-VN')}đ`);
  await conversation.incrementUnreadCount(buyerId);

  const normalizedMessage = normalizeOfferMessageForClient(chatMessage);

  emitMessageToConversation(conversationId, normalizedMessage);

  emitToUser(buyerId.toString(), 'new_message_notification', {
    conversationId,
    message: normalizedMessage,
    sender: {
      _id: sellerId.toString(),
      fullName: chatMessage.senderId?.fullName,
      avatar: chatMessage.senderId?.avatar
    }
  });

  return {
    request: purchaseRequest,
    chatMessage: normalizedMessage
  };
}

/**
 * Buyer creates an offer directly in a conversation.
 * Seller can accept/reject this offer using existing accept/reject endpoints.
 */
async function createBuyerOfferFromConversation(buyerId, conversationId, message, agreedPrice) {
  if (!conversationId) {
    throw new Error('Thiếu cuộc trò chuyện để gửi đề nghị');
  }

  if (!agreedPrice || Number(agreedPrice) <= 0) {
    throw new Error('Giá đề nghị phải lớn hơn 0');
  }

  const conversation = await Conversation.findById(conversationId)
    .populate('productId', 'title price images status seller')
    .populate('buyerId', 'fullName avatar')
    .populate('sellerId', 'fullName avatar');

  if (!conversation) {
    throw new Error('Cuộc trò chuyện không tồn tại');
  }

  if (conversation.buyerId._id.toString() !== buyerId.toString()) {
    throw new Error('Chỉ người mua trong cuộc trò chuyện mới được gửi đề nghị giá');
  }

  const listingId = conversation.productId?._id || conversation.productId;
  const sellerId = conversation.sellerId?._id || conversation.sellerId;

  const product = await Product.findById(listingId);
  if (!product) {
    throw new Error('Sản phẩm không tồn tại');
  }

  if (product.status !== 'active') {
    throw new Error('Sản phẩm không còn khả dụng để tạo đề nghị');
  }

  const existingOffer = await PurchaseRequest.findOne({
    listingId,
    buyerId,
    sellerId,
    status: 'pending',
    initiatedBy: 'buyer'
  });

  if (existingOffer) {
    throw new Error('Bạn đã gửi một đề nghị giá đang chờ phản hồi cho cuộc trò chuyện này');
  }

  const offerMessage = message && message.trim().length > 0
    ? message.trim()
    : 'Người mua đã gửi đề nghị giá cho bạn.';

  const purchaseRequest = await PurchaseRequest.create({
    listingId,
    buyerId,
    sellerId,
    message: offerMessage,
    agreedPrice: Number(agreedPrice),
    initiatedBy: 'buyer'
  });

  await purchaseRequest.populate([
    { path: 'listingId', select: 'title price images' },
    { path: 'buyerId', select: 'fullName email avatar' },
    { path: 'sellerId', select: 'fullName email avatar' }
  ]);

  const chatMessage = await Message.create({
    conversationId,
    senderId: buyerId,
    content: encryptChatContent(offerMessage),
    type: 'offer',
    metadata: {
      purchaseRequestId: purchaseRequest._id,
      agreedPrice: Number(agreedPrice),
      listingId,
      initiatedBy: 'buyer',
      status: 'pending'
    }
  });

  await chatMessage.populate('senderId', 'fullName avatar');

  await conversation.updateLastMessage(`Người mua đề nghị giá: ${Number(agreedPrice).toLocaleString('vi-VN')}đ`);
  await conversation.incrementUnreadCount(sellerId);

  const normalizedMessage = normalizeOfferMessageForClient(chatMessage);

  emitMessageToConversation(conversationId, normalizedMessage);

  emitToUser(sellerId.toString(), 'new_message_notification', {
    conversationId,
    message: normalizedMessage,
    sender: {
      _id: buyerId.toString(),
      fullName: chatMessage.senderId?.fullName,
      avatar: chatMessage.senderId?.avatar
    }
  });

  return {
    request: purchaseRequest,
    chatMessage: normalizedMessage
  };
}

/**
 * Get order by ID
 */
async function getOrderById(orderId, userId) {
  const order = await Order.findById(orderId)
    .populate('requestId', 'initiatedBy')
    .populate('buyerId', 'fullName email phone address avatar rating')
    .populate('sellerId', 'fullName email phone address avatar rating')
    .populate({
      path: 'productId',
      select: 'title description price images condition location category',
      populate: { path: 'category', select: 'name' }
    })
    .lean();
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Check authorization (buyer or seller only)
  if (order.buyerId._id.toString() !== userId.toString() && 
      order.sellerId._id.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền xem đơn hàng này');
  }

  const isBuyerInitiatedRequest = order?.requestId?.initiatedBy === 'buyer';
  const shouldSkipSellerConfirmStep =
    order.status === 'awaiting_seller_confirmation' &&
    (isBuyerInitiatedRequest || order.confirmedBySeller);
  const normalizedOrderStatus = shouldSkipSellerConfirmStep
    ? 'pending'
    : (order.status === 'awaiting_payment' ? 'pending' : order.status);
  
  // Transform the data to match frontend expectations
  const transformedOrder = {
    ...order,
    buyer: order.buyerId,
    seller: order.sellerId,
    listing: order.productId,
    agreedPrice: order.agreedAmount,
    totalAmount: order.totalToPay,
    platformFee: order.platformFee,
    status: normalizedOrderStatus,
    // Add shipping info if exists
    shipping: (order.trackingNumber || order.shippingRecipientName || order.shippingPhone || order.shippingAddress) ? {
      provider: order.shippingProvider,
      trackingNumber: order.trackingNumber,
      estimatedDelivery: order.estimatedDelivery,
      recipientName: order.shippingRecipientName,
      phone: order.shippingPhone,
      address: order.shippingAddress
    } : null
  };
  
  return transformedOrder;
}

/**
 * Get orders as buyer
 */
async function getOrdersAsBuyer(buyerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = { buyerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('requestId', 'initiatedBy')
    .populate('sellerId', 'fullName avatar rating')
    .populate({
      path: 'productId',
      select: 'title price images condition location category',
      populate: { path: 'category', select: 'name' }
    })
    .lean();
  
  // Transform the data to match frontend expectations
  const transformedOrders = orders.map(order => {
    const isBuyerInitiatedRequest = order?.requestId?.initiatedBy === 'buyer';
    const shouldSkipSellerConfirmStep =
      order.status === 'awaiting_seller_confirmation' &&
      (isBuyerInitiatedRequest || order.confirmedBySeller);
    const normalizedOrderStatus = shouldSkipSellerConfirmStep
      ? 'pending'
      : (order.status === 'awaiting_payment' ? 'pending' : order.status);

    return {
      ...order,
      seller: order.sellerId,
      listing: order.productId,
      agreedPrice: order.agreedAmount,
      totalAmount: order.totalToPay,
      status: normalizedOrderStatus
    };
  });
  
  const total = await Order.countDocuments(query);
  
  return {
    orders: transformedOrders,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total
  };
}

/**
 * Get orders as seller
 */
async function getOrdersAsSeller(sellerId, filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;
  
  const query = { sellerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('requestId', 'initiatedBy')
    .populate('buyerId', 'fullName avatar rating')
    .populate({
      path: 'productId',
      select: 'title price images condition location category',
      populate: { path: 'category', select: 'name' }
    })
    .lean();
  
  // Transform the data to match frontend expectations
  const transformedOrders = orders.map(order => {
    const isBuyerInitiatedRequest = order?.requestId?.initiatedBy === 'buyer';
    const shouldSkipSellerConfirmStep =
      order.status === 'awaiting_seller_confirmation' && isBuyerInitiatedRequest;

    return {
      ...order,
      buyer: order.buyerId,
      listing: order.productId,
      agreedPrice: order.agreedAmount,
      totalAmount: order.totalToPay,
      status: shouldSkipSellerConfirmStep ? 'awaiting_payment' : order.status,
      confirmedBySeller: shouldSkipSellerConfirmStep ? true : order.confirmedBySeller
    };
  });
  
  const total = await Order.countDocuments(query);
  
  return {
    orders: transformedOrders,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalOrders: total
  };
}

/**
 * Update order status
 */
async function updateOrderStatus(orderId, newStatus, userId) {
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Check authorization
  if (order.buyerId.toString() !== userId.toString() && 
      order.sellerId.toString() !== userId.toString()) {
    throw new Error('Bạn không có quyền cập nhật đơn hàng này');
  }
  
  order.status = newStatus;
  await order.save();
  
  return order;
}
/**
 * Lấy danh sách toàn bộ đơn hàng (Dành cho Moderator/Admin)
 */
async function getAllOrders(filters = {}, pagination = {}) {
  const page = parseInt(pagination.page) || 1;
  const limit = parseInt(pagination.limit) || 20;
  const skip = (page - 1) * limit;

  // Lấy danh sách kèm theo thông tin người mua, người bán và sản phẩm
  const orders = await Order.find(filters)
    .sort({ createdAt: -1 }) // Đơn mới nhất lên đầu
    .skip(skip)
    .limit(limit)
    .populate('buyerId', 'fullName email avatar')
    .populate('sellerId', 'fullName email avatar')
    .populate('productId', 'title price images');

  const total = await Order.countDocuments(filters);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Ép hủy đơn hàng (Dành cho Moderator/Admin)
 * Chú ý: Có sử dụng Transaction để đảm bảo tính toàn vẹn dữ liệu tiền bạc
 */
async function forceCancelOrder(orderId, moderatorId, reason) {
  // Bắt đầu một session để đảm bảo nếu lỗi thì rollback lại toàn bộ
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    // Không thể hủy đơn đã hoàn thành hoặc đã hủy
    if (order.status === 'completed' || order.status === 'cancelled') {
      if (order.status === 'completed') {
        throw new Error('Không thể hủy đơn hàng đã hoàn thành');
      }
      throw new Error('Đơn hàng đã ở trạng thái hủy');
    }

    // QUAN TRỌNG: Nếu đơn hàng ĐÃ THANH TOÁN (Tiền đang nằm trong Escrow)
    // Thì phải hoàn tiền lại cho người mua (Buyer)
    if (order.paymentStatus === 'paid') {
      const escrowService = require('../payments/escrow.service');
      await escrowService.refundFunds(
        orderId,
        `Hủy bởi quản trị viên. Lý do: ${reason}`
      );
    }

    // Cập nhật trạng thái đơn thành "Đã hủy"
    order.status = 'cancelled';
    
    // Nếu Model Order của bạn có trường ghi chú hủy đơn thì lưu lại
    if (order.schema.paths.cancelReason !== undefined) {
      order.cancelReason = reason;
    }

    if (order.productId) {
      const product = await Product.findById(order.productId).session(session);
      if (product && ['pending', 'sold'].includes(product.status)) {
        product.status = 'active';
        await product.save({ session });
      }
    }

    await order.save({ session });
    
    // Lưu thành công toàn bộ thay đổi
    await session.commitTransaction();

    try {
      const product = order.productId
        ? await Product.findById(order.productId, 'title')
        : null;

      await Promise.all([
        notificationService.createNotification(order.buyerId, {
          type: 'system',
          orderId: order._id,
          senderId: moderatorId,
          title: 'Đơn hàng đã bị hủy',
          message: `Đơn hàng ${product?.title ? `"${product.title}" ` : ''}đã bị hủy bởi quản trị viên. Lý do: ${reason}`
        }),
        notificationService.createNotification(order.sellerId, {
          type: 'system',
          orderId: order._id,
          senderId: moderatorId,
          title: 'Đơn hàng đã bị hủy',
          message: `Đơn hàng ${product?.title ? `"${product.title}" ` : ''}đã bị hủy bởi quản trị viên. Lý do: ${reason}`
        })
      ]);
    } catch (notificationError) {
      console.error('Error sending force-cancel notifications:', notificationError);
    }

    return order;
  } catch (error) {
    // Nếu có lỗi xảy ra ở bất kỳ đâu (đặc biệt là lúc hoàn tiền), Hủy bỏ toàn bộ thao tác
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Seller confirms order - changes status from awaiting_seller_confirmation to awaiting_payment
 */
async function confirmOrderBySeller(orderId, sellerId) {
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new Error('Đơn hàng không tồn tại');
  }
  
  // Check authorization - only seller can confirm
  if (order.sellerId.toString() !== sellerId.toString()) {
    throw new Error('Bạn không có quyền xác nhận đơn hàng này');
  }
  
  // Check order status
  if (order.status !== 'awaiting_seller_confirmation') {
    throw new Error('Đơn hàng không ở trạng thái chờ xác nhận từ người bán');
  }
  
  // Update order status
  order.status = 'awaiting_payment';
  order.confirmedBySeller = true;
  order.confirmedBySellerAt = new Date();
  await order.save();

  try {
    await notificationService.createNotification(order.buyerId, {
      type: 'order_confirmed',
      orderId: order._id,
      senderId: sellerId,
      title: 'Đơn mua đã được người bán xác nhận',
      message: 'Người bán đã xác nhận đơn hàng của bạn. Bạn có thể tiến hành thanh toán ngay.'
    });
  } catch (error) {
    console.error('Error sending order confirmed notification:', error);
  }
  
  // Populate order details
  await order.populate([
    { path: 'buyerId', select: 'fullName email avatar' },
    { path: 'sellerId', select: 'fullName email avatar' },
    { path: 'productId', select: 'title price images' }
  ]);
  
  return order;
}

module.exports = {
  createPurchaseRequest,
  createSellerOfferFromConversation,
  createBuyerOfferFromConversation,
  getSentPurchaseRequests,
  getReceivedPurchaseRequests,
  acceptPurchaseRequest,
  rejectPurchaseRequest,
  calculatePlatformFee,
  getOrderById,
  getOrdersAsBuyer,
  getOrdersAsSeller,
  updateOrderStatus,
  confirmOrderBySeller,
  payOrder,
  confirmShipment,
  confirmReceipt,
  getAllOrders,     
  forceCancelOrder  
};
/**
 * Pay for an order (simplified version without wallet integration)
 */
async function payOrder(orderId, buyerId) {
  try {
    // Get order details
    const order = await Order.findById(orderId).populate('requestId', 'initiatedBy');
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }
    
    // Verify buyer
    if (order.buyerId.toString() !== buyerId.toString()) {
      throw new Error('Bạn không có quyền thanh toán đơn hàng này');
    }
    
    // Normalize legacy transition: buyer-initiated offers can skip seller confirm step.
    const isBuyerInitiatedRequest = order?.requestId?.initiatedBy === 'buyer';
    const canSkipSellerConfirm =
      order.status === 'awaiting_seller_confirmation' &&
      (isBuyerInitiatedRequest || order.confirmedBySeller);

    if (canSkipSellerConfirm) {
      order.status = 'awaiting_payment';
      order.confirmedBySeller = true;
      order.confirmedBySellerAt = order.confirmedBySellerAt || new Date();
      await order.save();
    }

    // Check order status
    if (!['awaiting_payment', 'pending'].includes(order.status)) {
      throw new Error('Đơn hàng không ở trạng thái chờ thanh toán');
    }
    
    if (order.paymentStatus !== 'unpaid') {
      throw new Error('Đơn hàng đã được thanh toán rồi');
    }
    
    // Import escrow service
    const escrowService = require('../payments/escrow.service');

    // Hold funds in escrow and deduct buyer wallet in one flow.
    const escrowHold = await escrowService.holdFunds(orderId, buyerId, order.totalToPay);

    const paidOrder = await Order.findById(orderId);
    paidOrder.escrowHoldId = escrowHold._id;
    await paidOrder.save();
    
    // Populate order details
    await paidOrder.populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);
    
    return paidOrder;
  } catch (error) {
    throw error;
  }
}

function generateTrackingNumber(order) {
  const provider = String(order?.shippingProvider || 'SYS').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'SYS';
  const orderCode = String(order?.orderCode || order?._id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const orderSuffix = orderCode.slice(-6) || Math.random().toString(36).slice(2, 8).toUpperCase();
  const randomSuffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${provider}-${orderSuffix}-${randomSuffix}`;
}
/**
 * Confirm shipment (seller action)
 */
async function confirmShipment(orderId, sellerId, shipmentData = {}) {
  try {
    // Get order
    const order = await Order.findById(orderId);
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }
    
    // Verify seller
    if (order.sellerId.toString() !== sellerId.toString()) {
      throw new Error('Bạn không có quyền xác nhận giao hàng cho đơn hàng này');
    }
    
    // Check order status
    if (order.status !== 'paid') {
      throw new Error('Đơn hàng chưa được thanh toán');
    }
    
    // Update order status
    order.status = 'shipped';
    order.shippedAt = new Date();
    
    // Add shipment information if provided
    if (shipmentData.trackingNumber) {
      order.trackingNumber = shipmentData.trackingNumber;
    }
    if (shipmentData.shippingProvider) {
      order.shippingProvider = shipmentData.shippingProvider;
    }

    const shippingRecipientName = String(
      shipmentData.shippingRecipientName || order.shippingRecipientName || ''
    ).trim();
    const shippingPhone = String(
      shipmentData.shippingPhone || order.shippingPhone || ''
    ).trim();
    const shippingAddress = String(
      shipmentData.shippingAddress || order.shippingAddress || ''
    ).trim();

    if (!shippingRecipientName || !shippingPhone || !shippingAddress) {
      throw new Error('Thông tin giao hàng phải đầy đủ người nhận, số điện thoại và địa chỉ');
    }

    order.shippingRecipientName = shippingRecipientName;
    order.shippingPhone = shippingPhone;
    order.shippingAddress = shippingAddress;

    if (!order.trackingNumber) {
      order.trackingNumber = generateTrackingNumber(order);
    }
    if (shipmentData.estimatedDelivery) {
      order.estimatedDelivery = new Date(shipmentData.estimatedDelivery);
    }
    
    await order.save();
    
    // Populate order details
    await order.populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);

    try {
      await notificationService.createNotification(order.buyerId._id, {
        type: 'order_shipped',
        orderId: order._id,
        senderId: sellerId,
        title: 'Đơn hàng đang được giao',
        message: 'Người bán đã xác nhận giao hàng. Bạn có thể theo dõi tiến trình trong chi tiết đơn hàng.'
      });
    } catch (notificationError) {
      console.error('Error sending shipped notification:', notificationError);
    }
    
    return order;
  } catch (error) {
    throw error;
  }
}

/**
 * Confirm receipt (buyer action) - releases funds to seller
 */
async function confirmReceipt(orderId, buyerId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Get order
    const order = await Order.findById(orderId).session(session);
    
    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }
    
    // Verify buyer
    if (order.buyerId.toString() !== buyerId.toString()) {
      throw new Error('Bạn không có quyền xác nhận nhận hàng cho đơn hàng này');
    }
    
    // Check order status
    if (order.status !== 'shipped') {
      throw new Error('Đơn hàng chưa được giao');
    }
    
    // Import escrow service
    const escrowService = require('../payments/escrow.service');
    
    // Release funds from escrow to seller
    await escrowService.releaseFunds(orderId, 'Buyer confirmed receipt');
    
    // Update order status
    order.status = 'completed';
    order.completedAt = new Date();
    await order.save({ session });

    // Mark listing as sold so it no longer appears as an available post.
    const product = await Product.findById(order.productId).session(session);
    if (product && product.status !== 'sold') {
      product.status = 'sold';
      await product.save({ session });
    }
    
    await session.commitTransaction();
    
    // Populate order details
    await order.populate([
      { path: 'buyerId', select: 'fullName email avatar' },
      { path: 'sellerId', select: 'fullName email avatar' },
      { path: 'productId', select: 'title price images' }
    ]);

    try {
      await notificationService.createNotification(order.sellerId._id, {
        type: 'order_completed',
        orderId: order._id,
        senderId: buyerId,
        title: 'Đơn hàng đã hoàn tất',
        message: `Người mua đã xác nhận nhận hàng cho đơn "${order.productId?.title || 'Sản phẩm'}".`
      });
    } catch (notificationError) {
      console.error('Error sending completed notification:', notificationError);
    }
    
    return order;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
