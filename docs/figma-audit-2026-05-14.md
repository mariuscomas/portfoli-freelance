# Auditoria del fitxer de Figma — MariusFreelance

**Fitxer:** [MariusFreelance](https://www.figma.com/design/kYJGrKCJyy3nlMg2idLzOE/MariusFreelance)
**Frame auditat:** `10574:3520` (pàgina `00_Wireframes` — Foundations / Design System)
**Data:** 2026-05-14
**Auditor:** Cowork (Claude)
**Abast:** Design tokens · Components · Accessibilitat WCAG 2.1 AA · UX/UI

---

## Resum executiu

El fitxer conté una pàgina sòlida de Foundations + sistema de components inicial per al portfolio personal de Marius. La identitat de marca és forta (Grtsk, paleta `#0b0b0b` / `#efebe7` / `#13ec6d`, decisions editorials valentes). Tot i això hi ha **dos sistemes de tokens coexistint** que cal consolidar abans de qualsevol altre treball — un legacy basat en Plus Jakarta Sans / Tailwind-likes i el sistema propi basat en Grtsk. També hi ha gaps d'accessibilitat acotats però rellevants (focus states absents, touch targets per sota de 44px, dos colors que no passen AA) i àrees del sistema sense completar (estats de botó, Inputs només Solid).

**Severitat global:** mitja. Cap problema bloca el llançament, però sí cal una sessió de neteja de ~2h al fitxer i una decisió clara sobre el flux Figma ↔ Tailwind v4.

---

## Decisions estratègiques preses

1. **No vincular** la llibreria community "TailwindCSS v4.2.4 Base". Mantenir tokens propis a Figma; al codi Next mapejar-los al `@theme` de Tailwind v4.
2. Prioritzar **neteja d'inconsistències** abans d'ampliar el sistema (afegir components nous o vincular noves llibreries).
3. La pàgina actual del fitxer és **un Design System en si mateix**, no una pantalla del portfolio. La feina de neteja aquí es propagarà a totes les pantalles que en derivin.

---

## Llibreries actualment vinculades

- ✅ **Phosphor Icons (Community)** — bona elecció, mantenir.
- ❌ Cap design system propi publicat com a llibreria.

**Recomanació:** quan el sistema estigui consolidat, publicar-lo com a llibreria interna del team `Marius Freelance` perquè sigui consumible des d'altres fitxers (case studies, mockups de clients, etc.).

---

## Inventari de tokens

### Famílies tipogràfiques

| Sistema | Token | Valor | Estat |
|---|---|---|---|
| Propi | `font-family-heading` | Grtsk | ✅ Mantenir |
| Propi | `font-family-body` | Grtsk | ✅ Mantenir |
| Legacy | `Font Family` | Plus Jakarta Sans | 🔴 Eliminar |

### Escala tipogràfica (sistema propi)

| Token | Size | Line | LS | Pes |
|---|---|---|---|---|
| `Display/H1 - Semi Bold Giga` | 112 | 112 | -3 | 600 |
| `Display/H2 - Regular` | 17 | 24 | -1 | 600 |
| `Heading/H1` | 56 | 64 | -0.5 | 400 |
| `Heading/H2` | 40 | 56 | 0 | 400 |
| `Heading/H3 - Regular` | 24 | 32 | -1 | 400 |
| `Heading/H4 - Regular` | 16 | 28 | -0.3 | 400 |
| `Body/XL - Light` | 48 | 64 | 0 | 300 |
| `Body/LG - Regular` | 16 | 22 | 0 | 400 |
| `Body/MD - Regular` | 14 | 20 | 0 | 400 |
| `Body/SM - Regular` | 20 | 28 | 0 | 400 |
| `Others/Caption` | 14 | 16 | 0.3 | 500 |
| `Buttons/Large` | 14 | 20 | 0.5 | 400 |
| `Buttons/Link` | 24 | 24 | 0 | 400 |

**Observació:** `Body/SM` (20) és més gran que `Body/MD` (14) — naming invertit. Cal corregir o renomenar (SM hauria de ser el més petit, no entre MD i LG).

### Tokens semàntics de color

| Concepte | Token propi | Valor | Token legacy duplicat |
|---|---|---|---|
| Text principal | `text/main` | `#0b0b0b` | `Text/Main #111827` 🔴 |
| Text secundari | `text/secondary` | `#444749` | `Text/Secondary #6b7280` 🔴 |
| Surface base | `surface/base` | `#f2f2f2` | — |
| Surface card | `surface/card` | `#ffffff` | — |
| Surface border | `surface/border` | `#e5e7eb` | `Surface/Border #e5e7eb` 🔴 |
| Primary | `Primaris/Main` | `#13ec6d` | `Primaris/Main #13ec6d` |
| Primary surface | `Primaris/Surface` | `#efebe7` | — |
| Stone (accent) | `stone` | `#343330` | — |
| Inverse | `text/main-inverse` | `#f2f2f2` | — |

---

## Troballes prioritzades

### 🔴 Crítiques (resoldre abans de res)

#### C-1. Dues famílies tipogràfiques al fitxer

`Font Family: Plus Jakarta Sans` coexisteix amb el sistema propi Grtsk. Probablement residual d'una versió anterior o copiat d'un kit.

- **Impacte:** confusió en components nous; risc que un component nou agafi Plus Jakarta sense voler.
- **Fix:** eliminar la variable `Font Family` i tots els text styles que la usen (`Body/Small`, `Text/Caption`, `Text/Text`, `Text/Placeholder`).

#### C-2. Tokens de color semàntics duplicats

`Text/Main`, `Text/Secondary`, `Surface/Border` (PascalCase) duplicaven `text/main`, `text/secondary`, `surface/border` (lowercase). En el cas de Text/Main i Text/Secondary fins i tot **amb valors HEX diferents**.

- **Impacte:** dos colors per a la mateixa funció semàntica = inconsistència real entre components.
- **Fix:** eliminar les variants PascalCase. Re-bindar instàncies si cal.

#### C-3. `Text/Secondary #6b7280` no passa WCAG AA

Ratio 4.32:1 sobre `surface/base #f2f2f2` — cal ≥ 4.5:1.

- **Impacte:** text secundari il·legible per a alguns usuaris.
- **Fix:** eliminar el token legacy. Usar només `text/secondary #444749` (ratio 8.36:1, AAA).

#### C-4. `Error/Main #ef4444` no passa AA sobre blanc

Ratio 3.76:1 — passa només per text gran (≥18px).

- **Impacte:** missatges d'error en inputs poden ser il·legibles.
- **Fix:** enfosquir a `#dc2626` (ratio 4.83:1) o `#b91c1c` (ratio 6.66:1).

### 🟠 Importants (resoldre aquest sprint)

#### I-5. Naming convention mixta

Conviuen `text/main` (lowercase/slashed) amb `Primaris/Surface`, `Solid/Default/background`, `Outline/Hover/font-color` (PascalCase). Cal triar UNA convenció.

- **Recomanació:** tot lowercase amb slashes (`primaris/surface`, `solid/default/background`). És el que millor casa amb CSS variables i Tailwind v4.

#### I-6. Estats interactius incomplets

Falten tokens per a estats clau:

| Variant | Default | Hover | Pressed | Disabled | Focus |
|---|---|---|---|---|---|
| Solid | ✅ | ✅ | ❌ | ✅ | ❌ |
| Outline | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ghost | ✅ | ✅ | ❌ | ❌ | ❌ |

- **Crític per a accessibilitat:** els estats Focus (WCAG 2.4.7 Focus Visible) són obligatoris per AA.
- **Fix:** afegir `{variant}/focus/border` i `{variant}/focus/outline` mínim. Idealment també `pressed` i la columna `disabled` completa.

#### I-7. Touch target per sota de 44px

`properties/large/height: 32` per al botó "Large". WCAG 2.5.5 (AAA) recomana ≥44×44px; Material i Apple HIG ho fan obligatori a 44 i 44 respectivament.

- **Fix:** pujar a 44px per a mobile, mantenir 32-36 per a desktop dens si vols dues mides. O renomenar: `properties/small`, `properties/medium`, `properties/large` (32 / 40 / 48).

#### I-8. Disabled state poc contrastat

`#999999` sobre `#f2f2f2` = ratio 2.54. Encara que WCAG 1.4.3 exempta disabled, és tan baix que costa veure'l.

- **Fix:** `#7a7a7a` (ratio ~4) o usar opacitat 0.6 sobre el color base.

#### I-9. Buttons: variants "Framed" i "Pill" anunciades però no visibles

L'encapçalament de Buttons llista "Outline & Framed - Pill" però només veig Solid / Outline / Ghost en cada mida.

- **Fix:** o dissenyar Framed i Pill, o eliminar-les del header (cal alinear-ho amb el codi planificat al Next).

#### I-10. Inputs només Solid

A la secció Inputs només veig la variant Solid. Per consistència amb Buttons cal Outline / Ghost / Framed.

#### I-11. Jerarquia tipogràfica `H1` vs `Body XL`

`Heading/H1: 56` competeix visualment amb `Body/XL: 48`. Cal pes Light + tracking expressament diferent (ja és Light 300, comprovar visualment) o reduir Body XL.

#### I-12. `Heading/H3` amb letter-spacing inconsistent

H3 té `-1` quan H2 té `0` — trenca la regla "més gran = més tight". Suggereixo H1: -0.5 / H2: -0.5 / H3: -0.3 / H4: -0.2.

#### I-13. `Display/H2: 17` qüestionable

A 17px amb estil SemiBold Giga és pràcticament un H5 disfressat de display. Repensar si calen 2 tipus de display.

#### I-14. Card de treball — manca metadata

Per a un portfolio de UI/UX:
- Afegir tags de tecnologia (Figma, Next.js, etc.)
- Indicador d'enllaç ("Read more →")
- Métrica destacada opcional (X% conversion, X users)
- Year explícit a la card

### 🟢 Menors (nice-to-have)

#### M-15. `Body/SM` és més gran que `Body/MD`

Naming invertit: `SM: 20` > `MD: 14`. Cal renomenar (SM=12, MD=14, LG=16, XL=...).

#### M-16. Primitius "orfes" sense escala

`Header: 32`, `number: 8`, `Y: 4`, `blur: 10`, `Section Gap: 72`, `Text/Propietats/*` (Size 32, Border Radius 6, Icon Size 12) — semblen valors ad-hoc.

- **Fix:** mapejar tots a una escala unificada de spacing (4/8/12/16/24/32/48/64/96) i radius (2/4/8/12/16/24).

#### M-17. Avatars sense ús clar

La secció Avatars amb 4 punts no aporta valor a un portfolio personal — eliminar o substituir per una mostra d'ús real (testimonis de clients amb foto).

#### M-18. Section Hero massa minimal

Tens un vídeo cinemàtic (`Video_Cinematográfico_de_Carrera_Alpina_Lluviosa.mp4`) a `/public/videos/` del projecte Next que sembla ideal per al hero — no veig referenciada cap idea d'integració.

---

## Resum de validació d'accessibilitat WCAG 2.1 AA

| Parell | Ratio | AA Normal | AA Large | Estat |
|---|---|---|---|---|
| `text/main` `#0b0b0b` / `surface/base` `#f2f2f2` | 17.58 | ✅ | ✅ | AAA |
| `text/main` `#0b0b0b` / `surface/card` `#ffffff` | 19.68 | ✅ | ✅ | AAA |
| `text/main` `#0b0b0b` / `Primaris/Surface` `#efebe7` | 16.60 | ✅ | ✅ | AAA |
| `text/secondary` `#444749` / `surface/base` `#f2f2f2` | 8.36 | ✅ | ✅ | AAA |
| `text/secondary` `#444749` / `surface/card` `#ffffff` | 9.36 | ✅ | ✅ | AAA |
| `Text/Secondary` `#6b7280` (legacy) / `surface/base` | 4.32 | ❌ | ✅ | FAIL AA |
| `primary/hover` `#b2b2b2` / `surface/card` | 2.12 | ❌ | ❌ | FAIL |
| `Solid/Disabled/font` `#999999` / disabled bg `#f2f2f2` | 2.54 | ❌ | ❌ | exempt (disabled) |
| `Solid/Default/font` `#f2f2f2` / `Solid/Default/bg` `#1a1a1a` | 15.55 | ✅ | ✅ | AAA |
| Text negre sobre `Primaris/Main` `#13ec6d` | 12.42 | ✅ | ✅ | AAA ✨ |
| Text blanc sobre `Primaris/Main` `#13ec6d` | 1.59 | ❌ | ❌ | NUNCA usar |
| `Info/Main` `#2563eb` / blanc | 5.17 | ✅ | ✅ | AA |
| `Error/Main` `#ef4444` / blanc | 3.76 | ❌ | ✅ | FAIL AA normal |
| Mode dark: `text/main-inverse` / `surface/card-inverse` | 17.68 | ✅ | ✅ | AAA |
| Mode dark: `text/secondary-inverse` `#999999` / `card-inverse` | 6.95 | ✅ | ✅ | AA |

**Veredicte:** el sistema propi és accessible. Tots els problemes venen dels tokens legacy (`Text/Secondary`, `Error/Main`) o d'estats que cal completar (focus, disabled).

---

## Pla de remediació (ordenat)

### Fase 1 — Neteja (1.5-2h)

1. Eliminar la variable `Font Family` (Plus Jakarta Sans) i tots els text styles que la referencien (`Body/Small`, `Text/Caption`, `Text/Text`, `Text/Placeholder`).
2. Eliminar tokens duplicats: `Text/Main`, `Text/Secondary`, `Surface/Border`.
3. Eliminar la variable `Primaris/Main` duplicada (deixar només una).
4. Re-bindar instàncies òrfenes als tokens canònics.
5. Eliminar variables solts sense escala (`Header`, `number`, `Y`, `blur`) o renomenar-les semànticament.

### Fase 2 — Completar el sistema (2-3h)

6. Afegir estats de botó que falten:
   - `solid/focus`, `solid/pressed`
   - `outline/disabled`, `outline/focus`, `outline/pressed`
   - `ghost/disabled`, `ghost/focus`, `ghost/pressed`
7. Pujar `properties/large/height` a 44px (o renomenar mides: small/medium/large = 32/40/48).
8. Enfosquir `Error/Main` a `#dc2626`.
9. Ajustar letter-spacing de Heading: H1 -0.5 / H2 -0.5 / H3 -0.3 / H4 -0.2.
10. Renomenar `Body/SM` (actualment 20px) → `Body/LG-alt` o reorganitzar l'escala perquè SM sigui realment el més petit.
11. Afegir Inputs Outline / Ghost / Framed.
12. Completar Buttons Framed i Pill (si formen part del sistema final).

### Fase 3 — Convergència codi-design (1h)

13. Decidir convenció de naming final i renomenar tots els tokens (recomanació: lowercase/slashed).
14. Generar al codi (Tailwind v4) el `@theme` que reflecteixi els tokens. Exemple inicial:

```css
@theme {
  --color-text-main: #0b0b0b;
  --color-text-secondary: #444749;
  --color-surface-base: #f2f2f2;
  --color-surface-card: #ffffff;
  --color-primary: #13ec6d;
  --color-primary-surface: #efebe7;
  --font-heading: 'Grtsk', sans-serif;
  --font-body: 'Grtsk', sans-serif;
  --radius-sm: 4px;
  --radius-md: 12px;
  /* ... */
}
```

15. Considerar publicar el fitxer com a llibreria del team Marius Freelance.

### Fase 4 — Hero i contingut (continu)

16. Plantejar integració del vídeo cinemàtic al Section Hero.
17. Enriquir Card de Treball amb tags + métrica + year.
18. Decidir el destí de la secció Avatars (eliminar o reformular).

---

## Apèndix — Pàgines del fitxer

El fitxer només té una pàgina top-level (`00_Wireframes`). Recomanació quan creixi:

```
00_Cover
01_Foundations (colors, typography, icons, spacing, radius, shadows)
02_Components (atoms + molecules)
03_Patterns (organisms: navbar, footer, card grids)
04_Pages (Home, Work, Case Study, About, Contact)
05_Archive
```

---

*Generat per Cowork (Claude) — versió 1, 2026-05-14*
