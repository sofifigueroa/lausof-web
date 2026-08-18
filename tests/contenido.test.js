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

  // Datos internos que no se publican: cuántos teléfonos satelitales hay
  // ni ningún número que dimensione la flota o el personal. Los patrones
  // van atados a los sustantivos vedados para no pisar especificaciones
  // legítimas como "19+1 plazas" o "7,5 toneladas".
  test(`${nombre}: sin cantidades de teléfonos satelitales ni de flota o personal`, () => {
    assert.ok(
      !/\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+tel[eé]fonos?\s+satelitales?/i.test(contenido),
      `se publica la cantidad de teléfonos satelitales en ${nombre}`,
    );
    const dimension = /\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|quince|veinte|\d+)\s+(unidades|veh[ií]culos|camiones|camionetas|combis|minibuses|gr[uú]as|choferes|conductores|mec[aá]nicos|empleados)\b/i;
    const m = contenido.match(dimension);
    assert.ok(!m, `se dimensiona la flota o el personal en ${nombre}: "${m && m[0]}"`);
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

// La tarjeta de cargas refrigeradas tiene que seguir diciendo, en cualquier
// redacción, que el depósito tiene cámara frigorífica y que está en Salta
// capital: son los dos datos que hacen cotizable el servicio.
test('index.html: la tarjeta de depósito conserva la cámara y la ubicación', () => {
  const desde = paginas['index.html'].indexOf('<h3>Cargas refrigeradas y depósito</h3>');
  assert.ok(desde > -1, 'no está la tarjeta de cargas refrigeradas');
  const hasta = paginas['index.html'].indexOf('</article>', desde);
  const tarjeta = paginas['index.html'].slice(desde, hasta);
  assert.match(tarjeta, /c[aá]mara frigor[ií]fica/i, 'la tarjeta perdió la cámara frigorífica');
  assert.match(tarjeta, /Salta capital/i, 'la tarjeta perdió la ubicación en Salta capital');
});

// El GPS se afirma solo para las unidades en servicio (las paradas o en
// venta no tienen por qué tenerlo): toda mención visible de GPS tiene que
// llevar ese alcance, letra por letra.
test('index.html: el GPS siempre queda acotado a las unidades en servicio', () => {
  const visibles = paginas['index.html'].match(/GPS/g) || [];
  const acotadas = paginas['index.html'].match(/GPS en las unidades en servicio/g) || [];
  assert.ok(visibles.length > 0, 'desapareció la mención del GPS');
  assert.strictEqual(visibles.length, acotadas.length,
    'hay una mención de GPS sin el alcance "en las unidades en servicio"');
});
