const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { authenticate } = require('../../common/middlewares/auth.middleware');
const { uploadEvidence, handleUploadError } = require('../../common/middlewares/upload.middleware');

// All chat routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/chat/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get('/conversations', chatController.getConversations);

/**
 * @route   GET /api/chat/conversations/:id
 * @desc    Get conversation by ID
 * @access  Private
 */
router.get('/conversations/:id', chatController.getConversationById);

/**
 * @route   GET /api/chat/conversations/:id/messages
 * @desc    Get messages in a conversation
 * @access  Private
 */
router.get('/conversations/:id/messages', chatController.getMessages);

/**
 * @route   POST /api/chat/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post('/conversations', chatController.createConversation);

/**
 * @route   POST /api/chat/messages
 * @desc    Send a message (REST fallback)
 * @access  Private
 */
router.post('/messages', chatController.sendMessage);

/**
 * @route   POST /api/chat/messages/upload-image
 * @desc    Upload image for chat
 * @access  Private
 */
router.post(
	'/messages/upload-image',
	uploadEvidence.single('image'),
	handleUploadError,
	chatController.uploadChatImage
);

module.exports = router;