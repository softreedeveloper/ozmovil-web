# CLAUDE.md — ozmobil-web

Landing única de **OzMobile** (reparación de celulares y dispositivos electrónicos). Astro 5 estático + Tailwind 3 + una isla React (QR). Deploy en Netlify.

## Comandos

```
npm run dev        # astro dev, puerto 7005
npm run build      # corre seo:check (prebuild) y astro build → dist/
npm run preview    # sirve dist/ en 7005
npm run check      # astro check (tipos)
npm run seo:check  # validador SEO estático (SEO_STRICT=1 → falla con CRITICAL)
npm run seo:audit  # auditor HTTP: npm run seo:audit -- https://dominio
npm run og         # regenera logo, favicons, manifest y og-default.png (sharp)
npm run format     # prettier
```

## Fuente única de datos

- **`src/utils/site-config.js`** — nombre, dominios, teléfono/WhatsApp, mensajes prellenados, dirección, coordenadas, mapa, horario, redes, tarjeta vCard, colores de theme-color. Lo vacío no se muestra ni entra al Schema. Es el ÚNICO lugar donde se escribe un dato de contacto.
- `src/utils/config.js` — entorno (`PUBLIC_SITE_ENV`), `absoluteUrl()`, y helpers `waLink(clave|texto, vars)`, `telHref()`, `socialLinks()`, `addressLine()`, `openingHoursDisplay()`.
- `src/constants/content.js` — servicios, marcas, pasos, ventajas y FAQs. Alimentan el markup **y** el Schema (OfferCatalog, FAQPage).
- `src/constants/nav.js` — anclas (con icono) de Header, Footer y barra inferior móvil. `mobileOnly: true` las oculta en el header de escritorio.

## SEO (arquitectura skill `seo-tecnico`)

`site-config.js → config.js → seo/registry.js → seo.js → components/seo/SEOHead.astro + Schema.astro → sitemap.xml / robots.txt / llms.txt`.

- Title/description/H1 de la página viven en `src/utils/seo/registry.js`; el H1 del Hero se lee de ahí.
- Un solo `<title>`, canonical y bloque JSON-LD por página, solo desde `components/seo/`.
- Schema: `LocalBusiness` (+ `hasOfferCatalog`, geo/horario/dirección si existen), `WebSite`, `WebPage`, `FAQPage`.
- Fuera de producción: `noindex` + `robots.txt Disallow: /`. Netlify fija `PUBLIC_SITE_ENV` por contexto en `netlify.toml`.
- Política de barra final: `trailingSlash: true` en site-config ↔ `'always'` en astro.config.

## Contacto / CTAs

Todo botón de WhatsApp o llamada usa `components/ui/ContactButton.astro` (o `waLink()`), con `id` único y `data-placement` ∈ `header|hero|contenido|footer|sticky` (convención de la skill `tracking-conversiones`, lista para GA4). Verificar ids únicos: `grep -o ' id="[^"]*"' dist/index.html | sort | uniq -d` debe salir vacío.

## Navegación móvil (tipo app)

En < lg el header queda como barra superior de app (logo, llamar, tema) y la navegación vive en `components/layout/MobileTabBar.astro`: pestañas Inicio · Servicios · WhatsApp (botón central elevado) · Tarjeta · Menú, con pestaña activa por scroll-spy. "Menú" abre una hoja inferior (`<dialog>` nativo) con todas las secciones, WhatsApp, llamar, tema y redes. La barra es `sticky bottom-0` (no `fixed`, igual que movapp) y debe ser el último elemento del `<body>`. El botón flotante de WhatsApp solo aparece en escritorio.

## Tema claro/oscuro

Tokens RGB en `src/styles/global.css` (`:root` y `.dark`) mapeados en `tailwind.config.mjs`. El script inline del `<head>` (Layout.astro) aplica el tema antes de pintar (localStorage `theme` o preferencia del sistema). `[data-theme-toggle]` alterna y persiste.

## Marca (manual de marca OzMobile)

- Colores: primario `#0EA5FF`, secundario `#0B1F3B`, neutro `#E5E7EB`, fondo `#FFFFFF`. Tipografía: Montserrat (títulos, botones, logotipo) + Inter (texto).
- **Geometría del logotipo: `src/utils/brand-mark.js`** (isotipo, herramientas, icono de app). Es la fuente única para el sitio y para los PNG.
- `components/ui/Logo.astro`: variantes `horizontal` (header, footer, tarjeta), `vertical` (404), `isotype` (marca de agua del CTA) y `app` (pantalla del teléfono del Hero). Versión negativa automática en tema oscuro; la órbita y "Oz" siempre en `#0EA5FF`.
- `npm run og` regenera favicons, `img/logo.png` (icono de app, también va al centro del QR), `img/og-default.png` y los logotipos descargables en `public/brand/` (SVG + PNG; texto convertido a trazos con Montserrat vía opentype.js).
- Contraste: `#0EA5FF` sobre blanco no llega a AA para texto, así que en tema claro el texto de acento usa `--accent` = `#0369A1`; `--brand` (`#0EA5FF`) se reserva para logotipo y decoración.

## Paleta y movimiento

Acento azul de marca (`--brand`, `--accent`, `--accent-2`, `--glow` en `global.css`) sobre blanco (claro) o marino casi negro (oscuro). Los CTA de WhatsApp son verde WhatsApp (`.btn-whatsapp`, tokens `--whatsapp` #25D366 y `--whatsapp-text` para texto con contraste AA) y el bloque CTA final es azul → negro fijo. Efectos: manchas de luz animadas (`animate-blob`), H1 con `.text-gradient`, teléfono con inclinación 3D (`[data-tilt]`), foco de luz en tarjetas (`.spotlight` + `[data-spotlight]`), revelado al scroll (`[data-reveal]`, variante `="scale"`), línea del proceso (`[data-line]`), barra de progreso en el header y carrusel infinito de marcas. Todo se desactiva con `prefers-reduced-motion`; los efectos de cursor solo corren con ratón.

## Logos de marcas

`src/constants/content.js → brands` (`icon` = slug de [simple-icons](https://simpleicons.org), CC0). `src/utils/brand-icons.js` recorta cada logo a su contorno (svg-path-bbox) y `components/ui/BrandLogo.astro` lo escala para que isotipos y logotipos de texto se vean equilibrados. Todo se resuelve en el build (SVG inline, sin JS). Las marcas son de sus dueños (uso nominativo; aviso en el footer).

## Tarjeta QR

`sections/home/ContactCard.astro` (tarjeta visual + “Guardar contacto” → `/ozmobile.vcf`, sin JS) y la isla `components/islands/ContactCardQR.jsx` (`client:visible`): selector vCard / WhatsApp / Sitio / Ubicación (esta solo si hay `location.mapsUrl`), descarga PNG, descarga .vcf y compartir. El vCard sale de `src/utils/vcard.js` (versión compacta para el QR, completa para el .vcf). El QR siempre se dibuja oscuro sobre blanco.

## Pendientes de negocio

Dominio definitivo, dirección, horario, mapa, email y redes en `site-config.js`; revisar el copy propuesto de `constants/content.js` y `registry.js`; logo definitivo (`npm run og` o reemplazar PNG manteniendo dimensiones).
