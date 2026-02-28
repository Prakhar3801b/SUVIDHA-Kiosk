-- ============================================================
-- 003_kiosks_diagnostics.sql  — Hardware diagnostics
-- Run after 002_queue.sql
-- ============================================================

-- Machine diagnostics event log (per kiosk hardware events)
CREATE TABLE IF NOT EXISTS machine_diagnostics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id        TEXT REFERENCES kiosks(id),
  device          TEXT NOT NULL,          -- printer | scanner
  event_code      TEXT NOT NULL,          -- PRINTER_OK | PAPER_LOW | PAPER_OUT | PRINTER_JAM | PRINTER_OFFLINE | SCANNER_OK | SCANNER_DISCONNECTED
  severity        TEXT NOT NULL,          -- info | warning | critical
  message         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_kiosk ON machine_diagnostics(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_created ON machine_diagnostics(created_at DESC);

-- ============================================================
-- Govt Mock Server — received data table
-- (Run this on the same Supabase DB but used by govt_mock_server)
-- ============================================================
CREATE TABLE IF NOT EXISTS govt_received_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL,          -- UUID grouping one batch push
  transaction_id  UUID,
  kiosk_id        TEXT,
  type            TEXT,
  payload         JSONB NOT NULL,
  received_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_govt_records_batch ON govt_received_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_govt_records_received ON govt_received_records(received_at DESC);
