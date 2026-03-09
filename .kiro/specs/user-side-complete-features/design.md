# User-Side Complete Features - Design Document

## 1. Overview

This spec covers the complete user-side web application development based on the SRS and SDS documents. The system is a C2C (consumer-to-consumer) second-hand marketplace platform that facilitates buying and selling of used goods between individuals.

### Current MVP Status
- ✅ Authentication (Register, Login, Profile, Logout)
- ✅ Product Browsing (Search, Filter, Pagination)
- ✅ Landing Page with Chợ Tốt design
- ✅ 8 Categories with 80 products seeded

### Scope of This Spec
Complete all remaining user-side features from the SRS/SDS documents:
1. **Product Management** - Create, Edit, Delete, Promote listings
2. **Transaction Flow** - Purchase Request → Order → Payment → Escrow
3. **Wallet System** - Balance, Top-up, Withdrawal, Transaction History
4. **Chat System** - Real-time buyer-seller communication
5. **Order Management** - View orders, Track status, Confirm receipt
6. **Rating & Feedback** - Rate sellers after transaction
7. **Report System** - Report products/users
8. **Profile Management** - Update profile, KYC verification
9. **Shipping Integration** - Create shipping orders
10. **Payment Integration** - VNPay payment gateway

## 2. System Architecture

### Technology Stack
- **Frontend**: React.js with Context API
- **Backend**: Node.js + Express.js
- **Database**: MongoDB
- **Real-time**: Socket.io (for chat)
- **Payment**: VNPay Gateway
- **File Storage**: Local storage with Multer

### Module Structure

#### Backend Modules (Already Exists)
```
backend/src/modules/
├── auth/           ✅ Complete
├── products/       ✅ Complete
├── users/          ✅ Complete
├── orders/         ⚠️ Needs expansion
├── payments/       ⚠️ Needs expansion
├── chat/           ⚠️ Needs expansion
├── delivery/       ⚠️ Needs expansion
└── reports/        ⚠️ Needs expansion
```

#### Frontend Modules (Needs Development)
```
frontend/src/modules/
├── auth/           ✅ Complete
├── home/           ✅ Complete
├── product/        🆕 New - Product detail, Create, Edit
├── profile/        🆕 New - User profile, KYC
├── wallet/         🆕 New - Balance, Top-up, Withdrawal
├── orders/         🆕 New - Order list, Order detail
├── chat/           🆕 New - Chat interface
└── checkout/       🆕 New - Purchase flow
```

## 3. Feature Design

### 3.1 Product Management

#### 3.1.1 Product Detail Page
**Screen**: Product Detail Screen (SRS #7, #25)
**Route**: `/product/:id`

**Components**:
- Product image gallery (multiple images)
- Product information (title, price, description, condition)
- Seller information card (name, rating, verified badge)
- Action buttons:
  - "Chat với người bán" (Chat with Seller)
  - "Mua ngay" (Buy Now)
  - "Báo cáo" (Report) - if not owner
  - "Chỉnh sửa" (Edit) - if owner
  - "Xóa" (Delete) - if owner

**API Endpoints**:
- `GET /api/products/:id` - Get product details ✅ Already exists
- `GET /api/users/:id/public` - Get seller public profile 🆕

#### 3.1.2 Create Product
**Screen**: Create New Post Screen (SRS #32)
**Route**: `/product/create`
**Protected**: Yes (requires login)

**Form Fields**:
- Title (required)
- Description (required)
- Price (required, number)
- Category (required, dropdown)
- Condition (required: new, like-new, good)
- Location/City (required, dropdown)
- Images (required, 1-5 images)

**API Endpoints**:
- `POST /api/products` - Create new product 🆕
- `POST /api/upload/products/temp` - Upload product images ✅ Already exists

#### 3.1.3 Edit Product
**Screen**: Edit Post Screen
**Route**: `/product/:id/edit`
**Protected**: Yes (owner only)

**API Endpoints**:
- `PUT /api/products/:id` - Update product 🆕
- `DELETE /api/products/:id/images/:imageId` - Delete image 🆕

#### 3.1.4 My Products
**Screen**: Post Management Screen (SRS #31)
**Route**: `/my-products`
**Protected**: Yes

**Features**:
- List all user's products
- Filter by status (active, sold, hidden)
- Actions: Edit, Delete, Promote (VIP)

**API Endpoints**:
- `GET /api/products/my-products` - Get user's products 🆕
- `DELETE /api/products/:id` - Delete product 🆕
- `PATCH /api/products/:id/status` - Update product status 🆕

### 3.2 Transaction Flow (Escrow System)

#### 3.2.1 Purchase Request
**Screen**: Create Purchase Request Screen (SRS #27)
**Flow**: Buyer → Seller

**Process**:
1. Buyer clicks "Mua ngay" on product detail
2. Buyer enters message and agreed price
3. System creates purchase request with status "pending"
4. Seller receives notification

**API Endpoints**:
- `POST /api/orders/purchase-request` - Create purchase request 🆕
- `GET /api/orders/purchase-requests/received` - Get received requests (seller) 🆕
- `GET /api/orders/purchase-requests/sent` - Get sent requests (buyer) 🆕

#### 3.2.2 Order Creation
**Screen**: Purchase Request (Incoming) Screen (SRS #34)
**Flow**: Seller accepts/rejects request

**Process**:
1. Seller views purchase requests
2. Seller accepts request with agreed price
3. System creates Order with:
   - agreedAmount
   - platformFee (5% of price)
   - totalToPay = agreedAmount + platformFee
   - status: "awaiting_payment"

**API Endpoints**:
- `POST /api/orders/:requestId/accept` - Accept purchase request 🆕
- `POST /api/orders/:requestId/reject` - Reject purchase request 🆕

#### 3.2.3 Payment to Escrow
**Screen**: Secure Payment Screen (SRS #28)
**Flow**: Buyer pays to escrow

**Process**:
1. Buyer views order details
2. Buyer confirms payment
3. System checks wallet balance
4. If sufficient:
   - Deduct from buyer's wallet
   - Hold in escrow
   - Update order status to "paid"
5. If insufficient:
   - Show error, redirect to top-up

**API Endpoints**:
- `POST /api/orders/:orderId/pay` - Pay order to escrow 🆕
- `GET /api/wallets/balance` - Get wallet balance 🆕

#### 3.2.4 Shipping & Delivery
**Screen**: Arrange Shipping Screen (SRS #35)
**Flow**: Seller ships product

**Process**:
1. Seller confirms shipment
2. Seller enters tracking number (optional)
3. System updates order status to "shipped"
4. Buyer receives notification

**API Endpoints**:
- `POST /api/orders/:orderId/ship` - Confirm shipment 🆕
- `GET /api/orders/:orderId/tracking` - Get tracking info 🆕

#### 3.2.5 Confirm Receipt & Release Funds
**Screen**: Confirm Transaction / Rate Seller Screen (SRS #29)
**Flow**: Buyer confirms receipt

**Process**:
1. Buyer receives product
2. Buyer confirms receipt
3. System:
   - Releases funds from escrow to seller's wallet
   - Updates order status to "completed"
4. Buyer can rate seller

**API Endpoints**:
- `POST /api/orders/:orderId/confirm-receipt` - Confirm receipt 🆕
- `POST /api/orders/:orderId/rate` - Rate seller 🆕

#### 3.2.6 Auto-Release (Non-Screen Function #18)
**Background Job**: Auto-release funds after 3-5 days if no dispute

**Process**:
- Cron job runs daily
- Check orders with status "shipped" and > 5 days
- If no dispute raised:
  - Auto-release funds to seller
  - Update status to "completed"

### 3.3 Wallet System

#### 3.3.1 Wallet Dashboard
**Screen**: User Wallet Screen (SRS #36)
**Route**: `/wallet`
**Protected**: Yes

**Features**:
- Display current balance
- Transaction history (deposits, withdrawals, payments, refunds)
- Buttons: "Nạp tiền" (Top-up), "Rút tiền" (Withdraw)

**API Endpoints**:
- `GET /api/wallets/balance` - Get wallet balance 🆕
- `GET /api/wallets/transactions` - Get transaction history 🆕

#### 3.3.2 Top-up (Deposit)
**Screen**: Deposit Request Screen (SRS #37)
**Route**: `/wallet/deposit`
**Protected**: Yes

**Methods**:
1. **Bank Transfer** (Manual):
   - Show bank account details
   - User uploads payment receipt
   - Moderator approves (not in this spec)

2. **VNPay** (Automatic):
   - User enters amount
   - Redirect to VNPay gateway
   - Auto-credit on success

**API Endpoints**:
- `POST /api/payments/deposit/bank-transfer` - Create bank transfer request 🆕
- `POST /api/payments/deposit/vnpay` - Create VNPay payment 🆕
- `GET /api/payments/vnpay/callback` - VNPay callback 🆕

#### 3.3.3 Withdrawal
**Screen**: Withdrawal Request Screen
**Route**: `/wallet/withdraw`
**Protected**: Yes

**Process**:
1. User enters amount and bank details
2. System creates withdrawal request
3. Moderator approves (not in this spec)
4. Funds transferred to user's bank

**API Endpoints**:
- `POST /api/wallets/withdraw` - Create withdrawal request 🆕
- `GET /api/wallets/withdrawals` - Get withdrawal history 🆕

### 3.4 Chat System

#### 3.4.1 Chat Interface
**Screen**: Chat with Seller Screen (SRS #26)
**Route**: `/chat/:conversationId`
**Protected**: Yes

**Features**:
- Real-time messaging (Socket.io)
- Message history
- Product context (show product being discussed)
- Send text messages
- Online/offline status

**API Endpoints**:
- `GET /api/chat/conversations` - Get user's conversations 🆕
- `GET /api/chat/conversations/:id/messages` - Get messages 🆕
- `POST /api/chat/conversations` - Create conversation 🆕
- `POST /api/chat/messages` - Send message (also via Socket.io) 🆕

**Socket Events**:
- `join_conversation` - Join conversation room
- `send_message` - Send message
- `receive_message` - Receive message
- `user_online` - User online status
- `user_offline` - User offline status

### 3.5 Order Management

#### 3.5.1 Order List
**Screen**: View List Order Screen (SRS #23)
**Route**: `/orders`
**Protected**: Yes

**Tabs**:
- "Đang mua" (Buying) - Orders as buyer
- "Đang bán" (Selling) - Orders as seller

**Filters**:
- Status: All, Awaiting Payment, Paid, Shipped, Completed, Cancelled

**API Endpoints**:
- `GET /api/orders/buying` - Get orders as buyer 🆕
- `GET /api/orders/selling` - Get orders as seller 🆕

#### 3.5.2 Order Detail
**Screen**: View Order Detail Screen (SRS #24)
**Route**: `/orders/:id`
**Protected**: Yes

**Information**:
- Order ID, Date
- Product details
- Buyer/Seller information
- Price breakdown (product price + platform fee)
- Status timeline
- Tracking information (if shipped)

**Actions** (based on status and role):
- Buyer:
  - "Thanh toán" (Pay) - if awaiting_payment
  - "Xác nhận đã nhận" (Confirm Receipt) - if shipped
  - "Khiếu nại" (Dispute) - if shipped
- Seller:
  - "Xác nhận gửi hàng" (Confirm Shipment) - if paid

**API Endpoints**:
- `GET /api/orders/:id` - Get order details 🆕

### 3.6 Rating & Feedback

#### 3.6.1 Rate Seller
**Screen**: Part of Confirm Transaction Screen (SRS #29)
**Trigger**: After confirming receipt

**Form**:
- Rating (1-5 stars)
- Comment (optional)

**API Endpoints**:
- `POST /api/orders/:orderId/rate` - Rate seller 🆕

#### 3.6.2 View Ratings
**Location**: Seller Information Screen (SRS #8)

**Display**:
- Average rating
- Total reviews
- Recent reviews list

**API Endpoints**:
- `GET /api/users/:id/ratings` - Get user ratings 🆕

### 3.7 Report System

#### 3.7.1 Report Product
**Screen**: Report Screen (SRS #30)
**Route**: `/report/product/:id`
**Protected**: Yes

**Form**:
- Reason (dropdown):
  - Sản phẩm giả mạo (Counterfeit)
  - Nội dung không phù hợp (Inappropriate content)
  - Lừa đảo (Scam)
  - Khác (Other)
- Description (required)
- Evidence images (optional)

**API Endpoints**:
- `POST /api/reports/product` - Report product 🆕

#### 3.7.2 Dispute (Order Issue)
**Screen**: Dispute Screen (SRS #30)
**Route**: `/orders/:id/dispute`
**Protected**: Yes (buyer only)

**Form**:
- Reason (dropdown):
  - Sản phẩm không đúng mô tả (Not as described)
  - Sản phẩm bị hỏng (Damaged)
  - Không nhận được hàng (Not received)
  - Khác (Other)
- Description (required)
- Evidence images (required)

**API Endpoints**:
- `POST /api/orders/:orderId/dispute` - Create dispute 🆕

### 3.8 Profile Management

#### 3.8.1 View Profile
**Screen**: User Profile Screen (SRS #38)
**Route**: `/profile`
**Protected**: Yes

**Information**:
- Avatar
- Full name
- Email
- Phone
- Verification status (KYC)
- Rating as seller
- Member since

**API Endpoints**:
- `GET /api/users/profile` - Get own profile ✅ Already exists as /api/auth/profile

#### 3.8.2 Edit Profile
**Screen**: Edit Profile Screen
**Route**: `/profile/edit`
**Protected**: Yes

**Form**:
- Avatar (upload)
- Full name
- Phone
- Address

**API Endpoints**:
- `PUT /api/users/profile` - Update profile 🆕
- `POST /api/upload/avatar` - Upload avatar 🆕

#### 3.8.3 KYC Verification
**Screen**: Identity Verification Form Screen (SRS #39)
**Route**: `/profile/kyc`
**Protected**: Yes

**Form**:
- ID Card Front (upload)
- ID Card Back (upload)
- Selfie with ID (upload)

**API Endpoints**:
- `POST /api/users/kyc` - Submit KYC verification 🆕
- `GET /api/users/kyc/status` - Get KYC status 🆕

### 3.9 Shipping Integration

#### 3.9.1 Create Shipping Order
**Screen**: Create Shipping Order Screen
**Route**: `/orders/:id/shipping`
**Protected**: Yes (seller only)

**Form**:
- Shipping provider (dropdown)
- Tracking number
- Estimated delivery date

**API Endpoints**:
- `POST /api/delivery/create` - Create shipping order 🆕
- `GET /api/delivery/:orderId` - Get shipping info 🆕

## 4. Database Schema Updates

### New Collections/Models

#### 4.1 Orders
```javascript
{
  _id: ObjectId,
  requestId: ObjectId, // Reference to purchase request
  buyerId: ObjectId,
  sellerId: ObjectId,
  productId: ObjectId,
  agreedAmount: Number,
  platformFee: Number,
  totalToPay: Number,
  status: String, // awaiting_payment, paid, shipped, completed, cancelled, disputed
  paymentStatus: String, // unpaid, paid, refunded
  createdAt: Date,
  paidAt: Date,
  shippedAt: Date,
  completedAt: Date
}
```

#### 4.2 Purchase Requests (Buy Requests)
```javascript
{
  _id: ObjectId,
  listingId: ObjectId,
  buyerId: ObjectId,
  sellerId: ObjectId,
  message: String,
  agreedPrice: Number,
  status: String, // pending, accepted, rejected
  createdAt: Date
}
```

#### 4.3 Escrow Holds
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  amount: Number,
  status: String, // held, released, refunded
  createdAt: Date,
  releasedAt: Date
}
```

#### 4.4 Wallets
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  balance: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4.5 Transactions
```javascript
{
  _id: ObjectId,
  walletId: ObjectId,
  userId: ObjectId,
  type: String, // deposit, withdrawal, payment, refund, earning
  amount: Number,
  status: String, // pending, completed, failed
  orderId: ObjectId, // if related to order
  description: String,
  createdAt: Date
}
```

#### 4.6 Conversations
```javascript
{
  _id: ObjectId,
  buyerId: ObjectId,
  sellerId: ObjectId,
  productId: ObjectId,
  lastMessage: String,
  lastMessageAt: Date,
  createdAt: Date
}
```

#### 4.7 Messages
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  senderId: ObjectId,
  content: String,
  isRead: Boolean,
  createdAt: Date
}
```

#### 4.8 Reviews
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  reviewerId: ObjectId, // buyer
  reviewedUserId: ObjectId, // seller
  rating: Number, // 1-5
  comment: String,
  createdAt: Date
}
```

#### 4.9 Reports
```javascript
{
  _id: ObjectId,
  reporterId: ObjectId,
  reportedUserId: ObjectId,
  productId: ObjectId,
  reason: String,
  description: String,
  evidenceImages: [String],
  status: String, // pending, resolved, dismissed
  createdAt: Date
}
```

#### 4.10 Disputes
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  buyerId: ObjectId,
  sellerId: ObjectId,
  reason: String,
  description: String,
  evidenceImages: [String],
  status: String, // pending, resolved
  resolution: String, // refund, release
  resolvedAt: Date,
  createdAt: Date
}
```

#### 4.11 Deliveries
```javascript
{
  _id: ObjectId,
  orderId: ObjectId,
  provider: String,
  trackingNumber: String,
  status: String, // pending, in_transit, delivered
  estimatedDelivery: Date,
  createdAt: Date
}
```

### Updates to Existing Models

#### 4.12 User Model Updates
Add fields:
```javascript
{
  phone: String,
  address: String,
  avatar: String,
  kycStatus: String, // not_submitted, pending, approved, rejected
  kycDocuments: {
    idCardFront: String,
    idCardBack: String,
    selfie: String
  },
  violationCount: Number,
  isSuspended: Boolean,
  suspendedUntil: Date,
  rating: Number, // average rating as seller
  totalReviews: Number
}
```

#### 4.13 Product Model Updates
Add fields:
```javascript
{
  sellerId: ObjectId, // Reference to user
  status: String, // active, sold, hidden, deleted
  viewCount: Number,
  isFeatured: Boolean, // for VIP promotion
  featuredUntil: Date
}
```

## 5. UI/UX Design Guidelines

### 5.1 Design System
- Follow Chợ Tốt design language (already established in MVP)
- Primary color: #007BFF (blue)
- Use consistent spacing, typography, and components

### 5.2 Responsive Design
- Mobile-first approach
- Breakpoints: 320px, 768px, 1024px, 1440px

### 5.3 Loading States
- Show skeleton loaders for content
- Disable buttons during API calls
- Show progress indicators for uploads

### 5.4 Error Handling
- Display user-friendly error messages in Vietnamese
- Provide retry options
- Validate forms before submission

### 5.5 Success Feedback
- Show toast notifications for successful actions
- Use confirmation modals for destructive actions
- Provide clear next steps after completing actions

## 6. Security Considerations

### 6.1 Authentication
- JWT tokens with expiration
- Refresh token mechanism
- Secure password hashing (bcrypt)

### 6.2 Authorization
- Role-based access control (user, moderator, admin)
- Owner-only actions (edit/delete own products)
- Protected routes on frontend and backend

### 6.3 Data Validation
- Input validation on both frontend and backend
- Sanitize user inputs to prevent XSS
- File upload validation (type, size)

### 6.4 Payment Security
- Use HTTPS for all API calls
- Validate VNPay signatures
- Log all financial transactions

## 7. Performance Optimization

### 7.1 Frontend
- Code splitting by route
- Lazy loading images
- Debounce search inputs
- Cache API responses

### 7.2 Backend
- Database indexing (userId, productId, orderId)
- Pagination for list endpoints
- Query optimization
- Rate limiting

### 7.3 Real-time
- Socket.io connection pooling
- Message batching
- Reconnection logic

## 8. Testing Strategy

### 8.1 Unit Tests
- Service layer functions
- Utility functions
- React components

### 8.2 Integration Tests
- API endpoints
- Database operations
- Payment flow

### 8.3 E2E Tests
- Critical user flows:
  - Register → Login → Create Product → Buy Product → Pay → Confirm Receipt
  - Top-up wallet
  - Chat with seller

## 9. Deployment

### 9.1 Environment Variables
```
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...
VNPAY_URL=...
FRONTEND_URL=https://...

# Frontend
REACT_APP_API_URL=https://api...
REACT_APP_SOCKET_URL=https://socket...
```

### 9.2 Build Process
- Frontend: `npm run build` → static files
- Backend: `npm start` → Node.js server

### 9.3 Hosting
- Frontend: Vercel/Netlify
- Backend: Heroku/Railway/DigitalOcean
- Database: MongoDB Atlas
- File Storage: AWS S3 or local storage

## 10. Future Enhancements (Out of Scope)

- Mobile app (React Native)
- Push notifications
- Advanced search (Elasticsearch)
- Recommendation system
- Social features (follow users)
- Multiple languages
- Dark mode
