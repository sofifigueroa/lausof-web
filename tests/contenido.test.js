// Puertas de contenido: lo que el sitio NO puede decir y lo que no puede
// dejar de decir. Si un cambio de redacción borra un dato verificado o
// mete un tema vedado, estos tests lo frenan antes de publicar.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { index, flota, sinComentarios } = require('./util.js');

// Se evalúa lo que el visitante ve: los comentarios HTML quedan afuera,
// porque ahí sí se nombran los temas vedados (son las notas del dueño).
const paginas = {
  'index.html': sinComentarios(index),
  'flota-en-venta.html': sinComentarios(flota),
};

// Temas vedados en todo el sitio (decisión del dueño, no se negocia acá).
const vedados = [
  ['prenda', /\bprendas?\b/i],
  ['financiación', /financiaci/i],
  ['mudanzas', /\bmudanzas?\b/i],
  ['VTV (acá es RTO)', /\bVTV\b/i],
  ['Posco', /\bposco\b/i],
];

for (const [nombre, contenido] of Object.entries(paginas)) {
  test(`${nombre}: sin palabras vedadas`, () => {
    for (const [etiqueta, patron] of vedados) {
      assert.ok(!patron.test(contenido), `"${etiqueta}" aparece en ${nombre}`);
    }
  });

  test(`${nombre}: sin restos de borrador`, () => {
    assert.ok(!/\[completar\]/i.test(contenido), `queda un [completar] en ${nombre}`);
    assert.ok(!/prototipo/i.test(contenido), `queda un "prototipo" en ${nombre}`);
  });
}

// Afirmaciones verificadas que la portada tiene que conservar, se redacte
// como se redacte.
const requeridas = [
  ['habilitación CNRT', /CNRT/],
  ['habilitación AMT', /AMT/],
  ['capacidad de carga de 7,5 toneladas', /capacidad de carga de 7,5 toneladas/],
  ['registro de temperatura', /registro de temperatura/i],
  ['agencia de turismo habilitada', /agencia de turismo habilitada/i],
  ['más de una década en la Puna', /Más de una década trabajando en la Puna/],
  ['psicofísico al día', /psicof[ií]sico/i],
  ['ART al día', /\bART\b/],
  ['teléfono satelital en altura', /tel[eé]fono satelital/i],
  ['fletes y cargas generales por el NOA', /fletes y cargas generales por Salta y el NOA/],
  ['CUIT', /30-71146774-9/],
];

test('index.html: las afirmaciones verificadas siguen presentes', () => {
  for (const [etiqueta, patron] of requeridas) {
    assert.ok(patron.test(paginas['index.html']), `falta "${etiqueta}" en index.html`);
  }
});

// Las 7,5 toneladas son la carga del camión plancha, no la capacidad de
// izaje de la plancha. Está comentado en el HTML y acá queda vigilado.
test('index.html: las 7,5 toneladas nunca se reescriben como izaje', () => {
  assert.ok(!/izaje/i.test(paginas['index.html']), 'apareció "izaje" en index.html');
});
