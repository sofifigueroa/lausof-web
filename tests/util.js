// Lectura compartida de los archivos del sitio para los tests.
// Sin dependencias: todo con los módulos que trae Node.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');

const leer = (nombre) => fs.readFileSync(path.join(raiz, nombre), 'utf8');

// Sin los comentarios HTML: los comentarios son la cola de preguntas del
// dueño y pueden nombrar temas que en el texto visible están vedados
// (p. ej. la advertencia de no reescribir la carga como izaje).
const sinComentarios = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

// Todas las páginas HTML de la raíz, leídas dinámicamente: una página nueva
// queda cubierta por las puertas de contenido y de teléfonos sin tocar esta
// lista. El archivo de verificación de Google no es una página (es un token
// que exige Search Console) y queda afuera.
const paginasEs = {};
for (const nombre of fs.readdirSync(raiz).sort()) {
  if (nombre.endsWith('.html') && !nombre.startsWith('google')) {
    paginasEs[nombre] = leer(nombre);
  }
}

// Las páginas en inglés viven en /en/ y entran con la ruta completa como
// clave ('en/404.html'): así una sola vuelta sobre `paginas` cubre los dos
// idiomas y las guardias que ya existen (teléfonos, alt, versión de la hoja)
// las alcanzan solas. El directorio puede no existir todavía.
const dirEn = path.join(raiz, 'en');
const paginasEn = {};
if (fs.existsSync(dirEn)) {
  for (const nombre of fs.readdirSync(dirEn).sort()) {
    if (nombre.endsWith('.html')) {
      paginasEn[`en/${nombre}`] = leer(`en/${nombre}`);
    }
  }
}

// Portugués de Brasil bajo /pt/ (03/11/2026, web/seo-deep-2026-11-03/
// E-languages-markets.md §3.2): sólo las 7 páginas de `paresPt`, con la misma
// regla de clave ('pt/index.html'). Entran en `paginas`, así que las guardias
// de todo el sitio (teléfonos, GA4, imágenes, rutas, prefill) las cubren.
const dirPt = path.join(raiz, 'pt');
const paginasPt = {};
if (fs.existsSync(dirPt)) {
  for (const nombre of fs.readdirSync(dirPt).sort()) {
    if (nombre.endsWith('.html')) {
      paginasPt[`pt/${nombre}`] = leer(`pt/${nombre}`);
    }
  }
}

const paginas = { ...paginasEs, ...paginasEn, ...paginasPt };

// ---------------------------------------------------------------------------
// Mapa de gemelas ES ↔ EN. ÚNICA fuente de verdad de qué página tiene versión
// en inglés: de acá salen el hreflang recíproco, el selector de idioma, el
// sitemap y la guardia de que ninguna página de /en/ quede huérfana.
//
// Clave = archivo en español en la raíz. Valor = archivo en inglés bajo en/.
// Cuando una gemela se publica, se agrega su renglón acá y en el mismo commit
// van las dos páginas: una gemela sola (que apunta a algo que no existe, o a
// la que nadie apunta) es peor que no tenerla, porque Google descarta el
// hreflang que no es recíproco.
//
// La 404 no va en este mapa: no se indexa, no lleva hreflang y no va al
// sitemap. Está exceptuada por nombre en las guardias de tests/ingles.test.js.
//
// El día que se sume un tercer idioma (/fr/), este mapa pasa a
// { 'index.html': { en: 'en/index.html', fr: 'fr/index.html' } } y las
// guardias iteran sobre las claves del objeto en vez de sobre un solo valor.
// ---------------------------------------------------------------------------
const pares = {
  'index.html':                  'en/index.html',
  'logistica-minera.html':       'en/mining-logistics.html',
  'transporte-de-personal.html': 'en/personnel-transport.html',
  'turismo.html':                'en/tours-and-transfers.html',
  'alquiler-4x4.html':           'en/4x4-rental.html',
  'cargas-refrigeradas.html':    'en/refrigerated-freight.html',
  'deposito-galpon.html':        'en/warehouse.html',
  'producciones.html':           'en/film-production-logistics.html',
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'en/salta-to-purmamarca-tilcara-humahuaca.html',
  'salinas-grandes-desde-salta.html': 'en/salinas-grandes-from-salta.html',
  // Páginas de ruta de los Valles y la Puna, y casamientos (10/10/2026).
  'traslado-salta-cafayate.html':                 'en/salta-to-cafayate-transfer.html',
  'traslado-salta-cachi.html':                    'en/salta-to-cachi-transfer.html',
  'traslado-salta-san-antonio-de-los-cobres.html': 'en/salta-to-san-antonio-de-los-cobres.html',
  'traslados-casamientos.html':                   'en/wedding-transportation.html',
  'traslado-carnaval-quebrada-de-humahuaca.html': 'en/transfer-carnival-quebrada-de-humahuaca.html',
  'viajes-internacionales.html':               'en/international-trips.html',
  'traslado-salta-san-pedro-de-atacama.html':  'en/salta-to-san-pedro-de-atacama.html',
  'traslado-salta-uyuni.html':                 'en/salta-to-uyuni.html',
  // Sentido inverso (03/11/2026): del otro lado de la frontera hacia Salta.
  'traslado-san-pedro-de-atacama-salta.html':  'en/san-pedro-de-atacama-to-salta.html',
  'traslado-uyuni-salta.html':                 'en/uyuni-to-salta.html',
  // Páginas de eventos y temporada (10/10/2026). La de la Fiesta del Milagro
  // queda sin gemela a propósito: su público son peregrinos de Salta y las
  // provincias vecinas y no hay señales de demanda en inglés.
  'traslados-trail-jujuy-utmb.html': 'en/jujuy-utmb-trail-race-transfers.html',
  'traslado-tren-a-las-nubes.html':  'en/train-to-the-clouds-transfer.html',
  'semana-santa-salta-jujuy.html':   'en/holy-week-salta-jujuy.html',
  // Aeropuerto y combi con chofer por día (sweep 03/11/2026).
  'traslado-aeropuerto-salta.html':       'en/salta-airport-transfer.html',
  'alquiler-combi-con-chofer-salta.html': 'en/minibus-with-driver-salta.html',
  // Páginas B2B (auditoría SEO 03/11/2026, B-segments-expansion.md §2.2 y §2.4).
  'agencias-y-hoteles.html':                    'en/ground-transport-for-tour-operators.html',
  'transporte-de-personal-obras-de-litio.html': 'en/crew-transport-lithium-projects.html',
  // Salta – Jujuy, ciudad y aeropuerto (plan SEO 03/11/2026, §3 #3).
  'traslado-salta-jujuy.html': 'en/salta-to-jujuy-transfer.html',
  // Hub «Empresas y minería» (estructura del sitio, 05/11/2026). Sin gemela
  // pt: el sitio en portugués es sólo de turismo.
  'empresas-y-mineria.html': 'en/business-and-mining.html',
};

// Mapa de gemelas ES ↔ PT, con la misma regla que `pares`: clave = archivo en
// español, valor = archivo en portugués bajo pt/. Sólo estas 7: el resto del
// sitio sigue con su par ES/EN y no lleva hreflang "pt" (Google descarta un
// hreflang que no es recíproco). Toda página de `paresPt` tiene además gemela
// inglesa en `pares`, así que cada grupo es un trío es/en/pt.
const paresPt = {
  'index.html':                                   'pt/index.html',
  'turismo.html':                                 'pt/passeios-e-traslados.html',
  'traslado-salta-san-pedro-de-atacama.html':     'pt/traslado-salta-san-pedro-de-atacama.html',
  'traslado-salta-uyuni.html':                    'pt/traslado-salta-uyuni.html',
  'salinas-grandes-desde-salta.html':             'pt/salinas-grandes-saindo-de-salta.html',
  'traslado-salta-cafayate.html':                 'pt/traslado-salta-cafayate.html',
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'pt/traslado-salta-purmamarca-tilcara-humahuaca.html',
};

// Páginas que no se indexan: noindex, fuera del sitemap y sin hreflang,
// canónica ni Open Graph. Son las dos 404 y el aviso de privacidad en sus tres
// idiomas (web/privacidad-2026-11-05/3-diseno.md §2.5: «as hidden as
// possible», se llega desde el pie). Una página que no se indexa es un
// renglón acá y otro en PAGINAS_FUERA_DEL_SITEMAP de scripts/publicacion.mjs
// (tests/privacidad.test.js compara las dos listas).
const noIndexables = ['404.html', 'en/404.html', 'privacidad.html', 'en/privacy.html', 'pt/privacidade.html'];

// El aviso de privacidad en sus tres idiomas. No son `pares` ni `paresPt`
// (eso es «trío indexable con hreflang»): este mapa sólo dice adónde van los
// enlaces de idioma visibles, el selector de la barra y el del pie.
const privadas = { 'privacidad.html': { en: 'en/privacy.html', pt: 'pt/privacidade.html' } };

// Páginas de /en/ que existen sin ser gemela de nadie (no se indexan).
const sinGemelaEn = noIndexables.filter((n) => n.startsWith('en/'));

const DOMINIO = 'https://www.lausof.com';

// La URL canónica de un archivo, con la misma regla para los dos idiomas: la
// portada de cada idioma se sirve como directorio (/ y /en/) y el resto lleva
// su .html. Que la regla viva acá evita que cada test la reinvente distinto.
const urlDe = (archivo) => {
  if (archivo === 'index.html') return `${DOMINIO}/`;
  if (archivo === 'en/index.html') return `${DOMINIO}/en/`;
  if (archivo === 'pt/index.html') return `${DOMINIO}/pt/`;
  return `${DOMINIO}/${archivo}`;
};

// La ruta con la que se enlaza un archivo dentro del sitio (root-absoluta).
const rutaDe = (archivo) => urlDe(archivo).slice(DOMINIO.length);


// Reseñas de Google (03/11/2026): el único texto sobre reseñas permitido fuera
// de la portada es un enlace simple al perfil real, con el puntaje y la
// cantidad que muestra Google en público y la fecha en que se leyeron. Sin
// marcado de reseñas, sin citas, sin puntajes inventados (BUILD-BRIEF).
// `sinEnlaceResenas` saca ese renglón exacto para que las guardias que vedan
// hablar de reseñas sigan cortando cualquier otro texto.
const RESENAS = 'https://www.google.com/maps?cid=13700114490953273065';
// Dos formas, las dos de scripts/bloques.mjs: el renglón de la franja (y del
// cierre) y el de la lista de pruebas del hub de empresas (ronda 4, 08/11/2026).
const RENGLON_RESENAS = /<span><a href="https:\/\/www\.google\.com\/maps\?cid=13700114490953273065" target="_blank" rel="noopener"><b>(?:Reseñas en Google|Google reviews|Avaliações no Google)<\/b><\/a>: (?:4,9 de 5, con 9 reseñas \(03\/11\/2026\)|4\.9 out of 5 from 9 reviews \(November 3, 2026\)|4,9 de 5, com 9 avaliações \(03\/11\/2026\))<\/span>|<li><b><a href="https:\/\/www\.google\.com\/maps\?cid=13700114490953273065" target="_blank" rel="noopener">(?:Reseñas en Google|Google reviews)<\/a><\/b>(?:4,9 de 5, con 9 reseñas \(03\/11\/2026\)|4\.9 out of 5 from 9 reviews \(November 3, 2026\))<\/li>/g;
const sinEnlaceResenas = (html) => html.replace(RENGLON_RESENAS, '');

// Plazo de respuesta (decisión 1A de Lautaro, 05/11/2026,
// web/revision-sitio-2026-11-05/3-decisiones-consolidadas.md, ítem 1): el sitio
// no promete cuándo se responde, en ningún idioma ni en meta, og o JSON-LD,
// hasta que la primera respuesta a consultas web esté medida y baje de un día.
// La cotización se ofrece «por escrito» / «written quote» / «por escrito» (PT).
// Sólo corta frases de respuesta o cotización: «ida y vuelta en el día»,
// «same-day return trips» o «no mesmo dia ou com uma noite» son del viaje.
const PROMESA_DE_RESPUESTA = new RegExp([
  // ES: «Le respondemos con la cotización en el día», «Cotización en el día»,
  // «normalmente en el mismo día hábil», «Respondemos en 24 horas».
  String.raw`\b(?:respond\w*|cotiz\w*|cotización|propuesta|precio|presupuesto)\b[^.<"]{0,60}?\ben el (?:mismo )?día\b`,
  String.raw`\bdía hábil\b`,
  String.raw`\brespond\w* (?:en|dentro de) (?:menos de )?(?:\d+|una|un par de) (?:h\b|horas?|minutos)`,
  // EN: «same business day», «same-day quote», «reply within 2 hours».
  String.raw`\bsame[- ]business[- ]day\b`,
  String.raw`\bsame[- ]day (?:quotes?|reply|replies|answers?|response)\b`,
  String.raw`\b(?:reply|replies|quote|quotes|answer|respond)\w*\b[^.<"]{0,60}?\b(?:the same day|within \d+ (?:hours?|minutes))\b`,
  // PT: «Respondemos com o orçamento no mesmo dia», «no mesmo dia útil».
  String.raw`\b(?:respond\w*|orçamento|preço)\b[^.<"]{0,60}?\bno mesmo dia\b`,
  String.raw`\bdia útil\b`,
].join('|'), 'i');

// Servicio «Documentación de ingreso» del hub de empresas (05/11/2026,
// ~/lausof/web/servicio-documentacion-2026-11-05/4-textos.md §1.9, alcance
// D6B). Su asunto fijo, el mismo en el HTML y en los tests (hub-empresas,
// correo y documentacion-flota): con él la oficina cuenta estos correos en
// transporte@ aunque GA4 no registre el clic. PORTALES son los únicos nombres
// de portales que el sitio dice, y sólo dentro de PANEL_FLOTA.
const ASUNTO_FLOTA = { es: 'Consulta — documentación de ingreso', en: 'Inquiry — mine entry documents' };
const PANEL_FLOTA = { es: 'documentacion-flota', en: 'fleet-documents' };
const PORTALES = ['SICOP', 'Exactian', 'Minexus'];

module.exports = {
  ASUNTO_FLOTA,
  PANEL_FLOTA,
  PORTALES,
  RESENAS,
  RENGLON_RESENAS,
  sinEnlaceResenas,
  PROMESA_DE_RESPUESTA,
  paginas,
  paginasEs,
  paginasEn,
  paginasPt,
  pares,
  paresPt,
  privadas,
  noIndexables,
  sinGemelaEn,
  urlDe,
  rutaDe,
  DOMINIO,
  index: leer('index.html'),
  flota: leer('flota-en-venta.html'),
  css: leer('css/styles.css'),
  sitemap: leer('sitemap.xml'),
  robots: leer('robots.txt'),
  redirects: leer('_redirects'),
  headers: leer('_headers'),
  sinComentarios,
};
