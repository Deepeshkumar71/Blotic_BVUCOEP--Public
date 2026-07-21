# SMTP Email Setup Guide

## ✅ Setup Complete!

I've set up SMTP email functionality for sending welcome emails to new users.

---

## 📁 Files Created:

1. **`api/send-welcome-email.ts`** - Vercel serverless function
2. **`server/api-server.ts`** - Local development API server
3. **`.env.local`** - SMTP credentials (local development)
4. **`Register.tsx`** - Updated with email integration
5. **`vite.config.ts`** - Added API proxy for local dev

---

## 🔧 Setup Steps:

### 1. **Install Dependencies**

```bash
npm install
```

This will install:
- `nodemailer` - Email sending library
- `@vercel/node` - Vercel serverless functions
- `@types/nodemailer` - TypeScript types

---

### 2. **Configure Gmail App Password**

1. Go to your Google Account: https://myaccount.google.com
2. Enable **2-Step Verification** (Security → 2-Step Verification)
3. Generate **App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: **Mail**
   - Select device: **Other (Custom name)** → "BLOTIC Website"
   - Click **Generate**
   - Copy the 16-character password

4. Update `.env.local`:
```env
SMTP_USER=bloticbvucoep@gmail.com
SMTP_PASS=your_16_char_app_password_here
```

---

### 3. **Configure Vercel Environment Variables**

For production, add these to Vercel:

1. Go to: **Vercel Dashboard → Project Settings → Environment Variables**
2. Add these variables:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=bloticbvucoep@gmail.com
   SMTP_PASS=your_app_password_here
   ```

---

### 4. **Test Locally**

**Option 1: With API Server (Recommended)**
```bash
# Install dependencies first
npm install

# Start both API server and frontend
npm run dev:email
```

**Option 2: Just Frontend**
```bash
# Start only frontend (email won't work)
npm run dev
```

The API server runs on port 3001 and handles email sending.
The frontend runs on port 8080 and proxies `/api` requests to the API server.

---

### 5. **Deploy to Vercel**

```bash
# Deploy to production
npm run deploy

# Or push to GitHub (if auto-deploy is enabled)
git add .
git commit -m "Add SMTP email functionality"
git push
```

---

## 📧 Email Features:

✅ **Beautiful HTML template** with BLOTIC branding
✅ **Personalized greeting** with user's name
✅ **Quick start checklist** for new members
✅ **Dashboard link** button
✅ **Links to events, team, gallery**
✅ **Professional footer** with contact info
✅ **Mobile responsive** design
✅ **Non-blocking** - won't fail registration if email fails

---

## 🔒 Security:

- ✅ `.env.local` is in `.gitignore` (not committed)
- ✅ Uses Gmail App Password (not regular password)
- ✅ SMTP credentials stored as environment variables
- ✅ Serverless function runs on Netlify (secure)

---

## 🧪 Testing:

### Test the Netlify Function Locally:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run functions locally
netlify dev

# Test the function
curl -X POST http://localhost:8888/.netlify/functions/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "user_id": "123456"
  }'
```

---

## 🐛 Troubleshooting:

### Email not sending?
- ✅ Check Gmail App Password is correct
- ✅ Verify 2FA is enabled on Gmail account
- ✅ Check Netlify environment variables are set
- ✅ Check function logs in Netlify dashboard
- ✅ Verify SMTP credentials in `.env.local`

### Function not found?
- ✅ Ensure `netlify.toml` exists
- ✅ Check function path: `netlify/functions/send-welcome-email.ts`
- ✅ Redeploy to Netlify

### Gmail blocking?
- ✅ Use App Password (not regular password)
- ✅ Enable "Less secure app access" (if needed)
- ✅ Check Gmail sending limits (500 emails/day)

---

## 📊 Email Sending Limits:

**Gmail Free Account:**
- 500 emails per day
- 100 recipients per email
- Sufficient for most use cases

**If you need more:**
- Use **SendGrid** (Free: 100/day, Paid: unlimited)
- Use **AWS SES** (Very cheap, reliable)
- Use **Mailgun** (Free: 5,000/month)

---

## 🎯 Alternative SMTP Providers:

### SendGrid:
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
```

### Mailgun:
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your_mailgun_password
```

### AWS SES:
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_access_key
SMTP_PASS=your_aws_secret_key
```

---

## ✅ Checklist:

- [ ] Installed dependencies (`npm install`)
- [ ] Generated Gmail App Password
- [ ] Updated `.env.local` with SMTP credentials
- [ ] Added environment variables to Netlify
- [ ] Tested locally with `npm run dev`
- [ ] Registered test user and verified email received
- [ ] Deployed to Netlify
- [ ] Tested in production

---

## 🎉 Done!

Your SMTP email system is ready! Every new user will automatically receive a beautiful welcome email when they register.

**Need help?** Check the Netlify function logs or reach out to the team.
