const express = require('express');
const router = express.Router();
const yahoo = require('../yahoo');

// Search for ticker symbols (optimized for investment page)
router.get('/search-ticker', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required (minimum 1 character)'
      });
    }

    const results = await yahoo.searchSymbol(q);
    
    // Filter and format results for investment page
    const formattedResults = results
      .filter(result => result.typeDisp && result.symbol) // Only results with valid data
      .slice(0, 10) // Limit to top 10 results
      .map(result => ({
        symbol: result.symbol,
        name: result.shortname || result.longname || result.symbol,
        type: result.typeDisp,
        exchange: result.exchDisp || result.exchange,
        sector: result.sector || null,
        industry: result.industry || null,
        marketCap: result.marketCap || null,
        regularMarketPrice: result.regularMarketPrice || null
      }));

    res.json({
      success: true,
      data: formattedResults,
      query: q,
      count: formattedResults.length
    });
  } catch (error) {
    console.error('Error searching ticker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search ticker symbols',
      error: error.message
    });
  }
});

// Get detailed ticker info for investment page
router.get('/ticker-info/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Ticker symbol is required'
      });
    }

    // Get current price and basic info
    const [searchResults, currentPrice] = await Promise.all([
      yahoo.searchSymbol(symbol),
      yahoo.getCurrentPrice(symbol).catch(() => null)
    ]);

    // Find the exact match from search results
    const tickerInfo = searchResults.find(result => 
      result.symbol.toUpperCase() === symbol.toUpperCase()
    );

    if (!tickerInfo) {
      return res.status(404).json({
        success: false,
        message: 'Ticker symbol not found'
      });
    }

    const formattedInfo = {
      symbol: tickerInfo.symbol,
      name: tickerInfo.shortname || tickerInfo.longname || tickerInfo.symbol,
      type: tickerInfo.typeDisp,
      exchange: tickerInfo.exchDisp || tickerInfo.exchange,
      sector: tickerInfo.sector || null,
      industry: tickerInfo.industry || null,
      marketCap: tickerInfo.marketCap || null,
      currentPrice: currentPrice,
      currency: tickerInfo.currency || 'USD'
    };

    res.json({
      success: true,
      data: formattedInfo
    });
  } catch (error) {
    console.error('Error fetching ticker info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticker information',
      error: error.message
    });
  }
});

// Get current price for a ticker
router.get('/current-price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Ticker symbol is required'
      });
    }

    const price = await yahoo.getCurrentPrice(symbol);
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        price: price,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching current price:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current price',
      error: error.message
    });
  }
});

module.exports = router;
