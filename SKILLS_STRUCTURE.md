# StudyPro v2.1 — Skills Structure

> Estrutura de skills/modules para desenvolvimento paralelo por múltiplos devs

---

## Skill 1: UI/UX Design System
**Responsável por**: Componentes visuais, design system, mobile-first UX

**Stack**: Tailwind CSS, Radix UI, shadcn/ui

**Arquivos de referência**: `web/src/components/ui/`

**Componentes a criar**:
```
components/ui/
├── Button.tsx          ✅ Existe
├── Input.tsx           → Input com label, erro, helper text
├── Select.tsx          → Select com busca, múltipla seleção
├── Card.tsx            → Card básico com variants
├── Badge.tsx           → Tags coloridas por status
├── Progress.tsx        → Barra de progresso
├── Modal.tsx            → Dialog/Modal
├── BottomNav.tsx       → Navegação mobile
├── StatCard.tsx        → Card de métrica
├── MissionCard.tsx     → Card de missão
├── TopicPill.tsx       → Pills de tópico
├── DifficultyScale.tsx → Escala 1-5
├── EmptyState.tsx      → Estado vazio
├── Loading.tsx         → Skeleton/loading
└── Toast.tsx           → Notificações
```

**Responsabilidades**:
- Criar componentes base com design tokens
- Implementar mobile-first (375px primary)
- Garantir touch targets ≥ 44px
- Acessibilidade WCAG 2.1 AA

---

## Skill 2: Frontend Core
**Responsável por**: Páginas, roteamento, state management

**Stack**: Next.js 14 App Router, React Context

**Arquivos de referência**: `web/src/app/`

**Páginas a criar**:
```
app/
├── page.tsx                    # Redirect → /dashboard
├── login/page.tsx              ✅ Existe
├── register/page.tsx           ✅ Existe
├── onboarding/
│   └── page.tsx                # 5 passos (F1.1)
├── dashboard/
│   └── page.tsx                # Missão + métricas (F1.6)
├── sessions/
│   ├── new/page.tsx            # Registro rápido (F1.2)
│   └── history/page.tsx        # Histórico
├── mocks/
│   ├── new/page.tsx            # Registro simulado (F2.4)
│   └── [id]/page.tsx           # Diagnóstico
├── review/
│   └── page.tsx                # FSRS cards
├── stats/
│   └── page.tsx                # Métricas (F2.7)
├── topics/
│   └── page.tsx                # Lista de tópicos
└── settings/
    └── page.tsx                # Configurações
```

**Responsabilidades**:
- Implementar todas as páginas
- Criar formulários com validação
- Integrar Supabase Auth
- Gerenciar estado global

---

## Skill 3: Backend & Supabase
**Responsável por**: Database, Edge Functions, API, RLS

**Stack**: Supabase, Deno, PostgreSQL

**Arquivos de referência**: `supabase/`, `api/`

**Tabelas do banco**:
```sql
-- questionSessions     já existe?
-- cards                já existe?
-- subjects             já existe?
-- mockExams            (novo - F2.4)
-- topicPerformance    (novo - F1.8)
-- recoveryQueue       (novo - F2.3)
```

**Edge Functions**:
```
supabase/functions/api/
├── sessions/
│   ├── index.ts          # CRUD
│   └── analyze.ts        # Extract errors
├── topics/
│   ├── index.ts
│   └── normalize.ts
├── recovery/
│   ├── index.ts
│   └── detect.ts
├── planner/
│   ├── mission.ts
│   └── priorities.ts
└── fsrs/
    └── review.ts
```

**Responsabilidades**:
- Criar/migrar tabelas
- Configurar RLS policies
- Implementar Edge Functions
- Triggers para analytics

---

## Skill 4: FSRS Engine
**Responsável por**: Repetição espaçada, scheduling

**Arquivos de referência**: `src/lib/engines/fsrs.ts`

**Arquivos a criar**:
```
lib/engines/fsrs/
├── types.ts
├── constants.ts
├── scheduler.ts
├── card.ts
└── session.ts
```

**Responsabilidades**:
- Implementar FSRS (open-source)
- Calcular intervalos
- Ease factor
- Limites diários

---

## Skill 5: Planner Engine
**Responsável por**: Decisão adaptativa, prioridades

**Arquivos de referência**: `src/lib/engines/planner.ts`

**Arquivos a criar**:
```
lib/engines/planner/
├── types.ts
├── mission.ts
├── priorities.ts
├── phases.ts
├── projection.ts
├── recovery.ts
└── config.ts
```

**Responsabilidades**:
- Gerar missão do dia
- Calcular prioridades
- Detectar fase da prova
- Projetar nota

---

## Skill 6: Topic Engine
**Responsável por**: Normalização, tracking por tópico

**Arquivos de referência**: `src/lib/engines/topic.ts`

**Arquivos a criar**:
```
lib/engines/topics/
├── types.ts
├── normalizer.ts
├── aliases.ts
├── tracker.ts
└── dictionaries/
    ├── penal.json
    ├── processual.json
    ├── constitutional.json
    └── ...
```

**Responsabilidades**:
- Normalizar tags → tópicos canônicos
- Trackear desempenho
- Detectar recorrência
- Gerenciar aliases

---

## Skill 7: Integration & DevOps
**Responsável por**: Environment, deployment, CI/CD

**Arquivos de referência**: `.env*`, `vercel.json`, `infra/`

**Responsabilidades**:
- Variáveis de ambiente
- Vercel secrets
- CI/CD pipeline
- Docker local
- Monitoramento (Sentry)

---

## Como Atribuir Tasks por Skill

| Skill | Dev | Tasks Iniciais |
|-------|-----|----------------|
| UI/UX | Dev 1 | F1.5, F3.5 |
| Frontend | Dev 1 | F1.1, F1.2, F1.6 |
| Frontend | Dev 2 | F2.4, F2.5, F2.7 |
| Backend | Dev 1 | F1.2, F1.3, F1.4 |
| Backend | Dev 2 | F1.7, F1.8, F2.3 |
| FSRS | Dev 1 | F1.3, F3.4 |
| Planner | Dev 1 | F1.6, F1.7, F2.1 |
| Planner | Dev 2 | F2.2, F2.3, F2.6 |
| Topics | Dev 1 | F1.4, F1.8, F2.2 |
| DevOps | Dev 1 | Setup inicial |

---

## Dependências entre Skills

```
UI/UX
  ↑
  └─> Frontend Core (depende de componentes prontos)
           ↑
           └─> Backend (depende de APIs)
                    ↑
                    └─> FSRS Engine, Planner, Topic (lógica de negócio)
```

**Ordem recomendada**:
1. DevOps → configura ambiente
2. UI/UX → cria componentes base
3. Backend → cria database + APIs
4. FSRS/Planner/Topic → implementa engines
5. Frontend → constrói páginas integrando tudo
