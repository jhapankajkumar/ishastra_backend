const express = require('express');
const router = express.Router();
const { getMarketIndices } = require('../controllers/market.controller');

router.get('/indices', getMarketIndices);

module.exports = router;
