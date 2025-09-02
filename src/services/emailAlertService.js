/**
 * 📧 EMAIL ALERT SERVICE - PROFESSIONAL TRADING ALERTS
 * 
 * SENDS IMMEDIATE EMAIL NOTIFICATIONS FOR:
 * - Stop losses hit (CRITICAL)
 * - Profit targets reached (HIGH)
 * - Position alerts (MEDIUM/LOW)
 * 
 * ZERO COMPLEXITY - JUST WORKS
 */

const nodemailer = require('nodemailer');

class EmailAlertService {
    constructor() {
        this.transporter = null;
        this.isConfigured = false;
        this.setupTransporter();
    }

    /**
     * Setup email transporter with multiple provider support
     */
    setupTransporter() {
        try {
            // Support multiple email providers
            const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
            
            if (emailProvider === 'gmail') {
                this.transporter = nodemailer.createTransporter({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password, not regular password
                    }
                });
            } else if (emailProvider === 'outlook') {
                this.transporter = nodemailer.createTransporter({
                    service: 'hotmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_APP_PASSWORD
                    }
                });
            } else {
                // Custom SMTP
                this.transporter = nodemailer.createTransporter({
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: false,
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASSWORD
                    }
                });
            }

            this.isConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
            
            if (this.isConfigured) {
                console.log('📧 Email alert service configured successfully');
            } else {
                console.log('⚠️  Email alerts not configured - missing environment variables');
            }

        } catch (error) {
            console.error('❌ Failed to setup email transporter:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Send alert email - MAIN METHOD
     */
    async sendAlert(alert) {
        if (!this.isConfigured) {
            console.log('📧 Email not configured, skipping email alert');
            return false;
        }

        try {
            const subject = this.getEmailSubject(alert);
            const html = this.getEmailHTML(alert);
            const text = this.getEmailText(alert);

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.ALERT_EMAIL || process.env.EMAIL_USER, // Can send to different email
                subject,
                text,
                html
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Alert email sent: ${subject}`);
            return true;

        } catch (error) {
            console.error('❌ Failed to send alert email:', error);
            return false;
        }
    }

    /**
     * Generate email subject based on alert priority and type
     */
    getEmailSubject(alert) {
        const priority = alert.priority === 'CRITICAL' ? '🚨 URGENT' : 
                        alert.priority === 'HIGH' ? '⚡ IMPORTANT' : 
                        alert.priority === 'MEDIUM' ? '📊 ALERT' : '💡 INFO';

        return `${priority}: ${alert.ticker} - ${alert.type}`;
    }

    /**
     * Generate HTML email content
     */
    getEmailHTML(alert) {
        const priorityColor = alert.priority === 'CRITICAL' ? '#ff4444' : 
                             alert.priority === 'HIGH' ? '#ff8800' : 
                             alert.priority === 'MEDIUM' ? '#0088ff' : '#888888';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { background-color: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; }
                .header { border-left: 4px solid ${priorityColor}; padding-left: 15px; margin-bottom: 20px; }
                .priority { color: ${priorityColor}; font-weight: bold; font-size: 14px; }
                .ticker { font-size: 24px; font-weight: bold; margin: 5px 0; }
                .message { font-size: 16px; margin: 15px 0; line-height: 1.4; }
                .details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
                .detail-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .action { background-color: ${priorityColor}; color: white; padding: 10px; border-radius: 4px; margin: 15px 0; }
                .footer { font-size: 12px; color: #666; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="priority">${alert.priority} ALERT</div>
                    <div class="ticker">${alert.ticker}</div>
                </div>
                
                <div class="message">${alert.message}</div>
                
                ${alert.currentPrice || alert.entryPrice ? `
                <div class="details">
                    ${alert.currentPrice ? `<div class="detail-row"><span>Current Price:</span><span>$${alert.currentPrice}</span></div>` : ''}
                    ${alert.entryPrice ? `<div class="detail-row"><span>Entry Price:</span><span>$${alert.entryPrice}</span></div>` : ''}
                    ${alert.stopLoss ? `<div class="detail-row"><span>Stop Loss:</span><span>$${alert.stopLoss}</span></div>` : ''}
                    ${alert.target ? `<div class="detail-row"><span>Target:</span><span>$${alert.target}</span></div>` : ''}
                    ${alert.priceChange ? `<div class="detail-row"><span>Change:</span><span>${alert.priceChange > 0 ? '+' : ''}${alert.priceChange.toFixed(2)}%</span></div>` : ''}
                </div>
                ` : ''}
                
                ${alert.action ? `
                <div class="action">
                    <strong>Recommended Action:</strong> ${alert.action}
                </div>
                ` : ''}
                
                <div class="footer">
                    Alert generated at ${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SG Time<br>
                    Ishastra Trading System
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text email content (fallback)
     */
    getEmailText(alert) {
        let text = `${alert.priority} ALERT: ${alert.ticker}\n\n`;
        text += `${alert.message}\n\n`;
        
        if (alert.currentPrice) text += `Current Price: $${alert.currentPrice}\n`;
        if (alert.entryPrice) text += `Entry Price: $${alert.entryPrice}\n`;
        if (alert.stopLoss) text += `Stop Loss: $${alert.stopLoss}\n`;
        if (alert.target) text += `Target: $${alert.target}\n`;
        if (alert.priceChange) text += `Price Change: ${alert.priceChange > 0 ? '+' : ''}${alert.priceChange.toFixed(2)}%\n`;
        
        if (alert.action) text += `\nRecommended Action: ${alert.action}\n`;
        
        text += `\nAlert Time: ${new Date().toLocaleString('en-SG', { timeZone: 'Asia/Singapore' })} SG Time`;
        text += `\nIshastra Trading System`;
        
        return text;
    }

    /**
     * Test email configuration
     */
    async testEmail() {
        if (!this.isConfigured) {
            console.log('❌ Email not configured for testing');
            return false;
        }

        const testAlert = {
            ticker: 'TEST',
            type: 'TEST_ALERT',
            priority: 'LOW',
            message: 'This is a test email alert from your trading system.',
            currentPrice: 100.50,
            action: 'No action required - this is just a test'
        };

        console.log('📧 Sending test email...');
        return await this.sendAlert(testAlert);
    }

    /**
     * Verify email configuration without sending
     */
    async verifyConfiguration() {
        if (!this.isConfigured) {
            return { success: false, message: 'Email not configured' };
        }

        try {
            await this.transporter.verify();
            return { success: true, message: 'Email configuration verified' };
        } catch (error) {
            return { success: false, message: `Email verification failed: ${error.message}` };
        }
    }
}

module.exports = EmailAlertService;
