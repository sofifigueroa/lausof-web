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

module.exports = {
  index: leer('index.html'),
  flota: leer('flota-en-venta.html'),
  css: leer('css/styles.css'),
  sinComentarios,
};
