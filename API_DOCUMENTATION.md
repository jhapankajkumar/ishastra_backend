# Ishastra Backend API Documentation

## Overview
Comprehensive REST API for Ishastra Trading Platform with multi-system stock analysis, intelligent watchlist management, capital tracking, and portfolio management.

## Features
- **Multi-System Trading Analysis**: Elder Triple Screen, Minervini SEPA, Cup-with-Handle, RSI Mean Reversion, MACD Divergence
- **Dynamic Market Detection**: Automatic currency and market detection (US/USD, Indian/INR)
- **Professional Watchlist Management**: Institutional-grade filtering and automated updates
- **Capital Management**: Multi-currency capital tracking and position sizing
- **Portfolio Management**: Investments, trades, and recommendations tracking

## Base URL
- **Local Development**: `http://localhost:8000`
- **API Version**: `v2.0.0`

## Postman Collections

### Import Instructions
1. Import `Ishastra_Backend_API.postman_collection.json` into Postman
2. Import `Ishastra_Local_Environment.postman_environment.json` for environment variables
3. Select the "Ishastra Local" environment in Postman
4. Start testing the APIs

## API Endpoints

### 🔐 Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login (returns JWT token) |

### 📊 Trading System Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trading/signal-analysis` | Multi-system stock analysis |
| GET | `/api/trading/demo` | Demo analysis with pre-selected stocks |

**Key Features:**
- Supports US stocks (AAPL, MSFT) and Indian stocks (RELIANCE.NS, TCS.BO)
- Automatic currency detection (USD for US, INR for Indian)
- Professional position sizing based on market-specific capital
- Multiple trading systems integration

**Example Usage:**
```bash
# US Stocks
GET /api/trading/signal-analysis?symbols=AAPL,MSFT,GOOGL

# Indian Stocks  
GET /api/trading/signal-analysis?symbols=RELIANCE.NS,TCS.BO,INFY.NS

# Specific Systems
GET /api/trading/signal-analysis?symbols=AAPL&systems=elder_triple_screen,sepa_method
```

### 👁️ Watchlist Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/watchlist` | Get watchlist with filtering |
| GET | `/api/watchlist/stats` | Watchlist statistics |
| GET | `/api/watchlist/by-grade` | Stocks grouped by grade |
| GET | `/api/watchlist/:symbol` | Get specific stock details |
| POST | `/api/watchlist/populate` | Auto-populate watchlist |
| POST | `/api/watchlist/analyze/:symbol` | Analyze and add stock |
| POST | `/api/watchlist/update-now` | Manual update trigger |
| PUT | `/api/watchlist/:symbol/status` | Update stock status |
| DELETE | `/api/watchlist/:symbol` | Remove from watchlist |
| POST | `/api/watchlist/cleanup` | Clean old entries |

**Professional Filtering:**
```json
{
  "useProfessionalFiltering": true,
  "maxWatchlistSize": 15,
  "requireMinimumScore": 100,
  "symbols": ["AAPL", "MSFT", "RELIANCE.NS"]
}
```

### 💰 Capital Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/capital` | Get all capital information |
| GET | `/api/capital/:currency` | Get capital for specific currency |
| GET | `/api/capital/check` | Check capital availability |
| POST | `/api/capital/initialize` | Initialize capital records |
| PUT | `/api/capital/:currency` | Update capital |

**Supported Currencies:**
- **USD**: US Dollar for US market stocks
- **INR**: Indian Rupee for Indian market stocks (.NS, .BO)

### 💼 Investments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/investments` | Get all investments |
| GET | `/api/investments/summary` | Investment summary |
| GET | `/api/investments/:id` | Get investment by ID |
| POST | `/api/investments` | Create investment |
| PUT | `/api/investments/:id` | Update investment |
| PATCH | `/api/investments/:id/close` | Close investment |
| DELETE | `/api/investments/:id` | Delete investment |

### 📈 Trades
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trades` | Get all trades |
| GET | `/api/trades/dashboard/summary` | Dashboard summary |
| POST | `/api/trades` | Create new trade |

### 💡 Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get all recommendations |
| GET | `/api/recommendations/:id` | Get recommendation by ID |
| POST | `/api/recommendations` | Create recommendation |
| PUT | `/api/recommendations/:id` | Update recommendation |
| PATCH | `/api/recommendations/:id/archive` | Archive recommendation |
| DELETE | `/api/recommendations/:id` | Delete recommendation |

### 📊 Market Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market/indices` | Get market indices |

### 🔍 Yahoo Finance Utilities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/yahoo/search?q=AAPL` | Search symbols |
| GET | `/api/yahoo/price?symbol=AAPL` | Get current price |

## Market Detection Logic

### Symbol Patterns
- **US Market**: No suffix → `USD` currency, `US` market
- **Indian NSE**: `.NS` suffix → `INR` currency, `IN` market  
- **Indian BSE**: `.BO` suffix → `INR` currency, `IN` market

### Examples
```javascript
'AAPL'        → { market: 'US', currency: 'USD', exchange: 'NASDAQ' }
'RELIANCE.NS' → { market: 'IN', currency: 'INR', exchange: 'NSE' }
'TCS.BO'      → { market: 'IN', currency: 'INR', exchange: 'BSE' }
```

## Response Formats

### Trading Analysis Response
```json
{
  "success": true,
  "timestamp": "2025-08-17T10:30:00Z",
  "results": [
    {
      "symbol": "AAPL",
      "currentPrice": 150.25,
      "decision": {
        "action": "BUY",
        "confidence": 85,
        "grade": "A",
        "reasoning": "Strong Elder Triple Screen setup with SEPA confirmation"
      },
      "execution": {
        "entry": 150.25,
        "stop": 145.50,
        "target1": 160.00,
        "target2": 170.00,
        "riskReward": 2.1,
        "positionSize": {
          "shares": 147,
          "value": 22087,
          "riskPercentage": "2.0%",
          "market": "US",
          "currency": "USD"
        }
      },
      "systems": {
        "elderTripleScreen": {
          "decision": "BUY",
          "confidence": 0.87,
          "grade": "A"
        },
        "minerviniSEPA": {
          "decision": "BUY", 
          "confidence": 0.83,
          "grade": "B+"
        }
      }
    }
  ]
}
```

### Watchlist Response
```json
{
  "stocks": [
    {
      "symbol": "AAPL",
      "currentPrice": 150.25,
      "decisionAction": "BUY",
      "decisionGrade": "A",
      "decisionConfidence": 85,
      "market": "US",
      "currency": "USD",
      "priority": 1,
      "status": "ACTIVE",
      "addedAt": "2025-08-17T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting
- **Trading Analysis**: 10 requests per minute
- **Watchlist Operations**: 20 requests per minute
- **General APIs**: 100 requests per minute

## Error Handling
All endpoints return consistent error formats:
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "timestamp": "2025-08-17T10:30:00Z"
}
```

## Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **404**: Not Found
- **429**: Rate Limited
- **500**: Internal Server Error

## Getting Started

1. **Import Postman Collection**: Import both the collection and environment files
2. **Start Server**: `npm start` (runs on port 8000)
3. **Initialize Capital**: Use the capital initialization endpoint
4. **Test Analysis**: Try the demo endpoint first
5. **Populate Watchlist**: Use professional filtering for best results

## Support
For API support or questions, please refer to the backend documentation or contact the development team.

---
**Version**: 2.0.0  
**Last Updated**: August 17, 2025  
**Environment**: Node.js + Express + Prisma + PostgreSQL
