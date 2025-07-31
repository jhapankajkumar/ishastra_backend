// src/routes/chart.routes.js
const express = require('express');
const router = express.Router();
const chartController = require('../controllers/chart.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post(
  '/',
  upload.fields([
    { name: 'entryCharts', maxCount: 5 },
  ]),
  chartController.createChartAnalysis
);

router.get('/', chartController.getAllChartAnalyses);
router.get('/:id', chartController.getChartAnalysisById);
router.put(
  '/:id',
  upload.fields([
    { name: 'reviewCharts', maxCount: 5 },
  ]),
  chartController.updateChartAnalysis
);
router.delete('/:id', chartController.deleteChartAnalysis);

module.exports = router;