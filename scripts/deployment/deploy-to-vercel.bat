@echo off
echo 🚀 BLOTIC Vercel Deployment Script
echo.
echo This script will deploy your BLOTIC project to Vercel
echo Make sure you have:
echo   ✅ Vercel account created
echo   ✅ Environment variables configured in Vercel dashboard
echo   ✅ Latest changes committed to Git
echo.
pause

echo.
echo 📦 Installing dependencies...
npm install

echo.
echo 🔨 Building project...
npm run build

echo.
echo 🚀 Deploying to Vercel...
npx vercel --prod

echo.
echo ✅ Deployment complete!
echo.
echo 🔍 Next steps:
echo   1. Check your Vercel dashboard for deployment status
echo   2. Test your website: https://your-project.vercel.app
echo   3. Verify API endpoints: https://your-project.vercel.app/api/health
echo   4. Test admin dashboard and core team pages
echo.
echo 📚 For troubleshooting, see VERCEL_DEPLOYMENT.md
echo.
pause
