import { buildOrganization, buildWebSite, buildWebPage, buildBreadcrumbList, ID } from './nodes.js';

/**
 * Un solo bloque JSON-LD por página con un @graph. Organization, WebSite,
 * WebPage y BreadcrumbList se añaden solos; la página solo aporta sus nodos
 * propios (Service, FAQPage, BlogPosting, Product…).
 */

/** Quita undefined, null, '' y arrays/objetos vacíos, recursivamente. */
export function prune(value) {
   if (Array.isArray(value)) {
      const cleaned = value.map(prune).filter((item) => item !== undefined);
      return cleaned.length ? cleaned : undefined;
   }
   if (value && typeof value === 'object') {
      const entries = Object.entries(value)
         .map(([k, v]) => [k, prune(v)])
         .filter(([, v]) => v !== undefined);
      return entries.length ? Object.fromEntries(entries) : undefined;
   }
   if (value === null || value === '') return undefined;
   return value;
}

export function buildGraph(page, seo, extra = []) {
   const nodes = [
      buildOrganization(),
      buildWebSite(),
      buildWebPage(page, seo),
      buildBreadcrumbList(page),
      ...extra,
   ].filter(Boolean);

   const seen = new Set();
   const unique = nodes.filter((node) => {
      const id = node['@id'];
      if (!id) return true;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
   });

   return prune({ '@context': 'https://schema.org', '@graph': unique });
}

/**
 * Serializa para <script type="application/ld+json">. Escapa '<' para que un
 * texto con "</script>" no cierre la etiqueta.
 */
export function serializeGraph(graph) {
   return JSON.stringify(graph).replace(/</g, '\\u003c');
}

/** Devuelve [{ severity, message }]; vacío si el grafo es válido. */
export function validateGraph(graph) {
   const problems = [];
   const nodes = graph?.['@graph'] ?? [];
   if (!graph?.['@context']) problems.push({ severity: 'CRITICAL', message: 'Sin @context.' });
   if (!nodes.length) problems.push({ severity: 'CRITICAL', message: 'Grafo vacío.' });

   const ids = new Set();
   for (const node of nodes) {
      const label = node['@id'] ?? node['@type'] ?? '(nodo)';
      if (!node['@type']) problems.push({ severity: 'CRITICAL', message: `${label}: sin @type.` });
      if (!node['@id']) problems.push({ severity: 'HIGH', message: `${label}: sin @id.` });
      else if (ids.has(node['@id'])) problems.push({ severity: 'CRITICAL', message: `@id duplicado: ${node['@id']}.` });
      else ids.add(node['@id']);
   }

   const collect = (v) => {
      if (Array.isArray(v)) return v.forEach(collect);
      if (!v || typeof v !== 'object') return;
      if (v['@id'] && Object.keys(v).length > 1) ids.add(v['@id']);
      Object.values(v).forEach(collect);
   };
   nodes.forEach(collect);

   const walk = (v, path) => {
      if (Array.isArray(v)) return v.forEach((item, i) => walk(item, `${path}[${i}]`));
      if (!v || typeof v !== 'object') return;
      const keys = Object.keys(v);
      if (keys.length === 1 && keys[0] === '@id' && !ids.has(v['@id']))
         problems.push({ severity: 'CRITICAL', message: `Referencia rota en ${path}: ${v['@id']}.` });
      for (const [k, val] of Object.entries(v)) walk(val, `${path}.${k}`);
   };
   nodes.forEach((n) => walk(n, n['@id'] ?? n['@type']));

   const text = JSON.stringify(graph);
   if (text.includes('undefined')) problems.push({ severity: 'HIGH', message: 'Contiene el literal "undefined".' });
   if (/"(url|item|@id|logo)":"\/(?!\/)/.test(text))
      problems.push({ severity: 'HIGH', message: 'URL relativa en el grafo: deben ser absolutas.' });
   const urls = text.match(/https?:\/\/[^"\s]+/g) ?? [];
   const doubled = urls.find((u) => u.replace(/^https?:\/\//, '').includes('//'));
   if (doubled) problems.push({ severity: 'HIGH', message: `URL con doble barra: ${doubled}.` });
   if (/localhost|127\.0\.0\.1/.test(text))
      problems.push({ severity: 'CRITICAL', message: 'URL a localhost en el grafo.' });

   if (!ids.has(ID.organization())) problems.push({ severity: 'HIGH', message: 'Falta el nodo Organization.' });
   return problems;
}
