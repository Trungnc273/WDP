const mongoose = require('mongoose');
const Product = require('../modules/products/product.model');
const Category = require('../modules/products/category.model');
const User = require('../modules/users/user.model');
const config = require('../config/env');

// Sample products data - Updated with more products for each category
const productsData = [
  // SÁCH (Books) - 10 products
  {
    title: 'Đắc Nhân Tâm - Dale Carnegie',
    description: 'Sách kỹ năng sống bán chạy nhất mọi thời đại, bìa cứng, còn mới 95%',
    price: 85000,
    condition: 'like-new',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    status: 'active'
  },
  {
    title: 'Harry Potter Trọn Bộ 7 Tập',
    description: 'Bộ sách Harry Potter đầy đủ 7 tập, bản tiếng Việt, bìa mềm, còn mới 90%',
    price: 650000,
    condition: 'good',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },
  {
    title: 'Nhà Giả Kim - Paulo Coelho',
    description: 'Tiểu thuyết nổi tiếng thế giới, bản dịch mới, bìa mềm, chưa đọc',
    price: 70000,
    condition: 'new',
    images: [],
    categorySlug: 'books',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    status: 'active'
  },
  {
    title: 'Sapiens - Lược Sử Loài Người',
    description: 'Sách lịch sử nhân loại, bìa cứng, còn mới 98%, chưa gạch chú',
    price: 150000,
    condition: 'like-new',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
    description: 'Sách kỹ năng sống cho giới trẻ, bìa mềm, còn mới 85%',
    price: 65000,
    condition: 'good',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Bộ Sách Giáo Khoa Lớp 12',
    description: 'Bộ sách giáo khoa lớp 12 đầy đủ các môn, còn mới 80%',
    price: 200000,
    condition: 'good',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },
  {
    title: 'Doraemon Truyện Dài Tập 1-10',
    description: 'Bộ truyện tranh Doraemon truyện dài, 10 tập đầu, còn mới 90%',
    price: 180000,
    condition: 'like-new',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hải Phòng', district: 'Lê Chân' },
    status: 'active'
  },
  {
    title: 'Cà Phê Cùng Tony',
    description: 'Sách kinh doanh của Tony Buổi Sáng, bìa mềm, còn mới 95%',
    price: 75000,
    condition: 'like-new',
    images: [],
    categorySlug: 'books',
    location: { city: 'Cần Thơ', district: 'Ninh Kiều' },
    status: 'active'
  },
  {
    title: 'Tiếng Anh Giao Tiếp Cơ Bản',
    description: 'Sách học tiếng Anh giao tiếp, kèm CD, còn mới 85%',
    price: 95000,
    condition: 'good',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hà Nội', district: 'Đống Đa' },
    status: 'active'
  },
  {
    title: 'Nghệ Thuật Bán Hàng',
    description: 'Sách kỹ năng bán hàng chuyên nghiệp, bìa cứng, còn mới 90%',
    price: 120000,
    condition: 'like-new',
    images: [],
    categorySlug: 'books',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },

  // QUẦN ÁO (Fashion) - 10 products
  {
    title: 'Áo Thun Nam Uniqlo',
    description: 'Áo thun nam Uniqlo size L, màu trắng, cotton 100%, mặc 2-3 lần',
    price: 150000,
    condition: 'like-new',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    status: 'active'
  },
  {
    title: 'Quần Jeans Nữ Levi\'s',
    description: 'Quần jeans nữ Levi\'s size 28, màu xanh đậm, skinny fit, còn mới 90%',
    price: 450000,
    condition: 'like-new',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },
  {
    title: 'Áo Khoác Denim Nam',
    description: 'Áo khoác denim nam size XL, màu xanh nhạt, chất liệu cao cấp',
    price: 380000,
    condition: 'good',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Đà Nẵng', district: 'Thanh Khê' },
    status: 'active'
  },
  {
    title: 'Váy Maxi Nữ',
    description: 'Váy maxi nữ dáng dài, màu hoa nhí, chất vải mát, size M',
    price: 280000,
    condition: 'like-new',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    status: 'active'
  },
  {
    title: 'Giày Thể Thao Nike Air Max',
    description: 'Giày Nike Air Max size 42, màu trắng đen, đế còn tốt, mặc ít',
    price: 1200000,
    condition: 'good',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Túi Xách Nữ Da Thật',
    description: 'Túi xách nữ da bò thật, màu nâu, size trung, còn mới 95%',
    price: 850000,
    condition: 'like-new',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'Áo Sơ Mi Nam Công Sở',
    description: 'Áo sơ mi nam trắng, size L, chất liệu kate, ủi phẳng',
    price: 180000,
    condition: 'good',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hải Phòng', district: 'Ngô Quyền' },
    status: 'active'
  },
  {
    title: 'Giày Cao Gót Nữ',
    description: 'Giày cao gót nữ 7cm, màu đen, da mềm, size 37, mặc 1-2 lần',
    price: 320000,
    condition: 'like-new',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },
  {
    title: 'Áo Hoodie Unisex',
    description: 'Áo hoodie unisex size XL, màu đen, chất nỉ dày, ấm áp',
    price: 250000,
    condition: 'good',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },
  {
    title: 'Dép Adidas Adilette',
    description: 'Dép Adidas Adilette size 42, màu đen trắng, đế êm, còn mới 90%',
    price: 280000,
    condition: 'like-new',
    images: [],
    categorySlug: 'fashion',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    status: 'active'
  },

  // ĐỒ ĐIỆN TỬ (Electronics) - 10 products
  {
    title: 'iPhone 13 Pro Max 256GB',
    description: 'iPhone 13 Pro Max màu xanh, 256GB, pin 100%, full box, bảo hành 6 tháng',
    price: 22000000,
    condition: 'like-new',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'MacBook Air M1 2020',
    description: 'MacBook Air M1 chip, 8GB RAM, 256GB SSD, màu bạc, còn mới 90%',
    price: 18000000,
    condition: 'good',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },
  {
    title: 'Samsung Galaxy S22 Ultra',
    description: 'Samsung S22 Ultra 512GB, màu đen, bảo hành chính hãng 10 tháng',
    price: 19500000,
    condition: 'like-new',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    status: 'active'
  },
  {
    title: 'iPad Pro 11 inch M1',
    description: 'iPad Pro 11 inch M1, 128GB, màu xám, Apple Pencil 2 đi kèm',
    price: 16000000,
    condition: 'like-new',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hồ Chí Minh', district: 'Quận 2' },
    status: 'active'
  },
  {
    title: 'Tai Nghe AirPods Pro 2',
    description: 'AirPods Pro 2 chính hãng Apple, full box, bảo hành 8 tháng',
    price: 4500000,
    condition: 'like-new',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    status: 'active'
  },
  {
    title: 'Apple Watch Series 7',
    description: 'Apple Watch Series 7 45mm, màu đen, GPS, còn mới 95%',
    price: 7500000,
    condition: 'like-new',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Laptop Dell XPS 13',
    description: 'Dell XPS 13 i7 gen 11, 16GB RAM, 512GB SSD, màn 4K, còn mới 90%',
    price: 25000000,
    condition: 'good',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hà Nội', district: 'Đống Đa' },
    status: 'active'
  },
  {
    title: 'Máy Ảnh Canon EOS M50',
    description: 'Canon EOS M50 kit 15-45mm, còn mới 85%, full box, phụ kiện đầy đủ',
    price: 12000000,
    condition: 'good',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Đà Nẵng', district: 'Thanh Khê' },
    status: 'active'
  },
  {
    title: 'Loa Bluetooth JBL Flip 5',
    description: 'Loa JBL Flip 5 chống nước, màu đen, pin 12h, còn mới 90%',
    price: 1800000,
    condition: 'like-new',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },
  {
    title: 'Chuột Gaming Logitech G502',
    description: 'Chuột gaming Logitech G502 Hero, RGB, còn mới 95%, full box',
    price: 950000,
    condition: 'like-new',
    images: [],
    categorySlug: 'electronics',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },

  // ĐỒ GIA DỤNG (Home) - 10 products
  {
    title: 'Bàn Làm Việc Gỗ Cao Su',
    description: 'Bàn làm việc gỗ cao su 120x60cm, màu nâu, chắc chắn, còn mới',
    price: 2500000,
    condition: 'like-new',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },
  {
    title: 'Ghế Gaming DXRacer',
    description: 'Ghế gaming DXRacer đen đỏ, tựa lưng điều chỉnh, tay vịn 4D',
    price: 3200000,
    condition: 'good',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },
  {
    title: 'Tủ Lạnh Samsung 208L',
    description: 'Tủ lạnh Samsung Inverter 208L, tiết kiệm điện, còn mới 85%',
    price: 4500000,
    condition: 'good',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'Máy Giặt LG 9kg',
    description: 'Máy giặt LG Inverter 9kg, lồng ngang, tiết kiệm nước, còn tốt',
    price: 5200000,
    condition: 'good',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },
  {
    title: 'Nồi Cơm Điện Tử Sharp 1.8L',
    description: 'Nồi cơm điện tử Sharp 1.8L, lòng dày, nấu ngon, còn mới 90%',
    price: 1200000,
    condition: 'like-new',
    images: [],
    categorySlug: 'home',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    status: 'active'
  },
  {
    title: 'Bộ Nồi Inox 5 Món',
    description: 'Bộ nồi inox 304 cao cấp 5 món, đáy 3 lớp, dùng bếp từ được',
    price: 850000,
    condition: 'like-new',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    status: 'active'
  },
  {
    title: 'Quạt Điều Hòa Kangaroo',
    description: 'Quạt điều hòa Kangaroo 30L, làm mát tốt, tiết kiệm điện',
    price: 2800000,
    condition: 'good',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Bộ Chăn Ga Gối Cotton',
    description: 'Bộ chăn ga gối cotton Hàn Quốc 1m8, họa tiết hoa, mới 100%',
    price: 450000,
    condition: 'new',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hà Nội', district: 'Đống Đa' },
    status: 'active'
  },
  {
    title: 'Bình Đun Siêu Tốc Philips',
    description: 'Bình đun siêu tốc Philips 1.7L, inox 304, tự ngắt, còn mới',
    price: 380000,
    condition: 'like-new',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hải Phòng', district: 'Lê Chân' },
    status: 'active'
  },
  {
    title: 'Đèn Ngủ LED Thông Minh',
    description: 'Đèn ngủ LED điều khiển từ xa, đổi màu, hẹn giờ, còn mới 95%',
    price: 280000,
    condition: 'like-new',
    images: [],
    categorySlug: 'home',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },

  // LÀM ĐẸP (Beauty) - 10 products
  {
    title: 'Son Dior Addict 999',
    description: 'Son Dior Addict màu 999 đỏ cam, chính hãng, dùng 2-3 lần, còn 95%',
    price: 850000,
    condition: 'like-new',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    status: 'active'
  },
  {
    title: 'Kem Chống Nắng La Roche-Posay',
    description: 'Kem chống nắng La Roche-Posay SPF50+, 50ml, còn 80%, hạn 2025',
    price: 280000,
    condition: 'good',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },
  {
    title: 'Nước Hoa Chanel No.5',
    description: 'Nước hoa Chanel No.5 EDP 100ml, chính hãng, còn 70%, hộp đầy đủ',
    price: 2500000,
    condition: 'good',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    status: 'active'
  },
  {
    title: 'Serum Vitamin C The Ordinary',
    description: 'Serum Vitamin C The Ordinary 30ml, mới 100%, chưa mở seal',
    price: 180000,
    condition: 'new',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Đà Nẵng', district: 'Thanh Khê' },
    status: 'active'
  },
  {
    title: 'Phấn Nước Cushion Laneige',
    description: 'Phấn nước Laneige Neo Cushion, tone 21, dùng 1 lần, còn 98%',
    price: 450000,
    condition: 'like-new',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Mặt Nạ Innisfree 10 Miếng',
    description: 'Combo 10 miếng mặt nạ Innisfree các loại, hạn sử dụng 2025',
    price: 150000,
    condition: 'new',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'Sữa Rửa Mặt CeraVe',
    description: 'Sữa rửa mặt CeraVe Foaming Cleanser 473ml, còn 60%, hạn 2025',
    price: 220000,
    condition: 'good',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },
  {
    title: 'Bảng Phấn Mắt Urban Decay',
    description: 'Bảng phấn mắt Urban Decay Naked 3, dùng 3-4 lần, còn 95%',
    price: 950000,
    condition: 'like-new',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },
  {
    title: 'Kem Dưỡng Ẩm Cetaphil',
    description: 'Kem dưỡng ẩm Cetaphil 453g, cho da khô, còn 70%, hạn 2025',
    price: 280000,
    condition: 'good',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    status: 'active'
  },
  {
    title: 'Mascara Maybelline Lash Sensational',
    description: 'Mascara Maybelline Lash Sensational, màu đen, mới 100%, chưa mở',
    price: 180000,
    condition: 'new',
    images: [],
    categorySlug: 'beauty',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },

  // THỂ THAO (Sports) - 10 products
  {
    title: 'Xe Đạp Thể Thao Giant ATX 720',
    description: 'Xe đạp Giant ATX 720, phanh đĩa, 21 tốc độ, màu đen xanh',
    price: 4500000,
    condition: 'good',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hà Nội', district: 'Đống Đa' },
    status: 'active'
  },
  {
    title: 'Bộ Tạ Tay 20kg',
    description: 'Bộ tạ tay 20kg gồm 2 thanh và đĩa tạ, gang bọc cao su',
    price: 800000,
    condition: 'good',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hồ Chí Minh', district: 'Quận 10' },
    status: 'active'
  },
  {
    title: 'Giày Chạy Bộ Adidas Ultraboost',
    description: 'Giày chạy bộ Adidas Ultraboost 21, size 42, màu đen trắng',
    price: 1800000,
    condition: 'like-new',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'Vợt Cầu Lông Yonex',
    description: 'Vợt cầu lông Yonex Nanoray 10F, đã căng dây, còn mới 90%',
    price: 950000,
    condition: 'like-new',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Đà Nẵng', district: 'Thanh Khê' },
    status: 'active'
  },
  {
    title: 'Bóng Đá Size 5 Nike',
    description: 'Bóng đá Nike size 5, da PU cao cấp, còn mới 85%',
    price: 380000,
    condition: 'good',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Thảm Tập Yoga Cao Cấp',
    description: 'Thảm tập yoga TPE 6mm, chống trượt, kèm túi đựng, màu tím',
    price: 280000,
    condition: 'like-new',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    status: 'active'
  },
  {
    title: 'Găng Tay Boxing Everlast',
    description: 'Găng tay boxing Everlast 12oz, màu đỏ, còn mới 90%',
    price: 650000,
    condition: 'like-new',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },
  {
    title: 'Bàn Bóng Bàn Gấp Gọn',
    description: 'Bàn bóng bàn gấp gọn, mặt gỗ dày, chân thép, còn tốt',
    price: 3500000,
    condition: 'good',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },
  {
    title: 'Dây Nhảy Thể Thao',
    description: 'Dây nhảy thể thao có đếm số, tay cầm xoay 360 độ, mới 100%',
    price: 120000,
    condition: 'new',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hải Phòng', district: 'Ngô Quyền' },
    status: 'active'
  },
  {
    title: 'Balo Thể Thao Adidas',
    description: 'Balo thể thao Adidas 30L, nhiều ngăn, chống nước, còn mới 90%',
    price: 450000,
    condition: 'like-new',
    images: [],
    categorySlug: 'sports',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },

  // ĐỒ CHƠI (Toys) - 10 products
  {
    title: 'Lego City Police Station',
    description: 'Bộ Lego City Police Station 60316, 668 chi tiết, mới 100%, chưa mở hộp',
    price: 1200000,
    condition: 'new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    status: 'active'
  },
  {
    title: 'Búp Bê Barbie Dreamhouse',
    description: 'Búp bê Barbie kèm nhà Dreamhouse, đầy đủ phụ kiện, còn mới 90%',
    price: 850000,
    condition: 'like-new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },
  {
    title: 'Xe Điều Khiển Từ Xa',
    description: 'Xe ô tô điều khiển từ xa tỷ lệ 1:16, pin sạc, tốc độ cao',
    price: 450000,
    condition: 'like-new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    status: 'active'
  },
  {
    title: 'Rubik 3x3 Gan 356',
    description: 'Rubik 3x3 Gan 356 M, xoay mượt, nam châm, còn mới 95%',
    price: 280000,
    condition: 'like-new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'Bộ Đồ Chơi Nấu Ăn',
    description: 'Bộ đồ chơi nấu ăn cho bé, 30 món, nhựa an toàn, còn mới',
    price: 320000,
    condition: 'like-new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Mô Hình Gundam RG',
    description: 'Mô hình Gundam RG 1/144 Strike Freedom, chưa lắp ráp, mới 100%',
    price: 650000,
    condition: 'new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hà Nội', district: 'Đống Đa' },
    status: 'active'
  },
  {
    title: 'Board Game Catan',
    description: 'Board game Catan phiên bản tiếng Anh, đầy đủ chi tiết, còn mới 90%',
    price: 580000,
    condition: 'like-new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },
  {
    title: 'Xe Scooter Trẻ Em',
    description: 'Xe scooter 3 bánh cho trẻ em, có đèn LED, chịu tải 50kg',
    price: 750000,
    condition: 'good',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },
  {
    title: 'Đàn Piano Điện Tử Casio',
    description: 'Đàn piano điện tử Casio 61 phím, có chân đỡ, còn mới 85%',
    price: 2200000,
    condition: 'good',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Đà Nẵng', district: 'Thanh Khê' },
    status: 'active'
  },
  {
    title: 'Bộ Xếp Hình Gỗ 100 Chi Tiết',
    description: 'Bộ xếp hình gỗ 100 chi tiết, nhiều màu sắc, an toàn cho trẻ',
    price: 180000,
    condition: 'like-new',
    images: [],
    categorySlug: 'toys',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },

  // THÚ CƯNG (Pets) - 10 products
  {
    title: 'Thức Ăn Cho Chó Royal Canin 10kg',
    description: 'Thức ăn khô cho chó Royal Canin Medium Adult 10kg, hạn 2025',
    price: 1200000,
    condition: 'new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    status: 'active'
  },
  {
    title: 'Cát Vệ Sinh Cho Mèo 10L',
    description: 'Cát vệ sinh cho mèo dạng cục 10L, khử mùi tốt, hạn 2025',
    price: 180000,
    condition: 'new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  },
  {
    title: 'Lồng Chó Mèo Size L',
    description: 'Lồng chó mèo size L 90x60x70cm, inox 304, có khay hứng phân',
    price: 850000,
    condition: 'like-new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    status: 'active'
  },
  {
    title: 'Vòng Cổ Chống Ve Rận',
    description: 'Vòng cổ chống ve rận cho chó mèo, hiệu quả 8 tháng, mới 100%',
    price: 120000,
    condition: 'new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    status: 'active'
  },
  {
    title: 'Balo Vận Chuyển Thú Cưng',
    description: 'Balo vận chuyển thú cưng size M, có lỗ thoáng, chịu tải 8kg',
    price: 380000,
    condition: 'like-new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hồ Chí Minh', district: 'Quận 3' },
    status: 'active'
  },
  {
    title: 'Đồ Chơi Gặm Cho Chó',
    description: 'Bộ đồ chơi gặm cho chó 5 món, cao su tự nhiên, an toàn',
    price: 150000,
    condition: 'new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    status: 'active'
  },
  {
    title: 'Máy Cắt Lông Thú Cưng',
    description: 'Máy cắt lông thú cưng Codos, pin sạc, êm, còn mới 90%',
    price: 450000,
    condition: 'like-new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hồ Chí Minh', district: 'Quận 7' },
    status: 'active'
  },
  {
    title: 'Nhà Gỗ Cho Chó Size M',
    description: 'Nhà gỗ cho chó size M, chống mưa, thông thoáng, còn mới 85%',
    price: 950000,
    condition: 'good',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hà Nội', district: 'Thanh Xuân' },
    status: 'active'
  },
  {
    title: 'Bát Ăn Tự Động Cho Mèo',
    description: 'Bát ăn tự động cho mèo, hẹn giờ, 4 bữa/ngày, còn mới 90%',
    price: 580000,
    condition: 'like-new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Đà Nẵng', district: 'Thanh Khê' },
    status: 'active'
  },
  {
    title: 'Dây Dắt Chó Tự Động 5m',
    description: 'Dây dắt chó tự động 5m, chịu lực 20kg, có đèn LED, mới 100%',
    price: 220000,
    condition: 'new',
    images: [],
    categorySlug: 'pets',
    location: { city: 'Hồ Chí Minh', district: 'Quận 1' },
    status: 'active'
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodb.uri);
    console.log('MongoDB Connected for seeding products');

    // Get or create a test user as seller
    let seller = await User.findOne({ email: 'seller@example.com' });
    if (!seller) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);
      seller = await User.create({
        email: 'seller@example.com',
        password: hashedPassword,
        fullName: 'Test Seller',
        role: 'user'
      });
      console.log('✓ Created test seller user');
    }

    // Get all categories
    const categories = await Category.find({});
    if (categories.length === 0) {
      console.error('No categories found. Please run categories seed first.');
      process.exit(1);
    }

    // Create a map of category slugs to IDs
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Prepare products with category IDs
    const products = productsData.map(product => ({
      ...product,
      category: categoryMap[product.categorySlug],
      seller: seller._id,
      views: Math.floor(Math.random() * 500), // Random views between 0-499
      images: ['/images/placeholders/product-placeholder.svg'] // Use placeholder image
    }));

    // Remove categorySlug field
    products.forEach(product => delete product.categorySlug);

    // Insert sample products
    const insertedProducts = await Product.insertMany(products);
    console.log(`✓ Inserted ${insertedProducts.length} products`);

    // Display inserted products grouped by category
    console.log('\nProducts by category:');
    for (const cat of categories) {
      const catProducts = insertedProducts.filter(p => p.category.toString() === cat._id.toString());
      if (catProducts.length > 0) {
        console.log(`\n${cat.name} (${catProducts.length} products):`);
        catProducts.forEach(p => {
          console.log(`  - ${p.title} (${p.price.toLocaleString('vi-VN')} VNĐ)`);
        });
      }
    }

    console.log('\n✓ Products seeding completed successfully');
    console.log(`Total: ${insertedProducts.length} products across ${categories.length} categories`);
    
    // Close connection
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedProducts();
}

module.exports = { seedProducts };
