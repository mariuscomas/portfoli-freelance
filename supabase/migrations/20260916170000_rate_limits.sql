-- ============================================================================
-- Rate limit dels formularis públics
--
-- Fins ara l'única defensa era el honeypot i la policy d'insert oberta a anon:
-- qualsevol podia inflar contact_submissions, newsletter_subscribers o quotes.
--
-- Comptador per clau (formulari + IP) i finestra de temps. La taula no
-- l'obre ningú directament: només s'hi arriba per la funció, que és
-- SECURITY DEFINER.
-- ============================================================================

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 0
);

alter table public.rate_limits enable row level security;
-- Sense policies: amb RLS activat i cap policy, ni anon ni authenticated hi
-- accedeixen. La funció de sota hi entra com a definer.

create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  rec public.rate_limits%rowtype;
begin
  select * into rec from public.rate_limits where key = p_key for update;

  if not found then
    -- on conflict: dues peticions alhora amb la mateixa clau arribarien aquí
    -- totes dues i la segona petaria amb unique_violation.
    insert into public.rate_limits (key, window_start, count)
    values (p_key, now(), 1)
    on conflict (key) do update set count = public.rate_limits.count + 1;
    return true;
  end if;

  -- Finestra caducada: comptador nou.
  if rec.window_start < now() - make_interval(secs => p_window_seconds) then
    update public.rate_limits set window_start = now(), count = 1 where key = p_key;
    return true;
  end if;

  if rec.count >= p_limit then
    return false;
  end if;

  update public.rate_limits set count = rec.count + 1 where key = p_key;
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;

-- Per si més endavant volem escombrar les files caducades.
create index if not exists rate_limits_window_start_idx on public.rate_limits (window_start);
