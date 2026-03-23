# StudyPro v2.1 — Guia da Equipe de Desenvolvimento

## Visão Geral do Projeto

**StudyPro v2.1** é um orquestrador adaptativo de estudos para carreiras policiais. O sistema não possui banco de questões próprio — ele usa o desempenho do usuário em plataformas externas (QConcursos, TEC) para gerar missões diárias inteligentes e priorização adaptativa.

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Mobile**: Expo (React Native)
- **Backend**: Vercel Serverless Functions / Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deployment**: Vercel

---

## Estrutura de Skills

### Skill 1: UI/UX Design System
**Responsável por**: Componentes visuais, design system, mobile-first UX

**Arquivos de referência**: `web/src/components/ui/`

**Stack**: Tailwind CSS, Radix UI, shadcn/ui

**Responsabilidades**:
- Criar componentes base (Button, Input, Card, Badge, etc.)
- Implementar design mobile-first (375px primary)
- Criar componentes de formulário para registro de sessões
- Desenvolver dashboard cards e métricas visuais
- Implementar navegação bottom mobile
- Garantir acessibilidade (WCAG 2.1 AA)

**Componentes a criar**:
```
components/ui/
├── Button.tsx          ✅ Já existe
├── Input.tsx
├── Select.tsx
├── Card.tsx
├── Badge.tsx
├── Progress.tsx
├── Modal.tsx
├── BottomNav.tsx
├── StatCard.tsx
├── MissionCard.tsx
├── TopicPill.tsx
└── DifficultyScale.tsx
```

---

### Skill 2: Frontend Core
**Responsável por**: Páginas, roteamento, state management, integração com API

**Arquivos de referência**: `web/src/app/`

**Stack**: Next.js 14 App Router, React Context, TanStack Query (opcional)

**Responsabilidades**:
- Implementar todas as páginas do app
- Criar formulários de registro de sessão/mock
- Integrar com Supabase Auth
- Gerenciar estado global (missions, user data)
- Implementar loading states e error handling

**Páginas a criar**:
```
app/
├── page.tsx                    # Redirect → /dashboard
├── login/page.tsx              # ✅ Existe
├── register/page.tsx           # ✅ Existe
├── onboarding/
│   └── page.tsx                # 5 passos
├── dashboard/
│   └── page.tsx                # Missão do dia + painel
├── sessions/
│   ├── new/page.tsx            # Registro rápido
│   └── history/page.tsx        # Histórico
├── mocks/
│   ├── new/page.tsx            # Registro de simulado
│   └── [id]/page.tsx           # Diagnóstico
├── review/
│   └── page.tsx                # FSRS cards
├── stats/
│   └── page.tsx                # Métricas
├── topics/
│   └── page.tsx                # Lista de tópicos
└── settings/
    └── page.tsx                # Configurações
```

---

### Skill 3: Backend & Supabase
**Responsável por**: Database schema, Edge Functions, API endpoints, RLS policies

**Arquivos de referência**: `api/`, `supabase/`, `web/src/lib/supabase/`

**Stack**: Supabase, Deno/TypeScript Edge Functions, PostgreSQL

**Responsabilidades**:
- Criar/migrar tabelas do banco
- Implementar RLS policies
- Criar Edge Functions para lógicas complexas
- Configurar triggers para analytics
- Implementar webhooks (se necessário)

**Tabelas a criar** (conforme specdriven.md):
```sql
-- questionSessions      ✅ Provavelmente existe
-- cards                 ✅ Provavelmente existe
-- subjects              ✅ Provavelmente existe
-- mocks                 (novo)
-- topicPerformance      (novo)
-- recoveryQueue         (novo)
```

**Edge Functions a criar**:
```
supabase/functions/api/
├── dashboard/
│   └── index.ts          # Mission generator
├── sessions/
│   ├── index.ts          # CRUD
│   └── analyze.ts        # Extract errors, topics
├── mocks/
│   ├── index.ts          # CRUD
│   └── diagnose.ts       # Post-mock analysis
├── topics/
│   ├── index.ts          # CRUD
│   └── normalize.ts      # Topic canonicalization
├── recovery/
│   ├── index.ts          # Queue management
│   └── detect.ts         # Detect candidates
├── planner/
│   ├── mission.ts        # Generate daily mission
│   ├── priorities.ts     # Recalculate priorities
│   └── phases.ts         # Study phase detection
└── fsrs/
    ├── review.ts         # Review session logic
    └── scheduler.ts      # Calculate intervals
```

---

### Skill 4: FSRS Engine
**Responsável por**: Implementação do algoritmo FSRS, scheduling de revisões

**Arquivos de referência**: `web/src/lib/engines/`, `api/supabase/functions/api/fsrs/`

**Stack**: TypeScript/JS puro, sem dependências externas

**Responsabilidades**:
- Implementar algoritmo FSRS (open-source)
- Criar sistema de scheduling de cards
- Calcular próximo intervalo de revisão
- Calcular ease factor
- Gerenciar límites de reviews diários

**Arquivos a criar**:
```
lib/engines/
├── fsrs/
│   ├── types.ts          # FSRS types
│   ├── constants.ts     # Default parameters
│   ├── scheduler.ts     # Interval calculation
│   ├── card.ts          # Card state management
│   └── session.ts       # Review session logic
└── utils/
    └── date.ts          # Date helpers
```

---

### Skill 5: Planner Engine
**Responsável por**: Motor de decisão adaptativa, cálculo de prioridades

**Arquivos de referência**: `web/src/lib/engines/planner/`, `api/supabase/functions/api/planner/`

**Stack**: TypeScript/JS puro

**Responsabilidades**:
- Gerar missão do dia
- Calcular prioridades por matéria
- Calcular prioridades por tópico
- Detectar fase da prova (base/intensification/final)
- Projetar nota baseada em desempenho
- Detectar candidatos para recuperação

**Arquivos a criar**:
```
lib/engines/planner/
├── types.ts              # Planner types
├── mission.ts           # Generate daily mission
├── priorities.ts        # Calculate subject/topic priorities
├── phases.ts            # Determine study phase
├── projection.ts        # Score projection
├── recovery.ts          # Recovery plan generator
└── config.ts           # Default weights
```

---

### Skill 6: Topic Engine & Normalization
**Responsável por**: Normalização de tópicos, tracking de desempenho por tópico

**Arquivos de referência**: `api/supabase/functions/api/topics/`

**Stack**: TypeScript/JS, Supabase

**Responsabilidades**:
- Normalizar tags de erro para tópicos canônicos
- Rastrear desempenho por tópico
- Detectar recorrência de erros
- Gerenciar aliases de tópicos

**Arquivos a criar**:
```
lib/engines/topics/
├── types.ts             # Topic types
├── normalizer.ts        # Topic normalization
├── aliases.ts           # Alias mappings
├── tracker.ts           # Track topic performance
└── dictionaries/        # Subject-specific topic dictionaries
    ├── penal.json
    ├── processual.json
    ├── constitutional.json
    └── ...
```

---

### Skill 7: Integration & DevOps
**Responsável por**: Environment setup, deployment, CI/CD

**Arquivos de referência**: `vercel.json`, `infra/`, `.env*`

**Stack**: Vercel, Docker, Terraform (opcional)

**Responsabilidades**:
- Configurar variáveis de ambiente
- Configurar Vercel secrets
- Setup CI/CD pipeline
- Configurar Docker local (dev)
- Monitorar errors (Sentry)

---

## Fluxo de Trabalho

### 1. Setup Inicial
```bash
# Cada dev clona o repo e instala dependências
cd studypro
npm install

# Copia .env.example para .env.local
cp .env.example .env.local
# Preenche com suas credenciais Supabase
```

### 2. Desenvolvimento
```bash
# Frontend
cd web && npm run dev

# Backend (local)
cd api && npm run dev

# Mobile
cd mobile && npx expo start
```

### 3. Commits
```bash
# Conventional commits
git commit -m "feat(dashboard): add mission card component"
git commit -m "fix(sessions): correct error rate calculation"
git commit -m "docs(api): update endpoint documentation"
```

### 4. Pull Requests
- Criar branch feature/module-name
- PR deve ter descrição clara do que foi implementado
- Screenshots para mudanças de UI
- Links para tasks relacionadas

---

## Convenção de Nomenclatura

### Branches
```
feature/dashboard-mission-card
fix/session-error-calculation
docs/api-endpoints
refactor/fsrs-algorithm
```

### Commits (Conventional)
```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração
docs: documentação
chore: tarefas de manutenção
test: testes
```

### Variáveis
- camelCase para variáveis e funções
- PascalCase para componentes React
- SCREAMING_SNAKE_CASE para constantes
- kebab-case para arquivos

---

## Guidelines de Código

### TypeScript
- Usar `strict: true` no tsconfig
- Tipos explícitos para APIs e funções públicas
- Interfaces para objetos, types para unions

### React/Next.js
- Server Components por padrão
- Client Components apenas onde necessário (useState, useEffect, event handlers)
- Usar TypeScript generics quando apropriado

### CSS/Tailwind
- Mobile-first (media queries min-width)
- Usar design tokens do tema
- Componentes com composition over inheritance

### Database
- RLS enabled em todas as tabelas
- Índices em colunas frequentemente consultadas
- Timestamps em UTC

---

## Recursos

### Links Importantes
- Spec: `/specdriven.md`
- Supabase Dashboard: https://supabase.com/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- shadcn/ui: https://ui.shadcn.com/

### Documentação
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- FSRS: https://github.com/open-spaced-repetition/fsrs

---

## Contato

Para dúvidas sobre arquitetura ou decisões de design, consulte primeiro o `specdriven.md`.

Para issues de implementation, abra um ticket no repositório.
