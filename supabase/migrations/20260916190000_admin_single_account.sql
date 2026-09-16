-- ============================================================================
-- Un sol compte admin
--
-- mariuscr23@gmail.com hi era de transició, mentre quedessin sessions obertes
-- del magic link. Comprovat el 16set26: hello@mariusfreelance.com ja entra amb
-- Google (últim accés aquell mateix dia) i el Gmail no entra des del 19 de
-- juny. El login ja no ofereix magic link, i l'app OAuth és interna a
-- l'organització mariusfreelance.com, així que un compte de fora no pot ni
-- començar el flux.
--
-- Ha de coincidir amb ADMIN_EMAILS de src/lib/admin.ts.
--
-- L'usuari mariuscr23@gmail.com es manté a auth.users: treure-li l'accés no
-- demana esborrar-lo, i esborrar-lo no és reversible.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path to 'public'
as $$
  select lower(auth.jwt() ->> 'email') = 'hello@mariusfreelance.com';
$$;
