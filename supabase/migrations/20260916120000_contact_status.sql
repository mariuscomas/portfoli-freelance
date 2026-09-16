-- ============================================================================
-- Bústia de leads (/admin/leads)
--
-- La taula `contact_submissions` ja tenia `status` amb CHECK
-- ('new','read','replied','archived') i `is_spam`, però ningú els llegia:
-- no hi havia pantalla. La bústia fa servir tres d'aquests estats —
-- new → replied → archived — i deixa 'read' sense ús: obrir un missatge no
-- és un estat que valgui la pena mantenir a mà.
--
-- Aquesta migració no canvia l'esquema: només afegeix els índexs que la
-- llista necessita (ordre per data i filtre per estat).
-- ============================================================================

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status)
  where is_spam = false;

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);
