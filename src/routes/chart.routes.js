// src/routes/chartReading.routes.js
const express = require('express');
const router = express.Router();
const chartReadingController = require('../controllers/chart.controller');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'charts'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post(
  '/',
  upload.single('screenshot'),
  chartReadingController.createChartReading
);

router.get('/', chartReadingController.getAllChartReadings);

module.exports = router;