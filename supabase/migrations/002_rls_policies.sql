-- ─── Row Level Security — enable on all tables ────────────────────────────────
alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.financial_profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.receipts enable row level security;
alter table public.statements enable row level security;
alter table public.imported_transactions enable row level security;
alter table public.goals enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_leaks enable row level security;
alter table public.daily_snapshots enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.monthly_reports enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.telegram_accounts enable row level security;
alter table public.ocr_logs enable row level security;
alter table public.ai_logs enable row level security;
alter table public.report_exports enable row level security;

-- ─── Helper: is_admin ─────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select raw_user_meta_data->>'role' = 'admin'
     from auth.users where id = auth.uid()),
    false
  );
$$;

-- ─── Helper: family_member_user_ids ──────────────────────────────────────────
create or replace function public.get_family_ids()
returns uuid[] language sql security definer as $$
  select array_agg(family_id) from public.family_members where user_id = auth.uid();
$$;

-- ─── Users ────────────────────────────────────────────────────────────────────
create policy "users: read own" on public.users
  for select using (id = auth.uid() or is_admin());

create policy "users: update own" on public.users
  for update using (id = auth.uid());

-- ─── Financial Profiles ───────────────────────────────────────────────────────
create policy "profiles: read own" on public.financial_profiles
  for select using (user_id = auth.uid());

create policy "profiles: insert own" on public.financial_profiles
  for insert with check (user_id = auth.uid());

create policy "profiles: update own" on public.financial_profiles
  for update using (user_id = auth.uid());

-- ─── Expenses ─────────────────────────────────────────────────────────────────
create policy "expenses: read own or family" on public.expenses
  for select using (
    user_id = auth.uid()
    or family_id = any(get_family_ids())
  );

create policy "expenses: insert own" on public.expenses
  for insert with check (user_id = auth.uid());

create policy "expenses: update own" on public.expenses
  for update using (user_id = auth.uid());

create policy "expenses: delete own" on public.expenses
  for delete using (user_id = auth.uid());

-- ─── Receipts ─────────────────────────────────────────────────────────────────
create policy "receipts: read own" on public.receipts
  for select using (user_id = auth.uid() or is_admin());

create policy "receipts: insert own" on public.receipts
  for insert with check (user_id = auth.uid());

create policy "receipts: update own" on public.receipts
  for update using (user_id = auth.uid());

-- ─── Statements ───────────────────────────────────────────────────────────────
create policy "statements: read own" on public.statements
  for select using (user_id = auth.uid() or is_admin());

create policy "statements: insert own" on public.statements
  for insert with check (user_id = auth.uid());

-- ─── Imported Transactions ───────────────────────────────────────────────────
create policy "imported: read own" on public.imported_transactions
  for select using (user_id = auth.uid());

create policy "imported: insert own" on public.imported_transactions
  for insert with check (user_id = auth.uid());

create policy "imported: update own" on public.imported_transactions
  for update using (user_id = auth.uid());

-- ─── Goals ────────────────────────────────────────────────────────────────────
create policy "goals: read own or family" on public.goals
  for select using (
    user_id = auth.uid()
    or family_id = any(get_family_ids())
  );

create policy "goals: insert own" on public.goals
  for insert with check (user_id = auth.uid());

create policy "goals: update own" on public.goals
  for update using (user_id = auth.uid());

create policy "goals: delete own" on public.goals
  for delete using (user_id = auth.uid());

-- ─── Budgets ──────────────────────────────────────────────────────────────────
create policy "budgets: read own" on public.budgets
  for select using (user_id = auth.uid());

create policy "budgets: insert own" on public.budgets
  for insert with check (user_id = auth.uid());

create policy "budgets: update own" on public.budgets
  for update using (user_id = auth.uid());

create policy "budgets: delete own" on public.budgets
  for delete using (user_id = auth.uid());

-- ─── Financial Leaks ─────────────────────────────────────────────────────────
create policy "leaks: read own" on public.financial_leaks
  for select using (user_id = auth.uid());

create policy "leaks: update own" on public.financial_leaks
  for update using (user_id = auth.uid());

-- ─── Reports ──────────────────────────────────────────────────────────────────
create policy "snapshots: read own" on public.daily_snapshots
  for select using (user_id = auth.uid());

create policy "weekly: read own" on public.weekly_reports
  for select using (user_id = auth.uid());

create policy "monthly: read own" on public.monthly_reports
  for select using (user_id = auth.uid());

create policy "ai_rec: read own" on public.ai_recommendations
  for select using (user_id = auth.uid());

-- ─── Subscriptions ────────────────────────────────────────────────────────────
create policy "subs: read own" on public.subscriptions
  for select using (user_id = auth.uid() or is_admin());

-- ─── Notifications ────────────────────────────────────────────────────────────
create policy "notifs: read own" on public.notifications
  for select using (user_id = auth.uid());

create policy "notifs: update own" on public.notifications
  for update using (user_id = auth.uid());

-- ─── Telegram ─────────────────────────────────────────────────────────────────
create policy "telegram: read own" on public.telegram_accounts
  for select using (user_id = auth.uid());

create policy "telegram: insert own" on public.telegram_accounts
  for insert with check (user_id = auth.uid());

-- ─── Logs (read-only for admin) ───────────────────────────────────────────────
create policy "ocr_logs: admin read" on public.ocr_logs
  for select using (is_admin() or user_id = auth.uid());

create policy "ai_logs: admin read" on public.ai_logs
  for select using (is_admin() or user_id = auth.uid());

-- ─── Families ─────────────────────────────────────────────────────────────────
create policy "families: read member" on public.families
  for select using (
    owner_id = auth.uid()
    or id = any(get_family_ids())
  );

create policy "families: insert own" on public.families
  for insert with check (owner_id = auth.uid());

create policy "families: update owner" on public.families
  for update using (owner_id = auth.uid());

create policy "family_members: read" on public.family_members
  for select using (
    user_id = auth.uid()
    or family_id in (select id from public.families where owner_id = auth.uid())
  );

create policy "family_members: insert owner" on public.family_members
  for insert with check (
    family_id in (select id from public.families where owner_id = auth.uid())
  );

create policy "family_members: delete owner" on public.family_members
  for delete using (
    family_id in (select id from public.families where owner_id = auth.uid())
  );

-- ─── Storage buckets ──────────────────────────────────────────────────────────
-- Run in Supabase dashboard Storage section:
-- Buckets: receipts (private), statements (private), reports (private), avatars (public)
-- Policies: user can only access their own folder paths
