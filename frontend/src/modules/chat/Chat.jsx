import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import chatService from "../../services/chat.service";
import io from "socket.io-client";
import "./Chat.css";

const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConvIdRef = useRef(conversationId);

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
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
  }, [token]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      loadConversation(conversationId);
    }
  }, [conversationId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    activeConvIdRef.current = conversationId;
  }, [conversationId]);

  const initializeSocket = () => {
    const serverUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

    socketRef.current = io(serverUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to chat server");
    });

    socketRef.current.on("disconnect", () => {
      console.log("Disconnected from chat server");
    });

    socketRef.current.on("receive_message", (data) => {
      const msgConvId =
        data.conversationId ||
        data.message.conversationId ||
        data.message.conversation;
      const { message } = data;

      if (msgConvId === activeConvIdRef.current) {
        setMessages((prev) => [...prev, message]);
        setTimeout(scrollToBottom, 100);
      }

      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === msgConvId
            ? { 
                ...conv, 
                lastMessage: message.content || message, // Update content safely
                lastMessageAt: message.createdAt || new Date() 
              }
            : conv,
        ),
      );
    });

    socketRef.current.on("new_message_notification", (data) => {
      const { conversationId: notifConvId, message } = data;

      setConversations((prev) => {
        const exists = prev.find((c) => c._id === notifConvId);
        if (exists) {
          return prev.map((conv) =>
            conv._id === notifConvId
              ? { 
                  ...conv, 
                  lastMessage: message.content || message,
                  lastMessageAt: message.createdAt || new Date()
                }
              : conv,
          );
        }
        return prev;
      });
    });

    socketRef.current.on("user_online", (userId) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socketRef.current.on("user_offline", (userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    socketRef.current.on("online_users", (users) => {
      setOnlineUsers(new Set(users));
    });
  };

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (convId) => {
    try {
      const [conversationData, messagesData] = await Promise.all([
        chatService.getConversationById(convId),
        chatService.getMessages(convId),
      ]);

      setCurrentConversation(conversationData);
      setMessages(messagesData.messages || []);

      // Join conversation room
      if (socketRef.current) {
        socketRef.current.emit("join_conversation", convId);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      navigate("/chat");
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
        socketRef.current.emit("send_message", {
          conversationId: currentConversation._id,
          content: newMessage.trim(),
        });
      } else {
        // Fallback to REST API
        await chatService.sendMessage(
          currentConversation._id,
          newMessage.trim(),
        );
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSendingMessage(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Hôm nay";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      return messageDate.toLocaleDateString("vi-VN");
    }
  };

  // ĐÃ SỬA: Lấy an toàn Current User ID để không bị lỗi undefined
  const getCurrentUserId = () => {
    if (!user) return null;
    return String(user._id || user.id || user.userId);
  };

  const getOtherUser = (conversation) => {
    if (!conversation || !user) return null;

    const currentUserId = getCurrentUserId();
    const buyerObj = conversation.buyer || conversation.buyerId;
    const sellerObj = conversation.seller || conversation.sellerId;

    if (!buyerObj || !sellerObj) return null;

    // So sánh an toàn ID
    const buyerIdStr = String(buyerObj._id || buyerObj.id || buyerObj);
    const isUserBuyer = buyerIdStr === currentUserId;

    return isUserBuyer ? sellerObj : buyerObj;
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  // ĐÃ SỬA: Kiểm tra người gửi an toàn tuyệt đối
  const isMessageOwn = (messageSender) => {
    if (!messageSender || !user) return false;

    const currentUserId = getCurrentUserId();
    if (!currentUserId) return false;

    try {
      // Lấy chuỗi ID người gửi
      const senderIdStr = String(messageSender._id || messageSender.id || messageSender);
      return senderIdStr === currentUserId;
    } catch (error) {
      console.warn("Lỗi khi kiểm tra người gửi:", error);
      return false;
    }
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
                  className={`conversation-item ${isActive ? "active" : ""}`}
                  onClick={() => navigate(`/chat/${conversation._id}`)}
                >
                  <div className="conversation-avatar">
                    {otherUser?.avatar ? (
                      <img src={otherUser.avatar} alt={otherUser.fullName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {otherUser?.fullName?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    {isOnline && <div className="online-indicator"></div>}
                  </div>

                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="user-name">{otherUser?.fullName || "Người dùng"}</span>
                      {/* ĐÃ SỬA LỖI INVALID DATE: Dùng lastMessageAt thay vì lastMessage.createdAt */}
                      {conversation.lastMessageAt && (
                        <span className="message-time">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      )}
                    </div>

                    <div className="conversation-preview">
                      <span className="product-name">
                        {conversation.product?.title ||
                          conversation.productId?.title}
                      </span>
                      {/* ĐÃ BỎ CHỮ "BẠN:" vì DB schema của bạn hiện tại không lưu trữ người gửi lastMessage */}
                      {conversation.lastMessage && (
                        <p className="last-message">
                          {typeof conversation.lastMessage === 'string' 
                            ? conversation.lastMessage 
                            : conversation.lastMessage.content}
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
                      {getOtherUser(currentConversation)
                        ?.fullName?.charAt(0)
                        .toUpperCase() || "?"}
                    </div>
                  )}
                  {isUserOnline(getOtherUser(currentConversation)?._id) && (
                    <div className="online-indicator"></div>
                  )}
                </div>

                <div className="user-details">
                  <h3>{getOtherUser(currentConversation)?.fullName || "Người dùng"}</h3>
                  <p className="product-context">
                    Về:{" "}
                    {currentConversation.product?.title ||
                      currentConversation.productId?.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((message, index) => {
                // ĐÃ FIX PHÂN VAI TRÁI PHẢI
                const senderInfo = message.senderId || message.sender || message.user;
                const isOwn = isMessageOwn(senderInfo);
                const showDate =
                  index === 0 ||
                  formatDate(message.createdAt) !==
                    formatDate(messages[index - 1].createdAt);

                return (
                  <React.Fragment key={message._id || index}>
                    {showDate && (
                      <div
                        className="date-separator"
                        data-date={formatDate(message.createdAt)}
                      ></div>
                    )}

                    <div className={`message ${isOwn ? "own" : "other"}`}>
                      <div className="message-content">{message.content}</div>
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
              <p>
                Chọn cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;