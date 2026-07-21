# Gmail SMTP Setup Guide

Since you want to use Gmail, here are two easy options:

## Option 1: EmailJS with Gmail (Recommended - No Backend Required)

### Step 1: Create EmailJS Account
1. Go to [emailjs.com](https://emailjs.com)
2. Sign up with your Gmail account
3. Verify your email

### Step 2: Add Gmail Service
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Select "Gmail"
4. Click "Connect Account" and authorize with your Gmail
5. Note your **Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template
1. Go to "Email Templates"
2. Click "Create New Template"
3. Use this template:
   ```
   Subject: {{subject}}
   
   To: {{to_email}}
   
   {{message}}
   
   HTML Content:
   {{{html_message}}}
   ```
4. Note your **Template ID** (e.g., `template_xyz789`)

### Step 4: Get Public Key
1. Go to "Account" → "General"
2. Copy your **Public Key** (e.g., `user_def456`)

### Step 5: Update Your Code
1. Add EmailJS script to `public/index.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   <script>
     emailjs.init('YOUR_PUBLIC_KEY_HERE');
   </script>
   ```

2. Create `.env.local` file in your project root:
   ```
   REACT_APP_EMAILJS_SERVICE_ID=service_abc123
   REACT_APP_EMAILJS_TEMPLATE_ID=template_xyz789
   REACT_APP_EMAILJS_PUBLIC_KEY=user_def456
   ```

## Option 2: Direct Gmail SMTP (Requires Backend)

If you want to use direct Gmail SMTP, you need:

### Step 1: Enable App Passwords
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security → App passwords
4. Generate an app password for "Mail"
5. Save the 16-character password

### Step 2: Create Backend API
You'll need a Node.js backend with nodemailer:
```bash
npm install nodemailer
```

### Step 3: Environment Variables
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

## Quick Test

After setup, test your email system:
1. Go to forgot password page
2. Enter your email
3. Check your Gmail inbox for the reset code!

**Recommendation: Use EmailJS - it's easier and works immediately with Gmail!**
