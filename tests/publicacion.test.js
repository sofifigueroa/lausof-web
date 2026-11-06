// Lo que se publica (scripts/publicacion.mjs): producción y la demo suben una
// exportación armada con una lista de permitidos, nunca la raíz del repo.
// Por qué: Netlify sirve los archivos en minúsculas y las reglas 404! de
// _redirects distinguen mayúsculas, así que /Readme.md, /Scripts/*.mjs,
// /Tests/*.js y /Package.json respondían 200 en www.lausof.com hasta el
// 06/11/2026 (8-auditoria-entorno.md). Cada guardia tiene su control en rojo.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const raiz = path.join(__dirname, '..');
const publicacion = import(pathToFileURL(path.join(raiz, 'scripts', 'publicacion.mjs')).href);
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'publicacion-test-'));
test.after(() => fs.rmSync(temporal, { recursive: true, force: true }));

const CLAVE = fs.readFileSync(path.join(raiz, 'scripts', 'indexnow.mjs'), 'utf8').match(/export const CLAVE = '([0-9a-f]{32})'/)[1];

test('la lista de permitidos deja pasar el sitio y nada interno, en ninguna grafía', async () => {
  const { esPublico } = await publicacion;
  const si = ['index.html', '404.html', 'google40eac84837fa77f1.html', 'en/index.html', 'pt/index.html', 'css/estilos.css',
    'js/menu.js', 'assets/fotos/a/b-v1.webp', 'assets/x.avif', 'assets/x.jpg', 'assets/x.png', 'robots.txt', 'sitemap.xml',
    '_headers', '_redirects', `${CLAVE}.txt`, '.well-known/security.txt'];
  const no = ['README.md', 'Readme.md', 'readme.md', 'CLAUDE.md', 'Claude.md', 'NOTES.md', 'package.json', 'Package.json',
    'package-lock.json', 'scripts/menu.mjs', 'Scripts/menu.mjs', 'tests/util.js', 'Tests/util.js', 'e2e/x.js', 'demo/llave.mjs',
    'Demo/llave.mjs', 'scripts/entorno.mjs', 'netlify.toml', 'netlify/edge-functions/x.js', '.gitignore', '.env', '.git/config',
    'assets/fotos/biblioteca.json', 'assets/notas.md', 'en/notas.md', 'js/x.mjs', 'css/.oculto.css', 'otro.txt',
    'Index.html', 'en/README.md', 'assets/.DS_Store'];
  assert.deepStrictEqual(si.filter((rel) => !esPublico(rel, { clave: CLAVE })), []);
  assert.deepStrictEqual(no.filter((rel) => esPublico(rel, { clave: CLAVE })), []);
  // version-demo.json sólo con el extra de la demo.
  assert.strictEqual(esPublico('version-demo.json', { clave: CLAVE }), false);
  assert.strictEqual(esPublico('version-demo.json', { clave: CLAVE, extras: ['version-demo.json'] }), true);
});

// Un repo de juguete con lo público y lo interno mezclado, en git de verdad.
const repoDeJuguete = () => {
  const dir = path.join(temporal, `repo-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const archivos = {
    'index.html': '<link rel="stylesheet" href="/css/a.css?v=1"><img src="/assets/f/x.webp" srcset="/assets/f/x.avif 1x, /assets/f/x.webp 2x"><a href="/en/">en</a><a href="/contact">c</a><a href="turismo">t</a><a href="mailto:a@b.c">m</a><a href="https://www.lausof.com/turismo.html">abs</a><meta property="og:image" content="https://www.lausof.com/assets/f/x.webp"><meta name="description" content="Texto libre con espacios">',
    'turismo.html': '<a href="/#contacto">x</a>',
    'en/index.html': '<a href="../index.html">es</a>',
    'css/a.css': 'body{background:url("/assets/f/x.webp")}',
    'assets/f/x.webp': 'w', 'assets/f/x.avif': 'a', 'assets/f/datos.json': '{}',
    'robots.txt': 'User-agent: *\n', 'sitemap.xml': '<urlset/>', '_headers': '/*\n  X: y\n',
    '_redirects': '/contact /en/#contact 301\n/README.md /404.html 404!\n', [`${CLAVE}.txt`]: CLAVE,
    'README.md': 'interno', 'CLAUDE.md': 'interno', 'NOTAS.md': 'interno', 'package.json': '{}',
    'scripts/indexnow.mjs': `export const CLAVE = '${CLAVE}';\n`, 'scripts/entorno.mjs': 'x', 'tests/a.test.js': 'x',
    'demo/llave.mjs': 'x', 'e2e/x.js': 'x', '.gitignore': 'node_modules\n',
  };
  for (const [rel, texto] of Object.entries(archivos)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), texto);
  }
  const g = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...a], { encoding: 'utf8' }).trim();
  g('init', '-q');
  g('add', '-A');
  g('commit', '-q', '-m', 'x');
  return { dir, sha: g('rev-parse', 'HEAD') };
};

test('exportar escribe sólo lo permitido del sha, y la guardia de la carpeta atrapa lo que sobra o falta', async () => {
  const { exportar, problemasDeLaExportacion, archivosDe } = await publicacion;
  const { dir, sha } = repoDeJuguete();
  const salida = path.join(temporal, `exportado-${Date.now()}`);
  const x = await exportar({ sha, salida, raiz: dir });
  assert.deepStrictEqual(archivosDe(salida), ['_headers', '_redirects', 'assets/f/x.avif', 'assets/f/x.webp', 'css/a.css',
    `${CLAVE}.txt`, 'en/index.html', 'index.html', 'robots.txt', 'sitemap.xml', 'turismo.html'].sort());
  assert.strictEqual(x.clave, CLAVE);
  assert.ok(x.afuera.includes('README.md') && x.afuera.includes('scripts/entorno.mjs') && x.afuera.includes('assets/f/datos.json'));
  assert.deepStrictEqual(problemasDeLaExportacion(salida, { clave: CLAVE }), []);

  // Control en rojo: lo que no se publica nunca, metido a mano en la carpeta.
  fs.writeFileSync(path.join(salida, 'NOTES.md'), 'x');
  fs.mkdirSync(path.join(salida, 'Scripts'));
  fs.writeFileSync(path.join(salida, 'Scripts', 'x.mjs'), 'x');
  fs.writeFileSync(path.join(salida, 'Package.json'), '{}');
  const sobra = problemasDeLaExportacion(salida, { clave: CLAVE });
  for (const rel of ['NOTES.md', 'Scripts/x.mjs', 'Package.json']) assert.ok(sobra.includes(`${rel}: no está en la lista de permitidos`), rel);
  assert.ok(sobra.includes('NOTES.md: un .md no se publica nunca'));

  // Control en rojo: una hoja que falta y la referencia queda rota.
  fs.unlinkSync(path.join(salida, 'css', 'a.css'));
  assert.ok(problemasDeLaExportacion(salida, { clave: CLAVE }).includes('index.html: enlaza /css/a.css?v=1 y css/a.css no está en lo exportado'));

  // Un enlace a una ruta con 404! no cuenta como resuelto.
  fs.writeFileSync(path.join(salida, 'turismo.html'), '<a href="/README.md">x</a>');
  assert.ok(problemasDeLaExportacion(salida, { clave: CLAVE }).includes('turismo.html: enlaza /README.md y README.md no está en lo exportado'));
});

test('exportar sólo escribe en una carpeta nueva y fuera del repo', async () => {
  const { exportar } = await publicacion;
  const { dir, sha } = repoDeJuguete();
  await assert.rejects(exportar({ sha, salida: path.join(dir, 'salida'), raiz: dir }), /dentro del repo/);
  const existente = fs.mkdtempSync(path.join(temporal, 'existe-'));
  await assert.rejects(exportar({ sha, salida: existente, raiz: dir }), /ya existe/);
  await assert.rejects(exportar({ sha: sha.slice(0, 7), salida: path.join(temporal, `corto-${Date.now()}`), raiz: dir }), /40 caracteres/);
});

test('lo que este árbol publicaría: sólo permitidos, las 77 páginas del sitemap y cada href/src resuelve adentro', async () => {
  const { esPublico, problemasDeLosArchivos } = await publicacion;
  const rastreados = execFileSync('git', ['ls-files'], { cwd: raiz, encoding: 'utf8' }).split('\n').filter(Boolean);
  const publicos = rastreados.filter((rel) => esPublico(rel, { clave: CLAVE }));
  const leer = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
  assert.deepStrictEqual(problemasDeLosArchivos(publicos, leer, { clave: CLAVE }), []);

  const locs = [...leer('sitemap.xml').matchAll(/<loc>https:\/\/www\.lausof\.com\/([^<]*)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 77, `el sitemap tiene ${locs.length} URLs`);
  const presentes = new Set(publicos);
  assert.deepStrictEqual(locs.filter((u) => !(presentes.has(u) || presentes.has(`${u}index.html`) || presentes.has(`${u}.html`))), []);
  for (const rel of ['_headers', '_redirects', 'robots.txt', 'sitemap.xml', `${CLAVE}.txt`, '404.html']) assert.ok(presentes.has(rel), rel);
  assert.deepStrictEqual(publicos.filter((rel) => /\.md$|^(?:scripts|tests|demo|e2e)\/|package|^\./i.test(rel)), []);

  // Control en rojo: un archivo interno en la lista y una hoja que falta.
  assert.deepStrictEqual(problemasDeLosArchivos([...publicos, 'NOTES.md'], leer, { clave: CLAVE, revisarEnlaces: false }),
    ['NOTES.md: un .md no se publica nunca', 'NOTES.md: no está en la lista de permitidos']);
  const hoja = publicos.find((rel) => rel.startsWith('css/'));
  const sinHoja = problemasDeLosArchivos(publicos.filter((rel) => rel !== hoja), leer, { clave: CLAVE });
  assert.ok(sinHoja.length > 0 && sinHoja.every((p) => p.includes(`${hoja} no está en lo exportado`)), sinHoja.slice(0, 3).join('\n'));
});

test('la lista de archivos en vivo (API de Netlify, en minúsculas) sólo tiene rutas permitidas', async () => {
  const { problemasDeLaListaEnVivo } = await publicacion;
  const limpia = ['/index.html', '/en/index.html', '/css/a.css', '/assets/f/x.webp', '/robots.txt', '/sitemap.xml', `/${CLAVE}.txt`, '/netlify.toml'];
  assert.deepStrictEqual(problemasDeLaListaEnVivo(limpia, { clave: CLAVE }), []);
  // Control en rojo: la lista que publicaba el deploy 6aed60fa (06/11/2026).
  const vieja = [...limpia, '/readme.md', '/scripts/menu.mjs', '/tests/util.js', '/package.json', '/assets/fotos/biblioteca.json'];
  const mal = problemasDeLaListaEnVivo(vieja, { clave: CLAVE });
  for (const r of ['/readme.md', '/scripts/menu.mjs', '/tests/util.js', '/package.json', '/assets/fotos/biblioteca.json']) {
    assert.ok(mal.includes(`${r}: no está en la lista de permitidos`), r);
  }
});
