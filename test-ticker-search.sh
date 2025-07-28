#!/bin/bash

BASE_URL="http://localhost:8000/api"

echo "🔍 Testing Ticker Search API for Investment Page"
echo "================================================"

# Test 1: Basic ticker search
echo -e "\n📝 Test 1: Searching for 'AAPL'"
curl -s -X GET "${BASE_URL}/ticker/search-ticker?q=AAPL" | jq '.'

# Test 2: Search with partial query
echo -e "\n📝 Test 2: Searching for 'MICR' (partial Microsoft)"
curl -s -X GET "${BASE_URL}/ticker/search-ticker?q=MICR" | jq '.'

# Test 3: Get detailed ticker info
echo -e "\n📊 Test 3: Getting detailed info for AAPL"
curl -s -X GET "${BASE_URL}/ticker/ticker-info/AAPL" | jq '.'

# Test 4: Get current price
echo -e "\n💰 Test 4: Getting current price for AAPL"
curl -s -X GET "${BASE_URL}/ticker/current-price/AAPL" | jq '.'

# Test 5: Search for tech stocks
echo -e "\n🔍 Test 5: Searching for 'TESLA'"
curl -s -X GET "${BASE_URL}/ticker/search-ticker?q=TESLA" | jq '.'

# Test 6: Error handling - empty query
echo -e "\n❌ Test 6: Testing empty query (should return error)"
curl -s -X GET "${BASE_URL}/ticker/search-ticker?q=" | jq '.'

# Test 7: Error handling - invalid ticker
echo -e "\n❌ Test 7: Testing invalid ticker info (should return error)"
curl -s -X GET "${BASE_URL}/ticker/ticker-info/INVALIDTICKER123" | jq '.'

# Test 8: Create investment with ticker search integration
echo -e "\n🏗️ Test 8: Creating investment using searched ticker"
INVESTMENT_WITH_SEARCH=$(curl -s -X POST "${BASE_URL}/investments" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "AAPL",
    "buy_below": 180.00,
    "qty": 50,
    "buy_average": 175.25,
    "remark": "Added via ticker search",
    "investment_date": "2025-01-28",
    "investment_source": "Web Research"
  }')

echo "Investment creation response:"
echo "$INVESTMENT_WITH_SEARCH" | jq '.'

echo -e "\n✅ Ticker search API testing completed!"
echo "The frontend can now use these endpoints:"
echo "1. GET /api/ticker/search-ticker?q=QUERY - Search for tickers"
echo "2. GET /api/ticker/ticker-info/SYMBOL - Get detailed ticker info"
echo "3. GET /api/ticker/current-price/SYMBOL - Get current price"
