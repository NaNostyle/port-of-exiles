# Security Policy

## 🔒 Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 1. **DO NOT** create a public GitHub issue

Security vulnerabilities should be reported privately to prevent exploitation.

### 2. **Email us directly**

Send an email to: **security@portofexiles.com**

Include the following information:
- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** assessment
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### 3. **Response timeline**

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Resolution**: Within 30 days (depending on complexity)

### 4. **Disclosure process**

- We will work with you to understand and resolve the issue
- Once fixed, we will credit you in our security advisories (unless you prefer to remain anonymous)
- We will coordinate the public disclosure timing with you

## 🛡️ Security Best Practices

### For Users

- **Keep the application updated** to the latest version
- **Use strong, unique passwords** for your accounts
- **Enable two-factor authentication** where possible
- **Be cautious with API keys** and never share them publicly
- **Report suspicious activity** immediately

### For Developers

- **Never commit sensitive data** (API keys, secrets, tokens)
- **Use environment variables** for configuration
- **Validate all user inputs** thoroughly
- **Follow secure coding practices**
- **Keep dependencies updated**
- **Use HTTPS** for all communications

## 🔐 Security Features

Port of Exiles implements several security measures:

### Authentication & Authorization
- **Google OAuth 2.0** for secure authentication
- **JWT tokens** for session management
- **Role-based access control** for different user types

### Data Protection
- **Encrypted data transmission** (HTTPS/TLS)
- **Secure cookie handling** with proper flags
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse

### API Security
- **API key authentication** for backend services
- **Request signing** for critical operations
- **CORS protection** for web requests
- **SQL injection prevention** in database queries

### Extension Security
- **Content Security Policy** (CSP) headers
- **Minimal permissions** in browser extensions
- **Secure message passing** between extension and app
- **Sandboxed execution** environment

## 🚫 Known Security Considerations

### Browser Extensions
- Extensions require access to Path of Exile websites
- Cookie access is necessary for POESESSID functionality
- WebSocket connections are used for real-time communication

### Desktop Application
- **Administrator privileges** may be required for some features
- **File system access** for configuration and data storage
- **Network access** for API communication

### Backend Services
- **Cloudflare Workers** provide serverless execution
- **KV storage** for user data persistence
- **Stripe integration** for payment processing

## 🔍 Security Audit

We regularly conduct security audits:

- **Code reviews** for all pull requests
- **Dependency scanning** for known vulnerabilities
- **Penetration testing** for critical components
- **Third-party security assessments** for major releases

## 📞 Contact

For security-related questions or concerns:

- **Email**: security@portofexiles.com
- **PGP Key**: [Available upon request]
- **Response Time**: Within 48 hours

## 📜 Security Changelog

### Version 1.0.0
- Initial security implementation
- Google OAuth 2.0 integration
- JWT token authentication
- HTTPS enforcement
- Input validation framework

---

**Last Updated**: January 2025  
**Next Review**: July 2025

