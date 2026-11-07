import type { APIRoute } from 'astro';
import { siteConfig } from '../utils/config.js';
import { getIndexablePages } from '../utils/seo/registry.js';

// Estático: no depende del request. La URL base sale del dominio canónico.
export const prerender = true;

/**
 * Sitemap desde el registro. Solo URLs indexables, canónicas y que respondan
 * 200 (nada de redirecciones ni noindex). Para sitios con colecciones
 * (blog, productos), concatenar aquí sus rutas leyendo la misma fuente de
 * datos que genera las páginas. > 50 000 URLs → índice de sitemaps.
 */
export const GET: APIRoute = () => {
   const urls = getIndexablePages()
      .map((page) =>
         [
            '  <url>',
            `    <loc>${siteConfig.absoluteUrl(page.slug)}</loc>`,
            page.lastmod && `    <lastmod>${page.lastmod}</lastmod>`,
            page.changefreq && `    <changefreq>${page.changefreq}</changefreq>`,
            typeof page.priority === 'number' && `    <priority>${page.priority.toFixed(1)}</priority>`,
            '  </url>',
         ]
            .filter(Boolean)
            .join('\n'),
      )
      .join('\n');

   return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } },
   );
};
