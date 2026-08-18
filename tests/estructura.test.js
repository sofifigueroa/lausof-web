// Estructura: marcado que rompe en silencio si se pisa — el JSON-LD, el
// cache-busting de la hoja de estilos y las reglas de mobile que sostienen
// los arreglos de UX de agosto 2026.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { index, flota, css } = require('./util.js');

// flota-en-venta.html arma su JSON-LD por script con JSON.stringify (nunca
// puede quedar inválido); acá se valida el bloque estático de la portada y
// se verifica que la página de flota siga generando el suyo.
test('el JSON-LD estático de la portada es JSON válido', () => {
  const bloques = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.ok(bloques.length > 0, 'no hay JSON-LD en index.html');
  for (const [, cuerpo] of bloques) {
    assert.doesNotThrow(() => JSON.parse(cuerpo), 'JSON-LD roto en index.html');
  }
});

test('la página de flota sigue generando su JSON-LD', () => {
  assert.ok(flota.includes("'application/ld+json'"),
    'flota-en-venta.html perdió el generador de datos estructurados');
});

test('la hoja de estilos está en la versión 22 o posterior', () => {
  const m = index.match(/href="css\/styles\.css\?v=(\d+)"/);
  assert.ok(m, 'index.html no versiona styles.css con ?v=');
  assert.ok(Number(m[1]) >= 22, `?v=${m[1]} — quedó una versión vieja de la hoja`);
});

test('la CSS trae las reglas de mobile de la revisión de agosto', () => {
  // "Por qué elegirnos" a una columna en pantalla angosta
  assert.ok(css.includes('.why-grid{grid-template-columns:1fr}'),
    'falta el colapso a una columna de .why-grid');
  // el enlace de WhatsApp de cada tarjeta con zona de toque
  assert.match(css, /\.card a\.walink\{display:block;padding:12px 0/,
    'falta la zona de toque del walink');
  // habilitaciones en dos columnas compactas
  assert.match(css, /\.certs-row\{\s*display:grid;grid-template-columns:1fr 1fr/,
    'falta la grilla de dos columnas de .certs-row');
  // la barra de acción visible desde que carga, sin esperar el scroll
  assert.ok(!css.includes('past-hero .wa-bar'),
    'la barra de acción sigue atada a past-hero');
  assert.ok(css.includes('.wa-bar{display:flex}'),
    'falta mostrar la barra de acción en mobile');
});

test('el aviso de deslizar está antes de la primera tarjeta', () => {
  const hint = index.indexOf('class="swipe-hint"');
  const tarjeta = index.indexOf('class="card"');
  assert.ok(hint > -1, 'no está el aviso de deslizar');
  assert.ok(tarjeta > -1, 'no hay tarjetas de servicio');
  assert.ok(hint < tarjeta, 'el aviso de deslizar quedó después de las tarjetas');
});

test('todo botón verde de WhatsApp lleva el logo inline', () => {
  const botones = [...index.matchAll(/<a class="[^"]*\bbtn-wa\b[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.ok(botones.length >= 4, `se esperaban al menos 4 botones btn-wa, hay ${botones.length}`);
  for (const [entero, cuerpo] of botones) {
    assert.ok(cuerpo.includes('<svg'), `botón sin logo: ${entero.slice(0, 80)}...`);
  }
});
