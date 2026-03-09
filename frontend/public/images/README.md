# Images Directory

## Cấu trúc thư mục

### `/logo`
- Logo chính của ứng dụng
- Logo trắng (cho nền tối)
- Favicon

### `/banners`
- Hero banner trang chủ
- Banner khuyến mãi
- Banner sự kiện

### `/icons`
- Icons danh mục sản phẩm
- Icons tính năng
- Icons UI

### `/placeholders`
- Ảnh placeholder cho sản phẩm không có ảnh
- Avatar placeholder
- No-image placeholder

### `/illustrations`
- Empty state illustrations
- Error page illustrations
- Success/confirmation illustrations

## Hướng dẫn sử dụng

```jsx
// Trong React component
<img src="/images/logo/logo.png" alt="Logo" />
<img src="/images/placeholders/product-placeholder.jpg" alt="No image" />
```

## Quy tắc đặt tên

- Sử dụng kebab-case: `hero-banner.jpg`
- Mô tả rõ ràng: `product-placeholder.jpg`
- Thêm kích thước nếu cần: `logo-200x60.png`
