# Supabase Configuration for Password Reset

## Problem
Password reset works on `localhost:3000` but fails on main website `http://192.168.1.4:8080`

## Solution
Add your main website URL to Supabase allowed redirect URLs.

## Steps to Fix

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard/project/hcnudxonfoainnkinouz
- Login with your Supabase account

### 2. Navigate to Authentication Settings
- Click: **Authentication** → **URL Configuration**

### 3. Add Redirect URLs
In the **Redirect URLs** section, add these URLs:

```
http://localhost:3000/reset-password
http://192.168.1.4:8080/reset-password
```

### 4. Save Settings
Click **Save** to apply the changes.

### 5. Test Password Reset
- Go to: http://192.168.1.4:8080/forgot-password
- Enter your email
- Check email and click reset link
- Should redirect to: http://192.168.1.4:8080/reset-password

## Alternative URLs to Add (if needed)
If you use other domains or ports, add them too:
```
http://192.168.1.4:3000/reset-password
https://your-domain.com/reset-password
```

## Code Changes Made
I've also updated the code to automatically use the correct redirect URL based on the current domain.

## Verification
After adding the URLs, the password reset should work on both:
- ✅ localhost:3000 (development)
- ✅ 192.168.1.4:8080 (main website)
