# StudyPro v2.1 — TASKS

Repositório de tasks do projeto StudyPro v2.1 - Orquestrador Adaptativo de Estudos para Carreiras Policiais.

## Estrutura de Pastas

```
tasks/
├── 01-pendente/           # Tasks a serem executadas
│   ├── fase-01-fundacao/    # ~45h
│   ├── fase-02-inteligencia/ # ~54h
│   └── fase-03-polimento/    # ~45h
└── 02-concluidos/         # Tasks finalizadas
```

## Fases do Projeto

### Fase 1 — Fundação do Orquestrador (~45h)

| Task | Título | Skill | Estimativa |
|------|--------|-------|------------|
| F1.1 | Onboarding 5 Passos | Frontend + UI/UX | ✅ Concluída |
| F1.2 | Registro de Sessão Mobile-First | Frontend + Backend | 6h |
| F1.3 | Geração Automática de Cards FSRS | FSRS Engine | ✅ Concluída (Backend) |
| F1.4 | Normalização de Tópicos | Topic Engine | ✅ Concluída (Backend) |
| F1.5 | Bottom Navigation Mobile | UI/UX | ✅ Concluída |
| F1.6 | Dashboard com Missão do Dia | Frontend + Planner | 6h |
| F1.7 | Planner Básico por Peso + Gap | Planner Engine | 8h |
| F1.8 | Estrutura de topicPerformance | Topic Engine | ✅ Concluída (Backend) |

### Fase 2 — Inteligência Adaptativa (~54h)

| Task | Título | Skill | Estimativa |
|------|--------|-------|------------|
| F2.1 | Planner Adaptativo por Matéria | Planner Engine | 10h |
| F2.2 | Prioridade por Tópico | Planner + Topic | 8h |
| F2.3 | Fila de Recuperação | Planner + Topic + Backend | 8h |
| F2.4 | Simulados — Registro + Diagnóstico | Frontend + Backend | 8h |
| F2.5 | Health Dashboard Completo | Frontend | 6h |
| F2.6 | Projeção de Nota | Planner Engine | ✅ Concluída (Backend) |
| F2.7 | Stats Focadas | Frontend | 6h |

### Fase 3 — Confiança, Retenção e Polimento (~45h)

| Task | Título | Skill | Estimativa |
|------|--------|-------|------------|
| F3.1 | Modo Pós-Impacto de Simulado | Planner + Frontend | 6h |
| F3.2 | Exportação PDF | Frontend | 4h |
| F3.3 | Notificações de Missão Diária | Backend + Frontend | 3h |
| F3.4 | Enriquequecimento Leve de Cards | FSRS + Frontend | 4h |
| F3.5 | Dark Mode Completo | UI/UX | 8h |
| F3.6 | Configuração Avançada FSRS | FSRS + Frontend | 4h |
| F3.7 | Extensão Chrome | Frontend | 16h |

---

## Total Estimado

| Fase | Estimativa |
|------|------------|
| Fase 1 | ~45h |
| Fase 2 | ~54h |
| Fase 3 | ~45h |
| **Total** | **~144h** |

---

## Como Usar

Cada task é um arquivo Markdown independente com:
- Descrição da funcionalidade
- Subtasks detalhadas
- Critérios de aceite
- Arquivos de referência
- Stack tecnológico

Para iniciar uma task, leia o arquivo correspondente e crie uma branch:

```bash
git checkout -b feature/F1.5-bottom-navigation
```

---

## Referências

- **Spec**: `specdriven.md`
- **Team Guide**: `DEV_TEAM_GUIDE.md`
- **Skills Structure**: `SKILLS_STRUCTURE.md`
- **Task Breakdown**: `TASK_BREAKDOWN.md`
