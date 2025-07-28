#!/bin/bash

BASE_URL="http://localhost:8000/api"

echo "📊 Testing Price Difference Calculations"
echo "========================================"

# Test 1: Create a recommendation with buy_below price
echo -e "\n📝 Test 1: Creating recommendation with buy_below price"
RECOMMENDATION=$(curl -s -X POST "${BASE_URL}/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "buy_below": 180.00,
    "sector": "Technology",
    "source": "Technical Analysis"
  }')

echo "Recommendation created:"
echo "$RECOMMENDATION" | jq '.'

# Test 2: Get all recommendations to see price differences
echo -e "\n📋 Test 2: Getting all recommendations with price differences"
curl -s -X GET "${BASE_URL}/recommendations" | jq '.data[] | {
  ticker: .ticker,
  buy_below: .buy_below,
  current_price: .current_price,
  difference: .difference,
  difference_percentage: .difference_percentage,
  added_on: .added_on,
  status: .status
}'

# Test 3: Create an investment
echo -e "\n💰 Test 3: Creating investment"
INVESTMENT=$(curl -s -X POST "${BASE_URL}/investments" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "buy_below": 175.00,
    "qty": 100,
    "buy_average": 177.50,
    "remark": "Testing price calculations",
    "investment_date": "2025-01-20",
    "investment_source": "API Test"
  }')

echo "Investment created:"
echo "$INVESTMENT" | jq '.'

# Test 4: Get all investments to see profit/loss calculations
echo -e "\n📊 Test 4: Getting all investments with profit/loss calculations"
curl -s -X GET "${BASE_URL}/investments" | jq '.data[] | {
  ticker: .ticker,
  qty: .qty,
  remaining_qty: .remaining_qty,
  buy_average: .buy_average,
  current_price: .current_price,
  difference: .difference,
  difference_percentage: .difference_percentage,
  profit_loss: .profit_loss,
  profit_loss_percentage: .profit_loss_percentage,
  total_profit_loss: .total_profit_loss,
  status: .status
}'

# Test 5: Create another recommendation with different buy_below to test variations
echo -e "\n📝 Test 5: Creating recommendation with higher buy_below price"
RECOMMENDATION2=$(curl -s -X POST "${BASE_URL}/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "MSFT",
    "buy_below": 450.00,
    "sector": "Technology",
    "source": "Fundamental Analysis"
  }')

echo "Second recommendation created:"
echo "$RECOMMENDATION2" | jq '.'

# Test 6: Get updated recommendations list
echo -e "\n📋 Test 6: Getting updated recommendations list"
curl -s -X GET "${BASE_URL}/recommendations" | jq '.data[] | {
  ticker: .ticker,
  buy_below: .buy_below,
  current_price: .current_price,
  difference: .difference,
  difference_percentage: .difference_percentage,
  note: (if .difference > 0 then "Good to buy - Below target price" else "Above target price" end)
}'

# Test 7: Create investment with different buy average
echo -e "\n💰 Test 7: Creating second investment with different parameters"
INVESTMENT2=$(curl -s -X POST "${BASE_URL}/investments" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "MSFT",
    "buy_below": 420.00,
    "qty": 50,
    "buy_average": 435.75,
    "remark": "Testing with MSFT",
    "investment_date": "2025-01-25",
    "investment_source": "Portfolio Diversification"
  }')

echo "Second investment created:"
echo "$INVESTMENT2" | jq '.'

# Test 8: Final investments summary
echo -e "\n📈 Test 8: Final investments with profit/loss analysis"
curl -s -X GET "${BASE_URL}/investments" | jq '.data[] | {
  ticker: .ticker,
  investment_amount: (.buy_average * .qty),
  current_value: (.current_price * (.remaining_qty // .qty)),
  total_profit_loss: .total_profit_loss,
  profit_loss_percentage: .profit_loss_percentage,
  status: (if .profit_loss_percentage > 0 then "📈 Profitable" else "📉 Loss" end)
}'

echo -e "\n✅ Price difference calculations testing completed!"
echo ""
echo "📊 Summary of new fields:"
echo "For Recommendations:"
echo "  - difference: buy_below - current_price (positive = good to buy)"
echo "  - difference_percentage: percentage difference"
echo "  - added_on: alias for created_date"
echo ""
echo "For Investments:"
echo "  - difference: current_price - buy_average (profit/loss per share)"
echo "  - difference_percentage: profit/loss percentage"
echo "  - profit_loss: same as difference (for clarity)"
echo "  - profit_loss_percentage: same as difference_percentage"  
echo "  - total_profit_loss: total profit/loss for remaining quantity"
