# Uploads Directory

## ⚠️ QUAN TRỌNG
Thư mục này chứa file do người dùng upload. **KHÔNG commit các file upload lên Git!**

## Cấu trúc

### `/products`
- Ảnh sản phẩm do người dùng đăng
- Mỗi sản phẩm có thư mục riêng: `/products/{productId}/`
- Thư mục `/temp/` chứa ảnh tạm thời

### `/users/avatars`
- Avatar người dùng
- Format: `{userId}-{timestamp}.{ext}`

### `/categories`
- Ảnh danh mục (nếu admin upload)

## API Endpoints

### Upload ảnh sản phẩm
```
POST /api/products/upload
Content-Type: multipart/form-data
Body: { image: File }
```

### Upload avatar
```
POST /api/users/avatar
Content-Type: multipart/form-data
Body: { avatar: File }
```

## Giới hạn

- **Kích thước tối đa:** 5MB (products), 2MB (avatars)
- **Format cho phép:** jpg, jpeg, png, gif
- **Tên file:** Tự động rename để tránh conflict

## Truy cập file

File được serve qua Express static middleware:
```
http://localhost:5000/uploads/products/{productId}/image.jpg
```

## Bảo mật

- ✅ Validate MIME type
- ✅ Giới hạn kích thước
- ✅ Rename file tự động
- ✅ Không cho phép execute file
- ⚠️ Cần thêm virus scan cho production

## Cleanup

Nên implement cron job để:
- Xóa ảnh trong `/temp/` sau 24h
- Xóa ảnh của sản phẩm đã xóa
- Xóa ảnh của user đã xóa tài khoản
