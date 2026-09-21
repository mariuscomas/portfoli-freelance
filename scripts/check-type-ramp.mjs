// Comprova que cada estil de text de Figma té la seva @utility a globals.css i
// al revés. Conversió de nom: "Display/L - Medium" → "text-display-l-medium"
// ("/Default" s'omet; "Semi Bold" → "semibold").
// La llista de Figma (scripts/figma-text-styles.json) s'actualitza quan es
// crea un estil nou al Figma — sempre primer al Figma, després al codi.
import fs from "node:fs";

const EXTRA_CODE_ONLY = new Set(["text-label"]); // etiqueta de camp, sense estil a Figma

const figma = JSON.parse(fs.readFileSync(new URL("./figma-text-styles.json", import.meta.url)));
const css = fs.readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

const toUtility = (name) =>
  "text-" +
  name
    .replace(/\/Default$/, "")
    .replace(/ - /g, "-")
    .replace(/Semi Bold/g, "semibold")
    .replace(/\//g, "-")
    .toLowerCase();

const fromFigma = new Set(figma.map(toUtility));
const inCode = new Set([...css.matchAll(/@utility (text-[a-z0-9-]+) \{/g)].map((m) => m[1]));

const missingInCode = [...fromFigma].filter((u) => !inCode.has(u));
const missingInFigma = [...inCode].filter((u) => !fromFigma.has(u) && !EXTRA_CODE_ONLY.has(u));

if (missingInCode.length || missingInFigma.length) {
  if (missingInCode.length) console.error("Estils de Figma sense utility:", missingInCode.join(", "));
  if (missingInFigma.length) console.error("Utilities sense estil a Figma:", missingInFigma.join(", "));
  process.exit(1);
}
console.log(`Rampa tipogràfica alineada: ${fromFigma.size} estils de Figma = ${inCode.size - EXTRA_CODE_ONLY.size} utilities.`);
