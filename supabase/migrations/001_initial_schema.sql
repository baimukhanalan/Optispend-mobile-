-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ─── Enums ────────────────────────────────────────────────────────────────────
create type subscription_plan as enum ('free', 'plus', 'family', 'premium');
create type expense_category as enum (
  'food_delivery', 'groceries', 'transport', 'taxi', 'entertainment',
  'subscriptions', 'cafe_restaurants', 'health', 'education', 'shopping',
  'utilities', 'housing', 'debt_payment', 'savings', 'family', 'other'
);
create type kazakhstan_bank as enum ('kaspi', 'halyk', 'forte', 'jusan', 'freedom', 'other');
create type leak_severity as enum ('critical', 'high', 'medium', 'low');
create type goal_category as enum (
  'emergency_fund', 'vacation', 'real_estate', 'education', 'car', 'business', 'retirement', 'other'
);
create type ocr_status as enum ('pending', 'processing', 'completed', 'failed');
create type parse_status as enum ('pending', 'processing', 'completed', 'failed');
create type expense_source as enum ('manual', 'receipt', 'statement', 'telegram');
create type notification_type as enum (
  'daily_limit_exceeded', 'weekly_limit_exceeded', 'large_leak_detected',
  'weekly_report_ready', 'upload_statement_reminder', 'goal_at_risk', 'goal_achieved'
);

-- ─── Users ────────────────────────────────────────────────────────────────────
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text not null,
  avatar_url text,
  subscription_plan subscription_plan not null default 'free',
  subscription_status text not null default 'trial',
  trial_ends_at timestamptz default now() + interval '14 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger update_users_updated_at
  before update on public.users
  for each row execute function moddatetime(updated_at);

-- ─── Families ─────────────────────────────────────────────────────────────────
create table public.families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  monthly_limit numeric(12, 2),
  can_see_all boolean not null default false,
  joined_at timestamptz not null default now(),
  unique(family_id, user_id)
);

-- ─── Financial Profiles ───────────────────────────────────────────────────────
create table public.financial_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  monthly_income numeric(12, 2) not null default 0,
  currency text not null default '₸',
  income_sources jsonb not null default '[]',
  monthly_fixed_expenses numeric(12, 2) not null default 0,
  total_debt numeric(12, 2) not null default 0,
  has_emergency_fund boolean not null default false,
  emergency_fund_months numeric(4, 1) not null default 0,
  risk_tolerance text not null default 'moderate' check (risk_tolerance in ('conservative', 'moderate', 'aggressive')),
  financial_goals text[] not null default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Expenses ─────────────────────────────────────────────────────────────────
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default '₸',
  category expense_category not null,
  subcategory text,
  merchant_name text,
  description text,
  date timestamptz not null,
  source expense_source not null default 'manual',
  receipt_id uuid,
  statement_id uuid,
  is_recurring boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_expenses_user_date on public.expenses(user_id, date desc);
create index idx_expenses_category on public.expenses(user_id, category);
create index idx_expenses_family on public.expenses(family_id) where family_id is not null;

-- ─── Receipts ─────────────────────────────────────────────────────────────────
create table public.receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  ocr_status ocr_status not null default 'pending',
  merchant_name text,
  date timestamptz,
  total_amount numeric(12, 2),
  items jsonb not null default '[]',
  raw_ocr_text text,
  ai_category expense_category,
  confirmed boolean not null default false,
  expense_id uuid references public.expenses(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now()
);

create index idx_receipts_user on public.receipts(user_id, created_at desc);
create index idx_receipts_status on public.receipts(ocr_status) where ocr_status != 'completed';

-- ─── Statements ───────────────────────────────────────────────────────────────
create table public.statements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  bank kazakhstan_bank not null,
  storage_path text not null,
  file_type text not null check (file_type in ('pdf', 'csv', 'xlsx', 'image')),
  parse_status parse_status not null default 'pending',
  period_start timestamptz,
  period_end timestamptz,
  total_transactions integer,
  confirmed_transactions integer default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.imported_transactions (
  id uuid primary key default uuid_generate_v4(),
  statement_id uuid not null references public.statements(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric(12, 2) not null,
  description text,
  merchant_name text,
  date timestamptz not null,
  ai_category expense_category,
  confirmed boolean not null default false,
  expense_id uuid references public.expenses(id) on delete set null,
  raw_row jsonb,
  created_at timestamptz not null default now()
);

-- ─── Goals ────────────────────────────────────────────────────────────────────
create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete set null,
  name text not null,
  description text,
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0,
  target_date timestamptz,
  category goal_category not null default 'other',
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'cancelled')),
  monthly_contribution numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Budgets ──────────────────────────────────────────────────────────────────
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  family_id uuid references public.families(id) on delete set null,
  category expense_category not null,
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  period text not null default 'monthly' check (period in ('daily', 'weekly', 'monthly')),
  spent_amount numeric(12, 2) not null default 0,
  alert_at_percent integer not null default 80 check (alert_at_percent between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(user_id, category, period)
);

-- ─── Financial Leaks ──────────────────────────────────────────────────────────
create table public.financial_leaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  category expense_category not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  total_amount numeric(12, 2) not null,
  transaction_count integer not null,
  severity leak_severity not null,
  estimated_savings numeric(12, 2) not null,
  recommendation text not null,
  reason text not null,
  status text not null default 'detected' check (status in ('detected', 'acknowledged', 'resolved')),
  created_at timestamptz not null default now()
);

-- ─── AI Reports ───────────────────────────────────────────────────────────────
create table public.daily_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  date date not null,
  income_today numeric(12, 2) not null default 0,
  spent_today numeric(12, 2) not null default 0,
  safe_to_spend numeric(12, 2) not null,
  risk_level text not null check (risk_level in ('safe', 'warning', 'critical')),
  top_expense_category expense_category,
  ai_tip text not null,
  created_at timestamptz not null default now(),
  unique(user_id, date)
);

create table public.weekly_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  total_income numeric(12, 2) not null,
  total_expenses numeric(12, 2) not null,
  savings_amount numeric(12, 2) not null,
  savings_rate numeric(5, 2) not null,
  top_categories jsonb not null default '[]',
  top_merchants jsonb not null default '[]',
  main_leak_id uuid references public.financial_leaks(id),
  limits_exceeded jsonb not null default '[]',
  vs_previous_week numeric(12, 2),
  reduction_plan jsonb not null default '[]',
  ai_summary text not null,
  pdf_url text,
  email_sent boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create table public.monthly_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  month date not null,
  total_income numeric(12, 2) not null,
  total_expenses numeric(12, 2) not null,
  savings_rate numeric(5, 2) not null,
  debt_load numeric(5, 2) not null,
  emergency_fund_progress numeric(5, 2) not null,
  category_breakdown jsonb not null default '[]',
  recurring_payments jsonb not null default '[]',
  subscriptions jsonb not null default '[]',
  impulse_spending numeric(12, 2) not null default 0,
  biggest_leaks jsonb not null default '[]',
  ai_action_plan jsonb not null default '[]',
  pdf_url text,
  created_at timestamptz not null default now(),
  unique(user_id, month)
);

create table public.ai_recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  main_conclusion text not null,
  top_leaks jsonb not null default '[]',
  what_to_cut_this_week text not null,
  safe_to_save numeric(12, 2) not null,
  debt_advice text not null,
  can_invest boolean not null default false,
  investment_advice text,
  forbidden_actions jsonb not null default '[]',
  disclaimer text not null default 'Не является финансовой консультацией. Только для информационных целей.',
  generated_at timestamptz not null default now()
);

-- ─── Subscriptions ────────────────────────────────────────────────────────────
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  plan subscription_plan not null default 'free',
  status text not null default 'trial' check (status in ('active', 'cancelled', 'expired', 'trial')),
  revenuecat_id text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default now() + interval '14 days',
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Notifications ────────────────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  data jsonb,
  read boolean not null default false,
  sent_at timestamptz not null default now()
);

create index idx_notifications_user on public.notifications(user_id, sent_at desc);

-- ─── Telegram ─────────────────────────────────────────────────────────────────
create table public.telegram_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  telegram_id bigint not null unique,
  telegram_username text,
  linked_at timestamptz not null default now()
);

-- ─── Logs ─────────────────────────────────────────────────────────────────────
create table public.ocr_logs (
  id uuid primary key default uuid_generate_v4(),
  receipt_id uuid references public.receipts(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  provider text not null,
  status text not null,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.ai_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  function_name text not null,
  model text not null,
  prompt_tokens integer,
  completion_tokens integer,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid references public.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ─── Export Reports ───────────────────────────────────────────────────────────
create table public.report_exports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  report_type text not null check (report_type in ('weekly', 'monthly', 'family', 'debt')),
  report_id uuid not null,
  format text not null check (format in ('pdf', 'csv', 'xlsx')),
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

-- ─── Triggers: auto-create profile and subscription on signup ─────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.financial_profiles (user_id)
  values (new.id);

  insert into public.subscriptions (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
