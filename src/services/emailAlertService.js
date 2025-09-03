/**
 * 📧 EMAIL ALERT SERVICE - PROFESSIONAL TRADING ALERTS
 * 
 * SENDS IMMEDIATE EMAIL NOTIFICATIONS FOR:
 * - Stop losses hit (CRITICAL)
 * - Profit targets reached (HIGH)
 * - Position alerts (MEDIUM/LOW)
 * 
 * SUPPORTS: Mailgun, Gmail, Outlook, Custom SMTP
 */

const nodemailer = require('nodemailer');
const formData = require('form-data');
const Mailgun = require('mailgun.js');

class EmailAlertService {
    constructor() {
        this.transporter = null;
        this.mailgun = null;
        this.isConfigured = false;
        this.setupEmailService();
    }

    /**
     * Setup email service with multiple provider support
     */
    setupEmailService() {
        try {
            const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
            
            if (emailProvider === 'mailgun') {
                this.setupMailgun();
            } else {
                this.setupNodemailer(emailProvider);
            }

        } catch (error) {
            console.error('❌ Failed to setup email service:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Setup Mailgun service
     */
    setupMailgun() {
        try {
            if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
                console.log('⚠️  Mailgun not configured - missing API key or domain');
                return;
            }

            const mailgun = new Mailgun(formData);
            this.mailgun = mailgun.client({
                username: 'api',
                key: process.env.MAILGUN_API_KEY,
                url: 'https://api.mailgun.net' // or https://api.eu.mailgun.net for EU
            });

            this.isConfigured = true;
            console.log('📧 Mailgun email service configured successfully');

        } catch (error) {
            console.error('❌ Failed to setup Mailgun:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Setup Nodemailer for other providers
     */
    setupNodemailer(emailProvider) {
        try {
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
                console.log(`📧 ${emailProvider} email service configured successfully`);
            } else {
                console.log('⚠️  Email alerts not configured - missing environment variables');
            }

        } catch (error) {
            console.error('❌ Failed to setup nodemailer:', error);
            this.isConfigured = false;
        }
    }

    /**
     * Send alert email - MAIN METHOD (supports both Mailgun and Nodemailer)
     */
    async sendAlert(alert) {
        if (!this.isConfigured) {
            console.log('📧 Email not configured, skipping email alert');
            return false;
        }

        try {
            const subject = this.getEmailSubject(alert);
            const htmlContent = this.getEmailHTML(alert);
            const textContent = this.getEmailText(alert);

            // Use Mailgun or Nodemailer based on configuration
            if (this.mailgun && process.env.EMAIL_PROVIDER === 'mailgun') {
                return await this.sendWithMailgun(subject, htmlContent, textContent);
            } else {
                return await this.sendWithNodemailer(subject, htmlContent, textContent);
            }

        } catch (error) {
            console.error('❌ Failed to send alert email:', error);
            return false;
        }
    }

    /**
     * Send email using Mailgun
     */
    async sendWithMailgun(subject, html, text) {
        try {
            const from = `${process.env.MAILGUN_FROM} <postmaster@${process.env.MAILGUN_DOMAIN}>`;
            console.log(`📧 Mailgun alert will be sent from: ${from}`);
            const messageData = {
                from: from,
                to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
                subject: subject,
                text: text,
                html: html
            };

            const response = await this.mailgun.messages.create(process.env.MAILGUN_DOMAIN, messageData);
            console.log(`📧 Mailgun alert sent: ${subject} (ID: ${response.id})`);
            return true;

        } catch (error) {
            console.error('❌ Mailgun send failed:', error);
            return false;
        }
    }

    /**
     * Send email using Nodemailer
     */
    async sendWithNodemailer(subject, html, text) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
                subject,
                text,
                html
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Nodemailer alert sent: ${subject}`);
            return true;

        } catch (error) {
            console.error('❌ Nodemailer send failed:', error);
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
        
        return `${priority}: ${alert.type} - ${alert.symbol}`;
    }

    /**
     * Generate HTML email content with professional trading theme
     */
    getEmailHTML(alert) {
        const priorityColor = alert.priority === 'CRITICAL' ? '#dc3545' : 
                             alert.priority === 'HIGH' ? '#fd7e14' : 
                             alert.priority === 'MEDIUM' ? '#20c997' : '#6c757d';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Trading Alert</title>
        </head>
        <body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📈 Trading Alert</h1>
                    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Professional Trading System</p>
                </div>

                <!-- Alert Badge -->
                <div style="text-align: center; margin: -15px 0 20px 0;">
                    <span style="background: ${priorityColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                        ${alert.priority} PRIORITY
                    </span>
                </div>

                <!-- Content -->
                <div style="padding: 0 30px 30px 30px;">
                    
                    <!-- Main Alert -->
                    <div style="background: #f8f9fa; border-left: 4px solid ${priorityColor}; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                        <h2 style="margin: 0 0 10px 0; color: #333; font-size: 20px;">${alert.type}</h2>
                        <p style="margin: 0; font-size: 16px; color: #666; line-height: 1.5;">${alert.message}</p>
                    </div>

                    <!-- Trade Details -->
                    <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📊 Trade Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 40%;">Symbol:</td>
                                <td style="padding: 8px 0; color: #333; font-size: 16px; font-weight: bold;">${alert.symbol}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Current Price:</td>
                                <td style="padding: 8px 0; color: #333;">₹${alert.currentPrice || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Timestamp:</td>
                                <td style="padding: 8px 0; color: #333;">${new Date(alert.timestamp).toLocaleString()}</td>
                            </tr>
                            ${alert.action ? `
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Action:</td>
                                <td style="padding: 8px 0; color: #333; font-weight: bold;">${alert.action}</td>
                            </tr>
                            ` : ''}
                            ${alert.confidence ? `
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Confidence:</td>
                                <td style="padding: 8px 0; color: #333;">${alert.confidence}%</td>
                            </tr>
                            ` : ''}
                            ${alert.grade ? `
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Grade:</td>
                                <td style="padding: 8px 0; color: #333; font-weight: bold;">${alert.grade}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>

                    <!-- Trigger Details -->
                    ${alert.details && (alert.details.allTriggers || alert.details.newlyMetTriggers) ? `
                    <div style="background: #e8f5e8; border: 1px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #155724; font-size: 18px;">🎯 Entry Trigger Analysis</h3>
                        
                        ${alert.details.newlyActivated ? `
                        <div style="background: #fff; border: 2px solid #28a745; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                            <h4 style="margin: 0 0 10px 0; color: #155724; font-size: 16px;">🚀 ${alert.details.newlyActivated}</h4>
                            <div style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.6; color: #155724;">
                                ${(alert.details.newlyMetTriggers || []).join('<br>')}
                            </div>
                        </div>
                        ` : ''}
                        
                        <div style="background: #fff; border-radius: 6px; padding: 15px;">
                            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📊 Complete Trigger Status</h4>
                            <div style="font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.8; color: #333;">
                                ${(alert.details.allTriggers || alert.details.newlyMetTriggers || []).join('<br>')}
                            </div>
                        </div>
                        
                        ${alert.details.totalProgress ? `
                        <p style="margin: 15px 0 0 0; color: #155724; font-weight: bold; font-size: 16px;">
                            📈 Overall Progress: ${alert.details.totalProgress}
                        </p>
                        ` : ''}
                    </div>
                    ` : ''}

                    <!-- Entry Zone & Stop Loss -->
                    ${alert.details && (alert.details.entryZone || alert.details.stopLoss) ? `
                    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 18px;">💡 Trading Information</h3>
                        ${alert.details.entryZone && Object.keys(alert.details.entryZone).length > 0 ? `
                        <div style="margin-bottom: 10px;">
                            <strong style="color: #856404;">Entry Zone:</strong>
                            <span style="color: #333;">${JSON.stringify(alert.details.entryZone, null, 2)}</span>
                        </div>
                        ` : ''}
                        ${alert.details.stopLoss && alert.details.stopLoss !== 'N/A' ? `
                        <div>
                            <strong style="color: #856404;">Stop Loss:</strong>
                            <span style="color: #333;">₹${alert.details.stopLoss}</span>
                        </div>
                        ` : ''}
                    </div>
                    ` : ''}

                    <!-- Action Required -->
                    ${alert.priority === 'CRITICAL' ? `
                    <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Immediate Action Required</h4>
                        <p style="margin: 0; color: #856404;">This is a critical alert that may require immediate attention to your trading positions.</p>
                    </div>
                    ` : ''}

                </div>

                <!-- Footer -->
                <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">
                        🤖 Automated alert from Professional Trading System<br>
                        <span style="font-size: 12px;">Generated at ${new Date().toLocaleString()}</span>
                    </p>
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
        return `
TRADING ALERT - ${alert.priority} PRIORITY

${alert.type}
Symbol: ${alert.symbol}
Message: ${alert.message}

Current Price: ₹${alert.currentPrice || 'N/A'}
Timestamp: ${new Date(alert.timestamp).toLocaleString()}

${alert.priority === 'CRITICAL' ? '\n⚠️  IMMEDIATE ACTION REQUIRED ⚠️\n' : ''}

---
Automated alert from Professional Trading System
Generated at ${new Date().toLocaleString()}
        `.trim();
    }

    /**
     * Send a test email to verify configuration
     */
    async testEmail() {
        const testAlert = {
            type: 'System Test Alert',
            symbol: 'TEST.NS',
            message: 'This is a test email to verify your email alert configuration is working properly. If you receive this, your trading alerts are ready!',
            currentPrice: 100.00,
            priority: 'MEDIUM',
            timestamp: new Date()
        };

        try {
            const result = await this.sendAlert(testAlert);
            if (result) {
                console.log('✅ Test email sent successfully!');
                return { success: true, message: 'Test email sent successfully' };
            } else {
                console.log('❌ Test email failed');
                return { success: false, message: 'Test email failed to send' };
            }
        } catch (error) {
            console.error('❌ Test email error:', error);
            return { success: false, message: `Test email error: ${error.message}` };
        }
    }

    /**
     * Verify email configuration without sending
     */
    async verifyConfiguration() {
        try {
            if (process.env.EMAIL_PROVIDER === 'mailgun') {
                const hasMailgunConfig = !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
                return { 
                    success: hasMailgunConfig, 
                    provider: 'mailgun',
                    message: hasMailgunConfig ? 'Mailgun configured correctly' : 'Missing Mailgun API key or domain' 
                };
            } else {
                const hasNodemailerConfig = !!(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
                return { 
                    success: hasNodemailerConfig, 
                    provider: process.env.EMAIL_PROVIDER || 'gmail',
                    message: hasNodemailerConfig ? 'Email configured correctly' : 'Missing email credentials' 
                };
            }
        } catch (error) {
            return { success: false, message: `Email verification failed: ${error.message}` };
        }
    }
}

module.exports = EmailAlertService;
