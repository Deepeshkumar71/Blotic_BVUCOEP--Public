# Custom SMTP Password Reset Setup Guide

This guide will help you set up the custom SMTP server for password reset functionality with code-based fallback.

## 🔧 Database Setup

### 1. Run the Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of database/migrations/password_reset_system.sql
-- This creates the necessary tables and functions
```

### 2. Required Tables Created

- `password_reset_codes` - Stores 6-digit reset codes
- `email_queue` - Queue for emails to be sent via SMTP

## 📧 SMTP Configuration

### 1. Environment Variables

Add these to your `.env.local` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=BLOTIC <noreply@blotic.com>
```

### 2. Gmail Setup (Example)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this as `SMTP_PASS`

### 3. Other SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## 🛠️ Installation

### 1. Install Required Dependencies

```bash
npm install nodemailer @types/nodemailer
```

### 2. Update the API Endpoint

In `src/pages/api/send-email.ts`, uncomment the nodemailer code:

```typescript
// Uncomment these lines after installing nodemailer
import nodemailer from 'nodemailer';

// Uncomment the transporter and sendMail code
```

## 🔄 How It Works

### Password Reset Flow

1. **User requests password reset**
   - System tries email link method first (Supabase default)
   - If that fails, switches to code method

2. **Code Method Process**:
   - Generates 6-digit code
   - Stores in `password_reset_codes` table
   - Queues email in `email_queue` table
   - Sends email via custom SMTP

3. **User receives email** with:
   - Professional HTML template
   - 6-digit reset code
   - 15-minute expiration

4. **User enters code** on reset page
   - Validates code against database
   - Updates password if valid
   - Marks code as used

## 🎨 Email Templates

The system includes:

- **HTML Template**: Professional design with BLOTIC branding
- **Plain Text**: Fallback for email clients
- **Responsive**: Works on all devices
- **Security Features**: Clear expiration and security notices

## 🔒 Security Features

- **Code Expiration**: 15 minutes
- **Single Use**: Codes can only be used once
- **Rate Limiting**: Prevents spam
- **Audit Trail**: All attempts logged
- **Secure Storage**: Codes stored securely in database

## 🧪 Testing

### 1. Test Email Sending

```bash
# Test the API endpoint
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email"
  }'
```

### 2. Test Password Reset Flow

1. Go to `/forgot-password`
2. Enter your email
3. Check email for reset code
4. Go to reset page and enter code
5. Set new password

## 🔧 Troubleshooting

### Common Issues

**1. SMTP Authentication Failed**
- Check username/password
- Verify 2FA and app passwords for Gmail
- Check firewall/network restrictions

**2. Emails Not Sending**
- Check SMTP configuration
- Verify email queue table
- Check server logs

**3. Codes Not Working**
- Check code expiration (15 minutes)
- Verify code hasn't been used
- Check database connection

### Debug Mode

Enable debug logging in the email service:

```typescript
// Add to your SMTP configuration
debug: true,
logger: true
```

## 📊 Monitoring

### Database Queries

```sql
-- Check email queue status
SELECT status, COUNT(*) FROM email_queue GROUP BY status;

-- Check recent reset attempts
SELECT email, created_at, used_at 
FROM password_reset_codes 
ORDER BY created_at DESC 
LIMIT 10;

-- Clean up old data
SELECT cleanup_expired_reset_codes();
SELECT cleanup_old_emails();
```

## 🚀 Production Deployment

### 1. Environment Setup

- Set production SMTP credentials
- Configure proper domain for email links
- Set up monitoring and alerting

### 2. Security Checklist

- [ ] Remove debug codes from production
- [ ] Set up proper email domain authentication (SPF, DKIM)
- [ ] Configure rate limiting
- [ ] Set up monitoring for failed emails
- [ ] Regular cleanup of old codes/emails

### 3. Performance Optimization

- Set up background job for email processing
- Configure connection pooling for SMTP
- Implement retry logic for failed emails
- Monitor email delivery rates

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Verify your SMTP configuration
3. Check database connectivity
4. Review server logs for errors

The system is designed to gracefully fallback between email links and codes, ensuring users can always reset their passwords.
