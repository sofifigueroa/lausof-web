// IndexNow (scripts/indexnow.mjs): después de cada deploy se le avisa a Bing y
// a los demás buscadores del protocolo qué URLs del sitemap cambiaron. Si el
// archivo de la clave deja de publicarse, o el script empieza a mandar URLs
// de otro host, el buscador responde 403/422 y el aviso se pierde en silencio.
// Protocolo: https://www.indexnow.org/documentation (leída 10/10/2026).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { sitemap, redirects } = require('./util.js');

const indexnow = import('../scripts/indexnow.mjs');
const raiz = path.join(__dirname, '..');

test('la clave cumple el formato del protocolo y su archivo está en la raíz', async () => {
  const { CLAVE, UBICACION_CLAVE, HOST } = await indexnow;
  // 8 a 128 caracteres; letras, números y guiones (indexnow.org/documentation).
  assert.match(CLAVE, /^[A-Za-z0-9-]{8,128}$/);
  const archivo = path.join(raiz, `${CLAVE}.txt`);
  assert.ok(fs.existsSync(archivo), `falta ${CLAVE}.txt en la raíz del sitio`);
  // UTF-8 con la clave como único contenido.
  assert.strictEqual(fs.readFileSync(archivo, 'utf8').trim(), CLAVE,
    'el archivo de la clave no contiene la clave');
  // Opción 1 del protocolo: en la raíz, así cubre todas las URLs del host.
  assert.strictEqual(UBICACION_CLAVE, `https://${HOST}/${CLAVE}.txt`);
  assert.strictEqual(HOST, 'www.lausof.com');
});

test('ninguna regla de _redirects tapa el archivo de la clave', async () => {
  const { CLAVE } = await indexnow;
  const reglas = redirects.split('\n').map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0]);
  for (const origen of reglas) {
    const patron = new RegExp(`^${origen.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    assert.ok(!patron.test(`/${CLAVE}.txt`), `la regla ${origen} esconde el archivo de IndexNow`);
  }
});

test('lee las 54 URLs del sitemap con su lastmod', async () => {
  const { leerSitemap } = await indexnow;
  const urls = leerSitemap(sitemap);
  assert.strictEqual(urls.length, (sitemap.match(/<loc>/g) || []).length);
  assert.ok(urls.length >= 54, `el sitemap tiene ${urls.length} URLs`);
  assert.ok(urls.every((u) => u.loc.startsWith('https://www.lausof.com/')));
  assert.ok(urls.every((u) => /^\d{4}-\d{2}-\d{2}/.test(u.lastmod)), 'hay una URL sin lastmod');
});

test('--desde <commit>: avisa sólo las URLs nuevas o con otro lastmod', async () => {
  const { cambiadasContra } = await indexnow;
  const anterior = [
    { loc: 'https://www.lausof.com/', lastmod: '2026-10-01' },
    { loc: 'https://www.lausof.com/turismo.html', lastmod: '2026-10-01' },
    { loc: 'https://www.lausof.com/vieja.html', lastmod: '2026-09-01' },
  ];
  const actual = [
    { loc: 'https://www.lausof.com/', lastmod: '2026-10-10' },
    { loc: 'https://www.lausof.com/turismo.html', lastmod: '2026-10-01' },
    { loc: 'https://www.lausof.com/nueva.html', lastmod: '2026-10-10' },
  ];
  assert.deepStrictEqual(cambiadasContra(actual, anterior),
    ['https://www.lausof.com/', 'https://www.lausof.com/nueva.html']);
  assert.deepStrictEqual(cambiadasContra(actual, actual), []);
});

test('--desde AAAA-MM-DD: avisa las URLs con lastmod en esa fecha o después', async () => {
  const { cambiadasDesde } = await indexnow;
  const actual = [
    { loc: 'https://www.lausof.com/a.html', lastmod: '2026-10-09' },
    { loc: 'https://www.lausof.com/b.html', lastmod: '2026-10-10' },
    { loc: 'https://www.lausof.com/c.html', lastmod: '2026-10-11T08:00:00+00:00' },
    { loc: 'https://www.lausof.com/d.html', lastmod: null },
  ];
  assert.deepStrictEqual(cambiadasDesde(actual, '2026-10-10'),
    ['https://www.lausof.com/b.html', 'https://www.lausof.com/c.html']);
});

test('el pedido lleva host, key, keyLocation y urlList, y rechaza otros hosts', async () => {
  const { armarPedido, CLAVE, UBICACION_CLAVE, MAX_POR_PEDIDO } = await indexnow;
  const urls = ['https://www.lausof.com/', 'https://www.lausof.com/en/'];
  assert.deepStrictEqual(armarPedido(urls),
    { host: 'www.lausof.com', key: CLAVE, keyLocation: UBICACION_CLAVE, urlList: urls });
  // 422 del protocolo: URLs que no son del host. Mejor cortar antes de enviar.
  assert.throws(() => armarPedido(['https://lausof.com/']), /otro host/);
  assert.throws(() => armarPedido(['https://lausof.netlify.app/']), /otro host/);
  assert.strictEqual(MAX_POR_PEDIDO, 10000);
  assert.throws(() => armarPedido(Array(MAX_POR_PEDIDO + 1).fill('https://www.lausof.com/')), /más de/);
});

test('sólo 200 y 202 cuentan como aviso recibido', async () => {
  const { respuestaOk, ENDPOINT } = await indexnow;
  assert.ok(respuestaOk(200));
  assert.ok(respuestaOk(202));
  for (const estado of [400, 403, 422, 429, 500]) assert.ok(!respuestaOk(estado), String(estado));
  assert.strictEqual(ENDPOINT, 'https://api.indexnow.org/indexnow');
});
