import { siteConfig } from './config.js';
import { getPage, normalizeSlug } from './seo/registry.js';

/**
 * Resuelve la metadata de una página.
 * Precedencia: props explícitas > entrada del registro > defaults del sitio.
 * La canónica NO es sobrescribible por props: siempre sale del pathname
 * (autorreferencial, sin query string, con la política de barra final).
 */
export function generateSEOTags(props = {}) {
   const { pathname = '/', noIndex = false, publishedTime, modifiedTime } = props;
   const entry = getPage(pathname) || {};

   const title = props.title || entry.title || siteConfig.site.title;
   const description = props.description || entry.description || siteConfig.site.description;
   const image = siteConfig.assetUrl(props.image || entry.ogImage || siteConfig.assets.defaultOgImage);
   // normalizeSlug quita query, barra final y la extensión .html que Astro expone
   // en Astro.url.pathname cuando build.format es 'file'.
   const canonical = siteConfig.absoluteUrl(normalizeSlug(pathname));

   const hidden = noIndex || entry.noindex || siteConfig.noIndex;

   return {
      title,
      description,
      image,
      canonical,
      type: props.type || 'website',
      author: props.author || siteConfig.site.author,
      publishedTime,
      modifiedTime,
      noindex: Boolean(hidden),
      robots: hidden ? siteConfig.seo.robots.noindex : siteConfig.seo.robots.index,
   };
}
