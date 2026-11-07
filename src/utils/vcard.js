import { siteConfig, socialLinks, waLink } from './config.js';

/**
 * Tarjeta de contacto vCard 3.0 (la versión que mejor leen iOS y Android al
 * escanear un QR o abrir un .vcf). Se construye SOLO desde site-config.js:
 * la usan el QR de la isla ContactCardQR y el endpoint /ozmobile.vcf.
 * Los campos vacíos no se emiten.
 */
const esc = (v) =>
   String(v)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/([,;])/g, '\\$1');

export function buildVCard({ compact = false } = {}) {
   const { site, contact, address, card } = siteConfig;
   const hasAddress = address.street || address.locality;
   const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:;${esc(site.name)};;;`,
      `FN:${esc(site.name)}`,
      `ORG:${esc(site.legalName || site.name)}`,
      !compact && card.title && `TITLE:${esc(card.title)}`,
      `TEL;TYPE=CELL,VOICE,pref:${contact.phone}`,
      contact.email && `EMAIL;TYPE=INTERNET,WORK:${contact.email}`,
      `URL:${siteConfig.absoluteUrl('/')}`,
      // wa.me sin mensaje en el QR: una URL corta = QR menos denso y más fácil de leer.
      `X-SOCIALPROFILE;TYPE=whatsapp:${compact ? waLink('') : waLink('card')}`,
      hasAddress &&
         `ADR;TYPE=WORK:;;${esc([address.street, address.neighborhood].filter(Boolean).join(', '))};${esc(address.locality)};${esc(address.region)};${esc(address.postalCode)};${esc(address.country)}`,
      // El QR debe seguir siendo legible: en modo compacto se omiten cargo, redes y nota.
      ...(compact ? [] : socialLinks().map((s) => `X-SOCIALPROFILE;TYPE=${s.key}:${s.url}`)),
      !compact && card.note && `NOTE:${esc(card.note)}`,
      'END:VCARD',
   ];
   return lines.filter(Boolean).join('\r\n');
}

export const vcardPath = () => `/${siteConfig.card.fileName}.vcf`;
