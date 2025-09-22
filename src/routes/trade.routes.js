const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/trade.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/', tradeController.getAllTrades);

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
  '/:id/partial-exit',
  upload.fields([
    { name: 'exitCharts', maxCount: 5 }
  ]),
  tradeController.partialExitTrade
);
router.put(
  '/:id/post-analysis',
  upload.fields([
    { name: 'reviewCharts', maxCount: 5 }
  ]),
  tradeController.addPostAnalysis
);
router.get('/:id', tradeController.getTradeById);
router.get('/:id/transactions', tradeController.getTradeTransactions);
router.delete('/:id', tradeController.deleteTrade);
router.post('/stock-split', tradeController.updateStockSplit);

module.exports = router;
