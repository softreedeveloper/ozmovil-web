/**
 * Contenido de la landing. Cada constante alimenta el markup Y el Schema
 * (servicios → OfferCatalog, FAQs → FAQPage), así que nunca divergen.
 *
 * COPY PROPUESTO — pendiente de revisión por negocio. No incluye cifras,
 * precios ni tiempos de garantía: agrégalos aquí solo si son reales.
 *
 * `icon` = nombre de un icono de src/components/ui/Icon.astro.
 */

/**
 * Dispositivos que se atienden (iconografía de servicios del manual de marca).
 * PENDIENTE DE CONFIRMAR por negocio: confirma que realmente se reparan todos.
 */
export const devices = [
   { icon: 'smartphone', name: 'Celulares' },
   { icon: 'laptop', name: 'Laptops' },
   { icon: 'tablet', name: 'Tablets' },
   { icon: 'gamepad', name: 'Consolas' },
   { icon: 'headphones', name: 'Audífonos' },
   { icon: 'watch', name: 'Wearables' },
   { icon: 'gear', name: 'Otros dispositivos' },
];

export const services = [
   {
      slug: 'pantalla',
      icon: 'screen',
      name: 'Cambio de pantalla',
      description:
         'Display roto, táctil que no responde, manchas o líneas. Cambiamos el módulo completo o solo el cristal según tu modelo.',
   },
   {
      slug: 'bateria',
      icon: 'battery',
      name: 'Cambio de batería',
      description:
         'Si tu equipo se descarga rápido, se apaga solo o la batería está inflada, la reemplazamos por una nueva.',
   },
   {
      slug: 'centro-de-carga',
      icon: 'plug',
      name: 'Centro de carga',
      description: 'No carga, carga lento o tienes que mover el cable. Limpiamos o reemplazamos el puerto de carga.',
   },
   {
      slug: 'camara',
      icon: 'camera',
      name: 'Cámara y cristal de cámara',
      description:
         'Fotos borrosas, cámara negra o lente estrellado. Reparamos la cámara frontal, trasera o su cristal.',
   },
   {
      slug: 'audio',
      icon: 'speaker',
      name: 'Bocina, auricular y micrófono',
      description:
         'No te escuchan, no escuchas las llamadas o el sonido sale distorsionado. Revisamos y cambiamos el componente.',
   },
   {
      slug: 'humedad',
      icon: 'drop',
      name: 'Daño por humedad',
      description: 'Si tu equipo se mojó, apágalo y tráelo cuanto antes. Hacemos limpieza y diagnóstico de la placa.',
   },
   {
      slug: 'software',
      icon: 'cpu',
      name: 'Software y respaldo',
      description:
         'Equipo lento, reinicios, actualizaciones fallidas o reinstalación del sistema, con respaldo de tu información cuando es posible.',
   },
   {
      slug: 'tablets',
      icon: 'tablet',
      name: 'Tablets y iPad',
      description: 'También reparamos tablets: pantalla, batería, centro de carga y botones.',
   },
];

/**
 * Marcas que se reparan. `icon` = slug de simple-icons (https://simpleicons.org,
 * CC0) → src/components/ui/BrandLogo.astro. `model` = texto del mensaje de
 * WhatsApp. Los logos son marcas registradas de sus dueños (uso nominativo:
 * indicar compatibilidad del servicio).
 */
export const brands = [
   { name: 'Apple', model: 'iPhone', icon: 'apple' },
   { name: 'Samsung', model: 'Samsung', icon: 'samsung' },
   { name: 'Motorola', model: 'Motorola', icon: 'motorola' },
   { name: 'Xiaomi', model: 'Xiaomi', icon: 'xiaomi' },
   { name: 'Huawei', model: 'Huawei', icon: 'huawei' },
   { name: 'OPPO', model: 'OPPO', icon: 'oppo' },
   { name: 'Honor', model: 'Honor', icon: 'honor' },
   { name: 'Google Pixel', model: 'Google Pixel', icon: 'google' },
   { name: 'vivo', model: 'vivo', icon: 'vivo' },
   { name: 'OnePlus', model: 'OnePlus', icon: 'oneplus' },
   { name: 'Lenovo', model: 'Lenovo', icon: 'lenovo' },
   { name: 'Nokia', model: 'Nokia', icon: 'nokia' },
   { name: 'LG', model: 'LG', icon: 'lg' },
   { name: 'Sony', model: 'Sony', icon: 'sony' },
];

export const steps = [
   {
      title: 'Escríbenos',
      description: 'Mándanos por WhatsApp el modelo de tu equipo y qué le pasa. Si puedes, agrega una foto.',
   },
   {
      title: 'Diagnóstico y cotización',
      description: 'Revisamos tu equipo y te decimos qué tiene, cuánto cuesta y cuánto tarda, antes de tocar nada.',
   },
   {
      title: 'Reparación',
      description: 'Con tu autorización, reparamos con refacciones de calidad y te mantenemos al tanto por WhatsApp.',
   },
   {
      title: 'Entrega',
      description: 'Probamos el equipo contigo al entregarlo para que te lo lleves funcionando.',
   },
];

export const features = [
   {
      icon: 'chat',
      title: 'Atención directa',
      description: 'Hablas con el técnico, sin intermediarios, por WhatsApp o llamada.',
   },
   {
      icon: 'search',
      title: 'Precio antes de reparar',
      description: 'Te cotizamos primero. Sin sorpresas ni cargos que no autorizaste.',
   },
   {
      icon: 'shield',
      title: 'Tu información, segura',
      description: 'No revisamos tus fotos ni tus apps. Solo lo necesario para probar el equipo.',
   },
   {
      icon: 'bolt',
      title: 'Reparaciones rápidas',
      description: 'Muchas reparaciones comunes se resuelven el mismo día, según modelo y refacción.',
   },
];

export const faqs = [
   {
      question: '¿Cómo cotizo la reparación de mi celular?',
      answer:
         'Escríbenos por WhatsApp con la marca, el modelo y qué falla tiene tu equipo. Te respondemos con una cotización o te pedimos traerlo para revisarlo.',
   },
   {
      question: '¿Cuánto tarda una reparación?',
      answer:
         'Depende del modelo y de la refacción. Muchas reparaciones comunes, como pantalla o batería, se pueden entregar el mismo día; te confirmamos el tiempo al cotizar.',
   },
   {
      question: '¿Las reparaciones tienen garantía?',
      answer: 'Sí. Al cotizar te explicamos la garantía que aplica a tu reparación y qué cubre.',
   },
   {
      question: '¿Pierdo mi información al reparar el equipo?',
      answer:
         'En la mayoría de las reparaciones de hardware tu información se conserva. Si hay riesgo, te avisamos antes y, cuando es posible, hacemos un respaldo.',
   },
   {
      question: '¿Qué marcas reparan?',
      answer:
         'Reparamos iPhone, Samsung, Motorola, Xiaomi, Huawei, OPPO y otras marcas, además de tablets y iPad. Si tu modelo no aparece, pregúntanos.',
   },
   {
      question: 'Mi celular se mojó, ¿qué hago?',
      answer:
         'Apágalo, no lo cargues y no lo metas en arroz. Tráelo lo antes posible para hacer limpieza y diagnóstico; entre más rápido, mejores probabilidades.',
   },
];
