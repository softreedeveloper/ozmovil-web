import { useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

/**
 * Generador de QR con selector de tipo (vCard / WhatsApp / sitio / ubicación).
 * Todos los valores llegan como props desde ContactCard.astro, que los arma
 * con site-config.js — esta isla no conoce ningún dato de contacto propio.
 *
 * El QR se dibuja siempre oscuro sobre blanco (en ambos temas): es lo que
 * mejor leen las cámaras.
 */

const ICONS = {
   user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0',
   globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z',
   pin: 'M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
   whatsapp: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z',
   download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
   share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
   card: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM13 10h5M13 14h3',
   check: 'M20 6 9 17l-5-5',
};

function Svg({ name, size = 18 }) {
   return (
      <svg
         viewBox="0 0 24 24"
         width={size}
         height={size}
         fill="none"
         stroke="currentColor"
         strokeWidth="1.75"
         strokeLinecap="round"
         strokeLinejoin="round"
         aria-hidden="true"
         focusable="false"
      >
         <path d={ICONS[name] ?? ICONS.check} />
      </svg>
   );
}

export default function ContactCardQR({ options = [], share, fileName = 'contacto', vcard = '' }) {
   const [active, setActive] = useState(options[0]?.key);
   const [status, setStatus] = useState('');
   const wrapRef = useRef(null);
   const current = useMemo(() => options.find((o) => o.key === active) ?? options[0], [active, options]);

   if (!current) return null;

   const flash = (msg) => {
      setStatus(msg);
      window.clearTimeout(flash.t);
      flash.t = window.setTimeout(() => setStatus(''), 2500);
   };

   const downloadPng = () => {
      const canvas = wrapRef.current?.querySelector('canvas');
      if (!canvas) return;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${fileName}-qr-${current.key}.png`;
      a.click();
      flash('QR descargado');
   };

   const downloadVcf = () => {
      const blob = new Blob([vcard + '\r\n'], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.vcf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      flash('Contacto descargado');
   };

   const doShare = async () => {
      try {
         if (navigator.share) {
            await navigator.share(share);
            return;
         }
         await navigator.clipboard.writeText(share.url);
         flash('Enlace copiado');
      } catch (err) {
         if (err?.name !== 'AbortError') flash('No se pudo compartir');
      }
   };

   const onKeyDown = (e) => {
      const idx = options.findIndex((o) => o.key === current.key);
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = options[(idx + 1) % options.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = options[(idx - 1 + options.length) % options.length];
      if (next) {
         e.preventDefault();
         setActive(next.key);
         e.currentTarget.querySelector(`[data-key="${next.key}"]`)?.focus();
      }
   };

   return (
      <div className="flex h-full flex-col">
         <p className="text-sm font-semibold">Tipo de código QR</p>
         <div
            role="radiogroup"
            aria-label="Tipo de código QR"
            onKeyDown={onKeyDown}
            className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1 sm:flex"
         >
            {options.map((o) => {
               const selected = o.key === current.key;
               return (
                  <button
                     key={o.key}
                     type="button"
                     role="radio"
                     aria-checked={selected}
                     tabIndex={selected ? 0 : -1}
                     data-key={o.key}
                     onClick={() => setActive(o.key)}
                     className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        selected ? 'bg-surface text-fg shadow-card' : 'text-subtle hover:text-fg'
                     }`}
                  >
                     <Svg name={o.icon} size={16} />
                     {o.label}
                  </button>
               );
            })}
         </div>

         <div ref={wrapRef} className="mx-auto mt-7 w-full max-w-[17rem]">
            <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5">
               <QRCodeCanvas
                  key={current.key}
                  value={current.value}
                  size={1024}
                  level="Q"
                  marginSize={2}
                  bgColor="#ffffff"
                  fgColor="#0a0a0b"
                  title={`Código QR: ${current.label}`}
                  role="img"
                  aria-label={`Código QR para ${current.label}`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  imageSettings={{ src: '/img/logo.png', height: 150, width: 150, excavate: true }}
               />
            </div>
         </div>
         <p className="mt-4 text-center text-sm text-subtle" aria-live="polite">
            {status || current.hint}
         </p>

         <div className="mt-auto grid grid-cols-2 gap-2 pt-7">
            <button type="button" onClick={downloadPng} className="btn-ghost !px-4 text-sm whitespace-nowrap">
               <Svg name="download" size={16} />
               Descargar QR
            </button>
            <button type="button" onClick={downloadVcf} className="btn-ghost !px-4 text-sm whitespace-nowrap">
               <Svg name="card" size={16} />
               Archivo .vcf
            </button>
            <button type="button" onClick={doShare} className="btn-ghost col-span-2 !px-4 text-sm">
               <Svg name="share" size={16} />
               Compartir
            </button>
         </div>
      </div>
   );
}
