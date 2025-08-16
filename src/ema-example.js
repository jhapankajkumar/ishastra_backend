/**
 * Example: Calculate EMAs from historical stock data
 */

const { addTechnicalIndicators, getLatestEMAValues } = require('./utils/technicalIndicators');

// Sample historical data (your example)
const sampleQuotes = [
  {
    date: new Date("2021-01-01T00:00:00.000Z"),
    open: 800,
    high: 820,
    low: 795,
    close: 810,
    adjClose: 810,
    volume: 20000000
  },
  {
    date: new Date("2021-02-01T00:00:00.000Z"),
    open: 814.289978,
    high: 842,
    low: 795.559998,
    close: 839.809998,
    adjClose: 839.809998,
    volume: 25391400
  },
  {
    date: new Date("2021-02-02T00:00:00.000Z"),
    open: 844.679993,
    high: 880.5,
    low: 842.200623,
    close: 872.789978,
    adjClose: 872.789978,
    volume: 24346213
  }
  // Note: You need at least 50 data points for 50-day EMA
  // Add more historical data for accurate calculations
];

// For demonstration with limited data, let's create a longer dataset
function generateSampleData(days = 60) {
  const data = [];
  let price = 800;
  
  for (let i = 0; i < days; i++) {
    const date = new Date("2021-01-01T00:00:00.000Z");
    date.setDate(date.getDate() + i);
    
    // Simulate price movement
    const change = (Math.random() - 0.5) * 20; // Random change -10 to +10
    price += change;
    
    const high = price + Math.random() * 10;
    const low = price - Math.random() * 10;
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);
    
    data.push({
      date: date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      adjClose: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 15000000
    });
  }
  
  return data;
}

// Example usage
//console.log('=== EMA Calculation Example ===\n');

// Generate sample data with enough points for 50-day EMA
const historicalData = generateSampleData(60);

// Calculate technical indicators
const result = addTechnicalIndicators(historicalData);

//console.log('Sample of quotes with EMAs:');
//console.log('Date\t\t\tClose\t\tEMA20\t\tEMA50\t\tSMA20\t\tSMA50');
//console.log('='.repeat(90));

// Show last 10 days with indicators
result.quotes.slice(-10).forEach(quote => {
  const date = quote.date.toISOString().split('T')[0];
  const close = quote.close.toFixed(2).padStart(8);
  const ema20 = quote.ema20 ? quote.ema20.toFixed(2).padStart(8) : 'N/A'.padStart(8);
  const ema50 = quote.ema50 ? quote.ema50.toFixed(2).padStart(8) : 'N/A'.padStart(8);
  const sma20 = quote.sma20 ? quote.sma20.toFixed(2).padStart(8) : 'N/A'.padStart(8);
  const sma50 = quote.sma50 ? quote.sma50.toFixed(2).padStart(8) : 'N/A'.padStart(8);
  
  //console.log(`${date}\t${close}\t\t${ema20}\t\t${ema50}\t\t${sma20}\t\t${sma50}`);
});

// Get latest values
const latestValues = getLatestEMAValues(historicalData);
//console.log('\n=== Latest EMA Values ===');
//console.log(`Date: ${latestValues.date.toISOString().split('T')[0]}`);
//console.log(`Current Price: $${latestValues.price}`);
//console.log(`20-day EMA: $${latestValues.ema20}`);
//console.log(`50-day EMA: $${latestValues.ema50}`);
//console.log(`20-day SMA: $${latestValues.sma20}`);
//console.log(`50-day SMA: $${latestValues.sma50}`);

// Trend analysis
if (latestValues.ema20 && latestValues.ema50) {
  //console.log('\n=== Trend Analysis ===');
  if (latestValues.ema20 > latestValues.ema50) {
    //console.log('📈 Bullish trend (EMA20 > EMA50)');
  } else {
    //console.log('📉 Bearish trend (EMA20 < EMA50)');
  }
  
  if (latestValues.price > latestValues.ema20) {
    //console.log('🟢 Price above 20-day EMA (Short-term bullish)');
  } else {
    //console.log('🔴 Price below 20-day EMA (Short-term bearish)');
  }
}

module.exports = { sampleQuotes, generateSampleData };
