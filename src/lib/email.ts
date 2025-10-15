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

export interface AdminCredentialsData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export async function sendEmail(emailData: EmailData): Promise<void> {
  // In development, just log the email
  if (process.env.NODE_ENV === "development") {
    console.log("\n" + "=".repeat(60));
    console.log("EMAIL NOTIFICATION");
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

  // Check if email service is configured for production
  const emailService = process.env.EMAIL_SERVICE || 'smtp';
  
  if (emailService === 'none') {
    // Log the email instead of throwing an error in production
    console.log(`[PRODUCTION] Email would be sent to: ${emailData.to}`);
    console.log(`[PRODUCTION] Subject: ${emailData.subject}`);
    console.log(`[PRODUCTION] Email service disabled - email not sent`);
    return;
  }

  // Use SMTP (Nodemailer) for email sending
  if (emailService === 'smtp') {
    try {
      // Dynamic import for Nodemailer (only loaded when needed)
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST!,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASSWORD!,
        },
      });
      
      await transporter.sendMail({
        from: process.env.FROM_EMAIL!,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });
      
      console.log(`[PRODUCTION] Email sent successfully to: ${emailData.to}`);
      return;
    } catch (error) {
      console.error('SMTP email service error:', error);
      throw new Error('Failed to send email via SMTP');
    }
  }

  // For any other configured service, log and continue
  console.log(`[PRODUCTION] Email service '${emailService}' not recognized`);
  console.log(`[PRODUCTION] Email would be sent to: ${emailData.to}`);
  console.log(`[PRODUCTION] Subject: ${emailData.subject}`);
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

// Email template system for consistent design
export interface EmailTemplateData {
  title: string;
  heading: string;
  content: string;
  actionContent?: string;
  securityNotice?: string;
  expiryText?: string;
}

function generateEmailTemplate(data: EmailTemplateData): string {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title} - RoofCalc</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #e0e6e8; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-top: 20px;">
          <div style="display: inline-block; text-align: center;">
            <!-- Brand Logo -->
            <img src="https://unex0yvstmuqs1jv.public.blob.vercel-storage.com/brand/roofcal-logo.png" 
                 alt="RoofCalc Logo" 
                 style="height: 60px; width: auto; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;"
                 width="120" height="60" />
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="background: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #2d3748; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em;">${data.heading}</h2>
          <p style="color: #4a5568; line-height: 1.625; margin: 0 0 24px 0; font-size: 15px;">
            ${data.content}
          </p>
          
          ${data.actionContent || ''}
          
          ${data.expiryText ? `
            <div style="background: #f7fafc; padding: 16px; border-radius: 6px; margin: 24px 0 0 0; text-align: center;">
              <p style="margin: 0; color: #718096; font-size: 13px; font-weight: 400;">${data.expiryText}</p>
            </div>
          ` : ''}
          
          ${data.securityNotice ? `
            <div style="background: #f7fafc; padding: 16px; border-radius: 6px; margin: 24px 0 0 0;">
              <p style="color: #4a5568; line-height: 1.625; margin: 0; font-size: 14px;">
                <strong style="font-weight: 600; display: block; margin-bottom: 4px;">Security Notice:</strong>
                ${data.securityNotice}
              </p>
            </div>
          ` : ''}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #718096; font-size: 12px; padding-bottom: 20px;">
          <p style="margin: 0 0 4px 0; font-weight: 400;">© ${currentYear} RoofCal. All rights reserved.</p>
          <p style="margin: 0; opacity: 0.8;">This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Mock email functions for auth system
export async function sendVerificationEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  const templateData: EmailTemplateData = {
    title: "Verify Your Email",
    heading: "Verify Your Email Address",
    content: "Thank you for signing up for RoofCal! To complete your account setup and start using our professional roof calculation tools, please verify your email address.",
    actionContent: `
      <!-- Verification Code Box -->
      <div style="background: #f7fafc; padding: 24px; border-radius: 6px; text-align: center; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 12px 0; color: #718096; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Your verification code</p>
        <div style="font-size: 32px; font-weight: 700; color: #4a7c7e; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 12px 0; background: #ffffff; padding: 16px 24px; border-radius: 6px; border: 2px solid #4a7c7e; display: inline-block;">
          ${code}
        </div>
      </div>
      
      <p style="color: #4a5568; line-height: 1.625; margin: 0; font-size: 14px;">
        Enter this code in the verification page to activate your account. If you didn't create an account with RoofCal, you can safely ignore this email.
      </p>
    `,
    expiryText: "This code expires in 10 minutes",
    securityNotice: "If you didn't create an account with RoofCal, you can safely ignore this email."
  };

  const emailData: EmailData = {
    to: email,
    subject: "Verify Your Email - RoofCal",
    html: generateEmailTemplate(templateData),
    text: `Your verification code is: ${code}\n\nEnter this code on the verification page to complete your account setup.\n\nThis code will expire in 10 minutes. If you didn't create an account, please ignore this email.`
  };
  
  try {
    await sendEmail(emailData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<{ success: boolean; error?: string }> {
  const templateData: EmailTemplateData = {
    title: "Reset Your Password",
    heading: "Reset Your Password",
    content: "You requested to reset your password for your RoofCal account. Click the button below to securely reset your password.",
    actionContent: `
      <!-- Reset Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(74, 124, 126, 0.3); transition: all 0.2s ease;">
          Reset Your Password
        </a>
      </div>
      
      <p style="color: #4a5568; line-height: 1.625; margin: 0; font-size: 14px;">
        If the button doesn't work, you can copy and paste this link into your browser:
        <br>
        <span style="color: #4a7c7e; word-break: break-all;">${resetUrl}</span>
      </p>
    `,
    expiryText: "This link expires in 1 hour",
    securityNotice: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged."
  };

  const emailData: EmailData = {
    to: email,
    subject: "Reset Your Password - RoofCal",
    html: generateEmailTemplate(templateData),
    text: `Reset your password by clicking this link: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request a password reset, please ignore this email.`
  };
  
  try {
    await sendEmail(emailData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Helper function to create custom email templates using the consolidated design
export async function sendCustomEmail(
  email: string,
  subject: string,
  templateData: EmailTemplateData,
  textContent: string
): Promise<{ success: boolean; error?: string }> {
  const emailData: EmailData = {
    to: email,
    subject: `${subject} - RoofCal`,
    html: generateEmailTemplate(templateData),
    text: textContent
  };
  
  try {
    await sendEmail(emailData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send admin credentials email to newly created admin
 */
export async function sendAdminCredentialsEmail(data: AdminCredentialsData): Promise<{ success: boolean; error?: string }> {
  const subject = "Your Admin Account Credentials - RoofCal";
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Account Created</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: #fff; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credential-item { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
        .label { font-weight: bold; color: #495057; }
        .value { font-family: monospace; background: #e9ecef; padding: 5px 10px; border-radius: 3px; word-break: break-all; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 14px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Admin Account Created</h1>
        <p>Welcome to RoofCal Admin Panel</p>
      </div>
      
      <div class="content">
        <h2>Hello ${data.firstName} ${data.lastName}!</h2>
        
        <p>Your admin account has been successfully created. Below are your login credentials:</p>
        
        <div class="credentials">
          <h3>Login Credentials</h3>
          
          <div class="credential-item">
            <div class="label">Email Address:</div>
            <div class="value">${data.email}</div>
          </div>
          
          <div class="credential-item">
            <div class="label">Temporary Password:</div>
            <div class="value">${data.password}</div>
          </div>
        </div>
        
        <div class="warning">
          <strong>⚠️ Important Security Notice:</strong>
          <ul>
            <li>You will be required to change your password on first login</li>
            <li>Keep these credentials secure and do not share them</li>
            <li>Log in immediately and set a strong, unique password</li>
          </ul>
        </div>
        
        <p>To access your admin panel, please visit:</p>
        <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login" class="button">Login to Admin Panel</a>
        
        <h3>Admin Capabilities</h3>
        <p>As an admin, you will have access to:</p>
        <ul>
          <li>User account management</li>
          <li>System configuration</li>
          <li>Project oversight</li>
          <li>Material inventory management</li>
          <li>Reporting and analytics</li>
        </ul>
        
        <p>If you have any questions or need assistance, please contact your system administrator.</p>
      </div>
      
      <div class="footer">
        <p>This email was sent from RoofCal Admin System</p>
        <p>Please do not reply to this email</p>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Admin Account Created - RoofCal
    
    Hello ${data.firstName} ${data.lastName}!
    
    Your admin account has been successfully created. Below are your login credentials:
    
    Email Address: ${data.email}
    Temporary Password: ${data.password}
    
    IMPORTANT SECURITY NOTICE:
    - You will be required to change your password on first login
    - Keep these credentials secure and do not share them
    - Log in immediately and set a strong, unique password
    
    Login URL: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login
    
    Admin Capabilities:
    As an admin, you will have access to:
    - User account management
    - System configuration
    - Project oversight
    - Material inventory management
    - Reporting and analytics
    
    If you have any questions or need assistance, please contact your system administrator.
    
    This email was sent from RoofCal Admin System
    Please do not reply to this email
  `;

  const emailData: EmailData = {
    to: data.email,
    subject: subject,
    html: htmlContent,
    text: textContent
  };

  try {
    await sendEmail(emailData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}