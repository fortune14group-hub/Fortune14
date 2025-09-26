# Deploy-guide

## Förberedelser
1. Sätt secrets i Vercel:
   - SUPABASE_URL, SUPABASE_SERVICE_ROLE, SUPABASE_JWT_SECRET
   - NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
   - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID, STRIPE_RETURN_URL_BASE
   - EMAIL_FROM, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE
   - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
   - SENTRY_DSN, SENTRY_ENVIRONMENT (valfritt)
   - VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN för GitHub Actions
2. Kör `pnpm install`
3. Kör `pnpm lint && pnpm typecheck && pnpm test`

## Deploy till Vercel
- Merge till `main` triggar CI + Vercel-prod
- PR triggar preview-deploy (se `.github/workflows/preview-deploy.yml`)

## Miljöer
- `development`: lokal, `.env.local`
- `preview`: automatiska Vercel-previews
- `production`: Vercel main-projekt

## Rollback
- Använd Vercel "Deployments" -> Promote tidigare deployment
- Återställ secrets om de ändrats
- Kör `pnpm prisma migrate reset` (om schema ändrats och du behöver återställa lokalt)
