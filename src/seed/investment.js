
import fs from 'fs';
import yahooFinance from 'yahoo-finance2';
import { fetch } from 'undici';
import { stringify } from 'querystring';

import { searchSymbol } from '../yahoo.js';

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

global.fetch = fetch;

const filePath = '/Users/pankajkumarjha/Development/Projects/Personal/ishastra/ishastra_backend/src/seed/investments.json';
const classifyMarketCap = (marketCapInCr) => {
    if (marketCapInCr >= 200000) return "LARGE CAP";
    if (marketCapInCr >= 5000) return "MID CAP";
    return "SMALL CAP";
};

const updateInvestments = async () => {
    // const raw = fs.readFileSync(filePath, 'utf-8');
    // const investments = JSON.parse(raw);
    // const filterInvestment = []
    // for (const inv of investments) {
    //     // const inv = investments[0]
    //     try {
    //         const stocks = await searchSymbol(`${inv.ticker}`);
    //         inv.sector = stocks[0]?.sectorDisp || 'Unknown';
    //         const quote = await yahooFinance.quote(`${inv.ticker}`);
    //         inv.currentPrice = quote.regularMarketPrice;
    //         const mcapInCr = quote.marketCap ? quote.marketCap / 1e7 : null; // ₹ conversion
    //         inv.marketCap = mcapInCr ? classifyMarketCap(mcapInCr) : inv.marketCap;
    //         const totalInvestedAmount = inv.quantity * inv.avgBuyPrice;
    //         inv.totalInvestment = totalInvestedAmount;
    //         //get buyBelow price
    //         const recommendation = await prisma.recommendation.findFirst({
    //             where: { ticker: inv.ticker }
    //         });
    //         inv.buyBelow = recommendation?.buyBelow || inv.buyBelow;

    //         if (!recommendation) {
    //             inv.isRecommended = false;
    //         }

    //         inv.notes = 'Regular Investment';

    //         const record = await prisma.investment.findFirst({
    //             where: { ticker: inv.ticker }
    //         });
    //         // if (!record) {
    //         //     console.warn(`No existing record found for ${inv.ticker}, skipping...`);
    //         //     continue;
    //         // } else {
    //         //     // //console.log('investment record found:', record);
    //         //     await prisma.investment.deleteMany({
    //         //         where: { id: record.id }
    //         //     });
    //         // }
            
    //         await prisma.investment.create({
    //             data: {
    //                 ticker: inv.ticker,
    //                 quantity: inv.quantity,
    //                 avgBuyPrice: inv.avgBuyPrice,
    //                 totalInvestment: inv.totalInvestment,
    //                 buyBelow: inv.buyBelow,
    //                 currentPrice: inv.currentPrice,
    //                 status: inv.status,
    //                 entryDate: new Date(inv.entryDate),
    //                 remainingQty: inv.quantity,
    //                 isRecommended: inv.isRecommended,
    //                 notes: inv.notes,
    //                 createdAt: new Date(inv.createdAt),
    //                 updatedAt: new Date(inv.updatedAt),
    //                 marketCap: inv.marketCap,
    //                 sector: inv.sector
    //             }
    //         });

    //         //console.log(`Updated ${inv.ticker}: currentPrice=${inv.currentPrice}, marketCap=${inv.marketCap}, sector=${inv.sector}`);
    //     } catch (e) {
    //         console.warn(`Failed to update ${inv.ticker}:`, e.message);
    //     }
    // }
    // const outputPath = './updated_investments.json';
    // fs.writeFileSync(outputPath, JSON.stringify(investments, null, 2));
    // //console.log('✅ File updated:', outputPath);
};

async function main() {
    await updateInvestments();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});