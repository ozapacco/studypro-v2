#!/bin/bash
# ============================================
# StudyPro - Setup Script
# ============================================

set -e

echo "🚀 StudyPro Setup"
echo "=================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Banner
cat << 'EOF'

    ███████╗██╗███╗   ██╗ ██████╗ 
    ██╔════╝██║████╗  ██║██╔════╝ 
    █████╗  ██║██╔██╗ ██║██║  ███╗
    ██╔══╝  ██║██║╚██╗██║██║   ██║
    ██║     ██║██║ ╚████║╚██████╔╝
    ╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
                                  
    StudyPro v2.1
    Orquestrador Adaptativo de Estudos
EOF

echo ""

# 1. Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI não encontrado${NC}"
    echo "   Instalando..."
    npm install -g supabase
fi

# 2. Check .env.local
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado${NC}"
    echo "   Criando com placeholder..."
    
    cat > .env.local << 'EOF'
# ============================================
# STUDYPRO - Local Environment
# ============================================

# Supabase - COPIE DO DASHBOARD:
# Settings → API → Project URL, anon key, service_role key
SUPABASE_URL=https://jclhkpuverljxivoqqfy.supabase.co
SUPABASE_ANON_KEY=cole-sua-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=cole-sua-service-role-key-aqui

# Auth
JWT_SECRET=studypro-super-secret-jwt-key-32chars
EOF
    echo -e "${RED}⚠️  EDITE .env.local com suas chaves do Supabase!${NC}"
fi

# 3. Link Supabase project
echo ""
echo -e "${YELLOW}📦 Linkando projeto Supabase...${NC}"
echo "   Project ref: jclhkpuverljxivoqqfy"

supabase link --project-ref jclhkpuverljxivoqqfy || true

# 4. Push migrations
echo ""
echo -e "${YELLOW}📄 Aplicando migrations...${NC}"
supabase db push || echo "   (pode falhar sem as chaves corretas)"

# 5. Generate types
echo ""
echo -e "${YELLOW}🌀 Gerando tipos TypeScript...${NC}"
supabase gen types typescript --project-id jclhkpuverljxivoqqfy > src/types/database.generated.ts 2>/dev/null || true

# 6. Install dependencies
echo ""
echo -e "${YELLOW}📚 Instalando dependências...${NC}"
npm install

echo ""
echo -e "${GREEN}✅ Setup concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Edite .env.local com suas chaves do Supabase"
echo "2. Execute: supabase db push"
echo "3. Execute: npm run dev:web"
echo ""
