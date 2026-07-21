# Project Structure

This document describes the organized structure of the BLOTIC BVUCOEP project.

## 📁 Root Directory

```
Blotic_BVUCOEP/
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── src/                     # Source code
├── public/                  # Static assets
├── supabase/               # Supabase functions & config
├── server/                 # Backend server
├── database/               # Database migrations (empty after cleanup)
├── .github/                # GitHub workflows
├── node_modules/           # Dependencies
├── dist/                   # Build output
└── [config files]          # Root configuration files
```

## 📚 Documentation (`docs/`)

### Setup Guides (`docs/setup-guides/`)
- `BACKEND_SETUP.md` - Backend setup instructions
- `EMAIL_SETUP.md` - Email configuration guide
- `GMAIL_SETUP.md` - Gmail SMTP setup
- `SMTP_SETUP.md` - SMTP configuration
- `SUPABASE_SETUP.md` - Supabase setup guide
- `MCP_SETUP.md` - Model Context Protocol setup
- `setup.md` - General setup instructions
- `VERCEL_ENV_SETUP.md` - Vercel environment variables

### Deployment Guides (`docs/deployment/`)
- `SUPABASE_DEPLOYMENT.md` - Supabase deployment guide
- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide
- `DEPLOYMENT_HTTPS_GUIDE.md` - HTTPS deployment guide

### Development (`docs/development/`)
- `CONTRIBUTING.md` - Contribution guidelines
- `PASSWORD_RESET_INSTRUCTIONS.md` - Password reset implementation
- `CREDENTIALS_TEMPLATE.md` - Credentials template
- `USER_CREDENTIALS.md` - User credentials documentation

## 🔧 Scripts (`scripts/`)

### Deployment Scripts (`scripts/deployment/`)
- `deploy-email-function.bat` - Deploy email functions to Supabase
- `deploy-to-vercel.bat` - Deploy to Vercel

### Setup Scripts (`scripts/setup/`)
- `setup-email.bat` - Email setup automation
- `start-server-only.bat` - Start backend server only
- `start-working-server.bat` - Start full development server

## 💻 Source Code (`src/`)

### Components (`src/components/`)
- `ui/` - Reusable UI components (shadcn/ui)
- `admin/` - Admin-specific components
- `attendance/` - Attendance system components
- Layout components (Header, Footer, Navigation, etc.)

### Pages (`src/pages/`)
- Authentication pages (Login, Register, etc.)
- Main pages (Home, About, Events, etc.)
- Admin pages (Admin dashboard)
- User pages (Profile, Dashboard, Settings)

### Utilities (`src/utils/`)
- Helper functions
- Image compression utilities
- Validation utilities

### Hooks (`src/hooks/`)
- Custom React hooks
- `useAuth.tsx` - Authentication hook
- `useRoleCheck.tsx` - Role checking hook

### Integrations (`src/integrations/`)
- `supabase/` - Supabase client and types

## 🌐 Public Assets (`public/`)

```
public/
├── images/              # Images
│   ├── blotic.png      # Logo
│   └── stack.png       # Tech stack image
├── api/                # API routes
├── blotic-video-*.mp4  # Background videos
├── manifest.json       # PWA manifest
├── robots.txt          # SEO robots file
└── [other assets]
```

## 🗄️ Database (`database/`)

Empty after cleanup. All migrations have been applied to Supabase.

## ⚙️ Configuration Files (Root)

### Environment
- `.env` - Local environment variables
- `.env.example` - Environment template
- `.env.local.example` - Local environment template
- `.env.production` - Production environment

### Build & Development
- `package.json` - Dependencies and scripts
- `package-lock.json` - Locked dependency versions
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration
- `components.json` - shadcn/ui configuration

### Deployment
- `vercel.json` - Vercel deployment configuration
- `.vercelignore` - Files to ignore in Vercel deployment
- `.npmrc` - npm configuration

### Git
- `.gitignore` - Git ignore rules
- `.github/` - GitHub Actions workflows

### Documentation
- `README.md` - Main project documentation
- `SECURITY.md` - Security policies
- `LICENSE` - Project license
- `PROJECT_STRUCTURE.md` - This file

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   - Copy `.env.example` to `.env`
   - Fill in your Supabase credentials
   - See `docs/setup-guides/` for detailed setup

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Deploy to Vercel:**
   ```bash
   npm run deploy
   ```

## 📖 Documentation Index

- **Getting Started**: `README.md`
- **Backend Setup**: `docs/setup-guides/BACKEND_SETUP.md`
- **Deployment**: `docs/deployment/VERCEL_DEPLOYMENT.md`
- **Contributing**: `docs/development/CONTRIBUTING.md`
- **Security**: `SECURITY.md`

## 🔐 Important Notes

- Never commit `.env` files with real credentials
- Use `.env.example` as a template
- All migrations are applied via Supabase dashboard
- Test files have been removed from the project
- Duplicate files have been cleaned up

## 📞 Support

For issues or questions, refer to the documentation in the `docs/` folder or check the main `README.md`.
