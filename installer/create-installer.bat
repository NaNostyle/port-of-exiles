@echo off
echo ========================================
echo    Port of Exiles - Installer Creator
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "electron-app\package.json" (
    echo Error: This script must be run from the project root directory.
    echo Please navigate to the project root and run this script again.
    pause
    exit /b 1
)

echo Creating installer directory...
if not exist "installer" mkdir "installer"
cd installer

echo Downloading NSIS (Nullsoft Scriptable Install System)...
if not exist "nsis-3.08-setup.exe" (
    echo Downloading NSIS installer...
    powershell -Command "Invoke-WebRequest -Uri 'https://sourceforge.net/projects/nsis/files/NSIS%203/3.08/nsis-3.08-setup.exe/download' -OutFile 'nsis-3.08-setup.exe'"
    if errorlevel 1 (
        echo Failed to download NSIS. Please download manually from: https://nsis.sourceforge.io/
        pause
        exit /b 1
    )
)

echo NSIS is already installed. Proceeding with installer creation...

echo Building Electron application...
cd ..\electron-app
call npm install
if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo Failed to build application.
    pause
    exit /b 1
)

echo Creating extension packages...
cd ..\chrome-extension
if exist "chrome-extension.zip" del "chrome-extension.zip"
powershell -Command "Compress-Archive -Path * -DestinationPath 'chrome-extension.zip' -Force"

cd ..\firefox-extension
if exist "firefox-extension.zip" del "firefox-extension.zip"
powershell -Command "Compress-Archive -Path * -DestinationPath 'firefox-extension.zip' -Force"

echo Creating installer script...
cd ..\installer

REM Create the NSIS installer script
echo Creating NSIS installer script...
(
echo !define APPNAME "Port of Exiles"
echo !define COMPANYNAME "Port of Exiles"
echo !define DESCRIPTION "Path of Exile Trade Automation Tool"
echo !define VERSIONMAJOR 1
echo !define VERSIONMINOR 0
echo !define VERSIONBUILD 0
echo !define HELPURL "https://github.com/your-username/port-of-exiles"
echo !define UPDATEURL "https://github.com/your-username/port-of-exiles/releases"
echo !define ABOUTURL "https://github.com/your-username/port-of-exiles"
echo !define INSTALLSIZE 50000
echo.
echo RequestExecutionLevel admin
echo InstallDir "$PROGRAMFILES\Port of Exiles"
echo Name "Port of Exiles"
echo outFile "PortOfExilesInstaller.exe"
echo.
echo !include LogicLib.nsh
echo.
echo page directory
echo page instfiles
echo.
echo !macro VerifyUserIsAdmin
echo UserInfo::GetAccountType
echo pop $0
echo ${If} $0 != "admin"
echo     messageBox mb_iconstop "Administrator rights required!"
echo     setErrorLevel 740
echo     quit
echo ${EndIf}
echo !macroend
echo.
echo function .onInit
echo     setShellVarContext all
echo     !insertmacro VerifyUserIsAdmin
echo functionEnd
echo.
echo section "install"
echo     setOutPath $INSTDIR
echo     file "..\electron-app\dist\win-unpacked\Port of Exiles.exe"
echo     file "..\electron-app\dist\win-unpacked\ffmpeg.dll"
echo     file "..\electron-app\dist\win-unpacked\d3dcompiler_47.dll"
echo     file "..\electron-app\dist\win-unpacked\libEGL.dll"
echo     file "..\electron-app\dist\win-unpacked\libGLESv2.dll"
echo     file "..\electron-app\dist\win-unpacked\vk_swiftshader.dll"
echo     file "..\electron-app\dist\win-unpacked\vulkan-1.dll"
echo     file "..\electron-app\dist\win-unpacked\resources.pak"
echo     file "..\electron-app\dist\win-unpacked\icudtl.dat"
echo     file "..\electron-app\dist\win-unpacked\snapshot_blob.bin"
echo     file "..\electron-app\dist\win-unpacked\v8_context_snapshot.bin"
echo     file "..\electron-app\dist\win-unpacked\chrome_100_percent.pak"
echo     file "..\electron-app\dist\win-unpacked\chrome_200_percent.pak"
echo     file "..\electron-app\dist\win-unpacked\LICENSE.electron.txt"
echo     file "..\electron-app\dist\win-unpacked\LICENSES.chromium.html"
echo     file "..\electron-app\dist\win-unpacked\vk_swiftshader_icd.json"
echo     file /r "..\electron-app\dist\win-unpacked\locales"
echo     file /r "..\electron-app\dist\win-unpacked\resources"
echo     file "..\chrome-extension\chrome-extension.zip"
echo     file "..\firefox-extension\firefox-extension.zip"
echo     file "..\README.md"
echo     file "..\LICENSE"
echo.
echo     writeUninstaller $INSTDIR\uninstall.exe
echo.
echo     createDirectory "$SMPROGRAMS\Port of Exiles"
echo     createShortCut "$SMPROGRAMS\Port of Exiles\Port of Exiles.lnk" "$INSTDIR\Port of Exiles.exe"
echo     createShortCut "$DESKTOP\Port of Exiles.lnk" "$INSTDIR\Port of Exiles.exe"
echo.
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "DisplayName" "Port of Exiles"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "UninstallString" "$INSTDIR\uninstall.exe"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "InstallLocation" "$INSTDIR"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "DisplayIcon" "$INSTDIR\Port of Exiles.exe"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "Publisher" "Port of Exiles"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "HelpLink" "https://github.com/your-username/port-of-exiles"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "URLUpdateInfo" "https://github.com/your-username/port-of-exiles/releases"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "URLInfoAbout" "https://github.com/your-username/port-of-exiles"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "DisplayVersion" "1.0.0"
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "VersionMajor" 1
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "VersionMinor" 0
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "NoModify" 1
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "NoRepair" 1
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "EstimatedSize" 50000
echo sectionEnd
echo.
echo section "uninstall"
echo     delete "$INSTDIR\Port of Exiles.exe"
echo     delete "$INSTDIR\ffmpeg.dll"
echo     delete "$INSTDIR\d3dcompiler_47.dll"
echo     delete "$INSTDIR\libEGL.dll"
echo     delete "$INSTDIR\libGLESv2.dll"
echo     delete "$INSTDIR\vk_swiftshader.dll"
echo     delete "$INSTDIR\vulkan-1.dll"
echo     delete "$INSTDIR\resources.pak"
echo     delete "$INSTDIR\icudtl.dat"
echo     delete "$INSTDIR\snapshot_blob.bin"
echo     delete "$INSTDIR\v8_context_snapshot.bin"
echo     delete "$INSTDIR\chrome_100_percent.pak"
echo     delete "$INSTDIR\chrome_200_percent.pak"
echo     delete "$INSTDIR\LICENSE.electron.txt"
echo     delete "$INSTDIR\LICENSES.chromium.html"
echo     delete "$INSTDIR\vk_swiftshader_icd.json"
echo     rmDir /r "$INSTDIR\locales"
echo     rmDir /r "$INSTDIR\resources"
echo     delete "$INSTDIR\chrome-extension.zip"
echo     delete "$INSTDIR\firefox-extension.zip"
echo     delete "$INSTDIR\README.md"
echo     delete "$INSTDIR\LICENSE"
echo     delete "$INSTDIR\uninstall.exe"
echo     rmDir $INSTDIR
echo.
echo     delete "$SMPROGRAMS\Port of Exiles\Port of Exiles.lnk"
echo     rmDir "$SMPROGRAMS\Port of Exiles"
echo     delete "$DESKTOP\Port of Exiles.lnk"
echo.
echo     DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles"
echo sectionEnd
) > installer.nsi

echo Building installer...
set "PATH=%PATH%;C:\Program Files (x86)\NSIS"
"C:\Program Files (x86)\NSIS\makensis.exe" installer.nsi
if errorlevel 1 (
    echo Failed to build installer with NSIS.
    echo Please check that NSIS is installed correctly.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Installer Created Successfully!
echo ========================================
echo.
echo The installer has been created as: PortOfExilesInstaller.exe
echo.
echo This installer includes:
echo - Port of Exiles application
echo - Chrome extension package
echo - Firefox extension package
echo - Documentation and license
echo.
echo You can now distribute this installer to users.
echo.
pause

