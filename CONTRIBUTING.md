# Contribuera till BetSpread

## Förutsättningar
- Node.js 18.20.3 (`nvm use` laddar korrekt version)
- pnpm 9 (`corepack enable`)
- Supabase-projekt och Upstash Redis för rate limiting

## Kom igång
```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Backend mocks och seeds finns i `supabase/` och `tests/`.

## Kodstil
- ESLint + Prettier körs automatiskt via `pnpm lint`
- Husky kör `lint-staged` före commit
- Commits följer Conventional Commits (`feat:`, `fix:` osv.)

## Testning
```bash
pnpm test          # Vitest
pnpm test:e2e      # Playwright (kräver `pnpm dev` i annat fönster)
```

## PR-process
1. Skapa branch från `main`
2. Lägg till tester
3. Uppdatera dokumentation vid behov
4. Skicka PR och fyll i testplan
