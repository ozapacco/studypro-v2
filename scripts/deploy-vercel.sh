#!/bin/bash
set -e

echo "🚀 Deploying StudyPro to Vercel..."

if ! command -v vercel &> /dev/null; then
    npm install -g vercel
fi

vercel login
vercel link
vercel env pull .env.local

echo "📦 Deploying API..."
cd api
vercel --prod --yes
cd ..

echo "🌐 Deploying Web..."
cd web
vercel --prod --yes
cd ..

echo "✅ Deployment complete!"
echo "🌐 Visit your dashboard: https://vercel.com/dashboard"