@echo off
cd /d "%~dp0"
title Bitki Kesif Portali - Web Sunucusu
echo ========================================================
echo   BITKI KESIF PORTALI - MOBIL VE WEB SUNUCUSU
echo ========================================================
echo.
echo [1] Internet Tarayicinizda Aciliyor (http://localhost:8080)...
start http://localhost:8080
echo.
echo [2] Telefonunuzdan Acmak Icin:
echo     Bilgisayariniz ve Telefonunuz ayni Wi-Fi agindayken 
echo     asagidaki adresi telefonunuzun Chrome/Safari tarayicisina yazabilirsiniz.
echo.
python -m http.server 8080 2>nul || jwebserver -p 8080 2>nul
pause
