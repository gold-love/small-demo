const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const message = {
            from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await transporter.sendMail(message);
        logger.info(`Message sent: ${info.messageId}`);
    } catch (error) {
        logger.error('Email send error:', error);
        // Development Fallback: Log to console so user can see the 2FA code in terminal
        console.log('\n=======================================');
        console.log('📧 DEVELOPMENT EMAIL LOG (SMTP FAILED)');
        console.log('To:', options.email);
        console.log('Subject:', options.subject);
        console.log('Message:', options.message);
        console.log('=======================================\n');
    }
};

module.exports = sendEmail;
