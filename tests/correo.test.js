// Enlaces de correo en español (13/10/2026, MEAS-1010 punto 7). Desde el
// 03/11/2026 (decisión de Lautaro, a revisar en un mes) el correo público es
// transporte@, que es donde se responde: todo mailto va a transporte@, sin
// copia, y el sitio no muestra contacto@ (scripts/prefill.mjs y
// scripts/empresa.mjs lo escriben; la casilla contacto@ sigue existiendo).
// Antes iban a contacto@ con copia a transporte@. Además cada enlace
// lleva un asunto fijo por página, para que el correo que llega diga desde
// qué página escribió el cliente aunque GA4 no lo haya registrado. El
// evento contact_email lo sigue mandando js/contacto.js (tests/medicion.test.js).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { paginasEs, sinComentarios } = require('./util.js');

const ASUNTO_PROVEEDOR = 'Solicitud de documentación de proveedor';

const mailtosDe = (html) => [...sinComentarios(html).matchAll(/href="mailto:([^"]+)"/g)]
  .map((m) => new URL(`mailto:${m[1].replace(/&amp;/g, '&')}`));

for (const [nombre, html] of Object.entries(paginasEs)) {
  const mailtos = mailtosDe(html);
  if (!mailtos.length) continue;

  test(`${nombre}: todo mailto va a transporte@, sin copia`, () => {
    for (const m of mailtos) {
      assert.strictEqual(m.pathname, 'transporte@lausof.com', `${nombre}: ${m.href}`);
      assert.strictEqual(m.searchParams.get('cc'), null, `${nombre}: lleva copia: ${m.href}`);
    }
  });

  test(`${nombre}: todos los mailto llevan el mismo asunto fijo, en castellano`, () => {
    const asuntos = new Set(mailtos.map((m) => m.searchParams.get('subject')));
    assert.ok(!asuntos.has(null), `${nombre}: hay un mailto sin asunto`);
    // Además del asunto de cotización, una página de empresas puede ofrecer
    // el pedido de documentación de proveedor, con su propio asunto fijo
    // (estructura del sitio 05/11/2026, 3a §3.5).
    asuntos.delete(ASUNTO_PROVEEDOR);
    assert.strictEqual(asuntos.size, 1, `${nombre}: más de un asunto: ${[...asuntos].join(' | ')}`);
    const [asunto] = asuntos;
    assert.match(asunto, /^(Pedido de cotización|Consulta|Alquiler)/, `${nombre}: asunto inesperado: ${asunto}`);
    assert.ok(asunto.length <= 80, `${nombre}: asunto demasiado largo`);
  });

  test(`${nombre}: los mailto sólo van a casillas de la empresa`, () => {
    for (const m of mailtos) {
      assert.match(m.pathname, /^transporte@lausof\.com$/, `${nombre}: ${m.href}`);
    }
  });
}

test('cada página en español tiene su propio asunto', () => {
  const porAsunto = new Map();
  for (const [nombre, html] of Object.entries(paginasEs)) {
    const m = mailtosDe(html)[0];
    if (!m) continue;
    const asunto = m.searchParams.get('subject');
    assert.ok(!porAsunto.has(asunto), `${nombre} repite el asunto de ${porAsunto.get(asunto)}: ${asunto}`);
    porAsunto.set(asunto, nombre);
  }
});

// El enlace con asunto y cuerpo sigue contando como contact_email y no deja
// salir ni la casilla ni el asunto en los parámetros.
test('un mailto con asunto manda contact_email sin la casilla ni el asunto', () => {
  const codigo = fs.readFileSync(path.join(__dirname, '..', 'js', 'contacto.js'), 'utf8');
  const eventos = [];
  let escucha;
  const window = { location: { pathname: '/turismo.html' }, gtag: (...a) => eventos.push(a) };
  const document = {
    documentElement: { lang: 'es-AR' },
    addEventListener: (tipo, fn) => { if (tipo === 'click') escucha = fn; },
  };
  vm.runInNewContext(codigo, { window, document });
  // El href tal cual lo lee el navegador en turismo.html (con &, no &amp;).
  const href = sinComentarios(paginasEs['turismo.html']).match(/href="(mailto:transporte@[^"]+)"/)[1].replace(/&amp;/g, '&');
  assert.match(href, /^mailto:transporte@lausof\.com\?subject=/);
  const a = {
    textContent: 'transporte@lausof.com',
    getAttribute: (n) => (n === 'href' ? href : null),
    closest: (selector) => (selector === 'a[href]' ? a : null),
  };
  escucha({ target: a });
  assert.strictEqual(eventos.length, 1, 'el clic no mandó ningún evento');
  const [, nombre, params] = eventos[0];
  assert.strictEqual(nombre, 'contact_email');
  assert.doesNotMatch(JSON.stringify(params), /@|cotizaci|subject|cc=/i);
});

// El correo que se ve es el mismo al que va el enlace: ninguna página (ni el
// JSON-LD, ni el pie, ni el texto) muestra contacto@, y ninguna lista del pie
// repite transporte@ (tenía las dos direcciones).
const todas = require('./util.js').paginas;
test('ninguna página muestra contacto@ ni repite transporte@ en el pie', () => {
  for (const [nombre, html] of Object.entries(todas)) {
    assert.doesNotMatch(sinComentarios(html), /contacto@lausof\.com/, `${nombre} muestra contacto@`);
    for (const [, lista] of sinComentarios(html).matchAll(/<ul>([\s\S]*?)<\/ul>/g)) {
      const vistos = [...lista.matchAll(/<li><a\b[^>]*>transporte@lausof\.com<\/a><\/li>/g)];
      assert.ok(vistos.length <= 1, `${nombre}: transporte@ dos veces en la misma lista`);
    }
  }
});

test('la ficha #empresa da transporte@ como correo, en la portada y en el bloque generado', async () => {
  const { FICHA, CORREO } = await import('../scripts/empresa.mjs');
  assert.strictEqual(CORREO, 'transporte@lausof.com');
  assert.strictEqual(FICHA.email, CORREO);
  const portada = JSON.parse(todas['index.html'].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.strictEqual(portada.email, CORREO);
});
