import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import productService from '../../services/product.service';
import api from '../../services/api';
import './CreateProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(true);
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
      ward: ''
    }
  });

  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      setFetchingProduct(true);
      const product = await productService.getProductById(id);
      
      // Kiem tra quyen so huu
      const sellerId = String(product?.seller?._id || product?.seller || '');
      const currentUserId = String(user?._id || user?.id || user?.userId || '');
      if (!sellerId || !currentUserId || sellerId !== currentUserId) {
        alert('Bạn không có quyền chỉnh sửa sản phẩm này');
        navigate('/');
        return;
      }

      setFormData({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category._id,
        condition: product.condition,
        images: product.images,
        location: product.location
      });
      
      setExistingImages(product.images);
    } catch (error) {
      alert('Không thể tải thông tin sản phẩm');
      navigate('/');
    } finally {
      setFetchingProduct(false);
    }
  }, [id, navigate, user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCategories();
    fetchProduct();
  }, [fetchCategories, fetchProduct, navigate, user]);

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

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    const totalImages = existingImages.length + newImageFiles.length + files.length;
    if (totalImages > 5) {
      alert('Bạn chỉ có thể có tối đa 5 ảnh');
      return;
    }

    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      alert('Mỗi ảnh không được vượt quá 5MB');
      return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setNewImageFiles(prev => [...prev, ...files]);
    setNewImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => {
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

    const totalImages = existingImages.length + newImageFiles.length;
    if (totalImages === 0) {
      newErrors.images = 'Vui lòng có ít nhất 1 ảnh';
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

  const uploadNewImages = async () => {
    if (newImageFiles.length === 0) {
      return [];
    }

    const formData = new FormData();
    newImageFiles.forEach(file => {
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
      // Upload anh moi
      const newImageUrls = await uploadNewImages();

      // Gop anh cu va anh moi
      const allImages = [...existingImages, ...newImageUrls];

      // Cap nhat san pham
      const updateData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        images: allImages,
        location: formData.location
      };

      await productService.updateProduct(id, updateData);
      
      alert('Sản phẩm đã được cập nhật thành công!');
      navigate(`/product/${id}`);
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Không thể cập nhật sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="create-product-container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Đang tải...
        </div>
      </div>
    );
  }

  return (
    <div className="create-product-container">
      <div className="create-product-header">
        <h1>Chỉnh sửa tin đăng</h1>
        <p>Cập nhật thông tin sản phẩm của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className="create-product-form">
        {/* Images */}
        <div className="form-section">
          <h2>Hình ảnh sản phẩm</h2>
          <div className="image-upload-area">
            <div className="image-previews">
              {/* Existing Images */}
              {existingImages.map((image, index) => (
                <div key={`existing-${index}`} className="image-preview">
                  <img src={image} alt={`Existing ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeExistingImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* New Images */}
              {newImagePreviews.map((preview, index) => (
                <div key={`new-${index}`} className="image-preview">
                  <img src={preview} alt={`New ${index + 1}`} />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => removeNewImage(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* Upload Button */}
              {(existingImages.length + newImageFiles.length) < 5 && (
                <label className="image-upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImageChange}
                    style={{ display: 'none' }}
                  />
                  <div className="upload-placeholder">
                    <span>+</span>
                    <span>Up ảnh</span>
                  </div>
                </label>
              )}
            </div>
            <p className="help-text">
              Tối đa 5 ảnh (tối đa 5MB mỗi ảnh)
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
              maxLength={100}
            />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Danh mục</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled
            >
              <option value="">Chọn danh mục</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="help-text">Không thể thay đổi danh mục</p>
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
              rows={6}
            />
            {errors.description && <p className="error-text">{errors.description}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <h2>Địa chỉ</h2>
          
          <div className="form-group">
            <label htmlFor="city">Thành phố <span className="required">*</span></label>
            <input
              type="text"
              id="city"
              name="location.city"
              value={formData.location.city}
              onChange={handleChange}
            />
            {errors['location.city'] && <p className="error-text">{errors['location.city']}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="district">Quận/Huyện <span className="required">*</span></label>
            <input
              type="text"
              id="district"
              name="location.district"
              value={formData.location.district}
              onChange={handleChange}
            />
            {errors['location.district'] && <p className="error-text">{errors['location.district']}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="ward">Phường/Xã</label>
            <input
              type="text"
              id="ward"
              name="location.ward"
              value={formData.location.ward}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/product/${id}`)}
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
            {loading ? 'Đang cập nhật...' : 'Cập nhật'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
