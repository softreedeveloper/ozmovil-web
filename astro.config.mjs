import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { siteConfigData } from './src/utils/site-config.js';

// Landing única → sitio 100 % estático (HTML prerenderizado servido por el CDN).
// `site` y `trailingSlash` salen de site-config.js: un solo lugar para el dominio
// y la política de barra final (canonical, sitemap, Schema y hrefs la comparten).
export default defineConfig({
   site: siteConfigData.urls.production,
   output: 'static',
   trailingSlash: siteConfigData.urls.trailingSlash ? 'always' : 'never',
   integrations: [tailwind({ applyBaseStyles: false }), react()],
   build: {
      // CSS inline en el <head>: evita la petición que bloquea el render.
      inlineStylesheets: 'always',
   },
   vite: {
      resolve: {
         alias: {
            '@': '/src/',
            '@components': '/src/components/',
            '@layouts': '/src/layouts/',
            '@sections': '/src/sections/',
            '@styles': '/src/styles/',
            '@utils': '/src/utils/',
            '@constants': '/src/constants/',
         },
      },
   },
   server: {
      port: 7005,
   },
});
