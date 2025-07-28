# Recommendations and Investments API Documentation

## Overview
The API is now connected to the SQLite database via Prisma and supports both recommendations and investments with partial selling capabilities.

**Server:** http://localhost:8000

## Recommendations API

### Model Structure
```javascript
{
  id: number,
  ticker: string,
  buy_below: float (optional),
  current_price: float (optional),
  created_date: datetime,
  sector: string (optional),
  source: string (optional),
  status: string (default: "active"),
  updated_on: datetime
}
```

### Endpoints

#### GET /api/recommendations
Get all recommendations
- Query params: `status` (active/archived), `sector`

#### GET /api/recommendations/:id
Get single recommendation by ID

#### POST /api/recommendations
Create new recommendation
```json
{
  "ticker": "AAPL",
  "buy_below": 150.00,
  "current_price": 175.50,
  "sector": "Technology",
  "source": "Technical Analysis"
}
```

#### PUT /api/recommendations/:id
Update recommendation

#### DELETE /api/recommendations/:id
Delete recommendation

#### PATCH /api/recommendations/:id/archive
Archive/unarchive recommendation
```json
{
  "archive": true
}
```

## Investments API

### Model Structure
```javascript
{
  id: number,
  ticker: string,
  buy_below: float (optional),
  current_price: float (optional),
  qty: number,
  buy_average: float (optional),
  remark: string (optional),
  status: string (default: "open"),
  investment_date: datetime,
  exit_date: datetime (optional),
  remaining_qty: number (optional),
  investment_source: string (optional),
  created_at: datetime,
  updated_at: datetime,
  investment_transactions: array
}
```

### Endpoints

#### GET /api/investments
Get all investments with transactions
- Query params: `status` (open/closed), `ticker`

#### GET /api/investments/summary
Get investment summary statistics

#### GET /api/investments/:id
Get single investment with transactions by ID

#### POST /api/investments
Create new investment
```json
{
  "ticker": "AAPL",
  "buy_below": 150.00,
  "current_price": 175.50,
  "qty": 100,
  "buy_average": 148.75,
  "remark": "Strong technical setup",
  "investment_date": "2025-01-15",
  "investment_source": "Personal Research"
}
```

#### PUT /api/investments/:id
Update investment

#### DELETE /api/investments/:id
Delete investment (and all related transactions)

#### PATCH /api/investments/:id/close
Close investment (partial or full sell)
```json
{
  "quantity": 25,
  "price": 180.00,
  "reason_for_exit": "Taking profits at resistance",
  "transaction_date": "2025-01-20"
}
```

## Investment Transactions API

### Model Structure
```javascript
{
  id: number,
  investment_id: number,
  transaction_type: string, // "Buy" or "Sell"
  quantity: number,
  price: float,
  transaction_date: datetime,
  reason_for_exit: string (optional),
  created_at: datetime
}
```

### Endpoints

#### GET /api/investments/:investmentId/transactions
Get all transactions for an investment

#### POST /api/investments/:investmentId/transactions
Create new transaction (buy/sell)
```json
{
  "transaction_type": "Sell",
  "quantity": 25,
  "price": 180.00,
  "transaction_date": "2025-01-20",
  "reason_for_exit": "Taking profits at resistance"
}
```

## Key Features

### ✅ Independent Models
- Recommendations and investments are completely separate (no forced relationship)
- Each can be managed independently

### ✅ Partial Selling Support
- Multiple sell transactions per investment
- Automatic remaining quantity tracking
- Investment status updates (open → closed)

### ✅ Complete Transaction History
- All buy/sell transactions tracked
- Timestamps and reasons for exits
- Full audit trail

### ✅ Flexible Filtering
- Filter by status, ticker, sector
- Sort by dates
- Summary statistics

## Test Script
Run `./test-recommendations-investments.sh` to test all endpoints

## Database
- **Type:** SQLite with Prisma ORM
- **Location:** As configured in your .env file
- **Auto-generated:** Tables created via Prisma migrations
