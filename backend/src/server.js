const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const config = require('./config/env');
const connectDB = require('./config/db');
const { errorHandler, notFoundHandler } = require('./common/middlewares/error.middleware');

// Import routes
const apiRoutes = require('./routes');
const path = require('path');

// Import chat socket handler
const { initializeChatSocket } = require('./modules/chat/chat.socket');

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Socket.io Configuration
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Initialize chat socket handlers
initializeChatSocket(io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'ReFlow API Server',
    status: 'running',
    database: 'ReFlow',
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// API Routes - all routes are prefixed with /api
app.use('/api', apiRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to MongoDB
connectDB();

// Start auto-release cron job
const autoReleaseService = require('./services/auto-release.service');
autoReleaseService.startAutoReleaseCronJob();

// Start server
const PORT = config.server.port;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.io enabled for real-time chat`);
});

module.exports = { app, server, io };