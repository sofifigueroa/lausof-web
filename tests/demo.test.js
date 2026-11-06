// Guardias de la DEMO de la vitrina (3b-diseno-entorno.md §2: G6–G9, G11, G12).
// El armado corre de verdad, con el manifiesto real, sobre una copia del árbol
// sin las fotos (assets/ no cambia nunca y pesa 63 MB), en una carpeta
// temporal. Cada guardia tiene su control en rojo: el mismo armado roto a
// propósito tiene que dar el problema que la guardia promete atrapar.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

const raiz = path.join(__dirname, '..');
const importar = (rel) => import(pathToFileURL(path.join(raiz, rel)).href);
const demo = importar('scripts/demo.mjs');
const entorno = importar('scripts/entorno.mjs');
const llave = importar('demo/llave.mjs');

const SHA = 'a'.repeat(40);
const temporal = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-test-'));
test.after(() => fs.rmSync(temporal, { recursive: true, force: true }));

// El árbol que el deploy publica (lo rastreado, más lo nuevo sin commitear
// mientras se trabaja), sin assets/.
const rastreados = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: raiz, encoding: 'utf8' })
  .split('\n').filter((rel) => rel && !rel.startsWith('assets/') && fs.existsSync(path.join(raiz, rel)));

let contador = 0;
const copiarArbol = (cambiar) => {
  const dir = path.join(temporal, `origen-${contador += 1}`);
  for (const rel of rastreados) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.copyFileSync(path.join(raiz, rel), path.join(dir, rel));
  }
  if (cambiar) cambiar(dir);
  return dir;
};

// armar sin git: copia el origen a <salida>/sitio y aplica el manifiesto.
const armarDesde = async (origen, { perfil, manifiesto, despues } = {}) => {
  const d = await demo;
  const salida = path.join(temporal, `salida-${contador += 1}`);
  fs.cpSync(origen, path.join(salida, 'sitio'), { recursive: true });
  const p = perfil || (await entorno).PERFILES.demo;
  await d.aplicarManifiesto({ salida, perfil: p, sha: SHA, ahora: new Date('2026-11-06T12:00:00Z'), manifiesto });
  if (despues) despues(path.join(salida, 'sitio'));
  return { salida, problemas: d.verificarSalida({ salida, origen, perfil: p, manifiesto }) };
};

const editar = (dir, rel, fn) => fs.writeFileSync(path.join(dir, rel), fn(fs.readFileSync(path.join(dir, rel), 'utf8')));

let base;
const armadoBase = async () => {
  if (!base) {
    const origen = copiarArbol();
    base = { origen, ...(await armarDesde(origen)) };
  }
  return base;
};

test('G6–G9: el armado real pasa todas las guardias de la salida', async () => {
  const { problemas, salida } = await armadoBase();
  assert.deepStrictEqual(problemas, []);
  const version = JSON.parse(fs.readFileSync(path.join(salida, 'sitio', 'version-demo.json'), 'utf8'));
  assert.strictEqual(version.sha, SHA);
  assert.deepStrictEqual(version.manifiesto.map((r) => r.id), ['O4', 'O12', 'O6', 'O1', 'O2', 'O3', 'O11', 'O5', 'O7', 'O10']);
});

test('G6: cada página lleva noindex, la franja en su idioma y «[Demo]»; sin sitemap, IndexNow ni GA4 de producción', async () => {
  const { salida } = await armadoBase();
  const sitio = path.join(salida, 'sitio');
  const html = (rel) => fs.readFileSync(path.join(sitio, rel), 'utf8');
  const { FRANJA } = await importar('demo/textos.mjs');
  // La marca: copy 4 (4-textos §7.1), un tester que no la ve puede tomar los
  // precios de prueba como reales.
  assert.ok(html('index.html').includes(`role="note" aria-label="${FRANJA.es.aria}"><span class="demo-franja-etiqueta">DEMO</span>${FRANJA.es.texto}</div>`));
  assert.ok(html('en/index.html').includes(FRANJA.en.texto));
  assert.ok(html('pt/index.html').includes(FRANJA.pt.texto));
  assert.match(html('404.html'), /<meta name="robots" content="noindex, nofollow">/);
  assert.doesNotMatch(html('index.html'), /googletagmanager\.com\/gtag/);
  assert.match(html('index.html'), /<style id="demo-marca">\.demo-franja\{[^<]+<\/style>\n<\/head>/);
  assert.ok(!fs.existsSync(path.join(sitio, 'css', 'demo.css')));
  assert.strictEqual(fs.readFileSync(path.join(sitio, 'robots.txt'), 'utf8'), 'User-agent: *\nAllow: /\n');
  for (const rel of ['sitemap.xml', 'd1eb0835b80b7ebe76ad80c22dc86589.txt', 'google40eac84837fa77f1.html']) {
    assert.ok(!fs.existsSync(path.join(sitio, rel)), `${rel} sigue en la demo`);
  }
  // Control en rojo: el manifiesto sin O2.
  const d = await demo;
  const sinO2 = d.MANIFIESTO.filter((e) => e.id !== 'O2');
  const { problemas } = await armarDesde(base.origen, { manifiesto: sinO2 });
  assert.ok(problemas.some((p) => p.startsWith('G6 index.html: sin <meta name="robots" content="noindex, nofollow">')), problemas.join('\n'));
});

test('G7: la demo nunca apunta a la Apacheta de producción', async () => {
  const { salida } = await armadoBase();
  const headers = fs.readFileSync(path.join(salida, 'sitio', '_headers'), 'utf8');
  const { APACHETA } = await entorno;
  assert.ok(headers.includes(`${APACHETA.demo.app};`) || headers.includes(`${APACHETA.demo.app} `));
  assert.ok(!headers.includes('getapacheta.com'));
  // Control en rojo: el perfil demo con el APP de producción.
  const perfil = structuredClone((await entorno).PERFILES.demo);
  perfil.tienda.app = APACHETA.produccion.app;
  const { problemas } = await armarDesde(base.origen, { perfil });
  assert.ok(problemas.some((p) => p.startsWith('G7 perfil demo')), problemas.join('\n'));
  assert.ok(problemas.some((p) => p === 'G7 _headers: nombra un host de producción de Apacheta'), problemas.join('\n'));
  // Control en rojo: una página carga el chat de la demo y la política no lo nombra.
  const sinHosts = copiarArbol((dir) => {
    editar(dir, '_headers', (h) => h.split(` ${APACHETA.produccion.app}`).join('').split(` ${APACHETA.produccion.sitio}`).join(''));
    editar(dir, 'turismo.html', (h) => h.replace('</body>', `<script src="${APACHETA.demo.app}/asistente/x/boton.js" async></script></body>`));
  });
  const csp = await armarDesde(sinHosts);
  assert.deepStrictEqual(csp.problemas.filter((p) => p.startsWith('G7')),
    ['G7 _headers: script-src sin el APP de la demo', 'G7 _headers: frame-src sin el APP de la demo', 'G7 _headers: connect-src sin el SITIO de la demo']);
});

test('G8: la demo difiere del árbol de producción sólo en lo que declara el manifiesto', async () => {
  // Control en rojo 1: un cambio suelto, fuera del manifiesto.
  const suelto = await armarDesde(base.origen, { despues: (sitio) => editar(sitio, 'js/menu.js', (t) => `${t}\n// suelto\n`) });
  assert.deepStrictEqual(suelto.problemas, ['G8 js/menu.js: cambia y no está en el manifiesto']);
  // Control en rojo 2: una entrada que no cambió nada (robots ya como el de la demo).
  const origen = copiarArbol((dir) => editar(dir, 'robots.txt', () => 'User-agent: *\nAllow: /\n'));
  const quieto = await armarDesde(origen);
  assert.ok(quieto.problemas.some((p) => p.startsWith('G8 O5: no cambió nada')), quieto.problemas.join('\n'));
});

test('G9: los enlaces de la demo no salen a www.lausof.com', async () => {
  // Control en rojo: un enlace absoluto a producción en una página.
  const origen = copiarArbol((dir) => editar(dir, 'turismo.html', (h) => h.replace('</main>', '<a href="https://www.lausof.com/galeria.html">x</a></main>')));
  const { problemas } = await armarDesde(origen);
  assert.deepStrictEqual(problemas, ['G9 turismo.html: enlace absoluto a producción https://www.lausof.com/galeria.html']);
});

test('O11: la respuesta del precio cambia sólo donde la vitrina existe', async () => {
  const { RESPUESTA_PRECIO, FAQ_PRECIO } = await importar('demo/textos.mjs');
  const { salida } = await armadoBase();
  const cafayate = fs.readFileSync(path.join(salida, 'sitio', 'traslado-salta-cafayate.html'), 'utf8');
  const d = await demo;
  if (!d.zonaTienda(cafayate)) assert.match(cafayate, /<summary>¿Cuánto cuesta\?<\/summary>\s*<p>[^<]*la cotización se envía por escrito/);
  // Con la vitrina (simulada en el origen como la escribiría el generador), la
  // respuesta pasa a la de 4-textos §5. El ancla de la vitrina es #precios
  // (#reservar sigue siendo «Cómo reservar» en producción).
  const paginasConVitrina = ['traslado-salta-cafayate.html', 'traslado-serenata-a-cafayate.html', 'en/salta-to-cafayate-transfer.html', 'pt/traslado-salta-cafayate.html'];
  const bloque = (atributos) => `<!-- GENERADO:TIENDA bloque -->\n<section class="block tienda" id="precios" ${atributos}></section>\n<!-- /GENERADO:TIENDA -->\n</main>`;
  const conVitrina = (atributos, extra = '') => copiarArbol((dir) => {
    for (const rel of paginasConVitrina) editar(dir, rel, (h) => h.replace('</main>', `${extra}${bloque(atributos)}`));
  });
  const { salida: s2, problemas } = await armarDesde(conVitrina('data-servicios="x" data-tienda-con-precio'));
  assert.deepStrictEqual(problemas, []);
  // Control en rojo 1: la vitrina sin tarjeta con precio (eventos «solo presupuesto») deja el texto de hoy.
  const sinPrecio = await armarDesde(conVitrina('data-servicios="x"'));
  const respuestaFaq = (h) => h.match(/<summary>¿Cuánto cuesta\?<\/summary>\s*<p>([\s\S]*?)<\/p>/)[1];
  const serenata = 'traslado-serenata-a-cafayate.html';
  assert.strictEqual(respuestaFaq(fs.readFileSync(path.join(sinPrecio.salida, 'sitio', serenata), 'utf8')),
    respuestaFaq(fs.readFileSync(path.join(raiz, serenata), 'utf8')));
  // Control en rojo 2: #precios doble en la página.
  const doble = await armarDesde(conVitrina('data-tienda-con-precio', '<p id="precios"></p>'));
  assert.strictEqual(doble.problemas.length, paginasConVitrina.length);
  assert.ok(doble.problemas.every((p) => p.endsWith('O11 enlaza a #precios y el ancla no es única o no está en la vitrina')), doble.problemas.join('\n'));
  const html = (rel) => fs.readFileSync(path.join(s2, 'sitio', rel), 'utf8');
  assert.ok(html('traslado-salta-cafayate.html').includes(`<summary>¿Cuánto cuesta?</summary>\n          <p>${RESPUESTA_PRECIO.es.precio}</p>`));
  assert.ok(html('traslado-serenata-a-cafayate.html').includes(RESPUESTA_PRECIO.es.evento));
  assert.ok(html('en/salta-to-cafayate-transfer.html').includes(RESPUESTA_PRECIO.en.precio));
  assert.ok(html('pt/traslado-salta-cafayate.html').includes(RESPUESTA_PRECIO.pt.precio));
  assert.doesNotMatch(html('traslado-salta-cafayate.html'), /<summary>¿Cuánto cuesta\?<\/summary>\s*<p>[^<]*la cotización se envía por escrito/);
  // Cada página de la lista existe y tiene la pregunta (si no, O11 corta el armado).
  for (const rel of Object.keys(FAQ_PRECIO)) assert.ok(fs.existsSync(path.join(raiz, rel)), rel);
});

test('O8 y O9: netlify.toml y la puerta van al lado de sitio/, nunca adentro', async () => {
  const { salida } = await armadoBase();
  const toml = fs.readFileSync(path.join(salida, 'netlify.toml'), 'utf8');
  assert.match(toml, /publish = "sitio"/);
  assert.match(toml, /excludedPath = \["\/assets\/\*", "\/robots\.txt"\]/);
  assert.strictEqual(fs.readFileSync(path.join(salida, 'netlify', 'edge-functions', 'llave.js'), 'utf8'),
    fs.readFileSync(path.join(raiz, 'demo', 'llave.mjs'), 'utf8'));
});

// ---------------------------------------------------------------------------
// G11: publicar no puede apuntar a producción.
// ---------------------------------------------------------------------------
test('G11: publicar rehúsa producción, un sitio sin «demo», un árbol sucio y un sha fuera de la rama', async () => {
  const { motivosParaNoPublicar } = await demo;
  const { PERFILES, NETLIFY_PRODUCCION } = await entorno;
  const bien = { sitio: PERFILES.demo.netlify, limpio: true, head: SHA, sha: SHA, enRama: true, problemas: [] };
  assert.deepStrictEqual(motivosParaNoPublicar(bien), []);
  // Controles en rojo, uno por motivo.
  assert.deepStrictEqual(motivosParaNoPublicar({ ...bien, sitio: { id: NETLIFY_PRODUCCION.id, nombre: 'lausof-demo-x' } }), ['el destino es el sitio de PRODUCCIÓN']);
  assert.deepStrictEqual(motivosParaNoPublicar({ ...bien, sitio: { id: 'x', nombre: 'lausof' } }), ['el sitio «lausof» no tiene «demo» en el nombre']);
  assert.deepStrictEqual(motivosParaNoPublicar({ ...bien, limpio: false }), ['el árbol tiene cambios sin commitear']);
  assert.deepStrictEqual(motivosParaNoPublicar({ ...bien, enRama: false }), ['el sha no está en origin/rediseno-agosto-2026']);
  assert.strictEqual(motivosParaNoPublicar({ ...bien, head: 'b'.repeat(40) }).length, 1);
  assert.deepStrictEqual(motivosParaNoPublicar({ ...bien, problemas: ['G6 x'] }), ['1 guardia(s) de la salida en rojo']);
  assert.ok(motivosParaNoPublicar({ ...bien, sitio: null }).includes('sin sitio de destino'));
});

// ---------------------------------------------------------------------------
// G12: la puerta de la llave falla cerrada.
// ---------------------------------------------------------------------------
const LLAVE = 'f'.repeat(64);
const pedido = (url, cookie) => new Request(url, { headers: cookie ? { cookie } : {} });

test('G12: con la llave correcta, 302 a la misma ruta sin la llave y con la cookie', async () => {
  const { decidir, COOKIE, firmaDe, DURACION_COOKIE } = await llave;
  const r = await decidir(pedido('https://lausof-demo-x.netlify.app/turismo.html?llave=' + LLAVE + '&a=1'), { llave: LLAVE });
  assert.strictEqual(r.status, 302);
  assert.strictEqual(r.headers.get('location'), '/turismo.html?a=1');
  assert.strictEqual(r.headers.get('set-cookie'), `${COOKIE}=${await firmaDe(LLAVE)}; Max-Age=${DURACION_COOKIE}; Path=/; HttpOnly; Secure; SameSite=Lax`);
  assert.strictEqual(r.headers.get('x-robots-tag'), 'noindex, nofollow');
  // Con la cookie, pasa (null = la página sigue su curso).
  assert.strictEqual(await decidir(pedido('https://lausof-demo-x.netlify.app/', `otra=1; ${COOKIE}=${await firmaDe(LLAVE)}`), { llave: LLAVE }), null);
});

test('G12: sin variable, con llave equivocada o cookie equivocada, 401 con X-Robots-Tag', async () => {
  const { decidir, COOKIE, firmaDe } = await llave;
  const url = 'https://lausof-demo-x.netlify.app/';
  const casos = [
    ['sin variable', pedido(`${url}?llave=${LLAVE}`), undefined],
    ['variable vacía', pedido(`${url}?llave=`), ''],
    ['llave corta', pedido(`${url}?llave=abc`), 'abc'],
    ['llave equivocada', pedido(`${url}?llave=${'e'.repeat(64)}`), LLAVE],
    ['sin nada', pedido(url), LLAVE],
    ['cookie de otra llave', pedido(url, `${COOKIE}=${await firmaDe('e'.repeat(64))}`), LLAVE],
    ['cookie con la llave en claro', pedido(url, `${COOKIE}=${LLAVE}`), LLAVE],
  ];
  for (const [nombre, req, valor] of casos) {
    const r = await decidir(req, { llave: valor });
    assert.ok(r, `${nombre}: dejó pasar`);
    assert.strictEqual(r.status, 401, nombre);
    assert.strictEqual(r.headers.get('x-robots-tag'), 'noindex, nofollow', nombre);
    assert.strictEqual(r.headers.get('set-cookie'), null, nombre);
    const cuerpo = await r.text();
    assert.ok(cuerpo.includes('Esta página se abre con el enlace de acceso completo.'), nombre);
    assert.ok(!cuerpo.includes(LLAVE), `${nombre}: el 401 repite la llave`);
  }
});

test('G12: el envoltorio de Netlify sin DEMO_LLAVE responde 401 (falla cerrada)', async () => {
  const puerta = (await llave).default;
  const anterior = globalThis.Netlify;
  globalThis.Netlify = { env: { get: () => undefined } };
  try {
    const r = await puerta(pedido(`https://lausof-demo-x.netlify.app/?llave=${LLAVE}`), { next: () => 'siguió' });
    assert.strictEqual(r.status, 401);
    globalThis.Netlify = { env: { get: () => LLAVE } };
    assert.strictEqual((await puerta(pedido(`https://lausof-demo-x.netlify.app/?llave=${LLAVE}`), { next: () => 'siguió' })).status, 302);
  } finally {
    globalThis.Netlify = anterior;
  }
});
