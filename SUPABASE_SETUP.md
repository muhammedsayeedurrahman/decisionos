# Supabase Setup Guide

This guide walks you through setting up Supabase for DecisionOS.

## Prerequisites

- Node.js 20+ installed
- A Supabase account (free tier works)

## Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: DecisionOS
   - **Database Password**: (generate strong password, save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

## Step 2: Get API Credentials

1. In your project dashboard, click **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (only needed for admin operations)

## Step 3: Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and paste your credentials:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## Step 4: Run Database Migrations

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

3. Push migrations:
   ```bash
   supabase db push
   ```

### Option B: Manual Migration (SQL Editor)

1. Go to your Supabase project → **SQL Editor**
2. Copy contents of `supabase/migrations/20260815000000_initial_schema.sql`
3. Paste into SQL Editor and click **Run**
4. Repeat for `supabase/migrations/20260815000001_seed_data.sql`

## Step 5: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure settings:
   - Enable "Confirm email": OFF (for development)
   - Set "Site URL": `http://localhost:3000`
   - Add "Redirect URLs": `http://localhost:3000/auth/callback`

## Step 6: Test the Setup

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. Try signing up with email/password
4. Check Supabase Dashboard → **Authentication** → **Users** to see the new user

## Database Schema Overview

The schema includes:

- **workspaces**: Multi-tenant workspace support
- **profiles**: User profiles with role-based access (owner, sales, production, finance)
- **tasks**: Task management with categories, scheduling, assignments
- **handoffs**: Inter-role handoff requests and approvals
- **notifications**: Real-time notification system

All tables have Row Level Security (RLS) policies enabled.

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` credentials
- Make sure you're using the **anon** key, not the service role key
- Restart dev server after changing `.env.local`

### "Relation does not exist" error
- Migrations weren't applied
- Run migrations manually via SQL Editor

### Authentication not working
- Check "Site URL" and "Redirect URLs" in Supabase Auth settings
- Ensure middleware is running (check `middleware.ts`)
- Clear browser cookies and try again

### Real-time not working
- Enable Realtime in Supabase Dashboard → **Database** → **Replication**
- Add tables to publication: tasks, handoffs, notifications

## Next Steps

- [ ] Create demo users (owner, sales, production, finance)
- [ ] Test task creation and assignment
- [ ] Test handoff workflow
- [ ] Enable real-time subscriptions
- [ ] Deploy to production
