// Corrección de teléfonos: en Argentina los celulares llevan el 9 después
// del 54 (+549387...), los fijos no (+54387...). Un dígito de menos y el
// enlace marca a cualquier lado. Se revisan TODOS los tel: y wa.me de las
// dos páginas.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { index, flota } = require('./util.js');

const paginas = { 'index.html': index, 'flota-en-venta.html': flota };

// Líneas conocidas: las dos móviles del sitio + la móvil de venta de flota
// son celulares; la 431-1584 es fija.
const lineasMoviles = ['5377527', '5269009', '5092489'];

const extraer = (contenido, patron) =>
  [...contenido.matchAll(patron)].map((m) => m[1]);

for (const [nombre, contenido] of Object.entries(paginas)) {
  const tels = extraer(contenido, /href="(tel:[^"]+)"/g);
  const was = extraer(contenido, /href="(https:\/\/wa\.me\/[^"]+)"/g);

  test(`${nombre}: hay enlaces de teléfono y de WhatsApp`, () => {
    assert.ok(tels.length > 0, `no se encontró ningún tel: en ${nombre}`);
    assert.ok(was.length > 0, `no se encontró ningún wa.me en ${nombre}`);
  });

  test(`${nombre}: todo wa.me apunta a un celular salteño con el 9`, () => {
    for (const href of was) {
      assert.match(href, /^https:\/\/wa\.me\/549387\d{7}(\?text=[^"]*)?$/,
        `wa.me con formato inesperado: ${href}`);
    }
  });

  test(`${nombre}: todo tel: es celular con 9 o fijo sin 9`, () => {
    for (const href of tels) {
      assert.match(href, /^tel:\+54(?:9387|387)\d{7}$/,
        `tel: con formato inesperado: ${href}`);
    }
  });

  test(`${nombre}: ninguna línea móvil quedó sin el 9`, () => {
    for (const href of tels) {
      const linea = href.slice(-7);
      if (lineasMoviles.includes(linea)) {
        assert.ok(href.startsWith('tel:+549387'),
          `la línea móvil ${linea} está sin el 9: ${href}`);
      }
    }
  });
}
