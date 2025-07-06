// src/controllers/chartReading.controller.js
const prisma = require('../db');

exports.createChartReading = async (req, res) => {
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

    const reading = await prisma.chart_readings.create({
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
        screenshot_url: req.file?.path || null
      }
    });

    res.status(201).json({ reading });
  } catch (error) {
    console.error('Error saving chart reading:', error);
    res.status(500).json({ error: 'Failed to save chart reading' });
  }
};

exports.getAllChartReadings = async (req, res) => {
  try {
    const readings = await prisma.chart_readings.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(readings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
};

// Get a single chart reading by ID
exports.getChartReadingById = async (req, res) => {
  try {
    const { id } = req.params;
    const reading = await prisma.chart_readings.findUnique({
      where: { id: Number(id) }
    });

    if (!reading) {
      return res.status(404).json({ error: 'Chart reading not found' });
    }

    res.json(reading);
  } catch (error) {
    console.error('Error fetching chart reading:', error);
    res.status(500).json({ error: 'Failed to fetch chart reading', details: error.message });
  }
};

// Delete chart reading
exports.deleteChartReading = async (req, res) => {
  try {
    const { id } = req.params;
    const readingId = Number(id);

    // Validate chart reading ID
    if (!readingId || isNaN(readingId)) {
      return res.status(400).json({ error: 'Invalid chart reading ID' });
    }

    // Check if chart reading exists
    const reading = await prisma.chart_readings.findUnique({
      where: { id: readingId }
    });

    if (!reading) {
      return res.status(404).json({ error: 'Chart reading not found' });
    }

    // Delete the chart reading
    await prisma.chart_readings.delete({
      where: { id: readingId }
    });

    console.log(`Chart reading with ID ${readingId} deleted successfully`);
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error('Error deleting chart reading:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Chart reading not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete chart reading', 
      details: error.message 
    });
  }
};