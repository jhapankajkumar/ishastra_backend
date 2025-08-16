const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCapital() {
  try {
    //console.log('🌱 Starting capital seeding...');

    // Initial capital data
    const initialCapitals = [
      { currency: 'USD', total: 20000, remaining: 20000 },
      { currency: 'INR', total: 2000000, remaining: 2000000 }
    ];

    for (const capitalData of initialCapitals) {
      // Check if the capital record already exists
      const existingCapital = await prisma.capital.findFirst({
        where: { currency: capitalData.currency }
      });

      if (!existingCapital) {
        await prisma.capital.create({
          data: {
            currency: capitalData.currency,
            total: capitalData.total,
            remaining: capitalData.remaining,
          }
        });
        //console.log(`✅ Created ${capitalData.currency} capital: ${capitalData.total}`);
      } else {
        //console.log(`ℹ️  ${capitalData.currency} capital already exists with total: ${existingCapital.total}`);
      }
    }

    //console.log('✅ Capital seeding completed successfully');

    // Display current capital status
    const capitals = await prisma.capital.findMany({
      orderBy: { currency: 'asc' }
    });

    //console.log('\n📊 Current Capital Status:');
    console.table(capitals.map(c => ({
      Currency: c.currency,
      Total: c.total,
      Remaining: c.remaining,
      Allocated: c.total - c.remaining,
      'Utilization %': ((c.total - c.remaining) / c.total * 100).toFixed(2)
    })));

  } catch (error) {
    console.error('❌ Error seeding capital:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedCapital()
    .catch((error) => {
      console.error('❌ Capital seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedCapital };
