const express = require('express');
const router = express.Router();
const { upload, uploadEvidence, uploadDisputeEvidence, handleUploadError } = require('../../common/middlewares/upload.middleware');
const { authenticate } = require('../../common/middlewares/auth.middleware');

// Upload single image
router.post('/image', authenticate, upload.single('image'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file để upload'
      });
    }

    // Get the productId that was used during upload
    const productId = req.productId || 'temp';
    const filePath = `/uploads/products/${productId}/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'Upload thành công',
      data: {
        filename: req.file.filename,
        path: filePath,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload file'
    });
  }
});

// Upload multiple images
router.post('/images', authenticate, upload.array('images', 5), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một file để upload'
      });
    }

    // Get the productId that was used during upload
    const productId = req.productId || 'temp';
    
    // Return array of file paths
    const files = req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/products/${productId}/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));
    
    res.status(200).json({
      success: true,
      message: 'Upload thành công',
      data: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload file'
    });
  }
});

// Upload evidence files (images/videos) for disputes/reports
router.post('/evidence', authenticate, uploadDisputeEvidence.array('files', 5), handleUploadError, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một file để upload'
      });
    }

    const targetId = req.uploadTargetId || 'temp';

    const files = req.files.map(file => ({
      filename: file.filename,
      path: `/uploads/evidence/${targetId}/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      success: true,
      message: 'Upload bằng chứng thành công',
      data: files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi upload bằng chứng'
    });
  }
});

module.exports = router;
