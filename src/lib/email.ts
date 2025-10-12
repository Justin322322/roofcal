// Mock email service for development
// In production, you would integrate with services like:
// - SendGrid
// - AWS SES
// - Nodemailer with SMTP
// - Resend
// - Postmark

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(emailData: EmailData): Promise<void> {
  // In development, just log the email
  if (process.env.NODE_ENV === "development") {
    console.log("\n" + "=".repeat(60));
    console.log("📧 EMAIL NOTIFICATION");
    console.log("=".repeat(60));
    console.log(`To: ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log("-".repeat(60));
    console.log("HTML Content:");
    console.log(emailData.html);
    console.log("-".repeat(60));
    console.log("Text Content:");
    console.log(emailData.text);
    console.log("=".repeat(60) + "\n");
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return;
  }

  // Production implementation would go here
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: emailData.to,
    from: process.env.FROM_EMAIL,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
  };
  
  await sgMail.send(msg);
  */

  // Example with Nodemailer:
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
  });
  */

  throw new Error("Email service not configured for production");
}

// Helper function to validate email addresses
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to format email addresses for display
export function formatEmailForDisplay(email: string): string {
  if (!isValidEmail(email)) {
    return email;
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart.length > 10) {
    return `${localPart.substring(0, 7)}...@${domain}`;
  }
  
  return email;
}

// Mock email functions for auth system
export async function sendVerificationEmail(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  const emailData: EmailData = {
    to: email,
    subject: "Verify your email address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${process.env.NEXTAUTH_URL}/auth/verify?token=${token}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `,
    text: `Verify your email address by clicking this link: ${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`
  };
  
  try {
    await sendEmail(emailData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<{ success: boolean; error?: string }> {
  const emailData: EmailData = {
    to: email,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}" 
           style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Reset Password
        </a>
        <p>If you didn't request a password reset, please ignore this email.</p>
      </div>
    `,
    text: `Reset your password by clicking this link: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
  };
  
  try {
    await sendEmail(emailData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}