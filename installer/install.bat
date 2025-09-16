@echo off
echo ========================================
echo    Port of Exiles - Installation
echo ========================================
echo.
echo This installer will set up Port of Exiles on your system.
echo.
echo Port of Exiles is a Path of Exile trade automation tool that helps
echo you automatically purchase items and manage your trading activities.
echo.
echo Requirements:
echo - Windows 10 or later
echo - Path of Exile installed
echo - Chrome or Firefox browser
echo.
echo This installer will:
echo 1. Create the application directory
echo 2. Install the main application
echo 3. Create desktop and start menu shortcuts
echo 4. Set up browser extensions
echo.
pause

echo.
echo Creating installation directory...
if not exist "%USERPROFILE%\PortOfExiles" mkdir "%USERPROFILE%\PortOfExiles"
if not exist "%USERPROFILE%\PortOfExiles\extensions" mkdir "%USERPROFILE%\PortOfExiles\extensions"

echo.
echo Copying application files...
if exist "PortOfExiles.exe" (
    copy "PortOfExiles.exe" "%USERPROFILE%\PortOfExiles\"
    echo ✓ Main application installed
) else (
    echo ✗ PortOfExiles.exe not found in current directory
    echo Please make sure you're running this installer from the correct location.
    pause
    exit /b 1
)

if exist "chrome-extension.zip" (
    copy "chrome-extension.zip" "%USERPROFILE%\PortOfExiles\extensions\"
    echo ✓ Chrome extension package copied
)

if exist "firefox-extension.zip" (
    copy "firefox-extension.zip" "%USERPROFILE%\PortOfExiles\extensions\"
    echo ✓ Firefox extension package copied
)

echo.
echo Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Port of Exiles.lnk'); $Shortcut.TargetPath = '%USERPROFILE%\PortOfExiles\PortOfExiles.exe'; $Shortcut.WorkingDirectory = '%USERPROFILE%\PortOfExiles'; $Shortcut.Description = 'Port of Exiles - Path of Exile Trade Automation'; $Shortcut.Save()"
echo ✓ Desktop shortcut created

echo.
echo Creating start menu shortcut...
if not exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Port of Exiles" mkdir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Port of Exiles"
powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\Microsoft\Windows\Start Menu\Programs\Port of Exiles\Port of Exiles.lnk'); $Shortcut.TargetPath = '%USERPROFILE%\PortOfExiles\PortOfExiles.exe'; $Shortcut.WorkingDirectory = '%USERPROFILE%\PortOfExiles'; $Shortcut.Description = 'Port of Exiles - Path of Exile Trade Automation'; $Shortcut.Save()"
echo ✓ Start menu shortcut created

echo.
echo ========================================
echo    Installation Complete!
echo ========================================
echo.
echo Port of Exiles has been installed to:
echo %USERPROFILE%\PortOfExiles
echo.
echo Desktop and Start Menu shortcuts have been created.
echo.
echo Next steps:
echo.
echo 1. INSTALL BROWSER EXTENSIONS:
echo    - Chrome: Go to chrome://extensions/, enable Developer mode,
echo      click "Load unpacked", and select the chrome-extension folder
echo    - Firefox: Go to about:debugging, click "This Firefox",
echo      click "Load Temporary Add-on", and select the manifest.json file
echo.
echo 2. CONFIGURE THE APPLICATION:
echo    - Start Port of Exiles from the desktop shortcut
echo    - Set up your Google OAuth credentials
echo    - Configure your Stripe payment settings
echo    - Set up your backend API endpoint
echo.
echo 3. START USING PORT OF EXILES:
echo    - Log in with your Google account
echo    - Navigate to Path of Exile trading sites
echo    - Use the automation features to enhance your trading
echo.
echo For support and documentation, visit:
echo https://github.com/your-username/port-of-exiles
echo.
echo For configuration help, see the README.md file in the installation directory.
echo.
echo Thank you for using Port of Exiles!
echo.
pause

