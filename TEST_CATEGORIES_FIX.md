# Fix Lỗi Danh Mục Không Hiển Thị

## Vấn Đề
- Dropdown danh mục chỉ hiển thị "Chọn danh mục" 
- Không có options để chọn

## Nguyên Nhân
**Port không khớp giữa frontend và backend:**
- Backend chạy ở port 5000 (theo .env)
- Frontend API service đang gọi port 5001
- Dẫn đến không fetch được data từ API

## Giải Pháp

### 1. Sửa Port trong API Service
File: `frontend/src/services/api.js`
```javascript
// Trước
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Sau
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### 2. Tạo File .env cho Frontend
File: `frontend/.env`
```
REACT_APP_API_URL=http://localhost:5000
```

### 3. Cải Thiện UI/UX
- Thêm icon vào dropdown categories
- Hiển thị "Đang tải danh mục..." khi chưa có data
- Thêm nhiều console.log để debug
- Kiểm tra null/undefined trước khi map

## Các Thay Đổi

### frontend/src/services/api.js
- Sửa port từ 5001 → 5000

### frontend/src/modules/product/CreateProduct.jsx
- Thêm icon vào dropdown options
- Thêm loading state
- Thêm nhiều console.log để debug
- Cải thiện error handling

### frontend/.env (mới)
- Định nghĩa REACT_APP_API_URL

## Cách Test

### 1. Kiểm Tra Backend
```bash
cd backend
npm start
# Server should run on port 5000
```

### 2. Test API Trực Tiếp
```bash
cd backend
node test-categories-api.js
# Should show 8 categories
```

### 3. Kiểm Tra Frontend
```bash
cd frontend
npm start
# Restart để load .env mới
```

### 4. Test Trên Browser
1. Mở http://localhost:3000
2. Đăng nhập
3. Vào trang "Đăng tin" (/product/create)
4. Mở DevTools Console (F12)
5. Kiểm tra logs:
   - "Categories response: ..."
   - "Categories data to set: ..."
   - "Categories count: 8"
   - "Categories state changed: ..."
6. Click vào dropdown "Danh mục"
7. Phải thấy 8 options với icon:
   - 📚 Sách
   - 👕 Quần áo
   - 📱 Đồ điện tử
   - 🏠 Đồ gia dụng
   - 💄 Làm đẹp
   - ⚽ Thể thao
   - 🧸 Đồ chơi
   - 🐕 Thú cưng

## Lưu Ý

### Khi Deploy Production
Cần cập nhật file `.env` với URL thật:
```
# Frontend .env
REACT_APP_API_URL=https://api.yourdomain.com

# Backend .env
FRONTEND_URL=https://yourdomain.com
PORT=5000
```

### Nếu Vẫn Lỗi
1. Clear browser cache
2. Restart frontend dev server (Ctrl+C rồi npm start lại)
3. Kiểm tra Network tab trong DevTools
4. Xem request đến đúng URL chưa
5. Kiểm tra CORS headers

## Checklist
- [x] Backend chạy đúng port 5000
- [x] Categories đã được seed (8 categories)
- [x] API /api/categories trả về data đúng
- [x] Frontend API service dùng đúng port
- [x] File .env frontend đã tạo
- [x] Thêm debug logs
- [x] Cải thiện UI với icon và loading state
- [x] Test API trực tiếp thành công
- [ ] Test trên browser (cần restart frontend)
