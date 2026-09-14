# Estratègia de negoci — Marius Freelance

**Versió 1.3 · 13 juliol 2026** *(v1.1: catàleg ampliat — landing i auditoria; branding i apps reubicats. v1.2: repricing línia B a mercat senior — base 1.900 €, i auditoria per sota del projecte més barat perquè el descompte no canibalitzi. v1.3: el configurador de web passa del model de presets al **model per abast/rol** — el client tria el projecte sencer o una fase solta (UX, UI o Desenvolupament) i la base s'adapta; font de veritat a `src/lib/pricing.ts` amb tests)*

## 1. Diagnòstic

La col·laboració de llarga durada amb una sola agència va generar dependència: en acabar, la cartera de clients estava freda i reactivar-la és lent. La lliçó no és evitar les agències, sinó evitar la concentració de risc.

**Regles anti-dependència:**

- Cap client pot ocupar més del 60-70% de la capacitat setmanal.
- Reservar mínim 1 dia/setmana per a pipeline: outreach, contingut, portfolio, propostes.
- Objectiu de mix d'ingressos: ~60% col·laboracions recurrents / ~40% projectes end-to-end.
- Mantenir sempre 2-3 converses actives amb agències encara que hi hagi feina plena.

## 2. Les dues línies de negoci

| | Línia A — Col·laboracions | Línia B — Projectes end-to-end |
|---|---|---|
| Client | Agències que necessiten perfil UI/UX senior | Pimes i marques que volen web completa |
| Rol | Extensió del seu equip (hores/setmanes/mesos) | Responsable únic disseny + desenvolupament |
| Ingressos | Recurrents, previsibles (base) | Pics de marge a cada tancament |
| Funnel web | Zona col·laboració → tarifes + perfil → Calendar | Serveis → configurador → formulari → Calendar |

## 3. Línia A — Tarifes de col·laboració (esglaonades per durada)

Principi: el descompte es guanya amb compromís. Qui menys seguretat dona, més paga. 30 €/h és el **terra**, mai la base.

| Modalitat | Tarifa | Equivalent orientatiu |
|---|---|---|
| Ad-hoc / hores soltes | 40 €/h | mín. facturable 4h |
| Setmana completa (dedicació full-time) | 38 €/h | ~1.520 €/setmana |
| Mes complet | 35 €/h | ~5.600 €/mes |
| Compromís 3+ mesos | 30-32 €/h | ~4.800-5.100 €/mes |

**Modificadors (sempre a favor teu):**

- Urgència (< 48h d'incorporació): +10%.
- Dedicació parcial (< 20h/setmana): tarifa del tram superior (menys previsibilitat = més preu).
- Renovació de contracte llarg: mantenir tarifa, no abaixar-la.

**Condicions Línia A:** facturació mensual, pagament a 15-30 dies, imports sense IVA. Els contractes de 3+ mesos amb tarifa terra exigeixen preavís de cancel·lació de 2-4 setmanes (és el que compres amb el descompte).

> Nota: amb el repricing v1.2 de la Línia B, els evolutius pugen a 35 €/h (alineats amb el tram "mes complet", ja no amb el terra).

## 4. Línia B — Projectes end-to-end (model modular)

Font de veritat per al càlcul de pressupostos i per al configurador de la web: `src/lib/pricing.ts` (`ROLES` + `calcConfiguration()`), amb tests a `src/lib/pricing.roles.test.ts` (`npm test`).

**Model per abast (rol).** El client tria què necessita: el projecte sencer ("Tot") o una fase solta (UX, UI o Desenvolupament). La base i el desglòs de fases s'adapten al rol. Totes les bases inclouen les 5 pàgines (inici, qui som, serveis, contacte i legals) i Responsive (Mobile First); "Tot" i "Desenvolupament" hi afegeixen transicions lleugeres, formulari de contacte i QA/producció. Continguts (textos, logo, imatges) els aporta el client.

**Base per rol** (sumatori de fases):

| Rol | Base | Fases |
|---|---|---|
| Tot | 2.400 € | Immersió 240 · Disseny UX i arquitectura 480 · Disseny UI 480 · Desenvolupament a mida 960 · Posada en producció 240 |
| UX Design | 960 € | Immersió 240 · Disseny UX i arquitectura 480 · Lliurament i traspàs 240 |
| UI Design | 960 € | Immersió 240 · Disseny UI 480 · Lliurament i traspàs 240 |
| Desenvolupament | 1.440 € | Immersió 240 · Desenvolupament a mida 960 · Posada en producció 240 |

**Extres sumables** (preu i disponibilitat segons el rol):

| Extra | Import | Disponible a |
|---|---|---|
| Pàgines extra | €/pàgina segons rol: Tot 200 · Dev 100 · UX/UI 50 | tots |
| Idiomes extra (traduccions del client) | +150 €/idioma | Tot, Dev |
| Motion / interacció premium (GSAP avançat) | +400 € | Tot, Dev |
| CMS bàsic | +500 € | Tot, Dev |
| Redacció de textos | +80 €/pàgina × (5 base + extra) | Tot, UX |

**Fórmula:** `total = base(rol) + Σ extres disponibles`. Estats validats pels tests: UX/UI + 1 pàgina = 1.010 €; Desenvolupament + 1 pàgina + Motion = 1.940 €; Tot + 1 pàgina + Motion = 3.000 €.

> Implicació de posicionament: el "des de" de la web passa de 1.900 € a **960 €** (fase solta UX/UI). Cal decidir si la card de serveis ancora amb 960 € (accessibilitat) o amb el preu del projecte sencer 2.400 € (valor). Decisió oberta.

**Recurrents (sempre separats del total):** allotjament gestionat 20 €/mes (240 €/any), domini ≈15 €/any (propietat del client), evolutius 35 €/h.

**Condicions:** imports sense IVA i orientatius; continguts i fotos a càrrec del client; 2 rondes de revisió per fase (addicionals a 35 €/h); pagament 50% inici / 50% entrega; validesa 30 dies; un sol interlocutor de principi a fi.

> Nota (v1.3): es retira "end-to-end, mai handoff" de les condicions. El posicionament d'un sol responsable es manté, però la condició excloïa encàrrecs parcials (només UX, només UI o només desenvolupament), que són freqüents i s'accepten amb pressupost a mida per fase.

**Flux del formulari:** email amb resum a mariuscr23@gmail.com → guardar sol·licitud a Supabase → pantalla final amb enllaç de cita (https://calendar.app.google/MRVip8R9GcYYNCEz6).

### Serveis "tancats" → derivats del model per rol

~~Els presets (Essencial · CMS · Premium · Internacional)~~ queden substituïts pel model per rol (v1.3): en lloc de paquets d'extres predefinits, el punt de partida és l'**abast** (Tot / UX / UI / Desenvolupament). Les cards de serveis obren el configurador ja amb el rol preseleccionat. Els exports `WEB_PRESETS` / `presetPrice` de `pricing.ts` queden marcats `@deprecated` fins a migrar el `<ConfiguratorModal />`.

Així només hi ha **una** font de veritat de preus (`ROLES` + `calcConfiguration`), i afegir o canviar un extra actualitza configurador i cards alhora.

### Catàleg complet de productes (v1.2)

Decisió: només es productitza el que s'ha venut end-to-end de veritat (web, landing, auditoria). La resta no desapareix, es reubica.

| Producte | Model | Preu | Notes |
|---|---|---|---|
| Web (4 abasts) | Model per rol | des de 960 € | Configurador per rol: Tot 2.400 · UX/UI 960 · Dev 1.440 |
| Landing | Model per rol (v1.4) | des de 720 € | 1 pàgina orientada a convertir. Base per rol: Tot 1.440 · UX/UI 720 · Dev 960. Sense pàgines extra ni CMS; extres: motion +400, redacció +80 (1 pàg), idioma +150. Font: `pricing.ts` (`calcConfiguration` amb `product:"landing"`) + tests. Mercat: 500-1.500 € |
| Auditoria UI/UX | Configurador per focus (v1.4) | des de 600 € | El client tria focus (UX/UI/Dev, multi-selecció), talla (S inclòs / M +300 / L +600) i extres. Base per nombre de focus: 1→600 · 2→900 · 3→1.100. Extres: test usuaris 500 · accessibilitat WCAG 2.2 350 · benchmark 250 · analítica 250 · conversió 250 · UX writing 200 · Figma 300. Incentiu: es descompta íntegrament si converteix a projecte **dins de 3 mesos**. Font de veritat: `pricing.ts` (`calcAudit`) amb tests. Mercat: 800-3.500 € |
| Branding / il·lustració | Extra o a mida | a pressupostar | Sense casos end-to-end venuts → no és producte independent |
| Apps | Línia A (col·laboració) | tarifes per hora | És el perfil senior que es ven a agències (Cupra n'és la prova); per a client directe: pressupost a mida + trucada |

**Fórmula landing (v1.4):** `total = base(rol) + (motion ? 400 : 0) + (redacció ? 80 : 0) + (idiomes_extra × 150)`, on base = Tot 1.440 · UX/UI 720 · Dev 960. Validat: Tot+Motion 1.840 · Dev+Motion 1.360.

**Aplicabilitat dels extres:** pàgina extra i CMS són només de web (una landing amb més pàgines o CMS ja és una web); idioma, motion, redacció i il·lustració apliquen a web i landing; l'auditoria no admet extres.

**Regla de coherència del descompte:** el preu de l'auditoria ha de ser sempre inferior al del producte més barat amb descompte aplicable (ara: 900 < 1.200). Si mai puja l'auditoria, puja abans la landing — o el descompte passa a ser parcial. El descompte té **finestra de 3 mesos** des de l'entrega de l'auditoria, i a la comunicació sempre va darrere del valor standalone del producte (l'auditoria no és cap paga-i-senyal).

L'auditoria com a producte d'entrada: preu tancat, scope tancat, i porta natural cap a un projecte de web ("es descompta si seguim").

## 5. Web — prioritats

1. **Home amb doble funnel.** El visitant ha d'identificar el seu camí en 5 segons: "Tens un projecte?" (→ serveis) i "Ets una agència?" (→ col·laboració). Els serveis passen a ser el protagonista de l'entrada.
2. **Zona col·laboració (nova).** Enfocada a agències: proposta de valor del perfil senior (Cupra, Quantion...), taula de tarifes per durada (amb la lògica esglaonada visible — transparència que juga a favor), disponibilitat actual i CTA directe a Calendar.
3. **Serveis com a presets + configurador.** Cards de serveis amb "des de X €" que obren el configurador (fórmula del punt 4). Sortida: resum → email + Supabase → Calendar.

## 6. Roadmap

| Fase | Contingut |
|---|---|
| 1 | Wireframes home doble funnel + zona col·laboració (Figma) |
| 2 | Serveis com a presets + configurador de preus |
| 3 | Implementació Next.js (tokens DS existents) + Supabase per a sol·licituds |
| 4 | Mesura: conversió per funnel, origen de leads, ocupació per client (regla 60-70%) |
