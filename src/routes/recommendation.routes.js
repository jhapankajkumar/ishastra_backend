const express = require('express');
const router = express.Router();

const {
  getAllRecommendations,
  getRecommendationById,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  archiveRecommendation
} = require('../controllers/recommendation.controller');

// Routes
router.get('/', getAllRecommendations);
router.get('/:id', getRecommendationById);
router.post('/', createRecommendation);
router.put('/:id', updateRecommendation);
router.delete('/:id', deleteRecommendation);
router.patch('/:id/archive', archiveRecommendation);

module.exports = router;
