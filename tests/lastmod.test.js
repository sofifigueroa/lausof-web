// <lastmod> del sitemap = fecha del último commit de cada página
// (scripts/lastmod.mjs). Hasta el 13/10/2026 se escribía a mano y había
// páginas cambiadas el 10/10 con lastmod de agosto (producciones.html), que es
// justo lo que hace que Google deje de creerle al sitemap.
//
// La comprobación contra git corre donde hay repositorio (la PC de pruebas
// sincroniza el .git). Si un día la suite corre sobre una copia sin git, ese
// test se saltea diciéndolo: no pasa en silencio.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { sitemap, paginasEs } = require('./util.js');

const guion = import('../scripts/lastmod.mjs');
const raiz = path.join(__dirname, '..');

test('cada URL del sitemap corresponde a un archivo del sitio', async () => {
  const { archivoDeLoc, locDeArchivo } = await guion;
  assert.strictEqual(archivoDeLoc('https://www.lausof.com/'), 'index.html');
  assert.strictEqual(archivoDeLoc('https://www.lausof.com/en/'), 'en/index.html');
  assert.strictEqual(archivoDeLoc('https://www.lausof.com/turismo.html'), 'turismo.html');
  assert.throws(() => archivoDeLoc('https://lausof.com/turismo.html'), /otro sitio/);
  for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const archivo = archivoDeLoc(loc);
    assert.ok(fs.existsSync(path.join(raiz, archivo)), `${loc} no tiene archivo (${archivo})`);
    assert.strictEqual(locDeArchivo(archivo), loc, 'ida y vuelta entre URL y archivo');
  }
});

test('la fecha se toma en hora de Salta, no en UTC', async () => {
  const { fechaSalta } = await guion;
  // 01:30 UTC del 14 todavía es el 13 a las 22:30 en Salta.
  assert.strictEqual(fechaSalta(new Date('2026-10-14T01:30:00Z')), '2026-10-13');
  assert.strictEqual(fechaSalta(new Date('2026-10-14T03:00:00Z')), '2026-10-14');
});

test('alinearSitemap cambia sólo los <lastmod>, y agrega el que falta', async () => {
  const { alinearSitemap } = await guion;
  const xml = '<urlset>\n  <url>\n    <loc>https://www.lausof.com/</loc>\n    <lastmod>2026-08-26</lastmod>\n  </url>\n'
    + '  <url>\n    <loc>https://www.lausof.com/a.html</loc>\n  </url>\n</urlset>\n';
  const nuevo = alinearSitemap(xml, (loc) => (loc.endsWith('/') ? '2026-10-13' : '2026-10-10'));
  assert.strictEqual(nuevo,
    '<urlset>\n  <url>\n    <loc>https://www.lausof.com/</loc>\n    <lastmod>2026-10-13</lastmod>\n  </url>\n'
    + '  <url>\n    <loc>https://www.lausof.com/a.html</loc>\n    <lastmod>2026-10-10</lastmod>\n  </url>\n</urlset>\n');
  assert.strictEqual(alinearSitemap(nuevo, (loc) => (loc.endsWith('/') ? '2026-10-13' : '2026-10-10')), nuevo, 'no es idempotente');
});

test('el <lastmod> de cada URL es la fecha de git de su archivo', async (t) => {
  const { hayGit, desactualizadas } = await guion;
  if (!hayGit()) {
    t.skip('sin repositorio git: el lastmod no se puede comprobar en esta copia');
    return;
  }
  const viejas = desactualizadas();
  assert.deepStrictEqual(viejas, [],
    `correr node scripts/lastmod.mjs: ${viejas.map((v) => `${v.loc} dice ${v.tiene}, corresponde ${v.corresponde}`).join('; ')}`);
});

test('ningún lastmod está en el futuro ni es anterior al "dateModified" de su página', async () => {
  const { archivoDeLoc, fechaSalta } = await guion;
  const hoy = fechaSalta(new Date());
  for (const [, loc, lastmod] of sitemap.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
    assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/, `${loc}: lastmod con otro formato`);
    assert.ok(lastmod <= hoy, `${loc}: lastmod ${lastmod} en el futuro`);
    const html = fs.readFileSync(path.join(raiz, archivoDeLoc(loc)), 'utf8');
    for (const [, fecha] of html.matchAll(/"dateModified":\s*"(\d{4}-\d{2}-\d{2})"/g)) {
      assert.ok(lastmod >= fecha, `${loc}: lastmod ${lastmod} anterior a dateModified ${fecha}`);
    }
  }
});

// IndexNow elige qué avisar con los mismos <lastmod>, y suma lo que cambió en git.
test('IndexNow: cambiadasEnGit traduce archivos cambiados a URLs del sitemap', async () => {
  const { cambiadasEnGit } = await import('../scripts/indexnow.mjs');
  const actual = [
    { loc: 'https://www.lausof.com/', lastmod: '2026-10-13' },
    { loc: 'https://www.lausof.com/en/', lastmod: '2026-10-13' },
    { loc: 'https://www.lausof.com/turismo.html', lastmod: '2026-10-13' },
    { loc: 'https://www.lausof.com/galeria.html', lastmod: '2026-10-13' },
  ];
  assert.deepStrictEqual(
    cambiadasEnGit(actual, ['index.html', 'en/index.html', 'turismo.html', 'css/styles.css', 'tests/seo.test.js', '404.html']),
    ['https://www.lausof.com/', 'https://www.lausof.com/en/', 'https://www.lausof.com/turismo.html']);
});

// producciones.html estaba "rastreada, sin indexar" con un solo enlace interno
// (la portada). Desde el 13/10 la enlazan en contexto tres páginas de servicio.
test('producciones.html recibe enlaces de contexto desde al menos tres páginas en español, además de la portada', () => {
  const desde = Object.entries(paginasEs)
    .filter(([nombre, html]) => nombre !== 'producciones.html' && nombre !== 'index.html' && /<main[\s\S]*href="producciones\.html"[\s\S]*<\/main>/.test(html))
    .map(([nombre]) => nombre);
  assert.ok(desde.length >= 3, `sólo la enlazan: ${desde.join(', ')}`);
  for (const nombre of ['logistica-minera.html', 'alquiler-4x4.html', 'transporte-de-personal.html']) {
    assert.ok(desde.includes(nombre), `${nombre} dejó de enlazar producciones.html`);
  }
});
