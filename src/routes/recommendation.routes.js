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
const { requireAuth } = require('../middleware/auth.middleware');
const { guestWriteLimiter } = require('../middleware/rateLimit.middleware');

// Routes
router.get('/', getAllRecommendations);
router.get('/:id', getRecommendationById);
router.post('/', guestWriteLimiter, createRecommendation);
router.put('/:id', updateRecommendation);
router.delete('/:id', requireAuth, deleteRecommendation);
router.patch('/:id/archive', archiveRecommendation);

module.exports = router;
