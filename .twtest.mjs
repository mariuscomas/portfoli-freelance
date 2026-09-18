import postcss from 'postcss';
import tw from '@tailwindcss/postcss';
import fs from 'fs';
const css = fs.readFileSync('src/app/globals.css','utf8');
const r = await postcss([tw({base: process.cwd()})]).process(css,{from:process.cwd()+'/src/app/globals.css'});
const out=r.css;
for (const m of out.matchAll(/\.(?:lg\\:)?dash-[^{]+\{[^}]*(\{[^}]*\}[^}]*)?\}/g)) console.log(m[0]);
