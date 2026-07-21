@echo off
echo Setting up email functionality for BLOTIC...

echo.
echo 📧 Step 1: Deploy Supabase Edge Function
echo ========================================
npx supabase functions deploy send-reset-email

echo.
echo 🔧 Step 2: Check your Supabase SMTP Configuration
echo ================================================
echo 1. Go to your Supabase Dashboard
echo 2. Navigate to Settings ^> SMTP
echo 3. Configure your email provider (Gmail, Outlook, etc.)
echo 4. Test the SMTP connection

echo.
echo 🧪 Step 3: Test Email Sending
echo =============================
echo 1. Go to /forgot-password
echo 2. Enter your email address
echo 3. Check your email inbox for the reset code
echo 4. The system will try:
echo    - Edge Function (custom email with code)
echo    - Supabase Auth SMTP (default reset email)

echo.
echo ✅ Setup complete!
echo.
echo 📋 If emails still don't work:
echo 1. Check Supabase logs for Edge Function errors
echo 2. Verify SMTP configuration in Supabase Dashboard
echo 3. Check spam/junk folder
echo 4. Try with a different email address
echo.
pause
