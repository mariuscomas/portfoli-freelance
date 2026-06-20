# Mapa de textos sense estil — coherència tipogràfica

_19 juny 2026 · auditoria dels textos "solts" (editables, fora de components) sense estil aplicat a les 4 pàgines de disseny del fitxer MariusFreelance_

## Conclusió clau

**No hi ha cap vinculació automàtica segura disponible** (0 coincidències exactes a les pàgines de producte). Els textos sense estil no encaixen amb el sistema, per tres motius:

1. **L'admin està dissenyat en Inter, no en Grtsk** — dels 200 textos solts de `01_Wireframes_Admin`, **195 són Inter** i només 5 Grtsk. Mai va fer servir el sistema tipogràfic.
2. **Mides fora d'escala** (11/12/13/15/18px) i pesos (Medium/Bold/Semi Bold) que no existeixen al sistema Grtsk.
3. **El font Grtsk està "missing"** ara mateix a Figma → bloqueja aplicar estils tant per codi com (amb avís) a mà.

> Per tant, fer coherents aquests textos **no és vincular un estil** (canvi zero), sinó un **repàs de disseny** (canviar font + mida + estil). Cap acció automàtica segura és possible. No s'ha aplicat res.

---

## Prerequisit abans de qualsevol repàs

**Reactivar el font Grtsk** al Figma desktop (Manage fonts / activar la família). Sense Grtsk actiu no es pot aplicar cap estil del sistema, perquè tots els estils el fan servir.

---

## Per pàgina

### 🔴 01_Wireframes_Admin — 200 solts · prioritat alta
Font real: **Inter 195 / Grtsk 5**. Tot fet amb el font per defecte. Senyal actual → acció recomanada:

| Senyal (Inter) | Compte | Recomanació |
|---|---|---|
| Medium 12px (pills/rètols UPPER: "TREBALL · EDICIÓ", "CA") | 57 | `Others/Caption` (Grtsk Reg 14/16 +0.3 UPPER) **o** nou estil `UI/Label 12` |
| Regular 13px (text UI) | 46 | nou `UI/Body 14` **o** `Buttons/Link` (14/14) |
| Regular 15px | 27 | `Body/XS - Regular` (16/28) o nou UI |
| Regular 14px | 26 | `Buttons/Link` / `Buttons/Large` |
| Regular 12px | 14 | `Others/Caption` / `UI/Label` |
| Bold 14px | 5 | nou `UI/Label Bold` (l'estil Table/TH s'ha eliminat) |
| Light/Semi Bold/Medium 14–15px | ~13 | unificar a Grtsk Regular + estil UI |
| Medium 28px (títols secció) | 3 | `Heading/H3 - Regular` (24/32) o `Heading/H2` |

**Decisió de fons:** el sistema no cobreix text d'UI petit (12–14px) — salta de Buttons 14 → Body/XS 16 → Body/SM 20. Per a una UI densa com l'admin, val més **estendre el sistema** amb 1–2 estils petits que no forçar les mides grans editorials (veure recomanació final).

### 00_Wireframes (web pública) — 118 solts
| Senyal | Compte | Recomanació |
|---|---|---|
| Regular 8.11px / 6.95px / SemiBold 10.43px i altres fraccionals | ~40 | **IGNORAR** — són mockups escalats (pantalles reduïdes a thumbnail) |
| SemiBold Giga 112px | 4 | `Display/H1` (revisar lh/ls; hauria de ser H1) |
| Regular 24px | 7 | `Body/MD - Regular` (24/32) o `Heading/H3 - Regular` |
| Light 20px | 6 | `Body/SM - Light` (20/28) |
| Light 16px | 4 | `Body/XS - Light` (16/28) |
| Light 18px / Regular 18px | 16 | fora d'escala (no hi ha 18px) → decidir 16 o 20 |
| Light 14px / Medium 11px (labels form "EMAIL *") | 12 | `Others/Caption` o estil petit |

→ ~25 textos reals a vincular; la resta són previews a ignorar.

### 02_Media — 26 solts
7 ja són **Grtsk i farien match net** (es vincularan automàticament quan Grtsk torni a estar actiu — t'ho puc executar jo). La resta (Bold 300px i fraccionals) són decoració/mockup → ignorar.

### 03_Cupra — 117 solts · prioritat baixa
Case study amb **fonts de client**: Poppins 60, Cupra 23, Inter 18, Grtsk 8. Mides fraccionàries i gegants (266/185px) = mockups escalats. **Recomanació: deixar-ho com a contingut de case-study** — no s'ha d'aplicar el sistema Grtsk al contingut de marca Cupra. Revisar només la UI pròpia si n'hi ha.

---

## Recomanació de sistema (abans del repàs admin)

El sistema editorial actual no té escala petita d'UI. Per a interfícies denses, considera afegir a Figma 1–2 estils:

- `UI/Label` — Grtsk Regular 12/16, +0.2, UPPER (rètols, pills, badges)
- `UI/Body` — Grtsk Regular 14/20 (text d'interfície, taules, formularis)

Així l'admin tindria estils natius sense haver de pujar tot el text a mides editorials (16/20px).

## Ordre suggerit

1. **Reactivar Grtsk** (bloquejant).
2. (Opcional però recomanat) afegir `UI/Label` + `UI/Body`.
3. **Admin**: substituir Inter → Grtsk i aplicar estils (la feina grossa).
4. **00_Wireframes**: vincular els ~25 reals (H1 112, body 24/20/16), ignorar mockups.
5. **02_Media**: vincular els 7 Grtsk (automatitzable).
6. **03_Cupra**: deixar el contingut de marca; revisar només UI pròpia.

> Quan Grtsk torni a estar actiu, els passos 4 i 5 (i el bind segur en general) te'ls puc executar jo per codi amb canvi visual zero.
