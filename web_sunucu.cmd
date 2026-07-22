@echo off
chcp 65001 > nul
title 🌱 Bitki Keşif Portalı - Web ve Mobil Sunucusu
echo ========================================================
echo   🌱 BİTKİ KEŞİF PORTALI - MOBİL VE WEB SUNUCUSU
echo ========================================================
echo.
echo [1] İnternet Tarayıcınızda Açılıyor...
start index.html
echo.
echo [2] Telefonunuzdan Açmak İçin:
echo     Bilgisayarınız ve Telefonunuz aynı Wi-Fi ağındayken 
echo     aşağıdaki adresi telefonunuzun Chrome/Safari tarayıcısına yazabilirsiniz.
echo.
python -m http.server 8080 2>nul || jwebserver -p 8080 2>nul
pause
