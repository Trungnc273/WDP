# User-Side Complete Features - Requirements Document

## 1. Functional Requirements

### FR1: Product Management

#### FR1.1: View Product Detail
- **Priority**: High
- **Description**: User can view detailed information about a product
- **Acceptance Criteria**:
  - Display product images in a gallery
  - Show product title, price, description, condition, location
  - Display seller information (name, rating, verification status)
  - Show action buttons based on user role (owner vs visitor)
  - Load product data from API
- **Dependencies**: None (MVP already has basic product viewing)

#### FR1.2: Create Product
- **Priority**: High
- **Description**: Authenticated user can create a new product listing
- **Acceptance Criteria**:
  - Form with required fields: title, description, price, category, condition, location
  - Image upload (1-5 images, max 5MB each)
  - Client-side validation before submission
  - Success message and redirect to product detail after creation
  - Only authenticated users can access
- **Dependencies**: FR8.1 (Authentication)

#### FR1.3: Edit Product
- **Priority**: High
- **Description**: Product owner can edit their product listing
- **Acceptance Criteria**:
  - Pre-fill form with existing product data
  - Allow updating all fields except category
  - Allow adding/removing images
  - Only product owner can edit
  - Success message after update
- **Dependencies**: FR1.2, FR8.1

#### FR1.4: Delete Product
- **Priority**: Medium
- **Description**: Product owner can delete their product listing
- **Acceptance Criteria**:
  - Confirmation modal before deletion
  - Soft delete (mark as deleted, not remove from database)
  - Only product owner can delete
  - Cannot delete if there are active orders
  - Success message after deletion
- **Dependencies**: FR1.2, FR8.1

#### FR1.5: My Products List
- **Priority**: High
- **Description**: User can view and manage all their product listings
- **Acceptance Criteria**:
  - Display list of user's products
  - Filter by status (active, sold, hidden)
  - Show product thumbnail, title, price, status
  - Quick actions: Edit, Delete, Promote
  - Pagination for large lists
- **Dependencies**: FR1.2, FR8.1

### FR2: Transaction Flow (Escrow System)

#### FR2.1: Create Purchase Request
- **Priority**: High
- **Description**: Buyer can send a purchase request to seller
- **Acceptance Criteria**:
  - Form with message and agreed price fields
  - Validate agreed price is positive number
  - Create request with status "pending"
  - Send notification to seller
  - Only authenticated users can create requests
  - Cannot buy own products
- **Dependencies**: FR1.1, FR8.1

#### FR2.2: View Purchase Requests (Seller)
- **Priority**: High
- **Description**: Seller can view incoming purchase requests
- **Acceptance Criteria**:
  - List all pending purchase requests
  - Show buyer information, message, agreed price
  - Display product details
  - Actions: Accept or Reject
  - Real-time updates when new requests arrive
- **Dependencies**: FR2.1, FR8.1

#### FR2.3: Accept/Reject Purchase Request
- **Priority**: High
- **Description**: Seller can accept or reject purchase requests
- **Acceptance Criteria**:
  - Accept: Create order with calculated fees
  - Reject: Update request status and notify buyer
  - Show confirmation modal before action
  - Calculate platform fee (5% of agreed price)
  - Display total amount buyer needs to pay
- **Dependencies**: FR2.2, FR8.1

#### FR2.4: Pay Order to Escrow
- **Priority**: High
- **Description**: Buyer pays for order, funds held in escrow
- **Acceptance Criteria**:
  - Display order details and price breakdown
  - Check wallet balance before payment
  - If insufficient balance, show error and redirect to top-up
  - Deduct total amount from buyer's wallet
  - Hold funds in escrow (not transferred to seller yet)
  - Update order status to "paid"
  - Send notification to seller
- **Dependencies**: FR2.3, FR3.1, FR8.1

#### FR2.5: Confirm Shipment
- **Priority**: High
- **Description**: Seller confirms product has been shipped
- **Acceptance Criteria**:
  - Form to enter tracking number (optional)
  - Update order status to "shipped"
  - Send notification to buyer
  - Only seller can confirm shipment
  - Only for orders with status "paid"
- **Dependencies**: FR2.4, FR8.1

#### FR2.6: Confirm Receipt
- **Priority**: High
- **Description**: Buyer confirms product has been received
- **Acceptance Criteria**:
  - Display order details and product information
  - Confirmation button
  - Release funds from escrow to seller's wallet
  - Update order status to "completed"
  - Prompt buyer to rate seller
  - Only buyer can confirm receipt
  - Only for orders with status "shipped"
- **Dependencies**: FR2.5, FR8.1

#### FR2.7: Auto-Release Funds
- **Priority**: Medium
- **Description**: Automatically release funds after 5 days if no dispute
- **Acceptance Criteria**:
  - Background job runs daily
  - Check orders with status "shipped" and > 5 days old
  - If no dispute raised, auto-release funds to seller
  - Update order status to "completed"
  - Send notification to both parties
- **Dependencies**: FR2.5

### FR3: Wallet System

#### FR3.1: View Wallet Balance
- **Priority**: High
- **Description**: User can view their wallet balance and transaction history
- **Acceptance Criteria**:
  - Display current available balance
  - List recent transactions (deposits, withdrawals, payments, refunds)
  - Filter transactions by type and date range
  - Pagination for transaction history
  - Show transaction details (amount, type, date, description)
- **Dependencies**: FR8.1

#### FR3.2: Top-up Wallet (Bank Transfer)
- **Priority**: High
- **Description**: User can request to top-up wallet via bank transfer
- **Acceptance Criteria**:
  - Display system bank account details
  - Form to enter deposit amount
  - Upload payment receipt image
  - Create deposit request with status "pending"
  - Show pending status until moderator approves
  - Moderator approval adds funds to wallet (not in this spec)
- **Dependencies**: FR3.1, FR8.1

#### FR3.3: Top-up Wallet (VNPay)
- **Priority**: High
- **Description**: User can top-up wallet via VNPay payment gateway
- **Acceptance Criteria**:
  - Form to enter deposit amount (min 10,000 VND)
  - Redirect to VNPay payment page
  - Handle VNPay callback
  - Verify payment signature
  - Auto-credit wallet on successful payment
  - Show success/failure message
  - Record transaction in history
- **Dependencies**: FR3.1, FR8.1

#### FR3.4: Withdraw Funds
- **Priority**: Medium
- **Description**: User can request to withdraw funds from wallet
- **Acceptance Criteria**:
  - Form with amount and bank account details
  - Validate amount <= available balance
  - Minimum withdrawal amount (50,000 VND)
  - Create withdrawal request with status "pending"
  - Deduct amount from available balance (hold in pending)
  - Moderator approval transfers funds (not in this spec)
  - Show withdrawal request status
- **Dependencies**: FR3.1, FR8.1

### FR4: Chat System

#### FR4.1: Start Conversation
- **Priority**: High
- **Description**: Buyer can start a chat with seller about a product
- **Acceptance Criteria**:
  - Click "Chat với người bán" button on product detail
  - Create conversation if not exists
  - Redirect to chat interface
  - Show product context in chat
  - Only authenticated users can chat
  - Cannot chat with self
- **Dependencies**: FR1.1, FR8.1

#### FR4.2: Chat Interface
- **Priority**: High
- **Description**: Real-time messaging between buyer and seller
- **Acceptance Criteria**:
  - Display conversation list (sidebar)
  - Show message history for selected conversation
  - Send text messages
  - Real-time message delivery (Socket.io)
  - Show online/offline status
  - Display product information in chat header
  - Mark messages as read
  - Scroll to latest message
- **Dependencies**: FR4.1, FR8.1

#### FR4.3: Conversation List
- **Priority**: High
- **Description**: User can view all their conversations
- **Acceptance Criteria**:
  - List all conversations
  - Show last message and timestamp
  - Show unread message count
  - Sort by most recent activity
  - Click to open conversation
  - Search conversations by product or user name
- **Dependencies**: FR4.2, FR8.1

### FR5: Order Management

#### FR5.1: View Order List
- **Priority**: High
- **Description**: User can view all their orders
- **Acceptance Criteria**:
  - Two tabs: "Đang mua" (Buying) and "Đang bán" (Selling)
  - Filter by status (all, awaiting payment, paid, shipped, completed, cancelled)
  - Display order summary (product, price, status, date)
  - Click to view order details
  - Pagination for large lists
- **Dependencies**: FR2.1, FR8.1

#### FR5.2: View Order Detail
- **Priority**: High
- **Description**: User can view detailed information about an order
- **Acceptance Criteria**:
  - Display order ID, date, status
  - Show product details with image
  - Display buyer and seller information
  - Show price breakdown (product price + platform fee)
  - Display status timeline
  - Show tracking information if shipped
  - Action buttons based on status and role
- **Dependencies**: FR5.1, FR8.1

#### FR5.3: Order Actions
- **Priority**: High
- **Description**: User can perform actions on orders based on status
- **Acceptance Criteria**:
  - Buyer actions:
    - "Thanh toán" (Pay) - if awaiting_payment
    - "Xác nhận đã nhận" (Confirm Receipt) - if shipped
    - "Khiếu nại" (Dispute) - if shipped
  - Seller actions:
    - "Xác nhận gửi hàng" (Confirm Shipment) - if paid
  - Show appropriate buttons based on user role and order status
  - Confirmation modals for critical actions
- **Dependencies**: FR5.2, FR2.4, FR2.5, FR2.6, FR7.2

### FR6: Rating & Feedback

#### FR6.1: Rate Seller
- **Priority**: High
- **Description**: Buyer can rate seller after confirming receipt
- **Acceptance Criteria**:
  - Rating form with 1-5 stars
  - Optional comment field
  - Submit rating after confirming receipt
  - Update seller's average rating
  - Increment seller's total review count
  - Cannot rate same order twice
  - Only buyer can rate
- **Dependencies**: FR2.6, FR8.1

#### FR6.2: View Ratings
- **Priority**: Medium
- **Description**: Display seller's ratings on their profile
- **Acceptance Criteria**:
  - Show average rating (stars)
  - Display total number of reviews
  - List recent reviews with rating, comment, date
  - Pagination for reviews
  - Visible on seller information card
- **Dependencies**: FR6.1

### FR7: Report System

#### FR7.1: Report Product
- **Priority**: Medium
- **Description**: User can report a product that violates policies
- **Acceptance Criteria**:
  - Report form with reason dropdown
  - Reasons: Counterfeit, Inappropriate content, Scam, Other
  - Required description field
  - Optional evidence images (up to 3)
  - Create report with status "pending"
  - Send notification to moderators
  - Only authenticated users can report
  - Cannot report own products
- **Dependencies**: FR1.1, FR8.1

#### FR7.2: Create Dispute
- **Priority**: High
- **Description**: Buyer can raise a dispute if product not as described
- **Acceptance Criteria**:
  - Dispute form with reason dropdown
  - Reasons: Not as described, Damaged, Not received, Other
  - Required description field
  - Required evidence images (1-5)
  - Create dispute with status "pending"
  - Update order status to "disputed"
  - Freeze escrow funds
  - Send notification to seller and moderators
  - Only buyer can create dispute
  - Only for orders with status "shipped"
  - Cannot dispute after confirming receipt
- **Dependencies**: FR2.5, FR8.1

### FR8: Profile Management

#### FR8.1: View Profile
- **Priority**: High
- **Description**: User can view their profile information
- **Acceptance Criteria**:
  - Display avatar, full name, email, phone
  - Show verification status (KYC badge)
  - Display rating as seller
  - Show member since date
  - Button to edit profile
  - Button to submit KYC verification
- **Dependencies**: None (MVP already has basic profile)

#### FR8.2: Edit Profile
- **Priority**: High
- **Description**: User can update their profile information
- **Acceptance Criteria**:
  - Form with fields: avatar, full name, phone, address
  - Upload avatar image (max 2MB)
  - Validate phone number format
  - Update profile data
  - Show success message
  - Cannot change email (requires verification)
- **Dependencies**: FR8.1

#### FR8.3: KYC Verification
- **Priority**: Medium
- **Description**: User can submit identity verification documents
- **Acceptance Criteria**:
  - Upload form with 3 required images:
    - ID Card Front
    - ID Card Back
    - Selfie with ID
  - Validate image format and size
  - Submit KYC request with status "pending"
  - Show pending status until moderator approves
  - Display verification badge if approved
  - Moderator approval process (not in this spec)
- **Dependencies**: FR8.1

### FR9: Shipping Integration

#### FR9.1: Create Shipping Order
- **Priority**: Low
- **Description**: Seller can create a shipping order with tracking
- **Acceptance Criteria**:
  - Form with shipping provider dropdown
  - Enter tracking number
  - Optional estimated delivery date
  - Link shipping order to main order
  - Update order with tracking information
  - Send tracking info to buyer
- **Dependencies**: FR2.5

#### FR9.2: View Shipping Status
- **Priority**: Low
- **Description**: Buyer can view shipping status and tracking
- **Acceptance Criteria**:
  - Display shipping provider and tracking number
  - Show estimated delivery date
  - Link to external tracking page
  - Display on order detail page
- **Dependencies**: FR9.1, FR5.2

### FR10: Payment Integration

#### FR10.1: VNPay Integration
- **Priority**: High
- **Description**: Integrate VNPay payment gateway for wallet top-up
- **Acceptance Criteria**:
  - Generate VNPay payment URL with correct parameters
  - Redirect user to VNPay payment page
  - Handle VNPay callback (return URL)
  - Verify payment signature (HMAC SHA512)
  - Process successful payment:
    - Credit wallet balance
    - Create transaction record
    - Send confirmation email
  - Handle failed payment:
    - Show error message
    - Log failure reason
  - Support VNPay test environment for development
- **Dependencies**: FR3.3

## 2. Non-Functional Requirements

### NFR1: Performance
- **NFR1.1**: Page load time < 3 seconds on 3G connection
- **NFR1.2**: API response time < 500ms for 95% of requests
- **NFR1.3**: Support 100 concurrent users
- **NFR1.4**: Real-time message delivery < 1 second
- **NFR1.5**: Image upload < 10 seconds for 5MB file

### NFR2: Security
- **NFR2.1**: All API calls use HTTPS
- **NFR2.2**: JWT tokens expire after 24 hours
- **NFR2.3**: Passwords hashed with bcrypt (10 rounds)
- **NFR2.4**: Input validation on both frontend and backend
- **NFR2.5**: File upload validation (type, size, content)
- **NFR2.6**: Rate limiting: 100 requests per minute per IP
- **NFR2.7**: XSS protection (sanitize user inputs)
- **NFR2.8**: CSRF protection for state-changing operations
- **NFR2.9**: VNPay signature verification for all callbacks

### NFR3: Usability
- **NFR3.1**: All text in Vietnamese
- **NFR3.2**: Responsive design (mobile, tablet, desktop)
- **NFR3.3**: Consistent UI/UX following Chợ Tốt design
- **NFR3.4**: Clear error messages with actionable steps
- **NFR3.5**: Loading indicators for all async operations
- **NFR3.6**: Confirmation modals for destructive actions
- **NFR3.7**: Form validation with inline error messages
- **NFR3.8**: Accessibility: keyboard navigation, ARIA labels

### NFR4: Reliability
- **NFR4.1**: 99% uptime
- **NFR4.2**: Automatic retry for failed API calls (3 attempts)
- **NFR4.3**: Graceful degradation if Socket.io fails
- **NFR4.4**: Database backup daily
- **NFR4.5**: Transaction atomicity (ACID compliance)
- **NFR4.6**: Error logging and monitoring

### NFR5: Scalability
- **NFR5.1**: Horizontal scaling for backend servers
- **NFR5.2**: Database indexing for frequently queried fields
- **NFR5.3**: Pagination for all list endpoints
- **NFR5.4**: Image optimization and compression
- **NFR5.5**: CDN for static assets

### NFR6: Maintainability
- **NFR6.1**: Code documentation (JSDoc comments)
- **NFR6.2**: Consistent code style (ESLint, Prettier)
- **NFR6.3**: Modular architecture (separation of concerns)
- **NFR6.4**: Environment-based configuration
- **NFR6.5**: Comprehensive error handling
- **NFR6.6**: Logging for debugging and auditing

### NFR7: Compatibility
- **NFR7.1**: Support modern browsers (Chrome, Firefox, Safari, Edge)
- **NFR7.2**: Mobile browsers (iOS Safari, Chrome Mobile)
- **NFR7.3**: Node.js 16+ for backend
- **NFR7.4**: MongoDB 5+ for database

## 3. Constraints

### C1: Technical Constraints
- **C1.1**: Must use existing tech stack (React, Node.js, MongoDB)
- **C1.2**: Must integrate with VNPay (Vietnamese payment gateway)
- **C1.3**: Local file storage (no cloud storage like AWS S3)
- **C1.4**: MongoDB connection string provided by user

### C2: Business Constraints
- **C2.1**: Platform fee fixed at 5% of transaction amount
- **C2.2**: Minimum withdrawal amount: 50,000 VND
- **C2.3**: Minimum top-up amount: 10,000 VND
- **C2.4**: Auto-release funds after 5 days if no dispute
- **C2.5**: Maximum 5 images per product
- **C2.6**: Maximum image size: 5MB

### C3: Time Constraints
- **C3.1**: Complete user-side features only (no moderator/admin)
- **C3.2**: Focus on core transaction flow first
- **C3.3**: VIP/Promotion features are low priority

### C4: Scope Constraints
- **C4.1**: No mobile app (web only)
- **C4.2**: No push notifications
- **C4.3**: No email notifications (optional)
- **C4.4**: No advanced search (Elasticsearch)
- **C4.5**: No recommendation system
- **C4.6**: No social features (follow users)

## 4. Assumptions

### A1: User Assumptions
- **A1.1**: Users have basic internet literacy
- **A1.2**: Users have access to smartphone or computer
- **A1.3**: Users have bank account for deposits/withdrawals
- **A1.4**: Users understand escrow system concept

### A2: Technical Assumptions
- **A2.1**: MongoDB Atlas is available and reliable
- **A2.2**: VNPay API is stable and documented
- **A2.3**: Users have modern browsers with JavaScript enabled
- **A2.4**: Server has sufficient storage for uploaded images

### A3: Business Assumptions
- **A3.1**: Moderators will approve deposits/withdrawals manually
- **A3.2**: Moderators will handle disputes fairly
- **A3.3**: Users will provide accurate product descriptions
- **A3.4**: Sellers will ship products after receiving payment

## 5. Dependencies

### D1: External Dependencies
- **D1.1**: VNPay payment gateway API
- **D1.2**: MongoDB Atlas database service
- **D1.3**: Node.js runtime environment
- **D1.4**: npm packages (Express, Socket.io, Multer, etc.)

### D2: Internal Dependencies
- **D2.1**: MVP authentication system (already complete)
- **D2.2**: MVP product browsing (already complete)
- **D2.3**: File upload middleware (already complete)
- **D2.4**: Database connection (already complete)

### D3: Feature Dependencies
- **D3.1**: Transaction flow depends on wallet system
- **D3.2**: Chat depends on authentication
- **D3.3**: Rating depends on completed orders
- **D3.4**: Dispute depends on shipped orders
- **D3.5**: KYC depends on profile management

## 6. Acceptance Criteria Summary

### AC1: Core Transaction Flow
- User can create product listing
- Buyer can send purchase request
- Seller can accept/reject request
- Buyer can pay to escrow
- Seller can confirm shipment
- Buyer can confirm receipt
- Funds released to seller
- Buyer can rate seller

### AC2: Wallet Management
- User can view balance and transaction history
- User can top-up via bank transfer or VNPay
- User can request withdrawal
- All transactions are recorded

### AC3: Communication
- Buyer and seller can chat in real-time
- Messages are delivered instantly
- Conversation history is preserved
- Product context is shown in chat

### AC4: Order Tracking
- User can view all orders (buying and selling)
- User can view order details and status
- User can perform actions based on order status
- Order status updates are reflected in real-time

### AC5: Trust & Safety
- User can report products
- Buyer can raise disputes
- User can submit KYC verification
- Seller ratings are displayed

## 7. Success Metrics

### M1: User Engagement
- **M1.1**: 80% of registered users create at least one product
- **M1.2**: 60% of products receive at least one purchase request
- **M1.3**: 50% of purchase requests are accepted
- **M1.4**: Average 5 messages per conversation

### M2: Transaction Success
- **M2.1**: 90% of paid orders are completed successfully
- **M2.2**: < 5% dispute rate
- **M2.3**: Average 3 days from payment to completion
- **M2.4**: 95% of payments are successful

### M3: User Satisfaction
- **M3.1**: Average seller rating > 4.0 stars
- **M3.2**: < 10% report rate
- **M3.3**: 70% of buyers rate sellers
- **M3.4**: 80% of users complete KYC verification

### M4: System Performance
- **M4.1**: 99% API uptime
- **M4.2**: < 500ms average API response time
- **M4.3**: < 1 second message delivery time
- **M4.4**: Zero data loss incidents

## 8. Risk Assessment

### R1: Technical Risks
- **R1.1**: VNPay integration complexity - **Mitigation**: Use test environment, thorough testing
- **R1.2**: Real-time chat scalability - **Mitigation**: Connection pooling, message batching
- **R1.3**: Escrow system bugs - **Mitigation**: Comprehensive testing, transaction logging
- **R1.4**: File storage limitations - **Mitigation**: Image compression, size limits

### R2: Business Risks
- **R2.1**: Fraud and scams - **Mitigation**: KYC verification, dispute system, user ratings
- **R2.2**: Payment disputes - **Mitigation**: Clear policies, evidence collection, moderator review
- **R2.3**: User trust issues - **Mitigation**: Escrow system, verified badges, transparent process

### R3: User Experience Risks
- **R3.1**: Complex transaction flow - **Mitigation**: Clear UI, step-by-step guidance, tooltips
- **R3.2**: Slow performance - **Mitigation**: Optimization, caching, CDN
- **R3.3**: Mobile usability - **Mitigation**: Responsive design, mobile testing

## 9. Out of Scope

The following features are explicitly out of scope for this specification:

### OS1: Moderator Features
- Approve/reject product listings
- Approve/reject KYC verifications
- Approve/reject deposit requests
- Approve/reject withdrawal requests
- Handle reports and disputes
- Ban/suspend users

### OS2: Admin Features
- View statistics and analytics
- Manage user accounts
- Assign roles
- Configure system settings
- Manage moderator accounts

### OS3: Advanced Features
- Mobile application
- Push notifications
- Email notifications
- Advanced search (Elasticsearch)
- Recommendation system
- Social features (follow, like, share)
- Multiple languages
- Dark mode
- Export data
- API for third-party integrations

### OS4: Payment Features
- Multiple payment gateways
- Cryptocurrency payments
- Installment payments
- Refund to original payment method

### OS5: Shipping Features
- Real-time tracking integration
- Multiple shipping providers API
- Automatic shipping label generation
- Shipping cost calculation

## 10. Glossary

- **Escrow**: A financial arrangement where funds are held by a third party (the platform) until the transaction is completed
- **KYC**: Know Your Customer - identity verification process
- **VNPay**: Vietnamese payment gateway service
- **Platform Fee**: 5% commission charged by the platform on each transaction
- **Purchase Request**: Initial offer from buyer to seller
- **Order**: Formal transaction created after seller accepts purchase request
- **Dispute**: Formal complaint raised by buyer if product not as described
- **Auto-Release**: Automatic release of escrow funds to seller after 5 days if no dispute
- **Verified Badge**: Blue checkmark indicating user has completed KYC verification
- **Wallet**: Digital account holding user's balance for transactions
- **Transaction**: Any movement of funds (deposit, withdrawal, payment, refund)
- **Conversation**: Chat channel between buyer and seller about a specific product
