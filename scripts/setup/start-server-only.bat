@echo off
echo Starting BLOTIC Backend Server...
echo.
echo 🔧 Backend API will be available at:
echo    http://localhost:3001
echo.
echo 📋 Available endpoints:
echo    GET  /api/health
echo    GET  /api/core-team
echo    GET  /api/analytics/summary
echo    POST /api/register
echo    POST /api/core-team/seed-faculty
echo.
echo Starting backend server...
npm run server:dev
