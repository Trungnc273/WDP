# Debug: Quản Lý Tin Không Hiển Thị Sản Phẩm

## Vấn Đề
Đã đăng tin nhưng vào trang "Quản lý tin" không thấy sản phẩm.

## Các Nguyên Nhân Có Thể

### 1. Backend Không Chạy
```bash
cd backend
npm start
```

### 2. Token Không Hợp Lệ
- Logout và login lại
- Kiểm tra localStorage có key "token" không
- Token có thể đã hết hạn

### 3. Sản Phẩm Thuộc User Khác
- Kiểm tra user đang login có đúng không
- Sản phẩm được tạo bởi user nào

### 4. API Endpoint Sai
- Frontend gọi: `GET /api/products/my-products`
- Backend route: `GET /api/products/my-products`
- Phải có header: `Authorization: Bearer <token>`

## Cách Debug

### Bước 1: Kiểm Tra Console Logs
Mở DevTools Console (F12) và xem logs:
```
Fetching my products with params: {page: 1, limit: 20}
My products response: {products: [...], total: X, ...}
```

### Bước 2: Kiểm Tra Network Tab
1. Mở DevTools > Network tab
2. Reload trang /my-products
3. Tìm request: `my-products`
4. Kiểm tra:
   - Request URL: `http://localhost:5000/api/products/my-products`
   - Method: GET
   - Headers: Authorization: Bearer ...
   - Status: 200 OK
   - Response: {success: true, data: {...}}

### Bước 3: Kiểm Tra Response Data
Click vào request trong Network tab > Preview/Response:
```json
{
  "success": true,
  "data": {
    "products": [...],
    "total": 5,
    "page": 1,
    "totalPages": 1,
    "limit": 20
  }
}
```

### Bước 4: Test API Trực Tiếp

#### Lấy Token
1. Mở DevTools (F12)
2. Application tab > Local Storage
3. Copy giá trị của key "token"

#### Test với cURL
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/products/my-products
```

#### Test với Node Script
```bash
cd backend
# Sửa YOUR_TOKEN trong file
node test-my-products.js
```

### Bước 5: Kiểm Tra Database
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const Product = require('./src/modules/products/product.model');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/reflow')
  .then(async () => {
    const products = await Product.find().populate('seller', 'fullName email');
    console.log('Total products:', products.length);
    products.forEach(p => {
      console.log(\`- \${p.title} by \${p.seller?.email} (status: \${p.status})\`);
    });
    process.exit(0);
  });
"
```

## Các Lỗi Thường Gặp

### Lỗi 401 Unauthorized
```json
{
  "success": false,
  "message": "Token không hợp lệ"
}
```

**Giải pháp:**
- Logout và login lại
- Kiểm tra JWT_SECRET trong backend .env
- Kiểm tra token format: "Bearer <token>"

### Lỗi 404 Not Found
```
GET http://localhost:5000/api/products/my-products 404
```

**Giải pháp:**
- Kiểm tra backend đang chạy
- Kiểm tra route trong `backend/src/modules/products/product.route.js`
- Route `/my-products` phải đứng TRƯỚC route `/:id`

### Response Trống
```json
{
  "success": true,
  "data": {
    "products": [],
    "total": 0
  }
}
```

**Nguyên nhân:**
- User chưa đăng tin nào
- Sản phẩm thuộc user khác
- Filter status không khớp

**Kiểm tra:**
```javascript
// Trong backend controller
console.log('User ID:', req.user.userId);
console.log('Products found:', products.length);
```

### Lỗi CORS
```
Access to XMLHttpRequest blocked by CORS policy
```

**Giải pháp:**
- Kiểm tra `backend/src/server.js` có CORS config
- FRONTEND_URL trong .env phải đúng: `http://localhost:3000`

## Checklist Debug

- [ ] Backend đang chạy ở port 5000
- [ ] Frontend đang chạy ở port 3000
- [ ] User đã đăng nhập (có token trong localStorage)
- [ ] Console không có lỗi JavaScript
- [ ] Network tab thấy request đến `/my-products`
- [ ] Request có header Authorization
- [ ] Response status 200 OK
- [ ] Response data có products array
- [ ] Database có sản phẩm của user này

## Code Changes

### MyProducts.jsx
Đã thêm console.log để debug:
```javascript
console.log('Fetching my products with params:', params);
console.log('My products response:', data);
console.log('Error response:', error.response?.data);
```

### Backend Controller (Nếu Cần)
Thêm logs vào `backend/src/modules/products/product.controller.js`:
```javascript
async function getMyProducts(req, res, next) {
  try {
    const userId = req.user.userId;
    console.log('Getting products for user:', userId);
    
    // ... existing code
    
    console.log('Found products:', result.products.length);
    return sendSuccess(res, 200, result, 'Danh sách sản phẩm của bạn');
  } catch (error) {
    console.error('Error in getMyProducts:', error);
    next(error);
  }
}
```

## Test Flow

1. **Đăng nhập**
   - Email: test@example.com
   - Password: password123

2. **Đăng tin mới**
   - Vào /product/create
   - Điền đầy đủ thông tin
   - Upload ảnh
   - Submit

3. **Kiểm tra console**
   - Xem log "Product created successfully"
   - Note product ID

4. **Vào Quản lý tin**
   - Navigate to /my-products
   - Xem console logs
   - Xem Network tab

5. **Verify**
   - Sản phẩm vừa tạo phải hiển thị
   - Status badge: "Đang bán"
   - Có nút "Sửa" và "Xóa"

## Nếu Vẫn Không Thấy

### Kiểm Tra User ID Match
```javascript
// Trong browser console
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Current user ID:', payload.userId);

// So sánh với seller ID của product trong database
```

### Hard Refresh
- Ctrl + Shift + R (Windows/Linux)
- Cmd + Shift + R (Mac)
- Hoặc clear cache và reload

### Restart Everything
```bash
# Stop all (Ctrl+C)

# Backend
cd backend && npm start

# Frontend (terminal mới)
cd frontend && npm start
```
