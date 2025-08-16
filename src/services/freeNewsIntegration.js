/**
 * Free News Integration Example
 * Using free APIs and RSS feeds for real news sentiment
 */

const axios = require('axios');

class FreeNewsIntegration {
  constructor() {
    // Free APIs that we can use
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_KEY; // Free tier: 5 calls/minute
    this.finnhubKey = process.env.FINNHUB_KEY; // Free tier: 60 calls/minute
    
    //console.log('📰 Free News Integration initialized');
  }

  /**
   * Fetch news from Alpha Vantage (Free tier available)
   */
  async fetchAlphaVantageNews(symbol) {
    if (!this.alphaVantageKey) {
      //console.log('⚠️  Alpha Vantage API key not configured');
      return null;
    }

    try {
      const cleanSymbol = symbol.replace('.NS', '');
      const url = `https://www.alphavantage.co/query`;
      const params = {
        function: 'NEWS_SENTIMENT',
        tickers: cleanSymbol,
        apikey: this.alphaVantageKey,
        limit: 20
      };

      const response = await axios.get(url, { params });
      
      if (response.data.feed) {
        return response.data.feed.map(item => ({
          title: item.title,
          summary: item.summary,
          url: item.url,
          source: item.source,
          publishedAt: item.time_published,
          sentiment: {
            score: parseFloat(item.overall_sentiment_score),
            label: item.overall_sentiment_label
          }
        }));
      }
    } catch (error) {
      console.error('Alpha Vantage API error:', error.message);
    }
    
    return null;
  }

  /**
   * Fetch news from Finnhub (Free tier available)
   */
  async fetchFinnhubNews(symbol) {
    if (!this.finnhubKey) {
      //console.log('⚠️  Finnhub API key not configured');
      return null;
    }

    try {
      const cleanSymbol = symbol.replace('.NS', '');
      const url = `https://finnhub.io/api/v1/company-news`;
      const params = {
        symbol: cleanSymbol,
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        token: this.finnhubKey
      };

      const response = await axios.get(url, { params });
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(item => ({
          title: item.headline,
          summary: item.summary,
          url: item.url,
          source: item.source,
          publishedAt: new Date(item.datetime * 1000).toISOString(),
          image: item.image
        }));
      }
    } catch (error) {
      console.error('Finnhub API error:', error.message);
    }
    
    return null;
  }

  /**
   * Try multiple free sources
   */
  async fetchFromMultipleSources(symbol) {
    //console.log(`🔍 Fetching real news for ${symbol} from multiple sources...`);
    
    const sources = [
      () => this.fetchAlphaVantageNews(symbol),
      () => this.fetchFinnhubNews(symbol)
    ];

    for (const fetchSource of sources) {
      try {
        const news = await fetchSource();
        if (news && news.length > 0) {
          //console.log(`✅ Found ${news.length} real news articles for ${symbol}`);
          return news;
        }
      } catch (error) {
        //console.log(`⚠️  Source failed: ${error.message}`);
        continue;
      }
    }

    //console.log(`📰 No real news found, using simulated data for ${symbol}`);
    return null;
  }
}

// To enable real news, add these to your .env file:
/*
ALPHA_VANTAGE_KEY=your_free_key_here
FINNHUB_KEY=your_free_key_here
*/

module.exports = FreeNewsIntegration;
