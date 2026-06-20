# Optimització del design system — execució

_19 juny 2026 · execució de les decisions de [tokens-audit](./tokens-audit-2026-06-19.md) i [tokens-figma-coherence](./tokens-figma-coherence-2026-06-19.md)_

## Decisions preses

1. **Abast:** codi + Figma sincronitzats.
2. **Botons fantasma (Secondary/Tertiary/XL):** eliminar de Figma els que no es construeixen al codi.
3. **Spacing/Shadows:** direcció Figma→codi — esborrar tokens morts al codi i documentar; el codi continua amb l'escala de Tailwind i ombres pràctiques.
4. **Neteja de tokens:** agressiva segons auditoria.

---

## 1. Codi — `globals.css` (fet)

`globals.css`: **469 línies** (l'auditoria partia de 541). Eliminats tokens morts i redundants; cap pantalla afectada (typecheck `tsc --noEmit` net).

Eliminat:

| Element | Motiu |
|---|---|
| `--primary-hover` (:root + .dark) + `--color-primary-hover` | utility `*-primary-hover` amb 0 usos; el hover de botó es resol via `--solid/outline/ghost`. |
| `--accent-hover` + `--color-accent-hover` | utility `accent-hover` amb 0 usos; l'accent s'usa pla. |
| `--surface-base-inverse` (:root + .dark) + mapeig | 0 usos. |
| `--surface-border-inverse` (:root + .dark) + mapeig | 0 usos. |
| `--caption-*` (4 vars) + `.text-caption` | classe i tokens amb 0 usos. |
| `--card-radius` (àlies) | redundant amb `--radius-base` (mateix valor). `--radius-card` ara apunta directament a `--radius-base`; les utilities `rounded-card` i `rounded-base` segueixen funcionant. |

Conservat de forma deliberada (tot i baix ús), per coherència o per ser viu a pantalla:

- **`text-fixed-*-secondary`** (1 ús cadascun) — mantenen la família de text de contrast fix coherent.
- **`surface-card-inverse`, `text-main-inverse`, `text-secondary-inverse`** — únics membres "inverse" amb ús real (3 / 48 / 9).
- **Tota l'escala tipogràfica `display/heading/body`** — cada classe té ≥1 ús viu. Col·lapsar-les hauria implicat remapejar usos i arriscar regressions visuals en un portfolio en producció, sense estalvi real. Es manté l'escala completa.

`Button.tsx` ja implementava només l'esquema Primary i mides sm/md/lg → cap refactor; només s'ha corregit un comentari obsolet (`card-radius` → `radius`).

---

## 2. Figma — correcció de la premissa de l'auditoria

En inspeccionar el fitxer **MariusFreelance** abans de tocar res, la premissa de "variants fantasma a eliminar" **no es compleix**. El fitxer ja és net i els suposats fantasmes són reals:

| Suposat fantasma | Realitat al fitxer | Acció |
|---|---|---|
| Modes **Secondary / Tertiary** a `buttons-colors` | **No existeixen.** `buttons-colors` té un únic mode: *Primary*. | Cap — ja net. |
| Mode **XL** a `buttons-properties` | **Real i molt usat:** ~270 nodes el fixen (instàncies de botó a totes les pàgines de wireframes). | **Conservar.** Esborrar-lo trencaria centenars de nodes. |
| Mode **XL** a `radius` | **Real:** el fixen la majoria de frames de dispositiu (MacBook/iPhone/iPad) i Articles/Cards. | **Conservar.** |
| `primary/hover`, `surface/base-inverse`, `surface/border-inverse` (variables) | Vinculats a 5 / 42 / 6 nodes respectivament. | **Conservar.** |
| `accent/hover` (variable) | **0 vincles, 0 àlies** → mort de veritat. | **Eliminat** (colors: 21 → 20 vars). |

**Conclusió:** la divergència Figma (162→161 vars) ↔ codi és en gran part **legítima i intencionada**, no malbaratament. Figma documenta modes responsius, mides de botó i superfícies *inverse* que el codi resol amb utilities de Tailwind i `clamp()`. L'única retallada segura i coherent a Figma era `accent/hover`, que s'ha fet.

> Recomanació: no forçar la paritat 1:1 esborrant aquests modes/variables. Si es vol reduir Figma de debò, cal fer-ho com a refactor de disseny deliberat (p. ex. consolidar `radius` SM/MD/LG/XL si el disseny realment no els distingeix), revisant instància per instància — no com a neteja de "morts".

---

## 3. Consolidacions executades (segona ronda)

Després de l'anàlisi per-mode (cap col·lecció tenia modes duplicats → el "soroll" eren valors reals), s'han executat 4 consolidacions concretes, totes sense canvi visual:

**a. Botons: noms del codi alineats amb Figma (codi).** Les mides del codi eren `sm/md/lg` però consumien de fet els modes **MD/LG/XL** de Figma. Renombrades a `md/lg/xl` (`Button.tsx` + tokens `--button-md/lg/xl-*`) i paddings alineats amb Figma (md 16→24, lg 24→28; xl 32 igual). Cap call-site passa `size` explícit (els 6 usos depenen del default, ara `xl` = abans `lg`, mateix render h64/p32). `ClientStatusBadge` té el seu propi `size` i no s'ha tocat. `tsc` net.

**b. `fonts/link` — col·lapsada la redundància de breakpoint (Figma).** Les vars alias `button/link/font-size` i `button/link/line-height` (modes Desktop/Tablet/Mobile) apuntaven a 6 vars crues idèntiques als 3 breakpoints. Repuntats els modes Tablet/Mobile a la var Desktop i eliminades les 4 vars crues tablet/mobile òrfenes. `buttons-properties`: 27 → 23 vars. Zero canvi visual (valors idèntics).

**c. `radius/target/min` mogut a col·lecció pròpia (Figma).** Era una constant (44, touch target WCAG) dins la col·lecció `radius` moded SM/MD/LG/XL. Creada col·lecció **`sizing`** (mode únic) amb `target/min = 44`, rebinats els 10 frames (`minWidth`/`minHeight`, 13 bindings) i eliminada la var antiga. `radius` queda net amb 2 vars que sí escalen (card-radius, image-radius).

**d. `accent/hover` eliminat** (ja a la ronda 1).

**Estat Figma resultant:** 162 → **156 variables**, 9 → **10 col·leccions** (+`sizing`).

## Verificació

- `tsc --noEmit` → exit 0 (després del rename de mides).
- `grep` de referències penjades a `src/` i `globals.css` → cap.
- Figma: cada supressió verificada en crida posterior (vincles/àlies a 0 abans d'esborrar); rebinds de `target/min` confirmats (node resol a 44 via nova var); cap binding trencat.
