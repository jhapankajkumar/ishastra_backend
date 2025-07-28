const { PrismaClient } = require('@prisma/client');
const yahoo = require('../yahoo');
const prisma = new PrismaClient();

// Helper function to fetch current price
const fetchCurrentPrice = async (ticker) => {
  try {
    const price = await yahoo.getCurrentPrice(ticker);
    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${ticker}:`, error.message);
    return null;
  }
};

// Helper function to calculate price difference and percentage
const calculatePriceDifference = (buyBelow, currentPrice) => {
  if (!buyBelow || !currentPrice) {
    return { priceDifference: null, differencePercentage: null };
  }

  // Calculate difference (positive if current price is below buy below price)
  const difference = buyBelow - currentPrice;
  const differencePercentage = ((difference / buyBelow) * 100);

  return {
    priceDifference: parseFloat(difference.toFixed(2)),
    differencePercentage: parseFloat(differencePercentage.toFixed(2))
  };
};

// Get all recommendations
const getAllRecommendations = async (req, res) => {
  try {
    const { status, sector } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (sector) where.sector = sector;

    const recommendationList = await prisma.Recommendation.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Fetch current prices for all recommendations
    const recommendationsWithPrices = await Promise.all(
      recommendationList.map(async (rec) => {
        const currentPrice = await fetchCurrentPrice(rec.ticker);
        
        // Update the current price in database if we got a valid price
        if (currentPrice !== null) {
          await prisma.Recommendation.update({
            where: { id: rec.id },
            data: { currentPrice: currentPrice }
          });
        }

        const finalCurrentPrice = currentPrice !== null ? currentPrice : rec.currentPrice;
        const priceDiff = calculatePriceDifference(rec.buyBelow, finalCurrentPrice);

        return {
          ...rec,
          currentPrice: finalCurrentPrice,
          createdAt: rec.createdAt, // Alias for better readability
          priceDifference: priceDiff.priceDifference,
          differencePercentage: priceDiff.differencePercentage
        };
      })
    );

    res.json({
      success: true,
      recommendationList: recommendationsWithPrices
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
      error: error.message
    });
  }
};

// Get single recommendation
const getRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const recommendation = await prisma.Recommendation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    // Fetch current price
    const currentPrice = await fetchCurrentPrice(recommendation.ticker);
    
    // Update the current price in database if we got a valid price
    if (currentPrice !== null) {
      await prisma.Recommendation.update({
        where: { id: parseInt(id) },
        data: { currentPrice: currentPrice }
      });
    }

    const finalCurrentPrice = currentPrice !== null ? currentPrice : recommendation.currentPrice;
    const priceDiff = calculatePriceDifference(recommendation.buyBelow, finalCurrentPrice);

    const updatedRecommendation = {
      ...recommendation,
      currentPrice: finalCurrentPrice,
      createdAt: recommendation.createdAt, // Alias for better readability
      priceDifference: priceDiff.priceDifference,
      differencePercentage: priceDiff.differencePercentage
    };

    res.json({
      success: true,
      data: updatedRecommendation
    });
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendation',
      error: error.message
    });
  }
};

// Create new recommendation
const createRecommendation = async (req, res) => {
  try {
    const {
      ticker,
      buyBelow,
      currentPrice,
      sector,
      source
    } = req.body;

    // Validation
    if (!ticker) {
      return res.status(400).json({
        success: false,
        message: 'Ticker is required'
      });
    }

    // Fetch current price from API if not provided
    let finalCurrentPrice = currentPrice ? parseFloat(currentPrice) : null;
    if (!finalCurrentPrice) {
      finalCurrentPrice = await fetchCurrentPrice(ticker.toUpperCase());
    }

    const recommendationData = {
      ticker: ticker.toUpperCase(),
      buyBelow: buyBelow ? parseFloat(buyBelow) : null,
      currentPrice: finalCurrentPrice,
      sector: sector || null,
      source: source || null,
      status: 'active'
    };

    const recommendation = await prisma.Recommendation.create({
      data: recommendationData
    });

    const responseData = {
      ...recommendation,
      createdAt: recommendation.createdAt // Alias for better readability
    };

    res.status(201).json({
      success: true,
      message: 'Recommendation created successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create recommendation',
      error: error.message
    });
  }
};

// Update recommendation
const updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ticker,
      buyBelow,
      currentPrice,
      sector,
      source,
      status
    } = req.body;

    // Check if recommendation exists
    const existingRecommendation = await prisma.Recommendation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    const updateData = {};
    if (ticker !== undefined) updateData.ticker = ticker.toUpperCase();
    if (buyBelow !== undefined) updateData.buyBelow = buyBelow ? parseFloat(buyBelow) : null;
    if (currentPrice !== undefined) updateData.currentPrice = currentPrice ? parseFloat(currentPrice) : null;
    if (sector !== undefined) updateData.sector = sector;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;

    const recommendation = await prisma.Recommendation.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Recommendation updated successfully',
      data: recommendation
    });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update recommendation',
      error: error.message
    });
  }
};

// Delete recommendation
const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if recommendation exists
    const existingRecommendation = await prisma.Recommendation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    await prisma.Recommendation.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Recommendation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete recommendation',
      error: error.message
    });
  }
};

// Archive/Unarchive recommendation
const archiveRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { archive } = req.body; // true to archive, false to unarchive

    // Check if recommendation exists
    const existingRecommendation = await prisma.Recommendation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    const recommendation = await prisma.Recommendation.update({
      where: { id: parseInt(id) },
      data: { status: archive ? 'archived' : 'active' }
    });

    res.json({
      success: true,
      message: `Recommendation ${archive ? 'archived' : 'unarchived'} successfully`,
      data: recommendation
    });
  } catch (error) {
    console.error('Error archiving recommendation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive recommendation',
      error: error.message
    });
  }
};

module.exports = {
  getAllRecommendations,
  getRecommendationById,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  archiveRecommendation
};
