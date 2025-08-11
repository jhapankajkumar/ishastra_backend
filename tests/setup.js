/**
 * Jest test setup file
 * Configures global test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';

// Mock console.log to reduce test output noise
global.console = {
  ...console,
  // Uncomment to suppress logs during testing
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set longer timeout for integration tests
jest.setTimeout(30000);
