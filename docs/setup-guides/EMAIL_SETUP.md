# Email Setup Guide for Password Reset Codes

Your password reset system is now configured to try multiple email services. Here's how to set them up:

## Option 1: Web3Forms (Easiest - FREE)

1. Go to [web3forms.com](https://web3forms.com)
2. Enter your email and get a free access key
3. Create a `.env.local` file in your project root:
   ```
   REACT_APP_WEB3FORMS_KEY=your-access-key-here
   ```
4. Restart your development server

**Pros:** Free, no setup required, works immediately
**Cons:** Basic features only

## Option 2: EmailJS (Client-side)

1. Sign up at [emailjs.com](https://emailjs.com)
2. Connect your email service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{to_email}}` - Recipient email
   - `{{subject}}` - Email subject
   - `{{message}}` - Text content
   - `{{html_message}}` - HTML content
4. Get your Service ID, Template ID, and Public Key
5. Add to your `public/index.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
   <script>
     emailjs.init('YOUR_PUBLIC_KEY');
   </script>
   ```
6. Update `smtpEmailService.ts` with your IDs

**Pros:** Client-side, good free tier, reliable
**Cons:** Requires template setup

## Option 3: Gmail SMTP (Your own email)

1. Enable 2-factor authentication on your Gmail
2. Go to Google Account > Security > App passwords
3. Generate an app password for "Mail"
4. Add to `.env.local`:
   ```
   REACT_APP_EMAIL_USER=your-email@gmail.com
   REACT_APP_EMAIL_PASS=your-16-char-app-password
   ```
5. Create a backend API endpoint at `/api/send-email` to handle SMTP

**Pros:** Uses your own email, full control
**Cons:** Requires backend setup

## Option 4: Supabase Edge Functions

1. Deploy the Edge Function:
   ```bash
   npx supabase functions deploy send-email
   ```
2. (Optional) Add Resend API key for actual email sending:
   ```bash
   npx supabase secrets set RESEND_API_KEY=your-resend-key
   ```

**Pros:** Serverless, integrates with Supabase
**Cons:** Requires Supabase CLI setup

## Current Fallback System

If no email service is configured, the system will:
1. Show the reset code in browser console
2. Display an alert with the code
3. Log the full email content for debugging

## Testing Your Setup

1. Go to your forgot password page
2. Enter your email address
3. Check:
   - Browser console for logs
   - Your email inbox
   - Browser alerts (if email fails)

## Recommended Setup for Development

For quick setup, use **Web3Forms**:
1. Get free key from web3forms.com
2. Add `REACT_APP_WEB3FORMS_KEY=your-key` to `.env.local`
3. Restart your dev server
4. Test password reset - you should receive actual emails!

## Production Recommendations

For production, use:
- **EmailJS** for client-side sending
- **Supabase Edge Functions** with Resend API
- **Custom backend** with SendGrid/Mailgun

Your reset code system is now ready to send actual emails! 🚀
