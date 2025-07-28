#!/bin/bash

BASE_URL="http://localhost:8000/api"

echo "🚀 Testing Recommendations and Investments API"
echo "=============================================="

# Test 1: Create a recommendation
echo -e "\n📝 Test 1: Creating a recommendation"
RECOMMENDATION=$(curl -s -X POST "${BASE_URL}/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "buy_below": 150.00,
    "current_price": 175.50,
    "sector": "Technology",
    "source": "Technical Analysis"
  }')

echo "Response: $RECOMMENDATION"

# Extract recommendation ID
REC_ID=$(echo $RECOMMENDATION | jq -r '.data.id' 2>/dev/null || echo "1")
echo "Recommendation ID: $REC_ID"

# Test 2: Get all recommendations
echo -e "\n📋 Test 2: Getting all recommendations"
curl -s -X GET "${BASE_URL}/recommendations" | jq '.'

# Test 3: Create an investment
echo -e "\n💰 Test 3: Creating an investment"
INVESTMENT=$(curl -s -X POST "${BASE_URL}/investments" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "buy_below": 150.00,
    "current_price": 175.50,
    "qty": 100,
    "buy_average": 148.75,
    "remark": "Strong technical setup",
    "investment_date": "2025-01-15",
    "investment_source": "Personal Research"
  }')

echo "Response: $INVESTMENT"

# Extract investment ID
INV_ID=$(echo $INVESTMENT | jq -r '.data.id' 2>/dev/null || echo "1")
echo "Investment ID: $INV_ID"

# Test 4: Get all investments
echo -e "\n📊 Test 4: Getting all investments"
curl -s -X GET "${BASE_URL}/investments" | jq '.'

# Test 5: Create a partial sell transaction
echo -e "\n💸 Test 5: Creating a partial sell transaction"
TRANSACTION=$(curl -s -X POST "${BASE_URL}/investments/${INV_ID}/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "Sell",
    "quantity": 25,
    "price": 180.00,
    "transaction_date": "2025-01-20",
    "reason_for_exit": "Taking profits at resistance"
  }')

echo "Response: $TRANSACTION"

# Test 6: Get investment with transactions
echo -e "\n🔍 Test 6: Getting investment with transactions"
curl -s -X GET "${BASE_URL}/investments/${INV_ID}" | jq '.'

# Test 7: Get investment summary
echo -e "\n📈 Test 7: Getting investment summary"
curl -s -X GET "${BASE_URL}/investments/summary" | jq '.'

# Test 8: Close more of the investment
echo -e "\n🔒 Test 8: Closing more of the investment"
CLOSE_RESPONSE=$(curl -s -X PATCH "${BASE_URL}/investments/${INV_ID}/close" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "price": 185.00,
    "reason_for_exit": "Stop loss hit",
    "transaction_date": "2025-01-22"
  }')

echo "Response: $CLOSE_RESPONSE"

# Test 9: Update recommendation
echo -e "\n✏️ Test 9: Updating recommendation"
UPDATE_REC=$(curl -s -X PUT "${BASE_URL}/recommendations/${REC_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "current_price": 182.50,
    "status": "active"
  }')

echo "Response: $UPDATE_REC"

# Test 10: Archive recommendation
echo -e "\n📦 Test 10: Archiving recommendation"
ARCHIVE_REC=$(curl -s -X PATCH "${BASE_URL}/recommendations/${REC_ID}/archive" \
  -H "Content-Type: application/json" \
  -d '{"archive": true}')

echo "Response: $ARCHIVE_REC"

echo -e "\n✅ API testing completed!"
echo "Check the responses above to verify functionality."
