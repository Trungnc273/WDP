import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import chatService from '../../services/chat.service';
import io from 'socket.io-client';
import './Chat.css';

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // Initialize socket connection
    initializeSocket();
    
    // Load conversations
    loadConversations();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, token]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      loadConversation(conversationId);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    socketRef.current = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    socketRef.current.on('message_received', (message) => {
      if (message.conversation === conversationId) {
        setMessages(prev => [...prev, message]);
      }
      
      // Update conversation list with latest message
      setConversations(prev => prev.map(conv => 
        conv._id === message.conversation 
          ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
          : conv
      ));
    });

    socketRef.current.on('user_online', (userId) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    socketRef.current.on('user_offline', (userId) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socketRef.current.on('online_users', (users) => {
      setOnlineUsers(new Set(users));
    });
  };

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (convId) => {
    try {
      const [conversationData, messagesData] = await Promise.all([
        chatService.getConversationById(convId),
        chatService.getMessages(convId)
      ]);
      
      setCurrentConversation(conversationData);
      setMessages(messagesData.messages || []);
      
      // Join conversation room
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', convId);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      navigate('/chat');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentConversation || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    
    try {
      // Send via socket for real-time delivery
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          conversationId: currentConversation._id,
          content: newMessage.trim()
        });
      } else {
        // Fallback to REST API
        await chatService.sendMessage(currentConversation._id, newMessage.trim());
      }
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    } else {
      return messageDate.toLocaleDateString('vi-VN');
    }
  };

  const getOtherUser = (conversation) => {
    if (!conversation || !user) return null;
    return conversation.buyer._id === user._id ? conversation.seller : conversation.buyer;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Conversations Sidebar */}
      <div className="conversations-sidebar">
        <div className="sidebar-header">
          <h2>Tin nhắn</h2>
        </div>
        
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-conversations">
              <p>Chưa có cuộc trò chuyện nào</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const isActive = conversationId === conversation._id;
              const isOnline = isUserOnline(otherUser?._id);
              
              return (
                <div
                  key={conversation._id}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(`/chat/${conversation._id}`)}
                >
                  <div className="conversation-avatar">
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.fullName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {otherUser?.fullName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isOnline && <div className="online-indicator"></div>}
                  </div>
                  
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="user-name">{otherUser?.fullName}</span>
                      {conversation.lastMessage && (
                        <span className="message-time">
                          {formatTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <div className="conversation-preview">
                      <span className="product-name">{conversation.product?.title}</span>
                      {conversation.lastMessage && (
                        <p className="last-message">
                          {conversation.lastMessage.sender === user._id ? 'Bạn: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="chat-avatar">
                  {getOtherUser(currentConversation)?.avatar ? (
                    <img 
                      src={getOtherUser(currentConversation).avatar} 
                      alt={getOtherUser(currentConversation).fullName} 
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {getOtherUser(currentConversation)?.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {isUserOnline(getOtherUser(currentConversation)?._id) && (
                    <div className="online-indicator"></div>
                  )}
                </div>
                
                <div className="user-details">
                  <h3>{getOtherUser(currentConversation)?.fullName}</h3>
                  <p className="product-context">
                    Về: {currentConversation.product?.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((message, index) => {
                const isOwn = message.sender === user._id;
                const showDate = index === 0 || 
                  formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                
                return (
                  <React.Fragment key={message._id}>
                    {showDate && (
                      <div className="date-separator">
                        {formatDate(message.createdAt)}
                      </div>
                    )}
                    
                    <div className={`message ${isOwn ? 'own' : 'other'}`}>
                      <div className="message-content">
                        {message.content}
                      </div>
                      <div className="message-time">
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="message-input-form">
              <div className="input-container">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  disabled={sendingMessage}
                  maxLength={1000}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || sendingMessage}
                  className="send-button"
                >
                  {sendingMessage ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-paper-plane"></i>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="no-conversation">
            <div className="no-conversation-content">
              <i className="fas fa-comments"></i>
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;