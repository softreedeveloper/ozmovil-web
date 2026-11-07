/**
 * Los colores son tokens CSS (src/styles/global.css) definidos para :root (claro)
 * y .dark (oscuro). Cambiar la paleta = editar esas variables, no este archivo.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
   darkMode: 'class',
   content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
   theme: {
      container: {
         center: true,
         padding: { DEFAULT: '1.25rem', sm: '1.5rem', lg: '2rem' },
         screens: { '2xl': '1200px' },
      },
      extend: {
         fontFamily: {
            // Montserrat: tipografía del manual de marca (títulos, botones, logotipo).
            display: ['"Montserrat Variable"', 'Montserrat', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            sans: [
               '"Inter Variable"',
               'Inter',
               'ui-sans-serif',
               'system-ui',
               '-apple-system',
               'Segoe UI',
               'Roboto',
               'sans-serif',
            ],
         },
         colors: {
            brand: token('brand'),
            navy: '#0B1F3B',
            bg: token('bg'),
            surface: token('surface'),
            muted: token('muted'),
            fg: token('fg'),
            subtle: token('subtle'),
            line: token('line'),
            accent: token('accent'),
            'accent-2': token('accent-2'),
            'accent-fg': token('accent-fg'),
            glow: token('glow'),
            'accent-soft': token('accent-soft'),
            whatsapp: token('whatsapp'),
            'whatsapp-text': token('whatsapp-text'),
         },
         spacing: {
            section: '6rem',
         },
         borderRadius: {
            '4xl': '2rem',
         },
         boxShadow: {
            card: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)',
            glow: '0 0 0 1px rgb(var(--accent) / 0.25), 0 20px 50px -20px rgb(var(--accent) / 0.45)',
         },
         keyframes: {
            fadeUp: {
               '0%': { opacity: '0', transform: 'translateY(14px)' },
               '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            float: {
               '0%, 100%': { transform: 'translateY(0)' },
               '50%': { transform: 'translateY(-10px)' },
            },
            blob: {
               '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
               '33%': { transform: 'translate(40px, -30px) scale(1.08)' },
               '66%': { transform: 'translate(-30px, 20px) scale(0.95)' },
            },
            marquee: {
               '0%': { transform: 'translateX(0)' },
               '100%': { transform: 'translateX(-50%)' },
            },
            scan: {
               '0%': { transform: 'translateY(-10%)', opacity: '0' },
               '15%, 85%': { opacity: '1' },
               '100%': { transform: 'translateY(1000%)', opacity: '0' },
            },
            progress: {
               '0%': { width: '8%' },
               '70%, 100%': { width: '100%' },
            },
            spinSlow: {
               to: { transform: 'rotate(360deg)' },
            },
            pulseRing: {
               '0%': { transform: 'scale(1)', opacity: '0.55' },
               '100%': { transform: 'scale(1.6)', opacity: '0' },
            },
         },
         animation: {
            fadeUp: 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
            float: 'float 6s ease-in-out infinite',
            blob: 'blob 18s ease-in-out infinite',
            marquee: 'marquee 40s linear infinite',
            'marquee-reverse': 'marquee 46s linear infinite reverse',
            scan: 'scan 3.2s ease-in-out infinite',
            progress: 'progress 3.2s cubic-bezier(0.65, 0, 0.35, 1) infinite',
            spinSlow: 'spinSlow 14s linear infinite',
            pulseRing: 'pulseRing 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
         },
      },
   },
   plugins: [],
};
