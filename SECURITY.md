# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of FinanceFlow seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

### How to Report

Please report security vulnerabilities by emailing us at: **maharhamza200019@gmail.com**

Include the following information in your report:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected code (tag, branch, or commit)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability

### What to Expect

**Initial Response:**
- We will acknowledge receipt of your report within **48 hours**
- We will provide a preliminary assessment within **7 days**

**During Investigation:**
- We will keep you informed of the progress
- We may ask for additional information or clarification
- Expected timeline: **30-90 days** depending on severity

**After Resolution:**
- We will notify you when the vulnerability is fixed
- We will credit you in security advisories (if you wish)
- We will publish a security advisory with details after the fix is deployed

### Disclosure Policy

- Please do not disclose the vulnerability publicly until we have addressed it
- We will coordinate with you on the disclosure timeline
- We will provide credit for the discovery (unless you prefer to remain anonymous)

### Security Best Practices

While we work on fixes, we recommend:

1. **Keep your dependencies updated** - Run `npm audit` regularly
2. **Use strong credentials** - Ensure JWT_SECRET is a strong random string
3. **Enable HTTPS** - Always use HTTPS in production
4. **Database security** - Use strong database passwords and restrict access
5. **Environment variables** - Never commit `.env.local` or secrets to version control
6. **Regular backups** - Maintain regular database backups
7. **Monitor logs** - Review application logs for suspicious activity

### Security Measures

FinanceFlow implements the following security measures:

- **Authentication**: JWT-based authentication with secure token storage
- **Password Hashing**: bcrypt with appropriate salt rounds
- **SQL Injection Prevention**: Parameterized queries for all database operations
- **Input Validation**: Server-side validation for all user inputs
- **CORS Protection**: Configured CORS policies
- **Rate Limiting**: Consider implementing rate limiting for API endpoints
- **HTTPS Enforcement**: Enforce HTTPS in production environments
- **Secure Headers**: Implement security headers (CSP, X-Frame-Options, etc.)

### Known Security Considerations

- **JWT Secret**: Must be changed from default in production
- **Database Credentials**: Must be stored securely and never committed
- **API Keys**: Google AI API key and Firebase credentials must be kept secure
- **Session Management**: Tokens are stored in httpOnly cookies
- **File Uploads**: Profile picture uploads are validated for type and size

### Security Updates

Security updates will be released as:
- **Critical**: Immediate patch releases
- **High**: Patch releases within 7 days
- **Medium**: Included in next regular release
- **Low**: Included in next regular release

### Scope

**In Scope:**
- Authentication and authorization vulnerabilities
- SQL injection vulnerabilities
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Insecure direct object references
- Security misconfigurations
- Sensitive data exposure

**Out of Scope:**
- Denial of Service (DoS) attacks
- Social engineering attacks
- Physical security issues
- Issues requiring physical access to the server
- Vulnerabilities in third-party services (please report to them directly)

### Contact

For security-related questions or concerns:
- **Email**: maharhamza200019@gmail.com
- **Response Time**: We aim to respond within 48 hours

Thank you for helping keep FinanceFlow and its users safe!

