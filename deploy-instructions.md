# DecisionOS Deployment Guide

## Step 1: Run SQL Migration in Supabase

1. Open: https://supabase.com/dashboard/project/fqtlysailpcpqlhilkpp/sql/new
2. Copy the SQL from: C:/code/decisionos-main/supabase/complete_setup.sql
3. Paste in SQL Editor
4. Click RUN

## Step 2: Deploy to Vercel

Run these commands:

```bash
cd C:/code/decisionos-main
vercel login
vercel --prod
```

Environment variables to add when prompted:
- NEXT_PUBLIC_SUPABASE_URL=https://fqtlysailpcpqlhilkpp.supabase.co
- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdGx5c2FpbHBjcHFsaGlsa3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDU5MDIsImV4cCI6MjEwMjI4MTkwMn0.hAI5zhDHs2_nIBmG0qyiVDUqwfxuVmuxCRIPtEkbrOk

## Step 3: Update Supabase Auth URLs

After deployment, update in Supabase:
- Dashboard → Authentication → URL Configuration
- Site URL: https://your-app.vercel.app
- Redirect URLs: https://your-app.vercel.app/**
