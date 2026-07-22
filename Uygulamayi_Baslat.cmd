@echo off
cd /d "%~dp0"
title Bitki Kesif Portali
:menu
cls
echo ========================================================
echo   BITKI KESIF PORTALI - BASLATICI MENU
echo ========================================================
echo.
echo  [1] Masaustu Uygulamasini Ac (Java GUI)
echo  [2] Web ve Mobil Surumunu Ac (Tarayici)
echo  [3] Komut Satiri Surumunu Ac (CLI)
echo  [4] Cikis
echo.
set /p secim="Lutfen yapmak istediginiz islemi secin (1-4): "

if "%secim%"=="1" (
    start java BitkiGUI.java
    exit
)
if "%secim%"=="2" (
    start index.html
    python -m http.server 8080 2>nul || jwebserver -p 8080 2>nul
    exit
)
if "%secim%"=="3" (
    start java BitkiSorgu.java
    exit
)
if "%secim%"=="4" exit

goto menu
