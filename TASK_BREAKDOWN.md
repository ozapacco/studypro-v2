# StudyPro v2.1 — Task Breakdown

> Roadmap detalhado para desenvolvimento por múltiplos devs

## Legenda
- **P0**: Crítico — bloqueia funcionalidades essenciais
- **P1**: Importante — entrega valor significativo
- **P2**: Desejável — nice to have
- **Dep**: Dependência — task que precisa ser completada primeiro

---

## FASE 1 — Fundação do Orquestrador (~45h)

### Task F1.1: Onboarding 5 Passos
**Skill**: Frontend Core + UI/UX  
**Estimativa**: 8h  
**Prioridade**: P0  
**Dependências**: nenhuma

**Subtasks**:
- [x] F1.1.1 Criar schema de configuração inicial do usuário (concursos, data prova, tempo diário)
- [x] F1.1.2 Implementar Step 1: Seleção de concurso alvo
- [x] F1.1.3 Implementar Step 2: Data da prova (calcular fase automaticamente)
- [x] F1.1.4 Implementar Step 3: Tempo disponível diário
- [x] F1.1.5 Implementar Step 4: Primeira missão gerada
- [x] F1.1.6 Implementar Step 5: Registro da primeira sessão
- [x] F1.1.7 Criar lógica de retomar onboarding incompleto
- [x] F1.1.8 Validar fluxo completo (zero → loop real em ≤10min)

---

### Task F1.2: Registro de Sessão Mobile-First
**Skill**: Frontend Core + UI/UX + Backend  
**Estimativa**: 6h  
**Prioridade**: P0  
**Dependências**: nenhuma

**Subtasks**:
- [ ] F1.2.1 Criar tabela `questionSessions` no Supabase
- [ ] F1.2.2 Implementar formulário de registro de sessão
  - [ ] Campo matéria com autocomplete
  - [ ] Campo plataforma (QConcursos/TEC/Outra)
  - [ ] Campo total de questões
  - [ ] Campo total de acertos
  - [ ] Campo assuntos que mais errou (tags)
  - [ ] Campo dificuldade percebida (1-5)
- [ ] F1.2.3 Adicionar campos recomendados (tipo de erro)
- [ ] F1.2.4 Adicionar campos opcionais (tempo, observações, banca, modo)
- [ ] F1.2.5 Implementar cálculo automático de taxa
- [ ] F1.2.6 Criar feedback pós-envio (taxa sessão, média histórica, variação)
- [ ] F1.2.7 Validar tempo de registro < 2 minutos

---

### Task F1.3: Geração Automática de Cards FSRS
**Skill**: FSRS Engine + Backend  
**Estimativa**: 4h  
**Prioridade**: P0  
**Dependências**: F1.2

**Subtasks**:
- [x] F1.3.1 Implementar biblioteca FSRS (scheduler, card state, intervals)
- [x] F1.3.2 Criar Edge Function para gerar card a partir de erro
- [x] F1.3.3 Implementar lógica de unicidade (tópico+matéria)
- [x] F1.3.4 Adicionar contexto do erro no card ("Você errou este tópico em X das últimas Y sessões")
- [x] F1.3.5 Configurar prioridade maior para cards automáticos
- [x] F1.3.6 Testar geração em < 2 segundos

---

### Task F1.4: Normalização de Tópicos
**Skill**: Topic Engine + Backend  
**Estimativa**: 5h  
**Prioridade**: P0  
**Dependências**: F1.2

**Subtasks**:
- [x] F1.4.1 Criar tabela `topicPerformance`
- [x] F1.4.2 Implementar normalizador de tópicos (mapping livre → canônico)
- [x] F1.4.3 Criar dicionários de tópicos por matéria (Penal, Proc. Penal, Const., Adm., etc.)
- [x] F1.4.4 Implementar autocomplete com sugestões de tópicos existentes
- [x] F1.4.5 Criar sistema de aliases (fundir tags semelhantes)
- [x] F1.4.6 Implementar fallback para criar novo tópico canônico

---

### Task F1.5: Bottom Navigation Mobile
**Skill**: UI/UX  
**Estimativa**: 3h  
**Prioridade**: P0  
**Dependências**: nenhuma

**Subtasks**:
- [x] F1.5.1 Criar componente BottomNav
- [x] F1.5.2 Implementar navegação: Home / Registrar / Revisar / Stats
- [x] F1.5.3 Destacar item ativo
- [x] F1.5.4 Garantir touch targets ≥ 44px
- [x] F1.5.5 Testar em viewport 375px

---

### Task F1.6: Dashboard com Missão do Dia
**Skill**: Frontend Core + UI/UX + Planner Engine  
**Estimativa**: 6h  
**Prioridade**: P1  
**Dependências**: F1.1, F1.5

**Subtasks**:
- [ ] F1.6.1 Implementar MissãoCard (missão principal do dia)
- [ ] F1.6.2 Implementar Health Panel (painel de métricas)
  - [ ] Taxa de acerto geral (% + tendência)
  - [ ] Matéria mais fraca
  - [ ] Tópico crítico da semana
  - [ ] Consistência (dias com sessão)
  - [ ] Progresso do ciclo
- [ ] F1.6.3 Implementar lógica de geração da missão
- [ ] F1.6.4 Criar botão de "marcar como concluída"
- [ ] F1.6.5 Mostrar razão curta da missão ("Direito Penal está abaixo da meta...")
- [ ] F1.6.6 Validar carregamento em < 800ms

---

### Task F1.7: Planner Básico por Peso + Gap
**Skill**: Planner Engine + Backend  
**Estimativa**: 8h  
**Prioridade**: P1  
**Dependências**: F1.1, F1.4

**Subtasks**:
- [x] F1.7.1 Implementar Engine de Planner (mission generator)
- [x] F1.7.2 Implementar fórmula de prioridade por matéria
  - [x] peso_edital × (1 + fator_gap)
  - [x] fator_gap = max(0, (threshold_alvo - taxa_acerto) / threshold_alvo)
- [x] F1.7.3 Implementar recálculo semanal de prioridades
- [x] F1.7.4 Criar configuração de concursos pré-definidos
- [ ] F1.7.5 Explicação simples para usuário sobre mudanças (UI Pendente)
- [ ] F1.7.6 Permitir aceitar/rejeitar ajuste automático (UI Pendente)

---

### Task F1.8: Estrutura de topicPerformance
**Skill**: Topic Engine + Backend  
**Estimativa**: 5h  
**Prioridade**: P1  
**Dependências**: F1.4

**Subtasks**:
- [x] F1.8.1 Criar tabela `topicPerformance` com todos os campos
- [x] F1.8.2 Implementar tracking de tentativas, erros, taxa rolante 7d e 30d
- [x] F1.8.3 Implementar cálculo de recorrência (recurrenceScore)
- [x] F1.8.4 Criar índice para queries frequentes
- [x] F1.8.5 Implementar confidence score (qualidade da amostra)

---

## FASE 2 — Inteligência Adaptativa (~54h)

### Task F2.1: Planner Adaptativo por Matéria
**Skill**: Planner Engine + Backend  
**Estimativa**: 10h  
**Prioridade**: P0  
**Dependências**: F1.7, F1.8

**Subtasks**:
- [ ] F2.1.1 Implementar microajuste após sessões ruins consecutivas
- [ ] F2.1.2 Integrar dados de simulado no cálculo de prioridade
- [ ] F2.1.3 Implementar fator de proximidade da prova
- [ ] F2.1.4 Implementar backlog de revisão FSRS no cálculo
- [ ] F2.1.5 Integrar tempo disponível diário
- [ ] F2.1.6 Criar explicação humanizada das mudanças

---

### Task F2.2: Prioridade por Tópico
**Skill**: Planner Engine + Topic Engine  
**Estimativa**: 8h  
**Prioridade**: P0  
**Dependências**: F1.8, F2.1

**Subtasks**:
- [ ] F2.2.1 Implementar cálculo de prioridade por tópico
- [ ] F2.2.2 Integrar recorrência de erro no cálculo
- [ ] F2.2.3 Implementar criticidade em simulado
- [ ] F2.2.4 Criar sistema de confiança da métrica
- [ ] F2.2.5 Preferir menor unidade (tópico) com maior impacto

---

### Task F2.3: Fila de Recuperação
**Skill**: Planner Engine + Topic Engine + Backend  
**Estimativa**: 8h  
**Prioridade**: P0  
**Dependências**: F1.4, F2.2

**Subtasks**:
- [ ] F2.3.1 Criar tabela `recoveryQueue`
- [ ] F2.3.2 Implementar gatilhos de entrada
  - [ ] erro repetido em múltiplas sessões
  - [ ] erro em simulado
  - [ ] taxa muito baixa em tópico importante
  - [ ] erro marcado como "nunca aprendi direito"
- [ ] F2.3.3 Implementar sugestão de ações (teoria, questões, card)
- [ ] F2.3.4 Criar статус: open / in_progress / done / archived
- [ ] F2.3.5 Implementar rechecagem em 48-72h
- [ ] F2.3.6 Implementar saída após melhora mínima

---

### Task F2.4: Simulados — Registro + Diagnóstico
**Skill**: Frontend Core + UI/UX + Backend  
**Estimativa**: 8h  
**Prioridade**: P0  
**Dependências**: F1.2

**Subtasks**:
- [ ] F2.4.1 Criar tabela `mockExams`
- [ ] F2.4.2 Implementar formulário de registro de simulado
  - [ ] Nome, data, plataforma
  - [ ] Nota por matéria
  - [ ] Nota total, nota de corte
- [ ] F2.4.3 Implementar cálculo de "faltaram X pontos"
- [ ] F2.4.4 Marcar matérias < 50% como críticas
- [ ] F2.4.5 Implementar diagnóstico pós-simulado
  - [ ] Funcionando (≥ 70%)
  - [ ] Atenção (50-70%)
  - [ ] Prioridade máx (< 50%)
- [ ] F2.4.6 Gerar sugestão de recuperação pós-simulado
- [ ] F2.4.7 Histórico com evolução

---

### Task F2.5: Health Dashboard Completo
**Skill**: Frontend Core + UI/UX + Planner Engine  
**Estimativa**: 6h  
**Prioridade**: P1  
**Dependências**: F1.6, F2.4

**Subtasks**:
- [ ] F2.5.1 Implementar todas as métricas obrigatórias
- [ ] F2.5.2 Adicionar atualização após registro de sessão
- [ ] F2.5.3 Tratar caso sem dados (mostrar CTA)
- [ ] F2.5.4 Não mostrar "matéria mais fraca" com amostra insuficiente
- [ ] F2.5.5 Implementar tópico crítico com recorrência mínima

---

### Task F2.6: Projeção de Nota
**Skill**: Planner Engine + Backend  
**Estimativa**: 4h  
**Prioridade**: P1  
**Dependências**: F2.4, F2.5

**Subtasks**:
- [x] F2.6.1 Implementar fórmula de projeção
  - [x] Base: desempenho atual × peso/edital × resultados simulado
- [x] F2.6.2 Calcular gap vs nota de corte
- [x] F2.6.3 Atualizar após cada simulado
- [ ] F2.6.4 Exibir projeção de forma simples (UI Pendente)

---

### Task F2.7: Stats Focadas
**Skill**: Frontend Core + UI/UX  
**Estimativa**: 6h  
**Prioridade**: P1  
**Dependências**: F2.5

**Subtasks**:
- [ ] F2.7.1 Evolução da taxa de acerto por matéria (gráfico semanal + meta 70%)
- [ ] F2.7.2 Evolução por tópico crítico (lista/gráfico)
- [ ] F2.7.3 Heatmap de consistência (90 dias)
- [ ] F2.7.4 Ranking pessoal de matérias (mais fraca → mais forte)
- [ ] F2.7.5 Fila de recuperação (abertos, concluídos, recorrentes)
- [ ] F2.7.6 Carregamento em < 1s

---

### Task F2.8: Microajuste Após Sessões Ruins
**Skill**: Planner Engine + Backend  
**Estimativa**: 4h  
**Prioridade**: P1  
**Dependências**: F2.1

**Subtasks**:
- [x] F2.8.1 Detectar sequência de sessões ruins (concluído em F2.1)
- [x] F2.8.2 Disparar microajuste de prioridade (concluído em F2.1)
- [ ] F2.8.3 Explicar mudança de forma simples (UI Pendente)
- [ ] F2.8.4 Permitir aceitar ou rejeitar (UI Pendente)

---

## FASE 3 — Confiança, Retenção e Polimento (~45h)

### Task F3.1: Modo Pós-Impacto de Simulado
**Skill**: Planner Engine + Frontend Core  
**Estimativa**: 6h  
**Prioridade**: P1  
**Dependências**: F2.4

**Subtasks**:
- [ ] F3.1.1 Ativar modo especial após simulado relevante
- [ ] F3.1.2 Aumentar temporariamente peso das matérias críticas
- [ ] F3.1.3 Destacar erros do simulado na revisão
- [ ] F3.1.4 Substituir missão normal por recuperação (se aplicável)
- [ ] F3.1.5 Recalibrar projeção de nota
- [ ] F3.1.6 Explicar alteração de forma simples

---

### Task F3.2: Exportação PDF
**Skill**: Frontend Core  
**Estimativa**: 4h  
**Prioridade**: P1  
**Dependências**: F2.7

**Subtasks**:
- [ ] F3.2.1 Implementar geração de PDF com stats
- [ ] F3.2.2 Incluir evolução por matéria/tópico
- [ ] F3.2.3 Incluir projeção de nota
- [ ] F3.2.4 Adicionar heatmap de consistência

---

### Task F3.3: Notificações de Missão Diária
**Skill**: Backend + Frontend Core  
**Estimativa**: 3h  
**Prioridade**: P1  
**Dependências**: F1.6

**Subtasks**:
- [ ] F3.3.1 Implementar sistema de notificações push
- [ ] F3.3.2 Configurar horário de lembrete diário
- [ ] F3.3.3 Notificar com missão do dia
- [ ] F3.3.4 Notificar com revisão urgente

---

### Task F3.4: Enriquequecimento Leve de Cards
**Skill**: FSRS Engine + Frontend Core  
**Estimativa**: 4h  
**Prioridade**: P1  
**Dependências**: F1.3

**Subtasks**:
- [ ] F3.4.1 Adicionar sugestões ao criar/editar card
  - [ ] "qual regra você esqueceu?"
  - [ ] "qual foi a pegadinha?"
  - [ ] "cole a explicação da questão"
  - [ ] "escreva em 1 linha o que precisa lembrar"
- [ ] F3.4.2 Tornar preenchimento opcional mas incentivado
- [ ] F3.4.3 UX para cards sem verso ("Eu sei isso?")

---

### Task F3.5: Dark Mode Completo
**Skill**: UI/UX  
**Estimativa**: 8h  
**Prioridade**: P1  
**Dependências**: nenhuma

**Subtasks**:
- [ ] F3.5.1 Implementar theme provider
- [ ] F3.5.2 Criar tokens de design para dark mode
- [ ] F3.5.3 Aplicar dark mode em todos os componentes
- [ ] F3.5.4 Implementar toggle no settings
- [ ] F3.5.5 Detectar preferência do sistema
- [ ] F3.5.6 Persistir escolha do usuário

---

### Task F3.6: Configuração Avançada FSRS
**Skill**: FSRS Engine + Frontend Core  
**Estimativa**: 4h  
**Prioridade**: P2  
**Dependências**: F1.3

**Subtasks**:
- [ ] F3.6.1 Permitir ajustar parâmetros FSRS
  - [ ] Easy bonus
  - [ ] Interval modifier
  - [ ] Minima/ease factor
- [ ] F3.6.2 UI para configuração avançada
- [ ] F3.6.3 Salvar preferências por usuário

---

### Task F3.7: Extensão Chrome
**Skill**: Frontend Core + Integration  
**Estimativa**: 16h  
**Prioridade**: P2  
**Dependências**: F2.4

**Subtasks**:
- [ ] F3.7.1 Setup projeto de extensão Chrome
- [ ] F3.7.2 Implementar injeção em QConcursos
- [ ] F3.7.3 Implementar injeção em TEC
- [ ] F3.7.4 Captura de resultado automático
- [ ] F3.7.5 Sync com backend
- [ ] F3.7.6 Publicar na Chrome Web Store

---

## Resumo por Skill

| Skill | Tasks | Estimativa Total |
|-------|-------|------------------|
| UI/UX | F1.5, F3.5 | ~11h |
| Frontend Core | F1.1, F1.2, F1.6, F2.4, F2.5, F2.7, F3.1, F3.2, F3.3, F3.4 | ~49h |
| Backend & Supabase | F1.2, F1.3, F1.4, F1.7, F1.8, F2.3, F2.4 | ~34h |
| FSRS Engine | F1.3, F3.4, F3.6 | ~12h |
| Planner Engine | F1.6, F1.7, F2.1, F2.2, F2.3, F2.6, F2.8, F3.1 | ~44h |
| Topic Engine | F1.4, F1.8, F2.2, F2.3 | ~26h |
| Integration & DevOps | Contínua | ~8h |

**Total estimado do projeto**: ~184h

---

## Ordem de Execução Recomendada

### Sprint 1 (Foundation)
1. F1.5 — Bottom Navigation (1 dia)
2. F1.2 — Registro de Sessão (2 dias)
3. F1.4 — Normalização de Tópicos (2 dias)
4. F1.3 — FSRS básico (1 dia)

### Sprint 2 (Core Loop)
5. F1.1 — Onboarding (2 dias)
6. F1.6 — Dashboard + Missão (2 dias)
7. F1.7 — Planner básico (2 dias)
8. F1.8 — topicPerformance (1 dia)

### Sprint 3 (Intelligence)
9. F2.4 — Simulados (2 dias)
10. F2.1 — Planner adaptativo (2 dias)
11. F2.2 — Prioridade por tópico (2 dias)
12. F2.3 — Fila de recuperação (2 dias)

### Sprint 4 (Polish)
13. F2.5 — Health Dashboard (1 dia)
14. F2.6 — Projeção (1 dia)
15. F2.7 — Stats (2 dias)
16. F2.8 — Microajuste (1 dia)

### Sprint 5 (Features)
17. F3.1 — Pós-impacto (1 dia)
18. F3.4 — Enriquequecimento (1 dia)
19. F3.3 — Notificações (1 dia)
20. F3.5 — Dark mode (2 dias)
21. F3.2 — PDF (1 dia)
22. F3.6 — FSRS avançado (1 dia)

### Sprint 6 (Future)
23. F3.7 — Extensão Chrome (4 dias)

---

## Notas

- Tasks podem ser divididas entre devs diferentes
- Cada task deve gerar PR individual
- Todas as tasks devem ter testes unitários
- Code review obrigatório antes de merge
- Deploy automático após merge em main
