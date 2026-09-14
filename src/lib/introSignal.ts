/*
  introSignal — senyal de coreografia entre l'IntroLoader i el contingut.

  L'IntroLoader crida `markIntroRevealed()` just quan comença el reveal (el
  forat circular que descobreix la web) — o immediatament si l'intro no es
  reprodueix (sessió repetida, navegació interna, reduced-motion). El contingut
  (entrada del hero, satèl·lits) s'hi subscriu amb `onIntroRevealed(cb)` per
  arrencar la seva animació d'entrada EXACTAMENT en aquell moment, en lloc de
  córrer amagat darrere la cortina i arribar tard o ja acabat.

  Si el senyal ja s'ha emès quan algú es subscriu (p. ex. un component que es
  munta més tard, o navegació SPA posterior), el callback es dispara de seguida.
*/

let revealed = false;
const subscribers = new Set<() => void>();

export function markIntroRevealed() {
  if (revealed) return;
  revealed = true;
  subscribers.forEach((cb) => cb());
  subscribers.clear();
}

/** Subscriu un callback al moment del reveal. Retorna l'unsubscribe. */
export function onIntroRevealed(cb: () => void): () => void {
  if (revealed) {
    cb();
    return () => {};
  }
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}
