# Coherència de tokens Figma ↔ Codi

_19 juny 2026 · auditoria de les variables locals de Figma (fitxer MariusFreelance) i comparació amb `globals.css`_

## Per què aquest document

L'auditoria de codi prèvia ([tokens-audit](./tokens-audit-2026-06-19.md)) deia que `globals.css` està inflat. Aquesta segona part mira **l'altre costat**: les variables locals de Figma. La conclusió és que **la complexitat ve d'origen** — Figma té **162 variables en 9 col·leccions** amb modes múltiples, i el codi n'és un mirall parcial. Per simplificar de veritat cal retallar **als dos llocs alhora**, si no es tornen a desincronitzar.

---

## 1. Inventari de variables locals a Figma

| Col·lecció | Variables | Modes | Mapeig al codi |
|---|---|---|---|
| **colors** | 20 | Light · Dark | ~1:1 amb `globals.css` |
| **buttons-colors** | 35 | Primary · Secondary · Tertiary | només el mode *Primary* existeix al codi |
| **buttons-properties** | 27 | SM · MD · LG · XL | col·lapsat a 10 vars al codi |
| **buttons-radius** | 1 | SM · MD · LG · XL | no existeix com a token al codi |
| **radius** | 2 | SM · MD · LG · XL | col·lapsat a 1 valor (16px) al codi |
| **fonts** | 57 | Desktop · Tablet · Mobile | mirall 1:1 via `clamp()` |
| **system** | 3 | — | `--font-family-*` |
| **spaces** | 13 | Desktop · Tablet · Mobile | **definit al codi però 100% mort** |
| **shadows** | 4 | Soft · Medium · Hard | **no existeix al codi** (hardcoded) |
| **TOTAL** | **162** | | |

> 162 variables Figma + ~123 al codi. La major part del soroll viu a **buttons** (63 vars a Figma) i **fonts** (57).

---

## 2. Matriu de coherència (on diverteixen Figma i codi)

### 🔴 Botons — la divergència més gran

Figma modela **tres esquemes de color de botó** (Primary / Secondary / Tertiary) com a modes de `buttons-colors`, i **quatre mides** (SM/MD/LG/XL) a `buttons-properties`. El codi (`Button.tsx`) només implementa:

- **un sol esquema de color** (el mode *Primary*) → Secondary i Tertiary estan dissenyats a Figma però **mai construïts**.
- **tres mides** (sm/md/lg) → falta XL; i la tipografia per breakpoint s'ha col·lapsat en clamp.

A més, al codi el **hover del solid és redundant** (`--solid-hover-*` = `--solid-default-*`); a Figma, en canvi, Solid/Hover sí que té valors propis per mode. → Decisió: o construïm Secondary/Tertiary, o els **eliminem de Figma** per no documentar variants fantasma.

### 🔴 Spaces — Figma els té, el codi els ignora

Figma té un sistema d'espaiat de secció complet i responsiu:

```
section/gap     XL 96/64/48 · LG 64/48/40 · MD 48/32/32 · SM 24/24/16   (Desktop/Tablet/Mobile)
section/padding x-XL 96/48/32 ... y-XL 284/192/192 ... y-XS 24/24/24
```

El codi va mirallar-ho (`--section-padding-*`, `--section-gap-*`) però **aquests tokens tenen 0 usos** — els components fan servir classes Tailwind a ull. És la incoherència més cara: **Figma dissenya amb tokens d'espai, el codi no els respecta.** Dues sortides coherents:

- **A)** Cablejar els components perquè consumeixin aquests tokens (alinear codi → Figma).
- **B)** Acceptar que el codi fa servir l'escala de Tailwind i **esborrar els tokens morts** + documentar la decisió.

### 🟡 Shadows — només a Figma

Figma té `shadows` (Soft/Medium/Hard: Y 4/8/16, blur 10/20/30, color #000 @3/10/15%). El codi **no té cap token d'ombra** — `Button.tsx` les hardcodeja (`drop-shadow-[0px_4px_10px_rgba(0,0,0,0.08)]`). → O afegim 1 token d'ombra al codi, o assumim que les ombres són decisió de codi i ho documentem.

### 🟡 Radius — Figma responsiu, codi pla

Figma: `card-radius` 4/8/12/16 i `image-radius` 2/4/8/12 (SM→XL). El codi només usa el valor XL=16 i el **duplica** (`--card-radius` + `--radius-base`, els dos 16px). A més `image-radius` **no existeix al codi**. → Deixar 1 sol token de radi al codi i, si mai cal, recuperar l'escala.

### 🟡 Colors — quasi alineats, amb 3 esquerdes

| Token | Figma | Codi | Nota |
|---|---|---|---|
| `surface/image` (#D4D4D4) | ✅ | ❌ | Figma el té, el codi no |
| `primary/surface` (#efebe7) | ❌ | ✅ (0 usos) | orfe al codi, no existeix a Figma |
| `text-fixed-*` (4 tokens) | ❌ | ✅ | **decisió de codi correcta** (heros amb fons fix), documentada |
| `primary/hover` | ✅ | ✅ (0 usos com a classe) | existeix als dos, infrautilitzat |
| `*-inverse` (surface base/border) | ✅ | ✅ (0 usos) | existeix als dos, mort al codi |

### 🟢 Tipografia — mirall 1:1 (però amb classes mortes al codi)

`fonts` (57) replica exactament l'escala del codi (Display H1-H5, Heading H1-H4, Body 2xl/XL/LG/MD/SM, Caption, Button) amb modes Desktop/Tablet/Mobile → els valors quadren amb els `clamp()` de `globals.css`. **Però** al codi hi ha classes a 0 usos: `display-h3`, `caption`, `heading-h1-fluid`. Com que `display/H3` i `caption` **sí existeixen a Figma**, qualsevol poda al codi s'ha de fer **també a Figma** per mantenir el mirall.

---

## 3. Pla unificat de simplificació (Figma + codi alhora)

L'ordre està pensat perquè cada pas deixi els dos costats coherents.

1. **Decidir l'abast dels botons** 🔴 — la pregunta de fons: vols Secondary i Tertiary? Si no entren al roadmap, **esborra els modes Secondary/Tertiary** de `buttons-colors` a Figma (−~23 vars) i deixa només Primary, igual que el codi. Si els vols, cal construir-los al codi. Mentrestant, treu el hover redundant del solid al codi.
2. **Resoldre `spaces`** 🔴 — tria A (cablejar) o B (esborrar tokens morts del codi). La meva recomanació: **B** a curt termini (treus 8 tokens morts del codi) i, si vols rigor, **A** com a millora futura. A Figma, `spaces` es queda perquè sí s'usa als dissenys.
3. **Unificar radius** 🟡 — codi: deixa només `--radius-base`. Figma: conserva l'escala responsiva (és barata i s'usa).
4. **Decidir shadows** 🟡 — afegeix 1 token d'ombra al codi que apunti al valor "Soft" de Figma, o documenta que les ombres són hardcoded. Evita tenir-les definides a Figma i invisibles al codi.
5. **Podar tipografia als dos costats** 🟢 — si `display-h3`/`display-h5`/`caption` no s'usen ni al codi ni als dissenys de Figma, esborra'ls **a tots dos**. Si Figma els fa servir en alguna pantalla, mantén-los i crea la classe al codi.
6. **Netejar colors orfes** 🟢 — codi: treu `--primary-surface` (0 usos, no és a Figma). Figma: decideix si `surface/image` ha d'existir també al codi (si es fa servir per a thumbnails).

### Objectiu de coherència

Que **cada token viu a Figma tingui exactament un equivalent al codi i a la inversa**, excepte les excepcions documentades a consciència (`text-fixed-*` només codi; `spaces` només a Figma si es tria l'opció B). Avui hi ha ~30 tokens que viuen en un sol costat sense que sigui una decisió explícita — aquest és el veritable origen de la sensació que "s'ha complicat".

---

## Apèndix · Valors clau llegits de Figma

**colors (Light / Dark)** — primary: main `1A1A1A`/`F2F2F2`, hover `737373`/`737373`. text: main `0B0B0B`/`F2F2F2`, secondary `444749`/`999999`, main-inverse `F2F2F2`/`262522`, secondary-inverse `999999`/`4D5153`. surface: base `F2F2F2`/`262522`, card `FFFFFF`/`0A0A0A`, border `E5E7EB`/`8A8A8A`, image `D4D4D4`/`D4D4D4`, +inverses. error: main `DC2626`/`F87171`, surface `FEF2F2`. warning: main `F59E0B`, surface `FFFBEB`. accent: main `13EC6D`, hover `0FC55C`, surface `E7FCF0`/`06301B`.

**system** — font-family-heading `Grtsk`, font-family-body `Grtsk`, project-name `Màrius Freelance`.
