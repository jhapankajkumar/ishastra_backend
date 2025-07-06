const express = require('express');
const router = express.Router();
const tradeController = require('../controllerS/trade.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', tradeController.getAllTrades);
router.get('/dashboard/summary', tradeController.getDashboardSummary);

router.post(
  '/',
  upload.fields([
    { name: 'entryCharts', maxCount: 5 },
    { name: 'exitCharts', maxCount: 5 },
    { name: 'postTradeFiles', maxCount: 5 }
  ]),
  tradeController.createTrade
);
router.put(
  '/:id/exit',
  upload.fields([
    { name: 'exitCharts', maxCount: 5 }
  ]),
  tradeController.updateTradeExit
);
router.put(
  '/:id/post-analysis',
  upload.fields([
    { name: 'postTradeFiles', maxCount: 5 }
  ]),
  tradeController.addPostAnalysis
);
router.get('/:id', tradeController.getTradeById);
router.delete('/:id', tradeController.deleteTrade);

module.exports = router;
