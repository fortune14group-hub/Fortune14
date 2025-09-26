# Säkerhetspolicy

## Rapporteringsprocess
- Skicka sårbarheter till security@betspread.se
- Inkludera steg för reproduktion och påverkan
- Vi återkopplar inom 48h och tidsplanerar fixar

## Omfång
- Webappen (`betspread.se`)
- Supabase-projektet
- API:er under `api/`

## Åtgärder
- Supabase RLS ska vara aktiverat för alla tabeller
- Rate limiting via Upstash på auth-endpoints
- Sentry för felmonitorering
- Secrets hanteras via Vercel/Supabase/1Password

## Versionsuppdateringar
- Renovate håller beroenden aktuella
- Kritiska säkerhetsuppdateringar patchas inom 24h
