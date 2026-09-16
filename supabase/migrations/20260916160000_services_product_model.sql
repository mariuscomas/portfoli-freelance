-- Model nou de serveis (16set26): la taula porta el COPY, pricing.ts porta el PREU.
-- La junta entre els dos és product_id, que diu quin producte de pricing.ts
-- calcula el "des de" d'aquesta fila. Cap import de preu no viu aquí.
--
-- Migració additiva: no s'esborra cap columna del model de juny 2026. Les que
-- el model nou no fa servir queden nullable i marcades amb comment.

alter table public.services
  add column if not exists product_id  text,
  add column if not exists price_label jsonb,
  add column if not exists includes    jsonb,
  add column if not exists cta         jsonb;

-- La card del model nou no porta icona.
alter table public.services alter column icon_name drop not null;

alter table public.services drop constraint if exists services_product_id_check;
alter table public.services add constraint services_product_id_check
  check (product_id is null or product_id in ('web', 'landing', 'auditoria'));

-- Un sol registre per producte (unique index: admet múltiples NULL).
create unique index if not exists services_product_id_key
  on public.services (product_id);

comment on column public.services.product_id is
  'Junta amb pricing.ts (ProductId): web | landing | auditoria. El preu NO viu aquí, el calcula el codi.';
comment on column public.services.price_label is
  'i18n. Etiqueta sobre el preu de la card ("DES DE").';
comment on column public.services.includes is
  'i18n. Línies del "què inclou": [{ca,en,es}, ...]. flattenI18n el deixa en string[].';
comment on column public.services.cta is
  'i18n. Text de l''enllaç de la card ("Mira el detall").';

comment on column public.services.price_starts_at is
  'SENSE ÚS des del model nou (16set26): el preu el calcula pricing.ts.';
comment on column public.services.duration is 'SENSE ÚS des del model nou (16set26).';
comment on column public.services.revisions is 'SENSE ÚS des del model nou (16set26).';
comment on column public.services.content_why_us is 'SENSE ÚS des del model nou (16set26).';
comment on column public.services.payment_milestones is 'SENSE ÚS des del model nou (16set26).';
comment on column public.services.image_url is 'SENSE ÚS des del model nou (16set26).';
