@echo off
setlocal
cd /d "%~dp0app"
echo Word Tap: http://127.0.0.1:5180/
echo Settings: http://127.0.0.1:5180/settings
echo Press Ctrl+C to stop the local server.
echo.
call pnpm dev
endlocal
