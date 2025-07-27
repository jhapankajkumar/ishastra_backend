/*
  Warnings:

  - You are about to drop the column `tradesId` on the `trade_fills` table. All the data in the column will be lost.
  - You are about to drop the column `tradesId` on the `trade_images` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[trade_id]` on the table `trades` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "trades" ADD COLUMN "trade_id" TEXT;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_trade_fills" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trade_id" TEXT,
    "type" TEXT NOT NULL,
    "fill_date" DATETIME NOT NULL,
    "order_price" REAL,
    "filled_price" REAL,
    "slippage" REAL,
    "shares" INTEGER,
    "total_cost" REAL,
    "day_high" REAL,
    "day_low" REAL,
    "grade_percent" REAL,
    CONSTRAINT "trade_fills_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades" ("trade_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_trade_fills" ("day_high", "day_low", "fill_date", "filled_price", "grade_percent", "id", "order_price", "shares", "slippage", "total_cost", "trade_id", "type") SELECT "day_high", "day_low", "fill_date", "filled_price", "grade_percent", "id", "order_price", "shares", "slippage", "total_cost", "trade_id", "type" FROM "trade_fills";
DROP TABLE "trade_fills";
ALTER TABLE "new_trade_fills" RENAME TO "trade_fills";
CREATE TABLE "new_trade_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trade_id" TEXT,
    "image_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_images_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades" ("trade_id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_trade_images" ("file_path", "id", "image_type", "trade_id", "uploaded_at") SELECT "file_path", "id", "image_type", "trade_id", "uploaded_at" FROM "trade_images";
DROP TABLE "trade_images";
ALTER TABLE "new_trade_images" RENAME TO "trade_images";
CREATE TABLE "new_trade_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trade_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "transaction_date" DATETIME NOT NULL,
    "reason_for_exit" TEXT,
    "exit_tactic_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_transactions_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades" ("trade_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_trade_transactions" ("created_at", "exit_tactic_id", "id", "price", "quantity", "reason_for_exit", "trade_id", "transaction_date", "transaction_type") SELECT "created_at", "exit_tactic_id", "id", "price", "quantity", "reason_for_exit", "trade_id", "transaction_date", "transaction_type" FROM "trade_transactions";
DROP TABLE "trade_transactions";
ALTER TABLE "new_trade_transactions" RENAME TO "trade_transactions";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "trades_trade_id_key" ON "trades"("trade_id");
