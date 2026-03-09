const chatService = require('./chat.service');
const jwt = require('jsonwebtoken');
const config = require('../../config/env');

/**
 * Socket.io Chat Handler
 * Handles real-time messaging
 */

// Store online users
const onlineUsers = new Map(); // userId -> socketId

/**
 * Initialize Socket.io for chat
 */
function initializeChatSocket(io) {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.userId;
    
    console.log(`✅ User connected: ${userId} (${socket.id})`);
    
    // Add user to online users
    onlineUsers.set(userId, socket.id);
    
    // Broadcast user online status
    socket.broadcast.emit('user_online', { userId });
    
    // Join conversation room
    socket.on('join_conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        // Verify user has access to conversation
        await chatService.getConversationById(conversationId, userId);
        
        // Join room
        socket.join(`conversation:${conversationId}`);
        
        console.log(`User ${userId} joined conversation ${conversationId}`);
        
        // Mark messages as read
        await chatService.markMessagesAsRead(conversationId, userId);
        
        socket.emit('joined_conversation', { conversationId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Leave conversation room
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });
    
    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content } = data;
        
        // Create message
        const message = await chatService.sendMessage(conversationId, userId, content);
        
        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('receive_message', {
          conversationId,
          message
        });
        
        // Get conversation to notify the other user
        const conversation = await chatService.getConversationById(conversationId, userId);
        const otherUserId = conversation.buyerId._id.toString() === userId 
          ? conversation.sellerId._id.toString() 
          : conversation.buyerId._id.toString();
        
        // Send notification to other user if they're online but not in the conversation
        const otherUserSocketId = onlineUsers.get(otherUserId);
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit('new_message_notification', {
            conversationId,
            message,
            sender: {
              _id: userId,
              fullName: message.senderId.fullName,
              avatar: message.senderId.avatar
            }
          });
        }
        
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Typing indicator
    socket.on('typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId
      });
    });
    
    // Stop typing indicator
    socket.on('stop_typing', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId
      });
    });
    
    // Mark messages as read
    socket.on('mark_as_read', async (data) => {
      try {
        const { conversationId } = data;
        await chatService.markMessagesAsRead(conversationId, userId);
        
        socket.emit('marked_as_read', { conversationId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${userId} (${socket.id})`);
      
      // Remove user from online users
      onlineUsers.delete(userId);
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', { userId });
    });
  });
  
  console.log('✅ Socket.io chat initialized');
}

/**
 * Get online users
 */
function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

/**
 * Check if user is online
 */
function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

module.exports = {
  initializeChatSocket,
  getOnlineUsers,
  isUserOnline
};
