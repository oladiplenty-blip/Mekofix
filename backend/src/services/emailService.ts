import nodemailer from 'nodemailer';
import { env } from '../config/env';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) {
    return transporter;
  }

  // If email is not configured, return null (will log to console instead)
  if (!env.email?.smtpHost || !env.email?.smtpUser || !env.email?.smtpPassword) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: env.email.smtpPort || 587,
    secure: env.email.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: env.email.smtpUser,
      pass: env.email.smtpPassword,
    },
  });

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  const emailTransporter = getTransporter();

  // If email is not configured, log to console (for development)
  if (!emailTransporter) {
    console.log('='.repeat(60));
    console.log('📧 EMAIL NOT CONFIGURED - Would send email:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', text || html);
    console.log('='.repeat(60));
    return true; // Return true so the flow continues
  }

  try {
    const mailOptions = {
      from: env.email?.fromEmail || env.email?.smtpUser,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Log to console as fallback
    console.log('='.repeat(60));
    console.log('📧 EMAIL SEND FAILED - Email content:');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', text || html);
    console.log('='.repeat(60));
    return false; // Return false but don't throw - OTP is still valid
  }
}

export async function sendOTPEmail(email: string, code: string, type: 'signup' | 'password_reset' = 'signup'): Promise<boolean> {
  const subject = type === 'signup' 
    ? 'Verify your Mekofix account' 
    : 'Reset your Mekofix password';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="margin: 0;">Mekofix</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #4CAF50; margin-top: 0;">${type === 'signup' ? 'Verify Your Account' : 'Password Reset'}</h2>
        <p>Hello,</p>
        <p>${type === 'signup' 
          ? 'Thank you for signing up for Mekofix! Please use the verification code below to complete your registration:'
          : 'You requested to reset your password. Please use the code below to reset your password:'}</p>
        <div style="background-color: white; border: 2px dashed #4CAF50; border-radius: 5px; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #4CAF50; font-size: 36px; letter-spacing: 5px; margin: 0;">${code}</h1>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; margin: 0;">This is an automated message from Mekofix. Please do not reply to this email.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Mekofix ${type === 'signup' ? 'Account Verification' : 'Password Reset'}

Hello,

${type === 'signup' 
  ? 'Thank you for signing up for Mekofix! Please use the verification code below to complete your registration:'
  : 'You requested to reset your password. Please use the code below to reset your password:'}

Verification Code: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message from Mekofix. Please do not reply to this email.
  `;

  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

