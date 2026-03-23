# StudyPro v2.1
**Orquestrador Adaptativo de Estudos para Carreiras Policiais**

[Logo]

## 🎯 O que é?

O StudyPro não é um app de flashcards. É o **sistema nervoso central do seu estudo**. Ele não substitui o QConcursos ou o TEC — ele os torna mais poderosos ao registrar, analisar e decidir o que você precisa fazer a seguir.

## ✨ Funcionalidades

- 🎯 **Missão Diária** — Sistema decide o que você deve estudar hoje
- 📊 **Painel de Saúde** — Métricas que importam para aprovação
- 📝 **Registro Rápido** — Transforme sessões em dados em <2min
- 🔄 **Revisão Espaçada** — FSRS alimentado por erros reais
- 📈 **Diagnóstico** — De onde vem sua nota de verdade
- 🏋️ **Recuperação Ativa** — Intervenção para tópicos críticos

## 🚀 Começando

### Pré-requisitos
- Node.js 20+
- npm 10+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/studypro/studypro.git
cd studypro

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env

# Inicie com Docker
docker-compose up -d

# Ou execute localmente
npm run dev:api
```

### Variáveis de Ambiente

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studypro
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

## 📱 Aplicativos

### Mobile (Expo/React Native)
```bash
cd mobile
npm install
npm start
```

### Web (Next.js)
```bash
cd web
npm install
npm run dev
```

## 🏗️ Arquitetura

```
┌────────────────────────────────────────────────────────┐
│                    STUDYPRO v2.1                        │
│                 Orquestrador Adaptativo                 │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐       │
│  │ Planner  │  │ Tracker  │  │  Reviewer/FSRS │       │
│  │          │  │          │  │                │       │
│  └──────────┘  └──────────┘  └────────────────┘       │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐       │
│  │  Topic   │  │ Recovery │  │  Mock Analyzer │       │
│  │  Engine  │  │  Queue   │  │                │       │
│  └──────────┘  └──────────┘  └────────────────┘       │
└────────────────────────────────────────────────────────┘
```

## 🔌 API

Documentação completa em `/docs/api.md`

### Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | /dashboard | Missão e métricas |
| POST | /sessions | Registrar sessão |
| GET | /reviews/due | Cards pendentes |
| POST | /reviews/:id | Avaliar card |
| POST | /mock-exams | Registrar simulado |
| GET | /stats/overview | Estatísticas |

## 🧪 Testes

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Todos os testes
npm test
```

## 🚢 Deploy

### Docker
```bash
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f infra/k8s/
```

### AWS (Terraform)
```bash
cd infra/terraform
terraform init
terraform apply
```

## 📖 Documentação

- [API Reference](./docs/API.md)

## 🗺️ Roadmap

### Fase 1 — Fundação (~45h)
- [x] Onboarding 5 passos
- [ ] Registro mobile-first
- [ ] Geração automática de cards
- [ ] Dashboard com missão

### Fase 2 — Inteligência (~54h)
- [ ] Planner adaptativo
- [ ] Fila de recuperação
- [ ] Simulados completo

### Fase 3 — Retenção (~45h)
- [ ] Modo pós-impacto
- [ ] Notificações
- [ ] Dark mode

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/amazing`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Abra um Pull Request

## 📄 Licença

MIT © StudyPro

## 📊 Métricas de Sucesso

| Métrica | Meta |
|--------|------|
| Retenção D7 | ≥ 60% |
| Sessões/semana | ≥ 5 |
| Abandono onboarding | < 30% |
| Cards automáticos | > 80% |
| Tempo de registro | < 2 min |

---

Made with ❤️ para aprovados de concurso