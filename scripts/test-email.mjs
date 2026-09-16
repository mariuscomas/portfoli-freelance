/**
 * Prova d'enviament amb Resend, sense arrencar l'app.
 *
 *   npm run email:test              → correu intern (a NOTIFY_EMAIL)
 *   npm run email:test -- altra@adreça.com
 *
 * Serveix per separar dos problemes que des de l'app es confonen: "la clau no
 * va" i "el domini no està verificat". Resend explica quin dels dos és.
 */

const key = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM || "onboarding@resend.dev";
const to = process.argv[2] || process.env.NOTIFY_EMAIL || "mariuscr23@gmail.com";

if (!key) {
  console.error("✗ Falta RESEND_API_KEY a .env.local — l'app no enviaria res (i no petaria).");
  process.exit(1);
}

console.log(`→ de:  ${from}`);
console.log(`→ a:   ${to}`);

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to,
    subject: "Prova de Resend · mariusfreelance",
    text: "Si llegeixes això, la clau és bona i el remitent està verificat.",
  }),
});

const body = await res.json().catch(() => ({}));

if (res.ok) {
  console.log(`✓ Enviat. id: ${body.id}`);
  console.log("  Si no arriba en un parell de minuts, mira'l a resend.com → Emails (pot constar com a bounced).");
} else {
  console.error(`✗ Resend ha respost ${res.status}`);
  console.error(" ", body.message || body.error || JSON.stringify(body));
  if (res.status === 403 || /domain/i.test(body.message || "")) {
    console.error("  Pista: el domini del remitent encara no està verificat, o la clau no hi té permís.");
  }
  if (res.status === 401) console.error("  Pista: la clau no és vàlida.");
  process.exit(1);
}
