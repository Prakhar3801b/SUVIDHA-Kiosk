-- ============================================================
-- 002_queue.sql  — Sync queue table
-- Run after 001_init.sql
-- ============================================================

-- Offline sync queue — store-and-forward to govt mock server
CREATE TABLE IF NOT EXISTS sync_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID REFERENCES transactions(id) ON DELETE CASCADE,
  payload         JSONB NOT NULL,         -- serialized transaction data to push
  status          TEXT DEFAULT 'pending', -- pending | syncing | done | failed
  attempt_count   INTEGER DEFAULT 0,
  last_attempt    TIMESTAMPTZ,
  pushed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);
