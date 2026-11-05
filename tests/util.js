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

// Página de /en/ que existe sin ser gemela de nadie (no se indexa).
const sinGemelaEn = ['en/404.html'];

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
const RENGLON_RESENAS = /<span><a href="https:\/\/www\.google\.com\/maps\?cid=13700114490953273065" target="_blank" rel="noopener"><b>(?:Reseñas en Google|Google reviews|Avaliações no Google)<\/b><\/a>: (?:4,9 de 5, con 9 reseñas \(03\/11\/2026\)|4\.9 out of 5 from 9 reviews \(November 3, 2026\)|4,9 de 5, com 9 avaliações \(03\/11\/2026\))<\/span>/g;
const sinEnlaceResenas = (html) => html.replace(RENGLON_RESENAS, '');

module.exports = {
  RESENAS,
  RENGLON_RESENAS,
  sinEnlaceResenas,
  paginas,
  paginasEs,
  paginasEn,
  paginasPt,
  pares,
  paresPt,
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
