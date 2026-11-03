// Mapa de 301 del sitio Wix viejo (bloque «wix-301» de _redirects).
// Cada URL vieja conocida va a la página nueva que le corresponde por
// contenido, en un solo salto y sin bucles, y ninguna regla tapa una URL viva
// del sitemap. El mapa con sus razones y fuentes está en
// web/seo-deep-2026-11-03/wix-301-map.md: si se cambia acá, se cambia allá.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { redirects, sitemap, DOMINIO } = require('./util.js');

const raiz = path.join(__dirname, '..');

// [ruta vieja, query exacta o null, destino, código]
const MAPA = [
  ['/principal-old', null, '/', '301'],
  ['/nuestra-empresa', null, '/#nosotros', '301'],
  ['/galeria-imagenes', null, 'https://www.lausof.com/galeria.html', '301'],
  ['/contactenos', null, '/#contacto', '301'],
  ['/conozca-salta', null, 'https://www.lausof.com/turismo.html', '301'],
  ['/golf-torneos', null, 'https://www.lausof.com/golf-torneos.html', '301!'],
  ['/principal-old', 'lang=en', '/en/', '301!'],
  ['/nuestra-empresa', 'lang=en', '/en/#about', '301!'],
  ['/contactenos', 'lang=en', '/en/#contact', '301!'],
  ['/conozca-salta', 'lang=en', '/en/tours-and-transfers.html', '301!'],
  ['/fullscreen-page/comp-jjqc3l4y/1230ba66-1458-4e79-b8ce-2eb29ff0267b/29/', null, '/galeria.html', '301!'],
  ['/home', null, '/', '301'],
  ['/inicio', null, '/', '301'],
];

// Rutas viejas que quedan en 404 a propósito (sin destino con sentido, o
// nunca estuvieron en ningún índice). Ninguna regla las tiene que redirigir.
const QUEDAN_EN_404 = ['/blank', '/blank-1', '/copia-de-principal', '/post/algo',
  '/blog', '/logo.gif', '/pages-sitemap.xml', '/Nuestra-Empresa', '/PRINCIPAL-OLD'];

// --- _redirects como lista ordenada de reglas -----------------------------
const reglas = redirects.split('\n').map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => {
    const partes = l.split(/\s+/);
    const origen = partes[0];
    const codigo = partes[partes.length - 1];
    const destino = partes[partes.length - 2];
    const query = partes.slice(1, -2).filter((p) => p.includes('='));
    return { origen, query, destino, codigo, forzada: codigo.endsWith('!'), linea: l };
  });

const sinDominio = (url) => (url.startsWith(DOMINIO) ? url.slice(DOMINIO.length) || '/' : url);
const sinFragmento = (url) => url.split('#')[0];

// Archivo que Netlify sirve para una ruta (URLs lindas incluidas), o null.
const archivoDe = (ruta) => {
  const r = ruta.length > 1 ? ruta.replace(/\/$/, '') : ruta;
  const candidatos = r === '/' ? ['index.html']
    : [r.slice(1), `${r.slice(1)}.html`, `${r.slice(1)}/index.html`];
  return candidatos.find((c) => fs.existsSync(path.join(raiz, c)) && fs.statSync(path.join(raiz, c)).isFile()) || null;
};

const patronDe = (origen) => new RegExp(`^${origen.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}/?$`);

// La primera regla que Netlify aplica a ruta+query (sólo reglas de este host).
const primeraRegla = (ruta, query) => reglas.find((r) => {
  if (/^https?:/.test(r.origen)) return false;
  if (!patronDe(r.origen).test(ruta)) return false;
  if (r.query.length) {
    if (!query || r.query.slice().sort().join('&') !== query.split('&').sort().join('&')) return false;
  }
  // Sin !, Netlify sirve el archivo si existe y no mira la regla.
  if (!r.forzada && archivoDe(ruta)) return false;
  return true;
});

const rutasSitemap = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => sinDominio(m[1]));

test('el sitemap se pudo leer', () => {
  assert.ok(rutasSitemap.length > 10, `sólo ${rutasSitemap.length} URLs en el sitemap`);
});

for (const [vieja, query, destino, codigo] of MAPA) {
  const nombre = query ? `${vieja}?${query}` : vieja;

  test(`${nombre}: Netlify aplica la regla del mapa (→ ${destino} ${codigo})`, () => {
    const regla = primeraRegla(vieja, query);
    assert.ok(regla, `ninguna regla de _redirects atiende ${nombre}`);
    assert.strictEqual(regla.destino, destino, `${nombre} cae en «${regla.linea}»`);
    assert.strictEqual(regla.codigo, codigo, `${nombre} lleva ${regla.codigo}`);
  });

  test(`${nombre}: el destino existe como archivo, con su sección, en un solo salto`, () => {
    const ruta = sinFragmento(sinDominio(destino));
    const archivo = archivoDe(ruta);
    assert.ok(archivo, `el destino ${destino} no existe como archivo`);
    const ancla = destino.split('#')[1];
    if (ancla) {
      const html = fs.readFileSync(path.join(raiz, archivo), 'utf8');
      assert.match(html, new RegExp(`\\bid="${ancla}"`), `${archivo} no tiene #${ancla}`);
    }
    // Sin cadena ni bucle: al destino no lo agarra ninguna otra regla.
    const siguiente = primeraRegla(ruta, query);
    assert.strictEqual(siguiente, undefined,
      `el destino ${ruta} vuelve a redirigir con «${siguiente && siguiente.linea}»`);
  });
}

test('las rutas viejas sin destino con sentido siguen en 404 (nada a la portada en bloque)', () => {
  for (const ruta of QUEDAN_EN_404) {
    const regla = primeraRegla(ruta, null);
    assert.ok(!regla || regla.codigo.startsWith('404'),
      `${ruta} redirige con «${regla && regla.linea}»: va a 404 (soft 404 si se manda a la home)`);
    assert.strictEqual(archivoDe(ruta), null, `${ruta} existe como archivo`);
  }
});

test('ninguna regla tapa una URL viva del sitemap', () => {
  for (const r of reglas) {
    if (/^https?:/.test(r.origen)) continue; // reglas de otro host (lausof.netlify.app)
    for (const ruta of rutasSitemap) {
      // Origen literal igual a una URL del sitemap: prohibido siempre.
      if (!r.origen.includes('*') && !r.origen.includes(':')) {
        assert.notStrictEqual(r.origen, ruta, `la regla «${r.linea}» tiene de origen una URL del sitemap`);
      }
      // Comodín forzado que se come una URL del sitemap: prohibido. (Sin !,
      // Netlify sirve el archivo primero, como hace /en/* con su 404.)
      if (r.forzada && r.query.length === 0) {
        assert.ok(!patronDe(r.origen).test(ruta), `la regla forzada «${r.linea}» tapa ${ruta}`);
      }
    }
  }
});

test('ninguna URL del sitemap cae en una regla', () => {
  for (const ruta of rutasSitemap) {
    const regla = primeraRegla(ruta, null);
    assert.strictEqual(regla, undefined, `${ruta} cae en «${regla && regla.linea}»`);
  }
});

test('el bloque wix-301 está delimitado en _redirects', () => {
  const ini = redirects.indexOf('# ===== BEGIN wix-301');
  const fin = redirects.indexOf('# ===== END wix-301 =====');
  assert.ok(ini >= 0 && fin > ini, 'falta el bloque «BEGIN/END wix-301»');
});
