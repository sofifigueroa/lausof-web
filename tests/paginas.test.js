// Páginas dedicadas de la ola de agosto 2026: cada una existe, declara su
// canónica con www y conserva su título trabajado. También se verifica el
// cableado: sitemap completo, 301 del sitio viejo hacia las páginas nuevas
// y los enlaces internos de las tarjetas de la portada.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, index, sitemap, redirects } = require('./util.js');

// Título y canónica van juntos: si una página se renombra o se reescribe,
// acá se decide a conciencia (los títulos llevan keywords ganadas).
const dedicadas = {
  'turismo.html': 'Turismo en Salta y Jujuy — Traslados en combi y 4x4 | Lausof SRL',
  'logistica-minera.html': 'Transporte y Logística Minera en Salta — Personal, Cargas y Auxilio en la Puna | Lausof SRL',
  'transporte-de-personal.html': 'Transporte de Personal en Salta — Combis con Chofer para Empresas | Lausof SRL',
  'cargas-refrigeradas.html': 'Cargas Refrigeradas en Salta — Cadena de Frío y Depósito con Cámara | Lausof SRL',
  'galeria.html': 'Galería — Flota y Trabajos de Lausof SRL | Salta',
  'golf-torneos.html': 'Torneos de Golf — Traslados de Delegaciones | Lausof SRL',
};

for (const [nombre, titulo] of Object.entries(dedicadas)) {
  test(`${nombre}: existe, con su canónica www y su título`, () => {
    const html = paginas[nombre];
    assert.ok(html, `falta la página ${nombre}`);
    assert.ok(html.includes(`<link rel="canonical" href="https://www.lausof.com/${nombre}">`),
      `la canónica de ${nombre} no apunta a https://www.lausof.com/${nombre}`);
    assert.strictEqual(html.match(/<title>([^<]+)<\/title>/)[1], titulo,
      `el título de ${nombre} cambió`);
  });
}

// Todas las páginas comparten css/styles.css y tienen que pedir la MISMA
// versión ?v= que la portada: una página con la versión vieja se ve rota
// hasta que al visitante se le vence la caché.
test('todas las páginas cargan styles.css en la misma versión que la portada', () => {
  const version = index.match(/href="\/?css\/styles\.css\?v=(\d+)"/)[1];
  for (const [nombre, html] of Object.entries(paginas)) {
    const m = html.match(/href="\/?css\/styles\.css\?v=(\d+)"/);
    assert.ok(m, `${nombre} no versiona styles.css con ?v=`);
    assert.strictEqual(m[1], version,
      `${nombre} carga styles.css?v=${m[1]} y la portada usa ?v=${version}`);
  }
});

// El sitemap lista exactamente las páginas indexables: la portada, flota y
// las seis dedicadas. La 404 no va (no es una página para indexar).
test('el sitemap lista las 8 URLs indexables y ninguna más', () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const esperadas = [
    'https://www.lausof.com/',
    'https://www.lausof.com/flota-en-venta.html',
    ...Object.keys(dedicadas).map((n) => `https://www.lausof.com/${n}`),
  ];
  for (const url of esperadas) {
    assert.ok(urls.includes(url), `falta ${url} en el sitemap`);
  }
  assert.strictEqual(urls.length, 8, `el sitemap tiene ${urls.length} URLs y se esperaban 8`);
  assert.ok(!sitemap.includes('404.html'), 'la 404 no va en el sitemap');
});

// Tres URLs del sitio viejo ya tienen página dedicada: su 301 va derecho ahí
// (antes caían en secciones de la portada).
test('las URLs del sitio viejo con página dedicada redirigen a ella', () => {
  const retargets = [
    ['/conozca-salta', 'https://www.lausof.com/turismo.html'],
    ['/galeria-imagenes', 'https://www.lausof.com/galeria.html'],
    ['/golf-torneos', 'https://www.lausof.com/golf-torneos.html'],
  ];
  for (const [origen, destino] of retargets) {
    const regla = new RegExp(`^${origen}\\s+${destino.replace(/[./]/g, '\\$&')}\\s+301$`, 'm');
    assert.match(redirects, regla, `${origen} no redirige a ${destino}`);
  }
});

// Las tarjetas de servicios de la portada enlazan a su página dedicada
// (además del WhatsApp): es el camino de lectura antes de cotizar.
test('las 4 tarjetas de la portada enlazan a su página dedicada', () => {
  const enlaces = [
    'href="cargas-refrigeradas.html"',
    'href="transporte-de-personal.html"',
    'href="turismo.html"',
    'href="logistica-minera.html"',
  ];
  for (const enlace of enlaces) {
    assert.ok(index.includes(`<a class="walink" ${enlace}`),
      `la portada perdió el enlace interno ${enlace}`);
  }
});

// El pie de la portada enlaza las páginas que no tienen tarjeta propia.
test('el pie de la portada enlaza turismo y galería', () => {
  assert.ok(index.includes('<a href="turismo.html">Turismo en Salta →</a>'),
    'el pie perdió el enlace a turismo');
  assert.ok(index.includes('<a href="galeria.html">Galería →</a>'),
    'el pie perdió el enlace a la galería');
});
