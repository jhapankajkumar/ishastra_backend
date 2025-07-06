const express = require('express');
const router = express.Router();
const tacticController = require('../controllers/tactic.controller');

router.get('/', tacticController.getAllSetups);
router.post('/', tacticController.createSetup);

module.exports = router;