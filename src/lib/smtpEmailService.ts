// SMTP Email Service for sending actual emails
// You can configure this with your email provider (Gmail, Outlook, etc.)

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Email configuration - Update these with your email provider settings
const EMAIL_CONFIG: EmailConfig = {
  host: 'smtp.gmail.com', // Change to your SMTP host
  port: 587,
  secure: false, // true for 465, false for other ports
  user: process.env.REACT_APP_EMAIL_USER || '', // Your email
  pass: process.env.REACT_APP_EMAIL_PASS || '', // Your app password
};

// For development - you can use these popular email services:
const EMAIL_PROVIDERS = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
  },
};

// Send email using fetch to a backend service
export async function sendEmailSMTP(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    // If you have a backend email service, call it here
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...emailData,
        config: EMAIL_CONFIG,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true };
    } else {
      const error = await response.text();
      return { success: false, error };
    }
  } catch (error) {
    console.error('SMTP Email error:', error);
    return { success: false, error: 'Failed to send email via SMTP' };
  }
}

// Alternative: Use EmailJS for client-side email sending
export async function sendEmailJS(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const emailjs = (window as any).emailjs;
    if (!emailjs) {
      throw new Error('EmailJS not loaded - add script to index.html');
    }

    const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      throw new Error('EmailJS configuration missing - check environment variables');
    }

    const templateParams = {
      to_email: emailData.to,
      subject: emailData.subject,
      message: emailData.text,
      html_message: emailData.html,
    };

    const result = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.log('EmailJS result:', result);
    return { success: true };
  } catch (error) {
    console.error('EmailJS error:', error);
    return { success: false, error: `EmailJS failed: ${error}` };
  }
}

// Web3Forms service (free email service)
export async function sendEmailWeb3Forms(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('access_key', process.env.REACT_APP_WEB3FORMS_KEY || ''); // Get free key from web3forms.com
    formData.append('email', emailData.to);
    formData.append('subject', emailData.subject);
    formData.append('message', emailData.text);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error('Web3Forms error:', error);
    return { success: false, error: 'Failed to send email via Web3Forms' };
  }
}

// Instructions for setting up email services:
export const EMAIL_SETUP_INSTRUCTIONS = {
  gmail: {
    steps: [
      '1. Enable 2-factor authentication on your Gmail account',
      '2. Generate an App Password: Google Account > Security > App passwords',
      '3. Set REACT_APP_EMAIL_USER=your-email@gmail.com',
      '4. Set REACT_APP_EMAIL_PASS=your-16-char-app-password',
    ],
  },
  emailjs: {
    steps: [
      '1. Sign up at emailjs.com',
      '2. Create an email service (Gmail, Outlook, etc.)',
      '3. Create an email template',
      '4. Get your Service ID, Template ID, and Public Key',
      '5. Add EmailJS script to your index.html',
    ],
  },
  web3forms: {
    steps: [
      '1. Go to web3forms.com',
      '2. Get a free access key',
      '3. Set REACT_APP_WEB3FORMS_KEY=your-access-key',
      '4. No additional setup required',
    ],
  },
};
