#!/bin/bash

# EMERGENCY REFACTOR SCRIPT
# Run this to compare simple vs complex system performance

echo "🚨 MAYDAY REFACTOR - System Comparison Test 🚨"
echo "=============================================="

# Test symbols for comparison
SYMBOLS=("AAPL" "MSFT" "NVDA" "TSLA" "GOOGL")

echo "Testing Simple vs Complex System Performance..."

for symbol in "${SYMBOLS[@]}"; do
    echo ""
    echo "📊 Testing $symbol..."
    
    # Time the simple system
    echo "⚡ Simple System:"
    time node -e "
        const simple = require('./src/controllers/ai/stock.simple.controller.js');
        simple.getSimpleAnalysisDirect('$symbol').then(result => {
            console.log('Decision:', result.decision, 'Confidence:', result.confidence + '%');
        }).catch(console.error);
    "
    
    echo ""
    echo "🐌 Complex System:"
    # Time the complex system  
    time node -e "
        const complex = require('./src/controllers/ai/stock.expert.controller.js');
        complex.getAnalysisDirect('$symbol').then(result => {
            console.log('Decision:', result.analysis?.expertDecision?.finalDecision?.action, 
                       'Confidence:', Math.round(result.analysis?.expertDecision?.finalDecision?.confidence * 100) + '%');
        }).catch(console.error);
    "
    
    echo "----------------------------------------"
done

echo ""
echo "🎯 HYPOTHESIS TO TEST:"
echo "Simple system should be:"
echo "  - 10x faster execution"
echo "  - Clearer decision logic"
echo "  - Same or better accuracy"
echo "  - Easier to debug/trust"
echo ""
echo "🔥 RECOMMENDATION: Run 30-day paper trading comparison"
echo "   Simple vs Complex on same symbols daily"
