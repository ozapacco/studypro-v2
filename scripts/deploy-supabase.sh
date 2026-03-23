#!/bin/bash
set -e

echo "🚀 Deploying Supabase to production..."

supabase link --project-ref $(supabase projects list | grep studypro | awk '{print $3}')

echo "📦 Pushing migrations..."
supabase db push

echo "🔒 Applying RLS policies..."
supabase db push --db-url=$SUPABASE_DATABASE_URL

echo "⚡ Deploying Edge Functions..."
supabase functions deploy

echo "✅ Supabase deployment complete!"