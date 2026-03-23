#!/bin/bash
# ============================================
# StudyPro - Push Migrations to Supabase
# ============================================

set -e

PROJECT_REF="jclhkpuverljxivoqqfy"

echo "🚀 Aplicando migrations no Supabase..."
echo "   Project: $PROJECT_REF"
echo ""

# Link project
echo "📦 Linkando projeto..."
supabase link --project-ref $PROJECT_REF

# Push migrations
echo ""
echo "📄 Enviando migrations..."
supabase db push

echo ""
echo "✅ Migrations aplicadas com sucesso!"
echo ""
echo "Acesse o banco em:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/database/tables"
