import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import chatService from '../../services/chat.service';
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
  const [typingUserId, setTypingUserId] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [processingOfferIds, setProcessingOfferIds] = useState(new Set());
  const [showBuyerOfferModal, setShowBuyerOfferModal] = useState(false);
  const [buyerOfferPrice, setBuyerOfferPrice] = useState('');
  const [buyerOfferMessage, setBuyerOfferMessage] = useState('');
  const [submittingBuyerOffer, setSubmittingBuyerOffer] = useState(false);
  const [conversationSearch, setConversationSearch] = useState('');
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // Khoi tao ket noi socket
    initializeSocket();
    
    // Tai danh sach doan chat
    loadConversations();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      loadConversation(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, conversations]);

  useEffect(() => {
    activeConversationIdRef.current = conversationId || null;
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const initializeSocket = () => {
    socketRef.current = chatService.connectSocket(token);

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    socketRef.current.on('receive_message', ({ message }) => {
      const normalizedMessage = normalizeMessage(message);
      const messageConversationId = normalizedMessage.conversation;

      if (messageConversationId === activeConversationIdRef.current) {
        setMessages(prev => {
          const existingIndex = prev.findIndex((m) => m._id === normalizedMessage._id);
          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = {
              ...next[existingIndex],
              ...normalizedMessage,
              metadata: normalizedMessage.metadata || next[existingIndex].metadata
            };
            return next;
          }
          return [...prev, normalizedMessage];
        });
      }
      
      // Cap nhat danh sach doan chat voi tin nhan moi nhat
      setConversations(prev => prev.map(conv => 
        conv._id === messageConversationId
          ? {
              ...conv,
              lastMessage: normalizedMessage.content,
              lastMessageAt: normalizedMessage.createdAt,
              updatedAt: normalizedMessage.createdAt
            }
          : conv
      ));
    });

    socketRef.current.on('user_typing', ({ conversationId: typingConversationId, userId }) => {
      if (typingConversationId === activeConversationIdRef.current) {
        setTypingUserId(userId);
      }
    });

    socketRef.current.on('user_stop_typing', ({ conversationId: typingConversationId }) => {
      if (typingConversationId === activeConversationIdRef.current) {
        setTypingUserId(null);
      }
    });

    socketRef.current.on('user_online', (payload) => {
      const userId = payload?.userId || payload;
      const normalizedId = userId?.toString?.();
      if (!normalizedId) return;
      setOnlineUsers(prev => new Set([...prev, normalizedId]));
    });

    socketRef.current.on('user_offline', (payload) => {
      const userId = payload?.userId || payload;
      const normalizedId = userId?.toString?.();
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (normalizedId) newSet.delete(normalizedId);
        return newSet;
      });
    });

    socketRef.current.on('online_users', (users) => {
      const normalized = Array.isArray(users)
        ? users.map((id) => id?.toString?.()).filter(Boolean)
        : [];
      setOnlineUsers(new Set(normalized));
    });
  };

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations((data.conversations || []).map(normalizeConversation));
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
      
      setCurrentConversation(normalizeConversation(conversationData));
      setMessages((messagesData.messages || []).map(normalizeMessage));
      setTypingUserId(null);
      
      // Tham gia phong chat cua doan hoi thoai
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', { conversationId: convId });
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
    stopTyping();
    
    try {
      // Gui qua socket de cap nhat theo thoi gian thuc
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send_message', {
          conversationId: currentConversation._id,
          content: newMessage.trim()
        });
      } else {
        // Neu socket khong san sang thi fallback sang REST API
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
    const buyer = conversation.buyer || conversation.buyerId;
    const seller = conversation.seller || conversation.sellerId;
    if (!buyer || !seller) return null;

    const buyerId = getEntityId(buyer);
    const currentUserId = getCurrentUserId();
    return buyerId === currentUserId ? seller : buyer;
  };

  const isUserOnline = (userId) => {
    const normalizedId = userId?.toString?.();
    return normalizedId ? onlineUsers.has(normalizedId) : false;
  };

  const normalizeMessage = (message) => ({
    ...message,
    conversation: message.conversation || message.conversationId || message.conversation?._id,
    sender: message.sender || message.senderId?._id || message.senderId,
    metadata: message.metadata || null
  });

  const normalizeConversation = (conversation) => ({
    ...conversation,
    buyer: conversation.buyer || conversation.buyerId,
    seller: conversation.seller || conversation.sellerId,
    product: conversation.product || conversation.productId
  });

  const getEntityId = (entity) => {
    if (!entity) return null;
    if (typeof entity === 'string' || typeof entity === 'number') return entity.toString();
    return entity._id?.toString?.() || entity.id?.toString?.() || entity.userId?.toString?.() || null;
  };

  const getMessageSenderId = (message) =>
    getEntityId(message?.sender) || getEntityId(message?.senderId) || null;

  const getCurrentUserId = () =>
    user?._id?.toString?.() || user?.id?.toString?.() || user?.userId?.toString?.() || null;

  const getConversationBuyerId = (conversation) =>
    conversation?.buyer?._id ||
    conversation?.buyer?.id ||
    conversation?.buyerId?._id ||
    conversation?.buyerId?.id ||
    conversation?.buyerId ||
    null;

  const getConversationProductId = (conversation) =>
    conversation?.product?._id || conversation?.productId?._id || conversation?.productId || null;

  const getConversationProductStatus = (conversation) =>
    conversation?.product?.status || conversation?.productId?.status || null;

  const getMyRoleInConversation = (conversation) => {
    const currentUserId = getCurrentUserId();
    const buyerId = getConversationBuyerId(conversation);
    if (!currentUserId || !buyerId) return 'Không xác định';
    return buyerId.toString() === currentUserId.toString() ? 'Người mua' : 'Người bán';
  };

  const getUnreadCount = (conversation) => {
    if (!conversation) return 0;
    const role = getMyRoleInConversation(conversation);
    if (role === 'Người mua') return Number(conversation.buyerUnreadCount || 0);
    if (role === 'Người bán') return Number(conversation.sellerUnreadCount || 0);
    return 0;
  };

  const getRoleClassName = (role) => {
    if (role === 'Người mua') return 'buyer';
    if (role === 'Người bán') return 'seller';
    return 'unknown';
  };

  const getConversationLastMessageText = (conversation) => {
    if (!conversation?.lastMessage) return '';
    if (typeof conversation.lastMessage === 'string') return conversation.lastMessage;
    return conversation.lastMessage.content || '';
  };

  const getConversationLastMessageTime = (conversation) => {
    return conversation?.lastMessageAt || conversation?.lastMessage?.createdAt || conversation?.updatedAt;
  };

  const getOfferMeta = (message) => {
    const metadata = message?.metadata;
    if (!metadata || !metadata.purchaseRequestId) return null;
    return metadata;
  };

  const getOtherUserName = (conversation) => getOtherUser(conversation)?.fullName || 'Người dùng';

  const getOtherUserId = (conversation) => getEntityId(getOtherUser(conversation));

  const isBuyerInCurrentConversation = () => getMyRoleInConversation(currentConversation) === 'Người mua';

  const isSellerInCurrentConversation = () => getMyRoleInConversation(currentConversation) === 'Người bán';

  const canShowDealActions = () => getConversationProductStatus(currentConversation) === 'active';

  const formatMoney = (amount) => {
    const value = Number(amount || 0);
    return `${value.toLocaleString('vi-VN')}đ`;
  };

  const startTyping = () => {
    if (!currentConversation || !socketRef.current?.connected) return;

    if (!isTypingRef.current) {
      socketRef.current.emit('typing', { conversationId: currentConversation._id });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1200);
  };

  const stopTyping = () => {
    if (!currentConversation || !socketRef.current?.connected || !isTypingRef.current) return;
    socketRef.current.emit('stop_typing', { conversationId: currentConversation._id });
    isTypingRef.current = false;
  };

  const handleChangeNewMessage = (e) => {
    setNewMessage(e.target.value);
    startTyping();
  };

  const handleOpenSellerOfferModal = () => {
    if (!canShowDealActions()) {
      alert('Sản phẩm đã bán hoặc không còn khả dụng.');
      return;
    }
    setOfferPrice('');
    setOfferMessage('');
    setShowOfferModal(true);
  };

  const handleCloseSellerOfferModal = () => {
    if (submittingOffer) return;
    setShowOfferModal(false);
  };

  const handleSubmitSellerOffer = async (e) => {
    e.preventDefault();

    if (!currentConversation) return;

    const normalizedPrice = Number(offerPrice);
    if (!normalizedPrice || normalizedPrice <= 0) {
      alert('Giá đề nghị phải lớn hơn 0.');
      return;
    }

    setSubmittingOffer(true);
    try {
      const response = await chatService.createSellerOffer({
        conversationId: currentConversation._id,
        agreedPrice: normalizedPrice,
        message: offerMessage?.trim() || 'Người bán đã gửi đề nghị mua hàng cho bạn.'
      });

      const createdMessage = normalizeMessage(response?.data?.chatMessage || response?.chatMessage);
      if (createdMessage && createdMessage._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === createdMessage._id)) return prev;
          return [...prev, createdMessage];
        });
      }

      setConversations((prev) => prev.map((conv) =>
        conv._id === currentConversation._id
          ? {
              ...conv,
              lastMessage: createdMessage?.content || 'Đã gửi đề nghị mua hàng',
              lastMessageAt: createdMessage?.createdAt || new Date().toISOString()
            }
          : conv
      ));

      setShowOfferModal(false);
    } catch (error) {
      const message = error?.message || error?.error || 'Không thể gửi đề nghị. Vui lòng thử lại.';
      alert(message);
    } finally {
      setSubmittingOffer(false);
    }
  };

  const handleOpenBuyerOfferModal = () => {
    if (!canShowDealActions()) {
      alert('Sản phẩm đã bán hoặc không còn khả dụng.');
      return;
    }
    setBuyerOfferPrice('');
    setBuyerOfferMessage('');
    setShowBuyerOfferModal(true);
  };

  const handleCloseBuyerOfferModal = () => {
    if (submittingBuyerOffer) return;
    setShowBuyerOfferModal(false);
  };

  const handleSubmitBuyerOffer = async (e) => {
    e.preventDefault();

    if (!currentConversation) return;

    const normalizedPrice = Number(buyerOfferPrice);
    if (!normalizedPrice || normalizedPrice <= 0) {
      alert('Giá đề nghị phải lớn hơn 0.');
      return;
    }

    setSubmittingBuyerOffer(true);
    try {
      const response = await chatService.createBuyerOffer({
        conversationId: currentConversation._id,
        agreedPrice: normalizedPrice,
        message: buyerOfferMessage?.trim() || 'Người mua đã gửi đề nghị giá cho bạn.'
      });

      const createdMessage = normalizeMessage(response?.data?.chatMessage || response?.chatMessage);
      if (createdMessage && createdMessage._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === createdMessage._id)) return prev;
          return [...prev, createdMessage];
        });
      }

      setConversations((prev) => prev.map((conv) =>
        conv._id === currentConversation._id
          ? {
              ...conv,
              lastMessage: createdMessage?.content || 'Đã gửi đề nghị giá',
              lastMessageAt: createdMessage?.createdAt || new Date().toISOString()
            }
          : conv
      ));

      setShowBuyerOfferModal(false);
    } catch (error) {
      const message = error?.message || error?.error || 'Không thể gửi đề nghị giá. Vui lòng thử lại.';
      alert(message);
    } finally {
      setSubmittingBuyerOffer(false);
    }
  };

  const handleRespondOffer = async (messageItem, decision) => {
    const offerMeta = getOfferMeta(messageItem);
    if (!offerMeta?.purchaseRequestId) return;

    const requestId = offerMeta.purchaseRequestId;
    const isAccept = decision === 'accept';

    if (!isAccept) {
      const reason = '';
      setProcessingOfferIds((prev) => new Set(prev).add(requestId));
      try {
        await chatService.respondSellerOffer({ requestId, decision: 'reject', reason });
        setMessages((prev) => prev.map((m) => {
          if (m._id !== messageItem._id) return m;
          return {
            ...m,
            metadata: {
              ...(m.metadata || {}),
              status: 'rejected',
              reason
            }
          };
        }));
      } catch (error) {
        const msg = error?.message || error?.error || 'Không thể từ chối đề nghị.';
        alert(msg);
      } finally {
        setProcessingOfferIds((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }
      return;
    }

    setProcessingOfferIds((prev) => new Set(prev).add(requestId));
    try {
      await chatService.respondSellerOffer({ requestId, decision: 'accept' });
      setMessages((prev) => prev.map((m) => {
        if (m._id !== messageItem._id) return m;
        return {
          ...m,
          metadata: {
            ...(m.metadata || {}),
            status: 'accepted'
          }
        };
      }));
      const successMsg = isSellerInCurrentConversation()
        ? 'Bạn đã chấp nhận đề nghị. Đơn hàng đã được tạo, vui lòng kiểm tra trong phần đơn bán.'
        : 'Bạn đã chấp nhận đề nghị. Đơn hàng đã được tạo, vui lòng kiểm tra trong phần đơn mua.';
      alert(successMsg);
    } catch (error) {
      const msg = error?.message || error?.error || 'Không thể chấp nhận đề nghị.';
      alert(msg);
    } finally {
      setProcessingOfferIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const renderOfferStatus = (status) => {
    if (status === 'accepted') return <span className="offer-status accepted">Đã chấp nhận</span>;
    if (status === 'rejected') return <span className="offer-status rejected">Đã từ chối</span>;
    return <span className="offer-status pending">Đang chờ phản hồi</span>;
  };

  const renderMessageBody = (messageItem, isOwnMessage) => {
    if (messageItem.type !== 'offer') {
      return <div className="message-content">{messageItem.content}</div>;
    }

    const offerMeta = getOfferMeta(messageItem);
    const initiatedBy = offerMeta?.initiatedBy || 'seller';
    const offerStatus = offerMeta?.status || 'pending';
    const canBuyerRespond =
      !isOwnMessage &&
      isBuyerInCurrentConversation() &&
      initiatedBy === 'seller' &&
      offerStatus === 'pending';
    const canSellerRespond =
      !isOwnMessage &&
      isSellerInCurrentConversation() &&
      initiatedBy === 'buyer' &&
      offerStatus === 'pending';
    const canRespond = canBuyerRespond || canSellerRespond;

    const isProcessing = processingOfferIds.has(offerMeta?.purchaseRequestId);

    return (
      <div className={`message-content offer-message ${isOwnMessage ? 'own' : 'other'}`}>
        <p className="offer-title">{initiatedBy === 'buyer' ? 'Đề nghị từ người mua' : 'Đề nghị từ người bán'}</p>
        <p className="offer-price">{formatMoney(offerMeta?.agreedPrice)}</p>
        <p className="offer-note">{messageItem.content}</p>
        <div className="offer-footer">
          {renderOfferStatus(offerStatus)}
          {offerMeta?.reason && <span className="offer-reason">Lý do: {offerMeta.reason}</span>}
        </div>

        {canRespond && (
          <div className="offer-actions">
            <button
              type="button"
              className="offer-accept-btn"
              disabled={isProcessing}
              onClick={() => handleRespondOffer(messageItem, 'accept')}
            >
              {isProcessing ? 'Đang xử lý...' : 'Chấp nhận'}
            </button>
            <button
              type="button"
              className="offer-reject-btn"
              disabled={isProcessing}
              onClick={() => handleRespondOffer(messageItem, 'reject')}
            >
              {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleCreateOrderFromChat = () => {
    if (!canShowDealActions()) {
      alert('Sản phẩm đã bán hoặc không còn khả dụng.');
      return;
    }
    const productId = getConversationProductId(currentConversation);
    if (!productId) {
      alert('Không tìm thấy sản phẩm để tạo đơn.');
      return;
    }
    navigate(`/product/${productId}?openPurchase=1`);
  };

  const handleOpenProductFromChat = () => {
    const productId = getConversationProductId(currentConversation);
    if (!productId) return;
    navigate(`/product/${productId}`);
  };

  const normalizedConversationSearch = conversationSearch.trim().toLowerCase();

  const filteredConversations = conversations.filter((conversation) => {
    if (!normalizedConversationSearch) return true;

    const otherUserName = (getOtherUser(conversation)?.fullName || '').toLowerCase();
    const productTitle = (conversation?.product?.title || '').toLowerCase();
    const lastMessageText = (getConversationLastMessageText(conversation) || '').toLowerCase();

    return (
      otherUserName.includes(normalizedConversationSearch) ||
      productTitle.includes(normalizedConversationSearch) ||
      lastMessageText.includes(normalizedConversationSearch)
    );
  });

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
          <div className="sidebar-search-wrap">
            <input
              type="text"
              className="sidebar-search-input"
              placeholder="Tìm người chat, sản phẩm..."
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
            />
          </div>
        </div>
        
        <div className="conversations-list">
          {filteredConversations.length === 0 ? (
            <div className="empty-conversations">
              <p>{normalizedConversationSearch ? 'Không tìm thấy cuộc trò chuyện phù hợp' : 'Chưa có cuộc trò chuyện nào'}</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const isActive = conversationId === conversation._id;
              const isOnline = isUserOnline(getEntityId(otherUser));
              const myRole = getMyRoleInConversation(conversation);
              const unread = getUnreadCount(conversation);
              const lastMessageText = getConversationLastMessageText(conversation);
              const lastMessageTime = getConversationLastMessageTime(conversation);
              
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
                      <span className="user-name">{otherUser?.fullName || 'Người dùng'}</span>
                      {lastMessageTime && (
                        <span className="message-time">
                          {formatTime(lastMessageTime)}
                        </span>
                      )}
                    </div>

                    <div className="conversation-meta-line">
                      <span className={`conversation-role role-${getRoleClassName(myRole)}`}>Bạn: {myRole}</span>
                      {isOnline ? (
                        <span className="conversation-online">Đang hoạt động</span>
                      ) : (
                        <span className="conversation-offline">Ngoại tuyến</span>
                      )}
                    </div>
                    
                    <div className="conversation-preview">
                      <span className="product-name">{conversation.product?.title}</span>
                      {lastMessageText && (
                        <p className="last-message">
                          {lastMessageText}
                        </p>
                      )}
                    </div>
                  </div>

                  {unread > 0 && <span className="unread-badge">{unread}</span>}
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
                  {isUserOnline(getEntityId(getOtherUser(currentConversation))) && (
                    <div className="online-indicator"></div>
                  )}
                </div>
                
                <div className="user-details">
                  <h3>{getOtherUser(currentConversation)?.fullName || 'Người dùng'}</h3>
                  <p className="product-context">
                    Sản phẩm: {currentConversation.product?.title || 'Không xác định'}
                  </p>
                  <p className="role-context">
                    Vai trò: <strong>{getMyRoleInConversation(currentConversation)}</strong>
                  </p>
                </div>
              </div>

              <div className="chat-actions">
                <button className="chat-secondary-btn" onClick={handleOpenProductFromChat}>
                  Xem sản phẩm
                </button>
                {isBuyerInCurrentConversation() && canShowDealActions() && (
                  <>
                    <button className="chat-create-order-btn" onClick={handleCreateOrderFromChat}>
                      Tạo đơn
                    </button>
                    <button className="chat-price-offer-btn" onClick={handleOpenBuyerOfferModal}>
                      Đề nghị giá
                    </button>
                  </>
                )}
                {isSellerInCurrentConversation() && canShowDealActions() && (
                  <button className="chat-order-btn" onClick={handleOpenSellerOfferModal}>
                    Gửi đề nghị cho buyer
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map((message, index) => {
                const isOwn = getMessageSenderId(message)?.toString() === getCurrentUserId()?.toString();
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
                      {!isOwn && (
                        <div className="message-avatar-left">
                          {getOtherUser(currentConversation)?.avatar ? (
                            <img
                              src={getOtherUser(currentConversation)?.avatar}
                              alt={getOtherUserName(currentConversation)}
                            />
                          ) : (
                            <div className="avatar-placeholder small">
                              {getOtherUserName(currentConversation).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="message-bubble-wrap">
                        <div className="message-sender">
                          {isOwn ? 'Bạn' : getOtherUserName(currentConversation)}
                        </div>
                        {renderMessageBody(message, isOwn)}
                        <div className="message-time">
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              {typingUserId && getOtherUserId(currentConversation)?.toString() === typingUserId?.toString() && (
                <div className="typing-indicator">{getOtherUserName(currentConversation)} đang nhập...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="message-input-form">
              <div className="input-container">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleChangeNewMessage}
                  placeholder="Nhập tin nhắn..."
                  disabled={sendingMessage}
                  maxLength={1000}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || sendingMessage}
                  className="send-button"
                  title="Gửi"
                >
                  {sendingMessage ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <span className="send-triangle">▶</span>
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

      {showOfferModal && (
        <div className="chat-modal-backdrop" onClick={handleCloseSellerOfferModal}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Tạo đề nghị cho buyer</h3>
            <p className="chat-modal-subtitle">
              Buyer sẽ thấy đề nghị này ngay trong cuộc trò chuyện và có thể chấp nhận hoặc từ chối.
            </p>
            <form onSubmit={handleSubmitSellerOffer}>
              <label htmlFor="offer-price">Giá đề nghị (VNĐ)</label>
              <input
                id="offer-price"
                type="number"
                min="1"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Ví dụ: 1200000"
                required
              />

              <label htmlFor="offer-message">Nội dung</label>
              <textarea
                id="offer-message"
                rows="4"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Thêm mô tả ngắn về đề nghị (không bắt buộc)"
                maxLength={500}
              />

              <div className="chat-modal-actions">
                <button type="button" className="chat-modal-cancel" onClick={handleCloseSellerOfferModal}>
                  Hủy
                </button>
                <button type="submit" className="chat-modal-submit" disabled={submittingOffer}>
                  {submittingOffer ? 'Đang gửi...' : 'Gửi đề nghị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBuyerOfferModal && (
        <div className="chat-modal-backdrop" onClick={handleCloseBuyerOfferModal}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Đề nghị giá</h3>
            <p className="chat-modal-subtitle">
              Người bán sẽ thấy đề nghị giá này trong cuộc trò chuyện và có thể chấp nhận hoặc từ chối.
            </p>
            <form onSubmit={handleSubmitBuyerOffer}>
              <label htmlFor="buyer-offer-price">Giá đề nghị (VNĐ)</label>
              <input
                id="buyer-offer-price"
                type="number"
                min="1"
                value={buyerOfferPrice}
                onChange={(e) => setBuyerOfferPrice(e.target.value)}
                placeholder="Ví dụ: 1200000"
                required
              />

              <label htmlFor="buyer-offer-message">Nội dung</label>
              <textarea
                id="buyer-offer-message"
                rows="4"
                value={buyerOfferMessage}
                onChange={(e) => setBuyerOfferMessage(e.target.value)}
                placeholder="Thêm mô tả ngắn (không bắt buộc)"
                maxLength={500}
              />

              <div className="chat-modal-actions">
                <button type="button" className="chat-modal-cancel" onClick={handleCloseBuyerOfferModal}>
                  Hủy
                </button>
                <button type="submit" className="chat-modal-submit" disabled={submittingBuyerOffer}>
                  {submittingBuyerOffer ? 'Đang gửi...' : 'Gửi đề nghị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;