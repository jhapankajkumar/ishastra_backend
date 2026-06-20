const { AISetupReviewService } = require('../services/ai-setup-review.service');

class AISetupReviewController {
  constructor() {
    this.service = new AISetupReviewService();
  }

  async reviewSetup(req, res) {
    try {
      const review = await this.service.reviewSetup(req.body);
      res.json({
        success: true,
        review
      });
    } catch (error) {
      const status = this.getErrorStatus(error);
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  async reviewBulk(req, res) {
    try {
      const results = await this.service.reviewBulk(req.body?.items);
      res.json({
        success: true,
        count: results.length,
        results
      });
    } catch (error) {
      const status = this.getErrorStatus(error);
      res.status(status).json({
        success: false,
        error: error.message
      });
    }
  }

  getErrorStatus(error) {
    const message = error?.message || '';
    if (
      message.includes('required') ||
      message.includes('Provide imageUrl') ||
      message.includes('non-empty array') ||
      message.includes('limited')
    ) {
      return 400;
    }
    if (message.includes('OPENAI_API_KEY')) {
      return 503;
    }
    return 500;
  }
}

module.exports = { AISetupReviewController };
