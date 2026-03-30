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

const MAX_PRICE_VALUE = 100000000;
const MAX_PRICE_DIGITS = 9;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

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
    categories: [],
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
      const sanitizedCategories = categoriesData.filter((category) => {
        const slug = String(category?.slug || '').toLowerCase();
        const name = String(category?.name || '').toLowerCase();
        return slug !== 'other' && name !== 'khác' && name !== 'khac';
      });
      setCategories(sanitizedCategories);
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
    } else if (name === 'price') {
      const rawNumericValue = String(value || '').replace(/\D/g, '');
      const exceededMaxPrice = Number(rawNumericValue || 0) > MAX_PRICE_VALUE;

      const numericValue = String(value || '')
        .replace(/\D/g, '')
        .slice(0, MAX_PRICE_DIGITS);

      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));

      setErrors(prev => ({
        ...prev,
        price: exceededMaxPrice ? 'Giá tối đa là 100.000.000 VND' : ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (name !== 'price' && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(categoryId);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter(id => id !== categoryId)
          : [...prev.categories, categoryId]
      };
    });

    if (errors.categories || errors.category) {
      setErrors(prev => ({ ...prev, categories: '', category: '' }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) {
      return;
    }

    setErrors(prev => ({ ...prev, images: '' }));
    
    if (files.length + imageFiles.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Bạn chỉ có thể tải lên tối đa 5 ảnh.' }));
      return;
    }

    const invalidTypeFiles = files.filter(file => !ALLOWED_IMAGE_TYPES.includes(String(file.type || '').toLowerCase()));
    if (invalidTypeFiles.length > 0) {
      setErrors(prev => ({ ...prev, images: 'Chỉ cho phép tải lên ảnh JPG/JPEG hoặc PNG.' }));
    }

    // Kiem tra kich thuoc file (toi da 5MB moi anh)
    const invalidSizeFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidSizeFiles.length > 0) {
      setErrors(prev => ({ ...prev, images: 'Có ảnh vượt quá 5MB, vui lòng chọn lại.' }));
    }

    const validFiles = files.filter(file => {
      const isImage = ALLOWED_IMAGE_TYPES.includes(String(file.type || '').toLowerCase());
      const isWithinSize = file.size <= 5 * 1024 * 1024;
      return isImage && isWithinSize;
    });

    if (validFiles.length === 0) {
      return;
    }

    // Tao anh xem truoc
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    
    setImageFiles(prev => [...prev, ...validFiles]);
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
    if (Number(formData.price || 0) > MAX_PRICE_VALUE) {
      newErrors.price = 'Giá tối đa là 100.000.000 VND';
    }

    if (formData.categories.length === 0) {
      newErrors.categories = 'Vui lòng chọn ít nhất 1 danh mục';
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
        category: formData.categories[0],
        categories: formData.categories,
        otherCategory: '',
        condition: formData.condition,
        images: imageUrls,
        location: {
          city: formData.location.city,
          district: formData.location.district,
          ward: formData.location.ward || ''
        }
      };

      await productService.createProduct(productData);

      const createdAtMarker = String(Date.now());
      localStorage.setItem('products:lastCreatedAt', createdAtMarker);
      window.dispatchEvent(new CustomEvent('products:updated', { detail: { createdAt: createdAtMarker } }));
      
      alert('Đăng tin thành công. Bạn sẽ thấy thông báo mới trong mục thông báo.');
      navigate('/my-products');
    } catch (error) {
      console.error('Create product error:', error);
      alert(error.response?.data?.message || error.message || 'Không thể tạo sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategories = categories.filter(cat => formData.categories.includes(cat._id));
  const selectedCategoryLabel = selectedCategories.map(category => category.name).join(', ');
  const categoryPreviewLabel = selectedCategoryLabel;
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
    formData.categories.length > 0,
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
                        aria-label="Xóa ảnh"
                        title="Xóa ảnh"
                        onClick={() => removeImage(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {imageFiles.length < 5 && (
                    <label className="upload-pill-button">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        multiple
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                      />
                      <div className="upload-pill-content">
                        <span className="upload-pill-icon">+</span>
                        <span className="upload-pill-text">Up ảnh</span>
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
                  <label>Danh mục <span className="required">*</span></label>
                  <div className="category-picker-grid" role="group" aria-label="Chọn nhiều danh mục">
                    {categories && categories.length > 0 ? (
                      categories.map(cat => {
                        const isSelected = formData.categories.includes(cat._id);
                        return (
                          <button
                            key={cat._id}
                            type="button"
                            className={`category-chip ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => handleCategoryToggle(cat._id)}
                          >
                            <span className="category-chip-check">{isSelected ? '✓' : ''}</span>
                            <span className="category-chip-label">{cat.icon} {cat.name}</span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="help-text">Đang tải danh mục...</p>
                    )}
                  </div>

                  {errors.categories && <p className="error-text">{errors.categories}</p>}
                  <p className="help-text">Bạn có thể chọn nhiều danh mục để tăng khả năng tiếp cận người mua.</p>
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
                      type="text"
                      inputMode="numeric"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="VD: 25000000"
                      maxLength={MAX_PRICE_DIGITS}
                    />
                    <span className="price-input-suffix">VND</span>
                  </div>
                  <p className="help-text">Giá tối đa cho phép: 100.000.000 VND.</p>
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
                      <strong>{categoryPreviewLabel || 'Chưa chọn'}</strong>
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
