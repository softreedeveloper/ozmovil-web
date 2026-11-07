import * as icons from 'simple-icons';
import { svgPathBbox } from 'svg-path-bbox';

/**
 * Datos de un logo de simple-icons (CC0) recortado a su contorno real.
 * Los logotipos de texto (Samsung, OPPO, Sony…) ocupan una franja delgada de
 * su lienzo 24×24; recortar el viewBox permite mostrarlos a un tamaño legible
 * junto a los isotipos cuadrados. Se resuelve en el build (sin JS en cliente).
 */
export function brandIcon(slug) {
   const key = `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}`;
   const data = icons[key];
   if (!data) return null;
   const [x0, y0, x1, y1] = svgPathBbox(data.path);
   const pad = 0.4;
   const w = x1 - x0 + pad * 2;
   const h = y1 - y0 + pad * 2;
   return {
      path: data.path,
      hex: data.hex,
      viewBox: `${(x0 - pad).toFixed(2)} ${(y0 - pad).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`,
      aspect: w / h,
      /** Logotipo de texto (más ancho que alto): no hace falta repetir el nombre al lado. */
      wordmark: w / h > 1.8,
   };
}
