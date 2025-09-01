/**
 * Intelligent Narrative
 * Market story analysis using AI to understand news context
 * 
 * Analyzes previous day's news to provide context for today's trading decisions
 * Integrates with your existing daily candle analysis approach
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const OpenAI = require('openai');
const FreeNewsSentimentService = require('../services/freeNewsSentimentService');
const { json } = require('express');

class IntelligentNarrative {
    constructor() {
        // Handle missing API key gracefully
        const apiKey = process.env.OPENAI_API_KEY;
        this.hasApiKey = Boolean(apiKey && apiKey.trim() !== '');

        if (this.hasApiKey) {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
        } else {
            console.warn('⚠️  OpenAI API key not configured - AI narrative will use fallback mode');
            this.openai = null;
        }

        // Initialize your existing news service
        this.newsService = new FreeNewsSentimentService({
            enableGoogleNews: true,
            enableYahooFinance: true,
            maxArticlesPerSource: 10
        });

        this.config = {
            model: 'gpt-4',
            maxTokens: 800,
            temperature: 0.2,
            timeout: 20000
        };

        this.cache = new Map();
        this.cacheExpiry = 300000; // 5 minutes

        console.log('📰 Intelligent Narrative initialized with FreeNewsSentimentService');
    }

    /**
     * Analyze market story for a symbol
     * Uses previous day's news to match your daily candle approach
     * Enhanced with sophisticated system context
     */
    async analyzeMarketStory(symbol, analysisResult) {
        try {
            
            // If no news data provided, try to fetch recent news
            let relevantNews = await this.fetchRecentNews(symbol, Date.now());

            // Check cache first (include sophisticated context in cache key)
            const cacheKey = this.generateCacheKey(symbol, relevantNews, analysisResult);
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`📰 Using cached narrative for ${symbol}`);
                return cached;
            }

            console.log(`📰 Analyzing market narrative for ${symbol} with ${relevantNews.length} news items`);

            // Prepare news text for AI analysis
            const newsText = this.prepareNewsText(relevantNews);

            // Get AI analysis with sophisticated context
            const aiAnalysis = await this.getAIAnalysis(symbol, newsText, analysisResult);

            // Parse and structure the response
            const narrative = this.parseAIResponse(aiAnalysis, symbol, analysisResult);

            // Cache the result
            this.setCache(cacheKey, narrative);

            return narrative;

        } catch (error) {
            console.error('❌ Narrative analysis failed:', error);
            return this.createErrorNarrative(symbol, error.message);
        }
    }

    /**
     * Fetch recent news for a symbol
     * Uses your existing FreeNewsSentimentService
     */
    async fetchRecentNews(symbol) {
        try {
            console.log(`📰 Fetching real news for ${symbol} using FreeNewsSentimentService`);

            // Use your existing news service to get real news
            const realNewsData = await this.newsService.fetchRealNews(symbol, {
                maxArticles: 10
            });

            if (realNewsData && realNewsData.length > 0) {
                console.log(`📰 Found ${realNewsData.length} real news articles for ${symbol}`);
                return this.normalizeNewsFromService(realNewsData);
            }

        } catch (error) {
            console.error('⚠️ News fetching failed:', error);
            // Return fallback news that won't break the system
            return null
        }
    }

    /**
     * Normalize news format from FreeNewsSentimentService
     */
    normalizeNewsFromService(articles) {
        return articles.map(article => ({
            title: article.title || 'Market Update',
            summary: article.description || article.title,
            content: article.content || article.description || '',
            publishedAt: article.publishedAt || new Date().toISOString(),
            source: article.source || 'News Service',
            sentiment: 'NEUTRAL', // Will be analyzed by AI
            relevance: 0.8,
            category: 'NEWS'
        }));
    }


    /**
     * Prepare news text for AI analysis with REAL content extraction
     */
    prepareNewsText(newsItems) {
        if (!newsItems || newsItems.length === 0) {
            return 'No relevant news items available for analysis.';
        }

        let newsText = '';
        const processedNews = [];

        // Filter and process only meaningful news
        newsItems.slice(0, 3).forEach((item, index) => { // Reduce to 3 most recent for quality
            // Skip if title is just a URL or website name
            if (!item.title || item.title.length < 10 || item.title.includes('...')) {
                return;
            }

            // Extract actual content, not just truncated snippets
            let content = '';
            if (item.summary && item.summary.length > 50) {
                content = item.summary;
            } else if (item.content && item.content.length > 100) {
                // Get meaningful content, not just "..."
                content = item.content.length > 400 ? 
                    item.content.substring(0, 400) + '...' : 
                    item.content;
            } else if (item.description && item.description.length > 50) {
                content = item.description;
            }

            // Only include news with actual content
            if (content && content.length > 50) {
                newsText += `News ${index + 1}:\n`;
                newsText += `Title: ${item.title}\n`;
                newsText += `Content: ${content}\n`;
                newsText += `Source: ${item.source || 'Unknown'}\n`;
                newsText += `Date: ${item.publishedAt || item.date || 'Unknown'}\n\n`;
                processedNews.push(item);
            }
        });

        // If no meaningful news found, return minimal text
        if (processedNews.length === 0) {
            return 'No meaningful news content available - titles only or insufficient content for analysis.';
        }

        return newsText;
    }

    /**
     * Get AI analysis of news sentiment and market impact
     * Enhanced with sophisticated system context
     */
    async getAIAnalysis(symbol, newsText, analysisResult = null) {
        // If no OpenAI API key, return fallback analysis
        if (!this.hasApiKey || !this.openai) {
            console.warn(`⚠️  No OpenAI API key - using fallback analysis for ${symbol}`);
            return null
        }

        const prompt = this.buildAnalysisPrompt(symbol, newsText, analysisResult);
        console.log('--- Prompt Start ---');
        console.log(prompt);
        console.log('--- Prompt End ---');
        try {
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: `
You are a disciplined and objective financial Copilot operating inside a professional trading system called Ishastra.

Your responsibilities:
- Analyze real-world news in context of technical trading signals
- Extract market-moving narratives with a focus on short-term trading impact
- Compare news direction with Ishastra's rule-based technical outputs
- Output a strictly valid JSON object based on user schema
- NEVER hallucinate numbers, events, or claims not present in the input
- NEVER include commentary or explanations outside the JSON object

You are forbidden from:
- Repeating vague phrases like "Investors are watching closely" or "Could go either way"
- Using ambiguous adjectives like "strong", "mixed", or "significant" without quantified context
- Overusing HOLD as a safe fallback; use it only if rules below permit

⚠️ Penalties apply for:
- Outputting anything other than valid JSON
- Exceeding 150 tokens unless strictly required for accuracy
- Repeating keyFactors or riskFactors
- Using the same reason across multiple fields

You will be graded on:
- Precision
- Alignment to technical context
- Clarity for swing trading
`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            });

           

            if (!response.choices || response.choices.length === 0) {
                throw new Error('No response from OpenAI');
            }

             console.log('--- Response Start ---');
            console.log(response.choices[0].message.content);
            console.log('--- Response End ---');
            return response.choices[0].message.content;

        } catch (error) {
            console.error('❌ OpenAI API call failed:', error);
            console.warn(`⚠️  Falling back to non-AI analysis for ${symbol}`);
            return null
        }
    }

    /**
     * Build analysis prompt for AI with sophisticated system context
     */
    buildAnalysisPrompt(symbol, newsText, analysisResult = null) {
        // Get stock context for enhanced analysis


        let prompt = `Analyze the following news items and generate a structured market impact assessment for stock symbol **${symbol}**.

📢 NEWS ITEMS:
${newsText}`;

        // Add sophisticated system context if available
        if (analysisResult) {
            prompt += `

📊 SOPHISTICATED TECHNICAL CONTEXT:
The Ishastra system has already analyzed this symbol and reported:
- Consensus Decision: ${analysisResult.decision?.action || 'HOLD'}
- System Grade: ${analysisResult.decision?.grade || 'C'}
- System Confidence: ${Math.round((analysisResult.decision?.confidence || 50))}%`;

            // Add detailed technical indicators if available
            if (analysisResult.aiSignals) {
               prompt += `

📊 SOPHISTICATED TECHNICAL INDICATORS:
${JSON.stringify(analysisResult.aiSignals, null, 2)}`;
            }
        } else {
            prompt += `

📊 TECHNICAL CONTEXT:
No sophisticated system data available - rely on news sentiment and general market principles.`;
        }

        prompt += `

🧠 TASK INSTRUCTIONS:
- Combine the **narrative** from news with the **technical signal** summary
- Recommend one clear \`action\`: BUY, SELL, HOLD, or AVOID
- Use \`HOLD\` only if both sentiment is NEUTRAL and actionConfidence < 0.6
- Use \`AVOID\` for unclear or conflicting signals
- Be **conservative** with confidence scoring unless evidence is strong
- Clearly call out **contradictions** between news and technicals
- Keep \`mainStory\` short but impactful (1–3 sentences)
- Do NOT repeat the same content in multiple fields

📦 YOUR RESPONSE FORMAT (STRICTLY REQUIRED):

{
  "sentiment": "POSITIVE | NEGATIVE | NEUTRAL",
  "confidence": 0.0 - 1.0,
  "action": "BUY | SELL | HOLD | AVOID",
  "actionConfidence": 0.0 - 1.0,
  "mainStory": "Short summary combining news impact with technical bias",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "riskFactors": ["risk1", "risk2"],
  "tradingImplications": "Impact on short-term trading (1–5 days)",
  "timeHorizon": "SHORT | MEDIUM | LONG",
  "technicalAlignment": "SUPPORTS | CONTRADICTS | NEUTRAL",
  "confidenceBreakdown": {
    "newsSignal": 0.0-1.0,
    "technicalSignal": 0.0-1.0,
    "contradictionPenalty": 0.0-1.0
  }
}

📐 OUTPUT QUALITY RULES:
- BUY → Only if actionConfidence ≥ 0.7 AND technicalAlignment = SUPPORTS
- SELL → Only if BOTH news and technicals are NEGATIVE
- HOLD → Only if confidence < 0.6 OR mixed sentiment/technical alignment
- AVOID → Use if major contradiction or uncertainty
- Use NEUTRAL sentiment if news has no directional signal

🔒 STRICT INSTRUCTIONS:
- Output only valid JSON. No text, markdown, commentary, or warnings.
- Do not stringify numbers or booleans.
- Do not include extra fields beyond the schema.

Respond ONLY with valid JSON.`;

        return prompt;
    }

    /**
     * Parse AI response into structured narrative - SIMPLIFIED VERSION
     */
    parseAIResponse(aiResponse, symbol) {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(aiResponse);

            return {
                symbol,
                sentiment: this.validateSentiment(parsed.sentiment),
                confidence: this.validateConfidence(parsed.confidence),
                action: this.validateAction(parsed.action),
                actionConfidence: parsed.confidence || 0.5, // Use same confidence for simplicity
                mainStory: parsed.mainStory || 'Analysis completed based on available data',
                keyFactors: Array.isArray(parsed.keyFactors) ? parsed.keyFactors.slice(0, 3) : [],
                riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors.slice(0, 2) : [],
                tradingImplications: parsed.mainStory || 'See main story for implications',
                timeHorizon: 'SHORT', // Default to short-term for trading
                technicalAlignment: this.determineTechnicalAlignment(parsed.action),
                signalAgreementScore: parsed.confidence || 0.5,
                confidenceBreakdown: {
                    newsSignal: parsed.confidence || 0.5,
                    technicalSignal: 0.5, // Default since we simplified this
                    contradictionPenalty: 0.0
                },
                source: 'AI_ANALYSIS',
                timestamp: new Date(),
                raw: aiResponse
            };

        } catch (parseError) {
            console.error('⚠️ Failed to parse AI response as JSON:', parseError);
            console.log('Raw AI Response:', aiResponse);

            // Create fallback response
            return {
                symbol,
                sentiment: 'NEUTRAL',
                confidence: 0.3,
                action: 'HOLD',
                actionConfidence: 0.3,
                mainStory: 'AI analysis failed - using conservative fallback',
                keyFactors: ['Analysis parsing failed'],
                riskFactors: ['Uncertain AI output'],
                tradingImplications: 'Hold position until clear signals emerge',
                timeHorizon: 'SHORT',
                technicalAlignment: 'NEUTRAL',
                signalAgreementScore: 0.3,
                confidenceBreakdown: {
                    newsSignal: 0.3,
                    technicalSignal: 0.3,
                    contradictionPenalty: 0.4
                },
                source: 'FALLBACK_ANALYSIS',
                timestamp: new Date(),
                error: 'JSON_PARSE_FAILED',
                raw: aiResponse
            };
        }
    }

    /**
     * Simple helper to determine technical alignment based on action
     */
    determineTechnicalAlignment(action) {
        const buyActions = ['BUY', 'STRONG_BUY'];
        const sellActions = ['SELL', 'STRONG_SELL'];
        
        if (buyActions.includes(action)) return 'SUPPORTS';
        if (sellActions.includes(action)) return 'CONTRADICTS';
        return 'NEUTRAL';
    }

    /**
     * Validate action value
     */
    validateAction(action) {
        const validActions = ['BUY', 'SELL', 'HOLD', 'AVOID'];
        return validActions.includes(action) ? action : 'HOLD';
    }

    /**
     * Validate technical alignment
     */
    validateTechnicalAlignment(alignment) {
        const validAlignments = ['SUPPORTS', 'CONTRADICTS', 'NEUTRAL'];
        return validAlignments.includes(alignment) ? alignment : 'NEUTRAL';
    }

    /**
     * Validate confidence breakdown object
     */
    validateConfidenceBreakdown(breakdown) {
        if (!breakdown || typeof breakdown !== 'object') {
            return {
                newsSignal: 0.5,
                technicalSignal: 0.5,
                contradictionPenalty: 0.0
            };
        }

        return {
            newsSignal: this.validateConfidence(breakdown.newsSignal || 0.5),
            technicalSignal: this.validateConfidence(breakdown.technicalSignal || 0.5),
            contradictionPenalty: this.validateConfidence(breakdown.contradictionPenalty || 0.0)
        };
    }

    /**
     * Build technical indicators section for AI prompt
     */
    buildTechnicalIndicatorsSection(technicalData) {
        let section = `

📊 TECHNICAL SIGNALS:`;

        // RSI Analysis
        if (technicalData.rsi !== undefined) {
            const rsiValue = technicalData.rsi;
            let rsiStatus = 'NEUTRAL';
            if (rsiValue >= 70) rsiStatus = 'OVERBOUGHT';
            else if (rsiValue <= 30) rsiStatus = 'OVERSOLD';

            section += `
- RSI: ${rsiValue.toFixed(2)} (${rsiStatus})`;
        }

        // MACD Analysis
        if (technicalData.macd) {
            const macdData = technicalData.macd;
            const trend = macdData.histogram > 0 ? 'BULLISH' : 'BEARISH';
            section += `
- MACD: ${trend} trend (Signal: ${macdData.signal?.toFixed(2) || 'N/A'})`;
        }

        // Moving Averages
        if (technicalData.movingAverages) {
            const ma = technicalData.movingAverages;
            if (ma.sma20 && ma.sma50) {
                const trend = ma.sma20 > ma.sma50 ? 'BULLISH' : 'BEARISH';
                section += `
- Moving Averages: ${trend} (SMA20: ${ma.sma20.toFixed(2)}, SMA50: ${ma.sma50.toFixed(2)})`;
            }
        }

        // Volume Analysis
        if (technicalData.volume) {
            const volumeData = technicalData.volume;
            const volumeTrend = volumeData.trend || 'NEUTRAL';
            section += `
- Volume: ${volumeTrend} trend`;
            if (volumeData.avgVolume) {
                section += ` (Avg: ${this.formatVolume(volumeData.avgVolume)})`;
            }
        }

        // Support/Resistance Levels
        if (technicalData.supportResistance) {
            const sr = technicalData.supportResistance;
            if (sr.support) section += `
- Support Level: $${sr.support.toFixed(2)}`;
            if (sr.resistance) section += `
- Resistance Level: $${sr.resistance.toFixed(2)}`;
        }

        // Price Action
        if (technicalData.currentPrice) {
            section += `
- Current Price: $${technicalData.currentPrice.toFixed(2)}`;
        }

        return section;
    }

    /**
     * Format volume for display
     */
    formatVolume(volume) {
        if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(2)}B`;
        if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
        if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
        return volume.toString();
    }


    /**
     * Validate sentiment value
     */
    validateSentiment(sentiment) {
        const validSentiments = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'];
        return validSentiments.includes(sentiment) ? sentiment : 'NEUTRAL';
    }

    /**
     * Validate confidence score
     */
    validateConfidence(confidence) {
        const conf = parseFloat(confidence);
        return isNaN(conf) ? 0.5 : Math.max(0, Math.min(1, conf));
    }

    /**
     * Determine if AI analysis is needed based on system decision
     */
    shouldUseAI(action, grade, confidence) {
        // High-impact decisions always get AI analysis
        if (action === 'BUY' || action === 'SELL') return true;

        // High-quality WATCH signals
        if (action === 'WATCH' && ['A+', 'A', 'A-'].includes(grade)) return true;

        // High confidence signals regardless of action
        if (confidence >= 0.8) return true;

        // Skip AI for HOLD, AVOID, low-grade signals
        return false;
    }

    /**
     * Extract sentiment from text if JSON parsing fails
     */
    extractSentimentFromText(text) {
        const textLower = text.toLowerCase();

        const positiveWords = ['positive', 'bullish', 'good', 'strong', 'growth', 'increase'];
        const negativeWords = ['negative', 'bearish', 'bad', 'weak', 'decline', 'decrease'];

        const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
        const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;

        if (positiveCount > negativeCount) return 'POSITIVE';
        if (negativeCount > positiveCount) return 'NEGATIVE';
        return 'NEUTRAL';
    }


    /**
     * Create error narrative when analysis fails
     */
    createErrorNarrative(symbol, error) {
        return {
            symbol,
            sentiment: 'NEUTRAL',
            confidence: 0.3,
            action: 'HOLD',
            actionConfidence: 0.3,
            mainStory: `Market narrative analysis temporarily unavailable for ${symbol}`,
            keyFactors: ['Technical analysis active'],
            riskFactors: ['AI analysis error'],
            tradingImplications: 'Rely on technical analysis only',
            timeHorizon: 'SHORT',
            technicalAlignment: 'NEUTRAL',
            source: 'ERROR_FALLBACK',
            timestamp: new Date(),
            error: error
        };
    }

    /**
     * Cache management with sophisticated context
     */
    generateCacheKey(symbol, newsItems, sophisticatedContext = null) {
        const newsHash = newsItems.map(item => item.title || '').join('').substring(0, 50);
        const contextHash = sophisticatedContext ?
            `_${sophisticatedContext.consensus?.finalDecision || ''}_${sophisticatedContext.consensus?.grade || ''}` : '';
        return `narrative_${symbol}_${newsHash}${contextHash}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expiry) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + this.cacheExpiry
        });

        // Simple cache cleanup
        if (this.cache.size > 100) {
            const now = Date.now();
            for (const [k, v] of this.cache.entries()) {
                if (now > v.expiry) {
                    this.cache.delete(k);
                }
            }
        }
    }
}

module.exports = IntelligentNarrative;
