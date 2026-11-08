// La vista de revisión de la reserva y el chat (scripts/vista.mjs; rondas
// 2026-11-07, v3, sólo para la revisión local: el merge la revierte).
// Lo que tiene que valer en cada página: la vista se quita y se vuelve a
// poner sin cambiar un byte, cada zona TIENDA guarda adentro sólo una zona
// RONDA:VISTA, las anclas del contrato de la vitrina siguen una vez por
// página y ningún precio queda escrito en un archivo.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { paginas } = require('./util.js');

const raiz = path.join(__dirname, '..');
const vista = import(pathToFileURL(path.join(raiz, 'scripts/vista.mjs')).href);

const ZONA = /<!-- GENERADO:TIENDA ([a-z0-9-]+) -->([\s\S]*?)<!-- \/GENERADO:TIENDA -->/g;
const SOLO_VISTA = /^<!-- RONDA:VISTA -->(?:(?!<!-- \/?RONDA:VISTA -->)[\s\S])*<!-- \/RONDA:VISTA -->$/;

/** Lo que está mal en las zonas de una página. Pura. */
function problemasDeZonas(nombre, html) {
  const mal = [];
  for (const [, zona, dentro] of html.matchAll(ZONA)) {
    if (zona === 'destinos') {
      const [titulo, ...resto] = dentro.split('<!-- RONDA:VISTA -->');
      if (!titulo.trim() || /</.test(titulo) || resto.length > 1) mal.push(`${nombre}: destinos sin el título de la página fuera de la vista`);
      continue;
    }
    if (dentro && !SOLO_VISTA.test(dentro)) mal.push(`${nombre}: zona ${zona} con algo fuera de RONDA:VISTA`);
  }
  return mal;
}

test('vista: quitarla y volver a ponerla no cambia ningún byte, en las 82 páginas', async () => {
  const { poner, quitar } = await vista;
  for (const [nombre, html] of Object.entries(paginas)) {
    const sin = quitar(html);
    assert.doesNotMatch(sin, /GENERADO:TIENDA|RONDA:VISTA/, `${nombre}: quedó una zona`);
    assert.strictEqual(poner(sin, nombre), html, `${nombre}: poner(quitar(página)) no es la página`);
    assert.strictEqual(poner(html, nombre), html, `${nombre}: poner no es idempotente`);
  }
});

test('vista: cada zona TIENDA guarda sólo una zona RONDA:VISTA (lo que el merge saca)', () => {
  assert.deepStrictEqual(Object.entries(paginas).flatMap(([n, h]) => problemasDeZonas(n, h)), []);
  // Control en rojo: contenido de la vitrina fuera de la vista.
  const roto = paginas['traslado-salta-cafayate.html'].replace('<!-- GENERADO:TIENDA ir --><!-- RONDA:VISTA -->', '<!-- GENERADO:TIENDA ir -->x<!-- RONDA:VISTA -->');
  assert.deepStrictEqual(problemasDeZonas('x.html', roto), ['x.html: zona ir con algo fuera de RONDA:VISTA']);
});

test('vista: las anclas del contrato de la vitrina siguen una vez por página', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const ancla of ['</head>', '</body>', '<!-- /GENERADO:LEGAL -->']) {
      assert.strictEqual(html.split(ancla).length - 1, 1, `${nombre}: ${ancla}`);
    }
    assert.ok(html.split('<div class="wa-bar').length - 1 <= 1, `${nombre}: más de un <div class="wa-bar`);
  }
});

test('vista: las páginas de la vitrina llevan sus entradas, y ninguna lleva un precio escrito ni el chat real', () => {
  const vitrina = ['traslado-salta-cafayate.html', 'alquiler-4x4.html', 'en/salta-airport-transfer.html', 'charter-recitales.html'];
  for (const nombre of vitrina) {
    const html = paginas[nombre];
    assert.match(html, /<section class="block tienda" id="precios"/, `${nombre}: sin «Precios y reserva»`);
    assert.match(html, /<script type="application\/json" id="tienda-config">/, `${nombre}: sin la configuración de la vitrina`);
  }
  for (const nombre of ['traslado-salta-cafayate.html', 'alquiler-4x4.html', 'en/salta-airport-transfer.html']) {
    assert.match(paginas[nombre], /data-tienda-ir>/, `${nombre}: sin «Ver precios y reservar»`);
    assert.match(paginas[nombre], /<div class="vista-barra wa-bar[^"]*"[^>]*data-tienda-barra>/, `${nombre}: sin la barra WhatsApp · Reservar`);
  }
  for (const nombre of ['turismo.html', 'en/tours-and-transfers.html', 'pt/passeios-e-traslados.html']) {
    assert.strictEqual(paginas[nombre].split('data-tienda-hub=').length - 1, 6, `${nombre}: seis tarjetas del hub`);
  }
  for (const [nombre, html] of Object.entries(paginas)) {
    if (nombre === 'flota-en-venta.html') continue; // precios de Mercado Libre (T1)
    assert.doesNotMatch(html, /\bARS\s?\d|\$\s?\d/, `${nombre}: un precio escrito en la página`);
    assert.doesNotMatch(html, /chat\.invalid|boton\.js/, `${nombre}: el chat real`);
    // El aviso de privacidad ya nombra a quien recibe los datos (privacidad.test.js); ninguna otra página.
    if (!/privacidad|privacy/.test(nombre)) assert.doesNotMatch(html, /apacheta/i, `${nombre}: nombra al proveedor del chat`);
    assert.match(html, /s\.src='\/js\/vista\.js\?v=[0-9a-f]{10}'/, `${nombre}: sin js/vista.js`);
  }
});

test('vista: el catálogo de prueba es del contrato, de prueba y sin enlaces a otro sitio', () => {
  const catalogo = JSON.parse(fs.readFileSync(path.join(raiz, 'api/publico/lausof/catalogo'), 'utf8'));
  assert.strictEqual(catalogo.ok, true);
  assert.strictEqual(catalogo.demo, true, 'sólo precios de prueba');
  assert.ok(catalogo.servicios.length > 0);
  assert.doesNotMatch(JSON.stringify(catalogo), /https?:\/\//, 'ningún enlace a otro sitio');
});

test('vista: quitar rechaza una zona que no conoce', async () => {
  const { quitar } = await vista;
  assert.throws(() => quitar('<body><!-- GENERADO:TIENDA rara --><!-- /GENERADO:TIENDA --></body>'), /zona TIENDA desconocida: rara/);
});
