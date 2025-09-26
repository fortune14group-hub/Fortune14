# Arkitekturöversikt

## Frontend
- Next.js App Router med segmenten `(marketing)`, `(auth)` och `(app)`.
- React Server Components för marknads- och appvy, klientkomponenter där interaktivitet krävs.
- Tailwind-konfiguration för komponentbibliotek + befintliga CSS-moduler.
- React Hook Form planeras för formulär (nuvarande implementering är kontrollerade inputs).
- next-intl för framtida i18n.

## Backend
- Supabase används för auth och Postgres/RLS.
- Server actions/API routes gör validering via Zod.
- Upstash Redis + `@upstash/ratelimit` skyddar auth-endpoints.
- Stripe-webhooks ligger kvar under `pages/api/` tills de flyttas till App Router.

## Observability
- Sentry (`sentry.*.config.ts`) aktiveras via miljövariabel.
- Vercel Analytics och Speed Insights aktiveras i `app/layout.tsx`.

## DevOps
- pnpm 9 som standard, node 18.20.3 (se `.nvmrc`).
- CI kör lint, typecheck, vitest, build.
- Preview-deploy via Vercel GitHub Action.
- Renovate uppdaterar beroenden veckovis.

## Struktur
```
app/
  (marketing)/
  (auth)/
  (app)/
components/
lib/
src/
  config/ (env)
  emails/
  server/
```
