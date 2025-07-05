const express = require('express');
const router = express.Router();
const tacticController = require('../controllers/tactic.controller');

router.get('/', tacticController.getAllSetups);

module.exports = router;