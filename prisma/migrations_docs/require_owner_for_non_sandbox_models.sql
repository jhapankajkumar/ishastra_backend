-- RedefineTables
PRAGMA foreign_keys=OFF;
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
    "userId" INTEGER NOT NULL,
    CONSTRAINT "WatchlistStock_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WatchlistStock" ("createdAt", "currency", "currentPrice", "decision", "entryPrice", "execution", "id", "market", "symbol", "userId") SELECT "createdAt", "currency", "currentPrice", "decision", "entryPrice", "execution", "id", "market", "symbol", "userId" FROM "WatchlistStock";
DROP TABLE "WatchlistStock";
ALTER TABLE "new_WatchlistStock" RENAME TO "WatchlistStock";
CREATE UNIQUE INDEX "WatchlistStock_userId_symbol_key" ON "WatchlistStock"("userId", "symbol");
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
    "userId" INTEGER NOT NULL,
    CONSTRAINT "BacktestTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BacktestTrade" ("RMultiple", "entryDate", "entryPrice", "exitDate", "exitPrice", "id", "reason", "stopLoss", "symbol", "system", "target", "userId") SELECT "RMultiple", "entryDate", "entryPrice", "exitDate", "exitPrice", "id", "reason", "stopLoss", "symbol", "system", "target", "userId" FROM "BacktestTrade";
DROP TABLE "BacktestTrade";
ALTER TABLE "new_BacktestTrade" RENAME TO "BacktestTrade";
CREATE TABLE "new_Capital" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "remaining" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Capital_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Capital" ("createdAt", "currency", "id", "remaining", "total", "updatedAt", "userId") SELECT "createdAt", "currency", "id", "remaining", "total", "updatedAt", "userId" FROM "Capital";
DROP TABLE "Capital";
ALTER TABLE "new_Capital" RENAME TO "Capital";
CREATE UNIQUE INDEX "Capital_userId_currency_key" ON "Capital"("userId", "currency");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

