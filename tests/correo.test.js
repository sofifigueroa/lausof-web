// Enlaces de correo en español (13/10/2026, MEAS-1010 punto 7). contacto@ es
// una casilla aparte de transporte@, que es donde se responde: todo mailto a
// contacto@ copia a transporte@, igual que en las páginas en inglés
// (decisión de Lautaro del 31/08, tests/ingles.test.js). Además cada enlace
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

const mailtosDe = (html) => [...sinComentarios(html).matchAll(/href="mailto:([^"]+)"/g)]
  .map((m) => new URL(`mailto:${m[1].replace(/&amp;/g, '&')}`));

for (const [nombre, html] of Object.entries(paginasEs)) {
  const mailtos = mailtosDe(html);
  if (!mailtos.length) continue;

  test(`${nombre}: todo mailto a contacto@ copia a transporte@`, () => {
    for (const m of mailtos.filter((u) => u.pathname === 'contacto@lausof.com')) {
      assert.strictEqual(m.searchParams.get('cc'), 'transporte@lausof.com', `${nombre}: ${m.href}`);
    }
  });

  test(`${nombre}: todos los mailto llevan el mismo asunto fijo, en castellano`, () => {
    const asuntos = new Set(mailtos.map((m) => m.searchParams.get('subject')));
    assert.ok(!asuntos.has(null), `${nombre}: hay un mailto sin asunto`);
    assert.strictEqual(asuntos.size, 1, `${nombre}: más de un asunto: ${[...asuntos].join(' | ')}`);
    const [asunto] = asuntos;
    assert.match(asunto, /^(Pedido de cotización|Consulta|Alquiler)/, `${nombre}: asunto inesperado: ${asunto}`);
    assert.ok(asunto.length <= 80, `${nombre}: asunto demasiado largo`);
  });

  test(`${nombre}: los mailto sólo van a casillas de la empresa`, () => {
    for (const m of mailtos) {
      assert.match(m.pathname, /^(contacto|transporte)@lausof\.com$/, `${nombre}: ${m.href}`);
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

// El enlace con copia y asunto sigue contando como contact_email y no deja
// salir ni la casilla ni el asunto en los parámetros.
test('un mailto con cc y asunto manda contact_email sin la casilla ni el asunto', () => {
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
  const href = sinComentarios(paginasEs['turismo.html']).match(/href="(mailto:contacto@[^"]+)"/)[1].replace(/&amp;/g, '&');
  assert.match(href, /cc=transporte@lausof\.com&subject=/);
  const a = {
    textContent: 'contacto@lausof.com',
    getAttribute: (n) => (n === 'href' ? href : null),
    closest: (selector) => (selector === 'a[href]' ? a : null),
  };
  escucha({ target: a });
  assert.strictEqual(eventos.length, 1, 'el clic no mandó ningún evento');
  const [, nombre, params] = eventos[0];
  assert.strictEqual(nombre, 'contact_email');
  assert.doesNotMatch(JSON.stringify(params), /@|cotizaci|subject|cc=/i);
});
