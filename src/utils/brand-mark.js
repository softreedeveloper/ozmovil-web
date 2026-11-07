/**
 * Geometría del logotipo OzMobile (manual de marca), en SVG puro.
 * Fuente única: la usan el componente <Logo> del sitio (colores por tema vía
 * CSS) y scripts/generate-images.mjs (favicons, logo.png, imagen OG).
 *
 * Colores de marca:
 *   primario   #0EA5FF   (órbita, "Oz")
 *   secundario #0B1F3B   (teléfono, herramientas, "Mobile")
 *   neutro     #E5E7EB
 *   fondo      #FFFFFF
 */
export const BRAND = {
   primary: '#0EA5FF',
   secondary: '#0B1F3B',
   neutral: '#E5E7EB',
   white: '#FFFFFF',
   /** Tono profundo del primario para degradados (icono de app). */
   primaryDeep: '#0B6FD8',
};

/**
 * Desarmador + llave cruzados, en un lienzo de 24×24 (trazos redondeados).
 * `stroke` = color de las herramientas.
 */
export function toolsSvg(stroke) {
   return `<g fill="none" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.6 4.6 12.4 12.4" stroke-width="1.7"/>
      <path d="M13.2 13.2 19 19" stroke-width="3.6"/>
      <path d="M15.1 8.9 5.6 18.4" stroke-width="2.6"/>
      <path d="M20.59 6.88A3.2 3.2 0 1 1 17.12 3.41" stroke-width="2.6"/>
   </g>`;
}

/**
 * Isotipo: teléfono inclinado con herramientas y órbita azul que lo cruza.
 * Lienzo 120×120. La órbita pasa POR DETRÁS del teléfono arriba a la derecha
 * y POR DELANTE abajo a la izquierda; para eso el teléfono se rellena con el
 * color del fondo (`fill`).
 *
 * @param {{ ink: string, orbit: string, fill: string, ids?: boolean }} c
 *   ink   = teléfono y herramientas · orbit = órbita · fill = fondo del teléfono
 */
export function isotypeSvgInner({ ink, orbit, fill }) {
   const ellipse = 'cx="58" cy="70" rx="54" ry="17"';
   const rot = 'rotate(-16 58 70)';
   return `
   <ellipse ${ellipse} transform="${rot}" fill="none" stroke="${orbit}" stroke-width="6"/>
   <g transform="rotate(14 60 58)">
      <rect x="36" y="8" width="48" height="96" rx="11" style="fill:${fill}" stroke="${ink}" stroke-width="7"/>
      <rect x="52" y="14.5" width="16" height="4" rx="2" fill="${ink}"/>
      <path d="M53 94.5h14" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
      <g transform="translate(33 35) scale(2.1)">${toolsSvg(ink)}</g>
   </g>
   <path d="M4 70A54 17 0 0 0 85 84.72" transform="${rot}" fill="none" stroke="${orbit}" stroke-width="6" stroke-linecap="round"/>`;
}

export function isotypeSvg(colors, size = 120) {
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">${isotypeSvgInner(colors)}</svg>`;
}

/**
 * Isotipo simplificado (apps, favicon): cuadro redondeado azul con
 * herramientas blancas. `shape`: 'square' | 'circle'. Lienzo 24×24.
 */
export function appIconSvg({ size = 512, shape = 'square', bg = 'gradient' } = {}) {
   const fill = bg === 'gradient' ? 'url(#oz-g)' : bg;
   const base =
      shape === 'circle'
         ? `<circle cx="12" cy="12" r="12" fill="${fill}"/>`
         : `<rect width="24" height="24" rx="5.4" fill="${fill}"/>`;
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
   <defs><linearGradient id="oz-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.primary}"/><stop offset="1" stop-color="${BRAND.primaryDeep}"/></linearGradient></defs>
   ${base}
   <g transform="translate(3.6 3.6) scale(0.7)">${toolsSvg(BRAND.white)}</g>
</svg>`;
}
