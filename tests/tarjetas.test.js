// Tarjetas de destino de los hubs (scripts/tarjetas.mjs, ronda 8 de lausof.com,
// 08/11/2026): etiqueta corta con fuente, enlace «Ver … →» y el contrato de la
// vitrina (tienda-v2-0611:scripts/tienda.mjs ponerZonas: cantidad de tarjetas,
// <a class="ruta-link"> en cada una).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas } = require('./util.js');

const guion = import('../scripts/tarjetas.mjs');
const datos = import('../scripts/tarjetas-datos.mjs');

const TARJETA = /<article class="card circuito">[\s\S]*?<\/article>/g;

test('cada hub está al día con scripts/tarjetas.mjs, sin problemas de fuente', async () => {
  const { conTarjetas, problemasDe } = await guion;
  const { TARJETAS } = await datos;
  for (const pagina of Object.keys(TARJETAS)) {
    const html = paginas[pagina];
    assert.ok(html, `${pagina} no existe`);
    assert.deepStrictEqual(problemasDe(html, pagina), [], pagina);
    assert.ok(conTarjetas(html, pagina) === html, `${pagina}: correr node scripts/tarjetas.mjs y node scripts/prefill.mjs`);
  }
});

test('toda página con tarjetas de destino está en los datos, y cada tarjeta lleva su enlace', async () => {
  const { TARJETAS } = await datos;
  for (const [pagina, html] of Object.entries(paginas)) {
    const tarjetas = html.match(TARJETA) || [];
    if (!tarjetas.length) continue;
    assert.ok(TARJETAS[pagina], `${pagina} tiene tarjetas de destino y no está en scripts/tarjetas-datos.mjs`);
    for (const t of tarjetas) assert.match(t, /<a class="ruta-link" href="[^"]+"[^>]*>[^<]+ →<\/a>/, `${pagina}: una tarjeta sin «… →»`);
  }
});

test('la etiqueta va antes del título y la zona de la vitrina antes del enlace', async () => {
  const { TARJETAS } = await datos;
  for (const pagina of Object.keys(TARJETAS)) {
    for (const t of paginas[pagina].match(TARJETA)) {
      const tag = t.indexOf('<span class="tag">');
      if (tag >= 0) assert.ok(tag < t.indexOf('<h3>'), `${pagina}: la etiqueta quedó después del título`);
      const zona = t.indexOf('<!-- GENERADO:TIENDA hub -->');
      if (zona >= 0) assert.ok(zona < t.indexOf('<a class="ruta-link"'), `${pagina}: la zona hub de la vitrina quedó después del enlace`);
    }
  }
});

test('control en rojo: título cambiado, fuente perdida, etiqueta con «desde», tarjeta sin enlace', async () => {
  const { conTarjetas, problemasDe, problemasDeDatos } = await guion;
  const { TARJETAS } = await datos;
  const html = paginas['turismo.html'];
  // 1. el orden o el título de una tarjeta cambió
  assert.throws(() => conTarjetas(html.replace('<h3>Iruya</h3>', '<h3>Iruya y San Isidro</h3>'), 'turismo.html'), /Iruya y San Isidro/);
  // 2. la duración de la página de destino ya no dice el dato de la etiqueta
  const otra = JSON.parse(JSON.stringify(TARJETAS['turismo.html']));
  otra[0].fuente.texto = '1 h 45 de manejo';
  assert.match(problemasDeDatos('turismo.html', otra).join('\n'), /1 h 45 de manejo/);
  // 3. una etiqueta con «desde» (BRIEF: sin precios ni «desde»)
  const desde = JSON.parse(JSON.stringify(TARJETAS['turismo.html']));
  desde[0].etiqueta = 'desde Salta';
  desde[0].fuente.texto = 'manejo';
  assert.match(problemasDeDatos('turismo.html', desde).join('\n'), /prohibido/);
  // 4. una tarjeta perdió su enlace (contrato de la vitrina)
  const sinEnlace = html.replace(/<a class="ruta-link" href="\/traslado-salta-cachi\.html">[^<]*<\/a>/, '');
  assert.match(problemasDe(sinEnlace, 'turismo.html').join('\n'), /no tiene <a class="ruta-link">/);
  // 5. una tarjeta sin enlace y sin href en los datos no se puede escribir
  const sinHref = JSON.parse(JSON.stringify(TARJETAS['turismo.html']));
  delete sinHref[4].enlace.href;
  const iruyaSinEnlace = html.replace(/<a class="ruta-link" href="https:\/\/wa\.me[^"]*"[^>]*>Consultar el viaje a Iruya →<\/a>/, '');
  assert.throws(() => conTarjetas(iruyaSinEnlace, 'turismo.html', sinHref), /no dan href/);
});

test('escribir es idempotente y conserva la cantidad de tarjetas', async () => {
  const { conTarjetas } = await guion;
  const { TARJETAS } = await datos;
  for (const pagina of Object.keys(TARJETAS)) {
    const una = conTarjetas(paginas[pagina], pagina);
    assert.strictEqual(conTarjetas(una, pagina), una, pagina);
    assert.strictEqual(una.match(TARJETA).length, TARJETAS[pagina].length, pagina);
  }
});
