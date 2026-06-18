-- ─── AI Chat ─────────────────────────────────────────────────────────────────
create table public.ai_chat_sessions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_chat_sessions_user on public.ai_chat_sessions(user_id, updated_at desc);

create table public.ai_chat_messages (
  id         uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.ai_chat_sessions(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index idx_ai_chat_messages_session on public.ai_chat_messages(session_id, created_at asc);
create index idx_ai_chat_messages_user    on public.ai_chat_messages(user_id, created_at desc);

-- RLS
alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;

create policy "users manage own chat sessions"
  on public.ai_chat_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users manage own chat messages"
  on public.ai_chat_messages for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
