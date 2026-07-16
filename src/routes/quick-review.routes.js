const express = require('express');
const router = express.Router();
const multer = require('multer');
const { QuickReviewController } = require('../controllers/quick-review.controller');

// Configure multer for temporary image uploads
const storage = multer.diskStorage({
  destination: 'uploads/quick-review/',
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const controller = new QuickReviewController();

router.post('/', upload.single('image'), (req, res) => {
  controller.quickReview(req, res);
});

module.exports = router;
