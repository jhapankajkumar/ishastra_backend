# OHLC Test Fixtures

This directory contains comprehensive OHLC (Open, High, Low, Close) test fixtures for various market scenarios, along with a JavaScript helper to calculate technical indicators.

## 🎯 Quick Start

```javascript
// Load fixtures with technical indicators
const { getFixtureWithTechnicals } = require('./index');

const uptrend = getFixtureWithTechnicals('uptrendHighvol');
console.log(`Price: $${uptrend.technicals.latest.price}`);
console.log(`RSI: ${uptrend.technicals.latest.rsi}`);
```

## 📊 Available Fixtures

| Fixture | Scenario | Bars | Description |
|---------|----------|------|-------------|
| `uptrend_highvol.json` | Strong Uptrend | 83 | Strong uptrend with high volume confirmation |
| `pullback_weakmom.json` | Pullback | 66 | Market pullback with weakening momentum |
| `downtrend_below200.json` | Downtrend | 93 | Downtrend with price below 200-day EMA |
| `sideways_chop.json` | Sideways | 78 | Sideways, choppy market conditions |
| `pre_earnings.json` | Pre-earnings | 52 | Pre-earnings announcement volatility |
| `high_volatility.json` | High Vol | 61 | High volatility regime |
| `bear_regime.json` | Bear Market | 85 | Bear market regime conditions |
| `bull_regime.json` | Bull Market | 95 | Bull market regime conditions |

## 🔧 Technical Indicators

The `buildTechnicalFromOHLC.js` helper calculates:

- **EMA200** - 200-period Exponential Moving Average
- **RSI(14)** - 14-period Relative Strength Index  
- **ATR(14)** - 14-period Average True Range
- **ADX(14)** - 14-period Average Directional Index
- **Volume 20DMA** - 20-period volume moving average
- **MACD** - Moving Average Convergence Divergence
- **Bollinger Bands** - 20-period bands with 2σ
- **Support/Resistance** - Dynamic support and resistance levels

## 📈 Usage Examples

### Basic Usage
```javascript
const { buildTechnicalFromOHLC } = require('./buildTechnicalFromOHLC');
const uptrendFixture = require('./uptrend_highvol.json');

const technicals = buildTechnicalFromOHLC(uptrendFixture);
console.log(`Latest RSI: ${technicals.latest.rsi}`);
```

### Test Integration
```javascript
const { getFixtureWithTechnicals } = require('./index');

test('should detect uptrend conditions', () => {
  const data = getFixtureWithTechnicals('uptrendHighvol');
  
  expect(data.technicals.latest.price).toBeGreaterThan(data.technicals.latest.ema200);
  expect(data.technicals.latest.rsi).toBeGreaterThan(50);
  expect(data.bars).toBeGreaterThan(50);
});
```

### Batch Testing
```javascript
const { getFixtureNames, getFixtureWithTechnicals } = require('./index');

getFixtureNames().forEach(name => {
  const data = getFixtureWithTechnicals(name);
  console.log(`${name}: RSI = ${data.technicals.latest.rsi.toFixed(1)}`);
});
```

## 🏗️ Data Structure

Each fixture follows this structure:
```javascript
{
  "scenario": "Strong uptrend with high volume",
  "symbol": "TEST",
  "timeframe": "1D",
  "data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "o": 149.80,  // Open
      "h": 153.20,  // High  
      "l": 148.90,  // Low
      "c": 152.50,  // Close
      "v": 85000000 // Volume
    }
    // ... more bars
  ]
}
```

## 🧪 Verification

Run the verification script to test all fixtures:
```bash
node tests/fixtures/ohlc/verify.js
```

Run usage examples:
```bash
node tests/fixtures/ohlc/usage-examples.js
```

## 💡 Tips

1. **Use `getFixtureWithTechnicals()`** for ready-to-use data with calculated indicators
2. **Different scenarios** test different market conditions (uptrend, downtrend, sideways)
3. **All indicators** are calculated with realistic market data
4. **Volume data** is included for volume-based analysis
5. **Support/Resistance** levels are dynamically calculated from price action
