!define APPNAME "Port of Exiles"
!define COMPANYNAME "Port of Exiles"
!define DESCRIPTION "Path of Exile Trade Automation Tool"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0
!define HELPURL "https://github.com/your-username/port-of-exiles"
!define UPDATEURL "https://github.com/your-username/port-of-exiles/releases"
!define ABOUTURL "https://github.com/your-username/port-of-exiles"
!define INSTALLSIZE 50000

RequestExecutionLevel admin
InstallDir "$PROGRAMFILES\Port of Exiles"
Name "Port of Exiles"
outFile "PortOfExilesInstaller.exe"

!include LogicLib.nsh

page directory
page instfiles

!macro VerifyUserIsAdmin
UserInfo::GetAccountType
pop $0
${If} $0 != "admin"
    messageBox mb_iconstop "Administrator rights required!"
    setErrorLevel 740
    quit
${EndIf}
!macroend

function .onInit
    setShellVarContext all
    !insertmacro VerifyUserIsAdmin
functionEnd

section "install"
    setOutPath $INSTDIR
    file "..\electron-app\dist\win-unpacked\Port of Exiles.exe"
    file "..\electron-app\dist\win-unpacked\ffmpeg.dll"
    file "..\electron-app\dist\win-unpacked\d3dcompiler_47.dll"
    file "..\electron-app\dist\win-unpacked\libEGL.dll"
    file "..\electron-app\dist\win-unpacked\libGLESv2.dll"
    file "..\electron-app\dist\win-unpacked\vk_swiftshader.dll"
    file "..\electron-app\dist\win-unpacked\vulkan-1.dll"
    file "..\electron-app\dist\win-unpacked\resources.pak"
    file "..\electron-app\dist\win-unpacked\icudtl.dat"
    file "..\electron-app\dist\win-unpacked\snapshot_blob.bin"
    file "..\electron-app\dist\win-unpacked\v8_context_snapshot.bin"
    file "..\electron-app\dist\win-unpacked\chrome_100_percent.pak"
    file "..\electron-app\dist\win-unpacked\chrome_200_percent.pak"
    file "..\electron-app\dist\win-unpacked\LICENSE.electron.txt"
    file "..\electron-app\dist\win-unpacked\LICENSES.chromium.html"
    file "..\electron-app\dist\win-unpacked\vk_swiftshader_icd.json"
    file /r "..\electron-app\dist\win-unpacked\locales"
    file /r "..\electron-app\dist\win-unpacked\resources"
    file "..\chrome-extension\chrome-extension.zip"
    file "..\firefox-extension\firefox-extension.zip"
    file "..\README.md"
    file "..\LICENSE"

    writeUninstaller $INSTDIR\uninstall.exe

    createDirectory "$SMPROGRAMS\Port of Exiles"
    createShortCut "$SMPROGRAMS\Port of Exiles\Port of Exiles.lnk" "$INSTDIR\Port of Exiles.exe"
    createShortCut "$DESKTOP\Port of Exiles.lnk" "$INSTDIR\Port of Exiles.exe"

    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "DisplayName" "Port of Exiles"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "DisplayIcon" "$INSTDIR\Port of Exiles.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "Publisher" "Port of Exiles"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "HelpLink" "https://github.com/your-username/port-of-exiles"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "URLUpdateInfo" "https://github.com/your-username/port-of-exiles/releases"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "URLInfoAbout" "https://github.com/your-username/port-of-exiles"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "DisplayVersion" "1.0.0"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "VersionMajor" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "VersionMinor" 0
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "NoRepair" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles" "EstimatedSize" 50000
sectionEnd

section "uninstall"
    delete "$INSTDIR\Port of Exiles.exe"
    delete "$INSTDIR\ffmpeg.dll"
    delete "$INSTDIR\d3dcompiler_47.dll"
    delete "$INSTDIR\libEGL.dll"
    delete "$INSTDIR\libGLESv2.dll"
    delete "$INSTDIR\vk_swiftshader.dll"
    delete "$INSTDIR\vulkan-1.dll"
    delete "$INSTDIR\resources.pak"
    delete "$INSTDIR\icudtl.dat"
    delete "$INSTDIR\snapshot_blob.bin"
    delete "$INSTDIR\v8_context_snapshot.bin"
    delete "$INSTDIR\chrome_100_percent.pak"
    delete "$INSTDIR\chrome_200_percent.pak"
    delete "$INSTDIR\LICENSE.electron.txt"
    delete "$INSTDIR\LICENSES.chromium.html"
    delete "$INSTDIR\vk_swiftshader_icd.json"
    rmDir /r "$INSTDIR\locales"
    rmDir /r "$INSTDIR\resources"
    delete "$INSTDIR\chrome-extension.zip"
    delete "$INSTDIR\firefox-extension.zip"
    delete "$INSTDIR\README.md"
    delete "$INSTDIR\LICENSE"
    delete "$INSTDIR\uninstall.exe"
    rmDir $INSTDIR

    delete "$SMPROGRAMS\Port of Exiles\Port of Exiles.lnk"
    rmDir "$SMPROGRAMS\Port of Exiles"
    delete "$DESKTOP\Port of Exiles.lnk"

    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Port of Exiles"
sectionEnd
