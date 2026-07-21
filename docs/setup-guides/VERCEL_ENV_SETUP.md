# 🚀 Vercel Environment Variables Setup

## NEW SERVER CREDENTIALS (Use These in Production)

Copy these EXACT values to your Vercel Environment Variables:

### Required Variables for Production

```
VITE_SUPABASE_URL=https://sbdrzesfuweacfssdwzk.supabase.co
```

```
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**⚠️ CRITICAL: The SERVICE_ROLE_KEY is required for user registration to work in production!**

---

## 📝 Step-by-Step Instructions for Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: Click on "BLOTIC" or your project name
3. **Go to Settings**: Click "Settings" in the top menu
4. **Navigate to Environment Variables**: Click "Environment Variables" in the left sidebar
5. **Delete old variables** (if they exist):
   - Delete `NEXT_PUBLIC_SUPABASE_URL`
   - Delete `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Delete any old Supabase variables

6. **Add NEW variables**:
   
   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://sbdrzesfuweacfssdwzk.supabase.co`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `your_supabase_anon_key`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

   **Variable 3: ⚠️ CRITICAL FOR REGISTRATION**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `your_supabase_service_role_key`
   - Environment: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

7. **Redeploy**:
   - Go to "Deployments" tab
   - Click the three dots (...) on the latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete (1-2 minutes)

8. **Clear browser cache** and test the site

---

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL production
# Paste: https://sbdrzesfuweacfssdwzk.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Paste: your_supabase_anon_key

# Redeploy
vercel --prod
```

---

## 🔍 Verification

After deployment, test these features:
- ✅ User registration
- ✅ User login
- ✅ Event registration
- ✅ Profile updates
- ✅ Admin dashboard access

---

## ⚠️ Important Notes

1. **VITE_ prefix is required** - Vite only exposes env vars with `VITE_` prefix to the browser
2. **NOT NEXT_PUBLIC_** - This is a Vite project, not Next.js
3. **Apply to all environments** - Production, Preview, and Development
4. **Redeploy is mandatory** - Environment variables only apply to new deployments
5. **Clear browser cache** - Old cached data may cause issues

---

## 🗄️ Old Server Credentials (DO NOT USE)

Old server credentials are backed up in `.env.old` file.

**Old Server**: `hcnudxonfoainnkinouz.supabase.co`  
**Status**: ❌ Deprecated - Do not use in production

---

## 📞 Troubleshooting

### Issue: Still getting "Invalid API key" error

**Solutions:**
1. Verify variables are named exactly `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check that variables are set for "Production" environment
3. Ensure you've redeployed after adding variables
4. Clear browser cache (Ctrl+Shift+Delete)
5. Try incognito/private browsing mode
6. Check Vercel deployment logs for errors

### Issue: Variables not showing in build

- Make sure variable names start with `VITE_`
- Redeploy the project
- Check build logs in Vercel dashboard

---

## ✅ Checklist

- [ ] Deleted old `NEXT_PUBLIC_*` variables from Vercel
- [ ] Added `VITE_SUPABASE_URL` to Vercel
- [ ] Added `VITE_SUPABASE_ANON_KEY` to Vercel
- [ ] Set variables for Production environment
- [ ] Redeployed the project
- [ ] Cleared browser cache
- [ ] Tested registration on production site
- [ ] Tested login on production site
- [ ] Verified admin dashboard works

---

**Last Updated**: October 16, 2025  
**New Server**: sbdrzesfuweacfssdwzk.supabase.co  
**Status**: ✅ Ready for Production
