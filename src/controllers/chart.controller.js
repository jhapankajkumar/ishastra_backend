// src/controllers/journal.controller.js
const prisma = require('../db');
const { buildReadFilter, buildWriteFilter, buildCreateData } = require('../utils/ownershipFilter');

exports.createChartAnalysis = async (req, res) => {
  try {
    const {
      entryDate,
      ticker,
      tickerName,
      trend,
      candleType,
      nearSupport,
      nearResistance,
      supportLevel,
      resistanceLevel,
      emaTouch,
      volumeSpike,
      rsiValue,
      entryConsidered,
      actionPlan,
      entryNotes,
      reviewNotes,
      setupConfidence,
      setupType
    } = req.body;
    const analysis = await prisma.chartAnalysis.create({
      data: buildCreateData(req, {
        entryDate: new Date(entryDate),
        ticker,
        tickerName: tickerName || "null",
        trend,
        candleType,
        nearSupport: nearSupport === 'true',
        nearResistance: nearResistance === 'true',
        supportLevel: supportLevel ? parseFloat(supportLevel) : null,
        resistanceLevel: resistanceLevel ? parseFloat(resistanceLevel) : null,
        emaTouch: emaTouch === 'true',
        volumeSpike: volumeSpike === 'true',
        rsiValue: rsiValue ? parseFloat(rsiValue) : null,
        entryConsidered: entryConsidered === 'true',
        actionPlan,
        entryNotes,
        reviewNotes: reviewNotes || null,
        setupConfidence: setupConfidence || 'Low',
        setupType: parseInt(setupType) || null
      })
    });

    const chartImages = [];
    if (req.files?.entryCharts) {
      req.files.entryCharts.forEach(file => {
        chartImages.push({
          chartId: analysis.id,
          imageType: "entry",
          filePath: file.path,
        });
      });
    }

    //console.log(`Chart Images: ${chartImages}`);
    if (chartImages.length > 0) {
      await Promise.all(
        chartImages.map(imageData =>
          prisma.chartImage.create({ data: imageData })
        )
      );
    }

    res.status(201).json({ analysis });
  } catch (error) {
    console.error('Error saving analysis:', error);
    res.status(500).json({ error: 'Failed to save analysis' });
  }
};

exports.getAllChartAnalyses = async (req, res) => {
  try {
    const analyses = await prisma.chartAnalysis.findMany({
      where: buildReadFilter(req),
      orderBy: { entryDate: 'desc' }
    });

    const chartIds = analyses.map(j => j.id);
    const chartImages = await prisma.chartImage.findMany({
      where: { chartId: { in: chartIds } }
    });

    res.json({ data: analyses, chartImages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
};

// Get a single analysis by ID
exports.getChartAnalysisById = async (req, res) => {
  try {
    const { id } = req.params;
    const analysis = await prisma.chartAnalysis.findFirst({
      where: { id: Number(id), ...buildReadFilter(req) },
      include: {
        chartImages: true
      }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const chartImages = await prisma.chartImage.findMany({ where: { chartId: analysis.id } });

    res.json({ analysis, chartImages });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis', details: error.message });
  }
};

// Delete analysis
exports.deleteChartAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const analysisId = Number(id);

    // Validate analysis ID
    if (!analysisId || isNaN(analysisId)) {
      return res.status(400).json({ error: 'Invalid analysis ID' });
    }

    // Check if analysis exists and belongs to the caller (route requires auth)
    const analysis = await prisma.chartAnalysis.findFirst({
      where: { id: analysisId, userId: req.user.id }
    });

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    // Delete chart images
    await prisma.chartImage.deleteMany({
      where: { chartId: analysis.id }
    });

    // Delete the analysis
    await prisma.chartAnalysis.delete({
      where: { id: analysisId }
    });

    //console.log(`Analysis with ID ${analysisId} deleted successfully`);
    res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.error('Error deleting analysis:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete analysis', 
      details: error.message 
    });
  }
};

// Update analysis
exports.updateChartAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const analysisId = Number(id);

    // Validate analysis ID
    if (!analysisId || isNaN(analysisId)) {
      return res.status(400).json({ error: 'Invalid analysis ID' });
    }

    // Check if analysis exists and belongs to the caller (or sandbox for guests)
    const existingAnalysis = await prisma.chartAnalysis.findFirst({
      where: { id: analysisId, ...buildWriteFilter(req) }
    });

    if (!existingAnalysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const {
      reviewNotes
    } = req.body;

    //console.log(`reviewNotes ${reviewNotes}`);
  
    // Prepare update data - only allow updating entryNotes and reviewNotes
    const updateData = {
      reviewNotes: reviewNotes !== undefined ? reviewNotes : existingAnalysis.reviewNotes
    };

    //console.log(`Files: ${req.files?.reviewCharts}`);

    if (req.files?.reviewCharts) {
      const chartImages = req.files.reviewCharts.map(file => ({
        chartId: analysisId,
        imageType: "review",
        filePath: file.path,
      }));
      await Promise.all(
        chartImages.map(imageData => 
          prisma.chartImage.create({ data: imageData })
        )
      );
    }


    const updatedAnalysis = await prisma.chartAnalysis.update({
      where: { id: analysisId },
      data: updateData
    });

    //console.log(`Analysis with ID ${analysisId} updated successfully`);
    res.json({ analysis: updatedAnalysis });
  } catch (error) {
    console.error('Error updating analysis:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to update analysis', 
      details: error.message 
    });
  }
};