-- ============================================================================
-- Proposta pública: token + historial d'esdeveniments
-- (docs/estrategia-negoci.md §6 · disseny a Figma, secció "Proposta")
--
-- El token existeix des del primer moment però NO val res fins que la proposta
-- s'envia (sent_at). Així generar-lo no exposa res i no cal cap pas extra en
-- enviar-la.
-- ============================================================================

alter table public.quotes
  add column if not exists token text not null default gen_random_uuid()::text;

create unique index if not exists quotes_token_key on public.quotes (token);

comment on column public.quotes.token is
  'Token opac per a /proposta/[token]. Només serveix contingut si sent_at no és null.';

create table if not exists public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  type text not null check (type in ('sent', 'viewed', 'accepted', 'declined', 'expired', 'note')),
  created_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists quote_events_quote_id_idx on public.quote_events (quote_id, created_at desc);

comment on table public.quote_events is
  'Historial d''una proposta (enviada, vista, acceptada…). Append-only: no s''edita mai.';

alter table public.quote_events enable row level security;

drop policy if exists "quote_events_admin_read" on public.quote_events;
create policy "quote_events_admin_read"
  on public.quote_events for select
  to authenticated
  using (public.is_admin());

-- L'admin ha de poder registrar 'sent' i notes a mà. Les funcions SECURITY
-- DEFINER escriuen 'viewed' i 'accepted' per la seva banda.
drop policy if exists "quote_events_admin_insert" on public.quote_events;
create policy "quote_events_admin_insert"
  on public.quote_events for insert
  to authenticated
  with check (public.is_admin());
