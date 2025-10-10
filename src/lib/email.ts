import nodemailer from "nodemailer";

/**
 * Escapes HTML special characters to prevent HTML injection
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Validate required environment variables at module initialization
function validateEmailConfig() {
  const requiredVars = {
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required SMTP environment variables: ${missingVars.join(", ")}. ` +
        "Please ensure SMTP_USER and SMTP_PASSWORD are set in your environment."
    );
  }

  // Parse and validate SMTP_PORT
  const portStr = process.env.SMTP_PORT || "587";
  const port = parseInt(portStr, 10);

  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error(
      `Invalid SMTP_PORT value: "${portStr}". Must be a valid port number (1-65535).`
    );
  }

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASSWORD!,
    },
  };
}

const emailConfig = validateEmailConfig();
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Validates email address and content (code or URL)
 */
function validateEmailAndContent(
  email: string,
  content: string
): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email address" };
  }

  if (!content || typeof content !== "string") {
    return { isValid: false, error: "Invalid content" };
  }

  return { isValid: true };
}

/**
 * Helper function to send emails with verification codes or URLs
 */
async function sendEmailWithCode(
  email: string,
  content: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  // Validate inputs
  const validation = validateEmailAndContent(email, content);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendVerificationEmail(email: string, code: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - RoofCal</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f2f4f6; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-top: 20px;">
          <div style="display: inline-block; text-align: center;">
            <h1 style="color: #2d3748; margin: 0 0 4px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">RoofCal</h1>
            <p style="color: #718096; margin: 0; font-size: 14px; font-weight: 400;">Professional Roof Calculator</p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="background: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #2d3748; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em;">Verify Your Email Address</h2>
          <p style="color: #4a5568; line-height: 1.625; margin: 0 0 24px 0; font-size: 15px;">
            Thank you for signing up for RoofCal! To complete your account setup and start using our professional roof calculation tools, please verify your email address.
          </p>
          
          <!-- Verification Code Box -->
          <div style="background: #f7fafc; padding: 24px; border-radius: 6px; text-align: center; margin: 24px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 12px 0; color: #718096; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Your verification code</p>
            <div style="font-size: 32px; font-weight: 700; color: #4a7c7e; letter-spacing: 8px; font-family: 'Courier New', monospace; margin: 12px 0; background: #ffffff; padding: 16px 24px; border-radius: 6px; border: 2px solid #4a7c7e; display: inline-block;">
              ${escapeHtml(code)}
            </div>
            <p style="margin: 12px 0 0 0; color: #718096; font-size: 13px; font-weight: 400;">This code expires in 10 minutes</p>
          </div>
          
          <p style="color: #4a5568; line-height: 1.625; margin: 0; font-size: 14px;">
            Enter this code in the verification page to activate your account. If you didn't create an account with RoofCal, you can safely ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #718096; font-size: 12px; padding-bottom: 20px;">
          <p style="margin: 0 0 4px 0; font-weight: 400;">© ${new Date().getFullYear()} RoofCal. All rights reserved.</p>
          <p style="margin: 0; opacity: 0.8;">This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithCode(
    email,
    code,
    "Verify Your Email - RoofCal",
    htmlContent
  );
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - RoofCal</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f2f4f6; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px; padding-top: 20px;">
          <div style="display: inline-block; text-align: center;">
            <h1 style="color: #2d3748; margin: 0 0 4px 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">RoofCal</h1>
            <p style="color: #718096; margin: 0; font-size: 14px; font-weight: 400;">Professional Roof Calculator</p>
          </div>
        </div>
        
        <!-- Main Content -->
        <div style="background: #ffffff; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); margin-bottom: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #2d3748; margin: 0 0 16px 0; font-size: 22px; font-weight: 600; letter-spacing: -0.01em;">Reset Your Password</h2>
          <p style="color: #4a5568; line-height: 1.625; margin: 0 0 24px 0; font-size: 15px;">
            You requested to reset your password for your RoofCal account. Click the button below to securely reset your password.
          </p>
          
          <!-- Reset Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${escapeHtml(resetUrl)}" style="display: inline-block; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(74, 124, 126, 0.3); transition: all 0.2s ease;">
              Reset Your Password
            </a>
            <p style="margin: 16px 0 0 0; color: #718096; font-size: 13px; font-weight: 400;">This link expires in 1 hour</p>
          </div>
          
          <div style="background: #f7fafc; padding: 16px; border-radius: 6px; margin: 24px 0 0 0;">
            <p style="color: #4a5568; line-height: 1.625; margin: 0; font-size: 14px;">
              <strong style="font-weight: 600; display: block; margin-bottom: 4px;">Security Notice:</strong>
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #718096; font-size: 12px; padding-bottom: 20px;">
          <p style="margin: 0 0 4px 0; font-weight: 400;">© ${new Date().getFullYear()} RoofCal. All rights reserved.</p>
          <p style="margin: 0; opacity: 0.8;">This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmailWithCode(
    email,
    resetUrl, // Pass resetUrl as the "code" parameter for validation
    "Reset Your Password - RoofCal",
    htmlContent
  );
}
