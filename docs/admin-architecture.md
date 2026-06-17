# Arquitectura del Dashboard `/admin`

> Document de referència per entendre com funciona el dashboard d'administració del portfolio. Pensat per quan tornis al projecte en una sessió futura i vulguis fer millores sense haver de redescobrir el sistema des de zero.
>
> **Última actualització**: maig 2026
> **Stack**: Next.js 16 (App Router) · React 19 · Supabase (Postgres + Auth) · TypeScript · Tailwind v4

---

## 1. Visió general en 30 segons

El dashboard viu sota `/admin/*` i serveix per **fer CRUD de Works i Services** sense tocar codi. La idea:

```
Marius edita un work al /admin → es desa a Supabase → /works i /works/[slug] mostren els canvis automàticament
```

**Característiques clau:**
- **Magic link auth** (passwordless via Supabase Auth)
- **Single-user**: només `mariuscr23@gmail.com` pot entrar
- **Defensa en profunditat**: middleware + Server Component check + RLS al Postgres
- **i18n-ready**: tots els camps de text accepten `{ca, en, es}` (avui només es renderitza `ca`, però l'estructura ja existeix)
- **Editor estructurat** per al case study (no JSON cru)

---

## 2. Mapa de fitxers

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              ← metadata + wrapper minimal (noindex)
│   │   ├── page.tsx                ← redirect a /admin/works
│   │   ├── login/
│   │   │   └── page.tsx            ← form magic link (client)
│   │   ├── works/
│   │   │   ├── page.tsx            ← llistat de works
│   │   │   ├── actions.ts          ← Server Actions: create/update/delete/togglePublish
│   │   │   ├── new/page.tsx        ← form de creació
│   │   │   └── [id]/page.tsx       ← form d'edició
│   │   └── serveis/
│   │       ├── page.tsx            ← llistat de services
│   │       ├── actions.ts
│   │       ├── new/page.tsx
│   │       └── [id]/page.tsx
│   │
│   └── auth/
│       └── callback/
│           └── route.ts            ← endpoint del magic link
│
├── components/
│   ├── admin/
│   │   ├── AdminShell.tsx          ← sidebar de nav (client, té sign out)
│   │   ├── WorkForm.tsx            ← form reutilitzat per new/edit (client)
│   │   ├── WorkContentEditor.tsx   ← editor estructurat de blocks
│   │   └── ServiceForm.tsx         ← idem per a services
│   │
│   ├── layout/
│   │   └── SiteShell.tsx           ← amaga Header/Footer del portfolio a /admin/*
│   │
│   └── providers/
│       └── ThemeProvider.tsx       ← gestiona dark/light + cookie
│
├── lib/
│   ├── supabase.ts                 ← requireAdmin(), isAdmin(), ADMIN_EMAIL
│   ├── i18n.ts                     ← t(), flattenI18n(), isTranslatable()
│   └── seo.ts                      ← buildMetadata() centralitzat
│
├── utils/supabase/
│   ├── client.ts                   ← createBrowserClient (per Client Components)
│   ├── server.ts                   ← createServerClient (per Server Components)
│   └── middleware.ts               ← updateSession + guard de /admin/*
│
├── types/
│   ├── database.ts                 ← Tables<>, Insert, Update auto-generats de Supabase
│   └── works.ts                    ← WorkDetailData usat al codi públic
│
└── middleware.ts                   ← entry point Next, crida updateSession
```

---

## 3. Flux d'autenticació (magic link)

### Setup inicial (un sol cop a Supabase)

L'admin (`mariuscr23@gmail.com`) ha d'existir abans a `auth.users`. Es crea una vegada des de Supabase Studio:
- https://supabase.com/dashboard/project/dlshxwycvsobowjkttsc/auth/users → **Add user → Send invitation**

També cal configurar **Site URL** i **Redirect URLs** allà mateix:
- Site URL: `http://localhost:3000` (dev) / `https://mariuscomas.com` (prod)
- Redirect URLs: afegir `/auth/callback` per a cada entorn

### Cicle de login (cada vegada)

```
1. Usuari → /admin/login
2. Escriu email → onSubmit
3. supabase.auth.signInWithOtp({email, emailRedirectTo: /auth/callback?redirect=...})
   ↳ shouldCreateUser: false (clau de seguretat — no es creen comptes nous)
4. Supabase envia email amb link tipus:
   https://localhost:3000/auth/callback?code=xxx&redirect=/admin/works
5. Usuari clica → arriba a route handler /auth/callback
6. supabase.auth.exchangeCodeForSession(code) → cookie sb-* establerta
7. Verifiquem user.email === ADMIN_EMAIL (defensa en profunditat)
   - Si NO és admin → signOut() + redirect a /admin/login?error=unauthorized
   - Si SÍ és admin → redirect a la URL del query param
8. Middleware accepta la cookie i deixa passar a /admin/*
```

### Sortida (sign out)

A `AdminShell.tsx` hi ha un botó que crida `supabase.auth.signOut()` i fa `router.push('/admin/login')`. La cookie es borra automàticament.

---

## 4. Sistema de protecció (3 capes)

És important entendre que **els 3 nivells de seguretat actuen en paral·lel**. Cap és redundant — la defensa en profunditat garanteix que si un falla, els altres aturen l'atac.

### Capa 1: Middleware (`middleware.ts` + `utils/supabase/middleware.ts`)

Intercepta totes les requests. A `updateSession()`:
```ts
if (path.startsWith('/admin') && !isLoginPage && !isAuthCallback) {
  if (user?.email !== ADMIN_EMAIL) {
    return NextResponse.redirect('/admin/login?redirect=...')
  }
}
```
**Per què**: bloqueja l'accés a `/admin/*` abans que el codi de la pàgina s'executi.

### Capa 2: Server Component (`src/lib/supabase.ts → requireAdmin()`)

Tots els pages dins `/admin/*` criden `await requireAdmin()` al començament:
```ts
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/admin/login')
  }
  return { user, supabase }
}
```
**Per què**: si algú aconsegueix bypassar el middleware (fent una request directa al RSC fetch), encara cau aquí.

### Capa 3: RLS al Postgres

A Supabase hi ha polítiques que diuen "només l'admin pot escriure" i "tothom pot llegir si `is_published=true`":

```sql
-- Funció helper (SECURITY INVOKER + STABLE)
create function public.is_admin() returns boolean as $$
  select (auth.jwt() ->> 'email') = 'mariuscr23@gmail.com';
$$;

-- Polítiques (mateix patró per `works` i `services`)
create policy "works_public_read_published" on works
  for select to anon, authenticated
  using (is_published = true);

create policy "works_admin_all" on works
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
```

**Per què**: si algú aconseguís robar la cookie i cridar Supabase directament des de Postman, Postgres rebutjaria l'INSERT/UPDATE/DELETE perquè el JWT no és del l'admin.

> **Important**: si vols canviar l'email admin, has de modificar 3 llocs:
> 1. `ADMIN_EMAIL` a `src/lib/supabase.ts`
> 2. `ADMIN_EMAIL` a `src/utils/supabase/middleware.ts`
> 3. La constant literal dins de `public.is_admin()` a Postgres (via migració)

---

## 5. Schema de Supabase

### Taula `works`

| Columna | Tipus | Nota |
|---|---|---|
| `id` | uuid (PK) | autogenerat |
| `created_at` | timestamptz | autogenerat |
| `title` | jsonb | `{ca, en, es}` |
| `slug` | jsonb | `{ca, en, es}` (usem `ca` per a URLs) |
| `client_name` | jsonb | opcional |
| `role` | jsonb | "UI/UX Design", "Product Strategy"... |
| `short_description` | jsonb | usada al WorksGallery i hero del case study |
| `content` | jsonb | **estructura completa del case study** (hero, blocks, conclusion, finalMedia) |
| `conclusion` | jsonb | redundant amb `content.conclusion` — preferentment usar content |
| `hero_color` | text | hex format, default `#1A1A1A` |
| `year` | text | "2024" |
| `main_image_url` | text | per al thumbnail al /works |
| `gallery_urls` | jsonb | (no usat actualment) |
| `is_published` | boolean | default `false` — controla visibilitat pública |
| `is_featured` | boolean | si true, surt primer al WorksTeaser del home |
| `order_index` | int | ordre dins els llistats |

**Estructura del camp `content`** (definida a `src/types/works.ts → WorkDetailData`):

```ts
{
  hero: { title, description, backgroundColor },
  blocks: [{
    id, textSection: { number, title, heading, description, listType, listItems?, listDetails? },
    media: [{ id, url, alt?, type? }]
  }],
  conclusion: string,
  finalMedia: [{ id, url, alt? }]
}
```

### Taula `services`

Similar però amb camps específics per a serveis: `icon_name`, `image_url`, `price_starts_at`, `duration`, `revisions`, i 5 camps jsonb per a content narratiu (`content_about`, `content_steps`, `content_deliverables`, `content_why_us`, `payment_milestones`).

---

## 6. Fluxos CRUD

### Crear un work

1. `/admin/works` → click "Nou treball" → `/admin/works/new`
2. Form mínim (només CA): títol, slug, hero_color, year, is_published, is_featured
3. Submit → server action `createWork(formData)`:
   - `requireAdmin()` (capa 2)
   - Construeix `WorkInsert` amb `{title: {ca}, slug: {ca}, ...}`
   - `supabase.from('works').insert(insert)` (RLS valida — capa 3)
   - `revalidatePath('/admin/works')` + `revalidatePath('/works')`
   - `redirect(/admin/works/${id})` ← entra al mode edit ple

### Editar un work

1. `/admin/works/[id]` → carrega `work` complet
2. `<WorkForm>` mostra:
   - Switcher CA/EN/ES (canvia quins inputs i18n estan visibles)
   - Camps de metadades (color, any, flags is_published/is_featured)
   - **`<WorkContentEditor>`** ← editor estructurat (veure secció 7)
3. Submit → server action `updateWork(id, formData)`:
   - Construeix `WorkUpdate` amb objectes i18n `{ca, en, es}` per cada camp
   - `content_json` (string serialitzat del WorkContentEditor) es parseja a JSON i va al camp `content`
   - `supabase.from('works').update(update).eq('id', id)`
   - revalidatePath de `/admin/works`, `/admin/works/[id]`, `/works`, i `/works/[slug.ca]`

### Eliminar un work

Botó "Eliminar" → confirm dialog → `deleteWork(id)` action → `redirect('/admin/works')`.

---

## 7. L'editor estructurat (WorkContentEditor)

Aquest és el component més intricat. Substitueix el textarea JSON cru per una UI ergonòmica.

**Arquitectura interna**:
- `useReducer` amb un `state: ContentState` (hero + blocks + conclusion + finalMedia)
- Cada acció (`SET_HERO`, `ADD_BLOCK`, `MOVE_BLOCK`, `REMOVE_BLOCK_MEDIA`...) muta l'estat de forma controlada
- A cada render, serialitza l'estat a un `<input type="hidden" name="content_json">` perquè el server action segueixi funcionant sense canvis
- **Compat amb dades antigues i18n**: `normalizeInitial()` aplana qualsevol `{ca, en, es}` que trobi al jsonb → string CA. Si la versió EN/ES existia, es perd al desar (mono-idioma per ara).

**UX**:
- Blocs col·lapsables (primer obert, resta tancats)
- Reordenar amb fletxes `↑ ↓`
- Toggle de tipus de llista (Cap / Què vam fer / Característiques) per bloc
- Add/remove de media per bloc i de final media

**Si vols afegir un camp nou al case study**:
1. Modifica `src/types/works.ts` (`WorkBlock` o `WorkDetailData`)
2. Afegeix l'action al reducer + UI dins el component
3. Actualitza el `normalizeInitial()` perquè llegeixi dades antigues
4. El backend (action `updateWork`) **no canvia** — segueix llegint `content_json` com a JSON arbitrari

---

## 8. Coses subtils que cal saber

### Cookie de tema vs localStorage

El RootLayout ara llegeix `cookie.theme` al server per evitar el FOUC. El ThemeProvider escriu cookie + localStorage cada cop. **Si tornes a tocar el tema, mantingues sempre els dos en sync** o el FOUC tornarà.

### `<SiteShell>` amaga Header/Footer al /admin/\*

A `src/components/layout/SiteShell.tsx`:
```ts
const isInternalArea = pathname.startsWith('/admin') || pathname.startsWith('/auth')
```
Si afegeixes una nova zona privada (`/dashboard`, `/cms`...), recorda d'incloure-la aquí.

### `/works/[slug]` filtra slugs al servidor

Com que `slug` és jsonb (`{ca, en, es}`), no podem fer un `eq('slug', x)` directe. Estratègia: fetch tots els publicats i `find()` en memòria. **Funciona bé fins a ~100 works**; passat aquest punt, optimitzar amb un index PostgreSQL sobre `slug->>'ca'`.

### TypeScript types auto-generats

Els tipus de `src/types/database.ts` venen de Supabase. **No els editis a mà**. Per regenerar:
```bash
npx supabase gen types typescript --project-id dlshxwycvsobowjkttsc > src/types/database.ts
```
O via MCP: `mcp__supabase__generate_typescript_types`.

---

## 9. Com afegir una nova entitat CRUD

Si vols administrar `clients`, `testimonials`, `blog_posts`... el patró és exactament el mateix:

1. **Crea la taula a Supabase** + RLS policies (copia el patró de `works`):
   ```sql
   create policy "X_public_read_published" on X for select using (is_published);
   create policy "X_admin_all" on X for all to authenticated
     using (public.is_admin()) with check (public.is_admin());
   ```

2. **Regenera els tipus TypeScript** → `src/types/database.ts`

3. **Afegeix l'entitat al `AdminShell` NAV_ITEMS**:
   ```tsx
   { href: '/admin/clients', label: 'Clients', icon: Users }
   ```

4. **Crea l'estructura de fitxers**:
   ```
   src/app/admin/clients/
     ├── page.tsx           ← llistat (copia /admin/works/page.tsx)
     ├── actions.ts         ← create/update/delete (copia /admin/works/actions.ts)
     ├── new/page.tsx       ← form de creació
     └── [id]/page.tsx      ← form d'edició
   src/components/admin/ClientForm.tsx
   ```

5. **A la part pública**: crea `/clients` o on toqui, llegeix amb `createClient()` server-side i filtra `is_published = true`.

---

## 10. Punts pendents (millores conegudes)

Documentat aquí perquè quan tornis al projecte sàpigues quines decisions van quedar obertes:

- **ServiceForm encara té 5 camps JSON crus** (`content_about`, `content_steps`, etc.). Caldria fer un `ServiceContentEditor` similar al `WorkContentEditor`.
- **i18n complet**: avui tots els editors són mono-idioma CA. Si vols editar EN/ES caldria expandir cada editor amb tabs (l'schema jsonb ja suporta `{ca, en, es}`).
- **Upload d'imatges**: ara els camps `main_image_url`, `image_url`, media URLs s'escriuen com a text. Convindria un upload a Supabase Storage amb `<input type="file">` que retorni la URL pública.
- **Sense versionat**: si un work tenia 3 blocs i n'esborres un, es perd. No hi ha històric. Si vols history → tabla `work_versions` o usar `pg_audit`.
- **Formulari de contacte a `/contacte` no envia res**: TODO documentat al codi. Quan ho implementis, necessitarà o un endpoint API (Resend, Formspree) o una taula `contact_submissions` a Supabase amb RLS de "anon pot inserir".
- **Service worker / PWA install**: el manifest existeix, falten icons 192/512 reals.

---

## 11. Comandes útils

```bash
# Dev
npm run dev

# TypeScript check (sense build)
npx tsc --noEmit

# Veure advisor de seguretat de Supabase (en dev tools del Cowork)
mcp__supabase__get_advisors → security

# Regenerar types
mcp__supabase__generate_typescript_types

# Aplicar migració nova
mcp__supabase__apply_migration

# Cache Turbopack corromput → si dev peta
rm -rf .next node_modules/.cache && npm run dev
```

---

## 12. Variables d'entorn

`.env.local` (no commitejat):

```
NEXT_PUBLIC_SUPABASE_URL=https://dlshxwycvsobowjkttsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # actualitzar a prod
```

A Vercel/host de prod cal repetir-les + afegir-hi la URL real.

---

*Document generat per Cowork. Si trobes parts desactualitzades, edita aquest fitxer perquè la propera sessió tingui la realitat actual.*
