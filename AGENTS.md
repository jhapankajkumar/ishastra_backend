# ISHASTRA BACKEND — AI AGENT INSTRUCTION FILE

> **Purpose:** This file gives an AI agent a complete map of the backend codebase.
> Read this file first before making any changes. You should not need to re-explore
> the project structure after reading this.

---

## 1. PROJECT OVERVIEW

A **professional trading journal and stock analysis platform** built with:
- **Runtime:** Node.js + Express.js
- **Database:** SQLite via Prisma ORM
- **Language:** JavaScript (with partial TypeScript migration in `src/utils/` and `src/types/`)
- **Scheduler:** node-cron for automated scans and price refresh
- **Email:** Nodemailer + Mailgun for trading alerts
- **AI:** OpenAI GPT-4 Vision for chart analysis
- **Market Data:** yahoo-finance2 (v3.15.3+)
- **Technical Analysis:** technicalindicators npm package

The app manages trades, investments, a stock watchlist, chart journaling, capital allocation, recommendations, and multi-system signal scanning.

---

## 2. HOW TO START

```bash
# Development (nodemon + ts-node)
npm run dev

# Production
npm start

# Build TypeScript
npm run build

# Seed database
npm run seed

# Run tests
npm test
```

**Entry point:** `src/server.js`  
**Dev watcher config:** `nodemon.json` (watches `src/`, restarts on JS/TS changes)  
**TypeScript config:** `tsconfig.json` (lenient mode, ES2020, `allowJs: true`, `rootDir: src`, `outDir: dist`)

---

## 3. TSCONFIG — IMPORTANT RULES

- `rootDir` is `./src` — only compile files under `src/`
- `exclude` list includes: `node_modules`, `dist`, `uploads`, `backup`, `generated`, `backtest`, `scripts`
- **Do NOT add non-src JS files to TypeScript compilation** — they will cause TS5055 errors
- `allowJs: true` means TS picks up JS files — excluded folders are safe

---

## 4. DATABASE — PRISMA SCHEMA

**Provider:** SQLite (`prisma/schema.prisma`)  
**Client location:** `generated/prisma/`  
**Import in code:** `const { PrismaClient } = require('@prisma/client')`

### Models (13 total)

#### `Trade` — Main trading journal record
| Field | Type | Notes |
|-------|------|-------|
| id | Int PK | Auto-increment |
| tradeId | String unique | Format: `ISH-YYYY-NNNNNN-HASH` |
| ticker | String | e.g. `AAPL`, `RELIANCE.NS` |
| tickerName | String? | Display name |
| direction | String | `LONG` or `SHORT` |
| entryDate | DateTime | |
| entryPrice | Float | |
| quantity | Int | |
| remainingQuantity | Int? | For partial exits |
| stopLoss | Float | |
| target1/2/3 | Float? | Profit targets |
| exitDate | DateTime? | |
| exitPrice | Float? | |
| status | String | `Open` / `Partial Closed` / `Closed` |
| grade | String? | `A+`, `A`, `B+`, `B`, `C`, `D` |
| confidence | Float? | 0–100 |
| rMultiple | Float? | Reward/risk ratio realized |
| isPaperTrade | Boolean | Default false |
| systemAnalysisResult | String? | JSON blob |
| Relations | | `tradeFills[]`, `tradeImages[]`, `tradeTransactions[]` |

#### `TradeFill` — Individual fills/executions
Fields: `id`, `tradeId (FK)`, `type (Entry/Exit/Adjustment)`, `fillDate`, `orderPrice`, `filledPrice`, `slippage`, `quantity`, `totalCost`, `dayHigh`, `dayLow`, `gradePercent`

#### `TradeImage` — Chart screenshots for trades
Fields: `id`, `tradeId (FK)`, `imageType`, `filePath`, `uploadedAt`

#### `TradeTransaction` — Multi-leg partial exits
Fields: `id`, `tradeId (FK)`, `transactionType (Entry/Exit)`, `quantity`, `price`, `transactionDate`, `reasonForExit`, `exitTacticId`

#### `ChartAnalysis` — Pre-trade chart journaling
Fields: `id`, `entryDate`, `ticker`, `trend`, `candleType`, `nearSupport`, `nearResistance`, `supportLevel`, `resistanceLevel`, `emaTouch`, `volumeSpike`, `rsiValue`, `setupConfidence`, `setupType`, `actionPlan`, `entryNotes`, `reviewNotes`  
Relations: `chartImages[]`

#### `ChartImage` — Images for chart analysis
Fields: `id`, `chartId (FK)`, `imageType`, `filePath`

#### `Recommendation` — Analyst buy recommendations
Fields: `id`, `ticker`, `buyBelow`, `currentPrice`, `sector`, `source`, `marketCap`

#### `Investment` — Long-term investment holdings
Fields: `id`, `ticker`, `quantity`, `avgBuyPrice`, `totalInvestment`, `buyBelow`, `currentPrice`, `status (open/closed)`, `entryDate`, `exitDate`, `remainingQty`, `isRecommended`, `currency (USD/INR)`, `sector`, `marketCap`, `lastDayPrice`  
Relations: `transactions[]`

#### `InvestmentTransaction` — Buy/sell legs for investments
Fields: `id`, `investmentId (FK)`, `type (Buy/Sell)`, `quantity`, `price`, `transactionDate`, `exitReason`

#### `Capital` — Per-currency capital tracking
Fields: `id (UUID)`, `currency (USD/INR, unique)`, `total`, `remaining`, `createdAt`, `updatedAt`

#### `WatchlistStock` — Daily scan results
Fields: `id`, `symbol (unique)`, `currentPrice`, `currency`, `market (US/IN)`, `entryPrice`, `decision (JSON)`, `execution (JSON with entry/stop/targets)`, `createdAt`

#### `BacktestTrade` — Backtest engine results
Fields: `id`, `symbol`, `entryDate`, `exitDate`, `entryPrice`, `exitPrice`, `stopLoss`, `target`, `reason (STOP/TARGET/TIME)`, `RMultiple`, `system`

---

## 5. SERVER ENTRY POINT — `src/server.js`

Main Express app. On startup it:
1. Starts 3 cron jobs (price refresh, alert checks, daily watchlist scan)
2. Initializes Express with CORS, JSON body parser (25MB limit), static `/uploads` folder
3. Registers all route modules

### Registered Routes

| Mount Path | Route File | Description |
|------------|-----------|-------------|
| `/api/trades` | `trade.routes.js` | Trade CRUD + exits |
| `/api/journal` | `chart.routes.js` | Pre-trade journal (chart analysis) |
| `/api/recommendations` | `recommendation.routes.js` | Analyst picks |
| `/api/investments` | `investment.routes.js` + `investment-transactions.routes.js` | Holdings |
| `/api/market` | `market.routes.js` | Market indices |
| `/api/trading` | `signal-analysis.routes.js` | Multi-system analysis |
| `/api/capital` | `capital.routes.js` | Capital allocation |
| `/api/watchlist` | `watchlist.routes.js` | Watchlist + scans |
| `/api/alerts` | `alert.routes.js` | Position/watchlist alerts |
| `/api/email` | `email.routes.js` | Email test + alerts |
| `/api/backtest` | `backtest.routes.js` | Backtest engine |
| `/api/yahoo/*` | inline | Yahoo Finance proxy (search, price, quote, indicators) |

**Custom inline endpoint:**  
`GET /api/yahoo/indicator?symbol=X` — Returns EMA, SMA, RSI, ATR, support/resistance levels computed in-server

---

## 6. ROUTES — EVERY ENDPOINT

### `src/routes/trade.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/trades` | getAllTrades | List all trades (query: `isPaperTrade`) |
| POST | `/api/trades` | createTrade | Create new trade (multipart form) |
| GET | `/api/trades/:id` | getTradeById | Single trade |
| PUT | `/api/trades/:id/exit` | updateTradeExit | Full or partial exit |
| PUT | `/api/trades/:id/partial-exit` | partialExitTrade | Specific partial exit with transaction |
| PUT | `/api/trades/:id/post-analysis` | addPostAnalysis | Add post-trade review |
| PUT | `/api/trades/:id/edit` | editTrade | Edit entry details |
| GET | `/api/trades/:id/transactions` | getTradeTransactions | Get exit transaction history |
| DELETE | `/api/trades/:id` | deleteTrade | Delete trade |
| POST | `/api/trades/stock-split` | (inline) | Handle stock split adjustment |

### `src/routes/signal-analysis.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/trading/signal-analysis` | analyzeTradingSystem | Multi-system analysis (query: symbol, period, capital) |
| GET | `/api/trading/chart` | getChartData | OHLC chart data (query: symbol, period) |
| POST | `/api/trading/ai-setup-review` | reviewSetup | OpenAI vision chart review |
| POST | `/api/trading/ai-setup-review/bulk` | reviewBulk | Batch OpenAI chart review |

### `src/routes/watchlist.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/watchlist` | getWatchlist | Current watchlist |
| POST | `/api/watchlist/daily-scan` | runDailyScan | Manual trigger of daily scan (body: `stocksUniverse`) |
| POST | `/api/watchlist/breakout-scan` | runBreakoutScan | Breakout-specific scan |
| POST | `/api/watchlist/remove` | deleteFromWatchlist | Remove stock from watchlist |
| POST | `/api/watchlist/refresh` | refreshStock | Re-analyse one watchlist stock |

### `src/routes/alert.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/alerts/positions` | getPositionAlerts | Stop/profit hits for open trades |
| GET | `/api/alerts/watchlist` | getWatchlistAlerts | Entry triggers for watchlist stocks |
| GET | `/api/alerts/all` | (combined) | All alerts |

### `src/routes/capital.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/capital` | getAllCapital | All currencies |
| GET | `/api/capital/status` | (status) | Allocation status |
| GET | `/api/capital/check` | checkCapitalAvailability | Is capital available? |
| GET | `/api/capital/:currency` | getCapitalByCurrency | Specific currency |
| POST | `/api/capital/initialize` | initializeCapital | Seed initial capital |
| POST | `/api/capital/:currency/add` | addCapital | Add funds |
| POST | `/api/capital/:currency/remove` | removeCapital | Remove/allocate funds |
| PUT | `/api/capital/:currency` | updateCapital | Update capital record |

### `src/routes/investment.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/investments` | getAllInvestments | List all (query: groupByTicker, status, ticker) |
| GET | `/api/investments/summary` | getInvestmentSummary | Stats + P&L |
| GET | `/api/investments/:id` | getInvestmentById | Single investment |
| POST | `/api/investments` | createInvestment | New investment |
| PUT | `/api/investments/:id` | updateInvestment | Edit |
| DELETE | `/api/investments/:id` | deleteInvestment | Remove |
| PATCH | `/api/investments/:id/close` | closeInvestment | Close position |

### `src/routes/investment-transactions.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/investments/:investmentId/transactions` | (list) | Transaction history |
| POST | `/api/investments/:investmentId/transactions` | (create) | Add transaction |

### `src/routes/chart.routes.js` (journal)
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| POST | `/api/journal` | createChartAnalysis | New journal entry |
| GET | `/api/journal` | getAllChartAnalyses | List journal entries |
| GET | `/api/journal/:id` | getChartAnalysisById | Single entry |
| PUT | `/api/journal/:id` | updateChartAnalysis | Edit/add review notes |
| DELETE | `/api/journal/:id` | deleteChartAnalysis | Delete |

### `src/routes/backtest.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| POST | `/api/backtest/run` | runBacktest | Start a backtest |
| GET | `/api/backtest/status/:id` | getBacktestStatus | Check job status |
| GET | `/api/backtest/results/:id` | getBacktestResults | Fetch results |
| GET | `/api/backtest/history` | getBacktestHistory | Past backtest runs |
| GET | `/api/backtest/analytics` | getBacktestAnalytics | Aggregated analytics |
| DELETE | `/api/backtest/clear` | (clear) | Wipe backtest records |

### `src/routes/email.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| POST | `/api/email/test` | testEmail | Send test email |
| GET | `/api/email/verify` | verifyConfiguration | Check email config |
| POST | `/api/email/alert` | sendAlert | Send custom alert email |

### `src/routes/market.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/market/indices` | getMarketIndices | NIFTY, SENSEX, NASDAQ, DOW |

### `src/routes/recommendation.routes.js`
| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/recommendations` | getAllRecommendations | List all |
| GET | `/api/recommendations/:id` | getRecommendationById | Single |
| POST | `/api/recommendations` | createRecommendation | Create |
| PUT | `/api/recommendations/:id` | updateRecommendation | Edit |
| DELETE | `/api/recommendations/:id` | deleteRecommendation | Delete |
| PATCH | `/api/recommendations/:id/archive` | archiveRecommendation | Toggle archive |

---

## 7. CONTROLLERS — `src/controllers/`

| File | Style | Key Methods |
|------|-------|-------------|
| `trade.controller.js` | exported functions | `getAllTrades`, `createTrade`, `updateTradeExit`, `partialExitTrade`, `addPostAnalysis`, `editTrade`, `getTradeById`, `getTradeTransactions`, `deleteTrade` |
| `alert.controller.js` | `AlertController` class | `getPositionAlerts()`, `getWatchlistAlerts()` |
| `backtest.controller.js` | `BacktestController` class | `runBacktest()`, `getBacktestStatus()`, `getBacktestResults()`, `getBacktestHistory()`, `getBacktestAnalytics()` |
| `capital.controller.js` | exported functions | `getAllCapital`, `getCapitalByCurrency`, `addCapital`, `removeCapital`, `updateCapital`, `initializeCapital`, `checkCapitalAvailability` |
| `chart.controller.js` | exported functions | `createChartAnalysis`, `getAllChartAnalyses`, `getChartAnalysisById`, `updateChartAnalysis`, `deleteChartAnalysis` |
| `investment.controller.js` | exported functions | `getAllInvestments`, `getInvestmentById`, `createInvestment`, `updateInvestment`, `deleteInvestment`, `closeInvestment`, `getInvestmentSummary` |
| `market.controller.js` | exported functions | `getMarketIndices` |
| `recommendation.controller.js` | exported functions | `getAllRecommendations`, `getRecommendationById`, `createRecommendation`, `updateRecommendation`, `deleteRecommendation`, `archiveRecommendation` |
| `signal-analysis.controller.js` | `TradingSystemController` class | `analyzeTradingSystem()`, `getChartData()`, `getStockAnalysis()` |
| `ai-setup-review.controller.js` | `AISetupReviewController` class | `reviewSetup()`, `reviewBulk()` |
| `watchlist.controller.js` | `WatchlistController` class | `getWatchlist()`, `runDailyScan()`, `runBreakoutScan()`, `deleteFromWatchlist()`, `refreshStock()` |

---

## 8. SERVICES — `src/services/`

### `watchlist.service.js` — `WatchlistService` class
**Most important service.** Handles the daily stock universe scan.

Key method: `runDailyScan(stockUniverse)`
- Accepts `'ALL'` or an array of symbol strings
- Scans in batches of 10 using `Promise.allSettled`
- Tracks: `buySignals[]`, `strongBuySignals[]`, `watchSignals[]`, `failedSymbols[]`
- Failed symbols (rejected/null results) are captured and returned
- Returns:
  ```js
  {
    scanned: Number,         // total symbols attempted
    buySignals: String,      // comma-separated buy symbols
    failedSymbols: String,   // comma-separated failed symbols
    failedCount: Number,
    watchSignals: Number,
    watchlistSize: Number,
    breakdown: { strongBuy, buy, watch },
    avgConfidence: Number
  }
  ```
- Saves top signals to `WatchlistStock` table (clears old records first)

### `alert.service.js` — `AlertService`
- `checkPositionAlerts()` — checks open trades for stop/profit hits
- `getPositionAlerts()` — returns alert list
- Note: Email sending logic is currently **commented out**

### `email.service.js` — `EmailService`
- `setupEmailService()` / `setupMailgun()` — configure provider
- `sendAlert(alertData)` — send trading alert email
- `testEmail()`, `verifyConfiguration()` — diagnostics
- Loads HTML templates from `email-previews/`

### `investment.service.js`
- `fetchAllInvestments(filter)` — fetch with optional status/ticker filter

### `watchlist.trigger.service.js` — `WatchlistTriggerService`
- `getWatchlistTriggers()` — check watchlist stocks for entry conditions
- `getUpdatedTriggers()` — refresh trigger status
- `getBuyWatchList()` — return current buy candidates

### `ai-setup-review.service.js` — `AISetupReviewService`
- `reviewSetup(payload)` — single chart review via OpenAI GPT-4 Vision
- `reviewBulk(items)` — batch chart review
- Detects: FLAG, VCP, BIG_BASE patterns
- Returns structured JSON with grade, confidence, setupType

### `comom.service.js` — shared utilities
- `fetchCurrentPrice(symbol)` — get current price from Yahoo Finance
- `getTickerAnalysis(symbol)` — run full analysis on a symbol (returns signal object)
- `refreshTradePrices()` — update all open trade current prices
- `refreshOtherPrices()` — update investments + other price-sensitive records

---

## 9. MIDDLEWARE — `src/middleware/`

### `upload.middleware.js`
- `upload` — multer instance (5MB limit, images only, unique filenames)
- `handleUploadError` — error handler middleware for file upload failures
- Files saved to `/uploads/` directory

### `validation.middleware.js`
- `validateTrade` — express-validator rules for trade creation
- `validateTradeExit` — rules for exit fields
- `validatePostAnalysis` — rules for post-analysis
- `validateTradeId` — param validation
- `validateAuth` — auth field validation

---

## 10. CRON JOBS — `src/cron/`

| File | Class | Schedule | What It Does |
|------|-------|----------|-------------|
| `price.refresh.cron.js` | `PriceRefreshCron` | Every 30s for trades, every 30min for investments (Mon–Fri, market hours) | Calls `comom.service.refreshTradePrices()` and `refreshOtherPrices()` |
| `alert.cron.js` | `AlertCron` | Every 2 minutes Mon–Sat | Position alert checks + watchlist triggers. Email sending is **disabled** |
| `watchlist.cron.js` | `WatchlistCron` | Daily 10:00 AM SGT Mon–Fri | Runs `watchlistService.runDailyScan('ALL')` against the full 500-stock universe |

---

## 11. TRADING SYSTEMS — `src/systems/`

| File | Class | Strategy |
|------|-------|---------|
| `minervini-template-advanced.js` | `MinerviniTemplateAdvanced` | Stage 2 breakout detection. RS scoring, consolidation detection, volume patterns, grade assignment (A+ to D). **Primary system used in daily scan** |
| `elder-triple-screen.js` | `ElderTripleScreen` | Multi-timeframe: weekly chart for primary trend direction, daily chart for entry timing |
| `institutional-momentum-cascade.js` | `InstitutionalMomentumCascade` | Detects institutional accumulation via abnormal volume + price action |
| `rsi-mean-reversion.js` | `RSIMeanReversion` | RSI < 30 oversold bounce + EMA support confluence |

**Decision outputs from systems:**
- `action`: `STRONG_BUY` | `BUY` | `WATCH` | `SELL` | `HOLD`
- `confidence`: 0–100
- `grade`: `A+` | `A` | `B+` | `B` | `C` | `D`

---

## 12. UTILS — `src/utils/`

| File | Type | Purpose |
|------|------|---------|
| `capitalManager.js` | Class (static) | `getCapital()`, `allocateCapital()`, `releaseCapital()`, `deductCommission()`, `hasSufficientCapital()`, `getCapitalSummary()` — manages USD/INR capital allocation |
| `systemConstants.js` | Constants | `SYSTEM_IDS`, `SYSTEM_TIERS`, `WATCHLIST_FILTERS`, `TRIGGER_TYPES`, `normalizeSystemKey()` |
| `tradeIdGenerator.js` | Class (static) | `generateTradeId()` → `ISH-YYYY-NNNNNN-HASH`, `generateUuidTradeId()`, `generateShortTradeId()` |
| `simpleTechnicalDataFetcher.js` | Functions | `getSimpleTechnicalData()`, `calculateBasicIndicators()`, `calculateEMA()`, `calculateSMA()`, `calculateRSI()`, `detectBreakoutPullbackSetup()` |
| `big-base-detector.js` | `BigBaseDetector` class | `detect(dailyData, currentPrice)` — finds consolidation with entry zones (upper/floor/middle) |
| `flag-pattern-detector.js` | `FlagPatternDetector` class | `classify(dailyData, currentPrice)` — classifies: `HIGH_TIGHT_FLAG`, `TIGHT_FLAG`, `BULL_FLAG`, `BASE` |
| `vcp-detector.js` | `VcpDetector` class | `detect(data)` — Volatility Contraction Pattern via ZigZag + linear regression |
| `signal-stability-manager.js` | Class | Manages signal confirmation/stability logic |
| `stockList.ts` | TypeScript export | Stock universe list |
| `technicalIndicators.ts` | TypeScript | Technical indicator functions |
| `advancedTechnicalIndicators.ts` | TypeScript | Advanced indicator implementations |

---

## 13. CONFIG — `src/config/`

| File | Exports | Notes |
|------|---------|-------|
| `trading-thresholds.js` | `getActiveThresholds()`, `getSystemThresholds()`, `switchConfiguration()` | Threshold modes: `ULTRA_SELECTIVE` (grades A+/A only) vs training mode |
| `firebase.js` | (empty) | Placeholder, not yet used |

---

## 14. TYPES — `src/types/` (TypeScript)

| File | Contents |
|------|---------|
| `index.ts` | Main type exports |
| `config.ts` | Configuration type definitions |
| `express.ts` | Express.js type extensions (e.g. custom `req` fields) |
| `technical-analysis.ts` | Types for indicator and signal data structures |

---

## 15. BACKTEST ENGINE — `backtest/` (EXCLUDED FROM TS COMPILATION)

> This directory is explicitly excluded in `tsconfig.json`. Do NOT add it to include.

| File | Purpose |
|------|---------|
| `runBacktest.js` | Main orchestrator — `IshastraBacktest` class |
| `runBacktest.d.ts` | TypeScript declarations for the backtest module |
| `testSystem.js` | Validation/test runner |
| `examples.js` | Usage examples |
| `backtestConfig.json` | Configuration (symbols, periods, systems) |
| `engine/loader.js` | Data loading from candle files |
| `engine/logger.js` | Backtest-specific logging |
| `engine/tradeSimulator.js` | Trade execution simulation logic |
| `data/candles/` | Historical OHLCV data files |

---

## 16. STATIC DATA & SEED — `src/`

| File | Purpose |
|------|---------|
| `db.js` | Prisma client singleton export — import from here everywhere |
| `yahoo.js` | Yahoo Finance wrapper: `getHistorical()`, `getQuote()`, `getCurrentPrice()`, `searchSymbol()` |
| `seed.js` | Main DB seeder |
| `investment_seed.js` | Investment records seeder |
| `ticker_symbols.json` | Ticker symbol reference data |
| `trade_metadata.json` | Trade metadata |
| `sample_trades_seed.json` | Sample trades for dev/testing |
| `test-typescript.ts` | TS migration test file |

### `src/seed/`
| File | Purpose |
|------|---------|
| `investment.js` | Investment seed loader |
| `investments.json` | Investment seed data |
| `S&P500.json` | S&P 500 stock list (used in watchlist universe) |
| `tickerData.js` | Ticker reference data loader |

### `src/plugins/expertAI/`
Directory for expert AI decision engine (in progress).

---

## 17. SCRIPTS — `scripts/` (EXCLUDED FROM TS COMPILATION)

One-time maintenance scripts, run with `node scripts/<file>`:
| File | Purpose |
|------|---------|
| `populate-trade-ids.js` | Backfill `tradeId` for existing trades |
| `populate-partial-exit-fields.js` | Backfill partial exit fields |
| `seed-capital.js` | Initialize capital records |
| `typescript-migration-cleanup.js` | Cleanup tasks for TS migration |

---

## 18. EMAIL TEMPLATES — `email-previews/`

| File | Template For |
|------|-------------|
| `individual-alert.html` | Single stock alert |
| `batched-alerts.html` | Multiple alerts batched |
| `critical-alert.html` | Critical/urgent alerts |
| `index.html` | Template index/preview |

---

## 19. KEY PATTERNS & CONVENTIONS

### Prisma Usage
```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```
Or import the shared client from `src/db.js`.

### Route → Controller → Service pattern
- Routes are thin (just `router.get/post/...`)
- Controllers do `req/res` handling + validation
- Services contain all business logic

### Capital Management
- Every trade open/close must allocate/release capital via `CapitalManager`
- Separate tracking for `USD` and `INR`

### Symbol Conventions
- Indian stocks: suffix `.NS` (NSE) or `.BS` (BSE)
- US stocks: plain symbol (`AAPL`, `TSLA`)
- Yahoo Finance uses these suffixes natively

### Stock Universe
- ~500 stocks: mix of Nifty 200 and Russell 1000
- Defined inside `WatchlistService` as `this.STOCK_UNIVERSE`
- The daily scan accepts a custom array OR `'ALL'` for full universe

### Confidence / Grade System
- Confidence: 0–100 (numeric)
- Grade: `A+` (90%+) → `A` (85–89%) → `B+` (75–84%) → `B` (75–84%) → `C` (65–74%) → `D` (55–64%)
- `ULTRA_SELECTIVE` mode: only `A+` and `A` grades pass as buyable

---

## 20. DO NOT TOUCH

| Path | Reason |
|------|--------|
| `backup/` | Legacy systems, archived code |
| `generated/` | Auto-generated by Prisma |
| `dist/` | TypeScript build output |
| `uploads/` | User-uploaded files |
| `node_modules/` | NPM packages |
| `backtest/engine/*.js` | Must stay excluded from TS — plain JS files |

---

## 21. ENVIRONMENT VARIABLES (`.env`)

Key variables expected:
```
DATABASE_URL=file:./dev.db
PORT=5000
JWT_SECRET=...
OPENAI_API_KEY=...
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
EMAIL_FROM=...
EMAIL_TO=...
```

---

## 22. PACKAGE.JSON — KEY DEPENDENCIES

```json
{
  "express": "^4.x",
  "@prisma/client": "^5.x",
  "yahoo-finance2": "^3.15.3",
  "node-cron": "^3.x",
  "nodemailer": "^6.x",
  "openai": "^4.x",
  "technicalindicators": "^3.x",
  "express-jwt": "^8.x",
  "multer": "^1.x",
  "express-validator": "^7.x",
  "axios": "^1.x",
  "typescript": "^5.x",
  "ts-node": "^10.x",
  "nodemon": "^3.x"
}
```

Scripts: `start` | `dev` | `build` | `seed` | `test` | `type-check`
