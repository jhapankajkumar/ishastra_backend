/**
 * EMAIL TEMPLATE PREVIEW GENERATOR
 * Creates HTML files to preview email templates before sending
 */

const EmailAlertService = require('./src/services/email.service');
const fs = require('fs');
const path = require('path');

const emailService = new EmailAlertService();

// Test data for different email types
const testData = {
    // Individual alert with trigger conditions
    individualAlert: {
        symbol: "TVSMOTOR.NS",
        type: "TRIGGER_ALERT",
        message: "Strong momentum building - 2 of 3 entry conditions met",
        priority: "HIGH",
        currentPrice: 3452,
        timestamp: new Date(),
        action: "BUY",
        confidence: 85,
        grade: "A",
        triggerConditions: [
            {"type": "VOLUME", "met": false, "current": 752456, "threshold": 1314000},
            {"type": "BREAKOUT_LEVEL", "met": true, "current": 3452, "threshold": 3420.42},
            {"type": "CANDLE_STRENGTH", "met": true, "current": 78.7, "threshold": 63.3}
        ]
    },

    // Batched alerts with multiple stocks
    batchedAlert: {
        symbol: "MULTIPLE",
        type: "BATCHED_ALERTS",
        message: "Enhanced trading alerts with detailed trigger analysis",
        priority: "MEDIUM",
        timestamp: new Date(),
        batchedAlerts: [
            {
                symbol: "TVSMOTOR.NS",
                type: "TRIGGER_ALERT", 
                message: "Strong momentum building - 2 of 3 entry conditions met",
                priority: "HIGH",
                currentPrice: 3452,
                triggerConditions: [
                    {"type": "VOLUME", "met": false, "current": 752456, "threshold": 1314000},
                    {"type": "BREAKOUT_LEVEL", "met": true, "current": 3452, "threshold": 3420.42},
                    {"type": "CANDLE_STRENGTH", "met": true, "current": 78.7, "threshold": 63.3}
                ]
            },
            {
                symbol: "NYKAA.NS", 
                type: "ENTRY_OPPORTUNITY",
                message: "Breakout confirmed with strong candle formation",
                priority: "HIGH", 
                currentPrice: 239.25,
                triggerConditions: [
                    {"type": "VOLUME", "met": false, "current": 6707938, "threshold": 10394180},
                    {"type": "BREAKOUT_LEVEL", "met": true, "current": 239.25, "threshold": 238.99},
                    {"type": "CANDLE_STRENGTH", "met": true, "current": 88.7, "threshold": 62.6}
                ]
            },
            {
                symbol: "EICHERMOT.NS",
                type: "ENTRY_OPPORTUNITY", 
                message: "All entry conditions met - immediate opportunity",
                priority: "CRITICAL",
                currentPrice: 6478,
                triggerConditions: [
                    {"type": "VOLUME", "met": true, "current": 536107, "threshold": 384086},
                    {"type": "BREAKOUT_LEVEL", "met": true, "current": 6478, "threshold": 6400.78},
                    {"type": "CANDLE_STRENGTH", "met": true, "current": 89.4, "threshold": 62.5}
                ]
            },
            {
                symbol: "LEMONTREE.NS",
                type: "ENTRY_OPPORTUNITY",
                message: "Volume surge detected with breakout potential",
                priority: "MEDIUM",
                currentPrice: 171.27,
                triggerConditions: [
                    {"type": "VOLUME", "met": true, "current": 9300523, "threshold": 7917182},
                    {"type": "BREAKOUT_LEVEL", "met": false, "current": 171.14, "threshold": 175.25},
                    {"type": "CANDLE_STRENGTH", "met": true, "current": 69.0, "threshold": 61.2}
                ]
            }
        ]
    },

    // Critical individual alert
    criticalAlert: {
        symbol: "EICHERMOT.NS",
        type: "ENTRY_OPPORTUNITY",
        message: "Perfect entry setup - all conditions met with exceptional strength",
        priority: "CRITICAL",
        currentPrice: 6478,
        timestamp: new Date(),
        action: "BUY",
        confidence: 95,
        grade: "A+",
        triggerConditions: [
            {"type": "VOLUME", "met": true, "current": 536107, "threshold": 384086},
            {"type": "BREAKOUT_LEVEL", "met": true, "current": 6478, "threshold": 6400.78},
            {"type": "CANDLE_STRENGTH", "met": true, "current": 89.4, "threshold": 62.5}
        ]
    }
};

function generateEmailPreviews() {
    console.log('🎨 Generating email template previews...');

    // Create previews directory if it doesn't exist
    const previewDir = path.join(__dirname, 'email-previews');
    if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir);
    }

    // Generate individual alert preview
    console.log('📧 Generating individual alert preview...');
    const individualHTML = emailService.getEmailHTML(testData.individualAlert);
    fs.writeFileSync(path.join(previewDir, 'individual-alert.html'), individualHTML);

    // Generate batched alert preview
    console.log('📊 Generating batched alerts preview...');
    const batchedHTML = emailService.getEmailHTML(testData.batchedAlert);
    fs.writeFileSync(path.join(previewDir, 'batched-alerts.html'), batchedHTML);

    // Generate critical alert preview
    console.log('🚨 Generating critical alert preview...');
    const criticalHTML = emailService.getEmailHTML(testData.criticalAlert);
    fs.writeFileSync(path.join(previewDir, 'critical-alert.html'), criticalHTML);

    // Generate index page for easy navigation
    console.log('📋 Generating index page...');
    const indexHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Email Template Previews</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; margin-bottom: 40px; }
            .preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 30px; }
            .preview-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #fafafa; }
            .preview-card h3 { margin: 0 0 10px 0; color: #333; }
            .preview-card p { margin: 0 0 15px 0; color: #666; font-size: 14px; }
            .preview-link { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: 500; }
            .preview-link:hover { background: #0056b3; }
            .stats { background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .stats h3 { margin: 0 0 15px 0; color: #155724; }
            .stat-item { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .timestamp { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📧 Email Template Previews</h1>
            
            <div class="stats">
                <h3>📊 Template Statistics</h3>
                <div class="stat-item">
                    <span>Individual Alert Templates:</span>
                    <strong>2 variants</strong>
                </div>
                <div class="stat-item">
                    <span>Batched Alert Templates:</span>
                    <strong>1 variant</strong>
                </div>
                <div class="stat-item">
                    <span>Trigger Condition Support:</span>
                    <strong>✅ Full Support</strong>
                </div>
                <div class="stat-item">
                    <span>Priority Levels:</span>
                    <strong>HIGH, MEDIUM, CRITICAL</strong>
                </div>
            </div>

            <div class="preview-grid">
                <div class="preview-card">
                    <h3>🎯 Individual Alert</h3>
                    <p>Standard single-stock alert with trigger condition analysis. Shows price, conditions, and progress tracking.</p>
                    <a href="individual-alert.html" class="preview-link" target="_blank">View Preview</a>
                </div>

                <div class="preview-card">
                    <h3>📊 Batched Alerts</h3>
                    <p>Multiple stocks in one email with detailed trigger tables. Reduces email spam while maintaining full detail.</p>
                    <a href="batched-alerts.html" class="preview-link" target="_blank">View Preview</a>
                </div>

                <div class="preview-card">
                    <h3>🚨 Critical Alert</h3>
                    <p>High-priority alert with immediate action required. Enhanced styling and urgency indicators.</p>
                    <a href="critical-alert.html" class="preview-link" target="_blank">View Preview</a>
                </div>
            </div>

            <div class="timestamp">
                Generated on ${new Date().toLocaleString('en-IN')} | Professional Trading System
            </div>
        </div>
    </body>
    </html>
    `;
    
    fs.writeFileSync(path.join(previewDir, 'index.html'), indexHTML);

    console.log('\n✅ Email previews generated successfully!');
    console.log(`📁 Preview files saved to: ${previewDir}`);
    console.log('\n📋 Available previews:');
    console.log('   • index.html - Navigation page');
    console.log('   • individual-alert.html - Single stock alert');
    console.log('   • batched-alerts.html - Multiple stocks alert');
    console.log('   • critical-alert.html - High priority alert');
    console.log('\n🌐 Open index.html in your browser to view all templates');
}

// Run the preview generation
generateEmailPreviews();
