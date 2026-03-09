# API Endpoints Reference

This document lists all API endpoints that need to be implemented based on the services created in Phase 1.

---

## 🔐 Authentication

**Base URL**: `/api/auth`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | ✅ Exists |
| POST | `/login` | Login user | ✅ Exists |
| GET | `/profile` | Get user profile | ✅ Exists |
| POST | `/logout` | Logout user | ✅ Exists |

---

## 👤 Users

**Base URL**: `/api/users`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/:id/public` | Get public profile | 🆕 Need |
| PUT | `/profile` | Update own profile | 🆕 Need |
| POST | `/avatar` | Upload avatar | 🆕 Need |
| POST | `/kyc` | Submit KYC verification | 🆕 Need |
| GET | `/kyc/status` | Get KYC status | 🆕 Need |
| GET | `/:id/reviews` | Get user's reviews | 🆕 Need |
| GET | `/:id/rating-stats` | Get rating statistics | 🆕 Need |

---

## 📦 Products

**Base URL**: `/api/products`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/` | Get all products | ✅ Exists |
| GET | `/:id` | Get product by ID | ✅ Exists |
| GET | `/search` | Search products | ✅ Exists |
| POST | `/` | Create product | 🆕 Need |
| PUT | `/:id` | Update product | 🆕 Need |
| DELETE | `/:id` | Delete product | 🆕 Need |
| GET | `/my-products` | Get user's products | 🆕 Need |
| PATCH | `/:id/status` | Update product status | 🆕 Need |

---

## 🛒 Orders

**Base URL**: `/api/orders`

### Purchase Requests

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/purchase-request` | Create purchase request | 🆕 Need |
| GET | `/purchase-requests/sent` | Get sent requests (buyer) | 🆕 Need |
| GET | `/purchase-requests/received` | Get received requests (seller) | 🆕 Need |
| POST | `/:requestId/accept` | Accept purchase request | 🆕 Need |
| POST | `/:requestId/reject` | Reject purchase request | 🆕 Need |

### Orders

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/buying` | Get orders as buyer | 🆕 Need |
| GET | `/selling` | Get orders as seller | 🆕 Need |
| GET | `/:id` | Get order details | 🆕 Need |
| POST | `/:id/pay` | Pay order to escrow | 🆕 Need |
| POST | `/:id/ship` | Confirm shipment (seller) | 🆕 Need |
| POST | `/:id/confirm-receipt` | Confirm receipt (buyer) | 🆕 Need |
| POST | `/:id/rate` | Rate seller | 🆕 Need |

---

## 💰 Wallet

**Base URL**: `/api/wallets`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/balance` | Get wallet balance | 🆕 Need |
| GET | `/transactions` | Get transaction history | 🆕 Need |
| POST | `/withdraw` | Create withdrawal request | 🆕 Need |
| GET | `/withdrawals` | Get withdrawal history | 🆕 Need |

---

## 💳 Payments

**Base URL**: `/api/payments`

### VNPay

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/vnpay/create` | Create VNPay payment | 🆕 Need |
| GET | `/vnpay/callback` | VNPay IPN callback | 🆕 Need |
| GET | `/vnpay/return` | VNPay return URL | 🆕 Need |

### Bank Transfer

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/deposit/bank-transfer` | Create bank transfer request | 🆕 Need |

---

## 💬 Chat

**Base URL**: `/api/chat`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/conversations` | Get user's conversations | 🆕 Need |
| GET | `/conversations/:id/messages` | Get messages | 🆕 Need |
| POST | `/conversations` | Create conversation | 🆕 Need |
| POST | `/messages` | Send message (REST fallback) | 🆕 Need |
| GET | `/unread-count` | Get unread message count | 🆕 Need |
| POST | `/conversations/:id/mark-read` | Mark messages as read | 🆕 Need |

### Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Client → Server | User connects |
| `disconnect` | Client → Server | User disconnects |
| `join_conversation` | Client → Server | Join chat room |
| `leave_conversation` | Client → Server | Leave chat room |
| `send_message` | Client → Server | Send message |
| `receive_message` | Server → Client | Receive message |
| `typing` | Client → Server | User typing |
| `stop_typing` | Client → Server | User stopped typing |
| `user_typing` | Server → Client | Other user typing |
| `user_stop_typing` | Server → Client | Other user stopped |
| `mark_as_read` | Client → Server | Mark as read |
| `marked_as_read` | Server → Client | Marked confirmation |
| `user_online` | Server → Client | User came online |
| `user_offline` | Server → Client | User went offline |
| `new_message_notification` | Server → Client | New message alert |

---

## 📋 Reports

**Base URL**: `/api/reports`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/product` | Report product | 🆕 Need |
| POST | `/user` | Report user | 🆕 Need |
| GET | `/` | Get reports | 🆕 Need |
| GET | `/:id` | Get report details | 🆕 Need |
| GET | `/my-reports` | Get user's reports | 🆕 Need |

---

## ⚖️ Disputes

**Base URL**: `/api/disputes`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/` | Create dispute | 🆕 Need |
| GET | `/` | Get disputes | 🆕 Need |
| GET | `/:id` | Get dispute details | 🆕 Need |
| POST | `/:id/seller-response` | Add seller response | 🆕 Need |
| GET | `/my-disputes` | Get user's disputes | 🆕 Need |

---

## ⭐ Reviews

**Base URL**: `/api/reviews`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/` | Create review | 🆕 Need |
| GET | `/user/:userId` | Get user's reviews | 🆕 Need |
| GET | `/:id` | Get review details | 🆕 Need |
| GET | `/order/:orderId` | Get review by order | 🆕 Need |
| PUT | `/:id` | Update review | 🆕 Need |
| DELETE | `/:id` | Delete review | 🆕 Need |
| GET | `/my-reviews` | Get reviews written by user | 🆕 Need |
| GET | `/can-review/:orderId` | Check if can review | 🆕 Need |

---

## 🚚 Delivery

**Base URL**: `/api/delivery`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/create` | Create shipping order | 🆕 Need |
| GET | `/:orderId` | Get shipping info | 🆕 Need |
| POST | `/:id/update-tracking` | Update tracking | 🆕 Need |

---

## 📤 File Upload

**Base URL**: `/api/upload`

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/products/temp` | Upload product images | ✅ Exists |
| POST | `/avatar` | Upload avatar | 🆕 Need |
| POST | `/kyc` | Upload KYC documents | 🆕 Need |
| POST | `/evidence` | Upload evidence images | 🆕 Need |

---

## 📊 Summary

### Existing Endpoints: 7
- Authentication: 4
- Products: 3

### New Endpoints Needed: 60+
- Users: 7
- Products: 5
- Orders: 11
- Wallet: 4
- Payments: 4
- Chat: 6
- Reports: 5
- Disputes: 5
- Reviews: 8
- Delivery: 3
- Upload: 3

### Total Endpoints: 67+

---

## 🔒 Authentication Requirements

### Public Endpoints (No Auth Required)
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/products`
- GET `/api/products/:id`
- GET `/api/products/search`
- GET `/api/users/:id/public`
- GET `/api/users/:id/reviews`
- GET `/api/reviews/user/:userId`

### Protected Endpoints (Auth Required)
All other endpoints require JWT authentication via:
- Header: `Authorization: Bearer <token>`
- Or: Cookie with token

### Role-Based Access
- **User**: All user endpoints
- **Moderator**: Report/dispute resolution (Phase 2+)
- **Admin**: System management (Phase 2+)

---

## 📝 Request/Response Format

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error"
}
```

### Pagination Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## 🚀 Implementation Priority

### Phase 2 (High Priority)
1. Product CRUD endpoints
2. User profile endpoints
3. File upload endpoints

### Phase 3 (High Priority)
1. Wallet endpoints
2. VNPay payment endpoints

### Phase 4 (High Priority)
1. Order endpoints
2. Purchase request endpoints
3. Escrow payment endpoints

### Phase 5 (Medium Priority)
1. Chat endpoints
2. Socket.io setup

### Phase 6 (Medium Priority)
1. Order management endpoints

### Phase 7 (Medium Priority)
1. Review endpoints
2. Report endpoints
3. Dispute endpoints

### Phase 8 (Low Priority)
1. Delivery endpoints

---

## 📚 Service → Controller → Route Mapping

Each service function needs:
1. **Controller** - Handle HTTP request/response
2. **Route** - Define endpoint and middleware
3. **Middleware** - Authentication, validation

Example:
```
Service: orderService.createPurchaseRequest()
    ↓
Controller: orderController.createPurchaseRequest()
    ↓
Route: POST /api/orders/purchase-request
    ↓
Middleware: auth.middleware, validation
```

---

## ✅ Next Steps

1. Create controllers for each service
2. Create routes for each controller
3. Add validation middleware
4. Test each endpoint
5. Document with Postman/Swagger

Ready to implement Phase 2! 🚀

## Order Management APIs

### Purchase Request Endpoints

#### Create Purchase Request
- **POST** `/api/orders/purchase-request`
- **Auth**: Required
- **Description**: Create a purchase request for a product
- **Body**:
  ```json
  {
    "listingId": "string (ObjectId)",
    "message": "string (max 500 chars)",
    "agreedPrice": "number (> 0)"
  }
  ```
- **Response**: Purchase request object with populated product and user details
- **Errors**: 
  - 400: Missing required fields, invalid price, product not available, self-purchase, duplicate request

#### Get Sent Purchase Requests (Buyer)
- **GET** `/api/orders/purchase-requests/sent`
- **Auth**: Required
- **Description**: Get purchase requests sent by the authenticated user
- **Query Params**:
  - `status`: Filter by status (pending, accepted, rejected)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
- **Response**: Paginated list of sent purchase requests

#### Get Received Purchase Requests (Seller)
- **GET** `/api/orders/purchase-requests/received`
- **Auth**: Required
- **Description**: Get purchase requests received by the authenticated user
- **Query Params**:
  - `status`: Filter by status (pending, accepted, rejected)
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
- **Response**: Paginated list of received purchase requests

#### Accept Purchase Request
- **POST** `/api/orders/:requestId/accept`
- **Auth**: Required (seller only)
- **Description**: Accept a purchase request and create an order
- **Response**: Created order object with calculated fees
- **Business Logic**:
  - Creates order with 5% platform fee
  - Updates product status to "pending"
  - Updates request status to "accepted"
- **Errors**:
  - 400: Request not found, already processed, unauthorized
  - 404: Request not found

#### Reject Purchase Request
- **POST** `/api/orders/:requestId/reject`
- **Auth**: Required (seller only)
- **Description**: Reject a purchase request
- **Body**:
  ```json
  {
    "reason": "string (optional, max 500 chars)"
  }
  ```
- **Response**: Updated purchase request object
- **Errors**:
  - 400: Request not found, already processed, unauthorized
  - 404: Request not found

### Business Rules

1. **Purchase Request Creation**:
   - Buyer cannot purchase their own products
   - Only one pending request per buyer per product
   - Product must be in "active" status
   - Message and agreed price are required

2. **Request Processing**:
   - Only seller can accept/reject requests
   - Only pending requests can be processed
   - Accepting creates an order with 5% platform fee
   - Product status changes to "pending" when accepted

3. **Order Creation**:
   - `agreedAmount`: The negotiated price
   - `platformFee`: 5% of agreed amount
   - `totalToPay`: agreed amount + platform fee
   - Initial status: "awaiting_payment"

4. **Authorization**:
   - All endpoints require authentication
   - Buyers can only see their sent requests
   - Sellers can only see their received requests
   - Only request participants can accept/reject

#### Pay Order
- **POST** `/api/orders/:orderId/pay`
- **Auth**: Required (buyer only)
- **Description**: Pay for an order and move funds to escrow
- **Response**: Updated order object with payment status
- **Business Logic**:
  - Validates order status (must be "awaiting_payment")
  - Creates escrow hold for agreed amount
  - Updates order status to "paid"
  - Updates payment status to "paid"
- **Errors**:
  - 400: Order not found, already paid, insufficient balance
  - 403: Unauthorized (not the buyer)

#### Confirm Shipment
- **POST** `/api/orders/:orderId/ship`
- **Auth**: Required (seller only)
- **Description**: Confirm that the order has been shipped
- **Body**:
  ```json
  {
    "trackingNumber": "string (optional)",
    "shippingProvider": "string (optional)",
    "estimatedDelivery": "date (optional)"
  }
  ```
- **Response**: Updated order object with shipping information
- **Business Logic**:
  - Validates order status (must be "paid")
  - Updates order status to "shipped"
  - Records shipping information
- **Errors**:
  - 400: Order not found, not paid yet
  - 403: Unauthorized (not the seller)

#### Confirm Receipt
- **POST** `/api/orders/:orderId/confirm-receipt`
- **Auth**: Required (buyer only)
- **Description**: Confirm receipt of the order and release funds to seller
- **Response**: Updated order object with completion status
- **Business Logic**:
  - Validates order status (must be "shipped")
  - Releases funds from escrow to seller
  - Updates order status to "completed"
- **Errors**:
  - 400: Order not found, not shipped yet
  - 403: Unauthorized (not the buyer)

### Order Status Flow

```
awaiting_payment → paid → shipped → completed
       ↓            ↓        ↓
   cancelled    cancelled  cancelled
```

**Status Descriptions**:
- `awaiting_payment`: Order created, waiting for buyer payment
- `paid`: Payment received, funds in escrow, ready for shipping
- `shipped`: Seller confirmed shipment, waiting for buyer confirmation
- `completed`: Buyer confirmed receipt, funds released to seller
- `cancelled`: Order cancelled at any stage
- `disputed`: Dispute raised (future implementation)

### Business Rules

1. **Payment Flow**:
   - Only buyers can pay for orders
   - Payment moves funds to escrow (not directly to seller)
   - Platform fee (5%) is collected during payment

2. **Shipping Flow**:
   - Only sellers can confirm shipment
   - Order must be paid before shipping
   - Shipping information is optional but recommended

3. **Completion Flow**:
   - Only buyers can confirm receipt
   - Order must be shipped before completion
   - Confirming receipt releases funds to seller

4. **Authorization**:
   - Each action requires specific user role (buyer/seller)
   - Users can only act on their own orders
   - Status transitions are strictly enforced