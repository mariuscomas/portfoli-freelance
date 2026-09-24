import { test } from "node:test";
import assert from "node:assert/strict";

test("configShare: anada i tornada, ordre canònic i valors fora de rang", async () => {
  const { encodeConfig, decodeConfig, shareUrl, stripShareParams } = await import("./pricing.ts");
  const c = { disciplines: ["ui", "ux"] as const, extras: { seo: 1, pagina: 2, cms: 0 } };
  const q = encodeConfig({ disciplines: [...c.disciplines], extras: c.extras });
  assert.equal(q, "d=ux.ui&m=pagina-2.seo");
  assert.deepEqual(decodeConfig(`?${q}`), { disciplines: ["ux", "ui"], extras: { pagina: 2, seo: 1 } });
  assert.equal(shareUrl("https://x.com", "web", { disciplines: ["dev"], extras: {} }), "https://x.com/serveis/web?d=dev");
  // Brossa: disciplina desconeguda, mòdul inexistent, comptador desmesurat, toggle amb número.
  assert.deepEqual(decodeConfig("?d=ux.zz&m=hack.pagina-999.seo-5.idioma-0"), {
    disciplines: ["ux"],
    extras: { pagina: 20, seo: 1 },
  });
  assert.equal(decodeConfig("?d=zz"), null);
  assert.equal(decodeConfig("?utm=1"), null);
  assert.equal(stripShareParams("https://x.com/serveis/web?d=ux&m=seo&utm=a#f"), "/serveis/web?utm=a#f");
});
