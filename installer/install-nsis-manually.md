# Manual NSIS Installation Guide

Since the automatic NSIS installation requires administrator privileges, please follow these steps:

## Option 1: Install NSIS Manually
1. Download NSIS from: https://nsis.sourceforge.io/Download
2. Run the installer as Administrator
3. Install to the default location (usually `C:\Program Files (x86)\NSIS\`)
4. Add NSIS to your PATH environment variable

## Option 2: Use Portable NSIS
1. Download the portable version of NSIS
2. Extract it to a folder (e.g., `C:\nsis\`)
3. Update the installer script to use the portable version

## After Installation
Once NSIS is installed, run the installer script again:
```
.\installer\create-installer.bat
```

The script will then:
1. Build the Electron application
2. Create the NSIS installer script
3. Compile the installer executable
