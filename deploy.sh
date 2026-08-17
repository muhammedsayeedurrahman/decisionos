#!/bin/bash
# Automated Vercel Deployment Script

echo "🚀 Starting DecisionOS Deployment..."
echo ""

# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://fqtlysailpcpqlhilkpp.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdGx5c2FpbHBjcHFsaGlsa3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDU5MDIsImV4cCI6MjEwMjI4MTkwMn0.hAI5zhDHs2_nIBmG0qyiVDUqwfxuVmuxCRIPtEkbrOk"

echo "✅ Environment variables configured"
echo ""

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod \
  --name decisionos \
  --yes \
  --env NEXT_PUBLIC_SUPABASE_URL="https://fqtlysailpcpqlhilkpp.supabase.co" \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdGx5c2FpbHBjcHFsaGlsa3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDU5MDIsImV4cCI6MjEwMjI4MTkwMn0.hAI5zhDHs2_nIBmG0qyiVDUqwfxuVmuxCRIPtEkbrOk"

echo ""
echo "🎉 Deployment complete!"
