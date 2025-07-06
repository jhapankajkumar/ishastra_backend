// src/controllers/journal.controller.js
const prisma = require('../db');

exports.createJournal = async (req, res) => {
  try {
    const {
      date,
      stock,
      trend,
      candle_type,
      near_support,
      near_resistance,
      support_level,
      resistance_level,
      ema_touch,
      volume_spike,
      rsi_value,
      entry_considered,
      action_plan,
      notes
    } = req.body;

    const journal = await prisma.chart_readings.create({
      data: {
        date: new Date(date),
        stock,
        trend,
        candle_type,
        near_support: near_support === 'true',
        near_resistance: near_resistance === 'true',
        support_level: support_level ? parseFloat(support_level) : null,
        resistance_level: resistance_level ? parseFloat(resistance_level) : null,
        ema_touch: ema_touch === 'true',
        volume_spike: volume_spike === 'true',
        rsi_value: rsi_value ? parseFloat(rsi_value) : null,
        entry_considered: entry_considered === 'true',
        action_plan,
        notes,
        screenshot_url: req.file ? req.file.path : null
      }
    });

    res.status(201).json({ journal });
  } catch (error) {
    console.error('Error saving journal:', error);
    res.status(500).json({ error: 'Failed to save journal' });
  }
};

exports.getAllJournals = async (req, res) => {
  try {
    const journals = await prisma.chart_readings.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(journals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
};

// Get a single journal by ID
exports.getJournalById = async (req, res) => {
  try {
    const { id } = req.params;
    const journal = await prisma.chart_readings.findUnique({
      where: { id: Number(id) }
    });

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    res.json(journal);
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ error: 'Failed to fetch journal', details: error.message });
  }
};

// Delete journal
exports.deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const journalId = Number(id);

    // Validate journal ID
    if (!journalId || isNaN(journalId)) {
      return res.status(400).json({ error: 'Invalid journal ID' });
    }

    // Check if journal exists
    const journal = await prisma.chart_readings.findUnique({
      where: { id: journalId }
    });

    if (!journal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    // Delete the journal
    await prisma.chart_readings.delete({
      where: { id: journalId }
    });

    console.log(`Journal with ID ${journalId} deleted successfully`);
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error('Error deleting journal:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Journal not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete journal', 
      details: error.message 
    });
  }
};

// Update journal
exports.updateJournal = async (req, res) => {
  try {
    const { id } = req.params;
    const journalId = Number(id);

    // Validate journal ID
    if (!journalId || isNaN(journalId)) {
      return res.status(400).json({ error: 'Invalid journal ID' });
    }

    // Check if journal exists
    const existingJournal = await prisma.chart_readings.findUnique({
      where: { id: journalId }
    });

    if (!existingJournal) {
      return res.status(404).json({ error: 'Journal not found' });
    }

    const {
      notes
    } = req.body;

    // Prepare update data - only allow updating notes and review screenshot
    const updateData = {
      notes: notes !== undefined ? notes : existingJournal.notes
    };

    // Handle review screenshot update (for edit mode)
    if (req.file) {
      updateData.review_screenshot_url = req.file.path;
    }

    const updatedJournal = await prisma.chart_readings.update({
      where: { id: journalId },
      data: updateData
    });

    console.log(`Journal with ID ${journalId} updated successfully`);
    res.json({ journal: updatedJournal });
  } catch (error) {
    console.error('Error updating journal:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Journal not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update journal', 
      details: error.message 
    });
  }
};