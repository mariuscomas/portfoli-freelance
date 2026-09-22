import { compile } from '@tailwindcss/node';
import fs from 'fs';
const css = fs.readFileSync('src/app/globals.css','utf8');
const c = await compile(css, { base: process.cwd()+'/src/app', onDependency(){} });
const out = c.build(['bg-status-available','bg-status-busy','bg-status-limited','text-accent']);
console.log('OK', out.includes('--color-status-available'), (out.match(/\.bg-status-[a-z]+/g)||[]).join(','));
console.log(out.match(/--color-social-linkedin:[^;]+/)?.[0]);
