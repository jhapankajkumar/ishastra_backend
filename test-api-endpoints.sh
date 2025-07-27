#!/bin/bash

echo "🧪 Testing Partial Exit API Endpoints"
echo "====================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
BASE_URL="http://localhost:8000/api"

echo -e "\n${BLUE}1. First, let's create a fresh test trade...${NC}"

# Create a new trade for testing
curl -X POST "${BASE_URL}/trades" \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "TSLA",
    "direction": "Long",
    "entryDate": "2025-07-25",
    "entryOrderPrice": 250.00,
    "entryFilledShares": 200,
    "reasonForEntry": "Strong breakout above resistance",
    "setup": "Breakout"
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s

echo -e "\n${BLUE}2. Get all trades to find our test trade ID...${NC}"

# Get all trades
RESPONSE=$(curl -s "${BASE_URL}/trades")
echo $RESPONSE | jq '.'

# Extract the last trade ID (assuming it's our test trade)
TRADE_ID=$(echo $RESPONSE | jq -r '.[-1].id')
echo -e "\n${GREEN}Test Trade ID: $TRADE_ID${NC}"

if [ "$TRADE_ID" = "null" ] || [ -z "$TRADE_ID" ]; then
    echo -e "${RED}❌ Failed to create or find test trade${NC}"
    exit 1
fi

echo -e "\n${BLUE}3. Testing Partial Exit (50% of position)...${NC}"

# Test partial exit - 100 shares out of 200
curl -X PUT "${BASE_URL}/trades/${TRADE_ID}/partial-exit" \
  -H "Content-Type: application/json" \
  -d '{
    "exitDate": "2025-07-26",
    "exitOrderPrice": 275.00,
    "exitQuantity": 100,
    "reasonForExit": "Taking partial profit at 10% gain"
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s | jq '.'

echo -e "\n${BLUE}4. Check trade status after partial exit...${NC}"

# Get updated trade details
curl -s "${BASE_URL}/trades/${TRADE_ID}" | jq '.'

echo -e "\n${BLUE}5. Testing another partial exit (50 shares)...${NC}"

# Test another partial exit
curl -X PUT "${BASE_URL}/trades/${TRADE_ID}/partial-exit" \
  -H "Content-Type: application/json" \
  -d '{
    "exitDate": "2025-07-26",
    "exitOrderPrice": 280.00,
    "exitQuantity": 50,
    "reasonForExit": "Further profit taking"
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s | jq '.'

echo -e "\n${BLUE}6. Check trade status after second partial exit...${NC}"

# Get updated trade details
curl -s "${BASE_URL}/trades/${TRADE_ID}" | jq '.'

echo -e "\n${BLUE}7. Testing complete exit of remaining position...${NC}"

# Test complete exit of remaining 50 shares
curl -X PUT "${BASE_URL}/trades/${TRADE_ID}/exit" \
  -H "Content-Type: application/json" \
  -d '{
    "exitDate": "2025-07-26",
    "exitOrderPrice": 285.00,
    "exitQuantity": 50,
    "reasonForExit": "Closing remaining position"
  }' \
  -w "\nStatus Code: %{http_code}\n" \
  -s | jq '.'

echo -e "\n${BLUE}8. Final trade status check...${NC}"

# Get final trade details
curl -s "${BASE_URL}/trades/${TRADE_ID}" | jq '.'

echo -e "\n${BLUE}9. Get transaction history...${NC}"

# Get transaction history
curl -s "${BASE_URL}/trades/${TRADE_ID}/transactions" | jq '.'

echo -e "\n${GREEN}🎉 API Testing Complete!${NC}"
echo -e "${GREEN}✅ Check the responses above to verify partial exit functionality${NC}"
