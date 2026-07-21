@echo off
echo Deploying Supabase Edge Function for email sending...

echo.
echo 📧 Deploying send-reset-email function...
npx supabase functions deploy send-reset-email

echo.
echo ✅ Email function deployed successfully!
echo.
echo 🔧 To test your setup:
echo 1. Go to /forgot-password
echo 2. Enter your email
echo 3. Check your email inbox for the reset code
echo 4. Follow the 3-step process
echo.
pause
