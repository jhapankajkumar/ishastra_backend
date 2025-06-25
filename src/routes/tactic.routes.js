const express = require('express');
const router = express.Router();
const tacticController = require('../controllers/tactic.controller');

router.get('/', tacticController.getAllTactics);
router.post('/', tacticController.createTactic);

module.exports = router;
