import type { APIRoute } from 'astro';
import { siteConfig } from '../utils/config.js';

export const prerender = true;

/**
 * robots.txt por entorno.
 *  - Producción: rastreo abierto. No bloquear CSS/JS/imágenes. Solo se cierran
 *    endpoints internos que no aportan al índice.
 *  - Staging / previews / dev: Disallow total (+ noindex en el HTML).
 *
 * Bots de IA (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot…):
 * NO se bloquean por defecto. Bloquearlos es decisión de negocio y contradice
 * publicar llms.txt. Si el dominio está detrás de Cloudflare, revisar la
 * respuesta en vivo: su "managed robots.txt" puede inyectar reglas en el edge.
 */
export const GET: APIRoute = () => {
   const body = siteConfig.noIndex
      ? `# Entorno: ${siteConfig.environment} — no indexable\nUser-agent: *\nDisallow: /\n`
      : `User-agent: *
Allow: /
Disallow: /api/
Disallow: /.netlify/

Sitemap: ${siteConfig.assetUrl('/sitemap.xml')}
`;

   return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
   });
};
