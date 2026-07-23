@echo off
cd /d "%~dp0"
title Bitki Kesif Portali - Mobil ve Web Sunucusu
echo ========================================================
echo   BITKI KESIF PORTALI - MOBIL VE WEB SUNUCUSU (GEMINI AI)
echo ========================================================
echo.
echo [1] Web Sunucusu ve Gemini AI API (Port 3000) Baslatiliyor...
echo [2] Tarayicinizda Aciliyor (http://localhost:3000)...
echo.
start http://localhost:3000
node server.js
pause
