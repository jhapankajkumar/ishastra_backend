/**
 * 🧪 SINGLE ENTRY SIGNAL EMAIL TEST - SAVE HTML OUTPUT
 */

const EmailService = require('./src/services/email.service');
const fs = require('fs');

async function testAndSaveHTML() {
    console.log('🧪 GENERATING AND SAVING ENTRY SIGNAL EMAIL HTML...\n');

    try {
        const emailService = new EmailService();

        const entryAlertData = {
            type: 'ENTRY_TRIGGER',
            priority: 'HIGH',
            symbol: 'RELIANCE',
            currentPrice: 2456.75,
            action: 'BUY',
            confidence: 85,
            grade: 'A+',
            message: 'Strong momentum building - 3 of 3 entry conditions met',
            details: {
                newlyMetTriggers: [
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
                    }
                ],
                allTriggers: [
                    '• Volume Surge: 2,500,000 (threshold: 2,000,000) ✅',
                    '• Price Breakout: ₹2456.75 (breakout: ₹2450.00) ✅',
                    '• Candle Strength: 78.7% (threshold: 63.3%) ✅'
                ],
                totalProgress: '3/3 triggers met',
                newlyActivated: '3 trigger(s) activated',
                entryZone: { min: 2450, max: 2470 },
                stopLoss: 2350
            },
            timestamp: new Date()
        };

        console.log('📧 Generating Entry Signal HTML...');
        const htmlContent = emailService.getProfessionalEmailHTML(entryAlertData);
        
        // Save to file
        const filename = 'generated-entry-signal.html';
        fs.writeFileSync(filename, htmlContent, 'utf8');
        
        console.log(`✅ HTML saved to ${filename}`);
        console.log('\n🔍 FINAL VALIDATION:');
        console.log('- Contains "undefined":', htmlContent.includes('undefined') ? '❌ YES' : '✅ NO');
        console.log('- Contains "MOMENTUM_ACCELERATION":', htmlContent.includes('MOMENTUM_ACCELERATION') ? '❌ YES' : '✅ NO');
        console.log('- Shows "3/3 conditions met":', htmlContent.includes('3/3 conditions met') ? '✅ YES' : '❌ NO');
        console.log('- Shows "Entry Signal":', htmlContent.includes('Entry Signal') ? '✅ YES' : '❌ NO');
        console.log('- Trigger table exists:', htmlContent.includes('Entry Conditions') ? '✅ YES' : '❌ NO');
        
        console.log(`\n📄 You can open ${filename} in a browser to see the full email template!`);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

testAndSaveHTML().then(() => {
    console.log('\n🔚 HTML generation completed');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
});
