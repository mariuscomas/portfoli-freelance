# Auditoria UI/UX — Configurador (Desktop + Mobile)

Auditat contra els frames reals de Figma:
- **Desktop** — `node 11472:8534` (1728px)
- **Mobile** — `node 11483:10926` (402px, 1832px d'alt)

Producte: cortina full-screen per pressupostar una web/landing dins `/serveis`. Públic: **clients potencials, sovint no tècnics**. Etapa: refinament.

Severitat: 🔴 crític · 🟡 moderat · 🟢 menor · ✅ ja resolt al disseny

---

## Veredicte global

El teu **disseny mòbil no és el desktop apilat**: fa progressive disclosure (Base / Extres / Resum com a acordions), treu la nota de reassurance del footer i deixa un **footer sticky amb Total + Continua**. És una bona adaptació. El problema real no és de disseny sinó de **paritat**: **el codi actual fa un stack ingenu del desktop** i encara no implementa el frame mòbil — per això el total desapareix, no hi ha acordions i el pas s'amaga. La feina és portar el codi al nivell del disseny, no redissenyar.

**Diferències Desktop↔Mobile que són intencionades (i coherents per context), no errors:**

| Element | Desktop | Mobile | Per què és coherent |
|---|---|---|---|
| Preu a la capçalera Base | Ocult | Visible ("2.400 € · Sempre inclosa.") | En desktop el Resum és sempre visible a la dreta; en mòbil queda avall, cal una àncora de preu a dalt |
| Grup "Extres" del Resum | Obert | Col·lapsat | En mòbil es prioritza densitat; en desktop hi ha espai per mostrar el que s'acaba de triar |
| Base / Extres / Resum | Estàtics (3 columnes) | Acordions | En mòbil tot va en una columna de ~1800px; els acordions dominen el scroll |

La resta és consistent en tots dos: títol 16px, Total Base col·lapsat, etiquetes curtes de recurrents, tooltips `?`, chips a 2 files, Total com a heroi.

---

## 1. Navbar Top (header)

**Desktop** — Icona (16px) + títol 16px + `PAS 1 DE 2 - Configura el teu pressupost` a la dreta.
**Mobile** — Igual, però el pas s'escurça a `PAS 1 DE 2` (sense subtítol).

| Troballa | On | Sev. | Recomanació |
|---|---|---|---|
| El codi amaga l'indicador de pas per sota de `lg` (`hidden lg:block`); el disseny mòbil el manté (`PAS 1 DE 2`). | Codi vs disseny mòbil | 🟡 | Mostrar `Pas 1 de 2` també en mòbil (versió curta). El progrés redueix ansietat en un flux de 2 passos. |
| Títol a 16px competeix en pes amb el label de pas. | D + M | 🟢 | Conscient i coherent als dos frames; ho deixaria com està. |

**Què funciona:** header compacte idèntic als dos breakpoints; focus-trap, Escape i restauració de focus impecables; target 44px amb glif 20px.

---

## 2. Col Left → Tipus de projecte + Base

**Desktop** — Columna esquerra: chips de rol a dalt, Base a sota (estàtica, sense preu a la capçalera).
**Mobile** — Primer bloc del stack: chips (wrap a 2 files: `Tot / UX / UI` + `Desenvolupament`), després **Base com a acordion** amb caret i **preu a la capçalera** ("2.400 € · Sempre inclosa.").

| Troballa | On | Sev. | Recomanació |
|---|---|---|---|
| En mòbil, Base és un acordion col·lapsable; el codi la mostra sempre desplegada. | Codi vs disseny mòbil | 🟡 | Implementar Base com a acordion **només en mòbil** (default obert), per domar el scroll. En desktop, estàtica. |
| El preu a la capçalera Base: desktop no, mòbil sí. | Coherència D/M | 🟢 | Regla intencionada (Resum visible vs no). Documentar-la; en mòbil, amb footer sticky mostrant el Total, valorar si el preu a Base encara cal o és redundant. |
| En canviar de rol, la llista Base es reescriu sense transició. | D + M | 🟡 | Crossfade subtil (150–200ms) perquè es vegi que "la base s'actualitza" — la promesa del subtítol. |
| Chips fan wrap a 2 files. | D + M | 🟢 | El disseny ja ho assumeix a tots dos frames; correcte. |

**Què funciona:** proximitat control↔efecte (el teu moviment); radiogroup amb fletxes i roving tabindex.

---

## 3. Col Center → Extres

**Desktop** — Columna central pròpia amb totes les files.
**Mobile** — Segon bloc del stack, **Extres com a acordion**. Cada fila amb icona `?`, stepper de 32px i switch.

| Troballa | On | Sev. | Recomanació |
|---|---|---|---|
| Les **etiquetes** d'extra estan en `text-secondary`; el preu (caption) també. Tota la fila queda grisa. | D + M | 🟡 | **Etiqueta a `text-main`, preu a `text-secondary`.** L'usuari escaneja *què* (etiqueta) abans de *quant* (preu); el preu ja destaca prou pel Geist Mono. Aplica als dos breakpoints. |
| Falten els tooltips `?` (al codi); el disseny els té a tots dos frames. | Codi vs disseny | 🟡 | Recuperar-los: popover accessible (hover+focus+tap, `aria-describedby`), 1 frase per extra. Per a públic no tècnic no és cosmètic. |
| Amb abast reduït (UI Design → només "Pàgines extra") la secció queda amb una fila i molt buit. | D (i M) | 🟡 | Mostrar els no aplicables deshabilitats amb el perquè, o una línia guia, o fusionar quan n'hi ha ≤1. |
| En mòbil, Extres (la tasca principal) és col·lapsable. | M | 🟢 | Default obert ho salva; només vigilar que no s'oblidi obert per l'usuari. |

**Què funciona:** steppers amb `aria-live` i disabled a min/max; switch amb wrapper de 44px; ordre lògic (quantitatius → toggles); preu en mono com a "spec".

---

## 4. Col Right → Resum

**Desktop** — Columna dreta: Total Base (col·lapsat), Extres (obert), Total, nota recurrents.
**Mobile** — Tercer bloc, **Resum com a acordion**; a dins, **Total Base i Extres tots dos col·lapsats**; després Total (40px) i nota.

| Troballa | On | Sev. | Recomanació |
|---|---|---|---|
| Nota "No inclòs al total": el disseny (D **i** M) usa etiquetes **curtes** `HOSTING · DOMINI · EVOLUTIUS`; el codi encara les llargues, en majúscules i 4 línies. | Codi vs disseny | 🟡 | Adoptar les curtes (afegir `shortLabel` a `RECURRENTS`). Frase + imports en mono, cap a 2 línies. |
| Grup "Extres" del Resum: desktop obert, mòbil col·lapsat. | Coherència D/M | 🟢 | Intencionat (densitat mòbil). OK. |
| "Total Base" col·lapsat amaga el desglòs que justifica els 2.400 €. | D + M | 🟡 | El disseny ho col·lapsa a tots dos; és una decisió de simplicitat. Valorar només en desktop deixar-lo obert per justificar valor (hi ha espai). Caret cap a la dreta/avall per a l'affordance. |
| El caret col·lapsat apunta a l'esquerra (`CaretLeft`). | D + M | 🟢 | ▶/▼ és el senyal habitual de desplegable; unificar. |

**Què funciona:** preu com a **font única de veritat**; `AnimatedTotal` amb spring + `aria-live`; grups col·lapsables; disclaimer honest.

---

## 5. Navbar Bottom (footer)

**Desktop** — Nota "El total és orientatiu…" (esq.) + Continua (dreta). Sense total.
**Mobile** — **Footer sticky = Total (40px) + Continua.** La nota de reassurance es mou al **cos scrollable**, just abans del footer.

| Troballa | On | Sev. | Recomanació |
|---|---|---|---|
| El codi no implementa el footer mòbil: mostra nota + Continua i **cap total**. El disseny mòbil resol el total invisible amb Total + CTA sticky. | Codi vs disseny mòbil | 🔴 | Implementar el footer mòbil dissenyat: `Total · Continua` sticky, i moure la nota al cos. És el canvi de més impacte en conversió mòbil. |
| En desktop, dues accions ("reserva trucada" + "Continua"). | D | 🟢 | Pes actual correcte (link subtil vs pill). Mantenir. |
| "Continua" genèric. | D + M | 🟢 | Honest (pas 2 = dades). Opcional "Continua a la proposta". |

**Què funciona:** còpia que baixa l'ansietat de preu; escapatòria de baixa fricció; `safe-area` inset; icona amb `group-hover:translate-x`.

---

## Gaps codi ↔ disseny mòbil (el que falta construir)

| # | Gap | Sev. |
|---|---|---|
| G1 | Footer mòbil sticky amb **Total + Continua** (ara: nota + Continua, sense total) | 🔴 |
| G2 | **Acordions** Base / Extres / Resum en mòbil (ara: stack estàtic) | 🟡 |
| G3 | Mostrar `Pas 1 de 2` en mòbil (ara: `hidden lg:block`) | 🟡 |
| G4 | Etiquetes **curtes** de recurrents als dos breakpoints | 🟡 |
| G5 | Tooltips `?` per extra (ajornats) | 🟡 |
| G6 | Etiqueta d'extra a `text-main`, preu a `text-secondary` | 🟡 |
| G7 | Preu a la capçalera Base **només en mòbil** (regla de coherència) | 🟢 |
| G8 | Nota de reassurance al cos scrollable en mòbil (no al footer) | 🟢 |

---

## Prioritats

1. **🔴 Footer mòbil sticky (Total + Continua)** — G1. Ja dissenyat; és el que més mou conversió mòbil.
2. **🟡 Acordions en mòbil** — G2. Domen el scroll de ~1800px; és el patró que fa usable el frame mòbil.
3. **🟡 Etiqueta primary / preu secondary** — G6. Recupera l'escanejabilitat; aplica als dos breakpoints.
4. **🟡 Tooltips `?`** — G5. L'audiència no tècnica els necessita.
5. **🟡 Etiquetes curtes de recurrents + `Pas 1 de 2` en mòbil** — G3, G4. Ràpids, alineen codi i disseny.

## Accessibilitat

Bona base: targets ≥44px, focus-trap, `aria-live`, radiogroups, `prefers-reduced-motion`. Contrast text-secondary #444749 / surface-base #f2f2f2 ≈ **8:1** (AA i AAA). A vigilar en mòbil: steppers a 32px (mantenir 44px d'àrea de toc encara que el glif sigui 32); nombres i body-sm no baixar de 12px; tooltips operables per teclat i touch, no només hover; i que els acordions mòbil tinguin `aria-expanded` i ordre de focus correcte.
