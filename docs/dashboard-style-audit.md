# Dashboard Style Audit — Sanity Studio V3 + Payload v3

Moodboard + auditoria visual del dashboard `/admin` comparat amb dues referències que volem emular:
**Sanity Studio V3** (sanity.io/docs/studio) i **Payload v3** (payloadcms.com).

Objectiu d'aquesta primera passada: **tipografia i paleta**. Refinaments
posteriors (drawer per a relations, chips per a references, command palette,
etc.) van a documents separats.

---

## 1. Patrons que importem

### Sanity Studio V3 — el referent estètic

#### 1.1 Tipografia (font + jerarquia)

Sanity Studio té un look molt sobri. Una sola família tipogràfica
(Inter Variable) per a tot, sense fonts display. La jerarquia ve dada per
**mida + pes + color**, no per uppercase o tracking.

- **Labels de field**: `13px / 1.4 / weight 500 / text-secondary` — sense
  uppercase, sense tracking. Aspecte: gris suau, llegible, no crida.
- **Valors editats**: `15px / 1.5 / weight 400 / text-main` — la lectura
  pesa més que la label.
- **Heading de secció (h2)**: `18-20px / 1.3 / weight 600` — sobri.
- **Captions metadata** (file name, last edited, etc.): `12px / weight 400 /
  text-tertiary`.

Comparat amb el meu dashboard actual:

| Element | Avui (meu) | Sanity-style |
|---|---|---|
| Label de field | `text-body-sm uppercase tracking-wider text-text-secondary` (12px caps) | `text-[13px] font-medium text-text-secondary` (no caps, no tracking) |
| Valor input | `text-body-md text-text-main` (14-20px) ✓ | `text-[15px] text-text-main` ✓ |
| H2 secció | `text-body-lg font-medium` (~18-24px) ✓ | `text-[18px] font-semibold` ✓ |
| Caption | `text-body-sm text-text-secondary` ✓ | `text-[12px] text-text-secondary/70` ✓ |

**Captura mental** (URL: sanity.io/docs/structure-builder):
> Es veu un panel d'edició amb labels com `Slug`, `Title`, `Description`
> tots en text gris simple sense uppercase. Cada label és quasi
> imperceptible — el que crida és el valor i el border on focus.

#### 1.2 Inputs

Sanity prioritza el contingut, no el contenidor:

- **Bg transparent** o `surface-base` molt subtle. NO `bg-surface-card`
  contrastat com el meu.
- **Border**: 1px `surface-border` però quasi imperceptible (color: #e8e8e8
  sobre fons #fafafa).
- **Focus**: anell ring 2px `accent` + bg lleugerament més fosc. Animació
  150ms ease-out.
- **Hover**: només `border` torna lleugerament més fosc.

Comparat amb el meu:

| Estat | Avui | Sanity-style |
|---|---|---|
| Rest | `bg-surface-base border border-surface-border rounded-md` | `bg-transparent border border-surface-border rounded-md` |
| Hover | `hover:border-text-secondary/60` ✓ | ✓ similar |
| Focus | `focus:border-text-main focus:ring-2 focus:ring-text-main/20` ✓ | ✓ similar |

El meu `bg-surface-base` (gris molt clar) sobre fons `surface-card`
(blanc del Card) genera un contrast medi — visualment "form complex".
Sanity manté tot el contenidor a bg-card uniforme, només el border defineix
els inputs. **Decisió pendent**: provar `bg-transparent` als inputs i
veure si la lectura millora.

#### 1.3 Paleta

Sanity v3 fa servir literalment 5 colors visibles per tot el Studio:

- `#000` (text-main)
- `#666-#999` (text-secondary)
- `#fff` (surface-card)
- `#e5e5e5` (surface-border)
- 1 accent — taronja `#f03e2f`

Tot lo demés és aplicació d'opacitat. Warning groc, error vermell, success
verd només apareixen quan són estrictament necessaris (validations,
status indicators).

Comparat amb el meu CSS:

```
--text-main: #0b0b0b           ✓ proper a Sanity
--text-secondary: #444749      ✓ similar (Sanity usa una mica més clar)
--surface-base: #f2f2f2        — Sanity prefereix tot blanc unificat
--surface-card: #ffffff        ✓
--surface-border: #e5e7eb      ✓ idèntic
--accent-main: #13ec6d         ✓ tens accent verd, brillant; Sanity taronja
--warning-main: #f59e0b
--error-main: #dc2626
```

**On em separo de Sanity**: jo faig servir `surface-base` (gris clar) molt
sovint com a "bg dels inputs". Sanity prefereix `surface-card` sempre i
diferencia per border. Resultat visual: el meu té més contrast intern,
Sanity més respiració.

---

### Payload v3 — el segon referent

Payload té el mateix esperit que Sanity però amb decisions una mica més
"developer-pragmatic":

#### 2.1 Tipografia

- Mateixa idea: Inter Variable, sense uppercase als labels.
- Labels una mica més evidents que Sanity (text-main directament, no
  text-secondary).
- Botons primaris amb `font-medium` (no `font-semibold` com Sanity).

#### 2.2 Inputs

Payload manté la box pero la fa molt subtil:

- `bg: rgba(0,0,0,0.02)` (semi-transparent) — més suau que el meu
  `bg-surface-base`.
- `border: 1px rgba(0,0,0,0.08)` — semi-transparent també.
- Aquest pattern fa que els inputs es vegin però no destaquin.

#### 2.3 Paleta

Una mica més verda que Sanity (el seu accent és `#06f` blau-ish per links,
verd per success). Però segueixen la regla d'or: **una paleta extremadament
restringida, accent només per a CTA principals i status indicators**.

---

## 2. Diagnòstic del meu dashboard actual

### 2.1 Inventari de classes tipogràfiques als formularis admin

Tres patrons coexisteixen ara mateix:

**Pattern A — Labels de Field/TaxonomyCombobox/ColorField/PlainTextarea**:
```
text-body-sm text-text-secondary uppercase tracking-wider
```
Aspecte: TÍTOL, ROL, CATEGORIA, CLIENT, ANY, ACCENT COLOR, etc.

**Pattern B — Labels de ImageUploadField (variant: heading)**:
```
text-body-md font-light text-text-secondary
```
Aspecte: "Background Image", "Thumbnail" (sense caps, més sobri).

**Pattern C — Captions del thumbnail card-info** (File Name, Alt Text):
```
text-body-sm text-text-secondary leading-tight
```
Aspecte: text gris suau, sense caps.

**Veredicte**: Pattern A és l'únic problemàtic. Pattern B i C ja són
sanity-style. Si vols uniformitat, has d'eliminar Pattern A i convertir-lo
a Pattern C arreu.

### 2.2 Inventari de colors usats freqüentment al dashboard

| Color | Freqüència | Ús actual |
|---|---|---|
| `text-text-main` | Alta | Valors d'inputs, h2 |
| `text-text-secondary` | Alta | Labels, captions, placeholders |
| `bg-surface-card` | Alta | Card body |
| `bg-surface-base` | **Molt alta** | Background de TOTS els inputs, fons de la pàgina |
| `border-surface-border` | Alta | Tots els borders |
| `bg-warning-surface` + `text-warning` | Mitja | Badges d'avisos |
| `bg-accent-surface` | Baixa | Pill "Publicat" |
| `bg-error-surface` + `text-error` | Baixa | Botons "Eliminar", validacions |
| `bg-text-main` | Mitja | Pills active (CA del LocaleSwitcher), botó primari "Desar canvis" |

**Veredicte**: la paleta està restringida (bo). El que crida atenció és
la presència de `bg-surface-base` als inputs sobre `bg-surface-card` (Card).
És un patró Material/Carbon més que Sanity. Si volem Sanity-style: inputs
sobre `bg-transparent`.

### 2.3 Coherència font-family

- `font-sans` (Grtsk/Inter) per tota la UI ✓
- `font-mono` només per ColorField hex (ja tret) i alguns valors numèrics
  ja tret de l'OverlaySlider ✓
- No hi ha mixing problemàtic ✓

---

## 3. Pla d'auditoria per a aquesta iteració

Priortizat per impact/risc:

### Fase A — Quick wins (impacte alt, risc baix)

**A1. Treure uppercase tracking dels labels de form**

Convertir Pattern A (`text-body-sm uppercase tracking-wider`) a un nou
patron uniforme (`text-body-sm font-medium text-text-secondary`). Afecta:

- `Field` component al `WorkForm.tsx` (label)
- `TaxonomyCombobox.tsx` (label trigger + dropdown headers)
- `ColorField.tsx` (label)
- `PlainTextarea` al `WorkForm.tsx` (label)
- `Input` + `Textarea` al `WorkContentEditor.tsx` (label)
- `Checkbox.tsx` o equivalent
- `ImageUploadField.tsx` (label variant 'caps')

Risc: baix. Visual change global però testejable en 30 minuts.

**A2. Reduir bg dels inputs a transparent (opció)**

Provar `bg-transparent` als inputs i veure si la lectura millora sobre
`bg-surface-card` (blanc del Card). Si queda confús (perd visibilitat),
mantenir `bg-surface-base/40` molt subtil.

Risc: mig. Pot afectar percepció d'inputs editables si no es fa bé.
Recomanació: A/B mental — fer una branca, comparar, decidir.

**A3. Tipografia del header de secció**

El `<h2>` actual del Card és `text-body-lg font-medium`. Sanity-style és
`text-[18-20px] font-semibold`. Pots considerar pujar el pes a
`font-semibold` per donar més "presència" al títol de secció (la peça
més important del card).

Risc: nul.

### Fase B — Refactor mitjà (impacte mig, risc baix)

**B1. Tokens de tipografia explícits**

Crear classes utilitàries semàntiques noves que substitueixin l'ús direct
de `text-body-sm uppercase tracking-wider`. Per exemple:

```css
.field-label {
  font-size: 13px;
  line-height: 1.4;
  font-weight: 500;
  color: var(--text-secondary);
}
.field-value {
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-main);
}
```

Així el dashboard té un sol punt de canvi i no haig d'editar 8 fitxers.

Risc: baix però implica edició de globals.css.

**B2. Densitat vertical**

Augmentar `gap-` entre fields del 6 (24px) a 8 (32px) en seccions amb pocs
fields (com Hero RIGHT col). Sanity dóna molta més respiració vertical que
nosaltres. Afecta sensació de "calma" al form.

Risc: nul. Pot accentuar scroll en seccions denses però acceptable.

### Fase C — Refactor visual gros (potser per a una altra iteració)

**C1. Reducció del bg-surface-base**

Repensar TOTS els llocs on faig `bg-surface-base` com a fons d'input/card
i decidir cas a cas si val la pena (Sanity ho usa NOMÉS per al wrapper
extern de l'app, no per inputs).

**C2. Animation tokens**

Definir `--transition-quick` (150ms ease-out) i `--transition-slow` (300ms)
i aplicar uniformement. Sanity té transicions consistents a tot arreu.

---

## 4. Captures i referències consultades

- Sanity Studio v3: https://www.sanity.io/docs/structure-builder
- Sanity Form Components: https://www.sanity.io/docs/form-components-api
- Payload v3 docs: https://payloadcms.com/docs/getting-started/installation
- Payload showcase: https://payloadcms.com/showcase
- Notion (per a TaxonomyCombobox ref): https://www.notion.so

Tots tenen captures embedded a la documentació; visualitza'ls al costat
del meu dashboard amb dev tools obert per veure font-size i color exactes.

---

## 5. Recomanació de seqüència

1. **A1** — treure uppercase tracking dels labels. Implementable en 30
   minuts amb un sol commit. Avalua si t'agrada el resultat.
2. **A3** — pujar pes del h2 de secció a semibold. 5 minuts.
3. **A2** — provar inputs amb bg transparent. Si funciona, perfecte;
   si no, revert.
4. Si totes 3 t'agraden → **B1** crear tokens semàntics i refactoritzar.
5. **B2** — respiració vertical en seccions amb pocs fields.

Cada pas és isolat i reversible. Després d'A1+A3, és probable que el
dashboard ja "respiri" bastant proper a Sanity sense canvis estructurals.
