-- ============================================================================
-- Porta d'entrada pública a UNA proposta, pel seu token.
--
-- La taula `quotes` segueix tancada (RLS: insert anònim i prou). Aquestes dues
-- funcions SECURITY DEFINER són l'única manera d'arribar-hi des de fora, i
-- només serveixen propostes ja enviades. Així evitem tenir cap service-role key
-- al servidor de l'app: la superfície pública és exactament aquestes dues
-- funcions i cap més.
-- ============================================================================

create or replace function public.get_proposal(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare q public.quotes%rowtype;
begin
  select * into q from public.quotes where token = p_token;
  if not found or q.sent_at is null then
    -- token inexistent i proposta no enviada donen la mateixa resposta: res a endevinar
    return null;
  end if;

  -- Primera obertura: deixa constància i mou l'estat a 'vista'.
  if q.viewed_at is null then
    update public.quotes
       set viewed_at = now(),
           status = case when status = 'proposta' then 'vista' else status end
     where id = q.id;
    insert into public.quote_events (quote_id, type) values (q.id, 'viewed');
    q.viewed_at := now();
    if q.status = 'proposta' then q.status := 'vista'; end if;
  end if;

  return jsonb_build_object(
    'reference', 'P-' || to_char(q.created_at, 'YYYY') || '-' || upper(substr(q.id::text, 1, 4)),
    'product', q.product,
    'name', q.name,
    'summary', q.summary,
    'selection', q.selection,
    'pricing', q.pricing,
    'total_eur', q.total_eur,
    'rate_label', q.rate_label,
    'pricing_version', q.pricing_version,
    'status', q.status,
    'sent_at', q.sent_at,
    'expires_at', q.expires_at,
    'is_expired', (q.expires_at is not null and q.expires_at < now()),
    'is_closed', q.status in ('acceptada', 'declinada', 'perduda')
  );
end $$;

-- Acceptació. La caducitat es valida AQUÍ, no al client: una proposta vençuda
-- no es pot acceptar encara que algú s'hagi guardat l'enllaç.
create or replace function public.accept_proposal(p_token text, p_signer text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare q public.quotes%rowtype;
begin
  select * into q from public.quotes where token = p_token for update;
  if not found or q.sent_at is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if q.status = 'acceptada' then
    return jsonb_build_object('ok', true, 'reason', 'already_accepted');
  end if;
  if q.status not in ('proposta', 'vista', 'negociacio') then
    return jsonb_build_object('ok', false, 'reason', 'closed');
  end if;
  if q.expires_at is not null and q.expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;

  update public.quotes set status = 'acceptada', outcome_reason = null where id = q.id;
  insert into public.quote_events (quote_id, type, meta)
  values (q.id, 'accepted', jsonb_build_object('signer', p_signer, 'total_eur', q.total_eur));

  return jsonb_build_object('ok', true, 'reason', 'accepted');
end $$;

revoke all on function public.get_proposal(text) from public;
revoke all on function public.accept_proposal(text, text) from public;
grant execute on function public.get_proposal(text) to anon, authenticated;
grant execute on function public.accept_proposal(text, text) to anon, authenticated;
