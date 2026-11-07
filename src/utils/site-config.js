/**
 * ============================================================================
 *  OzMobile — CONFIGURACIÓN CENTRAL DEL SITIO
 * ============================================================================
 * ÚNICO archivo donde se escriben nombre, dominios, contacto, ubicación,
 * horario, redes, mensajes de WhatsApp y assets. Todo lo demás (meta tags,
 * Schema.org, sitemap, robots, llms.txt, header, footer, botones de contacto,
 * tarjeta vCard y QR) lee de aquí.
 *
 * Reglas:
 *  - Solo datos, nada de lógica (la lógica vive en config.js).
 *  - URLs base sin barra final.
 *  - Un dato que no se conoce se deja '' / null / []: NO se muestra en la
 *    página ni se emite en el Schema. Nunca rellenar con datos inventados.
 *  - Toda ruta de `assets` debe existir en public/ (npm run seo:check lo valida).
 *
 * Marcados con  // ←  los valores pendientes de confirmar.
 */
export const siteConfigData = {
   site: {
      name: 'OzMobile',
      legalName: '', // ← razón social (opcional)
      tagline: 'Reparación de celulares y dispositivos electrónicos',
      title: 'OzMobile | Reparación de celulares y tablets',
      description:
         'Reparación de celulares y tablets: pantallas, baterías, centros de carga, cámaras y más. Diagnóstico y cotización rápida por WhatsApp.',
      author: 'OzMobile',
      locale: 'es_MX',
      language: 'es-MX',
   },

   urls: {
      production: 'https://www.ozmobile.com.mx', // ← dominio definitivo
      staging: 'https://stage.ozmobile.com.mx', // ← dominio de pruebas
      development: 'http://localhost:7005', // coincide con server.port de astro.config.mjs
      /** Política de barra final ('always' en astro.config.mjs). */
      trailingSlash: true,
   },

   contact: {
      /** E.164 para tel: y Schema (en México el "1" de móvil ya no se marca). */
      phone: '+525518070231',
      /** Tal como se muestra en pantalla. */
      phoneDisplay: '+52 1 55 1807 0231',
      /** Solo dígitos, con lada de país, para wa.me. */
      whatsapp: '5215518070231',
      email: '', // ← correo de contacto
   },

   /** Mensajes prellenados de WhatsApp por punto de contacto. `{servicio}` se reemplaza. */
   whatsappMessages: {
      default: 'Hola OzMobile, quiero información sobre una reparación.',
      hero: 'Hola OzMobile, quiero cotizar la reparación de mi celular.',
      service: 'Hola OzMobile, quiero cotizar: {servicio}. Mi equipo es: ',
      brand: 'Hola OzMobile, tengo un {servicio} y necesito una reparación.',
      device: 'Hola OzMobile, quiero cotizar la reparación de: {servicio}.',
      quote: 'Hola OzMobile, quiero un diagnóstico para mi equipo. Modelo: ',
      location: 'Hola OzMobile, ¿me comparten la ubicación y el horario del local?',
      card: 'Hola OzMobile, te escribo desde tu tarjeta de contacto.',
   },

   /** Dirección física. Vacía → la sección Ubicación solo muestra lo que exista. */
   address: {
      street: '', // ← calle y número
      neighborhood: '', // ← colonia
      locality: '', // ← alcaldía / municipio
      region: '', // ← p. ej. 'CDMX'
      postalCode: '', // ←
      country: 'MX', // ISO 3166-1 alpha-2
   },

   location: {
      /** Coordenadas para Schema (geo). null si no se conocen. */
      lat: null, // ← p. ej. 19.4326
      lng: null, // ← p. ej. -99.1332
      /** Enlace "Cómo llegar" (Google Maps). */
      mapsUrl: '', // ← https://maps.app.goo.gl/...
      /** URL de "Insertar mapa" de Google Maps (src del iframe). */
      mapEmbedUrl: '', // ← https://www.google.com/maps/embed?pb=...
   },

   /**
    * Horario. `days` en formato Schema (Mo, Tu, We, Th, Fr, Sa, Su).
    * Ej.: { label: 'Lunes a viernes', days: ['Mo','Tu','We','Th','Fr'], opens: '10:00', closes: '19:00' }
    */
   openingHours: [], // ←

   social: {
      // Solo perfiles reales y activos: se muestran en footer/tarjeta y alimentan `sameAs`.
      instagram: '', // ← https://www.instagram.com/...
      facebook: '', // ← https://www.facebook.com/...
      tiktok: '', // ← https://www.tiktok.com/@...
      youtube: '', // ←
      x: '', // ← handle con @ para twitter:site, p. ej. '@ozmobile'
   },

   business: {
      schemaType: 'LocalBusiness',
      foundingDate: '',
      areaServed: 'Ciudad de México', // ←
      areaServedType: 'City',
      priceRange: '', // ← p. ej. '$$' (solo si es real)
      contactType: 'customer service',
      availableLanguage: ['Spanish'],
   },

   /** Tarjeta de contacto (vCard / QR). */
   card: {
      fileName: 'ozmobile', // → /ozmobile.vcf
      title: 'Servicio técnico de celulares',
      note: 'Reparación de celulares y tablets. Cotiza por WhatsApp.',
   },

   assets: {
      logo: '/img/logo.png',
      logoWidth: 512,
      logoHeight: 512,
      defaultOgImage: '/img/og-default.png',
      favicon: '/favicon.ico',
   },

   theme: {
      /** theme-color del navegador por tema (manual de marca). */
      light: '#FFFFFF',
      dark: '#050D1A',
   },

   seo: {
      robots: {
         noindex: 'noindex, nofollow',
         index: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
      },
      titleSuffix: ' | OzMobile',
      themeColor: '#0B1F3B',
   },
};
