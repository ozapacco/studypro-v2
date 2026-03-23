# Deploy com Vercel + Supabase

## Quick Start

```bash
git clone https://github.com/studypro/studypro.git
cd studypro
npm install

cp .env.vercel.example .env.local

npm run deploy
```

## Supabase Local

```bash
npm run supabase:start
npm run supabase:migrate
npm run supabase:stop
```

## Vercel

### Variáveis de Ambiente (Dashboard Vercel)

| Nome | Valor |
|------|-------|
| SUPABASE_URL | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | eyJ... |
| SUPABASE_SERVICE_ROLE_KEY | eyJ... |
| JWT_SECRET | sua-senha-32-chars |

### Deploy

```bash
vercel
vercel --prod
```

## Estrutura

```
studypro/
├── web/              # Next.js (Vercel)
├── api/              # Serverless functions (Vercel)
├── supabase/         # Edge functions + migrations
└── mobile/           # Expo (expo.dev ou EAS)
```

## URLs after deploy

- **Web App**: https://studypro.vercel.app
- **API**: https://studypro.vercel.app/api
- **Supabase Studio**: https://supabase.com/dashboard
- **Docs**: https://studypro.vercel.app/docs