#!/usr/bin/env node
/**
 * Genera los assets de marca OzMobile desde src/utils/brand-mark.js:
 *
 *   public/favicon.svg · favicon.ico · favicon-32x32.png · apple-touch-icon.png
 *   public/icon-192.png · icon-512.png · site.webmanifest
 *   public/img/logo.png        (isotipo de app 512×512: Schema + centro del QR)
 *   public/img/og-default.png  (1200×630, versión negativa)
 *   public/brand/*.svg|png     (logotipos descargables: horizontal, vertical,
 *                               negativo, isotipo, isotipo app)
 *
 *   npm run og
 *
 * El texto del logotipo se convierte a trazos con Montserrat (opentype.js),
 * así los SVG/PNG no dependen de fuentes instaladas.
 */
import sharp from 'sharp';
import opentype from 'opentype.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { siteConfigData } from '../src/utils/site-config.js';
import { BRAND, isotypeSvgInner, appIconSvg } from '../src/utils/brand-mark.js';

const require = createRequire(import.meta.url);
const OUT = new URL('../public/', import.meta.url);
mkdirSync(new URL('img/', OUT), { recursive: true });
mkdirSync(new URL('brand/', OUT), { recursive: true });

const font = (w) =>
   opentype.parse(
      readFileSync(require.resolve(`@fontsource/montserrat/files/montserrat-latin-${w}-normal.woff`)).buffer,
   );
const BOLD = font(800);
const SEMI = font(600);

const { site, contact } = siteConfigData;
const NAME_HEAD = site.name.slice(0, 2); // "Oz"
const NAME_REST = site.name.slice(2); // "Mobile"

/**
 * Serializa los comandos a mano: toPathData() de opentype.js "optimiza" y
 * omite el cierre Z de algunos glifos (l, 1…), que librsvg luego descarta.
 */
const n = (v) => +v.toFixed(2);
function pathData(p) {
   return p.commands
      .map((c) => {
         if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
         if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
         if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
         return 'Z';
      })
      .join('');
}

/** Texto → path SVG con tracking (em). Devuelve { d, width }. */
function text(f, str, x, y, size, tracking = 0) {
   let cursor = x;
   const parts = [];
   const glyphs = f.stringToGlyphs(str);
   glyphs.forEach((g, i) => {
      parts.push(pathData(g.getPath(cursor, y, size)));
      const kern = i < glyphs.length - 1 ? f.getKerningValue(g, glyphs[i + 1]) : 0;
      cursor += ((g.advanceWidth + kern) / f.unitsPerEm) * size + (i < glyphs.length - 1 ? tracking * size : 0);
   });
   return { d: parts.join(''), width: cursor - x };
}

/** Bloque "OzMobile" + tagline. Devuelve { svg, width, height }. */
function wordmark({ x, y, size, ink, tagline = true, align = 'left' }) {
   const head = text(BOLD, NAME_HEAD, 0, 0, size, -0.035);
   const rest = text(BOLD, NAME_REST, 0, 0, size, -0.035);
   const gap = -0.035 * size;
   const wordW = head.width + gap + rest.width;
   const tagSize = size * 0.19;
   const words = site.tagline.toUpperCase().split(' ');
   const mid = Math.ceil(words.length / 2);
   const lines = tagline ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [];
   const tagPaths = lines.map((l) => text(SEMI, l, 0, 0, tagSize, 0.18));
   const tagW = Math.max(0, ...tagPaths.map((t) => t.width));
   const width = Math.max(wordW, tagW + tagSize * 4);
   const ox = align === 'center' ? x - width / 2 : x;
   const wx = ox + ((width - wordW) / 2) * (align === 'center' ? 1 : 0);
   let svg = `<g transform="translate(${wx} ${y})"><path d="${head.d}" fill="${BRAND.primary}"/><path transform="translate(${head.width + gap} 0)" d="${rest.d}" fill="${ink}"/></g>`;
   tagPaths.forEach((t, i) => {
      const ty = y + size * 0.42 + i * tagSize * 1.45;
      const tx = ox + (width - t.width) / 2;
      svg += `<path transform="translate(${tx} ${ty})" d="${t.d}" fill="${ink}"/>`;
   });
   if (tagline) {
      const dy = y + size * 0.42 + tagSize * 0.35;
      const dash = tagSize * 1.6;
      svg += `<rect x="${ox}" y="${dy - 1.5}" width="${dash}" height="3" rx="1.5" fill="${BRAND.primary}"/>`;
      svg += `<rect x="${ox + width - dash}" y="${dy - 1.5}" width="${dash}" height="3" rx="1.5" fill="${BRAND.primary}"/>`;
   }
   const height = size * 0.75 + (tagline ? size * 0.42 + tagSize * 2.6 : 0);
   return { svg, width, height };
}

const iso = (ink, fill, x, y, size) =>
   `<g transform="translate(${x} ${y}) scale(${size / 120})">${isotypeSvgInner({ ink, orbit: BRAND.primary, fill })}</g>`;

/** Logotipo horizontal. */
function horizontal({ ink, fill, bg = null, pad = 24 }) {
   const isoSize = 220;
   const wm = wordmark({ x: pad + isoSize + 8, y: pad + 128, size: 132, ink });
   const w = Math.ceil(pad + isoSize + 8 + wm.width + pad);
   const h = Math.ceil(isoSize + pad * 2);
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg ? `<rect width="${w}" height="${h}" rx="28" fill="${bg}"/>` : ''}${iso(ink, fill, pad, pad, isoSize)}${wm.svg}</svg>`;
}

/** Logotipo vertical. */
function vertical({ ink, fill, bg = null, pad = 24 }) {
   const isoSize = 240;
   const wm = wordmark({ x: 0, y: 0, size: 112, ink, align: 'center' });
   const w = Math.ceil(Math.max(isoSize, wm.width) + pad * 2);
   const cx = w / 2;
   const wmBlock = wordmark({ x: cx, y: pad + isoSize + 96, size: 112, ink, align: 'center' });
   const h = Math.ceil(pad + isoSize + 96 + wm.height - 70 + pad);
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg ? `<rect width="${w}" height="${h}" rx="28" fill="${bg}"/>` : ''}${iso(ink, fill, cx - isoSize / 2, pad, isoSize)}${wmBlock.svg}</svg>`;
}

const png = (svg, opts = {}) =>
   sharp(Buffer.from(svg), { density: 144 }).resize(opts.width).png({ compressionLevel: 9 }).toBuffer();
const write = (path, buf) => writeFileSync(new URL(path, OUT), buf);

// --- Favicons e iconos de app (isotipo simplificado) --------------------------------
write('favicon.svg', appIconSvg({ size: 32 }) + '\n');
write('favicon-32x32.png', await png(appIconSvg({ size: 32 })));
write('icon-192.png', await png(appIconSvg({ size: 192 })));
write('icon-512.png', await png(appIconSvg({ size: 512 })));
write('img/logo.png', await png(appIconSvg({ size: 512 })));
// iOS redondea solo: fondo a sangre, sin esquinas.
write(
   'apple-touch-icon.png',
   await png(
      appIconSvg({ size: 180 }).replace('<rect width="24" height="24" rx="5.4"', '<rect width="24" height="24" rx="0"'),
   ),
);

// favicon.ico con un PNG 32×32 embebido
const ico32 = await png(appIconSvg({ size: 32 }));
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6);
header.writeUInt8(32, 7);
header.writeUInt8(0, 8);
header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(ico32.length, 14);
header.writeUInt32LE(22, 18);
write('favicon.ico', Buffer.concat([header, ico32]));

// --- Logotipos descargables ------------------------------------------------------------
const files = {
   'ozmobile-horizontal': horizontal({ ink: BRAND.secondary, fill: BRAND.white }),
   'ozmobile-horizontal-negativo': horizontal({ ink: BRAND.white, fill: BRAND.secondary, bg: BRAND.secondary }),
   'ozmobile-vertical': vertical({ ink: BRAND.secondary, fill: BRAND.white }),
   'ozmobile-vertical-negativo': vertical({ ink: BRAND.white, fill: BRAND.secondary, bg: BRAND.secondary }),
   'ozmobile-isotipo': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="512" height="512">${isotypeSvgInner({ ink: BRAND.secondary, orbit: BRAND.primary, fill: BRAND.white })}</svg>`,
   'ozmobile-isotipo-app': appIconSvg({ size: 512 }),
};
for (const [name, svg] of Object.entries(files)) {
   write(`brand/${name}.svg`, svg + '\n');
   write(`brand/${name}.png`, await png(svg, { width: name.includes('isotipo') ? 512 : 1200 }));
}

// --- Imagen Open Graph 1200×630 (versión negativa) --------------------------------------
const W = 1200;
const H = 630;
const wm = wordmark({ x: 80 + 150 + 6, y: 80 + 92, size: 92, ink: BRAND.white });
const head1 = text(BOLD, 'Reparación de celulares', 80, 375, 66, -0.02);
const head2 = text(BOLD, 'y dispositivos electrónicos', 80, 455, 66, -0.02);
const sub = text(SEMI, 'Pantallas · Baterías · Centros de carga', 80, 535, 26, 0);
const ctaLabel = text(BOLD, `WhatsApp ${contact.phoneDisplay.replace(/^\+52 1 /, '')}`, 0, 0, 25, 0);
const ctaW = ctaLabel.width + 64;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="85%" cy="0%" r="75%"><stop offset="0" stop-color="${BRAND.primary}" stop-opacity="0.45"/><stop offset="1" stop-color="${BRAND.secondary}" stop-opacity="0"/></radialGradient>
    <linearGradient id="cta" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.primary}"/><stop offset="1" stop-color="${BRAND.primaryDeep}"/></linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.05"/></pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#050D1A"/>
  <rect width="${W}" height="${H}" fill="${BRAND.secondary}" opacity="0.55"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  ${iso(BRAND.white, BRAND.secondary, 80, 50, 150)}
  ${wm.svg}
  <path d="${head1.d}" fill="#ffffff"/>
  <path d="${head2.d}" fill="${BRAND.primary}"/>
  <path d="${sub.d}" fill="#94a3b8"/>
  <rect x="${W - 80 - ctaW}" y="495" width="${ctaW}" height="66" rx="33" fill="url(#cta)"/>
  <path transform="translate(${W - 80 - ctaW + 32} 537)" d="${ctaLabel.d}" fill="#ffffff"/>
</svg>`;
write('img/og-default.png', await sharp(Buffer.from(og)).png({ compressionLevel: 9, palette: true }).toBuffer());

// --- Manifest ----------------------------------------------------------------------------
write(
   'site.webmanifest',
   JSON.stringify(
      {
         name: site.name,
         short_name: site.name,
         description: site.description,
         lang: site.language,
         start_url: '/',
         display: 'standalone',
         background_color: BRAND.white,
         theme_color: BRAND.secondary,
         icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
         ],
      },
      null,
      3,
   ) + '\n',
);

console.log('Assets de marca generados en public/');
