/**
 * Image Helper Utilities
 * Xử lý URL ảnh, placeholder, và fallback
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Get full URL for uploaded image
 * @param {string} path - Relative path from backend (e.g., "/uploads/products/123/image.jpg")
 * @returns {string} Full URL
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  
  // If already full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Combine with API URL
  return `${API_URL}${path}`;
};

/**
 * Get product image URL with fallback
 * @param {object} product - Product object
 * @param {number} index - Image index (default: 0)
 * @returns {string} Image URL or placeholder
 */
export const getProductImageUrl = (product, index = 0) => {
  if (product?.images && product.images.length > index) {
    return getImageUrl(product.images[index]);
  }
  return '/images/placeholders/product-placeholder.svg';
};

/**
 * Get user avatar URL with fallback
 * @param {object} user - User object
 * @returns {string} Avatar URL or placeholder
 */
export const getUserAvatarUrl = (user) => {
  if (user?.avatar) {
    return getImageUrl(user.avatar);
  }
  return '/images/placeholders/avatar-placeholder.svg';
};

/**
 * Get category icon URL
 * @param {string} categorySlug - Category slug
 * @returns {string} Icon URL
 */
export const getCategoryIconUrl = (categorySlug) => {
  return `/images/icons/category-${categorySlug}.png`;
};

/**
 * Handle image load error - set placeholder
 * @param {Event} e - Error event
 * @param {string} type - Type of placeholder ('product', 'avatar', 'category')
 */
export const handleImageError = (e, type = 'product') => {
  const placeholders = {
    product: '/images/placeholders/product-placeholder.svg',
    avatar: '/images/placeholders/avatar-placeholder.svg',
    category: '/images/placeholders/product-placeholder.svg',
  };
  
  e.target.src = placeholders[type] || placeholders.product;
  e.target.onerror = null; // Prevent infinite loop
};

/**
 * Validate image file before upload
 * @param {File} file - File object
 * @param {object} options - Validation options
 * @returns {object} { valid: boolean, error: string }
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  } = options;

  // Check if file exists
  if (!file) {
    return { valid: false, error: 'Vui lòng chọn file' };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `Kích thước file không được vượt quá ${maxSizeMB}MB` };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Chỉ chấp nhận file ảnh (JPG, PNG, GIF)' };
  }

  return { valid: true, error: null };
};

/**
 * Create image preview URL
 * @param {File} file - File object
 * @returns {string} Object URL for preview
 */
export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke image preview URL to free memory
 * @param {string} url - Object URL
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Compress image before upload (client-side)
 * @param {File} file - Image file
 * @param {object} options - Compression options
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          file.type,
          quality
        );
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default {
  getImageUrl,
  getProductImageUrl,
  getUserAvatarUrl,
  getCategoryIconUrl,
  handleImageError,
  validateImageFile,
  createImagePreview,
  revokeImagePreview,
  compressImage,
  formatFileSize,
};
