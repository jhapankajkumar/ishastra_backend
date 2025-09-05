/**
 * 🧪 EMAIL FORMAT TESTING SCRIPT
 * 
 * Tests all 3 email alert        const newlyMetTriggers = [
            {
                type: 'VOLUME_SURGE',
                current: 2500000,
                threshold: 2000000,
                met: true
            },
            {
                type: 'BREAKOUT_LEVEL', 
                current: 2456.75,
                threshold: 2450,
                met: true
            }
        ];

        const mockEntryTriggerDetails = {
            newlyMetTriggers: newlyMetTriggers,
            allTriggers: [
                '• Volume Surge: 2,500,000 (threshold: 2,000,000) ✅ NEW',
                '• Price Breakout: ₹2456.75 (breakout: ₹2450.00) ✅ NEW', 
                '• Candle Strength: 78.7% (threshold: 63.3%) ✅',
                '• Momentum Signal: 3.2% (threshold: 2.5%) ❌'
            ],
            totalProgress: '3/4 triggers met',
            newlyActivated: '2 new trigger(s) activated',
            entryZone: { min: 2450, max: 2470 },
            stopLoss: 2350
        };

        // Update mock stock to include properly formatted details
        mockStock.execution.entryStrategy.triggerConditions = [
            {
                type: 'VOLUME_SURGE',
                current: 2500000,
                threshold: 2000000,
                met: true
            },
            {
                type: 'BREAKOUT_LEVEL',
                current: 2456.75,
                threshold: 2450,
                met: true
            },
            {
                type: 'CANDLE_STRENGTH',
                current: 78.7,
                threshold: 63.3,
                met: true
            },
            {
                type: 'MOMENTUM_SIGNAL',
                current: 3.2,
                threshold: 2.5,
                met: false
            }
        ];

        // Create proper alert data for entry trigger
        const entryAlertData = {
            type: 'ENTRY_TRIGGER',
            priority: 'HIGH',
            symbol: 'RELIANCE',
            currentPrice: 2456.75,
            action: 'BUY',
            confidence: 85,
            grade: 'A+',
            message: 'Strong momentum building - 3 of 3 entry conditions met',
            details: mockEntryTriggerDetails,
            timestamp: new Date()
        };

        await emailService.sendAlert(entryAlertData);Entry Trigger Alerts (Watchlist)
 * 2. Position Alerts
 * 3. Batched Combined Alerts
 */

const WatchlistTriggerService = require('./src/services/watchlist.trigger.service');
const EmailService = require('./src/services/email.service');

async function testEmailFormats() {
    console.log('🧪 TESTING ALL EMAIL FORMATS...\n');

    try {
        const watchlistService = new WatchlistTriggerService();
        const emailService = new EmailService();

        // ===================================================
        // 🎯 TEST 1: ENTRY TRIGGER EMAIL
        // ===================================================
        console.log('📧 TEST 1: Entry Trigger Email Format');
        console.log('=====================================');

        const mockStock = {
            symbol: 'RELIANCE',
            currentPrice: 2456.75,
            decision: JSON.stringify({
                action: 'BUY',
                confidence: 85,
                grade: 'A+'
            }),
            execution: {
                entryStrategy: {
                    entryZone: {
                        min: 2450,
                        max: 2470
                    },
                    triggerConditions: [
                        {
                            type: 'VOLUME_SURGE',
                            current: 2500000,
                            threshold: 2000000,
                            met: true
                        },
                        {
                            type: 'BREAKOUT_LEVEL',
                            current: 2456.75,
                            threshold: 2450,
                            met: true
                        },
                        {
                            type: 'MOMENTUM_ACCELERATION',
                            current: 3.2,
                            threshold: 2.5,
                            met: false
                        }
                    ]
                },
                exitStrategy: {
                    stopLoss: {
                        initial: 2350
                    }
                }
            }
        };

        const newlyMetTriggers = [
            {
                type: 'VOLUME_SURGE',
                current: 2500000,
                threshold: 2000000,
                met: true
            },
            {
                type: 'BREAKOUT_LEVEL',
                current: 2456.75,
                threshold: 2450,
                met: true
            }
        ];

        // Create alert data with proper details structure
        const entryTriggerAlert = {
            type: 'ENTRY_TRIGGER',
            priority: 'HIGH',
            symbol: 'RELIANCE',
            currentPrice: 2456.75,
            action: 'BUY',
            confidence: 85,
            grade: 'A+',
            message: 'Entry triggers activated for RELIANCE',
            timestamp: new Date(),
            details: {
                newlyMetTriggers: newlyMetTriggers,
                allTriggers: [
                    '• Volume Surge: 2,500,000 (threshold: 2,000,000) ✅ NEW',
                    '• Price Breakout: ₹2456.75 (breakout: ₹2450.00) ✅ NEW',
                    '• Momentum Acceleration: 3.2% (threshold: 2.5%) ❌'
                ],
                totalProgress: '2/3 triggers met',
                newlyActivated: '2 new trigger(s) activated',
                entryZone: { min: 2450, max: 2470 },
                stopLoss: 2350
            }
        };

        await emailService.sendAlert(entryTriggerAlert);
        console.log('✅ Entry trigger email test completed\n');

        // ===================================================
        // 📊 TEST 2: POSITION ALERT EMAIL
        // ===================================================
        console.log('📧 TEST 2: Position Alert Email Format');
        console.log('======================================');

        const positionAlertData = {
            type: 'POSITION_ALERT',
            priority: 'HIGH',
            symbol: 'TATASTEEL',
            currentPrice: 145.80,
            action: 'TARGET_HIT',
            message: 'First target reached for TATASTEEL position',
            confidence: null, // Position alerts don't need confidence
            grade: null,     // Position alerts don't need grade
            details: {
                entryPrice: 138.50,
                targetPrice: 145.00,
                stopLoss: 132.00,
                quantity: 100,
                pnlPercent: 5.27,
                pnlAmount: 730,
                targetLevel: 'T1',
                recommendation: 'Book 50% profits, trail stop to entry'
            },
            timestamp: new Date()
        };

        await emailService.sendAlert(positionAlertData);
        console.log('✅ Position alert email test completed\n');

        // ===================================================
        // 📧 TEST 3: BATCHED ALERT EMAIL
        // ===================================================
        console.log('📧 TEST 3: Batched Alert Email Format');
        console.log('=====================================');

        const batchedAlertData = {
            type: 'BATCHED_TRADING_ALERTS',
            symbol: 'MULTIPLE',
            priority: 'HIGH',
            message: 'Combined trading alerts summary with 3 signals',
            batchCount: 3,
            details: {
                alertsList: [
                    'RELIANCE: BUY Signal - Entry Triggers Met',
                    'TATASTEEL: Target Hit - Book Profits',
                    'HDFCBANK: Stop Loss Hit - Exit Position'
                ],
                summary: {
                    entryTriggers: 1,
                    positionAlerts: 2,
                    totalSignals: 3
                }
            },
            timestamp: new Date()
        };

        await emailService.sendAlert(batchedAlertData);
        console.log('✅ Batched alert email test completed\n');

        // ===================================================
        // 🎯 TEST 4: WATCHLIST SERVICE DIRECT TEST
        // ===================================================
        console.log('📧 TEST 4: Direct Watchlist Service Test');
        console.log('========================================');

        // Test the actual service method with correct parameters
        await watchlistService.sendEntryTriggerAlert(mockStock, newlyMetTriggers);
        console.log('✅ Direct watchlist service test completed\n');

        console.log('🎉 ALL EMAIL FORMAT TESTS COMPLETED!');
        console.log('Check your email inbox for 4 test emails:');
        console.log('  1️⃣  Entry Trigger Alert (RELIANCE)');
        console.log('  2️⃣  Position Alert (TATASTEEL)');
        console.log('  3️⃣  Batched Alert Summary');
        console.log('  4️⃣  Direct Service Test (RELIANCE)');

    } catch (error) {
        console.error('❌ Email format test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testEmailFormats().then(() => {
    console.log('\n🔚 Email format testing completed');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
});
