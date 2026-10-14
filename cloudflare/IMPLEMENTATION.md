# Grafschafter OS – Cloud foundation (work in progress)

This branch is intentionally **not production-deployed**. The existing IndexedDB AES-GCM customer vault and invoice workflows must remain untouched until a tested migration is available.

## Existing Cloudflare resources
- D1: `grafschafter-os`
- Private R2 bucket: `grafschafter-dokumente`

## Implementation order
1. Establish verified server-side authentication, role-based authorization and tenant scoping on every API request. Never trust organization IDs from the browser.
2. Add Cloudflare account/database IDs through server-side environment configuration; use a separate narrowly scoped runtime token, not the temporary setup token.
3. Review data processing agreements, data residency, retention, encrypted backups, incident handling and handling of special-category care data.
4. Apply `cloudflare/schema.sql` to a staging D1 database, test migrations and foreign-key integrity, then schedule production migration with backup.
5. Implement server-side CRUD endpoints and private R2 upload/download with access checks, content validation and size limits.
6. Implement document extraction with opt-in, provider/data-processing review, explicit user correction and approval; never auto-issue invoices.
7. Build customer, employee, visits, documents, timesheets, billing and dashboard UI.
8. Offer explicit encrypted vault export/migration with preview, rollback and duplicate detection. Never silently upload browser data.
9. Verify security tests, deployment preview and real-user acceptance before production rollout.

## Important
D1 and R2 permissions in a Vercel environment variable do **not** automatically connect either service. A Cloudflare API token with D1/R2 write access must never be shipped to browser code. Avoid using the 7-day setup token as a runtime dependency. Sensitive care/health data requires appropriate application-layer protection and access controls. SQL column placeholders do not constitute encryption.
