const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journal.controller');

router.get('/', journalController.getAllJournals);
router.post('/', journalController.createJournal);

module.exports = router;
