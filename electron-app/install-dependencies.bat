@echo off
echo Installing dependencies for POE Trade Data Viewer...
echo.

echo Removing old node_modules...
if exist node_modules rmdir /s /q node_modules

echo Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo Installing dependencies...
npm install

echo.
echo Installation complete!
echo.
echo Note: If you encounter any issues with nut-js, you may need to:
echo 1. Install Visual Studio Build Tools (for Windows)
echo 2. Run: npm install --global windows-build-tools
echo 3. Or use: npm install --global @microsoft/rush-stack-compiler-3.9
echo.
echo To start the app, run: npm start
pause
