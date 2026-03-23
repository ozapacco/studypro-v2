#!/bin/bash
set -e

echo "🚀 Setting up Supabase for StudyPro..."

if ! command -v supabase &> /dev/null; then
    npm install -g supabase
fi

supabase login
supabase init

echo "Starting local Supabase..."
supabase start

SUPABASE_URL=$(supabase status | grep 'API URL' | awk '{print $3}')
SUPABASE_KEY=$(supabase status | grep 'anon key' | awk '{print $4}')
SUPABASE_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

echo "SUPABASE_URL=$SUPABASE_URL" > .env.local
echo "SUPABASE_ANON_KEY=$SUPABASE_KEY" >> .env.local
echo "DATABASE_URL=$SUPABASE_DB_URL" >> .env.local

echo "✅ Supabase local setup complete!"
echo "📊 Studio: http://localhost:54323"
echo "📖 API: $SUPABASE_URL"