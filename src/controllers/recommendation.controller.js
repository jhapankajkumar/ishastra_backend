const { PrismaClient } = require('@prisma/client');
const yahoo = require('../yahoo');
const prisma = new PrismaClient();

// Helper function to fetch current price
const fetchCurrentPrice = async (ticker) => {
  try {
    console.log(`Fetching price for ${ticker}...`);
    const price = await yahoo.getCurrentPrice(ticker);
    console.log(`Price for ${ticker}: ${price}`);
    return price;
  } catch (error) {
    console.warn(`Failed to fetch price for ${ticker}:`, error.message);
    return null;
  }
};

// Helper function to calculate price difference and percentage
const calculatePriceDifference = (buyBelow, currentPrice) => {
  if (!buyBelow || !currentPrice) {
    return { difference: null, difference_percentage: null };
  }

  // Calculate difference (positive if current price is below buy below price)
  const difference = buyBelow - currentPrice;
  const differencePercentage = ((difference / buyBelow) * 100);

  return {
    difference: parseFloat(difference.toFixed(2)),
    difference_percentage: parseFloat(differencePercentage.toFixed(2))
  };
};

// Get all recommendations
const getAllRecommendations = async (req, res) => {
  try {
    const { status, sector } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (sector) where.sector = sector;

    const recommendations = await prisma.recommendations.findMany({
      where,
      orderBy: { created_date: 'desc' }
    });

    // Fetch current prices for all recommendations
    const recommendationsWithPrices = await Promise.all(
      recommendations.map(async (rec) => {
        const currentPrice = await fetchCurrentPrice(rec.ticker);
        
        // Update the current price in database if we got a valid price
        if (currentPrice !== null) {
          await prisma.recommendations.update({
            where: { id: rec.id },
            data: { current_price: currentPrice }
          });
        }

        const finalCurrentPrice = currentPrice !== null ? currentPrice : rec.current_price;
        const priceDiff = calculatePriceDifference(rec.buy_below, finalCurrentPrice);

        return {
          ...rec,
          current_price: finalCurrentPrice,
          added_on: rec.created_date, // Alias for better readability
          difference: priceDiff.difference,
          difference_percentage: priceDiff.difference_percentage
        };
      })
    );

    res.json({
      success: true,
      data: recommendationsWithPrices
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
    
    const recommendation = await prisma.recommendations.findUnique({
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
      await prisma.recommendations.update({
        where: { id: parseInt(id) },
        data: { current_price: currentPrice }
      });
    }

    const finalCurrentPrice = currentPrice !== null ? currentPrice : recommendation.current_price;
    const priceDiff = calculatePriceDifference(recommendation.buy_below, finalCurrentPrice);

    const updatedRecommendation = {
      ...recommendation,
      current_price: finalCurrentPrice,
      added_on: recommendation.created_date, // Alias for better readability
      difference: priceDiff.difference,
      difference_percentage: priceDiff.difference_percentage
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
      buy_below,
      current_price,
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
    let finalCurrentPrice = current_price ? parseFloat(current_price) : null;
    if (!finalCurrentPrice) {
      finalCurrentPrice = await fetchCurrentPrice(ticker.toUpperCase());
    }

    const recommendationData = {
      ticker: ticker.toUpperCase(),
      buy_below: buy_below ? parseFloat(buy_below) : null,
      current_price: finalCurrentPrice,
      sector: sector || null,
      source: source || null,
      status: 'active'
    };

    const recommendation = await prisma.recommendations.create({
      data: recommendationData
    });

    const responseData = {
      ...recommendation,
      added_on: recommendation.created_date // Alias for better readability
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
      buy_below,
      current_price,
      sector,
      source,
      status
    } = req.body;

    // Check if recommendation exists
    const existingRecommendation = await prisma.recommendations.findUnique({
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
    if (buy_below !== undefined) updateData.buy_below = buy_below ? parseFloat(buy_below) : null;
    if (current_price !== undefined) updateData.current_price = current_price ? parseFloat(current_price) : null;
    if (sector !== undefined) updateData.sector = sector;
    if (source !== undefined) updateData.source = source;
    if (status !== undefined) updateData.status = status;

    const recommendation = await prisma.recommendations.update({
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
    const existingRecommendation = await prisma.recommendations.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    await prisma.recommendations.delete({
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
    const existingRecommendation = await prisma.recommendations.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRecommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    const recommendation = await prisma.recommendations.update({
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
