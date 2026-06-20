# Template de fitxa de feina (taula `works`) + taxonomies

Projecte Supabase: **portfoli-freelance** (`dlshxwycvsobowjkttsc`). Taula `works`.
Idiomes i18n: **ca / es / en** (tots tres). Generat 2026-06-19.

## Taxonomies a sembrar

### work_roles (el barret de dissenyador) — camp `name` jsonb {ca,es,en} + `color` hex
| ca | es | en | color (proposat) |
|----|----|----|------|
| UI/UX Design | UI/UX Design | UI/UX Design | #4F7CFF |
| Product Design | Diseño de Producto | Product Design | #7C5CFF |
| UX Research | Investigación UX | UX Research | #00A88F |
| Design System | Sistema de Diseño | Design System | #FF8A3D |

### work_categories (tipus de projecte) — `name` jsonb {ca,es,en} + `color` hex
| ca | es | en | color (proposat) |
|----|----|----|------|
| HMI / Automoció | HMI / Automoción | HMI / Automotive | #1A1A1A |
| App Design | Diseño de App | App Design | #4F7CFF |
| Web Design | Diseño Web | Web Design | #00A88F |
| Sector públic | Sector público | Public Sector | #B8860B |

## Plantilla per feina (1 fila de `works`)

Camps i18n → objecte `{ "ca": "...", "es": "...", "en": "..." }`.

- **title** (i18n) — nom del projecte
- **slug** (i18n) — kebab-case per idioma
- **client_name** (i18n)
- **year** (text) — p. ex. "2028", "2026"
- **category_id** (FK work_categories) · **role_id** (FK work_roles)
- **short_description** (i18n) — 1–2 frases per a la targeta/teaser
- **content** (jsonb) — estructura `WorkDetailData`:
  - `hero`: { title, description, backgroundMode 'color'|'image', backgroundColor, backgroundImage?, overlayOpacity?, textColor 'light'|'dark' }
  - `blocks[]`: cada bloc = { textSection: { number "01", title, heading, description, listType?, listItems?, listDetails? }, media: [{ url, type, alt }] }
  - `conclusion` (text) · `finalMedia[]` · `nextProject { title, slug }`
  - ⚠️ Pendent confirmar si `content` és i18n (un objecte per idioma) o únic — ho verifico al codi de WorkForm/actions abans d'inserir.
- **conclusion** (i18n) — també existeix com a columna pròpia
- **hero_color** (text, default #1A1A1A) · **accent_color** (text)
- **main_image_url** + **main_image_alt** · **gallery_urls** (jsonb) · **og_image_url** — exports de Figma
- **meta_title** / **meta_description** (i18n) — SEO, fallback a title/short_description
- **Flags:** is_featured, is_published (def true), is_indexable (def true), order_index
- **client_id** (FK clients) — opcional

## Mapeig provisional de les 4 feines

| Feina (pàgina Figma) | category | role | year | notes de contingut (fonts) |
|---|---|---|---|---|
| Cupra Formentor 2028 | HMI / Automoció | UI/UX Design | 2028 | North Studio — HMI vehicle. Behance: Cockpit Comfort EX30 |
| Cupra Holistic (Raval 2026) | HMI / Automoció | Product Design | 2026 | North Studio — concepte holístic |
| Segurall (Santalucia Impulsa) | App Design | UI/UX Design + UX Research | — | Quantion — assegurances. Behance: Segurall UI/UX/Research |
| CatSalud (Concurs per la Generalitat) | Sector públic | UI/UX Design | — | Concurs Generalitat — salut pública |

> El contingut real (textos dels blocks, imatges) s'omple per feina. Falten dades concretes de cada projecte.
