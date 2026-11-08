// Título y descripción de cada página (scripts/metadatos.mjs, ronda 9 de
// lausof.com, 08/11/2026). Una sola fuente, scripts/metadatos-datos.mjs: el
// <title>, la meta description, og:title, og:description y el WebPage del
// JSON-LD dicen lo mismo, y caben en el resultado de Google (65 / 160).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas } = require('./util.js');

const guion = import('../scripts/metadatos.mjs');
const datos = import('../scripts/metadatos-datos.mjs');

test('cada página está al día con scripts/metadatos.mjs (correr node scripts/metadatos.mjs)', async () => {
  const { conMetadatos, problemasDe } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.deepStrictEqual(problemasDe(html, nombre), [], nombre);
    assert.ok(conMetadatos(html, nombre) === html, `${nombre}: título o descripción sin regenerar`);
  }
});

test('los datos: una entrada por página, títulos de hasta 65 y descripciones de hasta 160', async () => {
  const { problemasDeDatos } = await guion;
  assert.deepStrictEqual(problemasDeDatos(undefined, Object.keys(paginas)), []);
});

test('sólo las 3 portadas pasan de 65, y cada título es único', async () => {
  const { METADATOS, LARGOS } = await datos;
  const { largo } = await guion;
  assert.deepStrictEqual(Object.keys(LARGOS).sort(), ['en/index.html', 'index.html', 'pt/index.html']);
  const largos = Object.entries(METADATOS).filter(([, d]) => largo(d.titulo) > 65).map(([p]) => p).sort();
  assert.deepStrictEqual(largos, Object.keys(LARGOS).sort());
  const titulos = Object.values(METADATOS).map((d) => d.titulo);
  assert.strictEqual(new Set(titulos).size, titulos.length, 'dos páginas comparten el título');
  for (const [p, d] of Object.entries(METADATOS)) {
    assert.ok(d.titulo.endsWith('| Lausof') || d.titulo.startsWith('Flota de Lausof'), `${p}: la marca no va al final: ${d.titulo}`);
  }
});

// Control en rojo: lo que el generador y el test tienen que frenar.
test('control en rojo: un título largo, una copia desfasada y un WebPage viejo se detectan', async () => {
  const { conMetadatos, problemasDe, problemasDeDatos } = await guion;
  const dato = { titulo: 'Traslado de prueba | Lausof', descripcion: 'Descripción de prueba con «comillas» y "dobles" & ampersand.' };
  const html = '<title>Viejo</title>\n<meta name="description" content="Vieja">\n<meta property="og:title" content="Viejo">\n<meta property="og:description" content="Vieja">\n'
    + '<script type="application/ld+json">{"@graph":[{"@type":"WebPage","name": "Viejo","description": "Vieja"},{"@type":"Service","name":"Otro"}]}</script>\n'
    + '<script type="application/ld+json" id="empresa">{"name":"Viejo"}</script>';
  const nuevo = conMetadatos(html, 'x.html', dato);
  assert.deepStrictEqual(problemasDe(nuevo, 'x.html', dato), []);
  assert.strictEqual(conMetadatos(nuevo, 'x.html', dato), nuevo, 'no es idempotente');
  assert.ok(nuevo.includes('content="Descripción de prueba con «comillas» y &quot;dobles&quot; &amp; ampersand."'));
  assert.ok(nuevo.includes('"name":"Otro"') && nuevo.includes('id="empresa">{"name":"Viejo"}'), 'tocó un nodo que no es el WebPage');
  // Una copia que se quedó con el texto viejo.
  assert.ok(problemasDe(nuevo.replace('property="og:title" content="Traslado de prueba | Lausof"', 'property="og:title" content="Viejo"'), 'x.html', dato).length);
  assert.ok(problemasDe(nuevo.replace('"name": "Traslado de prueba | Lausof"', '"name": "Viejo"'), 'x.html', dato).length);
  // Datos que pasan del límite, con precio, con el botón repetido, o sin página.
  const malos = {
    'a.html': { titulo: 'x'.repeat(66), descripcion: 'ok' },
    'b.html': { titulo: 'ok', descripcion: 'y'.repeat(161) },
    'c.html': { titulo: 'ok', descripcion: 'Traslado a US$ 300' },
    'd.html': { titulo: 'ok', descripcion: 'Combis. Cotizá por WhatsApp.' },
  };
  const p = problemasDeDatos(malos, ['a.html', 'b.html', 'c.html', 'd.html', 'e.html'], {});
  for (const n of ['a.html', 'b.html', 'c.html', 'd.html', 'e.html']) assert.ok(p.some((x) => x.startsWith(n)), `no frenó ${n}: ${p}`);
  assert.throws(() => conMetadatos('<title>a</title><title>b</title><meta name="description" content="x">', 'x.html', dato));
});
