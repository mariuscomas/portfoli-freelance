-- Grants explícits de Data API per a les taules creades en migracions.
--
-- Des del 30/10/2026 Supabase deixa d'atorgar automàticament accés de Data API
-- a les taules noves de l'esquema public. Les taules que ja existeixen conserven
-- els seus grants, així que això NO canvia res a producció: és per a projectes
-- nous, preview branches i `supabase db reset`, on sense aquests grants les
-- taules quedarien inabastables via PostgREST.
--
-- Els permisos segueixen les policies de RLS ja definides, no el snippet genèric
-- del correu de Supabase: `anon` només pot inserir quotes, mai llegir-les.
-- La lectura pública de propostes passa per get_proposal() (SECURITY DEFINER).

-- quotes: el formulari públic hi insereix; l'admin (authenticated + is_admin) hi fa tot.
grant insert on public.quotes to anon;
grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.quotes to service_role;

-- quote_events: només l'admin hi llegeix i hi escriu.
grant select, insert on public.quote_events to authenticated;
grant select, insert, update, delete on public.quote_events to service_role;

-- rate_limits: intencionadament SENSE grants a anon ni authenticated.
-- Té RLS activat i cap policy; l'únic camí és check_rate_limit() (SECURITY
-- DEFINER), que ja té el seu grant execute. Donar-hi accés directe obriria el
-- comptador a manipulació des del client.
grant select, insert, update, delete on public.rate_limits to service_role;
