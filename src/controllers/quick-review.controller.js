const fs = require('fs');
const path = require('path');
const { AISetupReviewService } = require('../services/ai-setup-review.service');
const { buildMetadataAsOf } = require('../evals/buildMetadata');
const { buildSetupReportHtml } = require('../evals/buildSetupReportHtml');

class QuickReviewController {
  constructor() {
    this.aiService = new AISetupReviewService();
  }

  async quickReview(req, res) {
    let imagePath = null;
    try {
      const { symbol, asOfDate } = req.body;
      const imageFile = req.file;

      // Validate inputs
      if (!symbol || !symbol.trim()) {
        return res.status(400).json({ error: 'Stock symbol is required' });
      }
      if (!asOfDate) {
        return res.status(400).json({ error: 'Chart date is required' });
      }
      if (!imageFile) {
        return res.status(400).json({ error: 'Chart image is required' });
      }

      // Read uploaded image as base64
      imagePath = imageFile.path;
      const imageBuffer = fs.readFileSync(imagePath);
      const imageBase64 = `data:${imageFile.mimetype};base64,${imageBuffer.toString('base64')}`;

      // Fetch metadata for the symbol as of the given date
      const { bars, metadata } = await buildMetadataAsOf(symbol, asOfDate);

      if (!bars || bars.length === 0) {
        return res.status(400).json({
          error: `No OHLCV data available for ${symbol} before ${asOfDate}. Please check the symbol and date.`
        });
      }

      // Call AI review service (rounded lastClose, matching the eval runner —
      // raw floats like 204.36000061035156 are a needless prompt difference)
      const review = await this.aiService.reviewSetup({
        symbol,
        timeframe: '1D',
        currentPrice: metadata.ohlcSummary?.lastClose ?? null,
        imageDataUrl: imageBase64,
        chartContext: metadata.chartContext,
        technicalSummary: metadata.technicalSummary,
        ohlcSummary: metadata.ohlcSummary,
        visibleOhlc: metadata.visibleOhlc,
        proposedTrigger: metadata.proposedTrigger,
        setupCharacter: metadata.setupCharacter,
        notes: 'Quick review: User uploaded chart image for manual AI analysis'
      });

      // Generate HTML report
      const generatedAt = new Date();
      const html = buildSetupReportHtml({
        symbol,
        chartImageDataUrl: imageBase64,
        review,
        metadata,
        generatedAt
      });

      res.json({
        success: true,
        html,
        review
      });
    } catch (error) {
      console.error('Quick review error:', error);
      const status = this.getErrorStatus(error);
      res.status(status).json({
        error: error.message || 'Failed to analyze chart'
      });
    } finally {
      // Clean up uploaded file
      if (imagePath && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
  }

  getErrorStatus(error) {
    const message = error?.message || '';
    if (
      message.includes('required') ||
      message.includes('data') ||
      message.includes('not available') ||
      message.includes('symbol')
    ) {
      return 400;
    }
    if (message.includes('OPENAI_API_KEY')) {
      return 503;
    }
    return 500;
  }
}

module.exports = { QuickReviewController };
