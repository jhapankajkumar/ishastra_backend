// src/routes/journal.routes.js
const express = require('express');
const router = express.Router();
const journalController = require('../controllers/chart.controller');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads', 'charts'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.post(
  '/',
  upload.single('screenshot'),
  journalController.createJournal
);

router.get('/', journalController.getAllJournals);
router.get('/:id', journalController.getJournalById);
router.delete('/:id', journalController.deleteJournal);

module.exports = router;