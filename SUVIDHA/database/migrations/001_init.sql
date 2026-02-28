-- ============================================================
-- 001_init.sql  — Core SUVIDHA tables
-- Run this first in Supabase SQL Editor
-- ============================================================

-- Kiosk registry
CREATE TABLE IF NOT EXISTS kiosks (
  id              TEXT PRIMARY KEY,       -- e.g. KIOSK-1
  name            TEXT NOT NULL,
  location        TEXT NOT NULL,
  status          TEXT DEFAULT 'offline', -- online | offline
  last_seen       TIMESTAMPTZ,
  registered_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Master transaction record (every kiosk activity creates one)
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id        TEXT REFERENCES kiosks(id),
  type            TEXT NOT NULL,          -- bill_payment | form | complaint
  status          TEXT DEFAULT 'in_progress', -- in_progress | pending_cash | completed | failed
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- Bill payments
CREATE TABLE IF NOT EXISTS bill_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  bill_type       TEXT NOT NULL,          -- electricity | gas | property_tax | other
  identifier      TEXT NOT NULL,          -- IVRS no / account no / property ID
  identifier_type TEXT NOT NULL,          -- ivrs | account_mobile | property_id | reference
  consumer_name   TEXT,
  amount          NUMERIC(12,2) NOT NULL,
  due_date        DATE,
  bill_period     TEXT,
  payment_method  TEXT,                   -- upi | cash
  upi_txn_id      TEXT,                   -- encrypted at app level
  receipt_no      TEXT,                   -- for cash payments e.g. RCP-20260225-007
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Form applications
CREATE TABLE IF NOT EXISTS form_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  service_type    TEXT NOT NULL,          -- gas_connection | driving_test | property_registry | health_scheme | scholarship | other
  application_id  TEXT UNIQUE,            -- APP-GAS-20260225-003
  applicant_name  TEXT NOT NULL,
  aadhaar_no      TEXT,                   -- stored encrypted
  mobile_no       TEXT NOT NULL,
  form_data       JSONB,                  -- all other fields as JSON
  status          TEXT DEFAULT 'submitted', -- submitted | processing | approved | rejected
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints / Grievances
CREATE TABLE IF NOT EXISTS complaints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  complaint_id    TEXT UNIQUE,            -- GRV-20260225-012
  mobile_no       TEXT NOT NULL,
  department      TEXT NOT NULL,          -- electricity | gas | water | sanitation | roads | ration | other
  description     TEXT NOT NULL,
  input_method    TEXT DEFAULT 'keyboard', -- keyboard | voice
  status          TEXT DEFAULT 'registered', -- registered | in_review | resolved
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Daily receipt counter (resets each working day)
CREATE TABLE IF NOT EXISTS daily_receipt_counter (
  date            DATE PRIMARY KEY,
  counter         INTEGER DEFAULT 0
);

-- Physical payment approvals
CREATE TABLE IF NOT EXISTS physical_payment_approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no      TEXT UNIQUE NOT NULL,
  bill_payment_id UUID REFERENCES bill_payments(id),
  kiosk_id        TEXT,
  status          TEXT DEFAULT 'pending', -- pending | approved | rejected
  admin_note      TEXT,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
