/**
 * 🧪 SINGLE ENTRY SIGNAL EMAIL TEST
 * 
 * Tests only the Entry Trigger Alert format to debug issues
 */

const EmailService = require('./src/services/email.service');

async function testSingleEntrySignal() {
    console.log('🧪 TESTING SINGLE ENTRY SIGNAL EMAIL...\n');

    try {
        const emailService = new EmailService();

        // Create perfect entry trigger alert data
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

        console.log('📧 Generating Entry Signal email...');
        const htmlContent = emailService.getProfessionalEmailHTML(entryAlertData);
        
        console.log('✅ Entry signal email template generated successfully!');
        console.log('\n📄 SAMPLE HTML CONTENT (first 500 chars):');
        console.log('=' + '='.repeat(80));
        console.log(htmlContent.substring(0, 500) + '...');
        console.log('=' + '='.repeat(80));
        
        // Check for specific issues
        console.log('\n🔍 CHECKING FOR ISSUES:');
        console.log('- Contains "undefined":', htmlContent.includes('undefined') ? '❌ YES' : '✅ NO');
        console.log('- Contains "MOMENTUM_ACCELERATION":', htmlContent.includes('MOMENTUM_ACCELERATION') ? '❌ YES' : '✅ NO');
        console.log('- Contains "Momentum Acceleration":', htmlContent.includes('Momentum Acceleration') ? '❌ YES' : '✅ NO');
        console.log('- Shows "2 of 3":', htmlContent.includes('2 of 3') ? '❌ YES' : '✅ NO');
        console.log('- Shows "3 of 3":', htmlContent.includes('3 of 3') ? '✅ YES' : '❌ NO');
        console.log('- Contains "Entry Signal":', htmlContent.includes('Entry Signal') ? '✅ YES' : '❌ NO');
        
        console.log('\n📋 TRIGGER TABLE CONTENT:');
        const triggerMatch = htmlContent.match(/<h3[^>]*>🎯 Entry Conditions<\/h3>([\s\S]*?)<\/table>/);
        if (triggerMatch) {
            console.log('Found Entry Conditions table ✅');
            // Extract trigger names from the table
            const triggerNames = triggerMatch[1].match(/<td[^>]*>([^<]+)<\/td>/g);
            if (triggerNames) {
                console.log('Trigger names found:');
                triggerNames.forEach((match, index) => {
                    const name = match.replace(/<[^>]*>/g, '').trim();
                    if (name && !name.includes('✅') && !name.includes('₹') && !name.includes('%') && name.length > 2) {
                        console.log(`  ${index + 1}. ${name}`);
                    }
                });
            }
        } else {
            console.log('❌ Entry Conditions table not found');
        }
        
        console.log('\n🔍 Check your email inbox for the clean entry signal alert');

    } catch (error) {
        console.error('❌ Single entry signal test failed:', error.message);
        console.error('Full error:', error);
    }
}

// Run the test
testSingleEntrySignal().then(() => {
    console.log('\n🔚 Single entry signal testing completed');
    process.exit(0);
}).catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
});
