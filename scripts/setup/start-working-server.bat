@echo off
echo Starting BLOTIC with full backend support...
echo.
echo 🚀 Frontend will be available at:
echo    http://192.168.1.4:8080
echo    http://localhost:8080
echo.
echo 🔧 Backend API will be available at:
echo    http://localhost:3001
echo.
echo 📧 Password reset will work properly on:
echo    http://192.168.1.4:8080/forgot-password
echo.
echo Starting both frontend and backend servers...
npm run dev:full
