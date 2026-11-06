// Guardias de PRODUCCIÓN frente a la demo de la vitrina (3b-diseno-entorno.md
// §2: G1–G5 y G10). Producción nunca lleva un host de la demo, la marca, un
// noindex fuera de las 404, una edge function ni un netlify.toml, y sigue
// indexable. G1–G3, G5 y G9 quedan aunque la demo se cierre (3b §7).
//
// Cada guardia es una función que devuelve la lista de problemas; el test la
// corre sobre el repo (tiene que dar vacía) y sobre una copia rota a propósito
// (tiene que encontrar el problema): ese es su control en rojo, que queda
// corriendo para que la guardia no se vuelva ciega.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { paginas, headers, robots, redirects } = require('./util.js');

const raiz = path.join(__dirname, '..');
const importar = (rel) => import(pathToFileURL(path.join(raiz, rel)).href);
const entorno = importar('scripts/entorno.mjs');
const textosDemo = importar('demo/textos.mjs');

// ---------------------------------------------------------------------------
// G1: el perfil de producción es producción.
// ---------------------------------------------------------------------------
const problemasPerfilProduccion = (p, { GA4_PRODUCCION, HOST_PRODUCCION, APACHETA, NETLIFY_PRODUCCION }) => {
  const mal = [];
  if (p.host !== HOST_PRODUCCION || /demo/i.test(p.host)) mal.push(`host ${p.host}`);
  if (p.indexar !== true) mal.push('indexar no es true');
  if (p.marcaDemo !== false) mal.push('marcaDemo no es false');
  if (p.ga4 !== GA4_PRODUCCION) mal.push(`GA4 ${p.ga4}`);
  if (p.netlify?.id !== NETLIFY_PRODUCCION.id) mal.push('sitio de Netlify distinto del de producción');
  if (p.tienda.app !== APACHETA.produccion.app || p.tienda.sitio !== APACHETA.produccion.sitio) mal.push('tienda con hosts que no son los de producción de Apacheta');
  if (/demo/i.test(`${p.tienda.app} ${p.tienda.sitio}`)) mal.push('tienda con un host de demo');
  if (p.pendientes?.length) mal.push('producción con pendientes');
  return mal;
};

test('G1: el perfil de producción apunta a producción y se indexa', async () => {
  const e = await entorno;
  assert.deepStrictEqual(problemasPerfilProduccion(e.PERFILES.produccion, e), []);
  // Control en rojo: la marca de demo encendida en una copia del perfil.
  const roto = structuredClone(e.PERFILES.produccion);
  roto.marcaDemo = true;
  assert.deepStrictEqual(problemasPerfilProduccion(roto, e), ['marcaDemo no es false']);
  const otroRoto = structuredClone(e.PERFILES.produccion);
  otroRoto.tienda.app = e.APACHETA.demo.app;
  assert.ok(problemasPerfilProduccion(otroRoto, e).length >= 1, 'un host de demo en producción tiene que cortar');
});

// ---------------------------------------------------------------------------
// G2: el árbol de producción no lleva nada de la demo.
// ---------------------------------------------------------------------------
const artefactosDemo = (nombre, texto, { demo, FRANJA, PREFIJO_TITULO }) => {
  const mal = [];
  const prohibidos = ['apacheta-demo', 'lausof-demo-', 'demo-franja', 'X-Robots-Tag', PREFIJO_TITULO.trim(),
    new URL(demo.host).host, ...Object.values(FRANJA).map((f) => f.texto)];
  if (demo.ga4) prohibidos.push(demo.ga4);
  for (const p of prohibidos) if (texto.includes(p)) mal.push(`${nombre}: «${p}»`);
  const es404 = nombre === '404.html' || nombre === 'en/404.html';
  if (!es404 && /<meta name="robots" content="[^"]*noindex/i.test(texto)) mal.push(`${nombre}: noindex`);
  return mal;
};

const archivosDeProduccion = () => {
  const salida = { ...paginas, _headers: headers, 'robots.txt': robots };
  for (const dir of ['js', 'css']) {
    for (const nombre of fs.readdirSync(path.join(raiz, dir))) {
      salida[`${dir}/${nombre}`] = fs.readFileSync(path.join(raiz, dir, nombre), 'utf8');
    }
  }
  return salida;
};

test('G2: ninguna página, cabecera, robots, js ni css de producción lleva algo de la demo', async () => {
  const { PERFILES } = await entorno;
  const t = await textosDemo;
  const contexto = { demo: PERFILES.demo, FRANJA: t.FRANJA, PREFIJO_TITULO: t.PREFIJO_TITULO };
  const archivos = archivosDeProduccion();
  assert.ok(Object.keys(archivos).length > 80, 'no se leyeron las páginas');
  const problemas = Object.entries(archivos).flatMap(([n, txt]) => artefactosDemo(n, txt, contexto));
  assert.deepStrictEqual(problemas, []);
  // Control en rojo: la franja en una copia de la portada, y un noindex.
  const conFranja = archivos['index.html'].replace(/<body([^>]*)>/, `<body$1><div class="demo-franja">${t.FRANJA.es.texto}</div>`);
  assert.strictEqual(artefactosDemo('index.html', conFranja, contexto).length, 2);
  const conNoindex = archivos['index.html'].replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
  assert.deepStrictEqual(artefactosDemo('index.html', conNoindex, contexto), ['index.html: noindex']);
});

// ---------------------------------------------------------------------------
// G3: producción sigue indexable (seo.test.js ya lo mira; acá queda en la
// lista de guardias de la demo para que nadie la afloje).
// ---------------------------------------------------------------------------
const problemasIndexable = ({ robots: r, existe }) => {
  const mal = [];
  if (!/^Allow: \/$/m.test(r)) mal.push('robots.txt sin Allow: /');
  if (!r.includes('Sitemap: https://www.lausof.com/sitemap.xml')) mal.push('robots.txt sin el Sitemap de www');
  if (/^Disallow:\s*\/\s*$/m.test(r)) mal.push('robots.txt con Disallow: /');
  for (const archivo of ['sitemap.xml', 'd1eb0835b80b7ebe76ad80c22dc86589.txt']) if (!existe(archivo)) mal.push(`falta ${archivo}`);
  return mal;
};

test('G3: producción conserva robots con Sitemap, el sitemap y la clave de IndexNow', () => {
  const existe = (a) => fs.existsSync(path.join(raiz, a));
  assert.deepStrictEqual(problemasIndexable({ robots, existe }), []);
  // Control en rojo: el robots de la demo en producción.
  assert.deepStrictEqual(problemasIndexable({ robots: 'User-agent: *\nAllow: /\n', existe }), ['robots.txt sin el Sitemap de www']);
});

// ---------------------------------------------------------------------------
// G4: sin vitrina en producción hasta que se encienda.
// ---------------------------------------------------------------------------
const vitrinaEn = (nombre, html) => {
  // (id="reservar" no sirve de señal: 22 páginas ya lo usan para «Lo que
  // necesitamos para cotizar».)
  const mal = [];
  if (/\bdata-servicios=/.test(html)) mal.push(`${nombre}: data-servicios`);
  if (/\/js\/tienda\.js/.test(html)) mal.push(`${nombre}: carga /js/tienda.js`);
  if (/\/boton\.js/.test(html)) mal.push(`${nombre}: carga el botón del chat`);
  for (const [, dentro] of html.matchAll(/<!-- GENERADO:TIENDA[^>]*-->([\s\S]*?)<!-- \/GENERADO:TIENDA -->/g)) {
    if (dentro.trim()) mal.push(`${nombre}: zona GENERADO:TIENDA con contenido`);
  }
  return mal;
};

test('G4: con tienda.activa = false ninguna página tiene la vitrina ni el chat', async () => {
  const { PERFILES } = await entorno;
  if (PERFILES.produccion.tienda.activa) return; // go-live: G4 pasa a su gemela «la vitrina existe y lee producción» (3b §7)
  assert.deepStrictEqual(Object.entries(paginas).flatMap(([n, h]) => vitrinaEn(n, h)), []);
  // Control en rojo: una zona de la vitrina llena en una copia de una página.
  const lleno = paginas['traslado-salta-cafayate.html'].replace('</main>',
    '<!-- GENERADO:TIENDA -->\n<section id="precios" data-servicios="cafayate"></section>\n<!-- /GENERADO:TIENDA --></main>');
  assert.deepStrictEqual(vitrinaEn('x.html', lleno), ['x.html: data-servicios', 'x.html: zona GENERADO:TIENDA con contenido']);
});

// ---------------------------------------------------------------------------
// G5: ninguna puerta ni ningún archivo interno puede llegar a producción.
// ---------------------------------------------------------------------------
// Producción publica la exportación permitida (scripts/publicacion.mjs), nunca
// la raíz. Netlify sirve en minúsculas y las reglas 404! distinguen mayúsculas
// (auditoría 06/11/2026: /Readme.md daba 200), así que la guardia mira qué
// entra en la exportación, no qué reglas hay.
const problemasPuerta = (dir, esPublico, rastreados) => {
  const mal = [];
  // El CLI empaqueta lo que haya en netlify/edge-functions aunque se use
  // --no-build (netlify/cli #7933): una puerta ahí cerraría www.lausof.com.
  for (const prohibido of ['netlify', 'netlify.toml']) if (fs.existsSync(path.join(dir, prohibido))) mal.push(`${prohibido} en la raíz del repo`);
  for (const rel of rastreados) {
    if (/^(?:demo|e2e|scripts|tests)\//i.test(rel) || /^(?:claude|readme)\.md$/i.test(rel) || /^package/i.test(rel)) {
      if (esPublico(rel)) mal.push(`${rel} entra en la exportación`);
    }
  }
  return mal;
};

test('G5: el repo no tiene netlify/ ni netlify.toml, y demo/, CLAUDE.md, README, scripts/, tests/ y e2e/ no entran en la exportación', async () => {
  const { esPublico } = await importar('scripts/publicacion.mjs');
  const { execFileSync } = require('node:child_process');
  const rastreados = execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean);
  assert.ok(rastreados.includes('CLAUDE.md') && rastreados.includes('demo/llave.mjs') && rastreados.includes('scripts/entorno.mjs'));
  assert.deepStrictEqual(problemasPuerta(raiz, esPublico, rastreados), []);
  // Control en rojo: una edge function suelta en una copia de la raíz.
  const copia = fs.mkdtempSync(path.join(os.tmpdir(), 'g5-'));
  try {
    fs.mkdirSync(path.join(copia, 'netlify', 'edge-functions'), { recursive: true });
    fs.writeFileSync(path.join(copia, 'netlify', 'edge-functions', 'x.js'), 'export default () => {}\n');
    assert.deepStrictEqual(problemasPuerta(copia, esPublico, []), ['netlify en la raíz del repo']);
  } finally {
    fs.rmSync(copia, { recursive: true, force: true });
  }
  // Control en rojo: una lista de permitidos que deja pasar todo.
  assert.deepStrictEqual(problemasPuerta(raiz, () => true, ['CLAUDE.md', 'Demo/llave.mjs', 'scripts/entorno.mjs', 'index.html']),
    ['CLAUDE.md entra en la exportación', 'Demo/llave.mjs entra en la exportación', 'scripts/entorno.mjs entra en la exportación']);
});

// ---------------------------------------------------------------------------
// G10: el precio que se muestra coincide con el host (cinturón en el navegador).
// ---------------------------------------------------------------------------
const tablaG10 = (fn) => {
  const casos = [
    [{ host: 'www.lausof.com', catalogoDemo: false }, true],
    [{ host: 'lausof.com', catalogoDemo: false }, true],
    [{ host: 'www.lausof.com', catalogoDemo: true }, false],
    [{ host: 'lausof-demo-uvhgjf.netlify.app', catalogoDemo: true }, true],
    [{ host: 'lausof-demo-uvhgjf.netlify.app', catalogoDemo: false }, false],
    [{ host: 'localhost:8080', catalogoDemo: false }, false],
    [{ host: 'www.lausof.com', catalogoDemo: undefined }, false],
    [{ host: 'www.lausof.com.evil.example', catalogoDemo: false }, false],
  ];
  return casos.filter(([entrada, esperado]) => fn(entrada) !== esperado).map(([entrada]) => JSON.stringify(entrada));
};

test('G10: puedeMostrarPrecios no deja ver precios de prueba en producción ni reales en la demo', async () => {
  const { puedeMostrarPrecios, HOSTS_PRODUCCION } = require('../js/precios-host.js');
  assert.deepStrictEqual(tablaG10(puedeMostrarPrecios), []);
  // Control en rojo: los dos casos cambiados de lugar.
  const alReves = ({ host, catalogoDemo }) => !puedeMostrarPrecios({ host, catalogoDemo });
  assert.ok(tablaG10(alReves).length >= 4);
  // La lista de hosts es la de scripts/entorno.mjs (una sola verdad, espejada).
  const e = await entorno;
  assert.deepStrictEqual(HOSTS_PRODUCCION, e.HOSTS_PRODUCCION);
  assert.strictEqual(new URL(e.HOST_PRODUCCION).host, e.HOSTS_PRODUCCION[0]);
});

// La política de producción ya nombra a Apacheta de producción, así la demo
// cambia sólo el valor del host (O7) y no agrega directivas (3b §1.2).
test('_headers de producción: Apacheta de producción en script-src, frame-src y connect-src', async () => {
  const { APACHETA } = await entorno;
  const csp = headers.match(/Content-Security-Policy-Report-Only: ([^\n]+)/)[1];
  const d = Object.fromEntries(csp.split(';').map((x) => x.trim().split(/\s+/)).map(([n, ...v]) => [n, v]));
  assert.ok(d['script-src'].includes(APACHETA.produccion.app));
  assert.ok(d['frame-src'].includes(APACHETA.produccion.app));
  assert.deepStrictEqual(d['frame-src'][0], "'self'");
  assert.ok(d['connect-src'].includes(APACHETA.produccion.sitio));
});
