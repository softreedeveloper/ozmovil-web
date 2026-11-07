import { siteConfigData } from './site-config.js';

/**
 * Configuración resuelta: entorno, URLs y helpers. Única capa con lógica sobre
 * site-config.js. Se importa con ruta relativa (no alias) para que los scripts
 * de Node (scripts/seo-check.mjs) puedan cargarla sin Vite.
 *
 * Entorno — orden de precedencia:
 *   1. PUBLIC_SITE_ENV   override explícito: 'production' | 'staging' | 'development'
 *   2. CONTEXT (Netlify) 'production' → production; deploy-preview/branch-deploy → staging
 *      (Vercel: VERCEL_ENV 'production' | 'preview'; Cloudflare Pages: CF_PAGES_BRANCH)
 *   3. import.meta.env.DEV → development
 *   4. Por defecto: development (falla cerrado → noindex)
 *
 * NUNCA inferir el entorno solo por el hostname del request: las páginas
 * prerenderizadas reciben un request sintético de localhost durante el build
 * y acabarían con canónicas a localhost.
 */
function readEnv(key) {
   const fromVite = import.meta.env?.[key];
   if (fromVite) return String(fromVite);
   if (typeof process !== 'undefined' && process.env?.[key]) return String(process.env[key]);
   return undefined;
}

function detectEnvironment() {
   const explicit = readEnv('PUBLIC_SITE_ENV');
   if (explicit) return explicit;

   const netlify = readEnv('CONTEXT');
   if (netlify === 'production') return 'production';
   if (netlify === 'deploy-preview' || netlify === 'branch-deploy') return 'staging';

   const vercel = readEnv('VERCEL_ENV');
   if (vercel === 'production') return 'production';
   if (vercel === 'preview') return 'staging';

   if (import.meta.env?.DEV) return 'development';
   return 'development';
}

const environment = detectEnvironment();

const stripTrailing = (url) => String(url).replace(/\/+$/, '');

/** Aplica la política de barra final a una ruta. '/' y archivos con extensión no se tocan. */
export function formatPath(path = '/') {
   const [pathname, hash = ''] = String(path).trim().split('#');
   let clean = '/' + pathname.replace(/^\/+/, '');
   if (clean !== '/') {
      clean = clean.replace(/\/+$/, '');
      const isFile = /\.[a-z0-9]{2,5}$/i.test(clean);
      if (siteConfigData.urls.trailingSlash && !isFile) clean += '/';
   }
   return hash ? `${clean}#${hash}` : clean;
}

export const siteConfig = {
   ...siteConfigData,

   environment,
   isDev: environment === 'development',
   isStaging: environment === 'staging',
   isProduction: environment === 'production',

   /** URL del entorno actual (previews, logs). No usar en metadata. */
   get siteUrl() {
      if (this.isProduction) return stripTrailing(this.urls.production);
      if (this.isStaging) return stripTrailing(this.urls.staging);
      return stripTrailing(this.urls.development);
   },

   /** Dominio canónico: SIEMPRE producción. Staging va con noindex. */
   get canonicalUrl() {
      return stripTrailing(this.urls.production);
   },

   /** Todo lo que no sea producción es no indexable. */
   get noIndex() {
      return !this.isProduction;
   },

   /**
    * Única vía para construir URLs absolutas (canonical, og:url, og:image,
    * Schema, sitemap, llms.txt). Normaliza dobles barras, espacios y la
    * política de barra final.
    */
   absoluteUrl(path = '/') {
      const clean = String(path).trim();
      if (/^https?:\/\//i.test(clean)) return clean;
      return `${this.canonicalUrl}${formatPath(clean)}`;
   },

   /** Assets (imágenes, logo): sin política de barra final. */
   assetUrl(path) {
      const clean = String(path).trim();
      if (/^https?:\/\//i.test(clean)) return clean;
      return `${this.canonicalUrl}/${clean.replace(/^\/+/, '')}`;
   },

   get logoUrl() {
      return this.assetUrl(this.assets.logo);
   },

   get defaultImage() {
      return this.assetUrl(this.assets.defaultOgImage);
   },
};

// --- Contacto -----------------------------------------------------------------
// Helpers que construyen enlaces de contacto SIEMPRE desde site-config.js, para
// que ningún componente escriba el número a mano.

/** Enlace wa.me con mensaje prellenado. `key` = clave de whatsappMessages o texto libre. */
export function waLink(keyOrText = 'default', vars = {}) {
   const template = siteConfigData.whatsappMessages[keyOrText] ?? keyOrText;
   const text = template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
   const base = `https://wa.me/${siteConfigData.contact.whatsapp}`;
   return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const telHref = () => `tel:${siteConfigData.contact.phone}`;

export const mailHref = () => (siteConfigData.contact.email ? `mailto:${siteConfigData.contact.email}` : '');

const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube', x: 'X' };

/** Redes con URL real, en orden: [{ key, label, url }]. `x` se convierte de handle a URL. */
export function socialLinks() {
   return Object.entries(siteConfigData.social)
      .map(([key, value]) => {
         if (!value) return null;
         const url = key === 'x' && value.startsWith('@') ? `https://x.com/${value.slice(1)}` : value;
         return /^https?:\/\//.test(url) ? { key, label: SOCIAL_LABELS[key] ?? key, url } : null;
      })
      .filter(Boolean);
}

/** Dirección en una línea, o '' si no hay datos. */
export function addressLine() {
   const a = siteConfigData.address;
   return [a.street, a.neighborhood, a.locality, a.region, a.postalCode].filter(Boolean).join(', ');
}

const DAY_ES = { Mo: 'Lun', Tu: 'Mar', We: 'Mié', Th: 'Jue', Fr: 'Vie', Sa: 'Sáb', Su: 'Dom' };

/** Horario legible: [{ label, time }]. */
export function openingHoursDisplay() {
   return siteConfigData.openingHours.map((h) => ({
      label: h.label || h.days.map((d) => DAY_ES[d] ?? d).join(', '),
      time: h.closed ? 'Cerrado' : `${h.opens} – ${h.closes}`,
   }));
}
