# Fix Lỗi Purchase Request - ERR_CONNECTION_REFUSED

## Vấn Đề
```
POST http://localhost:5000/api/orders/purchase-request net::ERR_CONNECTION_REFUSED
Error: Không thể kết nối đến server
```

## Nguyên Nhân
Backend server không chạy hoặc đang chạy ở port khác.

## Giải Pháp

### 1. Kiểm Tra Backend Đang Chạy
```bash
cd backend
npm start
```

Backend phải chạy ở port 5000 (theo .env: `PORT=5000`)

### 2. Kiểm Tra Backend Logs
Khi start backend, phải thấy:
```
Server is running on port 5000
Environment: development
MongoDB Connected
Socket.io enabled for real-time chat
```

### 3. Test API Trực Tiếp
```bash
# Test health check
curl http://localhost:5000/health

# Test orders endpoint (cần token)
curl http://localhost:5000/api/orders
```

### 4. Kiểm Tra Routes
File: `backend/src/routes.js`
```javascript
router.use('/orders', orderRoutes);
```

Endpoint đầy đủ: `POST /api/orders/purchase-request`

### 5. Kiểm Tra Order Routes
File: `backend/src/modules/orders/order.route.js`

Phải có route:
```javascript
router.post('/purchase-request', authenticate, createPurchaseRequest);
```

## Các Files Đã Tạo/Sửa

### 1. UserProfile Component (Mới)
- `frontend/src/modules/profile/UserProfile.jsx`
- `frontend/src/modules/profile/UserProfile.css`
- Hiển thị thông tin người bán
- Hiển thị danh sách sản phẩm của người bán
- Route: `/user/:userId`

### 2. Routes
- Thêm route `/user/:userId` vào `frontend/src/routes/index.js`

## Cách Test

### 1. Start Backend
```bash
cd backend
npm start
```

Đợi thấy message "Server is running on port 5000"

### 2. Start Frontend
```bash
cd frontend
npm start
```

### 3. Test Flow
1. Đăng nhập vào hệ thống
2. Vào trang chi tiết sản phẩm
3. Click "Xem trang cá nhân" của người bán
4. Xem thông tin người bán và sản phẩm của họ
5. Quay lại trang sản phẩm
6. Click "Mua ngay"
7. Điền thông tin và gửi yêu cầu

### 4. Kiểm Tra Network Tab
Mở DevTools > Network tab:
- Request URL phải là: `http://localhost:5000/api/orders/purchase-request`
- Method: POST
- Status: 201 Created (nếu thành công)

## Troubleshooting

### Nếu Vẫn Lỗi Connection Refused

1. **Kiểm tra port đang được sử dụng**
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

2. **Kiểm tra .env file**
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
```

3. **Restart cả backend và frontend**
```bash
# Stop all (Ctrl+C)
# Start backend
cd backend && npm start

# Start frontend (terminal mới)
cd frontend && npm start
```

4. **Clear browser cache**
- Hard refresh: Ctrl+Shift+R
- Hoặc clear cache trong DevTools

5. **Kiểm tra MongoDB connection**
Nếu backend start nhưng không kết nối được MongoDB:
- Kiểm tra MONGODB_URI trong .env
- Kiểm tra network/firewall
- Kiểm tra MongoDB Atlas whitelist IP

### Nếu Endpoint 404

Kiểm tra backend routes:
```bash
cd backend
node -e "const routes = require('./src/routes'); console.log('Routes loaded');"
```

### Nếu 401 Unauthorized

Token không hợp lệ hoặc hết hạn:
- Logout và login lại
- Kiểm tra localStorage có token không
- Kiểm tra JWT_SECRET trong backend .env

## API Endpoint Reference

### Create Purchase Request
```
POST /api/orders/purchase-request
Headers: Authorization: Bearer <token>
Body: {
  productId: string,
  message: string,
  proposedPrice: number (optional)
}
```

### Response Success (201)
```json
{
  "success": true,
  "message": "Yêu cầu mua hàng đã được gửi",
  "data": {
    "_id": "...",
    "product": {...},
    "buyer": {...},
    "seller": {...},
    "status": "pending",
    ...
  }
}
```

### Response Error (400/401/500)
```json
{
  "success": false,
  "message": "Error message"
}
```

## Checklist
- [ ] Backend đang chạy ở port 5000
- [ ] MongoDB đã kết nối thành công
- [ ] Frontend đang chạy ở port 3000
- [ ] User đã đăng nhập (có token)
- [ ] Route `/api/orders/purchase-request` tồn tại
- [ ] Network tab không có lỗi CORS
- [ ] Browser console không có lỗi JavaScript
