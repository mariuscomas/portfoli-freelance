# Anàlisi de disseny gràfic — Brandbook Marius

_Revisió de marca personal (Freelance Product Designer) · format presentació 1920×1080 · estat: avançat / quasi final_

## Visió general

El brandbook té una **identitat sòlida i confiada**: monocroma, geomètrica i ben sistematitzada. El punt fort indiscutible és el **sistema de logotip** (wordmark amb caràcter + monograma + badge). El punt feble transversal és la **jerarquia i l'ús de l'espai a les pàgines de contingut**, més uns quants **acabats pendents** (Lorem ipsum, anys de copyright, contrast de grisos) que delaten que encara no està tancat.

Biggest opportunity: passar de "documenta el que tinc" a "dirigeix com s'ha d'usar" — proporcions de color, regles d'ús i jerarquia tipogràfica formalitzades.

---

## 1. Sistema de logotip 🟢 (el millor)

El wordmark **MÅR!US.** és distintiu i memorable: el màcron sobre la A, la "!" substituint la I i el punt final el converteixen en una marca amb veu pròpia partint de Poppins. El conjunt (wordmark + monograma "M." + badge circular) és coherent i versàtil, com demostren ara les aplicacions (firma, targeta, avatar, favicon, web).

| Observació | Severitat | Recomanació |
|---|---|---|
| La pàgina de construcció ("Logo Guia") encara té text **Lorem ipsum** | 🟡 Moderat | Redacta la regla real: àrea de respir, mida mínima, construcció a partir de la "A". |
| Falta una pàgina de **"misusos"** (què NO fer amb el logo) | 🟡 Moderat | Afegeix exemples prohibits: deformar, rotar, recolorir, posar sobre fons sense contrast. |
| Conviuen versions "2025/Logo" amb fills lligats a variable remota | 🟢 Menor | Documenta versió positiva/negativa explícitament per evitar que surti invisible en reutilitzar. |

---

## 2. Tipografia 🟡

**Poppins** a tot el sistema, amb tracking de ~2% als rètols i pesos Light/Regular/SemiBold/Bold. La tria és coherent amb el to "product designer" net i geomètric.

| Observació | Severitat | Recomanació |
|---|---|---|
| **Jerarquia feble a les pàgines de contingut** (Brand Aim): títol i cos quasi a la mateixa mida, tot petit i centrat al mig d'un llenç enorme | 🔴 Crític | Defineix una escala tipogràfica clara (p. ex. H1 64 / H2 32 / Body 18) i aplica-la. El Brand Aim hauria de respirar amb un títol gran i el cos a una columna llegible. |
| **Cos de text justificat** (Brand Aim, descripcions) crea "rius" i espais irregulars | 🟡 Moderat | Alinea a l'esquerra (ragged right); millora llegibilitat i sensació editorial. |
| No hi ha **pàgina de tipografia** que documenti la font, pesos i escala | 🟡 Moderat | Afegeix un specimen: nom de la font, pesos, escala i exemples d'ús. |
| Dues famílies conviuen (Poppins de marca + **SF Pro** als mockups socials) | 🟢 Menor | Aclareix que SF Pro és contextual (UI de tercers), no de marca. |

---

## 3. Color 🟡

Paleta **mínima i atemporal**: `#191919` (quasi negre) + `#FFFFFF`. Funciona per a una marca personal sòbria, però la documentació es queda curta respecte al que el fitxer realment fa servir.

| Observació | Severitat | Recomanació |
|---|---|---|
| Només es documenten 2 colors, però a la pràctica s'usen diversos grisos (`#808080`, `#B3B3B3`, `#666`, `#CCC`) per a rètols i peus | 🔴 Crític | Formalitza una **rampa de neutres** (p. ex. Gray 90/70/50/30/10) amb rols definits (text, secundari, línies). Evita grisos "a ull". |
| Cap **proporció d'ús** ni jerarquia de color | 🟡 Moderat | Indica dominància (p. ex. 80% blanc / 15% negre / 5% gris) i on s'aplica cada to. |
| Sense color **d'accent** | 🟢 Menor | Opcional: un únic accent (ja existeix un `#E7961C`/`#C45FEF` perdut entre tokens) pot donar energia a CTA i highlights sense trencar la sobrietat. |

---

## 4. Graella, composició i espai 🟡

El sistema de **chrome** (capçalera `MARIUS | BRANDBOOK`, peu `COPYRIGHT` + número de pàgina) és consistent i dona unitat — molt bé. El problema és la **col·locació del contingut dins el llenç**, que canvia de criteri pàgina a pàgina.

| Observació | Severitat | Recomanació |
|---|---|---|
| Composicions desiguals: Brand Aim (bloc minúscul centrat), Color (split a sang), Logo (contingut a l'esquerra + descripció avall-dreta) | 🟡 Moderat | Defineix una **graella base** (p. ex. 12 col / marges 80px) i ancora-hi tots els continguts amb el mateix criteri. |
| **Espai en blanc poc intencional**: a Brand Aim i Color el buit llegeix com "buit", no com "respir" | 🟡 Moderat | O omple amb suport visual (citació gran, dada, imatge de marca) o redueix l'alçada útil per crear tensió controlada. |
| Format **16:9 horitzontal** per a un brandbook | 🟢 Menor | Bé per presentar; per compartir/imprimir, considera exportar també un PDF vertical o seqüència scrollable. |

---

## 5. Consistència i acabats 🔴

Detalls que cal tancar abans de considerar-lo final:

| Element | Problema | Recomanació |
|---|---|---|
| Any de copyright | Portada diu **©2025**, pàgines interiors **©2021** | Unifica a ©2025. |
| Text de farciment | **Lorem ipsum** a la pàgina de construcció del logo | Substitueix per la regla real. |
| Numeració | Les 3 primeres slides (Portada, Brand Aim, Color) no tenen número | Numera-les o decideix conscientment ometre-les. |
| Textura de fons | Soroll/grain en unes slides i fons pla en d'altres | Decideix-ho com a regla (tot amb textura subtil o tot pla). La textura, si es manté, que sigui molt lleu per no enterbolir. |

---

## 6. Llegibilitat i contrast 🟡 (accessibilitat)

| Combinació | Ràtio aprox. | WCAG AA (text normal 4.5:1) |
|---|---|---|
| Negre `#191919` sobre blanc | ~18:1 | ✅ Excel·lent |
| Gris `#808080` (rètols/peus 16px) sobre blanc | ~3.9:1 | ❌ Falla (passa només com a text gran) |
| Gris `#B3B3B3` (headers de sistema) sobre blanc | ~2.3:1 | ❌ Falla |
| Cos gris justificat (Brand Aim) sobre fons texturat | < 4.5:1 | ❌ Falla + llegibilitat baixa per mida i justificat |

**Recomanació:** puja els grisos de text a mínim `#595959` (~7:1) per a cos i `#737373` (~4.6:1) per a rètols secundaris. El text crític (Brand Aim) hauria de ser prou gran i prou fosc per llegir-se còmodament.

---

## El que funciona bé ✅

- **Logotip amb personalitat** i família coherent (wordmark / monograma / badge).
- **Sistema de capçalera-peu** consistent que cohesiona tot el document.
- **Restricció monocroma** elegant i alineada amb el posicionament.
- **Aplicacions reals** (firma, targeta, avatar, favicon, web) que demostren versatilitat.

---

## Prioritats (per impacte)

1. **Jerarquia tipogràfica** 🔴 — Defineix i aplica una escala (H1/H2/Body). Reescriu Brand Aim amb títol gran, cos alineat a l'esquerra i mida llegible. És el canvi que més apuja la percepció de qualitat.
2. **Formalitza la rampa de neutres + contrast** 🔴 — Documenta els grisos reals amb rols i puja'ls perquè passin AA. Elimina grisos "a ull".
3. **Tanca els acabats** 🟡 — Copyright unificat, fora Lorem ipsum, numeració i textura coherents. Detalls que separen "esborrany" de "final".
4. **Graella única + pàgina de misusos del logo** 🟡 — Ancora tot el contingut a una graella i afegeix les regles de "què no fer".
