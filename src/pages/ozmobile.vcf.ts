import type { APIRoute } from 'astro';
import { buildVCard } from '../utils/vcard.js';

// Enlace "Guardar contacto" que funciona sin JavaScript. El nombre del archivo
// debe coincidir con siteConfig.card.fileName (vcardPath()).
export const prerender = true;

export const GET: APIRoute = () =>
   new Response(buildVCard() + '\r\n', {
      headers: {
         'Content-Type': 'text/vcard; charset=utf-8',
         'Content-Disposition': 'attachment; filename="ozmobile.vcf"',
      },
   });
