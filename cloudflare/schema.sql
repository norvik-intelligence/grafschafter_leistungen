-- Grafschafter OS · D1 schema v1
-- Apply only after access control, backup, and privacy review are in place.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS organizations (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, legal_name TEXT, address TEXT,
 postal_code TEXT, city TEXT, email TEXT, phone TEXT, iban TEXT, bic TEXT,
 tax_number TEXT, settings_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 external_auth_id TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner','admin','office','employee','viewer')),
 active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS customers (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_number TEXT, display_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
 -- Sensitive care/health details must be encrypted by the application before storage.
 private_data_ciphertext TEXT, private_data_nonce TEXT, private_data_key_version TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(organization_id,customer_number)
);
CREATE TABLE IF NOT EXISTS employees (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 user_id TEXT REFERENCES users(id), display_name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
 hourly_cost_cents INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS contracts (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_id TEXT NOT NULL REFERENCES customers(id), status TEXT NOT NULL DEFAULT 'draft',
 starts_on TEXT, ends_on TEXT, hourly_rate_cents INTEGER,
 document_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS visits (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_id TEXT NOT NULL REFERENCES customers(id),
 employee_id TEXT REFERENCES employees(id), starts_at TEXT NOT NULL, ends_at TEXT,
 break_minutes INTEGER NOT NULL DEFAULT 0 CHECK(break_minutes >= 0),
 status TEXT NOT NULL DEFAULT 'planned', service_code TEXT,
 note_ciphertext TEXT, note_nonce TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS timesheets (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_id TEXT NOT NULL REFERENCES customers(id),
 period TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
 approved_by TEXT REFERENCES users(id), approved_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS timesheet_visits (
 timesheet_id TEXT NOT NULL REFERENCES timesheets(id),
 visit_id TEXT NOT NULL REFERENCES visits(id),
 PRIMARY KEY(timesheet_id,visit_id)
);
CREATE TABLE IF NOT EXISTS invoices (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_id TEXT NOT NULL REFERENCES customers(id),
 invoice_number TEXT NOT NULL, period TEXT, status TEXT NOT NULL DEFAULT 'draft',
 amount_cents INTEGER NOT NULL DEFAULT 0, due_on TEXT,
 issued_on TEXT, paid_on TEXT,
 -- Preserve company details as issued; later changes must not rewrite old invoices.
 issuer_snapshot_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(organization_id,invoice_number)
);
CREATE TABLE IF NOT EXISTS documents (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_id TEXT REFERENCES customers(id), object_key TEXT NOT NULL UNIQUE,
 filename TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL,
 document_type TEXT NOT NULL DEFAULT 'other', review_status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tasks (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 customer_id TEXT REFERENCES customers(id), assigned_user_id TEXT REFERENCES users(id),
 title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', due_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS audit_log (
 id TEXT PRIMARY KEY, organization_id TEXT NOT NULL REFERENCES organizations(id),
 actor_user_id TEXT REFERENCES users(id), action TEXT NOT NULL,
 entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_org ON customers(organization_id,status);
CREATE INDEX IF NOT EXISTS idx_visits_org_start ON visits(organization_id,starts_at);
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id,status,due_on);
CREATE INDEX IF NOT EXISTS idx_documents_customer ON documents(organization_id,customer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(organization_id,status,due_at);
CREATE INDEX IF NOT EXISTS idx_audit_org_time ON audit_log(organization_id,occurred_at);
