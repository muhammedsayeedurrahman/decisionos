# Google OAuth Setup Guide

## ✅ Configuration Complete

Your DecisionOS is now configured with real Supabase credentials and ready for Google OAuth!

---

## 📋 Your Credentials

### Supabase
- **Project URL**: `https://fqtlysailpcpqlhilkpp.supabase.co`
- **Anon Key**: Configured ✅
- **Status**: Connected to production

### Google OAuth
- **Client ID**: `[Your Google OAuth Client ID]` (stored securely)
- **Client Secret**: `[Your Google OAuth Client Secret]` (stored securely)
- **Status**: Ready to configure in Supabase

---

## 🔧 Final Steps to Enable Google Sign-In

### Step 1: Configure Google OAuth in Supabase

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/fqtlysailpcpqlhilkpp

2. **Navigate to Authentication**:
   - Click **Authentication** in the left sidebar
   - Click **Providers** tab
   - Scroll down to find **Google**

3. **Enable and Configure Google**:
   - Toggle **Enable Sign in with Google** to ON
   - Enter your Google OAuth credentials:
     ```
     Client ID (for OAuth): [Your Client ID from Google Cloud Console]
     Client Secret (for OAuth): [Your Client Secret from Google Cloud Console]
     ```
   - Click **Save**

4. **Copy the Callback URL**:
   - After saving, Supabase will show a callback URL like:
     ```
     https://fqtlysailpcpqlhilkpp.supabase.co/auth/v1/callback
     ```
   - Copy this URL

### Step 2: Update Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials

2. **Edit your OAuth 2.0 Client ID**:
   - Click on your client ID: `385216710519-8o51fav4e3mpppes4pbjikmh2o12n1pj`

3. **Add Supabase Callback to Authorized redirect URIs**:
   - Add: `https://fqtlysailpcpqlhilkpp.supabase.co/auth/v1/callback`
   - Keep existing: `https://decisionos-khaki.vercel.app/auth/callback`

   You should now have BOTH:
   ```
   https://fqtlysailpcpqlhilkpp.supabase.co/auth/v1/callback
   https://decisionos-khaki.vercel.app/auth/callback
   ```

4. **Add Authorized JavaScript origins** (if not already added):
   ```
   https://decisionos-khaki.vercel.app
   ```

5. **Click Save**

### Step 3: Create Database Tables (Required for User Profiles)

Supabase needs a profiles table to store user data. Run this SQL in Supabase:

1. **Go to SQL Editor**: https://supabase.com/dashboard/project/fqtlysailpcpqlhilkpp/sql

2. **Run this SQL**:
   ```sql
   -- Create profiles table
   CREATE TABLE IF NOT EXISTS profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     role TEXT NOT NULL CHECK (role IN ('owner', 'sales', 'production', 'finance')),
     full_name TEXT,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Create policy to allow users to read their own profile
   CREATE POLICY "Users can read own profile"
     ON profiles
     FOR SELECT
     USING (auth.uid() = id);

   -- Create policy to allow users to update their own profile
   CREATE POLICY "Users can update own profile"
     ON profiles
     FOR UPDATE
     USING (auth.uid() = id);

   -- Create policy to allow authenticated users to insert their profile
   CREATE POLICY "Users can insert own profile"
     ON profiles
     FOR INSERT
     WITH CHECK (auth.uid() = id);

   -- Create function to auto-create profile on signup
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, role, full_name)
     VALUES (
       NEW.id,
       COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
       COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
     );
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Create trigger to auto-create profile
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION public.handle_new_user();
   ```

3. **Click Run** or press Ctrl+Enter

---

## ✅ Testing Google Sign-In

After completing all steps above:

1. **Deploy the updated app** (already configured, just redeploy):
   ```bash
   cd C:/code/decisionos-main
   vercel --prod --yes
   ```

2. **Test Google Sign-In**:
   - Go to: https://decisionos-khaki.vercel.app/login
   - Click **"Sign in with Google"**
   - Choose your Google account
   - ✅ Should redirect to your dashboard!

3. **What Happens**:
   - Google OAuth popup opens
   - You select your Google account
   - Redirects to Supabase for authentication
   - Creates a profile in your database
   - Redirects to `/auth/callback`
   - Then to your role-specific dashboard

---

## 🔒 Security Reminders

**Already Configured** ✅:
- Local environment (.env.local)
- Vercel environment variables
- Google OAuth Client ID & Secret

**To Do** 🔧:
1. Configure Google provider in Supabase dashboard
2. Add Supabase callback to Google Cloud Console
3. Create profiles table in Supabase

**Security Notes**:
- ⚠️ Your Client Secret was shared publicly - consider regenerating it after setup
- ✅ Anon key is public-facing (safe to expose)
- ✅ Never commit .env.local to git

---

## 📱 Demo Mode vs Production Mode

**Before this setup** (Demo Mode):
- ❌ Google OAuth showed error
- ✅ Email signup/login worked (localStorage only)
- ✅ No real database

**After this setup** (Production Mode):
- ✅ Google OAuth fully functional
- ✅ Email signup/login saves to Supabase
- ✅ Real user authentication
- ✅ Persistent user data

---

## 🆘 Troubleshooting

### Google Sign-In Button Shows Error
- Check that Google provider is enabled in Supabase
- Verify Client ID and Secret are correct
- Ensure Supabase callback URL is added to Google Cloud Console

### "No account found" Error
- Make sure profiles table exists in Supabase
- Check that trigger is created (handle_new_user)
- Verify RLS policies are enabled

### OAuth Redirect Error
- Double-check all redirect URIs match exactly
- Ensure both Supabase and Vercel callbacks are in Google Cloud Console
- Wait a few minutes for Google settings to propagate

---

## 📞 Support

If you encounter issues:
1. Check Supabase logs: https://supabase.com/dashboard/project/fqtlysailpcpqlhilkpp/logs
2. Check Vercel logs: https://vercel.com/sayeeds-projects-e3951ca3/decisionos
3. Verify Google Cloud Console settings

---

**Last Updated**: 2026-08-17
**Status**: Ready to configure Google OAuth in Supabase
