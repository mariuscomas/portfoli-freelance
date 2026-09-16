-- ============================================================================
-- Accés d'admin: de correu únic a llista
--
-- El login passa de magic link a Google (app OAuth interna a l'organització
-- mariusfreelance.com), i el compte admin passa a ser hello@mariusfreelance.com.
--
-- `is_admin()` és qui aplica les polítiques RLS de totes les taules de
-- l'admin, així que ha de coincidir amb ADMIN_EMAILS de src/lib/admin.ts.
-- Mantenim mariuscr23@gmail.com durant la transició per no tancar la porta a
-- les sessions obertes; es pot treure quan el login amb Google estigui rodat.
-- ============================================================================

create or replace function public.is_admin()
  returns boolean
  language sql
  stable
  set search_path to 'public'
as $function$
  select lower(auth.jwt() ->> 'email') in (
    'hello@mariusfreelance.com',
    'mariuscr23@gmail.com'
  );
$function$;
