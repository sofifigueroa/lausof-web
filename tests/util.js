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

const paginas = { ...paginasEs, ...paginasEn };

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
  return `${DOMINIO}/${archivo}`;
};

// La ruta con la que se enlaza un archivo dentro del sitio (root-absoluta).
const rutaDe = (archivo) => urlDe(archivo).slice(DOMINIO.length);

module.exports = {
  paginas,
  paginasEs,
  paginasEn,
  pares,
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
