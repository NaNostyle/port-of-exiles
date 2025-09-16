# Contributing to Port of Exiles

Thank you for your interest in contributing to Port of Exiles! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [License](#license)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to contact@portofexiles.com.

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Git** for version control
- **Chrome** or **Firefox** for extension development
- **Visual Studio Code** (recommended) or your preferred editor

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/port-of-exiles.git
   cd port-of-exiles
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/port-of-exiles.git
   ```

4. **Install dependencies**:
   ```bash
   cd electron-app
   npm install
   ```

5. **Set up configuration**:
   ```bash
   cp config.example.js config.js
   # Edit config.js with your development API keys
   ```

## 🛠️ Development Guidelines

### Code Style

- **JavaScript**: Follow ESLint configuration
- **HTML/CSS**: Use consistent indentation (2 spaces)
- **Comments**: Write clear, descriptive comments for complex logic
- **Naming**: Use descriptive variable and function names

### Project Structure

```
port-of-exiles/
├── electron-app/          # Main desktop application
│   ├── main.js           # Main Electron process
│   ├── renderer.js       # Renderer process
│   ├── config.js         # Configuration (not in git)
│   └── config.example.js # Configuration template
├── chrome-extension/      # Chrome browser extension
├── firefox-extension/     # Firefox browser extension
├── whisper-backend/       # Cloudflare Worker backend
└── installer/            # Installation scripts
```

### Testing

Before submitting a pull request, please ensure:

- [ ] **Manual testing** of your changes
- [ ] **Cross-platform compatibility** (Windows, macOS, Linux)
- [ ] **Browser extension functionality** in both Chrome and Firefox
- [ ] **No console errors** in the desktop application
- [ ] **API integration** works correctly

### Security Considerations

- **Never commit sensitive data** (API keys, secrets, tokens)
- **Use environment variables** for configuration
- **Validate all user inputs**
- **Follow secure coding practices**

## 📝 Contributing Guidelines

### Types of Contributions

We welcome several types of contributions:

- **🐛 Bug fixes**: Fix issues and improve stability
- **✨ New features**: Add functionality and enhancements
- **📚 Documentation**: Improve docs, README, and guides
- **🧪 Testing**: Add tests and improve test coverage
- **🎨 UI/UX**: Improve user interface and experience
- **🔧 Infrastructure**: Improve build, CI/CD, and deployment

### Commit Message Format

Use clear, descriptive commit messages:

```
type(scope): brief description

Longer description if needed

Fixes #123
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
- `feat(extension): add Firefox support`
- `fix(autobuy): resolve coordinate calculation issue`
- `docs(readme): update installation instructions`

## 🔄 Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes** and test thoroughly

3. **Commit your changes**:
   ```bash
   git commit -m "feat(scope): add amazing feature"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Create a Pull Request** on GitHub

### Pull Request Checklist

- [ ] **Clear description** of changes
- [ ] **Screenshots** for UI changes
- [ ] **Testing instructions** for reviewers
- [ ] **Breaking changes** documented
- [ ] **Documentation updated** if needed
- [ ] **License compliance** maintained

## 🐛 Issue Reporting

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check the documentation** and troubleshooting guide
3. **Test with the latest version**

### Issue Template

When creating an issue, please include:

- **Clear title** describing the problem
- **Detailed description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, browser, version)
- **Screenshots** if applicable
- **Console logs** if relevant

### Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## 📄 License

By contributing to Port of Exiles, you agree that your contributions will be licensed under the Business Source License 1.1. This means:

- Your contributions will be available under BSL 1.1
- The project will transition to GPL v2.0+ on January 1, 2026
- Commercial use requires a separate license

## 🆘 Getting Help

- **GitHub Discussions**: For questions and general discussion
- **GitHub Issues**: For bug reports and feature requests
- **Discord**: Join our community server
- **Email**: contact@portofexiles.com

## 🙏 Recognition

Contributors will be recognized in:
- **README.md** contributors section
- **Release notes** for significant contributions
- **GitHub contributors** page

Thank you for contributing to Port of Exiles! 🎉

