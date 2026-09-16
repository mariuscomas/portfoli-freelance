-- Un cop entrats els 3 productes del model nou (web · landing · auditoria) i
-- retirades les 6 files del catàleg de juny 2026, cada fila ha de dir
-- obligatòriament quin producte de pricing.ts li calcula el preu.
alter table public.services alter column product_id set not null;
