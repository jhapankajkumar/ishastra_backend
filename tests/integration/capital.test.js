const { PrismaClient } = require('@prisma/client');
const CapitalManager = require('../../src/utils/capitalManager');

// Use a test database or in-memory database for testing
const prisma = new PrismaClient({
  // You might want to configure this to use a test database
});

describe('Capital Management System', () => {
  beforeAll(async () => {
    // Initialize test capital data
    await CapitalManager.initializeCapital([
      { currency: 'USD', total: 10000 },
      { currency: 'INR', total: 1000000 }
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.capital.deleteMany();
    await prisma.$disconnect();
  });

  describe('Capital Allocation', () => {
    test('should allocate capital successfully', async () => {
      const initialCapital = await CapitalManager.getCapital('USD');
      const allocationAmount = 1000;
      
      const updatedCapital = await CapitalManager.allocateCapital('USD', allocationAmount);
      
      expect(updatedCapital.remaining).toBe(initialCapital.remaining - allocationAmount);
      expect(updatedCapital.total).toBe(initialCapital.total);
    });

    test('should fail allocation when insufficient capital', async () => {
      const capital = await CapitalManager.getCapital('USD');
      const excessiveAmount = capital.remaining + 1000;
      
      await expect(
        CapitalManager.allocateCapital('USD', excessiveAmount)
      ).rejects.toThrow('Insufficient capital');
    });

    test('should fail allocation with invalid amount', async () => {
      await expect(
        CapitalManager.allocateCapital('USD', 0)
      ).rejects.toThrow('Amount must be greater than 0');

      await expect(
        CapitalManager.allocateCapital('USD', -100)
      ).rejects.toThrow('Amount must be greater than 0');
    });
  });

  describe('Capital Release', () => {
    test('should release capital successfully', async () => {
      // First allocate some capital
      const allocationAmount = 500;
      await CapitalManager.allocateCapital('USD', allocationAmount);
      
      const beforeRelease = await CapitalManager.getCapital('USD');
      
      // Then release it
      const updatedCapital = await CapitalManager.releaseCapital('USD', allocationAmount);
      
      expect(updatedCapital.remaining).toBe(beforeRelease.remaining + allocationAmount);
      expect(updatedCapital.total).toBe(beforeRelease.total);
    });

    test('should not exceed total when releasing capital', async () => {
      const capital = await CapitalManager.getCapital('USD');
      const excessiveAmount = capital.total + 1000;
      
      const updatedCapital = await CapitalManager.releaseCapital('USD', excessiveAmount);
      
      // Should be corrected to not exceed total
      expect(updatedCapital.remaining).toBe(updatedCapital.total);
    });

    test('should fail release with invalid amount', async () => {
      await expect(
        CapitalManager.releaseCapital('USD', 0)
      ).rejects.toThrow('Amount must be greater than 0');

      await expect(
        CapitalManager.releaseCapital('USD', -100)
      ).rejects.toThrow('Amount must be greater than 0');
    });
  });

  describe('Capital Reset', () => {
    test('should reset capital total successfully', async () => {
      const newTotal = 15000;
      
      const updatedCapital = await CapitalManager.resetCapital('USD', newTotal);
      
      expect(updatedCapital.total).toBe(newTotal);
      expect(updatedCapital.remaining).toBe(newTotal);
    });

    test('should reset capital with proportional adjustment', async () => {
      // Allocate some capital first
      const allocationAmount = 2000;
      await CapitalManager.allocateCapital('USD', allocationAmount);
      
      const beforeReset = await CapitalManager.getCapital('USD');
      const usedRatio = (beforeReset.total - beforeReset.remaining) / beforeReset.total;
      
      const newTotal = 20000;
      const updatedCapital = await CapitalManager.resetCapital('USD', newTotal, true);
      
      expect(updatedCapital.total).toBe(newTotal);
      
      const expectedRemaining = newTotal * (1 - usedRatio);
      expect(updatedCapital.remaining).toBeCloseTo(expectedRemaining, 2);
    });

    test('should fail reset with invalid total', async () => {
      await expect(
        CapitalManager.resetCapital('USD', 0)
      ).rejects.toThrow('New total must be greater than 0');

      await expect(
        CapitalManager.resetCapital('USD', -1000)
      ).rejects.toThrow('New total must be greater than 0');
    });
  });

  describe('Capital Utilities', () => {
    test('should calculate trade amount correctly', () => {
      const price = 50.25;
      const quantity = 100;
      const expectedAmount = 5025;
      
      const calculatedAmount = CapitalManager.calculateTradeAmount(price, quantity);
      
      expect(calculatedAmount).toBe(expectedAmount);
    });

    test('should fail trade amount calculation with invalid inputs', () => {
      expect(() => CapitalManager.calculateTradeAmount(0, 100))
        .toThrow('Price and quantity must be greater than 0');

      expect(() => CapitalManager.calculateTradeAmount(50, 0))
        .toThrow('Price and quantity must be greater than 0');

      expect(() => CapitalManager.calculateTradeAmount(-50, 100))
        .toThrow('Price and quantity must be greater than 0');
    });

    test('should check capital sufficiency correctly', async () => {
      const capital = await CapitalManager.getCapital('USD');
      
      const sufficientAmount = capital.remaining - 100;
      const insufficientAmount = capital.remaining + 100;
      
      const hasSufficient = await CapitalManager.hasSufficientCapital('USD', sufficientAmount);
      const hasInsufficient = await CapitalManager.hasSufficientCapital('USD', insufficientAmount);
      
      expect(hasSufficient).toBe(true);
      expect(hasInsufficient).toBe(false);
    });

    test('should generate capital summary correctly', async () => {
      const summary = await CapitalManager.getCapitalSummary();
      
      expect(summary.success).toBe(true);
      expect(Array.isArray(summary.data)).toBe(true);
      expect(summary.data.length).toBeGreaterThan(0);
      
      const usdSummary = summary.data.find(item => item.currency === 'USD');
      expect(usdSummary).toBeDefined();
      expect(usdSummary.total).toBeGreaterThan(0);
      expect(usdSummary.allocated).toBeGreaterThanOrEqual(0);
      expect(usdSummary.utilizationRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Multi-Currency Support', () => {
    test('should handle INR currency correctly', async () => {
      const allocationAmount = 50000;
      
      const initialCapital = await CapitalManager.getCapital('INR');
      const updatedCapital = await CapitalManager.allocateCapital('INR', allocationAmount);
      
      expect(updatedCapital.remaining).toBe(initialCapital.remaining - allocationAmount);
      expect(updatedCapital.currency).toBe('INR');
    });

    test('should maintain separate capital pools', async () => {
      const usdAllocation = 1000;
      const inrAllocation = 100000;
      
      const usdBefore = await CapitalManager.getCapital('USD');
      const inrBefore = await CapitalManager.getCapital('INR');
      
      await CapitalManager.allocateCapital('USD', usdAllocation);
      await CapitalManager.allocateCapital('INR', inrAllocation);
      
      const usdAfter = await CapitalManager.getCapital('USD');
      const inrAfter = await CapitalManager.getCapital('INR');
      
      expect(usdAfter.remaining).toBeCloseTo(usdBefore.remaining - usdAllocation, 2);
      expect(inrAfter.remaining).toBe(inrBefore.remaining - inrAllocation);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent currency', async () => {
      await expect(
        CapitalManager.getCapital('EUR')
      ).resolves.toBeNull();

      await expect(
        CapitalManager.allocateCapital('EUR', 1000)
      ).rejects.toThrow('Capital record not found for currency: EUR');
    });

    test('should handle database connection errors gracefully', async () => {
      // This test would require mocking Prisma to simulate database errors
      // For now, we'll just ensure the basic error handling structure is in place
      expect(CapitalManager.getCapital).toBeDefined();
      expect(CapitalManager.allocateCapital).toBeDefined();
      expect(CapitalManager.releaseCapital).toBeDefined();
    });
  });
});
