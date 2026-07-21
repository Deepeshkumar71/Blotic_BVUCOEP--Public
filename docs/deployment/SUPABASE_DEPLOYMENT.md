# Supabase Local-to-Production Deployment Guide

This guide explains how to develop locally with Supabase and deploy changes to production using the Supabase CLI and GitHub Actions.

## 🏗️ Project Structure

```
Blotic_BVUCOEP/
├── supabase/
│   ├── config.toml              # Supabase configuration
│   ├── migrations/              # Database migrations
│   │   └── 20241015000000_password_reset_system.sql
│   ├── functions/               # Edge Functions
│   └── seed.sql                 # Development seed data
├── .github/workflows/           # CI/CD workflows
│   ├── ci.yml                   # Pull request testing
│   ├── staging.yml              # Deploy to staging
│   └── production.yml           # Deploy to production
├── scripts/
│   ├── setup-local.sh           # Local setup (Linux/Mac)
│   └── setup-local.bat          # Local setup (Windows)
├── .env.local.example           # Environment template
└── database/migrations/         # Legacy migrations (migrated to supabase/)
```

## 🚀 Quick Start

### 1. Prerequisites

- **Supabase CLI**: `npm install -g supabase`
- **Docker Desktop**: Running and accessible
- **Node.js**: Version 18+ recommended

### 2. Initial Setup

```bash
# Clone and navigate to project
cd Blotic_BVUCOEP

# Copy environment template
cp .env.local.example .env.local

# Run setup script
# Windows:
scripts\setup-local.bat
# Linux/Mac:
chmod +x scripts/setup-local.sh && ./scripts/setup-local.sh
```

### 3. Link to Your Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project (get PROJECT_ID from dashboard URL)
supabase link --project-ref YOUR_PROJECT_ID

# Pull existing schema (if any)
supabase db pull
```

## 🔄 Local Development Workflow

### Starting Local Environment

```bash
# Start all Supabase services locally
supabase start

# Check status and get API keys
supabase status
```

**Local URLs:**
- 📊 **Supabase Studio**: http://localhost:54323
- 🔗 **API URL**: http://localhost:54321  
- 📧 **Email Testing**: http://localhost:54324

### Making Schema Changes

#### Option 1: Manual Migration (Recommended)

```bash
# Create new migration file
supabase migration new add_new_table

# Edit the generated file in supabase/migrations/
# Add your SQL changes

# Apply migration locally
supabase db reset
```

#### Option 2: Auto Schema Diff

```bash
# Make changes in Studio UI (localhost:54323)
# Generate migration from changes
supabase db diff -f migration_name

# Apply changes
supabase db reset
```

### Testing Changes

```bash
# Reset database to clean state
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types.gen.ts

# Run your application
npm run dev
```

## 🚢 Deployment Process

### Environment Setup

You need **two Supabase projects**:
1. **Staging**: For testing (`develop` branch)
2. **Production**: For live site (`main` branch)

### GitHub Secrets Configuration

Add these secrets in your GitHub repository settings:

```
SUPABASE_ACCESS_TOKEN=your_personal_access_token
STAGING_PROJECT_ID=your_staging_project_id
STAGING_DB_PASSWORD=your_staging_db_password
PRODUCTION_PROJECT_ID=your_production_project_id
PRODUCTION_DB_PASSWORD=your_production_db_password
```

### Deployment Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes, create migrations
   supabase migration new feature_changes
   # Test locally
   supabase db reset
   git commit -am "Add new feature"
   git push origin feature/new-feature
   ```

2. **Staging Deployment**
   ```bash
   # Create PR to develop branch
   # After review, merge to develop
   # GitHub Actions automatically deploys to staging
   ```

3. **Production Deployment**
   ```bash
   # Create PR from develop to main
   # After final review, merge to main
   # GitHub Actions automatically deploys to production
   ```

## 📋 Migration Best Practices

### Creating Migrations

```sql
-- Good: Use IF NOT EXISTS for safety
CREATE TABLE IF NOT EXISTS new_table (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL
);

-- Good: Add indexes
CREATE INDEX IF NOT EXISTS idx_new_table_name ON new_table(name);

-- Good: Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Good: Create policies
CREATE POLICY "Users can view own data" ON new_table
  FOR SELECT USING (auth.uid() = user_id);
```

### Migration Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name.sql

Examples:
20241015120000_create_events_table.sql
20241015130000_add_user_preferences.sql
20241015140000_update_profiles_rls.sql
```

## 🔧 Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop first
   supabase start
   ```

2. **Port conflicts**
   ```bash
   # Stop Supabase and restart
   supabase stop
   supabase start
   ```

3. **Migration conflicts**
   ```bash
   # Reset to clean state
   supabase db reset
   ```

4. **GitHub Actions failing**
   - Check secrets are set correctly
   - Verify project IDs match your Supabase projects
   - Ensure database passwords are correct

### Useful Commands

```bash
# View local database status
supabase status

# Stop all services
supabase stop

# View logs
supabase logs

# Generate types
supabase gen types typescript --local

# Push migrations to remote
supabase db push

# Pull remote schema
supabase db pull

# Create new Edge Function
supabase functions new function-name
```

## 🔐 Security Considerations

1. **Row Level Security (RLS)**
   - Always enable RLS on new tables
   - Create appropriate policies for data access

2. **Environment Variables**
   - Never commit `.env.local` to git
   - Use GitHub Secrets for sensitive data
   - Different keys for local/staging/production

3. **Database Passwords**
   - Use strong, unique passwords for each environment
   - Rotate passwords regularly

## 📚 Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Local Development Guide](https://supabase.com/docs/guides/local-development)
- [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments)
- [GitHub Actions with Supabase](https://github.com/supabase/supabase-action-example)

## 🆘 Getting Help

If you encounter issues:

1. Check this documentation first
2. Review Supabase CLI logs: `supabase logs`
3. Check GitHub Actions logs in the Actions tab
4. Consult the [Supabase Discord](https://discord.supabase.com)
5. Review [Supabase Documentation](https://supabase.com/docs)

---

**Happy coding! 🚀**
