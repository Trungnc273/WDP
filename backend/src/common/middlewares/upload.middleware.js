const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed image formats for product uploads
const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif'];

// Allowed formats for dispute/report evidence (images + videos)
const EVIDENCE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm', 'avi', 'mkv'];

// Max file size for product images: 5MB
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024;

// Max file size for evidence media: 20MB
const MAX_EVIDENCE_FILE_SIZE = 20 * 1024 * 1024;

// Configure storage by upload bucket (products/evidence)
const createStorage = (bucket) => multer.diskStorage({
  destination: function (req, file, cb) {
    const targetId = req.query.productId || req.params.productId || req.query.targetId || 'temp';
    const uploadPath = path.join(__dirname, `../../../uploads/${bucket}`, targetId);

    req.uploadTargetId = targetId;
    req.uploadBucket = bucket;

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    const filename = `${timestamp}-${randomString}.${ext}`;

    cb(null, filename);
  }
});

// File filter to validate file types by allowed extension list
const createFileFilter = (allowedFormats) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().substring(1);

  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Định dạng file không hợp lệ. Chỉ chấp nhận: ${allowedFormats.join(', ')}`), false);
  }
};

const upload = multer({
  storage: createStorage('products'),
  fileFilter: createFileFilter(IMAGE_FORMATS),
  limits: {
    fileSize: MAX_IMAGE_FILE_SIZE
  }
});

const uploadEvidence = multer({
  storage: createStorage('evidence'),
  fileFilter: createFileFilter(EVIDENCE_FORMATS),
  limits: {
    fileSize: MAX_EVIDENCE_FILE_SIZE
  }
});

// Error handler for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Kích thước file vượt quá giới hạn cho phép'
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
  uploadEvidence,
  handleUploadError
};
