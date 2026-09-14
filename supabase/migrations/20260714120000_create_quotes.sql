-- ============================================================================
-- quotes — configuracions enviades des dels configuradors (web/landing/
-- auditoria/col·laboració). Cada fila és una INSTÀNCIA: què va demanar un
-- visitant, amb un SNAPSHOT del preu en el moment d'enviar-la.
--
-- Principi: el CATÀLEG de preus viu al codi (src/lib/pricing.ts, amb tests);
-- aquí només hi ha instàncies + snapshot. Si es repricia, les propostes
-- antigues NO canvien perquè el total ja està congelat a la fila.
--
-- Graf: clients → quotes (què demanen) → works (què s'entrega) → client_notes.
-- Fonament del pipeline a l'admin i, més endavant, de l'espai per client.
-- ============================================================================

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Quin configurador l'ha generat
  product text not null
    check (product in ('web', 'landing', 'auditoria', 'collaboracio')),

  -- Selecció crua de l'usuari (rol/focus/talla/extres/modalitat/parcial/urgència…).
  -- jsonb perquè cada producte té una forma diferent i el model pot evolucionar.
  selection jsonb not null default '{}'::jsonb,

  -- Snapshot del càlcul (base, línies d'extres, total, tarifa, equivalent,
  -- modificadors…) tal com el va retornar pricing.ts en enviar.
  pricing jsonb not null default '{}'::jsonb,

  -- Camps "aplanats" del snapshot per ordenar/filtrar ràpid a l'admin:
  total_eur integer,       -- projectes (web/landing/auditoria). NULL a col·laboració.
  rate_label text,         -- col·laboració ("38 €/h" o "30–32 €/h"). NULL a projectes.
  pricing_version text,    -- versió del model de preus que ho va calcular (p. ex. 'v1.4')

  summary text,            -- resum llegible (el mateix que s'annexa a l'email)
  status text not null default 'nou',  -- nou · revisat · proposta · guanyat · perdut

  -- Enllaços: al lead que va crear i (si s'associa) al client del CRM.
  contact_submission_id uuid references public.contact_submissions(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null
);

comment on table public.quotes is
  'Configuracions enviades des dels configuradors, amb snapshot de preu. Catàleg a codi (pricing.ts); aquí instàncies.';

-- Índexs per a les vistes d'admin (pipeline per estat, per client, cronològic).
create index if not exists quotes_created_at_idx on public.quotes (created_at desc);
create index if not exists quotes_status_idx on public.quotes (status);
create index if not exists quotes_client_id_idx on public.quotes (client_id);
create index if not exists quotes_contact_submission_id_idx on public.quotes (contact_submission_id);

-- updated_at automàtic
create or replace function public.quotes_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.quotes_set_updated_at();

-- ============================================================================
-- RLS: mateix patró que contact_submissions —
--   · qualsevol pot INSERIR (el configurador públic envia la seva quote)
--   · només l'admin pot LLEGIR / EDITAR / ESBORRAR
-- ============================================================================
alter table public.quotes enable row level security;

drop policy if exists "quotes_insert_public" on public.quotes;
create policy "quotes_insert_public"
  on public.quotes for insert
  to anon, authenticated
  with check (true);

drop policy if exists "quotes_admin_all" on public.quotes;
create policy "quotes_admin_all"
  on public.quotes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
