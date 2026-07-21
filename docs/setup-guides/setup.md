# 🛠️ BLOTIC Project Setup Guide

This guide will help you set up the BLOTIC project for development or production deployment.

## 📋 Prerequisites

### Required Software
- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Git** for version control ([Download](https://git-scm.com/))
- **Code Editor** (VS Code recommended)

### Recommended VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

## 🚀 Quick Setup

### 1. Clone the Repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd blotic-web-react
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Copy credentials template (DO NOT COMMIT THIS FILE)
cp CREDENTIALS_TEMPLATE.md CREDENTIALS.md
```

### 4. Configure Your Environment
Edit `.env.local` with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your application running!

## 🗄️ Database Setup

### Supabase Configuration

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Database Schema**
   The project requires the following tables:
   - `profiles` - User profiles and roles
   - `events` - Event management
   - `announcements` - Announcements system
   - `core_team` - Team member information
   - `event_registrations` - Event registration data
   - `user_preferences` - User notification preferences
   - `user_sessions` - Session management

3. **Row Level Security (RLS)**
   Ensure RLS is enabled on all tables with appropriate policies.

4. **Storage Buckets**
   Create the following storage buckets:
   - `avatars` - User profile pictures
   - `photos` - Event and gallery photos

### Database Migration
If you have an existing Supabase project, run the migration scripts found in the `supabase/` directory.

## 🔧 Development Workflow

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Testing (if configured)
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   └── admin/          # Admin-specific components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/      # Supabase client and types
├── pages/              # Page components
├── utils/              # Utility functions
└── App.tsx            # Main application component
```

### Code Style Guidelines
- Use **TypeScript** for all new code
- Follow **React functional components** pattern
- Use **Tailwind CSS** for styling
- Implement **proper error handling**
- Write **meaningful commit messages**

## 🌐 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure Build Settings**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   Add the following in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy**
   - Push to main branch for automatic deployment
   - Or manually trigger deployment from Vercel dashboard

### Netlify Deployment

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Environment Variables**
   Configure the same environment variables as above.

### Other Platforms
The project can be deployed to any static hosting service:
- **Cloudflare Pages**
- **GitHub Pages** (with GitHub Actions)
- **Firebase Hosting**
- **AWS S3 + CloudFront**

## 🔒 Security Checklist

### Before Going Live
- [ ] All sensitive data in environment variables
- [ ] No credentials committed to repository
- [ ] Supabase RLS policies configured
- [ ] HTTPS enabled on production domain
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)

### Regular Maintenance
- [ ] Keep dependencies updated
- [ ] Monitor Supabase usage and limits
- [ ] Review user roles and permissions
- [ ] Backup database regularly
- [ ] Monitor application performance

## 🐛 Troubleshooting

### Common Issues

**1. Environment Variables Not Loading**
```bash
# Ensure .env.local exists and has correct format
# Restart development server after changes
npm run dev
```

**2. Supabase Connection Issues**
```bash
# Check your Supabase URL and key
# Verify project is not paused
# Check network connectivity
```

**3. Build Errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

**4. Permission Denied Errors**
```bash
# Check Supabase RLS policies
# Verify user roles in database
# Check authentication status
```

### Getting Help
- Check the [CONTRIBUTING.md](CONTRIBUTING.md) file
- Review existing GitHub issues
- Contact: bloticbvducoep@gmail.com

## 📚 Additional Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)

### Learning Resources
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Supabase YouTube Channel](https://www.youtube.com/c/Supabase)
- [Tailwind CSS YouTube Tutorials](https://www.youtube.com/results?search_query=tailwind+css+tutorial)

## 🎉 Success!

If you've followed this guide successfully, you should now have:
- ✅ A fully functional development environment
- ✅ The BLOTIC application running locally
- ✅ Understanding of the project structure
- ✅ Knowledge of deployment options
- ✅ Security best practices in place

**Happy coding! 🚀**

---

**Need help?** Contact the BLOTIC development team at bloticbvducoep@gmail.com
