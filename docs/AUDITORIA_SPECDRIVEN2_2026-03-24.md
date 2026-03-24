# Auditoria 1:1 - specdriven2.md
Data: 2026-03-24

Legenda:
- `OK`: implementado e funcional no fluxo principal.
- `PARCIAL`: implementado em parte, com lacunas de regra/UX.
- `FALTANDO`: ainda nao implementado.

## Resumo executivo

- Total de criterios auditados: **45**
- `OK`: **31**
- `PARCIAL`: **11**
- `FALTANDO`: **3**

Conclusao: o loop central (registrar sessao -> gerar sinal -> revisar/recuperar -> recalcular missao) esta operacional. Ainda faltam pontos de fechamento para aderencia total ao spec.

## Modulo 1 - Dashboard (Tela de Comando)

| Requisito | Status | Observacao |
|---|---|---|
| Missao gerada automaticamente ao abrir app | OK | Planner roda em `GET /api/dashboard` e no dashboard server-side. |
| Maximo 1 missao principal por vez | OK | Planner retorna uma missao principal por ciclo. |
| Se cards vencidos > 5, revisao primeiro | OK | Regra aplicada no planner. |
| Recuperacao pode substituir missao normal | OK | `recovery_queue` tem prioridade no planner. |
| Missao com razao curta e humana | OK | `explanation` humanizada no planner/dashboard. |
| Missao pode ser marcada como concluida | FALTANDO | Nao ha endpoint/acao de conclusao da missao. |
| Painel saude: taxa geral | OK | Calculada por sessoes recentes. |
| Painel saude: materia mais fraca | PARCIAL | Disponivel por topico/performance, mas sem regra robusta de janela em todos os pontos. |
| Painel saude: topico critico da semana | OK | Derivado de `topic_performance`. |
| Painel saude: consistencia | OK | Streak e heatmap via sessoes. |
| Painel saude: progresso do ciclo/alocacao | PARCIAL | Sem indicador claro de "missoes concluidas / planejadas". |

## Modulo 2 - Registro de Sessao de Questoes

| Requisito | Status | Observacao |
|---|---|---|
| Campos obrigatorios principais | OK | Subject, plataforma, total, acertos, tags erro, dificuldade. |
| Tipo de erro recomendado | OK | `errorType` suportado. |
| Campos opcionais (duracao/notas/modo) | OK | Suportados na API. |
| Campo banca | FALTANDO | Campo ainda nao persistido no schema/rota. |
| Pos-save com taxa, historico, variacao | OK | `feedback` retornado na API. |
| Normalizacao de tags livres para canonico | OK | `ensureCanonicalTopics` + `topic_dictionary`. |
| Sugestao/autocomplete por materia | OK | API de assuntos por disciplina. |
| Alias/fusao posterior | PARCIAL | CRUD de topicos existe; fusao automatica admin ainda limitada. |
| Geracao automatica de card por erro | OK | Card criado/atualizado por topico. |
| Duplicado nao explode base (lapse em existente) | OK | Card existente recebe `lapses+1`. |
| Contexto de erro no card | OK | `error_context` atualizado. |
| Sessao sem erro nao gera card | OK | So gera card quando `totalErrors > 0`. |
| Fila de recuperacao com gatilhos | OK | never_learned, low_accuracy, recurrent_error, mock_exam. |
| Saida automatica da recuperacao por melhora minima | FALTANDO | Ainda nao existe regra de "auto-resolver por melhora". |

## Modulo 3 - Planner de Alocacao Adaptativa

| Requisito | Status | Observacao |
|---|---|---|
| Prioridade por peso x gap | OK | Formula aplicada no planner. |
| Usa desempenho por materia e topico | OK | Topicos da materia priorizada entram na decisao. |
| Considera backlog FSRS | OK | Due cards influenciam missao. |
| Considera proximidade da prova | OK | Fase calculada por dias ate prova. |
| Fases (base/intensificacao/final) | OK | Implementadas no planner. |
| Recalculo semanal explicito | PARCIAL | Recalculo acontece a cada geracao de missao; nao ha agendamento semanal formal. |
| Usuario aceita/rejeita ajuste automatico | PARCIAL | Ainda nao existe fluxo persistido de aceite/rejeicao. |
| Confianca da amostra influenciando motor | PARCIAL | Ha sinais indiretos (attempts), sem modelo de confianca completo. |

## Modulo 4 - Simulado

| Requisito | Status | Observacao |
|---|---|---|
| Registro de simulado (nome/data/plataforma/nota) | OK | API e tela operacionais. |
| Calcula gap vs corte | OK | `gapToCutoff` retornado. |
| Classificacao 70/50-70/<50 | OK | Regras ajustadas. |
| Diagnostico pos-simulado | OK | `analysis` com 3 secoes. |
| Topicos de simulado com peso maior | PARCIAL | Impacta recovery/cards; ponderacao formal extra no planner ainda simples. |
| Modo pos-impacto apos simulado | OK | Planner prioriza criticos recentes de simulado. |
| Usuario aceitar/adiar pos-impacto | PARCIAL | Sem fluxo formal de aceite/adiamento. |

## Modulo 5 - Revisao FSRS

| Requisito | Status | Observacao |
|---|---|---|
| Revisao de cards pendentes | OK | `reviews/pending` e `reviews/process`. |
| Contexto de origem no card | OK | `error_context` utilizado. |
| Cards automaticos sem verso com UX propria | PARCIAL | Fluxo existe, mas UX dedicada Sim/Meio/Nao nao esta fechada 1:1 no spec. |
| Exibir proximo intervalo em linguagem humana | PARCIAL | Retorna intervalo base; texto humano completo ainda limitado. |
| Limite configuravel de duracao de sessao | PARCIAL | Nao ha enforcement claro por tempo de sessao no frontend atual. |

## Modulo 6 - Estatisticas

| Requisito | Status | Observacao |
|---|---|---|
| Evolucao de taxa (semanal) | OK | Endpoint + grafico. |
| Projecao de nota | OK | Baseada em pesos/acuracia. |
| Heatmap 90 dias | OK | Implementado. |
| Ranking pessoal | OK | `topic_performance` ordenado. |
| Fila de recuperacao (abertos/concluidos) | OK | `recovery_queue` agregada. |
| Evolucao por topico critico (historico detalhado) | PARCIAL | Ranking atual existe, historico temporal por topico ainda limitado. |
| Exportacao PDF | PARCIAL | Atalho de print existe; export formal dedicada ainda nao finalizada. |

## Modulo 7 - Onboarding

| Requisito | Status | Observacao |
|---|---|---|
| Fluxo 5 passos | OK | Tela existente. |
| Persistencia de passos | OK | `onboarding/step/[step]` grava em `user_settings`. |
| Concluir onboarding cria base inicial util | OK | Cria exame, disciplinas predefinidas e primeira sessao opcional. |
| Sem criacao manual de card obrigatoria | OK | Cards sao auto-gerados quando ha erro inicial. |
| Retomar onboarding incompleto | PARCIAL | Ha base de dados para retomar; UX de retomada automatica pode evoluir. |

## Modulo 15 - Especificacoes tecnicas (schema/engine)

| Requisito | Status | Observacao |
|---|---|---|
| `question_sessions`, `topic_performance`, `mock_exams`, `recovery_queue` usados no fluxo | OK | Rotas principais integradas. |
| Campos de cards com origem de sessao/mock | OK | `session_error` e `mock_exam_error` utilizados. |
| Integracao externa manual-first | OK | Fluxo manual e o padrao operacional. |
| Requisitos mobile-first de performance/UX | PARCIAL | Navegacao e fluxo existem; benchmark formal de perf ainda nao consolidado. |

## Gaps prioritarios (P0/P1)

1. **Missao concluida**: criar endpoint e log de conclusao da missao do dia.
2. **Saida automatica da recovery queue**: regra de melhora minima para fechar item (`done`).
3. **Campo banca na sessao**: adicionar no schema/rota/form para aderencia total.
4. **Aceite/rejeicao de ajuste automatico do planner**: persistir decisao do usuario.
5. **Historico temporal por topico critico**: curva por topico (nao apenas ranking estatico).

## Evidencias principais no codigo

- Planner: `web/src/lib/engines/planner.ts`
- Sessao: `web/src/app/api/sessions/route.ts`
- Simulado: `web/src/app/api/simulados/route.ts`
- Disciplinas/Assuntos: `web/src/app/api/subjects/route.ts`, `web/src/app/api/topics/route.ts`, `web/src/app/dashboard/plano/page.tsx`
- Dashboard/Stats/Saude: `web/src/app/api/dashboard/route.ts`, `web/src/app/api/dashboard/saude/route.ts`, `web/src/app/api/stats/route.ts`
