#!/bin/bash

# Elder's Triple Screen API Manual Testing Script
# Use this to test the API endpoints manually with curl

echo "🚀 ELDER'S TRIPLE SCREEN API MANUAL TESTING"
echo "============================================="

BASE_URL="http://localhost:8000"

echo ""
echo "📊 TEST 1: Multiple Stock Analysis"
echo "-----------------------------------"
curl -X POST "${BASE_URL}/api/trading/elder-triple-screen" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"],
    "capital": 100000
  }' | jq '.'

echo ""
echo ""
echo "🎯 TEST 2: Single Stock Analysis"
echo "--------------------------------"
curl -X POST "${BASE_URL}/api/trading/elder-triple-screen/single" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "capital": 50000
  }' | jq '.results[0] | {symbol, elderTripleScreen: {systemDecision, confidence, setupDetails}, finalDecision}'

echo ""
echo ""
echo "🎮 TEST 3: Demo Endpoint"
echo "-----------------------"
curl -X GET "${BASE_URL}/api/trading/elder-triple-screen/demo?capital=75000" | jq '.summary'

echo ""
echo ""
echo "🚨 TEST 4: Error Handling"
echo "-------------------------"
curl -X POST "${BASE_URL}/api/trading/elder-triple-screen" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": [],
    "capital": 100000
  }' | jq '.'

echo ""
echo "✅ Manual API Testing Complete!"
echo "================================"
