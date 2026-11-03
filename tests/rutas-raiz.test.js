// Rutas desde la raíz y variantes de URL (auditoría técnica 03/11/2026, M3 y
// L3-L4). Netlify sirve cada página también como /turismo/ o /turismo.html/;
// con una ruta relativa (`css/styles.css`) la hoja y las fotos se piden bajo
// esa carpeta falsa, dan 404 y la página sale sin diseño. Ver
// scripts/rutas-raiz.mjs, que corrige las páginas solo.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, redirects, sinComentarios } = require('./util.js');

const urlsDe = (html) => {
  const urls = [];
  for (const [, nombre, valor] of sinComentarios(html).matchAll(/\b(href|src|srcset|data-movil)="([^"]*)"/g)) {
    if (nombre === 'srcset') urls.push(...valor.split(',').map((p) => p.trim().split(/\s+/)[0]));
    else urls.push(valor);
  }
  return urls;
};

test('ninguna página pide hojas, fotos o scripts con ruta relativa', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const relativas = urlsDe(html).filter((u) => /^(\.\.?\/)*(assets|css|js)\//.test(u) && !u.startsWith('/'));
    assert.deepStrictEqual(relativas.slice(0, 5), [],
      `${nombre}: ${relativas.length} rutas relativas (correr node scripts/rutas-raiz.mjs)`);
  }
});

test('ninguna página enlaza index.html: la portada es /', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const malas = urlsDe(html).filter((u) => /(^|\/)index\.html(#|$|\?)/.test(u));
    assert.deepStrictEqual(malas, [], `${nombre} enlaza index.html (da un 301 de más)`);
  }
});

test('ningún enlace sale por http://', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const malas = urlsDe(html).filter((u) => u.startsWith('http://'));
    assert.deepStrictEqual(malas, [], `${nombre} tiene enlaces sin https`);
  }
});

test('cada página tiene su 301 desde la variante sin .html', () => {
  const reglas = redirects.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/\s+/));
  for (const nombre of Object.keys(paginas)) {
    if (/(^|\/)(index|404)\.html$/.test(nombre)) continue;
    const desde = `/${nombre.replace(/\.html$/, '')}`;
    const regla = reglas.find(([origen]) => origen === desde);
    assert.ok(regla, `_redirects no lleva ${desde} → /${nombre}`);
    assert.ok(regla[1] === `/${nombre}` || regla[1] === `https://www.lausof.com/${nombre}`, `${desde} no va a /${nombre}`);
    assert.strictEqual(regla[2], '301!', `${desde} tiene que ser 301! (la ruta "existe" por las URLs lindas)`);
  }
  // Antes del comodín /en/*, que si no se las come con su 404.
  const comodin = reglas.findIndex(([origen]) => origen === '/en/*');
  reglas.forEach(([origen], i) => {
    if (origen.startsWith('/en/') && origen !== '/en/*' && !origen.includes('.')) assert.ok(i < comodin, `${origen} va después de /en/*`);
  });
});
