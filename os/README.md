# Grafschafter OS – protected Next.js MVP

This app lives in the `os/` subdirectory so the existing static production app remains unchanged.

## Status
- Next.js App Router + TypeScript + Tailwind + Lucide.
- Server-only Cloudflare D1 REST client.
- Cloudflare Access JWT validation via JWKS; fails closed if not configured.
- AES-256-GCM encryption of customer details; customer display names remain plaintext for searching and must be protected by access controls.
- Organization-scoped customer API and §45b budget read-only overview.
- No automatic 45a/39/private budget booking and no document upload yet.

## Required before testing with real data
1. Create a Cloudflare Access application protecting the **entire** Next.js deployment and API routes. Configure `CF_ACCESS_TEAM_DOMAIN` and `CF_ACCESS_AUD`. Access must protect requests before they reach the app; the API independently validates signed Access JWTs.
2. Provision an owner identity **server-side** into `organizations` and `users`, using the verified Cloudflare Access JWT `sub` as `external_auth_id`. No public registration or bootstrap endpoint exists.
3. Add server-side secrets from `.env.example` to a **separate Vercel project** with Root Directory `os`. Do not use the short-lived setup token as a permanent runtime secret. Do not expose tokens through `NEXT_PUBLIC_`.
4. Run `cloudflare/migration-002.sql` on the existing D1 database and verify tables.
5. Test authorization denial, org isolation, encrypted storage, restore, and backups before processing any personal or health data.

## Business rules
§45b monthly allowance 131 EUR (2025 onward) is represented as integer cents; historical and expired lots are excluded from the current-balance display. The yearly rollover and June 30 expiry require verified eligibility and claims; balances are **not** automatically credited. §39 annual amount of 1612 EUR in the initial request is outdated for 2026 and deliberately not hardcoded. Human approval is required for claims and billing.

## Deployment
From repository, create a separate Vercel project with Root Directory `os`. Configure a protected preview first. The existing `grafschafter-leistungen-app` project must not be switched to this folder until verified migration and acceptance tests.
