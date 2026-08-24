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
