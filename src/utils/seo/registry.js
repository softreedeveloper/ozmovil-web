/**
 * Registro central de páginas — única fuente de verdad SEO por URL.
 *
 * Leen de aquí: SEOHead (title, description, robots), Schema (WebPage,
 * BreadcrumbList), Breadcrumbs visibles, sitemap.xml, llms.txt y el validador.
 * Una página nueva = una entrada aquí. Las páginas .astro NO repiten title
 * ni description.
 *
 * Campos:
 *   slug              ruta sin dominio, con barra inicial, sin barra final ('/' para home)
 *   title             <title> completo con sufijo de marca (≤ 60 caracteres)
 *   description       meta description (120–158 caracteres), copy aprobado
 *   h1                H1 visible exacto (debe coincidir con el markup; distinto del title)
 *   primaryKeyword    keyword objetivo — única en todo el registro (anti-canibalización)
 *   intent            informacional | comercial | transaccional | navegacional | local
 *   pageType          subtipo de WebPage: WebPage | ContactPage | AboutPage | CollectionPage | FAQPage…
 *   schemaTypes       tipos que la página emite (documentación + validador)
 *   breadcrumb        [{ label, href }] SIN incluir "Inicio"; [] en la home
 *   linksTo           enlaces internos salientes obligatorios del contenido
 *   ogImage           ruta en public/ (1200×630); opcional
 *   changefreq        pista para el sitemap (Google la ignora; otros buscadores no)
 *   priority          0–1 (home 1.0 · pilares 0.8–0.9 · detalle 0.6 · legales 0.3)
 *   lastmod           'AAAA-MM-DD' de la última revisión REAL del contenido
 *   noindex           true → fuera del sitemap/llms.txt y meta robots noindex
 */

/** Rutas que enlaza el chrome (Header, Footer). Landing única: solo la home. */
export const GLOBAL_NAV = ['/'];

/** Archivos del chrome donde deben aparecer las rutas de GLOBAL_NAV. */
export const NAV_COMPONENTS = ['src/components/layout/Header.astro', 'src/components/layout/Footer.astro'];

export const seoPages = [
   {
      slug: '/',
      title: 'Reparación de celulares y tablets | OzMobile',
      description:
         'Reparación de celulares y tablets en OzMobile: pantallas, baterías, centros de carga, cámaras y más. Cotiza rápido y sin compromiso por WhatsApp.',
      h1: 'Reparación de celulares y tablets',
      primaryKeyword: 'reparación de celulares',
      intent: 'local',
      pageType: 'WebPage',
      schemaTypes: ['LocalBusiness', 'WebSite', 'WebPage', 'OfferCatalog', 'FAQPage'],
      breadcrumb: [],
      linksTo: [],
      changefreq: 'monthly',
      priority: 1.0,
      lastmod: '2026-11-03',
   },
   {
      slug: '/404',
      title: 'Página no encontrada | OzMobile',
      description: 'La página que buscas no existe.',
      h1: 'Página no encontrada',
      intent: 'navegacional',
      pageType: 'WebPage',
      schemaTypes: ['WebPage'],
      breadcrumb: [],
      linksTo: ['/'],
      noindex: true,
   },
];

/** '/contacto/' y '/contacto' son la misma página; '/' se conserva. */
export function normalizeSlug(slug) {
   let path = String(slug || '/').split(/[?#]/)[0];
   // Con build.format 'file' Astro prerenderiza /contacto.html e /index.html y
   // Astro.url.pathname lleva la extensión: la URL pública nunca la lleva.
   path = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
   path = path.replace(/\/+$/, '');
   return path === '' ? '/' : path;
}

export function getPage(slug) {
   const normalized = normalizeSlug(slug);
   return seoPages.find((page) => normalizeSlug(page.slug) === normalized);
}

/** Solo lo público, indexable y canónico. Lo usan sitemap y llms.txt. */
export function getIndexablePages() {
   return seoPages.filter((page) => !page.noindex);
}
