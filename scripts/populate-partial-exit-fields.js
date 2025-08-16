const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function populatePartialExitFields() {
  try {
    //console.log('Starting to populate partial exit fields for existing trades...');
    
    // Get all trades that don't have remaining_quantity set
    const trades = await prisma.trade.findMany({
      where: {
        remaining_quantity: null
      }
    });

    //console.log(`Found ${trades.length} trades to update`);

    for (const trade of trades) {
      let status = 'Open';
      let remaining_quantity = trade.quantity;

      // If trade has exit_price and exit_date, it's already closed
      if (trade.exit_price && trade.exit_date) {
        status = 'Closed';
        remaining_quantity = 0;
      }

      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          remaining_quantity,
          status
        }
      });

      //console.log(`Updated trade ${trade.id} (${trade.ticker}): status=${status}, remaining_quantity=${remaining_quantity}`);
    }

    //console.log('Successfully populated partial exit fields for all existing trades');
  } catch (error) {
    console.error('Error populating partial exit fields:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populatePartialExitFields();
