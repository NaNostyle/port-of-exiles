@echo off
echo Setting up Path of Exile Trade Data Capture...
echo.

echo Installing Electron app dependencies...
cd electron-app
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies!
    pause
    exit /b 1
)

echo.
echo Setup complete!
echo.
echo To start the application:
echo 1. Run: cd electron-app && npm start
echo 2. Install the Chrome extension from the chrome-extension folder
echo 3. Navigate to pathofexile.com and perform trade searches
echo.
pause
