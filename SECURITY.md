# 🔒 Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within BLOTIC, please send an email to bloticbvducoep@gmail.com. All security vulnerabilities will be promptly addressed.

**Please do not report security vulnerabilities through public GitHub issues.**

## Security Measures

### Authentication & Authorization
- **Supabase Auth** for secure user authentication
- **JWT tokens** with automatic refresh
- **Row Level Security (RLS)** policies on all database tables
- **Role-based access control** (Admin, Core, Co-Head, Member, Student)
- **Email verification** system with admin controls

### Data Protection
- **Encrypted data transmission** via HTTPS
- **Secure API endpoints** with authentication required
- **Input validation** and sanitization
- **SQL injection protection** via Supabase ORM
- **XSS protection** through React's built-in escaping

### File Upload Security
- **File type validation** for image uploads
- **File size limits** (5MB for avatars, 10MB for photos)
- **Secure file storage** via Supabase Storage
- **Automatic HEIC/HEIF conversion** to web-safe formats

### Environment Security
- **Environment variables** for sensitive configuration
- **API keys** properly secured and not exposed in frontend
- **Gitignore** configured to prevent credential commits
- **Separate development/production** environments

## Best Practices

### For Developers
1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Validate all user inputs** on both client and server
4. **Follow principle of least privilege** for database access
5. **Keep dependencies updated** regularly
6. **Use TypeScript** for type safety

### For Administrators
1. **Regularly review user roles** and permissions
2. **Monitor admin dashboard** for suspicious activity
3. **Keep Supabase project** updated and secure
4. **Review RLS policies** periodically
5. **Backup data** regularly
6. **Use strong passwords** and enable 2FA where possible

## Security Headers

The application implements the following security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

## Data Handling

### Personal Information
- **Minimal data collection** - only necessary information
- **Secure storage** in Supabase with encryption at rest
- **User control** over profile information
- **Data deletion** capabilities for users

### Session Management
- **Secure session handling** via Supabase Auth
- **Automatic session expiry**
- **Multi-device session tracking**
- **Secure logout** functionality

## Incident Response

In case of a security incident:
1. **Immediate containment** of the issue
2. **Assessment** of impact and affected users
3. **Notification** of affected parties
4. **Remediation** and security patches
5. **Post-incident review** and improvements

## Contact

For security-related inquiries:
- **Email**: bloticbvducoep@gmail.com
- **Response Time**: Within 24 hours for critical issues
- **Encryption**: PGP key available upon request
