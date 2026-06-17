# Anàlisi tipogràfica Motto → recomanacions per al portfoli

Anàlisi de patrons tipogràfics i de layout a wearemotto.com (case studies Performance Golf + Cresta) i comparació amb la maquetació actual de `WorkDetailLayout` + `WorkDetailSection` + bloc de conclusió. Pensat per identificar diferències concretes i proposar canvis quantificats.

L'anàlisi s'enfoca en els tres blocs que vas marcar: seccions de cas (number + heading + body), body copy llarg, i conclusió/cua del cas. El hero no s'inclou perquè el vas excloure.

---

## 1. Seccions de cas (bloc "01 / Project Overview → Heading → Body")

### Valors mesurats a Motto (viewport 1440 px)

| Element | Mida | Line-height | Pes | Color |
|---|---|---|---|---|
| Numeració (01) | 20.16 px | 27.82 (1.38) | 500 | #000 |
| Títol secció (Project Overview) | 20.16 px | 27.82 (1.38) | 500 | #000 |
| Heading principal | 48 px | 54.72 (1.14) | 500 | #000 |
| Body paragraphs | 20.16 px | 27.82 (1.38) | 500 | #4D5153 |

Layout: grid 12 cols amb gap **23 px**. Columna esquerra `col-span-2` (~195 px), dreta `col-span-6` (~631 px) començant a `col-start-6` (deixa cols 11-12 buides). Padding vertical entre seccions: **pt-226 px / pb-250 px**.

### Valors actuals al teu codi (desktop, `WorkDetailSection.tsx` mode visual)

| Element | Token | Mida desktop | Line-height | Pes |
|---|---|---|---|---|
| Numeració | `text-xl` | 20 px | 1.75 (28px) | regular |
| Títol secció | `text-2xl` | 24 px | 1.33 (32px) | medium |
| Heading | `text-heading-h1` | 56 px | 64 / 1.14 | medium |
| Body | `text-body-xl` (font-light) | 32 px | 48 / 1.5 | light (300) |

Layout: `flex flex-col md:flex-row gap-12 lg:gap-24` (48-96 px de gap). Columnes `w-5/12` + `w-7/12`. Padding vertical entre seccions: `pb-16 md:pb-32` (64-128 px).

### On divergim

El body és el que canta més. Motto fa el body a **20 px** (mateixa mida que la metadata), mentre que tu el tens a **32 px**. Aquesta diferència de 1.6× canvia totalment el "to" — el teu cas study es llegeix com una declaració emfàtica permanent, el de Motto com una conversa serena on els headings sí destaquen. La conseqüència visual és que a Motto la jerarquia és clara (heading 48 / body 20 = ratio 2.4×), mentre que la teva té un contrast més baix (heading 56 / body 32 = ratio 1.75×) que aplana la lectura.

El pes del body també diverteix. Tu uses `font-light` (probablement 300) i Motto **500** (medium). Light a 32 px llueix elegant; a 20 px començaria a perdre presència. Si baixes la mida del body, t'has de plantejar pujar el weight.

El ritme vertical entre seccions és l'altra diferència crítica: tu uses 64-128 px, Motto 226-250 px. Quasi **el doble**. Motto deixa que cada bloc respiri molt; tu els empaquetes més. Si el teu objectiu és lectura contemplativa estil agencia, val la pena pujar el padding vertical.

El gap entre columnes va a la inversa: tu en tens 48-96 px, Motto només 23 px (el column-gap del seu grid). El gap petit els permet mantenir la sensació de "una sola columna" amb la metadata flotant a l'esquerra com a marginalia. Tu tens més separació, que pot funcionar però segrega visualment els dos blocs.

### Recomanacions concretes

Primer canvi (alt impacte, baix risc): canviar el body de `text-body-xl` a **`text-body-lg`** (24 px desktop / 18 px tablet / 14 px mobile segons els teus tokens) i pujar el pes de `font-light` a **`font-normal`** o `font-medium`. Aquí guanyes ritme i jerarquia sense haver de retocar tokens.

Si vols anar més a prop de Motto, faria un nou token `text-body-sm-prose` (o reusar `text-body-md` que és 20 px desktop) amb font-medium per al body del cas. Això et deixa el `body-xl` lliure per al *lead paragraph* del hero (que sí ha de ser gran).

Segon canvi (alt impacte estètic): pujar el padding vertical entre seccions. Suggereixo:
- `pb-32 md:pb-48 lg:pb-56` (128-224 px) com a punt mig — més generós sense arribar als 250 px de Motto.
- O directament `pb-32 md:pb-64 lg:pb-80` (128-320 px) si vols el ritme "agency".

Tercer canvi (matís): max-width del body. El teu `w-7/12` cap la columna, però en pantalles molt grans (>1600 px) pots arribar a línies de 90+ caràcters, lluny de l'òptim. Afegir `max-w-[640px]` o `max-w-prose` al paràgraf body assegura ~75ch sempre. Motto també queda capada al voltant de 631 px.

Quart canvi (opcional): reduir el gap entre columnes a `gap-8 lg:gap-16` (32-64 px) per acostar la metadata al contingut, més estil Motto. O mantenir el gap actual si t'agrada la separació clara.

---

## 2. Body copy / paràgrafs llargs

### Motto

| Propietat | Valor |
|---|---|
| Família | PP Neue Montreal |
| Font-size | 20.16 px @ 1440 / 26.88 px @ 1920 (fluid amb viewport) |
| Line-height | 1.38 (27.82 / 37.09) |
| Letter-spacing | 0 (normal) |
| Color | rgb(77, 81, 83) = #4D5153 |
| Weight | 500 |
| Max-width | Dictada per col-span-6 del grid (~631-841 px) |

### Tu actualment (`text-body-xl`)

| Propietat | Valor |
|---|---|
| Família | Grtsk Regular (sans) |
| Font-size | clamp(16 / 18 / 32 px) |
| Line-height | clamp(22 / 26 / 48 px) — ratio 1.5 al desktop |
| Letter-spacing | 0 |
| Color | `text-text-secondary` = #444749 |
| Weight | 300 (font-light) |
| Max-width | Implícit per columna (7/12 ≈ 58%) |

### Diferències i implicacions

El teu color (#444749) i el de Motto (#4D5153) són pràcticament idèntics. Cap canvi necessari aquí.

L'escala fluid és diferent però conceptualment alineada — tots dos escalen amb el viewport. La teva té un sostre més alt (32 px) perquè el `body-xl` el fas servir per descripcions hero. Per al body de cas, com he dit a la secció 1, el `body-md` (20 px desktop) seria més coherent amb Motto.

Letter-spacing: tots dos a 0. ✓

Weight: Motto 500, tu 300. **Pujar a 400-500** si redueixes mida. Els pesos lleugers necessiten mida gran per no diluir-se.

Line-height: el teu 1.5 és més airy que el 1.38 de Motto. Tots dos són legibles. Si pugues la mida del body al rang 20-24, baixaria una mica la line-height a 1.4-1.45 perquè no se senti excessivament espaiat (textos petits amb molt leading se senten "flotants").

### Recomanació concreta

Crear o usar un token `prose` específic per a body de cas:

```css
.text-body-prose {
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: clamp(0.875rem, 1.5vw, 1.25rem);  /* 14 / 18 / 20 */
  line-height: 1.4;
  letter-spacing: 0;
  color: var(--color-text-secondary);
}
```

I aplicar `max-w-[640px]` o `max-w-[42rem]` als paràgrafs perquè la línia no superi 75ch a desktop ampli.

---

## 3. Conclusió i altres seccions

### Motto

Motto **no té** un bloc "conclusió + next project" estàndard com el teu. Acaba el cas amb un display gegant ("Love Your Game" a Performance Golf) tipus `display-h1`: 153 px, uppercase, alineat a inici, full-width. És més *brand statement* que conclusió narrativa. Després ve un footer global.

També sigui dit: **no hi ha pattern "Up Next / Next Project"** als dos casos analitzats. Es retorna al portfolio amb un link discret "See all projects" (20 px medium, subratllat).

### Tu actualment

El teu pattern és diferent i, al meu parer, **més útil per a un portfolio personal**:
- Conclusió centrada (`text-body-2xl` = 56 px font-medium, ample 80%, leading-snug).
- Final media opcional.
- `NextProjectScroll` per saltar al següent cas.

És una decisió narrativa: tu vols tancar el cas amb una reflexió clara i empènyer a continuar mirant. Motto, al ser agència, prefereix acabar amb un eslògan de marca i retornar al portfolio.

### Recomanacions per a la conclusió

La teva conclusió ja funciona bé conceptualment. Algunes afinacions:

Primera: la mida `text-body-2xl` (56 px) és gran per a "body" — més aviat és heading-style. Això està bé per al rol d'aforisme/cita final. Però considera baixar a `text-heading-h2` (40 px) o pujar a un `text-display-h5` (32 px display) per donar-li tractament *display* més clar (encara que perdis pes en favor d'uppercase). La mida actual viu en terra de ningú entre heading i body.

Segona: l'amplada `w-[80%]` és força ample. A pantalles grans això pot donar línies molt llargues. Considera baixar a `max-w-[720px]` o `max-w-prose` per mantenir el ritme de lectura. Motto, quan posa text llarg centrat, també l'enquadra a ~50-60% del viewport.

Tercera: el padding inferior `pb-16 md:pb-32 lg:pb-48 xl:pb-96` és molt diferent al padding entre seccions (`pb-16 md:pb-32`). Bé — la conclusió mereix més respiració. Mantenir.

### Recomanació per al "next project"

El que tens (`NextProjectScroll`) és un bon afegit que Motto no té. No el toquis si funciona. L'únic que afegiria mirant Motto és que el link "Veure tots els projectes" del hero ja és més que suficient per a l'usuari que vol tornar al llistat. Si vols simplificar, podries plantejar eliminar `NextProjectScroll` i fer més protagonista la conclusió. Però això és preferència, no recomanació tècnica.

---

## Quadre resum de canvis recomanats (per prioritat)

| # | Canvi | Risc | Impacte | Fitxer |
|---|---|---|---|---|
| 1 | Body del cas de `text-body-xl` a `text-body-lg` (o md) + pujar weight a 400-500 | Baix | Alt | `WorkDetailSection.tsx` |
| 2 | Pujar padding vertical entre seccions a `pb-32 md:pb-48 lg:pb-56` | Baix | Alt | `WorkDetailSection.tsx` |
| 3 | Afegir `max-w-[640px]` al body paragraph | Baix | Mig | `WorkDetailSection.tsx` |
| 4 | Reduir gap entre columnes a `gap-8 lg:gap-16` (opcional) | Baix | Mig | `WorkDetailSection.tsx` |
| 5 | Conclusió: limitar amplada a `max-w-[720px]` | Baix | Mig | `WorkDetailLayout.tsx` |
| 6 | Conclusió: reconsiderar mida (`body-2xl` → `heading-h2` o `display-h5`) | Mig | Mig | `WorkDetailLayout.tsx` |
| 7 | Llista details (border-t): canviar `text-body-xl` (32px) per `text-body-lg` (24px) | Baix | Baix | `WorkDetailSection.tsx` |

## Què NO copiaria de Motto

Algunes coses de Motto **no** les portaria al teu site:

- El padding vertical extrem (250 px) és per a agencies que carreguen el cas com a "experiència". Pots quedar-te en 128-200 px i seguir tenint el mateix to sense fer scrolling marató.
- L'eliminació del "next project" està bé per a una agencia, no per a un portfolio individual on cada cas és un argument independent que enllaça al següent.
- El display gegant de tancament tipus brand statement ("Love Your Game") és coherent amb el client que descriu, no amb la teva veu personal.

## Conclusió

Els tres canvis amb més impacte són **reduir la mida del body** (de 32 a 20-24 px), **augmentar el ritme vertical** entre seccions (de 64-128 a 128-200 px), i **capar l'amplada** dels paràgrafs amb un max-width. Amb només aquests tres, la teva pàgina de detall guanyarà la sensació "calmada i jeràrquica" que té Motto sense haver de tocar l'arquitectura ni l'estructura.
