# DecisionOS Setup Guide

Complete setup instructions for local development and production deployment.

---

## Prerequisites

- Node.js 20.17+ installed
- npm or yarn package manager
- Supabase account (free tier: https://supabase.com/dashboard)
- OpenAI API key (for Whisper: https://platform.openai.com/api-keys)

---

## Step 1: Supabase Project Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name:** DecisionOS
   - **Database Password:** (generate strong password - save it!)
   - **Region:** Choose closest to your users
4. Wait 2-3 minutes for project to provision

### 1.2 Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbG...` (long JWT token)
   - **service_role key**: `eyJhbG...` (different JWT - keep secret!)

### 1.3 Run Database Migrations

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/20260814000000_initial_schema.sql`
4. Paste into SQL Editor
5. Click **Run** (bottom right)
6. Verify: Should see "Success. No rows returned"

**Option B: Using Supabase CLI (Recommended for teams)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## Step 2: Local Environment Setup

### 2.1 Install Dependencies

```bash
cd C:\code\decisionos-main
npm install
```

### 2.2 Add Supabase Client

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2.3 Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

   OPENAI_API_KEY=sk-your-openai-key-here

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   NEXT_PUBLIC_DEMO_MODE=true
   ```

3. **Important:** Add `.env.local` to `.gitignore` (it's already there)

---

## Step 3: Verify Setup

### 3.1 Check Database Connection

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3.2 Test Connection

```bash
npm run dev
```

Open browser console and run:
```javascript
// In browser console
const { data, error } = await supabase.from('workspaces').select('*');
console.log('Connection test:', { data, error });
```

Should see empty array (no workspaces yet) with no error.

---

## Step 4: Create Demo Workspace & Users

### 4.1 Option A: Manual via Supabase Dashboard

1. Go to **Table Editor** → **workspaces**
2. Click **Insert row**
3. Enter:
   - **name:** "Sharma Textiles Pvt Ltd"
   - **industry:** "textile_manufacturing"
4. Copy the generated `id` (UUID)

5. Go to **Authentication** → **Users** → **Add user**
6. Create users:
   - **Email:** rajesh@sharma-textiles.com, **Password:** Demo123!, **Role:** owner
   - **Email:** priya@sharma-textiles.com, **Password:** Demo123!, **Role:** sales
   - **Email:** amit@sharma-textiles.com, **Password:** Demo123!, **Role:** production
   - **Email:** sunita@sharma-textiles.com, **Password:** Demo123!, **Role:** finance

7. Go to **Table Editor** → **users**, update each user's `workspace_id` to the UUID from step 4

### 4.2 Option B: SQL Script (Faster)

Run this in SQL Editor:

```sql
-- Create demo workspace
INSERT INTO workspaces (name, industry)
VALUES ('Sharma Textiles Pvt Ltd', 'textile_manufacturing')
RETURNING id;

-- Copy the returned UUID and replace WORKSPACE_UUID below

-- Note: Users are auto-created via trigger when they sign up
-- Just create auth users, the trigger will create users table entries
```

---

## Step 5: Run Local Development Server

```bash
npm run dev
```

Open http://localhost:3000

- Login with any of the demo users created above
- You should see the role-specific dashboard
- Data now persists in Supabase (not localStorage!)

---

## Step 6: Production Deployment (Vercel)

### 6.1 Connect GitHub

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "feat: add Supabase backend integration"
   git push origin main
   ```

2. Go to https://vercel.com/dashboard
3. Click **New Project**
4. Import your GitHub repo

### 6.2 Configure Environment Variables in Vercel

In Vercel project settings → **Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... (mark as sensitive!)
OPENAI_API_KEY=sk-... (mark as sensitive!)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
NEXT_PUBLIC_DEMO_MODE=false
```

### 6.3 Deploy

1. Click **Deploy**
2. Wait 2-3 minutes
3. Visit your production URL
4. Test sign up → create workspace → add tasks

---

## Troubleshooting

### "Invalid API key" error
- Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure you copied the **anon** key, not service_role

### "Row Level Security policy violation"
- RLS policies may be too strict
- Check you're logged in: `supabase.auth.getSession()`
- Verify user has `workspace_id` set in `users` table

### "Cannot read property of undefined"
- Ensure all environment variables are loaded
- Restart dev server after changing `.env.local`

### Migrations fail
- Check PostgreSQL syntax errors in SQL file
- Verify you have database admin permissions
- Try running migration in chunks (create tables first, then policies)

---

## Next Steps

1. ✅ Database is set up
2. ✅ Local development running
3. 🔄 Implement authentication UI (Task #18)
4. 🔄 Migrate useWorkspace hook to Supabase (Task #19)
5. 🔄 Add Whisper API integration (Task #20)
6. 🔄 Deploy to production (Task #24)

---

**Questions?** Check:
- Supabase docs: https://supabase.com/docs
- Next.js + Supabase guide: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

**Ready to code!** 🚀
