@echo off
cd /d "%~dp0"
title Bitki Kesif Portali - Masaustu Uygulamasi

echo ========================================================
echo   BITKI KESIF PORTALI MASAUSTU UYGULAMASI BASLATILIYOR
echo ========================================================
echo.

java BitkiGUI.java
if %errorlevel% neq 0 (
    echo.
    echo [HATA] Uygulama baslatilamadi. Java yuklu oldugundan emin olun.
    echo.
)
pause
