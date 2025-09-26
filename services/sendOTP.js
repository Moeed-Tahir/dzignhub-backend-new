const { Resend } = require('resend');

const sendOtp = async (recipientEmail, otp, isResetPassword = false) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    
    const { data, error } = await resend.emails.send({
      from: `ALLMYAI <noreply@allmyai.ai>`,
      to: recipientEmail,
      subject: isResetPassword ? 'Password Reset OTP - ALLMYAI' : 'Verify Your Email - ALLMYAI',
      html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${isResetPassword ? 'Password Reset' : 'Email Verification'}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                        .content { padding: 30px; text-align: center; }
                        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; letter-spacing: 5px; }
                        .warning { background: #fff3cd; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
                        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; padding-top: 20px; border-top: 1px solid #e9ecef; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>${isResetPassword ? '🔐 Password Reset' : '✅ Email Verification'}</h1>
                            <p>ALLMYAI ${isResetPassword ? 'Security' : 'Verification'}</p>
                        </div>
                        <div class="content">
                            <h2>Your OTP Code</h2>
                            <p>Use the following OTP to ${isResetPassword ? 'reset your password' : 'verify your email address'}:</p>
                            
                            <div class="otp-code">${otp}</div>
                            
                            <div class="warning">
                                <strong>⚠️ Important:</strong> This OTP will expire in 10 minutes.
                                <br>Do not share this code with anyone.
                            </div>
                            
                            <p>If you didn't request this ${isResetPassword ? 'password reset' : 'verification'}, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>This email was sent to ${recipientEmail}</p>
                            <p>&copy; 2024 ALLMYAI . All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
      text: `
                ALLMYAI ${isResetPassword ? 'Password Reset' : 'Email Verification'}
                
                Your OTP Code: ${otp}
                
                Use this OTP to ${isResetPassword ? 'reset your password' : 'verify your email address'}.
                
                ⚠️ Important: This OTP will expire in 10 minutes.
                Do not share this code with anyone.
                
                If you didn't request this ${isResetPassword ? 'password reset' : 'verification'}, please ignore this email.

                © 2024 ALLMYAI. All rights reserved.
            `
    });

    if (error) {
      throw error;
    }

    console.log('✅ OTP sent successfully via Resend. Email ID:', data.id);
    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOtp };