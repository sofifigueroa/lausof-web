// SEO de la migración: el dominio primario es https://www.lausof.com y las
// URLs del sitio Wix viejo redirigen con 301. Si algo de esto se pisa,
// Google vuelve a ver señales contradictorias justo después del corte.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { index, flota, sitemap, robots, redirects } = require('./util.js');

test('las canónicas de las dos páginas apuntan al dominio con www', () => {
  assert.ok(index.includes('<link rel="canonical" href="https://www.lausof.com/">'),
    'la canónica de la portada no es https://www.lausof.com/');
  assert.ok(flota.includes('<link rel="canonical" href="https://www.lausof.com/flota-en-venta.html">'),
    'la canónica de flota-en-venta no lleva www');
});

test('ninguna referencia absoluta quedó en el dominio sin www', () => {
  for (const [nombre, html] of [['index.html', index], ['flota-en-venta.html', flota],
    ['sitemap.xml', sitemap], ['robots.txt', robots]]) {
    assert.ok(!/https:\/\/lausof\.com\//.test(html),
      `${nombre} todavía referencia https://lausof.com/ (sin www)`);
  }
});

test('el Open Graph y el JSON-LD de la portada usan el dominio con www', () => {
  assert.ok(index.includes('<meta property="og:url" content="https://www.lausof.com/">'),
    'og:url de la portada sin www');
  assert.ok(index.includes('"@id": "https://www.lausof.com/#empresa"'),
    '@id del JSON-LD sin www');
  assert.ok(index.includes('"url": "https://www.lausof.com/"'),
    'url del JSON-LD sin www');
});

test('el sitemap lista las dos páginas con www', () => {
  assert.ok(sitemap.includes('<loc>https://www.lausof.com/</loc>'),
    'falta la portada con www en el sitemap');
  assert.ok(sitemap.includes('<loc>https://www.lausof.com/flota-en-venta.html</loc>'),
    'falta flota-en-venta con www en el sitemap');
});

test('robots.txt permite rastrear todo y apunta al sitemap con www', () => {
  assert.match(robots, /User-agent: \*\s*\nAllow: \//,
    'robots.txt no permite el rastreo general');
  assert.ok(robots.includes('Sitemap: https://www.lausof.com/sitemap.xml'),
    'el sitemap de robots.txt no lleva www');
});

test('cada URL indexada del sitio Wix viejo tiene su 301', () => {
  const viejas = ['/nuestra-empresa', '/galeria-imagenes', '/contactenos',
    '/conozca-salta', '/golf-torneos', '/principal-old'];
  for (const ruta of viejas) {
    const regla = new RegExp(`^${ruta}\\s+\\S+\\s+301$`, 'm');
    assert.match(redirects, regla, `falta el 301 de ${ruta}`);
  }
});

// La og:image de cada página es un recorte propio de 1200×630 y va SIEMPRE en
// JPEG (los scrapers de WhatsApp/Facebook manejan mal el WebP), con las
// dimensiones declaradas para que la primera vez que se comparte el enlace la
// preview salga con imagen.
test('las og:image son JPEG dedicadas con dimensiones declaradas', () => {
  for (const [nombre, contenido] of [['index.html', index], ['flota-en-venta.html', flota]]) {
    const imagen = contenido.match(/<meta property="og:image" content="([^"]+)">/);
    assert.ok(imagen, `no hay og:image en ${nombre}`);
    assert.match(imagen[1], /^https:\/\/www\.lausof\.com\/assets\/og-[a-z-]+\.jpg$/,
      `la og:image de ${nombre} no es un recorte JPEG dedicado: ${imagen[1]}`);
    assert.ok(contenido.includes('<meta property="og:image:width" content="1200">'),
      `falta og:image:width en ${nombre}`);
    assert.ok(contenido.includes('<meta property="og:image:height" content="630">'),
      `falta og:image:height en ${nombre}`);
  }
});

// Además del mapa del sitio viejo, las variantes duplicadas de las URLs
// reales tienen su 301: /index.html a / y el subdominio *.netlify.app al
// dominio canónico. Si estas reglas se caen, Google vuelve a ver dos copias.
test('las variantes duplicadas redirigen al canónico', () => {
  assert.match(redirects, /^\/index\.html\s+\/\s+301!$/m,
    'falta el 301 de /index.html a /');
  assert.match(redirects, /^https:\/\/lausof\.netlify\.app\/\*\s+https:\/\/www\.lausof\.com\/:splat\s+301!$/m,
    'falta el 301 del host lausof.netlify.app al dominio canónico');
  assert.match(redirects, /^\/principal-old\s+\/\s+301$/m,
    'se perdió el 301 de /principal-old del mapa del sitio viejo');
});

// El fondo del hero es la LCP de cada página y viene de la CSS, así que las
// dos páginas lo precargan en el head. La precarga tiene que apuntar al MISMO
// archivo que usa la hoja de estilos: si se cambia la foto en la CSS y no acá,
// se descarga dos veces (la vieja precargada y la nueva del fondo).
test('el fondo del hero (LCP) se precarga en las dos páginas', () => {
  const { css } = require('./util.js');
  assert.match(index, /<link rel="preload" as="image" href="assets\/hero-flota-paisaje\.webp" fetchpriority="high" media="\(min-width: [\d.]+px\)">/,
    'falta la precarga del hero de escritorio en index.html');
  assert.match(index, /<link rel="preload" as="image" href="assets\/pasajeros-1-quebrada\.webp" fetchpriority="high" media="\(max-width: 720px\)">/,
    'falta la precarga del hero de mobile en index.html');
  assert.match(flota, /<link rel="preload" as="image" href="assets\/pasajeros-5-flota\.webp" fetchpriority="high">/,
    'falta la precarga del encabezado en flota-en-venta.html');
  for (const foto of ['hero-flota-paisaje.webp', 'pasajeros-1-quebrada.webp']) {
    assert.ok(css.includes(`assets/${foto}`), `la CSS ya no usa ${foto}: actualizar la precarga`);
  }
});

test('las redirecciones no tienen un comodín que tape páginas reales', () => {
  const reglas = redirects.split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  for (const regla of reglas) {
    const origen = regla.split(/\s+/)[0];
    assert.notStrictEqual(origen, '/*', 'hay un comodín /* que pisa todo el sitio');
    assert.ok(origen !== '/' && origen !== '/flota-en-venta.html',
      `hay una regla que pisa una página real: ${regla}`);
  }
});
