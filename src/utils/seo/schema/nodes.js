// Import relativo (no alias): scripts/seo-check.mjs carga este módulo con Node.
import { siteConfig, socialLinks } from '../../config.js';
import { services } from '../../../constants/content.js';

const DAYS = {
   Mo: 'Monday',
   Tu: 'Tuesday',
   We: 'Wednesday',
   Th: 'Thursday',
   Fr: 'Friday',
   Sa: 'Saturday',
   Su: 'Sunday',
};

/**
 * Constructores de nodos Schema.org.
 *
 * - Cada nodo lleva un @id estable derivado de la URL canónica, para que los
 *   demás lo referencien con { '@id': … } en lugar de repetirlo.
 * - Ningún constructor inventa datos: un campo vacío en site-config o en el
 *   registro se elimina con prune() y no se emite.
 * - Solo se declara lo que el usuario ve en la página.
 */

export const ID = {
   organization: () => `${siteConfig.canonicalUrl}/#organization`,
   website: () => `${siteConfig.canonicalUrl}/#website`,
   logo: () => `${siteConfig.canonicalUrl}/#logo`,
   webPage: (slug) => `${siteConfig.absoluteUrl(slug)}#webpage`,
   breadcrumb: (slug) => `${siteConfig.absoluteUrl(slug)}#breadcrumb`,
   service: (slug, key = 'service') => `${siteConfig.absoluteUrl(slug)}#${key}`,
   catalog: (slug) => `${siteConfig.absoluteUrl(slug)}#servicios`,
   faq: (slug) => `${siteConfig.absoluteUrl(slug)}#faq`,
   article: (slug) => `${siteConfig.absoluteUrl(slug)}#article`,
   product: (slug) => `${siteConfig.absoluteUrl(slug)}#product`,
   howto: (slug) => `${siteConfig.absoluteUrl(slug)}#howto`,
};

export const ref = (id) => ({ '@id': id });

const lang = () => siteConfig.site.language;

// --- Entidad -----------------------------------------------------------------

export function buildOrganization() {
   const { site, contact, address, business, location, openingHours } = siteConfig;
   const hasAddress = address.locality || address.street;
   const hasGeo = typeof location?.lat === 'number' && typeof location?.lng === 'number';

   return {
      '@type': business.schemaType || 'Organization',
      '@id': ID.organization(),
      name: site.name,
      legalName: site.legalName,
      description: site.description,
      url: siteConfig.absoluteUrl('/'),
      logo: {
         '@type': 'ImageObject',
         '@id': ID.logo(),
         url: siteConfig.logoUrl,
         width: siteConfig.assets.logoWidth,
         height: siteConfig.assets.logoHeight,
         caption: site.name,
      },
      image: ref(ID.logo()),
      email: contact.email,
      telephone: contact.phone,
      foundingDate: business.foundingDate,
      address: hasAddress
         ? {
              '@type': 'PostalAddress',
              streetAddress: [address.street, address.neighborhood].filter(Boolean).join(', '),
              addressLocality: address.locality,
              addressRegion: address.region,
              postalCode: address.postalCode,
              addressCountry: address.country,
           }
         : undefined,
      contactPoint:
         contact.email || contact.phone
            ? {
                 '@type': 'ContactPoint',
                 contactType: business.contactType,
                 email: contact.email,
                 telephone: contact.phone,
                 availableLanguage: business.availableLanguage,
              }
            : undefined,
      sameAs: socialLinks().map((s) => s.url),
      areaServed: business.areaServed
         ? { '@type': business.areaServedType || 'Country', name: business.areaServed }
         : undefined,
      // Propiedades de LocalBusiness: solo se emiten si existen en site-config.
      geo: hasGeo ? { '@type': 'GeoCoordinates', latitude: location.lat, longitude: location.lng } : undefined,
      hasMap: location?.mapsUrl,
      // Los servicios son atributo de la entidad; se listan en la home (única página indexable).
      hasOfferCatalog: buildOfferCatalog({
         slug: '/',
         name: 'Servicios de reparación de celulares y tablets',
         services,
      }),
      priceRange: business.priceRange,
      openingHoursSpecification: (openingHours ?? [])
         .filter((h) => !h.closed)
         .map((h) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: h.days.map((d) => `https://schema.org/${DAYS[d]}`),
            opens: h.opens,
            closes: h.closes,
         })),
   };
}

/**
 * Sin SearchAction salvo que exista una URL de resultados real
 * (https://dominio/buscar?q=…). Un buscador en overlay no cuenta.
 */
export function buildWebSite() {
   return {
      '@type': 'WebSite',
      '@id': ID.website(),
      name: siteConfig.site.name,
      url: siteConfig.absoluteUrl('/'),
      publisher: ref(ID.organization()),
      inLanguage: lang(),
   };
}

// --- Página --------------------------------------------------------------------

export function buildWebPage(page, seo) {
   const slug = page?.slug ?? '/';
   return {
      '@type': page?.pageType ?? 'WebPage',
      '@id': ID.webPage(slug),
      url: seo.canonical,
      name: page?.h1 ?? seo.title,
      description: seo.description,
      isPartOf: ref(ID.website()),
      about: ref(ID.organization()),
      breadcrumb: page?.breadcrumb?.length ? ref(ID.breadcrumb(slug)) : undefined,
      primaryImageOfPage: { '@type': 'ImageObject', url: seo.image, width: 1200, height: 630 },
      inLanguage: lang(),
      dateModified: page?.lastmod,
   };
}

/** "Inicio" se antepone solo; el registro no lo incluye. */
export function buildBreadcrumbList(page) {
   const trail = page?.breadcrumb ?? [];
   if (!trail.length) return null;
   const items = [{ label: 'Inicio', href: '/' }, ...trail];
   return {
      '@type': 'BreadcrumbList',
      '@id': ID.breadcrumb(page.slug),
      itemListElement: items.map((item, index) => ({
         '@type': 'ListItem',
         position: index + 1,
         name: item.label,
         item: siteConfig.absoluteUrl(item.href),
      })),
   };
}

// --- Nodos de contenido (los aporta cada página por la prop `schema`) ------------

export function buildService({ slug, key, name, description, serviceType, areaServed, offer }) {
   return {
      '@type': 'Service',
      '@id': ID.service(slug, key),
      name,
      description,
      serviceType,
      provider: ref(ID.organization()),
      areaServed:
         areaServed ?? (siteConfig.business.areaServed && { '@type': 'Country', name: siteConfig.business.areaServed }),
      url: siteConfig.absoluteUrl(slug),
      offers: offer ? buildOffer({ ...offer, url: siteConfig.absoluteUrl(slug) }) : undefined,
   };
}

/**
 * Catálogo de servicios VISIBLES en la página, colgado de la entidad
 * (Organization/LocalBusiness) mediante `hasOfferCatalog`. Sin precios.
 */
export function buildOfferCatalog({ slug, name, services = [] }) {
   if (!services.length) return null;
   return {
      '@type': 'OfferCatalog',
      '@id': ID.catalog(slug),
      name,
      itemListElement: services.map((s) => ({
         '@type': 'Offer',
         itemOffered: {
            '@type': 'Service',
            name: s.name,
            description: s.description,
            provider: ref(ID.organization()),
         },
      })),
   };
}

/**
 * Precio: solo el que se muestra en la página. "Desde $X" → priceSpecification
 * con minPrice. No usar AggregateOffer sin offerCount real.
 */
export function buildOffer({ price, minPrice, currency, url, description, availability }) {
   return {
      '@type': 'Offer',
      price: price != null ? String(price) : undefined,
      priceCurrency: currency,
      priceSpecification:
         minPrice != null
            ? { '@type': 'PriceSpecification', minPrice: Number(minPrice), priceCurrency: currency }
            : undefined,
      availability: availability ? `https://schema.org/${availability}` : undefined,
      description,
      url,
   };
}

/**
 * Solo con preguntas VISIBLES en la página, con el mismo texto. Importar la
 * misma constante que renderiza el acordeón. Acepta {q,a} o {question,answer}.
 */
export function buildFAQPage({ slug, faqs = [] }) {
   if (!faqs.length) return null;
   return {
      '@type': 'FAQPage',
      '@id': ID.faq(slug),
      isPartOf: ref(ID.webPage(slug)),
      mainEntity: faqs.map((faq) => ({
         '@type': 'Question',
         name: faq.question ?? faq.q,
         acceptedAnswer: { '@type': 'Answer', text: faq.answer ?? faq.a },
      })),
   };
}

/** Sin totalTime salvo que la página muestre una duración. */
export function buildHowTo({ slug, name, description, steps = [], tool, totalTime }) {
   if (!steps.length) return null;
   return {
      '@type': 'HowTo',
      '@id': ID.howto(slug),
      name,
      description,
      totalTime,
      tool: tool ? { '@type': 'HowToTool', name: tool } : undefined,
      step: steps.map((s, i) => ({
         '@type': 'HowToStep',
         position: i + 1,
         name: s.name ?? s.title,
         text: s.text ?? s.description,
      })),
   };
}

/**
 * Artículo/post. Fechas en ISO 'AAAA-MM-DD'. headline = H1 (≤ 110 caracteres),
 * no el title con sufijo de marca.
 */
export function buildArticle({
   slug,
   headline,
   description,
   image,
   datePublished,
   dateModified,
   author,
   type = 'BlogPosting',
}) {
   return {
      '@type': type,
      '@id': ID.article(slug),
      headline,
      description,
      image: image ? siteConfig.assetUrl(image) : undefined,
      url: siteConfig.absoluteUrl(slug),
      isPartOf: ref(ID.webPage(slug)),
      mainEntityOfPage: ref(ID.webPage(slug)),
      author: author ? { '@type': 'Person', name: author } : ref(ID.organization()),
      publisher: ref(ID.organization()),
      datePublished,
      dateModified: dateModified ?? datePublished,
      inLanguage: lang(),
   };
}

export function buildProduct({ slug, name, description, image, sku, brand, offer }) {
   return {
      '@type': 'Product',
      '@id': ID.product(slug),
      name,
      description,
      image: image ? siteConfig.assetUrl(image) : undefined,
      sku,
      brand: { '@type': 'Brand', name: brand ?? siteConfig.site.name },
      offers: offer ? buildOffer({ ...offer, url: siteConfig.absoluteUrl(slug) }) : undefined,
   };
}

export function buildVideoObject({ name, description, thumbnailUrl, uploadDate, embedUrl, contentUrl, duration }) {
   return { '@type': 'VideoObject', name, description, thumbnailUrl, uploadDate, embedUrl, contentUrl, duration };
}
