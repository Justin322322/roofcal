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
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; padding: 8px;">
              <svg fill="#ffffff" height="40" width="40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-51.2 -51.2 614.40 614.40" xml:space="preserve" stroke="#ffffff" style="display: block;">
                <g>
                  <g>
                    <path d="M246.858,33.002c-0.794-4.319-4.937-7.172-9.256-6.383c-29.545,5.43-46.818,23.145-60.697,37.38 c-14.443,14.814-23.983,24.6-44.933,24.6c-20.949,0-30.49-9.785-44.934-24.6C70.992,47.541,49.014,24.998,7.95,24.998 c-4.391,0-7.95,3.56-7.95,7.95v102.207c0,4.391,3.56,7.95,7.95,7.95s7.95-3.56,7.95-7.95V41.239 C45.134,43.8,61.278,60.355,75.656,75.103c13.158,13.495,24.79,25.408,45.189,28.571v226.529c0,4.391,3.56,7.95,7.95,7.95 s7.95-3.56,7.95-7.95V104.356c24.463-1.483,37.078-14.417,51.546-29.256c12.945-13.278,27.618-28.327,52.185-32.841 C244.794,41.465,247.652,37.321,246.858,33.002z"></path>
                  </g>
                </g>
                <g>
                  <g>
                    <path d="M504.05,24.998c-41.063,0-63.042,22.542-79.092,39.003C410.515,78.814,400.972,88.6,380.023,88.6 c-20.951,0-30.492-9.786-44.937-24.601c-13.877-14.232-31.148-31.945-60.686-37.377c-4.319-0.79-8.462,2.064-9.257,6.381 c-0.794,4.319,2.063,8.463,6.381,9.257c24.562,4.516,39.233,19.563,52.178,32.839c14.471,14.841,27.088,27.774,51.554,29.256 v98.642c0,4.391,3.56,7.95,7.95,7.95s7.95-3.56,7.95-7.95v-99.325c20.397-3.164,32.029-15.077,45.189-28.574 c14.377-14.745,30.521-31.3,59.756-33.861v334.759c-36.009,2.685-56.161,23.34-71.139,38.702l-0.002,0.002 c-11.61,11.906-20.057,20.561-33.803,23.5V245.4c0-4.391-3.56-7.95-7.95-7.95s-7.95,3.56-7.95,7.95v193.712 c-17.719-1.401-26.87-10.772-40.169-24.412c-16.049-16.459-38.028-39.001-79.091-39.001s-63.041,22.543-79.089,39.002 c-13.296,13.638-22.446,23.009-40.161,24.411v-66.507c0-4.391-3.56-7.95-7.95-7.95c-4.391,0-7.95,3.56-7.95,7.95v65.596 c-13.747-2.938-22.194-11.593-33.806-23.502c-14.979-15.362-35.13-36.018-71.139-38.702V186.037c0-4.391-3.56-7.95-7.95-7.95 S0,181.647,0,186.037v229.411c0,4.391,3.56,7.95,7.95,7.95c20.949,0,30.49,9.785,44.934,24.6 c16.048,16.459,38.026,39.002,79.089,39.002c41.063,0,63.041-22.543,79.089-39.002c14.443-14.814,23.983-24.6,44.933-24.6 s30.492,9.786,44.937,24.601c16.048,16.459,38.027,39.001,79.09,39.001c41.064,0,63.043-22.542,79.091-39.001 c14.444-14.814,23.986-24.601,44.936-24.601c4.391,0,7.95-3.56,7.95-7.95v-382.5C512,28.558,508.44,24.998,504.05,24.998z M496.099,407.903L496.099,407.903c-22.408,2.367-34.54,14.812-48.371,28.997c-15.631,16.031-33.347,34.201-67.706,34.201 s-52.075-18.17-67.708-34.203c-15.381-15.776-28.666-29.399-56.32-29.399c-27.653,0-40.938,13.625-56.318,29.4 c-15.63,16.032-33.346,34.202-67.704,34.202c-34.359,0-52.075-18.17-67.706-34.204c-13.828-14.182-25.964-26.626-48.367-28.993 v-15.965c29.234,2.561,45.377,19.116,59.756,33.864c15.381,15.774,28.665,29.398,56.317,29.398 c27.653,0,40.938-13.625,56.318-29.4c15.63-16.032,33.346-34.202,67.704-34.202c34.359,0,52.076,18.17,67.706,34.201 c15.382,15.777,28.667,29.401,56.321,29.401s40.939-13.625,56.32-29.399l0.002-0.001c14.377-14.745,30.521-31.3,59.756-33.861 V407.903z"></path>
                  </g>
                </g>
              </svg>
            </div>
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
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #4a7c7e, #2d5a5c); border-radius: 8px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; padding: 8px;">
              <svg fill="#ffffff" height="40" width="40" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="-51.2 -51.2 614.40 614.40" xml:space="preserve" stroke="#ffffff" style="display: block;">
                <g>
                  <g>
                    <path d="M246.858,33.002c-0.794-4.319-4.937-7.172-9.256-6.383c-29.545,5.43-46.818,23.145-60.697,37.38 c-14.443,14.814-23.983,24.6-44.933,24.6c-20.949,0-30.49-9.785-44.934-24.6C70.992,47.541,49.014,24.998,7.95,24.998 c-4.391,0-7.95,3.56-7.95,7.95v102.207c0,4.391,3.56,7.95,7.95,7.95s7.95-3.56,7.95-7.95V41.239 C45.134,43.8,61.278,60.355,75.656,75.103c13.158,13.495,24.79,25.408,45.189,28.571v226.529c0,4.391,3.56,7.95,7.95,7.95 s7.95-3.56,7.95-7.95V104.356c24.463-1.483,37.078-14.417,51.546-29.256c12.945-13.278,27.618-28.327,52.185-32.841 C244.794,41.465,247.652,37.321,246.858,33.002z"></path>
                  </g>
                </g>
                <g>
                  <g>
                    <path d="M504.05,24.998c-41.063,0-63.042,22.542-79.092,39.003C410.515,78.814,400.972,88.6,380.023,88.6 c-20.951,0-30.492-9.786-44.937-24.601c-13.877-14.232-31.148-31.945-60.686-37.377c-4.319-0.79-8.462,2.064-9.257,6.381 c-0.794,4.319,2.063,8.463,6.381,9.257c24.562,4.516,39.233,19.563,52.178,32.839c14.471,14.841,27.088,27.774,51.554,29.256 v98.642c0,4.391,3.56,7.95,7.95,7.95s7.95-3.56,7.95-7.95v-99.325c20.397-3.164,32.029-15.077,45.189-28.574 c14.377-14.745,30.521-31.3,59.756-33.861v334.759c-36.009,2.685-56.161,23.34-71.139,38.702l-0.002,0.002 c-11.61,11.906-20.057,20.561-33.803,23.5V245.4c0-4.391-3.56-7.95-7.95-7.95s-7.95,3.56-7.95,7.95v193.712 c-17.719-1.401-26.87-10.772-40.169-24.412c-16.049-16.459-38.028-39.001-79.091-39.001s-63.041,22.543-79.089,39.002 c-13.296,13.638-22.446,23.009-40.161,24.411v-66.507c0-4.391-3.56-7.95-7.95-7.95c-4.391,0-7.95,3.56-7.95,7.95v65.596 c-13.747-2.938-22.194-11.593-33.806-23.502c-14.979-15.362-35.13-36.018-71.139-38.702V186.037c0-4.391-3.56-7.95-7.95-7.95 S0,181.647,0,186.037v229.411c0,4.391,3.56,7.95,7.95,7.95c20.949,0,30.49,9.785,44.934,24.6 c16.048,16.459,38.026,39.002,79.089,39.002c41.063,0,63.041-22.543,79.089-39.002c14.443-14.814,23.983-24.6,44.933-24.6 s30.492,9.786,44.937,24.601c16.048,16.459,38.027,39.001,79.09,39.001c41.064,0,63.043-22.542,79.091-39.001 c14.444-14.814,23.986-24.601,44.936-24.601c4.391,0,7.95-3.56,7.95-7.95v-382.5C512,28.558,508.44,24.998,504.05,24.998z M496.099,407.903L496.099,407.903c-22.408,2.367-34.54,14.812-48.371,28.997c-15.631,16.031-33.347,34.201-67.706,34.201 s-52.075-18.17-67.708-34.203c-15.381-15.776-28.666-29.399-56.32-29.399c-27.653,0-40.938,13.625-56.318,29.4 c-15.63,16.032-33.346,34.202-67.704,34.202c-34.359,0-52.075-18.17-67.706-34.204c-13.828-14.182-25.964-26.626-48.367-28.993 v-15.965c29.234,2.561,45.377,19.116,59.756,33.864c15.381,15.774,28.665,29.398,56.317,29.398 c27.653,0,40.938-13.625,56.318-29.4c15.63-16.032,33.346-34.202,67.704-34.202c34.359,0,52.076,18.17,67.706,34.201 c15.382,15.777,28.667,29.401,56.321,29.401s40.939-13.625,56.32-29.399l0.002-0.001c14.377-14.745,30.521-31.3,59.756-33.861 V407.903z"></path>
                  </g>
                </g>
              </svg>
            </div>
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
