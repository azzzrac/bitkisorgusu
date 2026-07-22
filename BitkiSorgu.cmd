@echo off
cd /d "%~dp0"
if "%~1"=="" (
    java BitkiSorgu.java
) else (
    java BitkiSorgu.java %*
)
