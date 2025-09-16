# Port of Exiles

[![License: BSL](https://img.shields.io/badge/License-BSL-blue.svg)](https://github.com/your-username/port-of-exiles/blob/main/LICENSE)
[![GitHub release](https://img.shields.io/github/release/your-username/port-of-exiles.svg)](https://github.com/your-username/port-of-exiles/releases)
[![Build Status](https://github.com/your-username/port-of-exiles/workflows/Build%20and%20Release/badge.svg)](https://github.com/your-username/port-of-exiles/actions)

**Port of Exiles** is a comprehensive Path of Exile trade automation tool that helps you automatically purchase items, manage your trading activities, and enhance your Path of Exile experience.

## ⚠️ License Notice

This project is licensed under the **Business Source License (BSL) 1.1**. This means:

- ✅ **Free for development and testing**
- ✅ **Free for personal, non-commercial use**
- ❌ **Commercial use requires a license**
- 🔄 **Will become open source (GPL v2.0+) on January 1, 2026**

For commercial licensing, please contact: contact@portofexiles.com

## 🚀 Features

### Core Functionality
- **🔄 Real-time Trade Monitoring**: Automatically captures and processes Path of Exile trade data
- **🤖 Auto-Buy System**: Intelligent automation for purchasing items with configurable parameters
- **🚀 Teleport Integration**: Seamless integration with Path of Exile's whisper system
- **📊 Live Dashboard**: Real-time monitoring of your trading activities and statistics

### Browser Extensions
- **🌐 Chrome Extension**: Full Manifest V3 support with modern architecture
- **🦊 Firefox Extension**: Complete compatibility with Firefox browsers
- **🍪 Cookie Management**: Automatic capture and synchronization of POESESSID cookies
- **🔗 WebSocket Communication**: Real-time data transfer between extension and desktop app

### Desktop Application
- **💻 Cross-Platform**: Windows, macOS, and Linux support via Electron
- **🎨 Modern UI**: Clean, intuitive interface with dark/light themes
- **⚙️ Advanced Configuration**: Comprehensive settings for power users
- **📈 Analytics**: Detailed statistics and performance metrics

### Security & Privacy
- **🔐 OAuth Integration**: Secure Google authentication
- **💳 Payment Processing**: Stripe integration for token purchases
- **🛡️ Data Protection**: Local data storage with encryption options
- **🔒 API Security**: Secure backend communication with JWT tokens

## 📦 Installation

### Quick Install (Recommended)

1. **Download the latest release** from [GitHub Releases](https://github.com/your-username/port-of-exiles/releases)
2. **Run the installer** (`PortOfExilesInstaller.exe` on Windows)
3. **Follow the setup wizard** to configure your API keys
4. **Install browser extensions** using the provided packages

### Manual Installation

#### Prerequisites
- **Node.js 18+** and npm ([Download](https://nodejs.org/))
- **Git** for cloning the repository
- **Chrome** or **Firefox** browser

#### Desktop Application

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/port-of-exiles.git
   cd port-of-exiles
   ```

2. **Install dependencies**:
   ```bash
   cd electron-app
   npm install
   ```

3. **Configure the application**:
   ```bash
   # Copy the example configuration
   cp config.example.js config.js
   # Edit config.js with your API keys
   ```

4. **Start the application**:
   ```bash
   npm start
   ```

#### Browser Extensions

**Chrome Extension**:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `chrome-extension` folder

**Firefox Extension**:
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `firefox-extension` folder

## 🚀 Usage

### Getting Started

1. **Launch Port of Exiles** from your desktop or start menu
2. **Log in** with your Google account for authentication
3. **Configure your settings** in the application preferences
4. **Install browser extensions** in Chrome or Firefox
5. **Navigate to Path of Exile** trading sites and start trading!

### Key Features

#### Auto-Buy System
- **F1 Hotkey**: Toggle auto-buy functionality on/off
- **Grid-based clicking**: Precise coordinate system for reliable item purchasing
- **Smart filtering**: Only processes relevant trade data
- **Rate limiting**: Prevents API abuse and maintains good standing

#### Teleport Integration
- **F2 Hotkey**: Toggle teleport functionality on/off
- **Automatic window switching**: Focuses Path of Exile when teleport is active
- **Token management**: Tracks and manages your teleport tokens
- **Subscription support**: Unlimited tokens for premium users

#### Live Overlay
- **Real-time status**: Shows current automation state
- **Token counter**: Displays available tokens and daily usage
- **Subscription status**: Shows your current plan
- **Quick toggles**: Easy access to enable/disable features

## 🔧 Configuration

### Required Setup

1. **Google OAuth**: Set up Google Cloud Console credentials
2. **Stripe Integration**: Configure payment processing
3. **Backend API**: Deploy your Cloudflare Worker backend
4. **Browser Extensions**: Install and configure extensions

### Configuration Files

- `electron-app/config.js` - Main application configuration
- `whisper-backend/wrangler.jsonc` - Backend deployment settings
- See `config.example.js` for template configuration

## 🏗️ Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/port-of-exiles.git
cd port-of-exiles

# Install dependencies
cd electron-app
npm install

# Build the application
npm run build

# Create installer
cd ../installer
./create-installer.bat  # Windows
```

### Project Structure

```
port-of-exiles/
├── electron-app/          # Main desktop application
├── chrome-extension/      # Chrome browser extension
├── firefox-extension/     # Firefox browser extension
├── whisper-backend/       # Cloudflare Worker backend
├── installer/            # Installation scripts
└── .github/workflows/    # CI/CD automation
```

## 📋 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Extension not connecting to app**:
- Ensure the desktop app is running
- Check that WebSocket server is active on port 8080
- Verify browser extension is properly installed

**Auto-buy not working**:
- Check that POESESSID cookie is present
- Verify grid coordinates are correct for your screen resolution
- Ensure Path of Exile window is in focus

**Teleport not functioning**:
- Verify backend API is accessible
- Check your token balance
- Ensure proper authentication

## 📞 Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/your-username/port-of-exiles/issues)
- **Documentation**: [Wiki](https://github.com/your-username/port-of-exiles/wiki)
- **Discord**: [Join our community](https://discord.gg/your-discord-invite)
- **Email**: contact@portofexiles.com

## 📄 License

This project is licensed under the Business Source License 1.1 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Path of Exile** community for inspiration and feedback
- **Electron** team for the amazing desktop framework
- **Chrome** and **Firefox** teams for extension APIs
- **Cloudflare** for Workers platform
- **Stripe** for payment processing
