const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleTrades = require('./sample_trades_seed.json');

async function main() {
await prisma.investment.create({
  data: {
    ticker: "JSWSTEEL",
    quantity: 213,
    avgBuyPrice: 793.48,
    totalInvestment: 169011.24,
    buyBelow: 777.61,
    currentPrice: 1130.53,
    status: "open",
    entryDate: new Date("2023-09-08"),
    remainingQty: 213,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2023-09-08"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Materials"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ICICIBANK",
    quantity: 147,
    avgBuyPrice: 533.99,
    totalInvestment: 78496.53,
    buyBelow: 523.31,
    currentPrice: 759.45,
    status: "open",
    entryDate: new Date("2025-05-13"),
    remainingQty: 147,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-05-13"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Finance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "M&M",
    quantity: 41,
    avgBuyPrice: 684.27,
    totalInvestment: 28055.07,
    buyBelow: 670.58,
    currentPrice: 969.77,
    status: "open",
    entryDate: new Date("2025-06-28"),
    remainingQty: 41,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-28"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Automobile"
  }
});

await prisma.investment.create({
  data: {
    ticker: "DMART",
    quantity: 684,
    avgBuyPrice: 733.25,
    totalInvestment: 501543.0,
    buyBelow: 718.59,
    currentPrice: 679.42,
    status: "open",
    entryDate: new Date("2025-02-09"),
    remainingQty: 684,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-02-09"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Retail"
  }
});

await prisma.investment.create({
  data: {
    ticker: "VEDL",
    quantity: 643,
    avgBuyPrice: 1389.81,
    totalInvestment: 893647.83,
    buyBelow: 1362.01,
    currentPrice: 1761.26,
    status: "open",
    entryDate: new Date("2025-07-21"),
    remainingQty: 643,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-07-21"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Metals"
  }
});

await prisma.investment.create({
  data: {
    ticker: "NTPC",
    quantity: 74,
    avgBuyPrice: 980.94,
    totalInvestment: 72589.56,
    buyBelow: 961.32,
    currentPrice: 1390.28,
    status: "open",
    entryDate: new Date("2025-06-25"),
    remainingQty: 74,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-25"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Utilities"
  }
});

await prisma.investment.create({
  data: {
    ticker: "HINDUNILVR",
    quantity: 955,
    avgBuyPrice: 1173.68,
    totalInvestment: 1120864.4,
    buyBelow: 1150.21,
    currentPrice: 1441.01,
    status: "open",
    entryDate: new Date("2025-01-08"),
    remainingQty: 955,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-01-08"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Consumer Goods"
  }
});

await prisma.investment.create({
  data: {
    ticker: "HINDALCO",
    quantity: 302,
    avgBuyPrice: 184.6,
    totalInvestment: 55749.2,
    buyBelow: 180.91,
    currentPrice: 173.08,
    status: "open",
    entryDate: new Date("2023-11-10"),
    remainingQty: 302,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2023-11-10"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Materials"
  }
});

await prisma.investment.create({
  data: {
    ticker: "GRASIM",
    quantity: 124,
    avgBuyPrice: 579.82,
    totalInvestment: 71897.68,
    buyBelow: 568.22,
    currentPrice: 634.02,
    status: "open",
    entryDate: new Date("2025-04-11"),
    remainingQty: 124,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-04-11"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Materials"
  }
});

await prisma.investment.create({
  data: {
    ticker: "MARUTI",
    quantity: 94,
    avgBuyPrice: 113.13,
    totalInvestment: 10634.22,
    buyBelow: 110.87,
    currentPrice: 139.58,
    status: "open",
    entryDate: new Date("2024-12-02"),
    remainingQty: 94,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-12-02"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Automobile"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ASIANPAINT",
    quantity: 677,
    avgBuyPrice: 1174.65,
    totalInvestment: 795238.05,
    buyBelow: 1151.16,
    currentPrice: 846.14,
    status: "open",
    entryDate: new Date("2024-05-17"),
    remainingQty: 677,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-05-17"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Consumer Goods"
  }
});

await prisma.investment.create({
  data: {
    ticker: "LICI",
    quantity: 978,
    avgBuyPrice: 1156.25,
    totalInvestment: 1130812.5,
    buyBelow: 1133.12,
    currentPrice: 1685.28,
    status: "open",
    entryDate: new Date("2024-09-26"),
    remainingQty: 978,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-09-26"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Insurance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "SBIN",
    quantity: 178,
    avgBuyPrice: 1163.26,
    totalInvestment: 207060.28,
    buyBelow: 1139.99,
    currentPrice: 917.64,
    status: "open",
    entryDate: new Date("2024-10-20"),
    remainingQty: 178,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-10-20"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Finance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "TATAMOTORS",
    quantity: 502,
    avgBuyPrice: 719.66,
    totalInvestment: 361269.32,
    buyBelow: 705.27,
    currentPrice: 541.14,
    status: "open",
    entryDate: new Date("2024-03-01"),
    remainingQty: 502,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Automobile"
  }
});

await prisma.investment.create({
  data: {
    ticker: "AAPL",
    quantity: 183,
    avgBuyPrice: 1026.61,
    totalInvestment: 187869.63,
    buyBelow: 1006.08,
    currentPrice: 1009.22,
    status: "open",
    entryDate: new Date("2024-09-10"),
    remainingQty: 183,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-09-10"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ULTRACEMCO",
    quantity: 130,
    avgBuyPrice: 563.54,
    totalInvestment: 73260.2,
    buyBelow: 552.27,
    currentPrice: 482.0,
    status: "open",
    entryDate: new Date("2025-06-29"),
    remainingQty: 130,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-29"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Materials"
  }
});

await prisma.investment.create({
  data: {
    ticker: "LT",
    quantity: 607,
    avgBuyPrice: 760.45,
    totalInvestment: 461593.15,
    buyBelow: 745.24,
    currentPrice: 738.55,
    status: "open",
    entryDate: new Date("2024-04-13"),
    remainingQty: 607,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-04-13"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Industrials"
  }
});

await prisma.investment.create({
  data: {
    ticker: "BHARTIARTL",
    quantity: 161,
    avgBuyPrice: 305.02,
    totalInvestment: 49108.22,
    buyBelow: 298.92,
    currentPrice: 456.71,
    status: "open",
    entryDate: new Date("2024-07-23"),
    remainingQty: 161,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-07-23"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Telecom"
  }
});

await prisma.investment.create({
  data: {
    ticker: "PAYTM",
    quantity: 80,
    avgBuyPrice: 86.08,
    totalInvestment: 6886.4,
    buyBelow: 84.36,
    currentPrice: 119.42,
    status: "open",
    entryDate: new Date("2024-10-03"),
    remainingQty: 80,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-10-03"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "POWERGRID",
    quantity: 750,
    avgBuyPrice: 468.7,
    totalInvestment: 351525.0,
    buyBelow: 459.33,
    currentPrice: 581.51,
    status: "open",
    entryDate: new Date("2025-07-10"),
    remainingQty: 750,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-07-10"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Utilities"
  }
});

await prisma.investment.create({
  data: {
    ticker: "INDUSINDBK",
    quantity: 891,
    avgBuyPrice: 1368.75,
    totalInvestment: 1219556.25,
    buyBelow: 1341.38,
    currentPrice: 1358.83,
    status: "open",
    entryDate: new Date("2025-06-06"),
    remainingQty: 891,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-06"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Finance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "HCLTECH",
    quantity: 526,
    avgBuyPrice: 175.1,
    totalInvestment: 92102.6,
    buyBelow: 171.6,
    currentPrice: 141.46,
    status: "open",
    entryDate: new Date("2024-08-18"),
    remainingQty: 526,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-08-18"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "RELIANCE",
    quantity: 981,
    avgBuyPrice: 775.62,
    totalInvestment: 760883.22,
    buyBelow: 760.11,
    currentPrice: 1000.27,
    status: "open",
    entryDate: new Date("2024-11-20"),
    remainingQty: 981,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-11-20"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Energy"
  }
});

await prisma.investment.create({
  data: {
    ticker: "INFY",
    quantity: 328,
    avgBuyPrice: 765.96,
    totalInvestment: 251234.88,
    buyBelow: 750.64,
    currentPrice: 820.02,
    status: "open",
    entryDate: new Date("2025-01-24"),
    remainingQty: 328,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-01-24"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "HEROMOTOCO",
    quantity: 327,
    avgBuyPrice: 113.9,
    totalInvestment: 37245.3,
    buyBelow: 111.62,
    currentPrice: 167.48,
    status: "open",
    entryDate: new Date("2024-03-09"),
    remainingQty: 327,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-03-09"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Automobile"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ADANIENT",
    quantity: 873,
    avgBuyPrice: 1285.46,
    totalInvestment: 1122206.58,
    buyBelow: 1259.75,
    currentPrice: 1065.33,
    status: "open",
    entryDate: new Date("2024-06-14"),
    remainingQty: 873,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-06-14"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Conglomerate"
  }
});

await prisma.investment.create({
  data: {
    ticker: "MSFT",
    quantity: 542,
    avgBuyPrice: 312.3,
    totalInvestment: 169266.6,
    buyBelow: 306.05,
    currentPrice: 426.8,
    status: "open",
    entryDate: new Date("2025-06-10"),
    remainingQty: 542,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-10"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "WIPRO",
    quantity: 333,
    avgBuyPrice: 765.69,
    totalInvestment: 254974.77,
    buyBelow: 750.38,
    currentPrice: 761.7,
    status: "open",
    entryDate: new Date("2025-06-17"),
    remainingQty: 333,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-17"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "BPCL",
    quantity: 439,
    avgBuyPrice: 774.63,
    totalInvestment: 340062.57,
    buyBelow: 759.14,
    currentPrice: 1126.64,
    status: "open",
    entryDate: new Date("2024-09-30"),
    remainingQty: 439,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-09-30"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Energy"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ITC",
    quantity: 926,
    avgBuyPrice: 805.12,
    totalInvestment: 745541.12,
    buyBelow: 789.02,
    currentPrice: 1179.35,
    status: "open",
    entryDate: new Date("2025-05-27"),
    remainingQty: 926,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-05-27"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Consumer Goods"
  }
});

await prisma.investment.create({
  data: {
    ticker: "DIVISLAB",
    quantity: 12,
    avgBuyPrice: 1037.61,
    totalInvestment: 12451.32,
    buyBelow: 1016.86,
    currentPrice: 955.65,
    status: "open",
    entryDate: new Date("2025-06-03"),
    remainingQty: 12,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-03"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Healthcare"
  }
});

await prisma.investment.create({
  data: {
    ticker: "CIPLA",
    quantity: 868,
    avgBuyPrice: 79.53,
    totalInvestment: 69032.04,
    buyBelow: 77.94,
    currentPrice: 97.73,
    status: "open",
    entryDate: new Date("2025-04-11"),
    remainingQty: 868,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-04-11"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Healthcare"
  }
});

await prisma.investment.create({
  data: {
    ticker: "EICHERMOT",
    quantity: 590,
    avgBuyPrice: 1114.24,
    totalInvestment: 657401.6,
    buyBelow: 1091.96,
    currentPrice: 1317.26,
    status: "open",
    entryDate: new Date("2024-12-21"),
    remainingQty: 590,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-12-21"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Automobile"
  }
});

await prisma.investment.create({
  data: {
    ticker: "IRCTC",
    quantity: 956,
    avgBuyPrice: 1226.45,
    totalInvestment: 1172486.2,
    buyBelow: 1201.92,
    currentPrice: 1152.52,
    status: "open",
    entryDate: new Date("2024-06-11"),
    remainingQty: 956,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-06-11"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Travel"
  }
});

await prisma.investment.create({
  data: {
    ticker: "NAUKRI",
    quantity: 939,
    avgBuyPrice: 846.55,
    totalInvestment: 794910.45,
    buyBelow: 829.62,
    currentPrice: 1035.8,
    status: "open",
    entryDate: new Date("2025-07-26"),
    remainingQty: 939,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2025-07-26"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "BAJAJ-AUTO",
    quantity: 744,
    avgBuyPrice: 356.83,
    totalInvestment: 265481.52,
    buyBelow: 349.69,
    currentPrice: 274.77,
    status: "open",
    entryDate: new Date("2025-03-15"),
    remainingQty: 744,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-03-15"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Automobile"
  }
});

await prisma.investment.create({
  data: {
    ticker: "GAIL",
    quantity: 55,
    avgBuyPrice: 185.95,
    totalInvestment: 10227.25,
    buyBelow: 182.23,
    currentPrice: 265.79,
    status: "open",
    entryDate: new Date("2024-09-12"),
    remainingQty: 55,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-09-12"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Energy"
  }
});

await prisma.investment.create({
  data: {
    ticker: "BRITANNIA",
    quantity: 637,
    avgBuyPrice: 349.21,
    totalInvestment: 222446.77,
    buyBelow: 342.23,
    currentPrice: 503.23,
    status: "open",
    entryDate: new Date("2024-02-01"),
    remainingQty: 637,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Consumer Goods"
  }
});

await prisma.investment.create({
  data: {
    ticker: "TCS",
    quantity: 86,
    avgBuyPrice: 1479.49,
    totalInvestment: 127236.14,
    buyBelow: 1449.9,
    currentPrice: 2150.83,
    status: "open",
    entryDate: new Date("2024-05-18"),
    remainingQty: 86,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-05-18"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ICICIGI",
    quantity: 189,
    avgBuyPrice: 593.2,
    totalInvestment: 112114.8,
    buyBelow: 581.34,
    currentPrice: 829.31,
    status: "open",
    entryDate: new Date("2025-01-16"),
    remainingQty: 189,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-01-16"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Insurance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "HDFCBANK",
    quantity: 826,
    avgBuyPrice: 1387.73,
    totalInvestment: 1146264.98,
    buyBelow: 1359.98,
    currentPrice: 1068.11,
    status: "open",
    entryDate: new Date("2024-06-29"),
    remainingQty: 826,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-06-29"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Finance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "SUNPHARMA",
    quantity: 286,
    avgBuyPrice: 474.08,
    totalInvestment: 135586.88,
    buyBelow: 464.6,
    currentPrice: 431.93,
    status: "open",
    entryDate: new Date("2025-06-21"),
    remainingQty: 286,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2025-06-21"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Healthcare"
  }
});

await prisma.investment.create({
  data: {
    ticker: "AXISBANK",
    quantity: 46,
    avgBuyPrice: 1304.52,
    totalInvestment: 60007.92,
    buyBelow: 1278.43,
    currentPrice: 1306.53,
    status: "open",
    entryDate: new Date("2024-10-28"),
    remainingQty: 46,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-10-28"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Finance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ONGC",
    quantity: 227,
    avgBuyPrice: 355.31,
    totalInvestment: 80655.37,
    buyBelow: 348.2,
    currentPrice: 499.52,
    status: "open",
    entryDate: new Date("2023-09-19"),
    remainingQty: 227,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2023-09-19"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "LARGE CAP",
    sector: "Energy"
  }
});

await prisma.investment.create({
  data: {
    ticker: "TITAN",
    quantity: 195,
    avgBuyPrice: 218.08,
    totalInvestment: 42525.6,
    buyBelow: 213.72,
    currentPrice: 195.92,
    status: "open",
    entryDate: new Date("2023-11-02"),
    remainingQty: 195,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2023-11-02"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Consumer Goods"
  }
});

await prisma.investment.create({
  data: {
    ticker: "COALINDIA",
    quantity: 917,
    avgBuyPrice: 736.68,
    totalInvestment: 675535.56,
    buyBelow: 721.95,
    currentPrice: 564.48,
    status: "open",
    entryDate: new Date("2024-06-08"),
    remainingQty: 917,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-06-08"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Energy"
  }
});

await prisma.investment.create({
  data: {
    ticker: "TECHM",
    quantity: 338,
    avgBuyPrice: 1211.53,
    totalInvestment: 409497.14,
    buyBelow: 1187.3,
    currentPrice: 1061.69,
    status: "open",
    entryDate: new Date("2024-04-01"),
    remainingQty: 338,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Technology"
  }
});

await prisma.investment.create({
  data: {
    ticker: "BAJFINANCE",
    quantity: 106,
    avgBuyPrice: 1053.69,
    totalInvestment: 111691.14,
    buyBelow: 1032.62,
    currentPrice: 1081.43,
    status: "open",
    entryDate: new Date("2024-07-29"),
    remainingQty: 106,
    isRecommended: true,
    notes: `Seeded record`,
    createdAt: new Date("2024-07-29"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Finance"
  }
});

await prisma.investment.create({
  data: {
    ticker: "ZOMATO",
    quantity: 600,
    avgBuyPrice: 770.48,
    totalInvestment: 462288.0,
    buyBelow: 755.07,
    currentPrice: 1070.85,
    status: "open",
    entryDate: new Date("2023-09-04"),
    remainingQty: 600,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2023-09-04"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "SMALL CAP",
    sector: "Retail"
  }
});

await prisma.investment.create({
  data: {
    ticker: "JSWSTEEL",
    quantity: 944,
    avgBuyPrice: 924.35,
    totalInvestment: 872586.4,
    buyBelow: 905.86,
    currentPrice: 1062.79,
    status: "open",
    entryDate: new Date("2024-06-24"),
    remainingQty: 944,
    isRecommended: false,
    notes: `Seeded record`,
    createdAt: new Date("2024-06-24"),
    updatedAt: new Date("2025-07-31"),
    marketCap: "MID CAP",
    sector: "Materials"
  }
});

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

