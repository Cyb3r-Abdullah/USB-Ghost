@echo off
title USB Tracker
color 0A
mode con cols=70 lines=25

echo ========================================
echo    USB TRACKER SYSTEM
echo ========================================
echo.
echo [*] Initializing...
echo.

set USB_PATH=%~dp0

if exist "%USB_PATH%usb-tracker\Python\python.exe" (
    echo [*] Using portable Python
    set PYTHON="%USB_PATH%usb-tracker\Python\python.exe"
) else (
    echo [*] Using system Python
    set PYTHON=python
)

echo.
echo [*] Running tracker...
echo.

%PYTHON% "%USB_PATH%usb-tracker\Tracker1.0"

echo.
echo ========================================
echo    TRACKING COMPLETE!
echo ========================================
echo.
pause