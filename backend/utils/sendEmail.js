const nodemailer = require('nodemailer');

/**
 * Simple email sender for DIZY system
 * In production, replace with real SMTP credentials
 */
const sendEmail = async (options) => {
  try {
    console.log('\n📧 DIZY EMAIL SYSTEM 📧');
    console.log('================================');
    console.log('TO:', options.to);
    console.log('SUBJECT:', options.subject);
    console.log('MESSAGE:', options.text);
    console.log('================================\n');

    // For now, just log the email (mock mode)
    // In production, uncomment and configure real SMTP below

    /*
    const transporter = nodemailer.createTransport({
      host: 'your-smtp-host.com',
      port: 587,
      secure: false,
      auth: {
        user: 'your-email@domain.com',
        pass: 'your-password'
      }
    });

    const mailOptions = {
      from: 'DIZY System <your-email@domain.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
    */

    return {
      success: true,
      message: 'Email logged to console (configure real SMTP for production)',
      logged: true
    };

  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
