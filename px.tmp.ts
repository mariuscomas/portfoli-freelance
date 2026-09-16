import { PRODUCTS, DISCIPLINE_ORDER, calcConfiguration, AUDIT_BASE_BY_COUNT, scopeLabel } from "@/lib/pricing";
const all = [...DISCIPLINE_ORDER];
const rows = PRODUCTS.map(p => ({
  id: p.id, name: p.name, priceLabel: p.priceLabel, cta: p.cta,
  price3: p.id === "auditoria" ? AUDIT_BASE_BY_COUNT[3] : calcConfiguration({ product: p.id as any, disciplines: all }).baseTotal,
  desc: p.description,
}));
console.log(JSON.stringify({ scope: scopeLabel(all), order: all, rows }, null, 2));
