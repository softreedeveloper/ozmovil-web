import { siteConfig } from '../config.js';
import { getIndexablePages } from './registry.js';

/**
 * /llms.txt (formato llmstxt.org): resumen del sitio para sistemas de IA.
 *
 * Reglas:
 *  - No inventa copy: reutiliza site-config y las descriptions del registro,
 *    que ya son el copy aprobado. Así no puede contradecir al sitio.
 *  - Solo páginas indexables (las mismas del sitemap).
 *  - Las notas de interpretación (NOTES) las aprueba negocio; vacías por defecto.
 *  - Para agrupar en secciones, añadir `llmsSection` a las entradas del registro.
 */

/** Párrafos aprobados: alcance geográfico, qué NO es la marca, cómo citar… */
const NOTES = [];

/** Orden y título de las secciones. Las páginas sin llmsSection van a 'Páginas'. */
const SECTIONS = ['Páginas principales', 'Páginas', 'Optional'];

export function buildLlmsTxt() {
   const { site, contact } = siteConfig;
   const pages = getIndexablePages();

   const grouped = new Map(SECTIONS.map((s) => [s, []]));
   for (const page of pages) {
      const section = grouped.has(page.llmsSection) ? page.llmsSection : 'Páginas';
      grouped
         .get(section)
         .push(`- [${page.h1 ?? page.title}](${siteConfig.absoluteUrl(page.slug)}): ${page.description}`);
   }

   const sections = [...grouped]
      .filter(([, lines]) => lines.length)
      .map(([title, lines]) => `## ${title}\n\n${lines.join('\n')}`)
      .join('\n\n');

   const contactLines = [
      `- Sitio: ${siteConfig.absoluteUrl('/')}`,
      contact.email && `- Correo: ${contact.email}`,
      contact.phone && `- Teléfono: ${contact.phone}`,
   ]
      .filter(Boolean)
      .join('\n');

   return [
      `# ${site.name}`,
      '',
      `> ${site.description}`,
      '',
      NOTES.length ? NOTES.join('\n\n') + '\n' : null,
      sections,
      '',
      `## Contacto\n\n${contactLines}`,
      '',
   ]
      .filter((x) => x !== null)
      .join('\n');
}
