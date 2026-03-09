const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed image formats
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'gif'];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get productId from query params or use 'temp'
    const productId = req.query.productId || req.params.productId || 'temp';
    const uploadPath = path.join(__dirname, '../../../uploads/products', productId);
    
    // Store productId in request for later use
    req.productId = productId;
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: {timestamp}-{randomString}.{ext}
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    const filename = `${timestamp}-${randomString}.${ext}`;
    
    cb(null, filename);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (ALLOWED_FORMATS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng file không hợp lệ. Chỉ chấp nhận: ${ALLOWED_FORMATS.join(', ')}`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

// Error handler for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Kích thước file vượt quá giới hạn 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Lỗi upload: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError
};
