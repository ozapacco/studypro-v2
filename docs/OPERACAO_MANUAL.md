# StudyPro v2.1 - Operacao Manual (Sem Integracao Externa)

Este roteiro e para uso diario no modelo que voce definiu: resolver questoes no TEC/QConcursos e alimentar o StudyPro manualmente.

## 1. Fluxo diario recomendado

1. Abrir o dashboard e ler a missao do dia (revisao, recuperacao ou questoes).
2. Se necessario, cadastrar/ajustar disciplinas em `/dashboard/plano`.
3. Se necessario, cadastrar assuntos canonicos e aliases em `/dashboard/plano`.
4. Resolver questoes no TEC/QConcursos.
5. Registrar sessao em `/dashboard/registrar`.
6. Revisar cards pendentes em `/dashboard/revisar`.
7. Registrar simulado periodico em `/dashboard/simulados/registrar`.
8. Acompanhar saude e stats em `/dashboard/saude` e `/dashboard/stats`.

## 2. Cadastro de disciplinas e assuntos

### Via tela
- URL: `/dashboard/plano`
- Acoes:
- adicionar disciplina (nome, peso, meta)
- remover disciplina
- adicionar assunto canonico + aliases
- remover assunto

### Via API (autenticado por cookie de sessao)

#### Criar/atualizar disciplina
`POST /api/subjects`

```json
{
  "mode": "subject",
  "name": "Direito Penal",
  "weight": 25,
  "target_accuracy": 70
}
```

#### Listar disciplinas do edital ativo
`GET /api/subjects?detailed=1`

#### Atualizar disciplina
`PUT /api/subjects`

```json
{
  "id": "<subject_id>",
  "weight": 30,
  "target_accuracy": 75
}
```

#### Excluir disciplina
`DELETE /api/subjects?id=<subject_id>`

#### Criar/atualizar assunto canonico
`POST /api/subjects`

```json
{
  "mode": "topic",
  "subject": "Direito Penal",
  "canonical": "Legitima Defesa",
  "aliases": ["legitima defesa", "excludente legitima defesa"]
}
```

#### Listar assuntos de uma disciplina
`GET /api/subjects?subject=Direito%20Penal`

#### Excluir assunto
`DELETE /api/topics?id=<topic_id>`

## 3. Registro de sessao de questoes (manual)

Endpoint: `POST /api/sessions`

Payload minimo:

```json
{
  "subject": "Direito Penal",
  "platform": "tec",
  "questions": 40,
  "hits": 26,
  "errorTags": ["legitima defesa", "concurso de pessoas"],
  "difficulty": 3,
  "errorType": "confused"
}
```

Payload completo suportado:

```json
{
  "subject": "Direito Penal",
  "platform": "qconcursos",
  "totalQuestions": 50,
  "correctAnswers": 35,
  "errorTags": ["legitima defesa", "estado de necessidade"],
  "canonicalTopics": [],
  "perceivedDifficulty": 4,
  "errorType": "never_learned",
  "sessionMode": "focused_topic",
  "durationMinutes": 55,
  "notes": "foco em excludentes",
  "sessionDate": "2026-03-24T10:30:00.000Z"
}
```

O que acontece apos salvar:
- normaliza tags para topicos canonicos
- grava `question_sessions` com `error_tags` e `canonical_topics`
- atualiza `topic_performance` (attempts/errors/recurrence)
- cria/atualiza card FSRS por topico
- dispara recuperacao quando aplicavel

## 4. Registro de simulado

Endpoint: `POST /api/simulados`

```json
{
  "name": "Simulado PCSC Semana 08",
  "examDate": "2026-04-10",
  "platform": "TEC",
  "cutoff": 70,
  "totalScore": 62,
  "subjects": [
    { "name": "Direito Penal", "total": 20, "hits": 8 },
    { "name": "Processo Penal", "total": 20, "hits": 11 },
    { "name": "Constitucional", "total": 20, "hits": 15 }
  ]
}
```

O que acontece apos salvar:
- classifica materias em `strong` (>=70), `attention` (50-70), `critical` (<50)
- grava `mock_exams` com analise
- atualiza `topic_performance` (GERAL do simulado)
- abre `recovery_queue` para materias criticas
- cria/atualiza cards `mock_exam_error`

## 5. Missao diaria e revisao

- Missao: `GET /api/dashboard`
- Revisoes pendentes: `GET /api/reviews/pending`
- Processar revisao: `POST /api/reviews/process` com `{ "cardId": "...", "rating": 1..5 }`

Regra central atual do planner:
- se houver recuperacao aberta -> missao de recuperacao
- senao, se cards vencidos > 5 -> missao de revisao
- senao -> missao de questoes por peso x gap e topico critico

## 6. Checklist operacional de rotina (curto)

- Antes de estudar: conferir missao.
- Depois de estudar: registrar sessao sempre.
- Ao errar recorrente: validar fila de recuperacao.
- 1x por semana: registrar simulado.
- 1x por semana: ajustar pesos/metas de disciplinas no plano.
