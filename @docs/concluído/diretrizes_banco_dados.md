# Diretrizes do Banco de Dados - StudyPro v2.1
Data: 23/03/2026

## Arquitetura do Banco de Dados (Supabase)

O banco de dados foi construído e alinhado com a especificação **v2.1 (Orquestrador Adaptativo)**. Toda a lógica de desempenho e recuperação ativa está refletida no schema.

### 📊 Tabelas Core

1.  **Profiles**: Configurações de usuário, metas de acerto, limites de revisão FSRS e preferências de plataforma.
2.  **Exams**: Concursos alvos do usuário, datas de prova, notas de corte e status da fase de estudo (base/intensificação/final).
3.  **Subjects**: Matérias pertencentes a um edital, pesos (0-100), acurácia atual e prioridade dinâmica calculada pelo Planner.
4.  **Question_sessions**: Registro detalhado de sessões de questões (QConcursos/TEC). Inclui acertos, erros, tags de assuntos erguidos e dificuldade percebida.
5.  **Topic_performance**: Estatísticas granulares por tópico (assunto). Controla a taxa de acerto móvel (7d/30d) e identifica recorrência de erros.
6.  **Recovery_queue**: Fila de tópicos que exigem intervenção ativa (recuperação) com base em erros repetidos ou desempenho em simulados.
7.  **Cards (FSRS)**: Cards de revisão gerados automaticamente a partir de erros em sessões. Campos alinhados com o algoritmo FSRS (stability, difficulty, due_date).
8.  **Mock_Exams**: Registro de simulados completos com diagnóstico pós-impacto (strong/attention/critical).

### ⚙️ Lógica Implementada via SQL

- **Enum Data Types**: Implementação de estados para cartões, origens, plataformas e razões de recuperação para integridade referencial forte.
- **Generated Columns**: `error_rate` em sessões e `score_difference` em simulados são calculados automaticamente para garantir consistência nas métricas.
- **Dynamic Views**: Criada a view `exam_details` que calcula em tempo real o `weeks_until_exam`, contornando a limitação de colunas geradas imutáveis.
- **RLS (Row Level Security)**: Políticas ativas para garantir que cada usuário acesse apenas seus próprios dados.
- **Triggers**: Atualização automática de `updated_at` em todas as tabelas e criação automática de `profile` no signup.

### 🛠️ Próximos Passos Recomendados

- Implementar lógica de cálculo de prioridade no backend (`src/lib/engines/planner.js`).
- Conectar frontend mobile às novas tabelas via Supabase Client.
- Configurar automação de "Modo Pós-Simulado" após inserção em `mock_exams`.

---
*Gerado por Antigravity (IA) conforme diretrizes do projeto.*
