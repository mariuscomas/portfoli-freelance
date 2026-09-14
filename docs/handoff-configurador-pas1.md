# Handoff — Configurador · Pas 1 de 2

**Frame Figma:** `Configura la teva web - 1 de 2 - Desktop` (`11530:13090`) · file `kYJGrKCJyy3nlMg2idLzOE`
**Stack destí:** Next.js + Tailwind v4 (`@theme` amb tokens propis) · React
**Última revisió:** 2026-07-15

> El "browser chrome" (barra amb semàfor, cerca, fletxes) del frame és només mockup de presentació. **No forma part del producte**: comença a implementar des de `Navbar - Top`.

---

## 1. Visió general

Primer pas d'un configurador de 2 passos. L'usuari tria el **tipus de projecte** (rol contractat) a l'esquerra, activa **extres** al centre, i veu el **resum de preu** en viu a la dreta. El total es recalcula a cada canvi amb microanimació. Cap camp bloqueja: la Base sempre és vàlida, així que `Continua` està sempre actiu.

Arquitectura de 3 columnes simultànies (no és un wizard de 3 passos; les columnes 1 i 2 són accions i la 3 és una lectura viva).

---

## 2. Layout

Contenidor card: `1728 × 1117`, `border-radius: card-radius (16)`, `bg: surface/base`, `overflow: clip`.

```
Navbar - Top            → alçada 80, border-b surface/border, px section/padding/x-LG (48), py 24
Row (3 columnes)        → flex, items-start, min-h 0, cada columna flex-1 (≈576), min-w 0
  ├─ Left   p-48, gap-48, border-r surface/border, z-3
  ├─ Center p-48, z-2
  └─ Right  p-48, justify-between, bg rgba(255,255,255,.5), border-l surface/border, z-1
Navbar - Bottom         → alçada 112, border-t surface/border, px 48, py 24
```

Amplada de contingut per columna: `576 − 2×48 = 480`.

**Columna Left**
- Bloc 1: H2 `1. Tipus de projecte` + `Chips Group` (flex-wrap, gap 8; wrapper gap 16).
- Bloc 2: Header `Base. Tot el que inclou un projecte complet.` (py 16) + `Items Group` amb 7 files `Item List Simple` de 56px, cadascuna `border-b surface/border`, text `Body/SM`.

**Columna Center**
- Bloc: H2 `2. Extres` (gap 24) + `List Items` amb 5 files `Configurador · Item` (py 24, `border-b`, gap intern 12).

**Columna Right** (amplada fixa 576, alçada 873, `justify-between`)
- Bloc: H2 `3. Resum` + `Items Group` (2 × `Drop Down - List`: Base, Extres) + `Fila — Base` (Total).
- Footer: `border-t dashed surface/border`, pt 24, notes en llista de punts.

---

## 3. Tokens de disseny

### Tipografia
| Token | Família / pes | Size / line / tracking | Ús en pantalla |
|---|---|---|---|
| `Heading/H1 - Semibold` | Bricolage SemiBold | 56 / 64 / −1 | Import del **Total** |
| `Heading/H2` | Bricolage Medium | 40 / 56 / −0.5 | Títols de columna (1/2/3) |
| `Heading/H3 - Medium` | Bricolage Medium | 32 / 40 / −0.4 | Etiqueta "Total" |
| `Heading/H4 - Medium` | Bricolage Medium | 24 / 32 / −0.3 | Header "Base."; headers de dropdown |
| `Heading/H5 - Medium` | Bricolage Medium | 16 / 24 / 0 | Títol navbar "Configura la teva web" |
| `Body/MD - Regular` | Hanken Regular | 20 / 28 / 0 | Títol de cada extra |
| `Body/SM - Regular` | Hanken Regular | 16 / 24 / 0 | Ítems de la llista Base |
| `Body/XS - Regular` | Hanken Regular | 14 / 20 / 0 | Ítems desplegats del Resum |
| `Buttons/Large` | Hanken Regular | 20 / 28 / 0 | Text del botó "Continua" |
| `Others/Caption` | Geist Mono Medium | 14 / 16 / 0 | Preus unitaris (`+200 €/PÀGINA`), navbar, notes |
| `Others/Caption - LG` | Geist Mono Medium | 24 / 32 / 0 | Subtotals del Resum (2.400 €, 600 €) |

> **Regla de números:** subtotals i preus unitaris en **Geist Mono**; el **Total** en **Bricolage** (H1). No barrejar.

### Color
| Token | Hex | Ús |
|---|---|---|
| `text/main` | #0b0b0b | Títols, valors, ítems Base |
| `text/secondary` | #444749 | Subtotals, captions, navbar dreta |
| `text/tertiary` | #737373 | Notes del footer |
| `surface/base` | #f2f2f2 | Fons de la card i navbars |
| `surface/card` | #ffffff | Fons dels chips en repòs |
| `surface/border` | #e5e7eb | Totes les línies divisòries; track del switch off; border minus deshabilitat |
| `solid/default/background` | #1a1a1a | Chip seleccionat, switch on, botó Continua |
| `solid/default/font-color` | #f2f2f2 | Text sobre superfícies fosques |
| `outline/neutral/default/border` | #8a8a8a | Border dels botons de stepper actius |
| `outline/primary/disabled/border` | #e5e7eb | Border del stepper "−" quan valor = 0 |

### Espaiat, radi, ombra
| Token | Valor | Ús |
|---|---|---|
| `section/padding/x-LG` | 48 | Padding de columnes i navbars |
| `properties/large/padding` | 32 | Padding intern del botó Continua |
| `properties/large/height` | 64 | Alçada del botó Continua |
| `radius` | 8 / 999 | 8 botó ghost navbar; 999 chips, steppers, switch, Continua |
| `card-radius` | 16 | Cantonades de la card |
| `target/min` | 44 | Àrea de toc mínima (chips, switch) |
| `Soft Shadow` | 0 4 20 −2 · rgba(0,0,0,.08) + blur 10 | Botons de stepper |

---

## 4. Components i estats

| Component | Variants / estats | Specs |
|---|---|---|
| **Chip** (`radiogroup`, selecció única) | `Default` / `Selected` · + `Hover`, `Focus`, `Disabled` | Default: `bg surface/card`, `border surface/border`, text `text/secondary`. Selected: `bg solid/default/background`, text `solid/default/font-color`, sense border. `min-h 44`, `min-w 72`, `px 16 py 8`, `rounded 999`. Focus: effect style **Focus ring**. Hover (definir): enfosquir border o `bg surface/base` |
| **Item List Simple** (Base) | únic | Fila 56px, `py 16`, `border-b surface/border`, `Body/SM`, `text/main`. No interactiu |
| **Configurador · Item** (extra) | `control = Stepper` \| `control = Switch` | `py 24`, `border-b`, gap 12. Info: títol `Body/MD` + botó tooltip; caption preu `Others/Caption` `text/secondary` |
| **Stepper** | `value = 0` (− deshabilitat) / `value ≥ 1` (− actiu) | 2 botons quadrats 40px (`−` / `+`) + valor `Geist Mono 16`, `w 20`, centrat. `−` a 0: `border outline/primary/disabled`, icona atenuada, `aria-disabled`. Actiu: `border outline/neutral`. Botons amb Soft Shadow + `backdrop-blur 5`. Rang mín 0; **màx a definir** (recomanat 20) |
| **Switch** | `off` / `on` | Track 52×28 (hit-area ≥44). Off: `track surface/border`, thumb blanc. On: `track solid/default/background`, thumb blanc. `role=switch`, `aria-checked` |
| **Drop Down - List** (Resum) | `expanded` / `collapsed` | Header clicable (`py 12`, `border-b`): títol `H4` + `CaretDown` (16) + subtotal `Caption - LG` `text/secondary`. Expanded: `Items List` (`pl 24`, `pb 16`) amb files `py 12` `border-b`, etiqueta `Body/XS` + preu `Caption`. Caret gira: avall = obert, −90° = tancat |
| **Button Tooltip** ("?") | `hover` / `focus` / `active` | Hit-area 32px, icona `Question` 16px. Dispara toggletip (patró de `project_tooltip_component`, **render en portal** per l'`overflow-clip` de les files) |
| **Button Solid Large** ("Continua") | `default` / `hover` / `active` / `focus` · (sempre enabled) | `h 64`, `min-w 180`, `rounded 999`, `bg solid/default/background @ opacity 90`, text `Buttons/Large` `solid/default/font-color`. Té capa "Light Effect" per al press. Hover (definir): opacitat 100 o enfosquir 8% |

---

## 5. Interaccions i motion

> Les microanimacions de canvi de preu i de contingut **ja estan definides al projecte**; aquí es documenta el disparador i l'abast, no els valors exactes (respectar els existents).

| Element | Disparador | Animació |
|---|---|---|
| Chip | Selecció d'un rol | Actualitza la llista Base i el **preu Base** del Resum amb transició (count-up / fade). El chip anterior perd l'estat Selected |
| Stepper `+`/`−` | Clic | Incrementa/decrementa valor; recalcula subtotal Extres i Total; anima el número. Press: capa "Background" opacitat 0→visible |
| Switch | Toggle | Afegeix/treu la línia corresponent dins `Extres` del Resum i recalcula Total |
| Redacció de textos (switch, **Opció A**) | Toggle on | La caption passa de `+80 €/PÀGINA` al càlcul real (`N pàg · 80 €`). *Pendent*: regla de dependència de pàgines |
| Drop Down - List | Clic al header | Expandeix/col·lapsa amb transició d'alçada + rotació del caret |
| Total | Qualsevol canvi de preu | Recompte animat del valor |

---

## 6. Responsive

El frame lliurat és **només Desktop**. Comportament a definir en frames propis abans d'implementar; recomanació base:

| Breakpoint | Comportament |
|---|---|
| Desktop (>1024) | 3 columnes com al frame |
| Tablet (768–1024) | 2 columnes (Left + Center) i **Resum** com a panell lateral col·lapsable o barra inferior sticky amb Total + Continua |
| Mobile (<768) | Apilat vertical: Tipus → Extres; **Resum + Continua** en barra sticky inferior o bottom-sheet expansible amb el Total sempre visible |

**Crític per a mobile:** els títols dels extres i dels dropdowns porten `whitespace-nowrap` al codi generat de Figma → **treure'l** perquè facin wrap a 2 línies. Mantenir `nowrap` només a les captions curtes de preu.

---

## 7. Edge cases

- **Molts extres (decisió presa):** el **Resum sencer** té scroll intern amb el **Total sticky** sempre visible; la llista d'extres no scrolla per separat.
- **Cap extra:** subtotal `Extres` = 0; ocultar la fila `Extres` del Resum o mostrar `—`. El Total iguala la Base.
- **Base sempre present:** no té estat buit.
- **Títols llargs / i18n:** wrap a 2 línies (veure §6); el preu unitari no ha de col·lisionar amb el títol.
- **Stepper al màxim:** deshabilitar `+` en arribar al màxim (`aria-disabled`), mateix tractament visual que el `−` a 0.
- **Preu Base per rol:** el número Base canvia segons el chip; assegurar feedback animat perquè no sembli un glitch.

---

## 8. Accessibilitat

- **Titulars numerats:** al codi, mantenir-los com a `<h2>` i pintar l'`1./2./3.` amb un `<span>` o CSS counter. **No** fer servir `<ol><li>` (el codi de Figma ho genera així i **perd la semàntica de heading**).
- **Chips:** `role="radiogroup"` amb `aria-label` "Tipus de projecte"; cada chip `role="radio"` + `aria-checked`; navegació amb fletxes; **Focus ring** visible.
- **Stepper:** valor amb `role="spinbutton"` (o `aria-live="polite"`); botons amb `aria-label` explícit ("Suma una pàgina" / "Resta una pàgina"); `−` a 0 → `aria-disabled="true"`.
- **Switch:** `role="switch"` + `aria-checked` + etiqueta associada (el títol de l'extra).
- **Button Tooltip:** botó amb `aria-label` i `aria-expanded`; contingut en portal, focusable, tancament amb `Esc`; funciona a clic (toggletip), no només hover.
- **Ordre de focus:** botó enrere navbar → chips → per cada extra (control → "?") → dropdowns del Resum → `Continua`.
- **CTA:** `Continua` és l'últim del recorregut; focus ring visible.
- **Contrast:** `text/tertiary #737373` sobre blanc queda a ~4.7:1 (passa AA just). Com que el Resum té fons `rgba(255,255,255,.5)` sobre `surface/base`, **verificar el ràtio sobre el fons real**; si baixa de 4.5, enfosquir el token de les notes.
- **Enllaç del navbar inferior:** "reserva una trucada de 20 min" ha de ser un `<a>`/`<button>` real, subratllat, dins el focus order.

---

## 9. Pendents abans d'implementar

1. Definir frames **Tablet** i **Mobile** (comportament del Resum i del CTA).
2. Regla de dependència de **Redacció de textos** (sobre quines pàgines calcula).
3. Màxim dels steppers (Pàgines / Idiomes).
4. Estats **Hover** de Chip i de Continua (valors exactes).
5. Decisió d'obertura per defecte dels dropdowns del Resum (recomanat: **Base col·lapsat / Extres obert**).
