#!/usr/bin/env node
/**
 * Auditoría SEO en vivo de CUALQUIER sitio (no necesita su código fuente).
 * Node 18+, sin dependencias.
 *
 *   node seo-audit-live.mjs https://www.example.com            → rastrea el sitemap (máx. 50 URLs)
 *   node seo-audit-live.mjs https://www.example.com --max=200
 *   node seo-audit-live.mjs https://www.example.com --urls=/,/contacto,/servicios
 *   node seo-audit-live.mjs https://stage.example.com --expect=staging   → exige noindex + Disallow
 *   node seo-audit-live.mjs https://www.example.com --json > informe.json
 *
 * Comprueba: robots.txt, sitemap, http→https, www/no-www, barra final, soft 404,
 * status y cadenas de redirección, canonical, title, description, robots meta y
 * X-Robots-Tag, H1, lang, og:*, JSON-LD (parseo, tipos, localhost, relativas),
 * imágenes sin alt, contenido mixto y llms.txt.
 */

const args = Object.fromEntries(
   process.argv.slice(3).map((a) => {
      const [k, v = 'true'] = a.replace(/^--/, '').split('=');
      return [k, v];
   }),
);
const BASE = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https?:\/\//.test(BASE)) {
   console.error(
      'Uso: node seo-audit-live.mjs https://dominio [--max=50] [--urls=/a,/b] [--expect=production|staging] [--json]',
   );
   process.exit(2);
}
const MAX = Number(args.max ?? 50);
const EXPECT = args.expect ?? 'production';
const UA = 'Mozilla/5.0 (compatible; SEOAuditBot/1.0)';
const origin = new URL(BASE).origin;

const issues = [];
const add = (severity, rule, target, message) => issues.push({ severity, rule, target, message });

async function get(url, { follow = false, method = 'GET' } = {}) {
   try {
      const res = await fetch(url, { method, redirect: follow ? 'follow' : 'manual', headers: { 'User-Agent': UA } });
      const body = method === 'GET' ? await res.text().catch(() => '') : '';
      return { status: res.status, headers: res.headers, body, url: res.url };
   } catch (e) {
      return { status: 0, headers: new Headers(), body: '', error: e.message };
   }
}

/** Sigue redirecciones a mano para medir la cadena. */
async function trace(url, limit = 10) {
   const hops = [];
   let current = url;
   for (let i = 0; i < limit; i++) {
      const r = await get(current);
      hops.push({ url: current, status: r.status });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
         current = new URL(r.headers.get('location'), current).href;
         continue;
      }
      return { hops, final: r, finalUrl: current };
   }
   return { hops, final: null, finalUrl: current };
}

const attr = (tag, name) => tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
const metas = (html, key, value) =>
   [...html.matchAll(/<meta\b[^>]*>/gi)]
      .map((m) => m[0])
      .filter((t) => attr(t, key)?.toLowerCase() === value.toLowerCase());

// --- Nivel sitio -------------------------------------------------------------------
const robots = await get(`${origin}/robots.txt`);
if (robots.status !== 200) add('HIGH', 'robots-status', '/robots.txt', `Responde ${robots.status}.`);
const robotsBody = robots.body || '';
const disallowAll = /^\s*Disallow:\s*\/\s*$/im.test(robotsBody.split(/User-agent:\s*\*/i)[1] ?? '');
if (EXPECT === 'production') {
   if (disallowAll)
      add('CRITICAL', 'robots-bloquea-todo', '/robots.txt', 'Producción con "Disallow: /" para User-agent *.');
   if (!/^\s*Sitemap:/im.test(robotsBody)) add('MEDIUM', 'robots-sin-sitemap', '/robots.txt', 'Sin línea Sitemap:.');
   if (/Disallow:\s*\/(_astro|_next|assets|static|css|js)\b/i.test(robotsBody))
      add('HIGH', 'robots-bloquea-recursos', '/robots.txt', 'Bloquea CSS/JS: Google no puede renderizar.');
   const aiBots = robotsBody.match(
      /User-agent:\s*(GPTBot|ClaudeBot|Google-Extended|PerplexityBot|CCBot|anthropic-ai)/gi,
   );
   if (aiBots)
      add(
         'LOW',
         'robots-bots-ia',
         '/robots.txt',
         `Reglas para bots de IA: ${aiBots.join(', ')}. Confirmar que es decisión de negocio.`,
      );
} else if (!disallowAll) add('CRITICAL', 'staging-rastreable', '/robots.txt', 'Staging sin "Disallow: /".');

const sitemapUrl = robotsBody.match(/^\s*Sitemap:\s*(\S+)/im)?.[1] ?? `${origin}/sitemap.xml`;
const sitemap = await get(sitemapUrl);
let locs = [];
if (sitemap.status !== 200)
   add(EXPECT === 'production' ? 'HIGH' : 'LOW', 'sitemap-status', sitemapUrl, `Responde ${sitemap.status}.`);
else {
   locs = [...sitemap.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
   if (/<sitemapindex/i.test(sitemap.body)) {
      const children = locs;
      locs = [];
      for (const child of children.slice(0, 10)) {
         const c = await get(child);
         locs.push(...[...c.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]));
      }
   }
   if (!locs.length) add('HIGH', 'sitemap-vacio', sitemapUrl, 'Sin <loc>.');
   const foreign = locs.filter((l) => !l.startsWith(origin));
   if (foreign.length)
      add('HIGH', 'sitemap-otro-dominio', sitemapUrl, `${foreign.length} URLs de otro host (p. ej. ${foreign[0]}).`);
   const slashed = locs.filter((l) => new URL(l).pathname !== '/' && new URL(l).pathname.endsWith('/')).length;
   if (slashed && slashed !== locs.filter((l) => new URL(l).pathname !== '/').length)
      add('MEDIUM', 'sitemap-barra-mixta', sitemapUrl, 'Mezcla URLs con y sin barra final.');
}

const host = new URL(origin).host;
if (origin.startsWith('https://')) {
   const http = await get(origin.replace('https://', 'http://') + '/');
   if (!(http.status >= 300 && http.status < 400))
      add('HIGH', 'http-sin-redireccion', 'http://', `http:// responde ${http.status} (debe 301 a https).`);
}
const altHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
const alt = await get(`https://${altHost}/`);
if (alt.status === 200)
   add('HIGH', 'www-duplicado', altHost, `${altHost} responde 200 en lugar de redirigir a ${host}.`);

const random = await get(`${origin}/esta-url-no-existe-${Date.now()}`);
if (random.status === 200) add('HIGH', 'soft-404', '/<inexistente>', 'Una URL inexistente responde 200 (soft 404).');

const llms = await get(`${origin}/llms.txt`);
if (llms.status !== 200) add('LOW', 'llms-txt', '/llms.txt', `Responde ${llms.status} (opcional, recomendado).`);
else if (!/^#\s+\S/m.test(llms.body))
   add('LOW', 'llms-formato', '/llms.txt', 'No empieza con "# Nombre" (formato llmstxt.org).');

// --- Nivel página -------------------------------------------------------------------
const targets = args.urls
   ? args.urls.split(',').map((p) => origin + p.trim())
   : locs.length
     ? locs.slice(0, MAX)
     : [origin + '/'];
const seenTitles = new Map();
const seenDescs = new Map();

for (const url of targets) {
   const path = new URL(url).pathname;
   const { hops, final, finalUrl } = await trace(url);
   if (!final) {
      add('CRITICAL', 'bucle-redireccion', path, 'Más de 10 saltos.');
      continue;
   }
   if (hops.length > 1) {
      const sev = locs.includes(url) ? 'HIGH' : 'MEDIUM';
      add(
         sev,
         'redireccion',
         path,
         `${hops.map((h) => h.status).join(' → ')} hasta ${finalUrl}${locs.includes(url) ? ' (URL del sitemap que redirige)' : ''}.`,
      );
      if (hops.length > 2) add('HIGH', 'cadena-redireccion', path, `${hops.length - 1} saltos encadenados.`);
      if (hops.some((h) => h.status === 302 || h.status === 307))
         add('MEDIUM', 'redireccion-temporal', path, '302/307 donde probablemente corresponde 301/308.');
   }
   if (final.status !== 200) {
      add('CRITICAL', 'status', path, `Responde ${final.status}.`);
      continue;
   }

   const html = final.body;
   const head = html.split(/<\/head>/i)[0];
   const xRobots = final.headers.get('x-robots-tag') || '';
   const robotsMeta = metas(head, 'name', 'robots')
      .map((t) => attr(t, 'content'))
      .join(',');
   const noindex = /noindex/i.test(robotsMeta + xRobots);

   if (EXPECT === 'production' && noindex && locs.includes(url))
      add('CRITICAL', 'noindex-en-sitemap', path, 'Está en el sitemap pero lleva noindex.');
   if (EXPECT === 'staging' && !noindex)
      add('CRITICAL', 'staging-indexable', path, 'Sin noindex (meta ni X-Robots-Tag).');

   const titles = [...head.matchAll(/<title[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => m[1].trim());
   if (titles.length !== 1) add('CRITICAL', 'title-count', path, `${titles.length} <title>.`);
   const title = titles[0] ?? '';
   if (title.length > 60) add('MEDIUM', 'title-largo', path, `${title.length} caracteres.`);
   if (!title) add('CRITICAL', 'title-vacio', path, 'Title vacío.');
   if (title && seenTitles.has(title)) add('HIGH', 'title-duplicado', path, `Igual que ${seenTitles.get(title)}.`);
   seenTitles.set(title, path);

   const descs = metas(head, 'name', 'description').map((t) => attr(t, 'content') ?? '');
   if (descs.length !== 1) add('HIGH', 'description-count', path, `${descs.length} meta description.`);
   const desc = descs[0] ?? '';
   if (desc && (desc.length < 70 || desc.length > 160))
      add('MEDIUM', 'description-longitud', path, `${desc.length} caracteres.`);
   if (desc && seenDescs.has(desc)) add('HIGH', 'description-duplicada', path, `Igual que ${seenDescs.get(desc)}.`);
   seenDescs.set(desc, path);

   const canonicals = [...head.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi)].map((m) => attr(m[0], 'href'));
   if (canonicals.length !== 1) add('CRITICAL', 'canonical-count', path, `${canonicals.length} canonical.`);
   const canonical = canonicals[0];
   if (canonical) {
      if (!/^https?:\/\//.test(canonical)) add('HIGH', 'canonical-relativa', path, canonical);
      if (/localhost|127\.0\.0\.1/.test(canonical)) add('CRITICAL', 'canonical-localhost', path, canonical);
      if (/[?#]/.test(canonical)) add('HIGH', 'canonical-query', path, canonical);
      if (EXPECT === 'production' && canonical !== finalUrl.split(/[?#]/)[0])
         add('HIGH', 'canonical-no-autorreferencial', path, `Canonical ${canonical} ≠ URL servida ${finalUrl}.`);
   }

   const lang = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1];
   if (!lang) add('MEDIUM', 'html-lang', path, '<html> sin lang.');

   const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
   if (h1 !== 1) add(h1 ? 'MEDIUM' : 'HIGH', 'h1-count', path, `${h1} <h1>.`);

   const og = (p) => metas(head, 'property', p).map((t) => attr(t, 'content'))[0];
   for (const p of ['og:title', 'og:description', 'og:url', 'og:image'])
      if (!og(p)) add('MEDIUM', 'og-faltante', path, `Sin ${p}.`);
   const ogImage = og('og:image');
   if (ogImage) {
      if (!/^https?:\/\//.test(ogImage)) add('HIGH', 'og-image-relativa', path, ogImage);
      else {
         const img = await get(ogImage, { method: 'HEAD', follow: true });
         if (img.status !== 200) add('HIGH', 'og-image-rota', path, `${ogImage} → ${img.status}.`);
      }
   }
   if (!metas(head, 'name', 'twitter:card').length) add('LOW', 'twitter-card', path, 'Sin twitter:card.');

   const blocks = [
      ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
   ].map((m) => m[1]);
   if (!blocks.length) add('MEDIUM', 'schema-ausente', path, 'Sin JSON-LD.');
   if (blocks.length > 1)
      add('LOW', 'schema-multiples-bloques', path, `${blocks.length} bloques JSON-LD (preferible un @graph).`);
   const types = [];
   for (const b of blocks) {
      try {
         const data = JSON.parse(b);
         const nodes = Array.isArray(data) ? data : (data['@graph'] ?? [data]);
         for (const n of nodes) types.push(...[].concat(n['@type'] ?? []));
         if (/localhost|127\.0\.0\.1/.test(b))
            add('CRITICAL', 'schema-localhost', path, 'JSON-LD con URLs a localhost.');
         if (/"undefined"|:\s*undefined/.test(b)) add('HIGH', 'schema-undefined', path, 'JSON-LD con "undefined".');
         if (types.includes('FAQPage')) {
            const faq = nodes.find((n) => [].concat(n['@type']).includes('FAQPage'));
            const q = faq?.mainEntity?.[0]?.name;
            if (q && !html.replace(/<script[\s\S]*?<\/script>/gi, '').includes(q.slice(0, 30)))
               add('HIGH', 'faq-no-visible', path, `La pregunta "${q.slice(0, 40)}…" no aparece en el HTML visible.`);
         }
      } catch (e) {
         add('CRITICAL', 'schema-json-invalido', path, e.message);
      }
   }
   if (types.length && !types.some((t) => /Organization|LocalBusiness|Service$/.test(t)) && path === '/')
      add('MEDIUM', 'schema-sin-organizacion', path, 'La home no declara Organization/LocalBusiness.');

   const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
   const noAlt = imgs.filter((t) => !/\balt\s*=/.test(t)).length;
   if (noAlt) add('MEDIUM', 'img-sin-alt', path, `${noAlt} de ${imgs.length} <img> sin alt.`);
   const noDims = imgs.filter((t) => !/\bwidth\s*=/.test(t) || !/\bheight\s*=/.test(t)).length;
   if (noDims) add('LOW', 'img-sin-dimensiones', path, `${noDims} <img> sin width/height.`);
   if (origin.startsWith('https') && /\b(src|href)=["']http:\/\//i.test(html))
      add('MEDIUM', 'contenido-mixto', path, 'Recursos por http://.');
   if (/<meta[^>]+name=["']keywords["']/i.test(head)) add('LOW', 'meta-keywords', path, 'meta keywords obsoleta.');

   // Variante de barra final: debe redirigir (301/308) a la canónica, no servir 200.
   if (path !== '/' && !/\.[a-z0-9]{2,5}$/i.test(path)) {
      const variant = path.endsWith('/') ? url.replace(/\/$/, '') : url + '/';
      const v = await get(variant);
      if (v.status === 200)
         add('HIGH', 'barra-final-duplicada', path, `La variante ${new URL(variant).pathname} también responde 200.`);
   }
}

// --- Informe ---------------------------------------------------------------------
const ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
if (args.json) {
   console.log(JSON.stringify({ base: BASE, expect: EXPECT, pages: targets.length, issues }, null, 2));
} else {
   console.log(`\n  SEO LIVE AUDIT — ${BASE} (esperado: ${EXPECT}) — ${targets.length} URLs\n  ${'-'.repeat(60)}`);
   for (const sev of ORDER) {
      const group = issues.filter((i) => i.severity === sev);
      if (!group.length) continue;
      console.log(`\n  ${sev} (${group.length})`);
      for (const i of group) console.log(`    · [${i.rule}] ${i.target}\n      ${i.message}`);
   }
   console.log(`\n  ${ORDER.map((s) => `${s}: ${issues.filter((i) => i.severity === s).length}`).join('   ')}\n`);
}
process.exit(issues.some((i) => i.severity === 'CRITICAL') ? 1 : 0);
