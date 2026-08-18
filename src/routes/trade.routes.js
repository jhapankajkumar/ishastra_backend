const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/trade.controller');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Keep the original file extension. multer's bare `dest:` option writes
// extension-less random names, which breaks non-image charts twice over:
// the frontend can't tell a .html/.pdf from an image, and express.static
// can't infer a Content-Type, so the browser won't render it either.
const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
    }
  })
});
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const { guestWriteLimiter } = require('../middleware/rateLimit.middleware');
const { validateGuestWritableFields } = require('../middleware/validation.middleware');

router.get('/', tradeController.getAllTrades);

router.post(
  '/',
  guestWriteLimiter,
  upload.fields([
    { name: 'entryCharts', maxCount: 5 },
    { name: 'exitCharts', maxCount: 5 },
    { name: 'postTradeFiles', maxCount: 5 }
  ]),
  validateGuestWritableFields,
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
  '/:id/add-quantity',
  upload.none(),
  tradeController.addQuantity
);
router.put(
  '/:id/trailing-stop',
  upload.none(),
  tradeController.updateTrailingStop
);
router.put(
  '/:id/post-analysis',
  upload.fields([
    { name: 'reviewCharts', maxCount: 5 }
  ]),
  tradeController.addPostAnalysis
);
router.put(
  '/:id/edit',
  upload.none(),
  tradeController.editTrade
);
router.get('/:id', tradeController.getTradeById);
router.get('/:id/transactions', tradeController.getTradeTransactions);
router.delete('/:id', requireAuth, tradeController.deleteTrade);
// Cross-user by design (refreshes every user's trades) — locked to SUPERUSER
// rather than opened to any USER.
router.post('/stock-split', requireAuth, requireRole('SUPERUSER'), tradeController.updateStockSplit);

module.exports = router;
