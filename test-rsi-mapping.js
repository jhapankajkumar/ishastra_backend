// Test correct RSI mapping
const prices = [44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89,
               46.03, 46.83, 46.69, 46.45, 46.59, 46.3, 46.28, 46.28, 46.00, 46.03,
               46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 47.44, 47.02, 47.23];

console.log('Price analysis:');
console.log('Total prices:', prices.length);
console.log('Price changes:', prices.length - 1);
console.log('First RSI should be at quote index:', 14); // 15th price (index 14)

// For 30 prices:
// - 29 price changes
// - First 14 changes (indices 0-13) give us first RSI
// - This RSI belongs to quote at index 14
// - RSI array length should be 29 - 14 + 1 = 16

const expectedRSILength = prices.length - 14;
console.log('Expected RSI array length:', expectedRSILength);

// The mapping should be:
// rsi[0] -> quote[14]
// rsi[1] -> quote[15]
// ...
// rsi[15] -> quote[29]

console.log('\nCorrect mapping:');
for (let i = 14; i < prices.length; i++) {
  const rsiIndex = i - 14;
  console.log(`Quote[${i}] -> RSI[${rsiIndex}]`);
  if (i >= 16) break; // Just show first few
}
