-- AlterTable
ALTER TABLE "trades" ADD COLUMN "atr_value" REAL;
ALTER TABLE "trades" ADD COLUMN "entry_commission" REAL;
ALTER TABLE "trades" ADD COLUMN "exit_commission" REAL;
ALTER TABLE "trades" ADD COLUMN "instrument_type" TEXT;
ALTER TABLE "trades" ADD COLUMN "notes" TEXT;
ALTER TABLE "trades" ADD COLUMN "risk_per_trade" REAL;
ALTER TABLE "trades" ADD COLUMN "target_1" REAL;
ALTER TABLE "trades" ADD COLUMN "target_2" REAL;
ALTER TABLE "trades" ADD COLUMN "target_3" REAL;
ALTER TABLE "trades" ADD COLUMN "timeframe_used" TEXT;
