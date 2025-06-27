const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/trade.controller');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'trades'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.get('/', tradeController.getAllTrades);
router.get('/dashboard/summary', tradeController.getDashboardSummary);

router.post(
  '/',
  upload.fields([
    { name: 'entry_chart', maxCount: 1 },
    { name: 'exit_chart', maxCount: 1 },
    { name: 'post_chart', maxCount: 1 }
  ]),
  tradeController.createTrade
);

router.patch(
  '/:id',
  upload.fields([
    { name: 'exit_chart', maxCount: 1 },
    { name: 'post_chart', maxCount: 1 }
  ]),
  tradeController.updateTrade
);

module.exports = router;
