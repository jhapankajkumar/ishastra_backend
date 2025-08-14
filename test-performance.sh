#!/bin/bash

# Performance Test Script for Trading System API
# Tests the optimized endpoints for speed improvements

echo "🚀 Trading System API Performance Test"
echo "======================================"

# Check if server is running
echo "📡 Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running. Please start the server first."
    echo "💡 Run: npm start or node src/server.js"
    exit 1
fi

echo ""
echo "🧪 Running Performance Tests..."
echo ""

# Test Fast Endpoint (Target: <1 second)
echo "⚡ Testing FAST endpoint (/stock-analysis/fast)..."
echo "📊 Target: <1000ms"
echo ""

FAST_START=$(date +%s%3N)
FAST_RESPONSE=$(curl -s -w "%{http_code},%{time_total}" -X POST \
  http://localhost:3000/api/trading/stock-analysis/fast \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "MSFT", "GOOGL"],
    "capital": 100000
  }')
FAST_END=$(date +%s%3N)

FAST_HTTP_CODE=$(echo $FAST_RESPONSE | cut -d',' -f1)
FAST_TIME=$(echo $FAST_RESPONSE | cut -d',' -f2)
FAST_DURATION=$((FAST_END - FAST_START))

if [ "$FAST_HTTP_CODE" = "200" ]; then
    echo "✅ Fast endpoint SUCCESS"
    echo "⏱️  Response Time: ${FAST_DURATION}ms"
    if [ "$FAST_DURATION" -lt 1000 ]; then
        echo "🎯 TARGET MET: Sub-1-second response achieved!"
    else
        echo "⚠️  TARGET MISSED: Response took ${FAST_DURATION}ms (target: <1000ms)"
    fi
else
    echo "❌ Fast endpoint FAILED (HTTP $FAST_HTTP_CODE)"
fi

echo ""
echo "================================================"
echo ""

# Test Original Endpoint (Should be optimized)
echo "🔧 Testing ORIGINAL endpoint (/stock-analysis)..."
echo "📊 Previous: ~5-10 seconds, Target: <3 seconds"
echo ""

ORIG_START=$(date +%s%3N)
ORIG_RESPONSE=$(curl -s -w "%{http_code},%{time_total}" -X POST \
  http://localhost:3000/api/trading/stock-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["AAPL", "MSFT"],
    "capital": 100000
  }')
ORIG_END=$(date +%s%3N)

ORIG_HTTP_CODE=$(echo $ORIG_RESPONSE | cut -d',' -f1)
ORIG_TIME=$(echo $ORIG_RESPONSE | cut -d',' -f2)
ORIG_DURATION=$((ORIG_END - ORIG_START))

if [ "$ORIG_HTTP_CODE" = "200" ]; then
    echo "✅ Original endpoint SUCCESS"
    echo "⏱️  Response Time: ${ORIG_DURATION}ms"
    
    # Calculate improvement
    BASELINE=8000  # 8 seconds baseline
    IMPROVEMENT=$(((BASELINE - ORIG_DURATION) * 100 / BASELINE))
    echo "📈 Improvement: ${IMPROVEMENT}% faster than baseline (8s)"
    
    if [ "$ORIG_DURATION" -lt 3000 ]; then
        echo "🎯 OPTIMIZATION SUCCESS: Sub-3-second response achieved!"
    else
        echo "⚠️  NEEDS MORE WORK: Response took ${ORIG_DURATION}ms (target: <3000ms)"
    fi
else
    echo "❌ Original endpoint FAILED (HTTP $ORIG_HTTP_CODE)"
fi

echo ""
echo "📊 PERFORMANCE SUMMARY"
echo "======================"

if [ "$FAST_HTTP_CODE" = "200" ] && [ "$ORIG_HTTP_CODE" = "200" ]; then
    SPEEDUP=$((ORIG_DURATION / FAST_DURATION))
    echo "⚡ Fast Endpoint: ${FAST_DURATION}ms"
    echo "🔧 Original Endpoint: ${ORIG_DURATION}ms"
    echo "🚀 Speed Improvement: ${SPEEDUP}x faster"
    
    echo ""
    echo "💡 RECOMMENDATIONS:"
    if [ "$FAST_DURATION" -lt 1000 ]; then
        echo "   ✅ Use /stock-analysis/fast for real-time trading"
    else
        echo "   ⚠️  Fast endpoint needs more optimization"
    fi
    
    if [ "$ORIG_DURATION" -lt 5000 ]; then
        echo "   ✅ Use /stock-analysis for comprehensive analysis"
    else
        echo "   ⚠️  Original endpoint still too slow"
    fi
else
    echo "❌ One or both endpoints failed - check server logs"
fi

echo ""
echo "🔗 Next Steps:"
echo "   • Test with different symbol counts"
echo "   • Monitor performance under load"  
echo "   • Check server logs for bottlenecks"
echo "   • Consider caching strategies"
