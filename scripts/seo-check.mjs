#!/usr/bin/env node
/**
 * Validador SEO estático (sobre el código fuente, sin levantar el servidor).
 *
 *   node scripts/seo-check.mjs                 → informa
 *   SEO_STRICT=1 node scripts/seo-check.mjs    → exit 1 si hay CRITICAL
 *
 * package.json:  "seo:check": "node scripts/seo-check.mjs"
 * Requiere que registry.js, config.js, seo.js y schema/*.js usen imports
 * RELATIVOS (Node no resuelve los alias de Vite).
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.env.SEO_STRICT === '1';
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 158;

const issues = [];
const add = (severity, rule, target, message) => issues.push({ severity, rule, target, message });
const mod = (p) => import(new URL(`../${p}`, import.meta.url));

const { seoPages, GLOBAL_NAV = [], NAV_COMPONENTS = [], normalizeSlug } = await mod('src/utils/seo/registry.js');
const { siteConfigData } = await mod('src/utils/site-config.js');
const { buildGraph, validateGraph } = await mod('src/utils/seo/schema/graph.js');
const { generateSEOTags } = await mod('src/utils/seo.js');

// 1. Registro ------------------------------------------------------------------
const slugs = new Set();
const keywords = new Map();
const titles = new Map();
const descriptions = new Map();

for (const page of seoPages) {
   const at = page.slug;
   if (slugs.has(normalizeSlug(at))) add('CRITICAL', 'slug-duplicado', at, 'Dos entradas con el mismo slug.');
   slugs.add(normalizeSlug(at));
   if (at !== '/' && at.endsWith('/'))
      add('MEDIUM', 'slug-con-barra', at, 'Los slugs del registro van sin barra final.');

   if (!page.title) add('CRITICAL', 'title-faltante', at, 'Sin title.');
   else {
      if (page.title.length > TITLE_MAX)
         add('MEDIUM', 'title-largo', at, `${page.title.length} caracteres (máx. ${TITLE_MAX}).`);
      if (titles.has(page.title) && !page.noindex)
         add('HIGH', 'title-duplicado', at, `Igual que ${titles.get(page.title)}.`);
      titles.set(page.title, at);
   }

   if (!page.description) add('CRITICAL', 'description-faltante', at, 'Sin meta description.');
   else if (!page.noindex) {
      const n = page.description.length;
      if (n < DESC_MIN || n > DESC_MAX)
         add('MEDIUM', 'description-longitud', at, `${n} caracteres (${DESC_MIN}–${DESC_MAX}).`);
      if (descriptions.has(page.description))
         add('HIGH', 'description-duplicada', at, `Igual que ${descriptions.get(page.description)}.`);
      descriptions.set(page.description, at);
   }

   if (!page.h1) add('HIGH', 'h1-faltante', at, 'Sin H1 en el registro.');
   else if (page.h1 === page.title) add('LOW', 'h1-igual-title', at, 'El H1 repite el title.');

   if (page.primaryKeyword) {
      const owner = keywords.get(page.primaryKeyword.toLowerCase());
      if (owner) add('CRITICAL', 'canibalizacion', at, `Misma keyword principal que ${owner}.`);
      else keywords.set(page.primaryKeyword.toLowerCase(), at);
   } else if (!page.noindex) add('MEDIUM', 'keyword-faltante', at, 'Indexable sin keyword principal.');

   if (!page.noindex && at !== '/' && !page.breadcrumb?.length)
      add('MEDIUM', 'breadcrumb-faltante', at, 'Página interna sin migas.');
   if (page.lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(page.lastmod))
      add('MEDIUM', 'lastmod-formato', at, 'lastmod debe ser AAAA-MM-DD.');
}

// 2. Enlaces internos y huérfanas ------------------------------------------------
const inbound = new Map([...slugs].map((s) => [s, 0]));
for (const page of seoPages) {
   for (const target of page.linksTo ?? []) {
      const t = normalizeSlug(target.split('#')[0]);
      if (!slugs.has(t))
         add('HIGH', 'enlace-colgante', page.slug, `linksTo apunta a ${target}, que no está en el registro.`);
      else if (t !== normalizeSlug(page.slug)) inbound.set(t, inbound.get(t) + 1);
   }
}
for (const route of GLOBAL_NAV) inbound.set(normalizeSlug(route), (inbound.get(normalizeSlug(route)) ?? 0) + 1);
for (const page of seoPages) {
   if (!page.noindex && page.slug !== '/' && !inbound.get(normalizeSlug(page.slug)))
      add('CRITICAL', 'pagina-huerfana', page.slug, 'Ningún enlace interno entrante (ni linksTo ni GLOBAL_NAV).');
}

const navSource = NAV_COMPONENTS.filter((f) => existsSync(join(ROOT, f)))
   .map((f) => readFileSync(join(ROOT, f), 'utf8'))
   .join('\n');
for (const route of GLOBAL_NAV) {
   if (route === '/' || !NAV_COMPONENTS.length) continue;
   const variants = [route, route + '/'];
   if (
      !variants.some(
         (r) => navSource.includes(`"${r}"`) || navSource.includes(`'${r}'`) || navSource.includes(`\`${r}\``),
      )
   )
      add(
         'CRITICAL',
         'nav-desincronizada',
         route,
         'Está en GLOBAL_NAV pero no aparece en los componentes de navegación.',
      );
}

// 3. Assets de la configuración --------------------------------------------------
for (const [key, value] of Object.entries(siteConfigData.assets ?? {})) {
   if (typeof value !== 'string') continue;
   if (value !== value.trim()) add('HIGH', 'asset-con-espacios', key, `"${value}" tiene espacios.`);
   if (!existsSync(join(ROOT, 'public', value.trim().replace(/^\//, ''))))
      add('HIGH', 'asset-inexistente', key, `${value} no existe en public/.`);
}
for (const page of seoPages) {
   if (page.ogImage && !existsSync(join(ROOT, 'public', page.ogImage.replace(/^\//, ''))))
      add('HIGH', 'og-image-inexistente', page.slug, `${page.ogImage} no existe en public/.`);
}
for (const f of ['favicon-32x32.png', 'apple-touch-icon.png'])
   if (!existsSync(join(ROOT, 'public', f))) add('MEDIUM', 'favicon-faltante', f, 'SEOHead lo referencia y no existe.');

// 4. Código fuente ---------------------------------------------------------------
function walk(dir, out = []) {
   if (!existsSync(dir)) return out;
   for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(astro|jsx?|tsx?|mdx?)$/.test(entry)) out.push(full);
   }
   return out;
}
const strip = (s) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const files = walk(join(ROOT, 'src'));
const wantSlash = Boolean(siteConfigData.urls?.trailingSlash);

for (const file of files) {
   const rel = relative(ROOT, file);
   const src = strip(readFileSync(file, 'utf8'));
   const isHead = rel.endsWith('seo/SEOHead.astro');

   if (!isHead && /<title[\s>]/.test(src))
      add('CRITICAL', 'title-fuera-de-seohead', rel, 'Emite <title>: SEOHead es la fuente única.');
   if (!isHead && /rel=["']canonical["']/.test(src))
      add('CRITICAL', 'canonical-fuera-de-seohead', rel, 'Emite canonical.');
   if (!isHead && /name=["']description["']/.test(src))
      add('HIGH', 'description-fuera-de-seohead', rel, 'Emite meta description.');
   if (!rel.endsWith('seo/Schema.astro') && /application\/ld\+json/.test(src))
      add('HIGH', 'jsonld-fuera-de-schema', rel, 'JSON-LD suelto: usar la prop schema del Layout.');
   if (/name=["']keywords["']/.test(src)) add('LOW', 'meta-keywords', rel, 'meta keywords es obsoleta.');
   if (/http-equiv=["']X-Frame-Options/i.test(src))
      add('LOW', 'header-como-meta', rel, 'X-Frame-Options como meta no tiene efecto; va como cabecera HTTP.');
   if (/localhost:\d+/.test(src) && !rel.includes('config'))
      add('HIGH', 'localhost-hardcodeado', rel, 'URL a localhost en el código.');

   const h1s = (src.match(/<h1[\s>]/g) ?? []).length;
   if (h1s > 1) add('HIGH', 'h1-multiple', rel, `${h1s} <h1> en el mismo archivo.`);

   for (const m of src.matchAll(/<img\b[^>]*>/gs)) {
      if (!/\balt\s*=/.test(m[0])) add('HIGH', 'img-sin-alt', rel, 'Etiqueta <img> sin alt (decorativa → alt="").');
      if (!/\bwidth\s*=/.test(m[0]) || !/\bheight\s*=/.test(m[0]))
         add('MEDIUM', 'img-sin-dimensiones', rel, '<img> sin width/height (CLS).');
   }

   for (const m of src.matchAll(/href=["'](\/[^"'#?]*)/g)) {
      const href = m[1];
      if (href === '/' || href.startsWith('//') || /\.[a-z0-9]{2,11}$/i.test(href)) continue;
      if (wantSlash !== href.endsWith('/'))
         add(
            'MEDIUM',
            'href-barra-final',
            rel,
            `${href} no sigue la política de barra final (${wantSlash ? 'con' : 'sin'}).`,
         );
      if (!slugs.has(normalizeSlug(href)) && !href.startsWith('/api/'))
         add(
            'LOW',
            'href-fuera-de-registro',
            rel,
            `${href} no está en el registro (¿página nueva sin dar de alta o enlace roto?).`,
         );
   }
}

// 5. Schema por página ------------------------------------------------------------
for (const page of seoPages) {
   const graph = buildGraph(page, generateSEOTags({ pathname: page.slug }));
   for (const p of validateGraph(graph)) add(p.severity, 'schema', page.slug, p.message);
}

// Informe -------------------------------------------------------------------------
const ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const count = (s) => issues.filter((i) => i.severity === s).length;
console.log(`\n  SEO CHECK — ${siteConfigData.site?.name ?? ''}\n  ${'-'.repeat(58)}`);
if (!issues.length) console.log('  Sin hallazgos.');
for (const sev of ORDER) {
   const group = issues.filter((i) => i.severity === sev);
   if (!group.length) continue;
   console.log(`\n  ${sev} (${group.length})`);
   for (const i of group) console.log(`    · [${i.rule}] ${i.target}\n      ${i.message}`);
}
console.log(
   `\n  ${ORDER.map((s) => `${s}: ${count(s)}`).join('   ')}   ·   páginas: ${seoPages.length}   ·   modo: ${STRICT ? 'STRICT' : 'warning'}\n`,
);
if (STRICT && count('CRITICAL')) process.exit(1);
