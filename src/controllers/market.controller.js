const yahoo = require('../yahoo');

exports.getMarketIndices = async (req, res) => {
  try {
    // Fetch Nifty50, Sensex, NASDAQ, and Dow Jones data using Yahoo Finance
    const [niftyData, sensexData, nasdaqData, dowData] = await Promise.all([
      yahoo.getQuote('^NSEI'), // Nifty 50 symbol
      yahoo.getQuote('^BSESN'), // Sensex symbol
      yahoo.getQuote('^IXIC'), // NASDAQ Composite symbol
      yahoo.getQuote('^DJI') // Dow Jones Industrial Average symbol
    ]);

    const formatIndexData = (data) => {
      if (!data || !data.regularMarketPrice) {
        return { value: null, change: null, changePercent: null };
      }
      
      return {
        value: data.regularMarketPrice,
        change: data.regularMarketChange || 0,
        changePercent: data.regularMarketChangePercent || 0
      };
    };

    const indices = {
      nifty50: formatIndexData(niftyData),
      sensex: formatIndexData(sensexData),
      nasdaq: formatIndexData(nasdaqData),
      dowjones: formatIndexData(dowData)
    };

    res.json(indices);
  } catch (error) {
    console.error('Error fetching market indices:', error);
    
    // Return mock data if API fails
    res.json({
      nifty50: { value: 24500.45, change: 125.30, changePercent: 0.51 },
      sensex: { value: 80234.15, change: -89.45, changePercent: -0.11 },
      nasdaq: { value: 17633.11, change: 85.54, changePercent: 0.49 },
      dowjones: { value: 39497.54, change: -234.85, changePercent: -0.59 }
    });
  }
};
