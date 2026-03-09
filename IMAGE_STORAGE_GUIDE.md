# Hướng dẫn Lưu trữ Ảnh - ReFlow Project

## 📁 Cấu trúc Thư mục

### 1. **Backend - Ảnh do người dùng upload** (`backend/uploads/`)

```
backend/uploads/
├── products/              # Ảnh sản phẩm
│   ├── temp/             # Ảnh tạm (chưa tạo product)
│   ├── {productId}/      # Ảnh của từng sản phẩm
│   └── .gitkeep
├── users/                # Ảnh người dùng
│   ├── avatars/          # Avatar người dùng
│   ├── {userId}/         # Ảnh khác của user
│   └── .gitkeep
└── categories/           # Ảnh danh mục (nếu cần)
    └── .gitkeep
```

**Đặc điểm:**
- ✅ Lưu trữ local trên server
- ✅ Được serve qua Express static middleware
- ✅ URL truy cập: `http://localhost:5000/uploads/products/{productId}/image.jpg`
- ✅ Multer xử lý upload
- ✅ Giới hạn: 5MB/file, chỉ jpg/jpeg/png/gif

**Cấu hình trong backend:**
```javascript
// backend/src/app.js
app.use('/uploads', express.static('uploads'));
```

---

### 2. **Frontend - Ảnh tĩnh (static assets)** (`frontend/public/`)

```
frontend/public/
├── images/
│   ├── logo/
│   │   ├── logo.png          # Logo chính
│   │   ├── logo-white.png    # Logo trắng
│   │   └── favicon.ico       # Favicon
│   ├── banners/
│   │   ├── hero-banner.jpg   # Banner trang chủ
│   │   └── promo-banner.jpg  # Banner khuyến mãi
│   ├── icons/
│   │   ├── category-*.png    # Icons danh mục
│   │   └── feature-*.png     # Icons tính năng
│   ├── placeholders/
│   │   ├── product-placeholder.jpg
│   │   ├── avatar-placeholder.jpg
│   │   └── no-image.jpg
│   └── illustrations/
│       ├── empty-state.svg
│       └── error-404.svg
└── index.html
```

**Đặc điểm:**
- ✅ Ảnh cố định, không thay đổi
- ✅ Build vào bundle khi deploy
- ✅ URL truy cập: `http://localhost:3000/images/logo/logo.png`
- ✅ Tối ưu bởi webpack/CRA

**Sử dụng trong React:**
```jsx
// Cách 1: Từ public folder
<img src="/images/logo/logo.png" alt="Logo" />

// Cách 2: Từ process.env
<img src={process.env.PUBLIC_URL + '/images/logo/logo.png'} alt="Logo" />
```

---

### 3. **Frontend - Ảnh import vào component** (`frontend/src/assets/images/`)

```
frontend/src/assets/images/
├── logo.png              # Logo import vào component
├── banner-home.jpg       # Banner import
├── icons/
│   ├── heart.svg
│   └── cart.svg
└── .keep
```

**Đặc điểm:**
- ✅ Import trực tiếp vào component
- ✅ Webpack xử lý và optimize
- ✅ Có hash trong tên file khi build
- ✅ Tốt cho ảnh nhỏ, icons

**Sử dụng trong React:**
```jsx
import logo from './assets/images/logo.png';

function Header() {
  return <img src={logo} alt="Logo" />;
}
```

---

## 🎯 Quy tắc Sử dụng

### **Logo & Branding**
📍 **Vị trí:** `frontend/public/images/logo/`
- Logo chính: `logo.png` (200x60px)
- Logo trắng: `logo-white.png` (cho nền tối)
- Favicon: `favicon.ico` (32x32px)

### **Banner & Hero Images**
📍 **Vị trí:** `frontend/public/images/banners/`
- Hero banner: `hero-banner.jpg` (1920x600px)
- Promo banner: `promo-banner.jpg` (1200x400px)

### **Ảnh Sản phẩm (User upload)**
📍 **Vị trí:** `backend/uploads/products/{productId}/`
- Tên file: `{timestamp}-{random}.{ext}`
- Kích thước: Tối đa 5MB
- Format: jpg, jpeg, png, gif
- Lưu trong DB: Đường dẫn relative `/uploads/products/{productId}/image.jpg`

**API Upload:**
```javascript
POST /api/products/upload
Content-Type: multipart/form-data

// Response
{
  "success": true,
  "data": {
    "url": "/uploads/products/temp/1234567890-abc.jpg"
  }
}
```

### **Avatar Người dùng**
📍 **Vị trí:** `backend/uploads/users/avatars/`
- Tên file: `{userId}-{timestamp}.{ext}`
- Kích thước: Tối đa 2MB
- Format: jpg, jpeg, png
- Resize: 200x200px (thumbnail)

### **Placeholder Images**
📍 **Vị trí:** `frontend/public/images/placeholders/`
- `product-placeholder.jpg` - Khi sản phẩm không có ảnh
- `avatar-placeholder.jpg` - Khi user không có avatar
- `no-image.jpg` - Ảnh mặc định

---

## 💻 Code Examples

### **1. Hiển thị ảnh sản phẩm từ backend**
```jsx
function ProductCard({ product }) {
  const imageUrl = product.images && product.images.length > 0
    ? `${process.env.REACT_APP_API_URL}${product.images[0]}`
    : '/images/placeholders/product-placeholder.jpg';

  return <img src={imageUrl} alt={product.title} />;
}
```

### **2. Upload ảnh sản phẩm**
```jsx
async function handleImageUpload(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/api/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return response.data.data.url;
}
```

### **3. Hiển thị logo**
```jsx
function Navbar() {
  return (
    <img 
      src="/images/logo/logo.png" 
      alt="ReFlow Logo" 
      className="navbar__logo"
    />
  );
}
```

### **4. Avatar với fallback**
```jsx
function UserAvatar({ user }) {
  const avatarUrl = user.avatar 
    ? `${process.env.REACT_APP_API_URL}${user.avatar}`
    : '/images/placeholders/avatar-placeholder.jpg';

  return (
    <img 
      src={avatarUrl} 
      alt={user.fullName}
      onError={(e) => {
        e.target.src = '/images/placeholders/avatar-placeholder.jpg';
      }}
    />
  );
}
```

---

## 🚀 Setup Instructions

### **1. Tạo thư mục trong backend**
```bash
cd backend
mkdir -p uploads/products/temp
mkdir -p uploads/users/avatars
mkdir -p uploads/categories
```

### **2. Tạo thư mục trong frontend**
```bash
cd frontend/public
mkdir -p images/logo
mkdir -p images/banners
mkdir -p images/icons
mkdir -p images/placeholders
mkdir -p images/illustrations
```

### **3. Thêm ảnh mặc định**
- Tải logo và đặt vào `frontend/public/images/logo/logo.png`
- Tải placeholder và đặt vào `frontend/public/images/placeholders/`

### **4. Cấu hình .gitignore**
```
# Backend - Ignore uploaded files
backend/uploads/*
!backend/uploads/.gitkeep
!backend/uploads/products/.gitkeep
!backend/uploads/users/.gitkeep

# Frontend - Keep static assets
!frontend/public/images/
```

---

## 📊 Tối ưu Performance

### **1. Lazy Loading**
```jsx
<img 
  src={imageUrl} 
  alt="Product"
  loading="lazy"  // Browser native lazy load
/>
```

### **2. Responsive Images**
```jsx
<img 
  src={imageUrl}
  srcSet={`
    ${imageUrl}?w=400 400w,
    ${imageUrl}?w=800 800w,
    ${imageUrl}?w=1200 1200w
  `}
  sizes="(max-width: 768px) 400px, (max-width: 1024px) 800px, 1200px"
  alt="Product"
/>
```

### **3. Image Compression**
- Sử dụng Sharp (Node.js) để resize và compress
- WebP format cho modern browsers
- JPEG quality: 80-85%

---

## 🔒 Security Best Practices

1. ✅ Validate file type (MIME type)
2. ✅ Limit file size (5MB cho products, 2MB cho avatars)
3. ✅ Rename files (không dùng tên gốc)
4. ✅ Scan virus (nếu production)
5. ✅ Serve qua CDN (khi scale)
6. ✅ Set proper CORS headers

---

## 📝 Environment Variables

```env
# Backend (.env)
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes

# Frontend (.env)
REACT_APP_API_URL=http://localhost:5000
```

---

## 🎨 Recommended Image Sizes

| Loại ảnh | Kích thước | Format | Quality |
|----------|-----------|--------|---------|
| Logo | 200x60px | PNG | - |
| Favicon | 32x32px | ICO/PNG | - |
| Hero Banner | 1920x600px | JPG | 85% |
| Product Image | 800x800px | JPG | 80% |
| Product Thumbnail | 200x200px | JPG | 75% |
| Avatar | 200x200px | JPG | 80% |
| Category Icon | 64x64px | PNG/SVG | - |

---

## 🔄 Migration to Cloud Storage (Future)

Khi cần scale, có thể chuyển sang:
- **AWS S3** - Lưu trữ object storage
- **Cloudinary** - Image CDN với transform
- **Google Cloud Storage** - Alternative to S3
- **Azure Blob Storage** - Microsoft solution

---

## ❓ FAQ

**Q: Tại sao không lưu ảnh trong database?**
A: Database không tối ưu cho binary data. File system hoặc object storage tốt hơn.

**Q: Làm sao xóa ảnh cũ khi user upload ảnh mới?**
A: Implement cleanup logic trong backend service, xóa file cũ trước khi lưu file mới.

**Q: Có nên dùng CDN không?**
A: Có, khi có nhiều traffic. CDN giúp load ảnh nhanh hơn và giảm tải cho server.

**Q: Format nào tốt nhất?**
A: WebP cho modern browsers (nhỏ hơn 25-35%), fallback JPEG cho compatibility.

---

**Tác giả:** ReFlow Development Team  
**Cập nhật:** 2026-03-05
