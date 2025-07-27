-- CreateTable
CREATE TABLE "exit_tactics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tactic_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tag_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "trade_fills" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trade_id" INTEGER,
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
    "tradesId" INTEGER,
    CONSTRAINT "trade_fills_tradesId_fkey" FOREIGN KEY ("tradesId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trade_images" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trade_id" INTEGER,
    "image_type" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "uploaded_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "tradesId" INTEGER,
    CONSTRAINT "trade_images_tradesId_fkey" FOREIGN KEY ("tradesId") REFERENCES "trades" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trades" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "ticker" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "setup" TEXT,
    "entry_price" REAL,
    "exit_price" REAL,
    "stop_loss" REAL,
    "quantity" INTEGER,
    "remaining_quantity" INTEGER,
    "r_multiple" REAL,
    "result" TEXT,
    "entry_date" DATETIME,
    "exit_date" DATETIME,
    "reason_for_entry" TEXT,
    "reason_for_exit" TEXT,
    "post_trade_analysis" TEXT,
    "confidence_rating" INTEGER,
    "exit_tactic_id" INTEGER,
    "trade_setup_id" INTEGER,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "is_paper_trade" BOOLEAN,
    "status" TEXT DEFAULT 'Open',
    "tags" TEXT
);

-- CreateTable
CREATE TABLE "trade_transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trade_id" INTEGER NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "transaction_date" DATETIME NOT NULL,
    "reason_for_exit" TEXT,
    "exit_tactic_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_transactions_trade_id_fkey" FOREIGN KEY ("trade_id") REFERENCES "trades" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "trade_setups" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trade_setup_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "chart_readings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "stock" TEXT NOT NULL,
    "trend" TEXT,
    "candle_type" TEXT,
    "near_support" BOOLEAN,
    "near_resistance" BOOLEAN,
    "support_level" REAL,
    "resistance_level" REAL,
    "ema_touch" BOOLEAN,
    "volume_spike" BOOLEAN,
    "rsi_value" REAL,
    "entry_considered" BOOLEAN,
    "action_plan" TEXT,
    "notes" TEXT,
    "screenshot_url" TEXT,
    "review_screenshot_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "exit_tactics_tactic_id_key" ON "exit_tactics"("tactic_id");

-- CreateIndex
CREATE UNIQUE INDEX "exit_tactics_name_key" ON "exit_tactics"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_tag_id_key" ON "tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_users_1" ON "users"("username");
Pragma writable_schema=0;

-- CreateIndex
CREATE UNIQUE INDEX "trade_setups_trade_setup_id_key" ON "trade_setups"("trade_setup_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_setups_name_key" ON "trade_setups"("name");
