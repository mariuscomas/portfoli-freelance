-- ============================================================================
-- quotes — cicle de vida comercial (docs/estrategia-negoci.md v1.5 §6)
--
-- El pipeline antic (nou · revisat · proposta · guanyat · perdut) no distingia
-- les dues maneres de no tancar un projecte, que són informació de negoci
-- diferent:
--   · declinada → la decisió és meva (fora de rang, abast difús, timing…)
--   · perduda   → la decisió és del client (preu, un altre proveïdor…)
-- Sense aquesta separació i sense motiu tipificat, un lead perdut no ensenya
-- res i el repricing es fa per intuïció.
--
-- Afegeix també les dates del cicle: sent_at / viewed_at / expires_at. La
-- validesa de 30 dies de les condicions és real — una proposta vençuda es
-- recalcula amb els preus vigents.
-- ============================================================================

-- 1) Vocabulari nou. Les files existents es renombren (no es perd cap dada).
update public.quotes set status = case status
  when 'nou'     then 'rebuda'
  when 'revisat' then 'revisant'
  when 'guanyat' then 'acceptada'
  when 'perdut'  then 'perduda'
  else status
end;

alter table public.quotes alter column status set default 'rebuda';

-- 2) Motiu del desenllaç i dates del cicle.
alter table public.quotes
  add column if not exists outcome_reason text,
  add column if not exists sent_at    timestamptz,
  add column if not exists viewed_at  timestamptz,
  add column if not exists expires_at timestamptz;

comment on column public.quotes.outcome_reason is
  'Motiu tipificat del desenllaç. Obligatori a declinada/perduda, null a la resta.';
comment on column public.quotes.sent_at is 'Quan s''ha enviat la proposta al client.';
comment on column public.quotes.viewed_at is 'Primera obertura de la proposta pel client.';
comment on column public.quotes.expires_at is 'Caducitat (30 dies des de sent_at). Vençuda = es recalcula.';

-- 3) Estats vàlids.
alter table public.quotes drop constraint if exists quotes_status_check;
alter table public.quotes add constraint quotes_status_check check (
  status in (
    'rebuda',      -- ha entrat pel configurador, encara no mirada
    'revisant',    -- l'estic revisant (rellotge de les 48 h laborables)
    'proposta',    -- proposta enviada al client
    'vista',       -- el client l'ha obert
    'negociacio',  -- hi ha contraproposta sobre la taula (una, i tancada)
    'acceptada',   -- tancada a favor
    'declinada',   -- la declino jo
    'perduda',     -- el client no segueix
    'caducada'     -- ha passat la validesa sense resposta
  )
);

-- 4) El motiu ha de correspondre a l'estat: força la disciplina de registrar-lo
--    i evita motius orfes quan una quote torna enrere al pipeline.
--
--    Parany de Postgres: un CHECK només rebutja quan avalua a FALSE, i
--    "null in (...)" dona NULL, no false. Sense els "is not null" explícits,
--    declinar sense motiu passava el filtre — que és exactament el cas que
--    aquesta restricció ha d'impedir.
alter table public.quotes drop constraint if exists quotes_outcome_reason_check;
alter table public.quotes add constraint quotes_outcome_reason_check check (
  (status = 'declinada' and outcome_reason is not null and outcome_reason in
    ('fora_rang', 'abast_difus', 'timing', 'mal_encaix', 'capacitat'))
  or (status = 'perduda' and outcome_reason is not null and outcome_reason in
    ('preu', 'altre_proveidor', 'projecte_aturat', 'sense_resposta'))
  or (status not in ('declinada', 'perduda') and outcome_reason is null)
);

-- 5) Propostes vives que caduquen: consulta freqüent a l'admin.
create index if not exists quotes_expires_at_idx
  on public.quotes (expires_at)
  where status in ('proposta', 'vista', 'negociacio');
