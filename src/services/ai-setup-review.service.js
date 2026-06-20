const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const DEFAULT_MODEL = process.env.OPENAI_SETUP_REVIEW_MODEL || 'gpt-4.1';
const DEFAULT_DETAIL = process.env.OPENAI_CHART_IMAGE_DETAIL || 'high';
const DEFAULT_IMAGE_SAVE_DIR = process.env.OPENAI_CHART_IMAGE_SAVE_DIR || path.join(process.cwd(), 'uploads', 'ai-setup-review');

const LINE_ANNOTATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['visible', 'label', 'startDate', 'startPrice', 'endDate', 'endPrice'],
  properties: {
    visible: { type: 'boolean' },
    label: { type: 'string' },
    startDate: { type: ['string', 'null'] },
    startPrice: { type: ['number', 'null'] },
    endDate: { type: ['string', 'null'] },
    endPrice: { type: ['number', 'null'] }
  }
};

const ZONE_ANNOTATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['visible', 'label', 'startDate', 'endDate', 'lowPrice', 'highPrice'],
  properties: {
    visible: { type: 'boolean' },
    label: { type: 'string' },
    startDate: { type: ['string', 'null'] },
    endDate: { type: ['string', 'null'] },
    lowPrice: { type: ['number', 'null'] },
    highPrice: { type: ['number', 'null'] }
  }
};

const PRICE_LINE_ANNOTATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['visible', 'label', 'price'],
  properties: {
    visible: { type: 'boolean' },
    label: { type: 'string' },
    price: { type: ['number', 'null'] }
  }
};

const SETUP_REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'symbol',
    'verdict',
    'qualityGrade',
    'setupType',
    'setupMaturity',
    'pivotVisible',
    'estimatedPivotPrice',
    'passBlockers',
    'annotations',
    'summary'
  ],
  properties: {
    symbol: { type: 'string' },
    verdict: { type: 'string', enum: ['PASS', 'WATCH', 'REJECT'] },
    qualityGrade: { type: 'string', enum: ['A+', 'A', 'B+', 'B', 'C', 'F'] },
    setupType: {
      type: 'string',
      enum: [
        'FLAG',
        'VCP',
        'BIG_BASE',
        'MULTIPLE',
        'UNDEFINED_CONSOLIDATION',
        'HIGH_LEVEL_PULLBACK',
        'BASE_BUILDING',
        'NONE',
        'UNCLEAR'
      ]
    },
    setupMaturity: {
      type: 'string',
      enum: [
        'READY',
        'EARLY',
        'BUILDING',
        'EXTENDED',
        'BROKEN'
      ]
    },
    pivotVisible: { type: 'boolean' },
    estimatedPivotPrice: { type: ['number', 'null'] },
    passBlockers: {
      type: 'array',
      items: { type: 'string' }
    },
    annotations: {
      type: 'object',
      additionalProperties: false,
      required: [
        'pole',
        'flagUpper',
        'flagLower',
        'supportZone',
        'resistanceZone',
        'entryZone',
        'stopLoss',
        'targetZone'
      ],
      properties: {
        pole: LINE_ANNOTATION_SCHEMA,
        flagUpper: LINE_ANNOTATION_SCHEMA,
        flagLower: LINE_ANNOTATION_SCHEMA,
        supportZone: ZONE_ANNOTATION_SCHEMA,
        resistanceZone: ZONE_ANNOTATION_SCHEMA,
        entryZone: ZONE_ANNOTATION_SCHEMA,
        stopLoss: PRICE_LINE_ANNOTATION_SCHEMA,
        targetZone: ZONE_ANNOTATION_SCHEMA
      }
    },
    summary: { type: 'string' }
  }
};

class AISetupReviewService {
  constructor(options = {}) {
    this.model = options.model || DEFAULT_MODEL;
    this.detail = options.detail || DEFAULT_DETAIL;
    this.client = options.client || null;
  }

  async reviewSetup(payload) {
    this.validatePayload(payload);

    const imageUrl = this.normalizeImageInput(payload);
    await this.saveDebugImage(payload);
    const metadata = this.buildMetadata(payload);
    const client = this.getClient();

    const response = await client.responses.create({
      model: this.model,
      temperature: 0,
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text: this.systemPrompt()
            }
          ]
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: this.userPrompt(metadata)
            },
            {
              type: 'input_image',
              image_url: imageUrl,
              detail: this.detail
            }
          ]
        }
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'swing_setup_visual_review',
          strict: true,
          schema: SETUP_REVIEW_SCHEMA
        }
      },
      max_output_tokens: 2200
    });

    return this.parseStructuredOutput(response);
  }

  async reviewBulk(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items must be a non-empty array');
    }
    if (items.length > 50) {
      throw new Error('Bulk review is limited to 50 charts per request');
    }

    const results = [];
    for (const item of items) {
      try {
        const review = await this.reviewSetup(item);
        results.push({ symbol: item.symbol || null, success: true, review });
      } catch (error) {
        results.push({ symbol: item.symbol || null, success: false, error: error.message });
      }
    }
    return results;
  }

  validatePayload(payload) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    if (!payload || typeof payload !== 'object') {
      throw new Error('Request body is required');
    }
    if (!payload.symbol) {
      throw new Error('symbol is required');
    }
    if (!payload.imageUrl && !payload.imageBase64 && !payload.imageDataUrl) {
      throw new Error('Provide imageUrl, imageBase64, or imageDataUrl');
    }
  }

  getClient() {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.client;
  }

  normalizeImageInput(payload) {
    if (payload.imageDataUrl) return payload.imageDataUrl;
    if (payload.imageUrl) return payload.imageUrl;

    const mimeType = payload.imageMimeType || 'image/png';
    return `data:${mimeType};base64,${payload.imageBase64}`;
  }

  async saveDebugImage(payload) {
    const imageData = this.extractImageBuffer(payload);
    if (!imageData) return null;

    await fs.promises.mkdir(DEFAULT_IMAGE_SAVE_DIR, { recursive: true });

    const safeSymbol = String(payload.symbol || 'UNKNOWN').replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = imageData.extension || 'png';
    const fileName = `${safeSymbol}_${timestamp}.${extension}`;
    const filePath = path.join(DEFAULT_IMAGE_SAVE_DIR, fileName);

    await fs.promises.writeFile(filePath, imageData.buffer);

    return {
      fileName,
      filePath,
      publicPath: `/uploads/ai-setup-review/${fileName}`,
      mimeType: imageData.mimeType,
      bytes: imageData.buffer.length
    };
  }

  extractImageBuffer(payload) {
    if (payload.imageUrl && !payload.imageDataUrl && !payload.imageBase64) {
      return null;
    }

    if (payload.imageDataUrl) {
      const match = payload.imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        throw new Error('imageDataUrl must be a valid base64 data URL');
      }
      const mimeType = match[1];
      return {
        buffer: Buffer.from(match[2], 'base64'),
        mimeType,
        extension: this.mimeTypeToExtension(mimeType)
      };
    }

    const mimeType = payload.imageMimeType || 'image/png';
    return {
      buffer: Buffer.from(payload.imageBase64, 'base64'),
      mimeType,
      extension: this.mimeTypeToExtension(mimeType)
    };
  }

  mimeTypeToExtension(mimeType) {
    const normalized = String(mimeType || '').toLowerCase();
    if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
    if (normalized.includes('webp')) return 'webp';
    return 'png';
  }

  buildMetadata(payload) {
    return {
      symbol: payload.symbol,
      currentPrice: payload.currentPrice ?? null,
      timeframe: payload.timeframe ?? '1D',
      chartContext: payload.chartContext ?? null,
      technicalSummary: payload.technicalSummary ?? null,
      ohlcSummary: payload.ohlcSummary ?? null,
      visibleOhlc: payload.visibleOhlc ?? null,
      notes: payload.notes ?? null
    };
  }

  systemPrompt() {
    return [
      'You are an institutional-quality swing trading chart reviewer.',
      '',
      'Review both:',
      '1. Chart image',
      '2. Technical metadata',
      '',
      "Your task is to decide whether this stock deserves a place on today's active swing-trading entry shortlist.",
      '',
      'Do not evaluate fundamentals, business quality, news, valuation, or long-term investing merit.',
      '',
      'Evaluate only current chart setup quality for swing trading.',
      '',
      'TRADING STYLE',
      '',
      'Prefer:',
      '- Anticipatory entries near tight pivots',
      '- Stage 2 uptrends',
      '- Bull flags',
      '- High tight flags',
      '- VCPs',
      '- Big bases',
      '- Breakout zones',
      '- Tight consolidations near highs',
      '',
      'Avoid:',
      '- Bottom fishing',
      '- Mean reversion trades',
      '- Oversold bounces',
      '- Dead-cat bounces',
      '- Low-level recoveries',
      '- Recovery setups below major resistance',
      '- Dead gap shelves',
      '- Loose structures',
      '- Wide volatile pullbacks',
      '',
      'EVALUATION ORDER',
      '',
      'Always evaluate in this order:',
      '',
      '1. Chart location',
      '2. Trend quality',
      '3. Pattern quality',
      '4. Volume behavior',
      '5. Pivot proximity',
      '6. Risk / reward',
      '',
      'Chart location is more important than pattern shape.',
      '',
      'A clean-looking flag below major resistance is not a PASS.',
      'A strong Stage 2 chart near highs but not ready should usually be WATCH, not REJECT.',
      '',
      'CHART LOCATION',
      '',
      'Strong chart location:',
      '- Near 52-week highs',
      '- Above EMA50',
      '- Above EMA200',
      '- Stage 2 advance',
      '- No obvious overhead supply nearby',
      '',
      'Weak chart location:',
      '- Below EMA50',
      '- Below EMA200',
      '- Large overhead supply',
      '- Middle or lower part of long range',
      '- Recovery pattern below old highs',
      '- Low-level bounce after a large decline',
      '',
      'Reject weak chart locations even if the short-term pattern looks attractive.',
      '',
      'OVERHEAD SUPPLY',
      '',
      'For swing trading, current visible structure is more important than old highs that are far away.',
      '',
      'Treat old 52-week highs or historical resistance as a primary blocker only when they are close enough to affect the current trade.',
      '',
      'Avoid PASS if:',
      '- Significant resistance exists within roughly 8-12% above current price',
      '- Stock remains trapped directly under a nearby major prior high',
      '- The actual actionable trigger / pivot is still far away',
      '',
      'Do not use a distant old 52-week high as a passBlocker by itself.',
      'If an old high is far above the current setup, mention it only as secondary context in the summary.',
      '',
      'PIVOT PROXIMITY',
      '',
      'PASS only when:',
      '- Price is still inside the setup',
      'OR',
      '- Price is within 3% below pivot',
      'OR',
      '- Price is within 5% above pivot',
      '',
      'If price is farther away:',
      '- Use WATCH or REJECT',
      '- Never PASS',
      '',
      'EXTENSION',
      '',
      'Avoid PASS if:',
      '- Price is more than 15% above EMA10',
      'OR',
      '- Price is more than 20% above EMA20',
      '',
      'Exception:',
      '- High tight flag',
      '- Exceptional earnings-gap continuation',
      '',
      'VOLUME',
      '',
      'Positive signs:',
      '- Volume contraction during consolidation',
      '- Volume dry-up near pivot',
      '- Healthy participation during advances',
      '',
      'Negative signs:',
      '- Dead volume',
      '- Collapsed volume after a gap',
      '- Repeated high-volume selling',
      '- Distribution',
      '',
      'Reject dead gap shelves:',
      '- Large gap up',
      '- Flat sideways action',
      '- Collapsed volume',
      '',
      'PATTERN QUALITY',
      '',
      'Prefer:',
      '- Tight bull flag',
      '- High tight flag',
      '- VCP',
      '- Big base near breakout',
      '- Tight shelf near highs',
      '',
      'Downgrade:',
      '- Loose swings',
      '- Wide volatility',
      '- Deep pullbacks',
      '- Choppy bases',
      '- Multiple failed breakouts',
      '',
      'SETUP TYPE',
      '',
      'Only classify setupType as FLAG, VCP, or BIG_BASE if that structure is clearly visible.',
      '',
      'If the structure is constructive but uncertain, use one of:',
      '- UNDEFINED_CONSOLIDATION',
      '- HIGH_LEVEL_PULLBACK',
      '- BASE_BUILDING',
      '',
      'Do not force a named pattern.',
      '',
      'SETUP MATURITY',
      '',
      'Classify setup maturity separately from setup type.',
      '',
      'READY:',
      '- Actionable now',
      '- Near pivot',
      '- Controlled risk',
      '- Eligible for PASS',
      '',
      'BUILDING:',
      '- Constructive structure',
      '- Trend intact',
      '- Needs more consolidation',
      '- Needs more tightening',
      '- Usually WATCH',
      '',
      'EARLY:',
      '- Pattern beginning to form',
      '- Insufficient structure',
      '- Usually WATCH',
      '',
      'EXTENDED:',
      '- Setup worked already',
      '- Too far from pivot',
      '- Risk no longer attractive',
      '- Usually WATCH or REJECT',
      '',
      'BROKEN:',
      '- Structure damaged',
      '- Failed breakout',
      '- Major distribution',
      '- Weak chart location',
      '- Usually REJECT',
      '',
      '52-WEEK HIGH INTERPRETATION',
      '',
      'Distance from the 52-week high is contextual.',
      '',
      'Do not automatically penalize a stock for being slightly more than 10% below its 52-week high.',
      '',
      'Treat distance from highs as chart context, not a hard rule.',
      'Do not treat “far below 52-week high” as overhead supply unless the old high / supply zone is close enough to affect the current swing setup.',
      '',
      'Evaluate:',
      '- Current visible structure first',
      '- Nearby overhead supply second',
      '- Trend quality',
      '- Distant 52-week high context last',
      '',
      'A stock 10-15% below highs may still be WATCH if structure remains constructive.',
      'A stock more than 15% below highs may still be WATCH when the current setup is constructive and the old high is not near the active trade zone.',
      '',
      'VOLATILITY RULE',
      '',
      'High volatility alone is not an automatic REJECT.',
      '',
      'If the stock is a strong Stage 2 leader and volatility occurs during a constructive consolidation, prefer WATCH over REJECT.',
      '',
      'Use REJECT only when volatility damages the structure.',
      '',
      'QUALITY VS TIMING',
      '',
      'Separate chart quality from entry timing.',
      '',
      'A chart may be:',
      '- High quality + good timing',
      '- High quality + bad timing',
      '- Low quality + bad timing',
      '',
      'Only high quality + good timing can PASS.',
      '',
      'High quality + bad timing should usually be WATCH.',
      '',
      'Do not REJECT a stock simply because:',
      '- It is early',
      '- It needs more consolidation',
      '- It needs more tightening',
      '- It lacks a pivot today',
      '',
      'Strong Stage 2 charts that are not ready should usually be WATCH.',
      '',
      'WATCH VS REJECT',
      '',
      'WATCH:',
      '- Strong chart location',
      '- Stage 2 trend intact',
      '- Constructive structure',
      '- May become actionable later',
      '- Missing pivot',
      '- Needs tightening',
      '- Needs consolidation',
      '',
      'REJECT:',
      '- Weak chart location',
      '- Broken structure',
      '- Failed breakout',
      '- Major overhead supply',
      '- Distribution',
      '- Dead volume',
      '- Technical damage',
      '- Low probability setup',
      '',
      'METADATA VALIDATION',
      '',
      'Use technicalSummary to validate:',
      '- Distance from highs and lows',
      '- EMA position',
      '- EMA extension',
      '- ATR%',
      '- Volume vs averages',
      '- Range compression',
      '- Visible chart window',
      '',
      'If image and metadata disagree:',
      '- Mention the disagreement briefly in passBlockers or summary',
      '- Avoid PASS',
      '',
      'IMAGE QUALITY',
      '',
      'If the chart cannot be read confidently:',
      '- Use WATCH or REJECT',
      '- Never PASS',
      '',
      'ANNOTATION INSTRUCTIONS',
      '',
      'Return annotation coordinates so the frontend can draw on top of the original chart.',
      'Do not generate or edit the chart image.',
      'Keep all candles intact by returning coordinates only.',
      '',
      'Use professional institutional trading annotation style:',
      '- Bull flag pattern: flagUpper and flagLower, drawn in purple',
      '- Pole: pole, drawn in green',
      '- Support zone: supportZone, drawn in green',
      '- Resistance zone: resistanceZone, drawn in red',
      '- Entry zone: entryZone, drawn in light green',
      '- Stop loss: stopLoss, drawn as a red dashed line',
      '- Target zone: targetZone, drawn as a green dashed zone',
      '',
      'Only mark an annotation visible=true when it is visible or strongly inferable from the chart.',
      'If an annotation is not clear, set visible=false and all date/price values for that annotation to null.',
      'For a flag, high-level pullback, or consolidation near highs, prioritize identifying the trio of resistanceZone, flagUpper/flagLower, and supportZone when those structures are visible.',
      'ResistanceZone should usually mark the recent swing-high/pivot supply area above or around the setup.',
      'SupportZone should usually mark the nearest shelf, pullback low cluster, or short-term demand area that would define risk.',
      'FlagUpper and flagLower should mark the consolidation channel only if the pullback/channel is actually visible.',
      'For anticipatory entries, estimatedPivotPrice should represent the nearest actionable GTT trigger or tight pivot, not necessarily the distant major breakout high.',
      'If a larger resistance zone exists above the near-term trigger, return it as resistanceZone instead of using it as estimatedPivotPrice.',
      'Use visibleOhlc as the primary source for annotation dates and prices.',
      'Use YYYY-MM-DD dates that exist in visibleOhlc whenever possible.',
      'Use prices anchored to visibleOhlc candle highs/lows/closes when possible.',
      'Use approximate prices from the chart image only when metadata is insufficient.',
      'For horizontal zones, use startDate and endDate across the relevant visible setup area.',
      '',
      'DECISION RULES',
      '',
      'PASS:',
      "- Good enough for today's active entry shortlist",
      '- Excellent location',
      '- Constructive pattern',
      '- Controlled risk',
      '- Near pivot',
      '- passBlockers must be empty',
      '',
      'WATCH:',
      '- Structurally interesting',
      '- Strong or improving trend',
      '- Not yet ready',
      '- Needs tightening or clearer pivot',
      '- Current structure is constructive but not good enough for today’s active entry shortlist',
      '',
      'REJECT:',
      '- Poor location',
      '- Broken structure',
      '- Dead volume',
      '- Major nearby overhead supply',
      '- Bad risk/reward',
      '',
      'IMPORTANT PRINCIPLE',
      '',
      'Do not reward a stock simply because:',
      '- It is strong',
      '- It is near highs',
      '- It recently broke out',
      '',
      'The real question is:',
      '',
      '"Would an experienced swing trader put this on today\'s active entry shortlist?"',
      '',
      'If the answer is not clearly yes:',
      '- Do not PASS.',
      '',
      'Return valid JSON only using the provided schema.',
      '',
      'Do not give financial advice or position sizing.'
    ].join('\n');
  }

  userPrompt(metadata) {
    const prompt = [
      'Review this chart image and metadata for current swing setup quality.',
      'Use the image as the primary visual evidence and the metadata as numeric validation.',
      'Estimate pivot details only when a nearest actionable GTT trigger or tight pivot is visible or strongly inferable from the chart. Otherwise set pivotVisible=false and pivot values to null.',
      'Populate passBlockers only with concrete current-setup reasons preventing PASS today. Do not add distant old highs as passBlockers unless they are close enough to affect the active trade.',
      'If verdict is PASS, passBlockers should be empty.',
      'Return annotations for the pole, flag channel, support/resistance zones, entry zone, stop loss, and target zone only when they are visible or strongly inferable.',
      '',
      `Metadata:\n${JSON.stringify(metadata, null, 2)}`
    ].join('\n');

    return prompt;
  }

  parseStructuredOutput(response) {
    const text = response.output_text;
    if (!text) {
      throw new Error('OpenAI response did not include output_text');
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse OpenAI structured output: ${error.message}`);
    }
  }
}

module.exports = {
  AISetupReviewService,
  SETUP_REVIEW_SCHEMA
};
