# 🔐 BLOTIC Credentials Template

> **⚠️ IMPORTANT**: This is a template file. Create your own `CREDENTIALS.md` file (which is gitignored) and never commit actual credentials to version control!

## 📋 Required Credentials

### Supabase Credentials
```env
# Supabase Project URL (starts with https://)
VITE_SUPABASE_URL=https://your-project.supabase.co

# Supabase Public API Key (anon key)
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Environment Variables
```env
# Application Port (default: 5173)
PORT=5173

# Node Environment
NODE_ENV=development

# Vercel Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=
```

## 🔧 Backend Server Configuration

### Main Server
The main backend server runs on port 3001 by default and uses the Supabase service role key for administrative operations.

### MCP Server
The Model Context Protocol (MCP) server runs on port 3002 and provides AI assistants with access to application data:

```env
# MCP Server Port (default: 3002)
MCP_PORT=3002
```

The MCP server exposes the following tools and resources:
- **Tools**: get_user_info, get_events, get_core_team
- **Resources**: blotic://stats (application statistics)

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** especially service role keys
4. **Limit service role key scope** when possible
5. **Use separate environments** for development and production

## 🌐 Deployment Credentials

### Vercel
```env
# Vercel Project ID
VERCEL_PROJECT_ID=your_project_id

# Vercel Org ID
VERCEL_ORG_ID=your_org_id

# Vercel Token
VERCEL_TOKEN=your_token
```

### Domain and SSL
```env
# Production Domain
DOMAIN=yourdomain.com

# SSL Certificate (if self-managed)
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

## 📧 Email Configuration

### SMTP Settings
```env
# SMTP Server
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_password
```

### Email Templates
```env
# From Address
EMAIL_FROM=noreply@yourdomain.com

# Admin Notifications
ADMIN_EMAIL=admin@yourdomain.com
```

## 📊 Analytics and Monitoring

### Error Tracking
```env
# Sentry (optional)
SENTRY_DSN=your_sentry_dsn
```

### Performance Monitoring
```env
# Optional monitoring tools
NEW_RELIC_LICENSE_KEY=your_key
DATADOG_API_KEY=your_key
```

## 🛠️ Development Tools

### Database Tools
```env
# Database connection for direct access (development only)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### Debugging
```env
# Enable detailed logging
DEBUG=true

# Log level
LOG_LEVEL=info
```

## 📱 Social Media Integration

### API Keys
```env
# Twitter API (for social sharing)
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret

# LinkedIn API
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret
```

## 🔁 Third-party Services

### File Storage
```env
# Cloudinary (alternative to Supabase Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Payment Processing
```env
# Stripe (if implementing payments)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
```

## 🎯 Environment-specific Variables

### Development (.env.local)
```env
NODE_ENV=development
PORT=5173
# Development-specific credentials
```

### Production (.env.production)
```env
NODE_ENV=production
# Production-specific credentials
```

### Testing (.env.test)
```env
NODE_ENV=test
# Test-specific credentials
```

## 🔄 CI/CD Configuration

### GitHub Actions
Set these as repository secrets:
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`

### Automated Deployments
```env
# Auto-deployment settings
AUTO_DEPLOY=true
DEPLOY_BRANCH=main
```

## 📞 Support Contacts

### Development Team
- **Primary Contact**: bloticbvducoep@gmail.com
- **Technical Lead**: [Add technical lead contact]
- **Security Issues**: [Add security contact]

### External Services
- **Supabase Support**: https://supabase.com/dashboard/support
- **Vercel Support**: https://vercel.com/support
- **Domain Registrar**: [Add your domain registrar contact]

---

**Remember**: Create your own `CREDENTIALS.md` file with actual values and keep it secure and gitignored!