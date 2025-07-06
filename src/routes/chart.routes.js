// src/routes/journal.routes.js
const express = require('express');
const router = express.Router();
const journalController = require('../controllers/chart.controller');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.post(
  '/',
  upload.single('screenshot'),
  journalController.createJournal
);

router.get('/', journalController.getAllJournals);
router.get('/:id', journalController.getJournalById);
router.put(
  '/:id',
  upload.single('reviewScreenshot'),
  journalController.updateJournal
);
router.delete('/:id', journalController.deleteJournal);

module.exports = router;