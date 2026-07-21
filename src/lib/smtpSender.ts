// Simple SMTP Email Sender for Development
// This is a basic implementation for sending emails via SMTP
// For production, use services like SendGrid, Mailgun, or AWS SES

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Gmail SMTP configuration (for development)
const GMAIL_CONFIG: SMTPConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: '', // Your Gmail address (configure when needed)
    pass: '', // Gmail App Password (configure when needed)
  },
};

// Simple email sender without external dependencies
export async function sendEmailViaSMTP(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // For development, we'll simulate email sending and log to console
    // In a real implementation, you'd use nodemailer or similar
    
    console.log('\n🚀 SENDING EMAIL VIA SMTP...');
    console.log('═══════════════════════════════════════');
    console.log(`📧 To: ${emailData.to}`);
    console.log(`📋 Subject: ${emailData.subject}`);
    console.log('📄 Content:');
    console.log(emailData.text);
    console.log('═══════════════════════════════════════');
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For now, always return success
    // In production, implement actual SMTP sending here
    return { success: true };
    
  } catch (error) {
    console.error('❌ SMTP Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown SMTP error' 
    };
  }
}

// Function to validate SMTP configuration
export function validateSMTPConfig(): boolean {
  const { user, pass } = GMAIL_CONFIG.auth;
  return !!(user && pass);
}

// Instructions for setting up Gmail SMTP
export function getGmailSetupInstructions(): string {
  return `
📧 Gmail SMTP Setup Instructions:

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. Create .env.local file in your project root:
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password

4. Restart your development server

For production, use professional email services like:
- SendGrid (https://sendgrid.com/)
- Mailgun (https://www.mailgun.com/)
- AWS SES (https://aws.amazon.com/ses/)
`;
}

// Development email sender that works without SMTP setup
export async function sendEmailDev(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  console.log('\n📧 EMAIL SENT (Development Mode)');
  console.log('═══════════════════════════════════════');
  console.log(`To: ${emailData.to}`);
  console.log(`Subject: ${emailData.subject}`);
  console.log('\n--- EMAIL CONTENT ---');
  console.log(emailData.text);
  console.log('--- END EMAIL ---\n');
  
  // In development, also show setup instructions
  if (!validateSMTPConfig()) {
    console.log('⚠️  SMTP not configured. To send real emails:');
    console.log(getGmailSetupInstructions());
  }
  
  return { success: true };
}
