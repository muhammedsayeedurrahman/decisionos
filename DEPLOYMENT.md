# DecisionOS Deployment Guide

Complete guide for deploying DecisionOS to production.

## 🚀 Quick Deploy (Recommended)

### Option 1: Vercel (Easiest)

1. **Connect Repository**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to vercel.com/new
   - Import your repository
   - Configure environment variables
   - Deploy

3. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   OPENAI_API_KEY=sk-...
   NODE_ENV=production
   ```

### Option 2: Docker

```bash
docker build -t decisionos:latest .
docker run -p 3000:3000 decisionos:latest
```

## 🗄️ Supabase Setup

1. Create project at supabase.com
2. Run migrations from supabase/migrations/
3. Enable Realtime for tasks, handoffs, notifications tables
4. Seed demo data: `npm run seed-demo`

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] RLS policies enabled
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly set

## 📊 Monitoring

- Vercel Analytics
- Sentry for error tracking
- Supabase Dashboard logs

## 🚨 Troubleshooting

**Build fails**: `rm -rf node_modules .next && npm install`
**Realtime not working**: Enable replication in Supabase Dashboard
**Performance issues**: Add database indexes, enable caching

For full deployment guide, see docs/
