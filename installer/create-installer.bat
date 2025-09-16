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
    powershell -Command "Invoke-WebRequest -Uri 'https://nsis.sourceforge.io/mediawiki/images/4/4a/Nsis-3.08-setup.exe' -OutFile 'nsis-3.08-setup.exe'"
    if errorlevel 1 (
        echo Failed to download NSIS. Please download manually from: https://nsis.sourceforge.io/
        pause
        exit /b 1
    )
)

echo Installing NSIS...
nsis-3.08-setup.exe /S
if errorlevel 1 (
    echo Failed to install NSIS. Please install manually.
    pause
    exit /b 1
)

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
echo InstallDir $PROGRAMFILES\${COMPANYNAME}
echo Name ${APPNAME}
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
echo     file "..\electron-app\dist\PortOfExiles.exe"
echo     file "..\chrome-extension\chrome-extension.zip"
echo     file "..\firefox-extension\firefox-extension.zip"
echo     file "..\README.md"
echo     file "..\LICENSE"
echo.
echo     writeUninstaller $INSTDIR\uninstall.exe
echo.
echo     createDirectory $SMPROGRAMS\${COMPANYNAME}
echo     createShortCut $SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk $INSTDIR\PortOfExiles.exe
echo     createShortCut $DESKTOP\${APPNAME}.lnk $INSTDIR\PortOfExiles.exe
echo.
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "DisplayName" ${APPNAME}
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "UninstallString" "$INSTDIR\uninstall.exe"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "InstallLocation" "$INSTDIR"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "DisplayIcon" "$INSTDIR\PortOfExiles.exe"
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "Publisher" ${COMPANYNAME}
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "HelpLink" ${HELPURL}
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "URLUpdateInfo" ${UPDATEURL}
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "URLInfoAbout" ${ABOUTURL}
echo     WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "DisplayVersion" ${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "VersionMajor" ${VERSIONMAJOR}
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "VersionMinor" ${VERSIONMINOR}
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "NoModify" 1
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "NoRepair" 1
echo     WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}" "EstimatedSize" ${INSTALLSIZE}
echo sectionEnd
echo.
echo section "uninstall"
echo     delete $INSTDIR\PortOfExiles.exe
echo     delete $INSTDIR\chrome-extension.zip
echo     delete $INSTDIR\firefox-extension.zip
echo     delete $INSTDIR\README.md
echo     delete $INSTDIR\LICENSE
echo     delete $INSTDIR\uninstall.exe
echo     rmDir $INSTDIR
echo.
echo     delete $SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk
echo     rmDir $SMPROGRAMS\${COMPANYNAME}
echo     delete $DESKTOP\${APPNAME}.lnk
echo.
echo     DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME}"
echo sectionEnd
) > installer.nsi

echo Building installer...
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

