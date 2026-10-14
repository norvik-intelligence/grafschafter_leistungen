-- Additive migration for the existing grafschafter-os D1 database.
-- No customer data or existing tables are removed.
CREATE TABLE IF NOT EXISTS company_settings (
 organization_id TEXT PRIMARY KEY REFERENCES organizations(id),
 company_name TEXT NOT NULL DEFAULT 'Grafschafter Alltagsservice',
 owner_name TEXT, address TEXT, ik_number TEXT, tax_number TEXT,
 bank_name TEXT, iban TEXT, bic TEXT, logo_url TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS budget_45b_lots (
 id TEXT PRIMARY KEY,
 organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_id TEXT NOT NULL REFERENCES customers(id),
 allowance_year INTEGER NOT NULL,
 allowance_month INTEGER NOT NULL CHECK(allowance_month BETWEEN 1 AND 12),
 amount_cents INTEGER NOT NULL DEFAULT 13100 CHECK(amount_cents >= 0),
 used_cents INTEGER NOT NULL DEFAULT 0 CHECK(used_cents >= 0 AND used_cents <= amount_cents),
 expiry_date TEXT NOT NULL,
 verified_by TEXT REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(customer_id,allowance_year,allowance_month)
);
CREATE INDEX IF NOT EXISTS idx_budget_45b_customer_expiry ON budget_45b_lots(organization_id,customer_id,expiry_date);
