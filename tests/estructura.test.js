// Estructura: marcado que rompe en silencio si se pisa — el JSON-LD, el
// cache-busting de la hoja de estilos y las reglas de mobile que sostienen
// los arreglos de UX de agosto 2026.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { index, flota, css } = require('./util.js');

// Todo el JSON-LD del sitio es estático (el ItemList de flota lo escribe
// scripts/generar-flota.mjs a partir de scripts/unidades.mjs): acá se valida
// que cada bloque de las dos páginas sea JSON válido. El contenido del
// ItemList se revisa en detalle en flota.test.js.
test('el JSON-LD estático de las dos páginas es JSON válido', () => {
  for (const [nombre, contenido] of [['index.html', index], ['flota-en-venta.html', flota]]) {
    const bloques = [...contenido.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.ok(bloques.length > 0, `no hay JSON-LD en ${nombre}`);
    for (const [, cuerpo] of bloques) {
      assert.doesNotThrow(() => JSON.parse(cuerpo), `JSON-LD roto en ${nombre}`);
    }
  }
});

test('la hoja de estilos está en la versión 23 o posterior', () => {
  const m = index.match(/href="css\/styles\.css\?v=(\d+)"/);
  assert.ok(m, 'index.html no versiona styles.css con ?v=');
  assert.ok(Number(m[1]) >= 23, `?v=${m[1]} — quedó una versión vieja de la hoja`);
});

// Con /css/* cacheado como inmutable, si las dos páginas no piden la MISMA
// versión de styles.css, una de ellas puede quedarse un año con la hoja vieja.
test('las dos páginas piden la misma versión de styles.css', () => {
  const enIndex = index.match(/href="css\/styles\.css\?v=(\d+)"/);
  const enFlota = flota.match(/href="css\/styles\.css\?v=(\d+)"/);
  assert.ok(enFlota, 'flota-en-venta.html no versiona styles.css con ?v=');
  assert.strictEqual(enFlota[1], enIndex[1],
    `versiones desincronizadas: index ?v=${enIndex[1]}, flota ?v=${enFlota[1]}`);
});

// El favicon dejó de ser el PNG de 157 KB de la insignia: hay uno de 96px
// (Google pide múltiplos de 48 para el favicon de los resultados móviles) y
// un apple-touch-icon de 180px sobre fondo blanco.
test('las dos páginas enlazan el favicon liviano y el apple-touch-icon', () => {
  for (const [nombre, contenido] of [['index.html', index], ['flota-en-venta.html', flota]]) {
    assert.ok(contenido.includes('<link rel="icon" type="image/png" sizes="96x96" href="assets/favicon-96.png">'),
      `falta el favicon de 96px en ${nombre}`);
    assert.ok(contenido.includes('<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">'),
      `falta el apple-touch-icon en ${nombre}`);
  }
});

test('_headers cachea assets y css como inmutables', () => {
  const { headers } = require('./util.js');
  for (const ruta of ['/assets/*', '/css/*']) {
    const bloque = new RegExp(`^${ruta.replace('*', '\\*')}\\n\\s+Cache-Control: public, max-age=31536000, immutable`, 'm');
    assert.match(headers, bloque, `falta la regla inmutable de ${ruta} en _headers`);
  }
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
