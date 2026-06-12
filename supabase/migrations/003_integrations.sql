-- Integrations table (push tokens, external IDs)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('expo_push', 'telegram', 'revenuecat')),
  token TEXT,
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, type)
);

CREATE INDEX idx_integrations_user ON integrations(user_id);
CREATE INDEX idx_integrations_type ON integrations(type);

-- RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations"
  ON integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add imported_transaction_id to expenses if not exists
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS imported_transaction_id UUID REFERENCES imported_transactions(id) ON DELETE SET NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS categorized_by TEXT DEFAULT 'manual';

-- Add is_imported to imported_transactions
ALTER TABLE imported_transactions ADD COLUMN IF NOT EXISTS is_imported BOOLEAN DEFAULT false;
ALTER TABLE imported_transactions ADD COLUMN IF NOT EXISTS is_expense BOOLEAN DEFAULT true;

-- Index for statement preview query
CREATE INDEX IF NOT EXISTS idx_imported_is_expense ON imported_transactions(statement_id, is_expense);

-- Add link_token to telegram_accounts
ALTER TABLE telegram_accounts ADD COLUMN IF NOT EXISTS link_token TEXT;
