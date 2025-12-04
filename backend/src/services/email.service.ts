import sgMail from '@sendgrid/mail';

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
}

const fromEmail = process.env.FROM_EMAIL || 'noreply@pipeforge.com';
const fromName = process.env.FROM_NAME || 'PipeForge';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const isDev = process.env.NODE_ENV !== 'production';

export interface IEmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendWelcomeEmail(email: string, name?: string): Promise<void>;
}

export class EmailService implements IEmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    
    // In development, log the verification link to console
    if (isDev) {
      console.log('\n📧 ========== EMAIL VERIFICATION ==========');
      console.log(`To: ${email}`);
      console.log(`Verification URL: ${verifyUrl}`);
      console.log('==========================================\n');
    }
    
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Verify your PipeForge account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">PipeForge</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Verify your email</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Thanks for signing up! Please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" 
                 style="background: linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%); 
                        color: white; 
                        padding: 14px 28px; 
                        text-decoration: none; 
                        border-radius: 8px;
                        font-weight: bold;
                        display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Or copy this link: <br>
              <a href="${verifyUrl}" style="color: #6B4C9A;">${verifyUrl}</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              This link expires in 24 hours. If you didn't create an account, you can ignore this email.
            </p>
          </div>
        </div>
      `,
    };
    
    try {
      await sgMail.send(msg);
      if (isDev) {
        console.log('✅ Verification email sent successfully via SendGrid');
      }
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.response?.body || error.message);
      // In development, don't throw - the URL is logged above for manual verification
      if (!isDev) {
        throw error;
      }
      console.log('💡 Use the verification URL logged above to verify your account manually.');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    
    // In development, log the reset link to console
    if (isDev) {
      console.log('\n📧 ========== PASSWORD RESET ==========');
      console.log(`To: ${email}`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log('=======================================\n');
    }
    
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Reset your PipeForge password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">PipeForge</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Reset your password</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%); 
                        color: white; 
                        padding: 14px 28px; 
                        text-decoration: none; 
                        border-radius: 8px;
                        font-weight: bold;
                        display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Or copy this link: <br>
              <a href="${resetUrl}" style="color: #6B4C9A;">${resetUrl}</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
              This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
            </p>
          </div>
        </div>
      `,
    };
    
    try {
      await sgMail.send(msg);
      if (isDev) {
        console.log('✅ Password reset email sent successfully via SendGrid');
      }
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.response?.body || error.message);
      // In development, don't throw - the URL is logged above for manual reset
      if (!isDev) {
        throw error;
      }
      console.log('💡 Use the reset URL logged above to reset your password manually.');
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const displayName = name || email.split('@')[0];
    
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Welcome to PipeForge!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">PipeForge</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Welcome, ${displayName}! 🎉</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Your email has been verified and your account is ready to use.
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
              Start building amazing data workflows by connecting APIs, transforming data, and automating tasks.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${frontendUrl}/editor" 
                 style="background: linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%); 
                        color: white; 
                        padding: 14px 28px; 
                        text-decoration: none; 
                        border-radius: 8px;
                        font-weight: bold;
                        display: inline-block;">
                Create Your First Pipe
              </a>
            </div>
          </div>
        </div>
      `,
    };
    
    try {
      await sgMail.send(msg);
      if (isDev) {
        console.log('✅ Welcome email sent successfully via SendGrid');
      }
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.response?.body || error.message);
      // Don't throw - welcome email is not critical
    }
  }
}

export const emailService = new EmailService();
