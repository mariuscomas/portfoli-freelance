-- ============================================================================
-- Rate limit: els llindars viuen a la funció, no als paràmetres
--
-- La primera versió rebia p_limit i p_window_seconds del client. Com que
-- l'RPC és cridable per anon, qualsevol podia cridar-la amb
-- p_window_seconds = 1 i fer caducar el seu propi comptador a voluntat: el
-- límit no limitava res. Ara la funció només rep el formulari i la IP, i els
-- llindars els decideix ella.
-- ============================================================================

drop function if exists public.check_rate_limit(text, integer, integer);

create or replace function public.check_rate_limit(
  p_kind text,
  p_ip text
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_limit integer;
  v_window integer;
  v_key text;
  rec public.rate_limits%rowtype;
begin
  -- Escriure tres cops seguits és plausible; deu en una hora, no.
  case p_kind
    when 'contacte' then v_limit := 5; v_window := 3600;
    when 'newsletter' then v_limit := 3; v_window := 3600;
    when 'quote' then v_limit := 5; v_window := 3600;
    else return true; -- kind desconegut: no és feina d'aquesta funció bloquejar
  end case;

  if p_ip is null or length(p_ip) = 0 or length(p_ip) > 64 then
    return true;
  end if;

  v_key := p_kind || ':' || p_ip;

  select * into rec from public.rate_limits where key = v_key for update;

  if not found then
    -- on conflict: dues peticions alhora amb la mateixa clau arribarien aquí
    -- totes dues i la segona petaria amb unique_violation.
    insert into public.rate_limits (key, window_start, count)
    values (v_key, now(), 1)
    on conflict (key) do update set count = public.rate_limits.count + 1;
    return true;
  end if;

  -- Finestra caducada: comptador nou.
  if rec.window_start < now() - make_interval(secs => v_window) then
    update public.rate_limits set window_start = now(), count = 1 where key = v_key;
    return true;
  end if;

  if rec.count >= v_limit then
    return false;
  end if;

  update public.rate_limits set count = rec.count + 1 where key = v_key;
  return true;
end;
$$;

grant execute on function public.check_rate_limit(text, text) to anon, authenticated;
