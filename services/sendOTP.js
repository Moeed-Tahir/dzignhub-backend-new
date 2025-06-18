// Send OTP email
const nodemailer = require('nodemailer');
const sendOtp = async (recipientEmail, otp, isResetPassword = false) => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        },
      });
  
      const mailOptions = {
        from: `DzignHub - ${isResetPassword ? 'Reset Password' : 'Verify your mail'} <${process.env.GMAIL_USER}>`,
        to: recipientEmail,
        subject: 'Your OTP Code',
        html: `
          <h3>Your OTP ${isResetPassword ? 'for password reset' : ''} is:</h3>
          <p style="font-size: 20px; font-weight: bold;">${otp}</p>
          <p>This OTP will expire in 10 minutes.</p>
        `,
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log('OTP sent: ' + info.response);
    } catch (error) {
      console.error('Error sending OTP email:', error);
    }
  };

module.exports = { sendOtp };
