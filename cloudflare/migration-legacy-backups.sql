-- Encrypted, client-side AES-GCM vault backups only. Never plaintext customer records.
CREATE TABLE IF NOT EXISTS encrypted_vault_backups (
 organization_id TEXT PRIMARY KEY REFERENCES organizations(id),
 payload TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
