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
const paginas = {};
for (const nombre of fs.readdirSync(raiz).sort()) {
  if (nombre.endsWith('.html') && !nombre.startsWith('google')) {
    paginas[nombre] = leer(nombre);
  }
}

module.exports = {
  paginas,
  index: leer('index.html'),
  flota: leer('flota-en-venta.html'),
  css: leer('css/styles.css'),
  sitemap: leer('sitemap.xml'),
  robots: leer('robots.txt'),
  redirects: leer('_redirects'),
  headers: leer('_headers'),
  sinComentarios,
};
