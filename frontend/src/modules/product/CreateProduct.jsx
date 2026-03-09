import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import api from '../../services/api';
import LocationSelector from '../../components/LocationSelector';
import './CreateProduct.css';

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

  useEffect(() => {
    console.log('Categories state changed:', categories);
    console.log('Categories length:', categories.length);
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      console.log('Categories response:', response.data);
      const categoriesData = response.data.data || response.data || [];
      console.log('Categories data to set:', categoriesData);
      console.log('Categories count:', categoriesData.length);
      setCategories(categoriesData);
      console.log('Categories state updated');
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

    // Validate file size (max 5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Mỗi ảnh không được vượt quá 5MB');
      return;
    }

    // Create previews
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
      
      // Extract paths from response
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
      // Upload images first
      const imageUrls = await uploadImages();
      
      console.log('Image URLs:', imageUrls);

      // Create product - only send fields backend expects
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
      
      console.log('Product data to send:', productData);

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

  return (
    <div className="create-product-container">
      <div className="create-product-header">
        <h1>Đăng tin mới</h1>
        <p>Điền thông tin chi tiết về sản phẩm của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="create-product-form">
        {/* Images Upload */}
        <div className="form-section">
          <h2>Hình ảnh sản phẩm</h2>
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
                    <span>Thêm ảnh</span>
                  </div>
                </label>
              )}
            </div>
            <p className="help-text">
              Tải lên 1-5 ảnh (tối đa 5MB mỗi ảnh)
            </p>
            {errors.images && <p className="error-text">{errors.images}</p>}
          </div>
        </div>

        {/* Basic Info */}
        <div className="form-section">
          <h2>Thông tin cơ bản</h2>
          
          <div className="form-group">
            <label htmlFor="title">Tiêu đề <span className="required">*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: iPhone 13 Pro Max 256GB"
              maxLength={100}
            />
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

          <div className="form-group">
            <label htmlFor="price">Giá (VNĐ) <span className="required">*</span></label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="VD: 25000000"
              min="0"
            />
            {errors.price && <p className="error-text">{errors.price}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô tả chi tiết <span className="required">*</span></label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết về sản phẩm của bạn..."
              rows={6}
            />
            {errors.description && <p className="error-text">{errors.description}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <h2>Địa chỉ</h2>
          <LocationSelector
            value={formData.location}
            onChange={handleLocationChange}
            errors={{
              city: errors['location.city'],
              district: errors['location.district']
            }}
          />
        </div>

        {/* Submit Buttons */}
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
