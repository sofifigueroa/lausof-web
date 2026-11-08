// El encabezado (section.page-head) y la miga de pan que escribe
// scripts/encabezado.mjs (ronda 2 de lausof.com, 08/11/2026). Hasta el
// 07/11/2026 la miga tenía tres formas (crumbs en 56 páginas, migas dentro
// del encabezado en las 12 de eventos, ninguna en 7) y el encabezado se
// copiaba a mano (rondas-2026-11-07/2-estado-actual.md, W1, W4).
//
// También vigila lo que la vitrina lee del encabezado y de la miga
// (tienda-v2-0611:scripts/tienda.mjs, ponerZonas y tituloDe).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas } = require('./util.js');

const guion = import('../scripts/encabezado.mjs');
const datos = import('../scripts/encabezado-datos.mjs');

const ZONA = /<!-- GENERADO:MIGAS [\s\S]*?<!-- \/GENERADO:MIGAS -->/g;
const cuenta = (html, s) => html.split(s).length - 1;

test('cada página está al día con scripts/encabezado.mjs (correr node scripts/encabezado.mjs)', async () => {
  const { conTodo, problemasDe } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.deepStrictEqual(problemasDe(html, nombre), [], nombre);
    assert.ok(conTodo(html, nombre) === html, `${nombre}: el encabezado o la miga no están al día`);
  }
});

test('una sola forma de miga: toda página con encabezado tiene su nav.crumbs, dentro de la zona MIGAS', async () => {
  const { MIGAS } = await datos;
  let n = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.ok(!html.includes('<nav class="migas"'), `${nombre}: quedan migas con la forma vieja`);
    if (!html.includes('<section class="page-head')) continue;
    n += 1;
    assert.ok(MIGAS[nombre], `${nombre}: tiene encabezado y no tiene miga en encabezado-datos.mjs`);
    const zonas = html.match(ZONA) || [];
    assert.strictEqual(zonas.length, 1, `${nombre}: ${zonas.length} zonas MIGAS`);
    assert.strictEqual(cuenta(html, '<nav class="crumbs'), 1, `${nombre}: más de una miga`);
    assert.ok(zonas[0].includes('<nav class="crumbs'), `${nombre}: la miga no está en la zona`);
    // tituloDe de la vitrina lee la página actual con este patrón.
    const actual = zonas[0].match(/<li aria-current="page">([^<]+)<\/li>/);
    assert.ok(actual, `${nombre}: la página actual no es <li aria-current="page">texto</li>`);
  }
  assert.ok(n >= 70, `sólo ${n} páginas con encabezado`);
});

test('el encabezado cumple lo que lee la vitrina: una vez, .ctas adentro y sin secciones anidadas', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    if (!html.includes('<section class="page-head')) continue;
    assert.strictEqual(cuenta(html, '<section class="page-head'), 1, `${nombre}: más de un encabezado`);
    const inicio = html.indexOf('<section class="page-head');
    const fin = html.indexOf('</section>', inicio);
    const tramo = html.slice(inicio, fin);
    assert.strictEqual(cuenta(tramo, '<div class="ctas">'), 1, `${nombre}: el encabezado no tiene un solo <div class="ctas">`);
    assert.ok(!tramo.slice(1).includes('<section'), `${nombre}: una sección dentro del encabezado`);
    assert.ok(/<h1[^>]*>/.test(tramo), `${nombre}: el encabezado no tiene <h1>`);
  }
});

test('el nombre de un nivel sale de un solo lugar: «Turismo» en todas las migas que pasan por turismo.html', async () => {
  const { rastro } = await guion;
  const { MIGAS } = await datos;
  let n = 0;
  for (const nombre of Object.keys(MIGAS)) {
    const nivel = rastro(nombre).find((x) => x.href === '/turismo.html');
    if (!nivel) continue;
    n += 1;
    assert.strictEqual(nivel.nombre, 'Turismo', nombre);
  }
  assert.ok(n >= 15);
  // Como página actual, turismo dice su nombre completo.
  assert.strictEqual(rastro('turismo.html').at(-1).nombre, 'Turismo en Salta y Jujuy');
});

test('las 7 páginas que no tenían miga ahora la tienen, colgada de la portada de su idioma', async () => {
  const { rastro } = await guion;
  const antes = ['alquiler-4x4.html', 'clubes-deportivos.html', 'en/4x4-rental.html', 'en/tours-and-transfers.html',
    'flota-en-venta.html', 'peregrinaciones-eventos.html', 'viajes-de-estudio.html'];
  for (const nombre of antes) {
    const r = rastro(nombre);
    assert.strictEqual(r.length, 2, nombre);
    assert.strictEqual(r[0].href, nombre.startsWith('en/') ? '/en/' : '/', nombre);
  }
});

/* ---- controles en rojo: el script tiene que ver estas roturas ---- */

const ENCABEZADO = `<main>
  <section class="page-head" aria-label="Presentación">
    <div class="page-head-photo" role="presentation"><picture><img src="/assets/x.webp" alt="" width="10" height="10" sizes="100vw"></picture></div>
    <div class="wrap page-head-inner">
      <p class="kicker on-dark">Kicker</p>
      <h1>Título</h1>
      <p class="lead">Bajada</p>
      <div class="ctas">
        <a class="btn btn-wa" href="https://wa.me/5493875269009?text=Hola">WhatsApp</a>
        <a class="btn btn-outline" href="#ruta">Ver la ruta</a>
      </div>
    </div>
  </section>
</main>`;

test('rojo: algo que no entra en el molde del encabezado corta con error', async () => {
  const { conEncabezado } = await guion;
  const roto = ENCABEZADO.replace('<h1>Título</h1>', '<h1>Título</h1>\n      <p class="otra">sobra</p>');
  assert.throws(() => conEncabezado(roto, 'traslado-salta-cafayate.html'), /no entra en el molde/);
  const sinCtas = ENCABEZADO.replace('<div class="ctas">', '<div class="botones">');
  assert.throws(() => conEncabezado(sinCtas, 'traslado-salta-cafayate.html'), /ctas/);
});

test('las zonas de la vitrina dentro del encabezado («cabeza» e «ir») quedan donde están', async () => {
  const { conEncabezado } = await guion;
  const cabeza = '<!-- GENERADO:TIENDA cabeza --><p class="tienda-linea">x</p><!-- /GENERADO:TIENDA -->';
  const ir = '<!-- GENERADO:TIENDA ir --><a class="btn btn-reservar" href="#precios">Reservar</a><!-- /GENERADO:TIENDA -->';
  const conZonas = ENCABEZADO
    .replace('      <div class="ctas">', `      ${cabeza}\n      <div class="ctas">${ir}`);
  const salida = conEncabezado(conZonas, 'traslado-salta-cafayate.html');
  assert.strictEqual(conEncabezado(salida, 'traslado-salta-cafayate.html'), salida, 'no es idempotente');
  assert.ok(salida.indexOf(cabeza) < salida.indexOf('<div class="ctas">'), 'la zona cabeza no quedó antes de .ctas');
  assert.ok(salida.includes(`<div class="ctas">${ir}`), 'la zona ir no quedó al principio de .ctas');
});

test('rojo: un BreadcrumbList que no dice lo mismo que la miga se ve', async () => {
  const { problemasDe } = await guion;
  const html = paginas['traslado-salta-cafayate.html'].replace('"name": "Turismo"', '"name": "Turismo en Salta"');
  assert.ok(problemasDe(html, 'traslado-salta-cafayate.html').some((p) => p.includes('BreadcrumbList')));
});

test('el bloque de precios que la vitrina pone después de la miga se conserva al regenerar', async () => {
  const { conMigas } = await guion;
  const nombre = 'traslado-salta-cafayate.html';
  const html = paginas[nombre];
  const zona = '<!-- GENERADO:TIENDA bloque --><!-- /GENERADO:TIENDA -->';
  // tienda.mjs (lugarDelBloque) inserta la zona justo después del </nav> de la miga.
  const fin = html.indexOf('</nav>', html.indexOf('<nav class="crumbs')) + '</nav>'.length;
  const conTienda = `${html.slice(0, fin)}\n  ${zona}${html.slice(fin)}`;
  assert.strictEqual(conMigas(conTienda, nombre), conTienda);
});
