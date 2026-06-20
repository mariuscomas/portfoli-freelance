# Auditoria de tokens i estils — `globals.css`

_19 juny 2026 · objectiu: simplificar el sistema sense perdre el que s'usa de veritat_

## Resum executiu

`globals.css` té **541 línies**, **~123 variables CSS** i **17 classes tipogràfiques**. L'ús real, però, està molt concentrat: 4-5 tokens fan el 90% de la feina i una part important del fitxer són tokens **morts (0 usos)** o **redundants** (un token que apunta a un altre amb el mateix valor).

La complicació no ve del codi sinó d'haver **espelmat 1:1 tot el que hi ha a Figma** —inclosos estats, modes responsius i famílies "inverse"— quan a la pràctica el portfolio només en fa servir una fracció. Es pot retallar a la meitat mantenint el contracte amb Figma per al que realment es pinta.

Estalvi estimat: **~50 variables i ~3 classes eliminables** sense tocar cap pantalla.

---

## 1. Tokens morts (0 usos a tot `src/`) — eliminar

| Token / classe | Usos | Nota |
|---|---|---|
| `--section-padding-x-xl/-lg`, `--section-padding-y-xl/-md/-sm` | **0** | 5 tokens. El padding de secció es fa amb classes Tailwind directes, no amb aquests. |
| `--section-gap-xl/-lg/-md` | **0** | 3 tokens. Mateix cas. |
| `.text-display-h3` | **0** | Classe definida, mai aplicada. |
| `.text-heading-h1-fluid` | **0** | Variant "fluid" que no s'usa enlloc. |
| `.text-caption` + `--caption-*` (4 vars) | **0** | Ni la classe ni els tokens s'apliquen. |
| `bg/text-primary-hover` | **0** | El hover de botó ja es resol via `--solid/outline/ghost`. |
| `bg/text-primary-surface` | **0** | Mai usat com a classe. |
| `*-accent-hover` | **0** | L'accent s'usa pla (67 cops), mai el hover. |
| `surface-base-inverse`, `surface-border-inverse` | **0** | De la família "inverse" només `surface-card-inverse` té 3 usos. |

> **Acció:** treure aquests ~16 tokens i 3 classes. Si en algun moment es necessita el padding/gap de secció com a token, es torna a afegir; ara mateix és pes mort.

---

## 2. Redundàncies — col·lapsar

**Hover de botó "solid" que no fa res.** `--solid-hover-background` i `--solid-hover-font-color` apunten als **mateixos valors** que el default (`primary-main` / `text-main-inverse`). El hover visualment no canvia res → es poden eliminar i deixar que el feedback el doni el `whileTap`/light-effect que ja tens.

**Dos radis idèntics.** `--card-radius: 16px` i `--radius-base: 16px` tenen el mateix valor. `--card-radius` només s'usa **1 cop**, `--radius-base` **12 cops**. → Deixar només `--radius-base` i esborrar `--card-radius` + el seu mapeig `--radius-card`.

**Família `*-inverse` infrautilitzada.** De `text-*-inverse` + `surface-*-inverse` (9 tokens), només `text-main-inverse` (45) i `text-secondary-inverse` (9) i `surface-card-inverse` (3) s'usen. Els altres 6 estan a 0. → Conservar els 3 que s'usen, eliminar la resta.

**`text-fixed-*-secondary`.** `text-fixed-light-secondary` i `text-fixed-dark-secondary` tenen **1 ús cadascun**. Avaluar si val la pena mantenir-los com a token o passar-los a valor literal en aquell únic lloc.

---

## 3. Tipografia — escala sobredimensionada

L'ús real (recompte d'usos) mostra que la jerarquia efectiva són **3 nivells de body** i **1-2 de heading**:

```
body-sm    161  ← workhorse absolut
body-md     63
body-lg     40
heading-h1  14
body-2xl     5 · body-xl 4 · heading-h2 4 · display-h4 3 · heading-h3 3 · heading-h4 3
display-h1   2 · display-h2 1 · display-h5 1 · button-lg 1
display-h3   0 · heading-h1-fluid 0 · caption 0
```

**Problema:** mantens 5 nivells de `display/*` quan només `h1` i `h4` superen 1 ús, i `h3` està a 0. Cada nivell arrossega 3 tokens responsius (size/line/letter) → molta superfície per a poc retorn.

**Proposta:** quedar-te amb `display-h1`, `display-h4` (els dos que es fan servir) i, com a molt, un nivell intermedi. Eliminar `display-h2/h3/h5` si no entren al roadmap immediat. Igual amb `body`: els 5 nivells sí que s'usen tots, així que aquí **no toquis res** — és l'escala sana del sistema.

---

## 4. Soroll de documentació

El fitxer porta molts comentaris `/* NOU */`, `/* Figma: ... */` i `/* Figma sync: ... */` línia a línia. Són útils en migració però ara **dupliquen la informació** i fan el fitxer 2× més llarg de llegir. Recomanació: un bloc de capçalera curt amb la referència a Figma i treure els inline `Figma: x/y` repetits (el nom del token ja ho diu).

---

## 5. Pla de simplificació (ordre suggerit)

1. **Esborrar morts** (secció 1): ~16 tokens + 3 classes. Risc zero, són 0 usos.
2. **Col·lapsar redundàncies** (secció 2): hover solid, `card-radius`→`radius-base`, `*-inverse` no usats. Risc baix.
3. **Retallar escala display** (secció 3): treure `display-h2/h3/h5`. Risc baix (≤1 ús cadascun, fàcil de substituir).
4. **Netejar comentaris** (secció 4): cosmètic, deixa el fitxer molt més llegible.

**Resultat estimat:** de ~123 → ~70 variables, de 17 → 14 classes, i el fitxer baixa de 541 a ~330 línies. Tot el que es pinta avui segueix funcionant igual.

### El que NO s'ha de tocar (funciona bé)
- Les 5 escales de `body/*` — totes en ús actiu.
- `text-main` / `text-secondary` / `surface-*` / `accent` — el nucli que sosté el 90% de les pantalles.
- L'estratègia de mapeig propi→Tailwind `@theme` i els `text-fixed-*` per a heros (decisió correcta i justificada).
- El component `Button` i els seus tokens `solid/outline/ghost` (excepte el hover redundant del solid).
