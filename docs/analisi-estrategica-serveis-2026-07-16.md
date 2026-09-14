# Anàlisi estratègica — Pàgina de Serveis (disseny Figma)

**16 juliol 2026 · font: frame Figma `MariusFreelance` node `11592:10842` · contrast contra `docs/estrategia-negoci.md` v1.3/v1.4**

Abast: validació del **disseny a Figma** de `/serveis` (Línia B, client final) com a peça del doble funnel, i proposta de millores prioritzades. Anàlisi feta sobre el frame real, no sobre el codi. On el codi divergeix del disseny, es marca explícitament.

---

## 1. Mapa del frame (de dalt a baix)

1. **Hero** — marquesina "Serveis ✳ Serveis ✳ Serveis" + descripció de proposta de valor: *"Webs, landings i auditories amb preu clar i abast tancat. Configura el teu projecte en dos minuts i rep el pressupost al moment — un sol interlocutor, de principi a fi."* + selector d'idioma i enllaç "Descobreix tot el que podem fer".
2. **Punts de partida** — capçalera amb **toggle Tot · Disseny · Programació** i tríada de cards Web · Landing · Auditoria + card "Una altra cosa al cap?" → trucada.
3. **Què inclou cadascun** — tres columnes d'inclosos.
4. **Fes-la teva** — taula d'extres amb aplicabilitat (WEB / LANDING) i preu.
5. **Com treballem** — 4 passos (Descoberta · Proposta · Disseny+dev · Llançament) + condicions.
6. **Després del llançament** — recurrents separats del total.
7. **CTA final** — *"No saps per on començar? Configura la teva web en dos minuts."* → configurador.
8. **Footer** — newsletter + tornar a dalt.

---

## 2. Què funciona (disseny ben resolt)

**El hero ja ven, no explica.** A diferència del codi (que encara arrossega la biografia "La meva història no comença amb un llapis…"), el disseny de Figma ja té al hero la proposta de valor correcta, orientada a benefici i a acció. Estratègicament és el hero que ha de tenir una pàgina de serveis. **Aquí Figma va per davant del codi.**

**Doble funnel net.** El frame viu dins l'eix Serveis ↔ Col·laboració; la pàgina és clarament la porta de la Línia B (client amb projecte). Coincideix amb la prioritat #1 del pla ("identificar el camí en 5 segons").

**Transparència radical.** Preu "des de", inclosos sense lletra petita, extres amb aplicabilitat i preu, condicions i recurrents separats del total. És exactament l'arma que defensa el pla ("transparència que juga a favor"). Poca competència ensenya preus: diferenciador real.

**Toggle d'abast a la tríada.** El selector **Tot · Disseny · Programació** a "Punts de partida" apunta al model per abast del pla v1.3 (el client tria projecte sencer o fase). És la llavor correcta per resoldre l'anchoring (§3.2) directament a la pàgina.

**Arquitectura de lectura sòlida.** Què ofereixo → què inclou → com el faig meu → com treballem → què passa després → configura'l. Ordre d'argument de venda impecable.

---

## 3. Divergències i riscos

### 3.1 [CRÍTIC] Preus del disseny endarrerits respecte al pla

El frame mostra els preus **antics**, no els del model v1.4:

| Producte | Figma (frame) | Pla v1.4 | Estat |
|---|---|---|---|
| Web | DES DE **1.900 €** | des de 960 € (fase) · 2.400 € (sencer) | Desactualitzat |
| Landing | DES DE **1.200 €** | des de 720 € · 1.440 € (sencer) | Desactualitzat |
| Auditoria | PREU TANCAT **900 €** | des de 600 € (configurable per focus) | Desactualitzat |

A més, la card de Web encara mostra el subtítol **"+ Configuracions: Essencial · CMS · Premium · Internacional"** — presets retirats el 2026-07-14. És la peça de còpia més visible que contradiu el model actual.

**Decisió presa (16 jul):** ancorar en **valor** → Web des de **2.400 €** (projecte sencer), Landing i auditoria al preu complet coherent. Cal aplicar-ho al frame i eliminar el subtítol de presets.

**Risc si no es corregeix:** trenca la promesa central ("preu clar i abast tancat"). El toggle Tot/Disseny/Programació insinua fases, però el número gran encara és el preu orfe de l'antic model de presets.

### 3.2 [ALT] El toggle d'abast promet una interacció que la card no acaba de tancar

El selector Tot · Disseny · Programació suggereix que el preu de la card canvia segons l'abast. Si el número gran no reacciona al toggle (o no queda clar què fa), es genera una expectativa d'interacció no complerta. Estratègicament és la millor oportunitat de la pàgina per resoldre l'anchoring: amb "Tot" seleccionat mostra 2.400 € (valor), i el toggle deixa veure que baixa a 960 € en triar una fase. Cal dissenyar aquest estat, no deixar-lo insinuat.

### 3.3 [MITJÀ] L'auditoria és la porta d'entrada, però es dissenya com a 3a card igual

El pla posiciona l'auditoria com a **producte d'entrada de baix risc** que es descompta íntegre si es converteix a projecte en 3 mesos. Al frame és la tercera card d'una tríada visualment equivalent, sense jerarquia que comuniqui aquest rol de funnel ni el mecanisme "prova'm → t'ho descompto".

### 3.4 [MITJÀ] Zero prova social abans del CTA

El frame no mostra cap projecte entregat, testimoni ni logo de client (Cupra, Quantion viuen només a `/colaboracio`). Per a un client final que compra una web sencera, la confiança és el fre de conversió principal, i no hi ha cap ancoratge de confiança abans del configurador.

### 3.5 [BAIX] Estrenyiment del CTA final

El CTA final ("Configura la teva **web** en dos minuts") envia tothom al configurador de web, tot i que la tríada també ven landing i auditoria. Estreny el funnel silenciosament.

### 3.6 [INFRA] Divergència disseny ↔ codi

- **Hero:** Figma = proposta de valor (correcte); codi = biografia (endarrerit). → portar el hero de Figma al codi.
- **Preus:** tots dos mostren 1.900/1.200/900 + presets; el pla diu una altra cosa. → única font de veritat `pricing.ts`, i el frame ha de reflectir-la.

---

## 4. Recomanacions prioritzades

**P0 · Reconciliar preus al frame.** Aplicar l'anchor de valor: Web **2.400 €**, Landing **1.440 €**, i alinear Auditoria; eliminar el subtítol de presets i substituir-lo per l'eix del model actual ("Tria l'abast"). Propagar el mateix a `pricing.ts` i codi perquè disseny, configurador i cards diguin el mateix número.

**P1 · Dissenyar l'estat del toggle d'abast.** Fer que Tot · Disseny · Programació canviï el preu i els inclosos de la card en viu (Tot 2.400 → fase 960). És on es resol l'anchoring i on la pàgina compleix la promesa "abast tancat".

**P1 · Portar el hero de Figma al codi.** El codi encara té la biografia; el disseny ja té la proposta de valor. Sincronitzar.

**P1 · Donar rol de funnel a l'auditoria.** Etiquetar-la com a entrada de baix risc i fer explícit el pont "es descompta si seguim en 3 mesos" com a mecanisme, no com a lletra dins la card.

**P2 · Injectar prova social abans del CTA final** (2-3 projectes end-to-end reals o testimoni).

**P2 · CTA final neutre** ("Configura el teu projecte") que respecti landing i auditoria.

---

## 5. Veredicte

El **disseny de Figma és estratègicament més madur que el codi**: el hero ja ven i el toggle d'abast apunta al model correcte. El problema no és l'arquitectura, sinó que **els preus del frame s'han quedat a l'antic model de presets** (1.900/1.200/900) mentre el pla ja opera per abast/valor. Prioritat inequívoca: **P0 — actualitzar els preus del frame a l'anchor de valor (Web 2.400 €) i netejar el subtítol de presets**, i tot seguit dissenyar l'estat del toggle (P1) perquè la pàgina compleixi de veritat la promesa d'abast tancat.
