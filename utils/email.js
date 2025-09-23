// utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // or another SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a welcome email after signup.
 * @param {string} email - User's email
 * @param {string} firstName - User's first name
 */
export async function sendWelcomeEmail(email, firstName) {
  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Our Platform 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Welcome, ${firstName}!</h2>
        <p>We’re excited to have you onboard 🚀</p>
        <p>You can now log in and start creating amazing projects.</p>
        <p>Need help? Just reply to this email, we’re here for you.</p>
        <br/>
        <p>– The Your App Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send welcome email:', err);
  }
}

/**
 * Send a password reset email with a secure reset link.
 * @param {string} email - User's email
 * @param {string} token - Reset token
 */
export async function sendPasswordResetEmail(email, token) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; 
  const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to continue:</p>
        <p>
          <a href="${resetLink}" 
             style="display:inline-block; padding:10px 20px; background:#007BFF; color:#fff; 
                    text-decoration:none; border-radius:5px;">
            Reset Password
          </a>
        </p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
        <p>For security, this link will expire in 15 minutes.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send reset email:', err);
  }
}
