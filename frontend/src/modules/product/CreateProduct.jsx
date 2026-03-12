import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import api from '../../services/api';
import LocationSelector from '../../components/LocationSelector';
import './CreateProduct.css';

const CONDITION_LABELS = {
  new: 'Mới',
  'like-new': 'Như mới',
  good: 'Tốt',
  fair: 'Khá',
  poor: 'Cũ'
};

const CreateProduct = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'like-new',
    images: [],
    location: {
      city: '',
      district: '',
      ward: '',
      provinceCode: null,
      districtCode: null,
      wardCode: null
    }
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      const categoriesData = response.data.data || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleLocationChange = (locationData) => {
    setFormData(prev => ({
      ...prev,
      location: locationData
    }));

    // Clear location errors
    if (errors['location.city']) {
      setErrors(prev => ({ ...prev, 'location.city': '' }));
    }
    if (errors['location.district']) {
      setErrors(prev => ({ ...prev, 'location.district': '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + imageFiles.length > 5) {
      alert('Bạn chỉ có thể tải lên tối đa 5 ảnh');
      return;
    }

    // Kiem tra kich thuoc file (toi da 5MB moi anh)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Mỗi ảnh không được vượt quá 5MB');
      return;
    }

    // Tao anh xem truoc
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...newPreviews]);
    
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Vui lòng nhập giá hợp lệ';
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn danh mục';
    }

    if (imageFiles.length === 0) {
      newErrors.images = 'Vui lòng tải lên ít nhất 1 ảnh';
    }

    if (!formData.location.city) {
      newErrors['location.city'] = 'Vui lòng nhập thành phố';
    }

    if (!formData.location.district) {
      newErrors['location.district'] = 'Vui lòng nhập quận/huyện';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return [];
    
    const formData = new FormData();
    imageFiles.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      const response = await api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Lay duong dan anh tu response
      const files = response.data.data;
      if (Array.isArray(files)) {
        return files.map(f => f.path);
      }
      return [];
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Không thể tải ảnh lên. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Upload anh truoc
      const imageUrls = await uploadImages();

      // Tao san pham - chi gui cac truong backend can
      const productData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        images: imageUrls,
        location: {
          city: formData.location.city,
          district: formData.location.district,
          ward: formData.location.ward || ''
        }
      };

      const createdProduct = await productService.createProduct(productData);
      
      alert('Sản phẩm đã được đăng thành công!');
      navigate(`/product/${createdProduct._id}`);
    } catch (error) {
      console.error('Create product error:', error);
      alert(error.response?.data?.message || error.message || 'Không thể tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat._id === formData.category);
  const formattedPrice = formData.price
    ? Number(formData.price).toLocaleString('vi-VN')
    : 'Chưa nhập';
  const locationPreview = [formData.location.ward, formData.location.district, formData.location.city]
    .filter(Boolean)
    .join(', ');
  const completedFieldCount = [
    formData.title.trim(),
    formData.description.trim(),
    formData.price,
    formData.category,
    formData.location.city,
    formData.location.district,
    imageFiles.length > 0
  ].filter(Boolean).length;
  const completionPercent = Math.round((completedFieldCount / 7) * 100);

  return (
    <div className="create-product-container">
      <div className="create-product-header">
        <div className="create-product-header-copy">
          <span className="create-product-eyebrow">Đăng bán sản phẩm</span>
          <h1>Đăng tin mới</h1>
          <p>Tạo một bài đăng rõ ràng, đẹp mắt để tăng độ tin cậy và giúp người mua ra quyết định nhanh hơn.</p>
        </div>
        <div className="create-product-header-stats">
          <div className="header-stat-card">
            <span className="header-stat-label">Ảnh đã thêm</span>
            <strong>{imageFiles.length}/5</strong>
          </div>
          <div className="header-stat-card">
            <span className="header-stat-label">Mức hoàn thiện</span>
            <strong>{completionPercent}%</strong>
          </div>
          <div className="header-stat-card">
            <span className="header-stat-label">Trạng thái</span>
            <strong>{loading ? 'Đang xử lý' : 'Sẵn sàng đăng'}</strong>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="create-product-form">
        <div className="create-product-grid">
          <div className="create-product-main">
            <div className="form-section form-section-highlight">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Bộ ảnh</span>
                  <h2>Hình ảnh sản phẩm</h2>
                </div>
                <p>Ảnh sáng rõ, nhiều góc chụp sẽ giúp tin đăng chuyên nghiệp và tăng độ tin cậy.</p>
              </div>

              <div className="image-upload-area">
                <div className="image-previews">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview">
                      <img src={preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < 5 && (
                    <label className="image-upload-button">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-placeholder">
                        <span>+</span>
                        <strong>Thêm ảnh</strong>
                        <small>Kéo thả hoặc bấm để chọn</small>
                      </div>
                    </label>
                  )}
                </div>

                <div className="upload-guidelines">
                  <span>1-5 ảnh</span>
                  <span>Tối đa 5MB mỗi ảnh</span>
                  <span>Ưu tiên ảnh thật của sản phẩm</span>
                </div>

                {errors.images && <p className="error-text">{errors.images}</p>}
              </div>
            </div>

            <div className="form-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Thông tin</span>
                  <h2>Thông tin cơ bản</h2>
                </div>
                <p>Trình bày rõ ràng để người mua hiểu nhanh tình trạng, giá bán và danh mục sản phẩm.</p>
              </div>

              <div className="form-grid two-columns">
                <div className="form-group form-group-full">
                  <label htmlFor="title">Tiêu đề <span className="required">*</span></label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="VD: iPhone 13 Pro Max 256GB, đầy đủ phụ kiện"
                    maxLength={100}
                  />
                  <div className="field-footnote">
                    <span>Tiêu đề càng cụ thể càng dễ tiếp cận đúng người mua.</span>
                    <span>{formData.title.length}/100</span>
                  </div>
                  {errors.title && <p className="error-text">{errors.title}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="category">Danh mục <span className="required">*</span></label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Chọn danh mục</option>
                    {categories && categories.length > 0 ? (
                      categories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Đang tải danh mục...</option>
                    )}
                  </select>
                  {errors.category && <p className="error-text">{errors.category}</p>}
                  {categories.length === 0 && (
                    <p className="help-text">Đang tải danh mục...</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="condition">Tình trạng <span className="required">*</span></label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                  >
                    <option value="new">Mới</option>
                    <option value="like-new">Như mới</option>
                    <option value="good">Tốt</option>
                    <option value="fair">Khá</option>
                    <option value="poor">Cũ</option>
                  </select>
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="price">Giá bán (VNĐ) <span className="required">*</span></label>
                  <div className="price-input-wrap">
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="VD: 25000000"
                      min="0"
                    />
                    <span className="price-input-suffix">VND</span>
                  </div>
                  {errors.price && <p className="error-text">{errors.price}</p>}
                </div>

                <div className="form-group form-group-full">
                  <label htmlFor="description">Mô tả chi tiết <span className="required">*</span></label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả rõ ngoại hình, phụ kiện đi kèm, thời gian sử dụng, lỗi nếu có và lý do bán..."
                    rows={7}
                  />
                  {errors.description && <p className="error-text">{errors.description}</p>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Khu vực</span>
                  <h2>Địa chỉ đăng bán</h2>
                </div>
                <p>Thông tin địa điểm rõ ràng sẽ giúp người mua yên tâm hơn khi trao đổi và nhận hàng.</p>
              </div>

              <div className="location-panel">
                <LocationSelector
                  value={formData.location}
                  onChange={handleLocationChange}
                  errors={{
                    city: errors['location.city'],
                    district: errors['location.district']
                  }}
                />
              </div>
            </div>
          </div>

          <aside className="create-product-sidebar">
            <div className="sidebar-card sidebar-card-accent">
              <div className="sidebar-card-head">
                <span className="sidebar-kicker">Xem trước</span>
                <h3>Tóm tắt tin đăng</h3>
              </div>

              <div className="listing-preview-card">
                <div className="listing-preview-media">
                  {imagePreviews[0] ? (
                    <img src={imagePreviews[0]} alt="Ảnh xem trước sản phẩm" />
                  ) : (
                    <div className="listing-preview-placeholder">Chưa có ảnh</div>
                  )}
                </div>

                <div className="listing-preview-body">
                  <span className="listing-preview-condition">
                    {CONDITION_LABELS[formData.condition]}
                  </span>
                  <h4>{formData.title.trim() || 'Tiêu đề tin đăng sẽ hiển thị tại đây'}</h4>
                  <p className="listing-preview-price">{formattedPrice === 'Chưa nhập' ? formattedPrice : `${formattedPrice} đ`}</p>
                  <ul className="preview-meta-list">
                    <li>
                      <span>Danh mục</span>
                      <strong>{selectedCategory?.name || 'Chưa chọn'}</strong>
                    </li>
                    <li>
                      <span>Khu vực</span>
                      <strong>{locationPreview || 'Chưa cập nhật'}</strong>
                    </li>
                    <li>
                      <span>Số ảnh</span>
                      <strong>{imageFiles.length} ảnh</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="sidebar-card">
              <div className="sidebar-card-head">
                <span className="sidebar-kicker">Gợi ý</span>
                <h3>Mẹo để tin đăng đẹp hơn</h3>
              </div>

              <ul className="tips-list">
                <li>Chụp đủ mặt trước, mặt sau, viền và phụ kiện đi kèm.</li>
                <li>Tiêu đề nên gồm tên sản phẩm, phiên bản và dung lượng nếu có.</li>
                <li>Mô tả trung thực tình trạng để giảm trao đổi qua lại không cần thiết.</li>
                <li>Đặt giá rõ ràng để tăng tỷ lệ được liên hệ đúng nhu cầu.</li>
              </ul>
            </div>
          </aside>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Đang đăng...' : 'Đăng tin'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
