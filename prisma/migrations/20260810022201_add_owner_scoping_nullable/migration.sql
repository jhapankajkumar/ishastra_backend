-- CreateTable
CREATE TABLE "CapitalTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "capitalId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "balanceAfter" REAL NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CapitalTransaction_capitalId_fkey" FOREIGN KEY ("capitalId") REFERENCES "Capital" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CapitalTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Capital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "remaining" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER,
    CONSTRAINT "Capital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Capital" ("createdAt", "currency", "id", "remaining", "total", "updatedAt") SELECT "createdAt", "currency", "id", "remaining", "total", "updatedAt" FROM "Capital";
DROP TABLE "Capital";
ALTER TABLE "new_Capital" RENAME TO "Capital";
CREATE UNIQUE INDEX "Capital_userId_currency_key" ON "Capital"("userId", "currency");
CREATE TABLE "new_Recommendation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticker" TEXT NOT NULL,
    "buyBelow" REAL,
    "currentPrice" REAL,
    "sector" TEXT,
    "source" TEXT,
    "marketCap" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER,
    "isPaperTrade" BOOLEAN DEFAULT false,
    CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Recommendation" ("buyBelow", "createdAt", "currentPrice", "id", "marketCap", "sector", "source", "ticker", "updatedAt") SELECT "buyBelow", "createdAt", "currentPrice", "id", "marketCap", "sector", "source", "ticker", "updatedAt" FROM "Recommendation";
DROP TABLE "Recommendation";
ALTER TABLE "new_Recommendation" RENAME TO "Recommendation";
CREATE TABLE "new_BacktestTrade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "exitDate" DATETIME NOT NULL,
    "entryPrice" REAL NOT NULL,
    "exitPrice" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "target" REAL NOT NULL,
    "reason" TEXT NOT NULL,
    "RMultiple" REAL NOT NULL,
    "system" TEXT,
    "userId" INTEGER,
    CONSTRAINT "BacktestTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BacktestTrade" ("RMultiple", "entryDate", "entryPrice", "exitDate", "exitPrice", "id", "reason", "stopLoss", "symbol", "system", "target") SELECT "RMultiple", "entryDate", "entryPrice", "exitDate", "exitPrice", "id", "reason", "stopLoss", "symbol", "system", "target" FROM "BacktestTrade";
DROP TABLE "BacktestTrade";
ALTER TABLE "new_BacktestTrade" RENAME TO "BacktestTrade";
CREATE TABLE "new_WatchlistStock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "currentPrice" REAL NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "market" TEXT,
    "entryPrice" REAL NOT NULL DEFAULT 0,
    "decision" TEXT,
    "execution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    CONSTRAINT "WatchlistStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WatchlistStock" ("createdAt", "currency", "currentPrice", "decision", "entryPrice", "execution", "id", "market", "symbol") SELECT "createdAt", "currency", "currentPrice", "decision", "entryPrice", "execution", "id", "market", "symbol" FROM "WatchlistStock";
DROP TABLE "WatchlistStock";
ALTER TABLE "new_WatchlistStock" RENAME TO "WatchlistStock";
CREATE UNIQUE INDEX "WatchlistStock_userId_symbol_key" ON "WatchlistStock"("userId", "symbol");
CREATE TABLE "new_Investment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ticker" TEXT NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "quantity" INTEGER NOT NULL,
    "avgBuyPrice" REAL,
    "totalInvestment" REAL,
    "buyBelow" REAL,
    "currentPrice" REAL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "entryDate" DATETIME NOT NULL,
    "exitDate" DATETIME,
    "remainingQty" INTEGER,
    "isRecommended" BOOLEAN,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "marketCap" TEXT,
    "sector" TEXT,
    "lastDayPrice" REAL,
    "userId" INTEGER,
    "isPaperTrade" BOOLEAN DEFAULT false,
    CONSTRAINT "Investment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Investment" ("avgBuyPrice", "buyBelow", "createdAt", "currency", "currentPrice", "entryDate", "exitDate", "id", "isRecommended", "lastDayPrice", "marketCap", "notes", "quantity", "remainingQty", "sector", "status", "ticker", "totalInvestment", "updatedAt") SELECT "avgBuyPrice", "buyBelow", "createdAt", "currency", "currentPrice", "entryDate", "exitDate", "id", "isRecommended", "lastDayPrice", "marketCap", "notes", "quantity", "remainingQty", "sector", "status", "ticker", "totalInvestment", "updatedAt" FROM "Investment";
DROP TABLE "Investment";
ALTER TABLE "new_Investment" RENAME TO "Investment";
CREATE TABLE "new_ChartAnalysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entryDate" DATETIME NOT NULL,
    "ticker" TEXT NOT NULL,
    "tickerName" TEXT,
    "trend" TEXT,
    "candleType" TEXT,
    "nearSupport" BOOLEAN,
    "nearResistance" BOOLEAN,
    "supportLevel" REAL,
    "resistanceLevel" REAL,
    "emaTouch" BOOLEAN,
    "volumeSpike" BOOLEAN,
    "rsiValue" REAL,
    "entryConsidered" BOOLEAN,
    "actionPlan" TEXT,
    "entryNotes" TEXT,
    "reviewNotes" TEXT,
    "setupConfidence" TEXT NOT NULL,
    "setupType" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "isPaperTrade" BOOLEAN DEFAULT false,
    CONSTRAINT "ChartAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ChartAnalysis" ("actionPlan", "candleType", "createdAt", "emaTouch", "entryConsidered", "entryDate", "entryNotes", "id", "nearResistance", "nearSupport", "resistanceLevel", "reviewNotes", "rsiValue", "setupConfidence", "setupType", "supportLevel", "ticker", "tickerName", "trend", "volumeSpike") SELECT "actionPlan", "candleType", "createdAt", "emaTouch", "entryConsidered", "entryDate", "entryNotes", "id", "nearResistance", "nearSupport", "resistanceLevel", "reviewNotes", "rsiValue", "setupConfidence", "setupType", "supportLevel", "ticker", "tickerName", "trend", "volumeSpike" FROM "ChartAnalysis";
DROP TABLE "ChartAnalysis";
ALTER TABLE "new_ChartAnalysis" RENAME TO "ChartAnalysis";
CREATE TABLE "new_Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tradeId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "tickerName" TEXT,
    "direction" TEXT NOT NULL,
    "instrumentType" TEXT,
    "currency" TEXT DEFAULT 'USD',
    "currentPrice" REAL,
    "lastDayPrice" REAL,
    "tradeSetupId" INTEGER,
    "confidence" INTEGER,
    "grade" TEXT,
    "entryDate" DATETIME,
    "reasonForEntry" TEXT,
    "entryCommission" REAL,
    "quantity" INTEGER,
    "entryPrice" REAL,
    "stopLoss" REAL,
    "target1" REAL,
    "target2" REAL,
    "target3" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitDate" DATETIME,
    "exitPrice" REAL,
    "exitCommission" REAL,
    "remainingQuantity" INTEGER,
    "reasonForExit" TEXT,
    "exitTacticId" INTEGER,
    "postTradeAnalysis" TEXT,
    "lessonLearned" TEXT,
    "emotionalState" TEXT,
    "status" TEXT DEFAULT 'Open',
    "tags" TEXT,
    "rMultiple" REAL,
    "isPaperTrade" BOOLEAN,
    "systemAnalysisResult" TEXT,
    "userId" INTEGER,
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("confidence", "createdAt", "currency", "currentPrice", "direction", "emotionalState", "entryCommission", "entryDate", "entryPrice", "exitCommission", "exitDate", "exitPrice", "exitTacticId", "grade", "id", "instrumentType", "isPaperTrade", "lastDayPrice", "lessonLearned", "notes", "postTradeAnalysis", "quantity", "rMultiple", "reasonForEntry", "reasonForExit", "remainingQuantity", "status", "stopLoss", "systemAnalysisResult", "tags", "target1", "target2", "target3", "ticker", "tickerName", "tradeId", "tradeSetupId") SELECT "confidence", "createdAt", "currency", "currentPrice", "direction", "emotionalState", "entryCommission", "entryDate", "entryPrice", "exitCommission", "exitDate", "exitPrice", "exitTacticId", "grade", "id", "instrumentType", "isPaperTrade", "lastDayPrice", "lessonLearned", "notes", "postTradeAnalysis", "quantity", "rMultiple", "reasonForEntry", "reasonForExit", "remainingQuantity", "status", "stopLoss", "systemAnalysisResult", "tags", "target1", "target2", "target3", "ticker", "tickerName", "tradeId", "tradeSetupId" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE UNIQUE INDEX "Trade_userId_tradeId_key" ON "Trade"("userId", "tradeId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

