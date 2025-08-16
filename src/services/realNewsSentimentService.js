/**
 * Real News Sentiment Analysis Service
 * Implements Google News RSS and Yahoo Finance integration (FREE)
 */

const axios = require('axios');
const xml2js = require('xml2js');

class RealNewsSentimentService {
  constructor(config = {}) {
    // Free APIs configuration
    this.enableGoogleNews = config.enableGoogleNews !== false;
    this.enableYahooFinance = config.enableYahooFinance !== false;
    this.maxArticlesPerSource = config.maxArticlesPerSource || 10;
    
    // Rate limiting
    this.lastApiCall = new Map();
    this.minInterval = 1000; // 1 second between calls
    
    // XML parser for RSS feeds
    this.xmlParser = new xml2js.Parser();
    
    //console.log('📰 Real News Sentiment Service initialized (FREE APIs)');
    //console.log(`   Google News RSS: ${this.enableGoogleNews ? 'Enabled' : 'Disabled'}`);
    //console.log(`   Yahoo Finance: ${this.enableYahooFinance ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Fetch real news articles for a stock symbol using FREE APIs
   */
  async fetchRealNews(symbol, options = {}) {
    const cleanSymbol = symbol.replace('.NS', ''); // Remove NSE suffix for search
    const companyName = this.getCompanyName(cleanSymbol);
    
    //console.log(`📰 Fetching real news for ${symbol} (${companyName})`);
    
    const allArticles = [];
    
    try {
      // Method 1: Google News RSS (FREE)
      if (this.enableGoogleNews) {
        //console.log('   📡 Fetching from Google News RSS...');
        const googleArticles = await this.fetchFromGoogleNewsRSS(companyName, cleanSymbol, options);
        allArticles.push(...googleArticles);
        //console.log(`   ✅ Google News: ${googleArticles.length} articles`);
      }
      
      // Method 2: Yahoo Finance News (FREE)
      if (this.enableYahooFinance) {
        //console.log('   📡 Fetching from Yahoo Finance...');
        const yahooArticles = await this.fetchFromYahooFinance(cleanSymbol, options);
        allArticles.push(...yahooArticles);
        //console.log(`   ✅ Yahoo Finance: ${yahooArticles.length} articles`);
      }
      
      // Remove duplicates and limit results
      const uniqueArticles = this.removeDuplicateArticles(allArticles);
      const limitedArticles = uniqueArticles.slice(0, options.maxArticles || 20);
      
      //console.log(`   📊 Total unique articles: ${limitedArticles.length}`);
      
      return limitedArticles;
      
    } catch (error) {
      console.error(`❌ Error fetching real news for ${symbol}:`, error.message);
      return this.getFallbackNews(symbol);
    }
  }

  /**
   * Fetch from Google News RSS (FREE)
   */
  async fetchFromGoogleNewsRSS(companyName, symbol, options) {
    // Respect rate limiting
    await this.respectRateLimit('google-news');
    
    const searchQueries = [
      `"${companyName}" stock`,
      `"${companyName}" financial`,
      `"${companyName}" earnings`,
      `${symbol} stock news`
    ];
    
    const allArticles = [];
    
    for (const query of searchQueries) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-IN&gl=IN&ceid=IN:en`;
        
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });
        
        const result = await this.xmlParser.parseStringPromise(response.data);
        
        if (result.rss && result.rss.channel && result.rss.channel[0].item) {
          const items = result.rss.channel[0].item.slice(0, this.maxArticlesPerSource);
          
          for (const item of items) {
            allArticles.push({
              title: this.cleanText(item.title[0]),
              description: this.cleanText(item.description ? item.description[0] : ''),
              link: item.link[0],
              source: 'Google News',
              publishedAt: item.pubDate[0],
              content: this.extractContentFromDescription(item.description ? item.description[0] : ''),
              guid: item.guid ? item.guid[0] : item.link[0]
            });
          }
        }
        
        // Add small delay between queries
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        // console.warn(`   ⚠️  Failed to fetch Google News for query "${query}":`, error.message);
      }
    }
    
    return allArticles;
  }

  /**
   * Fetch from Yahoo Finance News (FREE)
   */
  async fetchFromYahooFinanceNews(symbol, options) {
    // Respect rate limiting
    await this.respectRateLimit('yahoo-finance');
    
    try {
      // Yahoo Finance RSS feed for specific symbol
      const rssUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${symbol}&region=IN&lang=en-IN`;
      
      const response = await axios.get(rssUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const result = await this.xmlParser.parseStringPromise(response.data);
      
      if (result.rss && result.rss.channel && result.rss.channel[0].item) {
        const items = result.rss.channel[0].item.slice(0, this.maxArticlesPerSource);
        
        return items.map(item => ({
          title: this.cleanText(item.title[0]),
          description: this.cleanText(item.description ? item.description[0] : ''),
          link: item.link[0],
          source: 'Yahoo Finance',
          publishedAt: item.pubDate[0],
          content: this.extractContentFromDescription(item.description ? item.description[0] : ''),
          guid: item.guid ? item.guid[0] : item.link[0]
        }));
      }
      
    } catch (error) {
      // console.warn(`   ⚠️  Failed to fetch Yahoo Finance news for ${symbol}:`, error.message);
      
      // Fallback: Try general Yahoo Finance search
      return await this.fetchYahooFinanceSearchFallback(symbol, options);
    }
    
    return [];
  }

  /**
   * Yahoo Finance search fallback
   */
  async fetchYahooFinanceSearchFallback(symbol, options) {
    try {
      const companyName = this.getCompanyName(symbol);
      const searchUrl = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=^NSEI&region=IN&lang=en-IN`;
      
      const response = await axios.get(searchUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const result = await this.xmlParser.parseStringPromise(response.data);
      
      if (result.rss && result.rss.channel && result.rss.channel[0].item) {
        // Filter items that mention our company/symbol
        const relevantItems = result.rss.channel[0].item.filter(item => {
          const title = (item.title[0] || '').toLowerCase();
          const description = (item.description ? item.description[0] : '').toLowerCase();
          const content = `${title} ${description}`;
          
          return content.includes(symbol.toLowerCase()) || 
                 content.includes(companyName.toLowerCase());
        });
        
        return relevantItems.slice(0, this.maxArticlesPerSource).map(item => ({
          title: this.cleanText(item.title[0]),
          description: this.cleanText(item.description ? item.description[0] : ''),
          link: item.link[0],
          source: 'Yahoo Finance (Search)',
          publishedAt: item.pubDate[0],
          content: this.extractContentFromDescription(item.description ? item.description[0] : ''),
          guid: item.guid ? item.guid[0] : item.link[0]
        }));
      }
      
    } catch (error) {
      // console.warn(`   ⚠️  Yahoo Finance fallback failed for ${symbol}:`, error.message);
    }
    
    return [];
  }

  /**
   * Helper method to call Yahoo Finance (fixing method name)
   */
  async fetchFromYahooFinance(symbol, options) {
    return await this.fetchFromYahooFinanceNews(symbol, options);
  }

  /**
   * Respect rate limiting for different APIs
   */
  async respectRateLimit(apiName) {
    const lastCall = this.lastApiCall.get(apiName) || 0;
    const timeSinceLastCall = Date.now() - lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastApiCall.set(apiName, Date.now());
  }

  /**
   * Remove duplicate articles based on title similarity
   */
  removeDuplicateArticles(articles) {
    const unique = [];
    const seenTitles = new Set();
    
    for (const article of articles) {
      const normalizedTitle = this.normalizeTitle(article.title);
      
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        unique.push(article);
      }
    }
    
    return unique;
  }

  /**
   * Normalize title for duplicate detection
   */
  normalizeTitle(title) {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Clean HTML and unwanted characters from text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, '') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract content from RSS description
   */
  extractContentFromDescription(description) {
    if (!description) return '';
    
    // Remove HTML and extract meaningful content
    const cleaned = this.cleanText(description);
    
    // Limit to first 500 characters for sentiment analysis
    return cleaned.length > 500 ? cleaned.substring(0, 500) + '...' : cleaned;
  }

  /**
   * Analyze sentiment of real news articles
   */
  async analyzeRealNewsArticles(articles, symbol) {
    if (!articles || articles.length === 0) {
      return { 
        score: 0, 
        articles: 0, 
        keywords: [], 
        sentiment: 'NEUTRAL',
        sources: [],
        confidence: 0
      };
    }

    //console.log(`📊 Analyzing sentiment for ${articles.length} articles about ${symbol}`);

    let totalScore = 0;
    const allKeywords = [];
    const sourceBreakdown = {};
    
    for (const article of articles) {
      const articleText = `${article.title} ${article.description || ''} ${article.content || ''}`;
      const articleScore = this.analyzeSentimentScore(articleText);
      
      totalScore += articleScore;
      
      // Extract keywords
      const keywords = this.extractKeywords(articleText);
      allKeywords.push(...keywords);
      
      // Track sources
      sourceBreakdown[article.source] = (sourceBreakdown[article.source] || 0) + 1;
      
      //console.log(`   📄 "${article.title.substring(0, 60)}..." - Score: ${articleScore.toFixed(3)} (${article.source})`);
    }

    const averageScore = totalScore / articles.length;
    const topKeywords = this.getTopKeywords(allKeywords, 5);
    
    // Calculate confidence based on number of articles and score consistency
    const confidence = this.calculateConfidence(articles, totalScore / articles.length);

    const result = {
      score: averageScore,
      articles: articles.length,
      keywords: topKeywords,
      sentiment: this.scoresToSentiment(averageScore),
      sources: Object.keys(sourceBreakdown),
      sourceBreakdown,
      latestArticle: articles[0]?.publishedAt,
      confidence,
      averageWordsPerArticle: Math.round(allKeywords.length / articles.length)
    };

    //console.log(`   📈 Final Sentiment: ${result.sentiment} (${result.score.toFixed(3)}) - Confidence: ${(result.confidence * 100).toFixed(1)}%`);

    return result;
  }

  /**
   * Calculate confidence score based on article count and sentiment consistency
   */
  calculateConfidence(articles, averageScore) {
    if (articles.length === 0) return 0;
    
    // Base confidence from article count (more articles = higher confidence)
    let confidence = Math.min(articles.length / 10, 1.0); // Max at 10 articles
    
    // Reduce confidence for neutral scores
    const absScore = Math.abs(averageScore);
    if (absScore < 0.1) {
      confidence *= 0.3; // Low confidence for very neutral sentiment
    } else if (absScore < 0.3) {
      confidence *= 0.7; // Medium confidence for weak sentiment
    }
    
    return Math.max(0.1, Math.min(1.0, confidence)); // Keep between 0.1 and 1.0
  }

  /**
   * Analyze sentiment score of text using lexicon-based approach
   */
  analyzeSentimentScore(text) {
    if (!text) return 0;
    
    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    let wordCount = 0;

    // Positive words with weights
    const positiveWords = {
      'growth': 2, 'profit': 2, 'revenue': 1.5, 'strong': 1.5,
      'bullish': 2, 'gain': 1.5, 'rise': 1.5, 'increase': 1.5,
      'positive': 1, 'good': 1, 'better': 1, 'improved': 1.5,
      'success': 2, 'achievement': 1.5, 'breakthrough': 2,
      'expansion': 1.5, 'opportunity': 1, 'optimistic': 1.5
    };

    // Negative words with weights
    const negativeWords = {
      'loss': -2, 'decline': -1.5, 'fall': -1.5, 'drop': -1.5,
      'bearish': -2, 'concern': -1, 'worry': -1, 'fear': -1.5,
      'negative': -1, 'bad': -1, 'poor': -1.5, 'weak': -1.5,
      'crisis': -2, 'problem': -1, 'issue': -1, 'challenge': -1,
      'risk': -1, 'uncertainty': -1, 'volatility': -1
    };

    for (const word of words) {
      if (positiveWords[word]) {
        score += positiveWords[word];
        wordCount++;
      } else if (negativeWords[word]) {
        score += negativeWords[word];
        wordCount++;
      }
    }

    // Normalize score
    return wordCount > 0 ? score / wordCount : 0;
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const financialKeywords = [
      'earnings', 'revenue', 'profit', 'growth', 'dividend', 'merger',
      'acquisition', 'partnership', 'expansion', 'investment', 'guidance',
      'outlook', 'forecast', 'results', 'performance', 'strategy'
    ];

    const words = text.toLowerCase().split(/\W+/);
    return words.filter(word => 
      financialKeywords.includes(word) || 
      (word.length > 4 && /^[a-z]+$/.test(word))
    );
  }

  /**
   * Get top keywords by frequency
   */
  getTopKeywords(keywords, limit = 5) {
    const frequency = {};
    keywords.forEach(keyword => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([keyword]) => keyword);
  }

  /**
   * Convert score to sentiment label
   */
  scoresToSentiment(score) {
    if (score > 0.5) return 'VERY_POSITIVE';
    if (score > 0.2) return 'POSITIVE';
    if (score > -0.2) return 'NEUTRAL';
    if (score > -0.5) return 'NEGATIVE';
    return 'VERY_NEGATIVE';
  }

  /**
   * Get company name from symbol
   */
  getCompanyName(symbol) {
    const companyMap = {
      'RELIANCE': 'Reliance Industries',
      'TCS': 'Tata Consultancy Services',
      'INFY': 'Infosys',
      'HDFCBANK': 'HDFC Bank',
      'ITC': 'ITC Limited',
      'WIPRO': 'Wipro',
      'MARUTI': 'Maruti Suzuki'
    };
    
    return companyMap[symbol] || symbol;
  }

  /**
   * Fallback news when APIs fail
   */
  getFallbackNews(symbol) {
    return [{
      title: `${symbol} Market Update`,
      description: 'Market sentiment analysis in progress...',
      source: 'Fallback',
      publishedAt: new Date().toISOString()
    }];
  }

  /**
   * Get simulated news based on symbol (current approach)
   */
  getSimulatedNewsBasedOnSymbol(symbol) {
    // This is what we're currently doing - simulated based on performance
    return [];
  }
}

module.exports = RealNewsSentimentService;
