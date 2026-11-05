@echo off
title Wedding Video Booth
echo ========================================================
echo             WEDDING VIDEO BOOTH
echo ========================================================
echo.
echo Key Controls:
echo   - Press 'H' to record a video (or stop recording early)
echo   - Press 'Escape' or click the gear icon for Admin Panel
echo.
echo Starting web server and opening booth in your browser...
echo.
start http://localhost:5173
npm run dev
pause
