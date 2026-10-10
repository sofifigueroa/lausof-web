// Fechas pasadas en las páginas con filas fechadas (js/vigencia.js).
//
// Regla (Lautaro, 10/10/2026; ~/lausof/web/growth-2026-10/BUILD-BRIEF.md,
// "Past events"): un evento o una fecha que ya pasó nunca se saca, no se
// redirige ni se esconde. La fila queda en el HTML servido (buscadores y
// asistentes de IA la ven), el script sólo la pasa a "Fechas anteriores" y,
// cuando ya no queda ninguna fecha próxima en una página de evento, muestra
// arriba la nota "Esta edición ya pasó".
//
// El script corre de verdad en un contexto aislado de Node (node:vm) sobre un
// DOM mínimo armado con el <main> real de cada página, con el reloj fijo: así
// se prueban la página y el script juntos, sin navegador ni dependencias.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { paginas, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const codigo = fs.readFileSync(path.join(raiz, 'js', 'vigencia.js'), 'utf8');

const RECITALES = 'charter-recitales.html';
const HUB = 'feriados-fines-de-semana-largos.html';
const EVENTOS = [
  'traslado-carnaval-quebrada-de-humahuaca.html',
  'en/transfer-carnival-quebrada-de-humahuaca.html',
  'traslado-serenata-a-cafayate.html',
];
const CON_VIGENCIA = [RECITALES, HUB, ...EVENTOS];
const esIngles = (nombre) => nombre.startsWith('en/');

// ---------------------------------------------------------------------------
// DOM mínimo: lo justo que usa vigencia.js (selectores [atributo], etiqueta y
// etiqueta.clase; closest; appendChild; hidden; classList; textContent).
// ---------------------------------------------------------------------------
const VACIOS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'path']);

class Nodo {
  constructor(tag, attrs = {}) {
    this.tag = tag;
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this.style = {};
    this.texto = '';
    const nodo = this;
    this.classList = {
      add: (c) => { const cs = nodo.clases(); if (!cs.includes(c)) nodo.attrs.class = [...cs, c].join(' '); },
      contains: (c) => nodo.clases().includes(c),
    };
  }
  clases() { return (this.attrs.class || '').split(/\s+/).filter(Boolean); }
  getAttribute(n) { return n in this.attrs ? this.attrs[n] : null; }
  setAttribute(n, v) { this.attrs[n] = String(v); }
  get hidden() { return 'hidden' in this.attrs; }
  set hidden(v) { if (v) this.attrs.hidden = ''; else delete this.attrs.hidden; }
  set textContent(v) { this.children = []; this.texto = String(v); }
  get textContent() { return this.texto + this.children.map((c) => c.textContent).join(''); }
  appendChild(hijo) {
    if (hijo.parent) hijo.parent.children = hijo.parent.children.filter((c) => c !== hijo);
    hijo.parent = this;
    this.children.push(hijo);
    return hijo;
  }
  cumple(sel) {
    const attr = sel.match(/^\[([\w-]+)\]$/);
    if (attr) return attr[1] in this.attrs;
    const [tag, clase] = sel.split('.');
    return (!tag || this.tag === tag) && (!clase || this.clases().includes(clase));
  }
  querySelectorAll(sel) {
    const out = [];
    const recorrer = (n) => { for (const c of n.children) { if (c.cumple(sel)) out.push(c); recorrer(c); } };
    recorrer(this);
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  closest(sel) {
    for (let n = this; n; n = n.parent) if (n.tag && n.cumple(sel)) return n;
    return null;
  }
}

// Arma el árbol del <main> de la página (sin comentarios).
const domDe = (html) => {
  const main = sinComentarios(html).match(/<main>([\s\S]*?)<\/main>/)[1];
  const raizDom = new Nodo('#document');
  let actual = raizDom;
  const tokens = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>|([^<]+)/g;
  for (const [, cierre, tag, attrsTxt, autocierre, texto] of main.matchAll(tokens)) {
    if (texto !== undefined) { actual.appendChild(new Nodo('#text')).texto = texto; continue; }
    const t = tag.toLowerCase();
    if (cierre) {
      for (let n = actual; n; n = n.parent) if (n.tag === t) { actual = n.parent; break; }
      continue;
    }
    const attrs = {};
    for (const [, n, v] of attrsTxt.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) attrs[n] = (v || '').replace(/&amp;/g, '&');
    const nodo = actual.appendChild(new Nodo(t, attrs));
    if (!autocierre && !VACIOS.has(t)) actual = nodo;
  }
  return raizDom;
};

// `new Date()` sin argumentos devuelve `ahora`; con argumentos, como Date.
const relojEn = (ahora) => class extends Date {
  constructor(...args) { super(...(args.length ? args : [ahora])); }
};

const correrEn = (dom, ahora) => {
  vm.runInNewContext(codigo, { document: dom, Date: relojEn(ahora) });
  return dom;
};

// Una página sintética con las fechas dadas, para los casos de borde.
const paginaCon = (fechas) => domDe(`<main><section><ol data-vigencia>${
  fechas.map((f) => `<li data-hasta="${f}"><a class="walink" href="#cotizar">Cotizar</a></li>`).join('')
}</ol><div data-anteriores data-enlace="#consultar" data-etiqueta="Consultar" hidden><h3>Fechas anteriores</h3><ol></ol></div><p data-sin-proximos hidden>x</p></section><aside data-edicion-pasada hidden>nota</aside></main>`);

const hastaDe = (lista) => lista.querySelectorAll('[data-hasta]').map((f) => f.getAttribute('data-hasta'));
const proximasDe = (dom) => hastaDe(dom.querySelector('[data-vigencia]'));
const anterioresDe = (dom) => hastaDe(dom.querySelector('[data-anteriores]'));

// Un reloj en el que ya pasaron todas las fechas de todas las páginas.
const TODO_PASADO = '2027-12-31T12:00:00-03:00';
// Uno anterior a la primera fecha de cada página.
const NADA_PASADO = '2026-10-10T12:00:00-03:00';

// ---------------------------------------------------------------------------
// El script, con fechas sintéticas
// ---------------------------------------------------------------------------
test('vigencia.js: pasa a "anteriores" las filas cuyo último día ya pasó, en orden, y deja las demás', () => {
  const dom = correrEn(paginaCon(['2026-10-16', '2026-10-18', '2026-10-24', '2026-11-06']), '2026-10-20T15:00:00-03:00');
  assert.deepStrictEqual(proximasDe(dom), ['2026-10-24', '2026-11-06']);
  assert.deepStrictEqual(anterioresDe(dom), ['2026-10-16', '2026-10-18']);
  assert.strictEqual(dom.querySelector('[data-anteriores]').hidden, false);
  assert.strictEqual(dom.querySelector('[data-edicion-pasada]').hidden, true, 'queda una fecha próxima: no va la nota');
  assert.strictEqual(dom.querySelector('[data-sin-proximos]').hidden, true);
});

test('vigencia.js: la fila sigue entre las próximas todo su último día', () => {
  const dom = correrEn(paginaCon(['2026-10-24']), '2026-10-24T23:59:00-03:00');
  assert.deepStrictEqual(proximasDe(dom), ['2026-10-24']);
  assert.strictEqual(dom.querySelector('[data-anteriores]').hidden, true);
});

test('vigencia.js: "hoy" es el día en Salta, no en UTC', () => {
  // 02:00 UTC del 25/10 son las 23:00 del 24/10 en Salta: el show del 24 sigue.
  assert.deepStrictEqual(proximasDe(correrEn(paginaCon(['2026-10-24']), '2026-10-25T02:00:00Z')), ['2026-10-24']);
  // 03:00 UTC del 25/10 ya es el 25 en Salta: pasa a anteriores.
  assert.deepStrictEqual(anterioresDe(correrEn(paginaCon(['2026-10-24']), '2026-10-25T03:00:00Z')), ['2026-10-24']);
});

test('vigencia.js: cuando ya pasaron todas, muestra la nota de arriba y el aviso de la sección', () => {
  const dom = correrEn(paginaCon(['2026-10-16', '2026-10-17']), TODO_PASADO);
  assert.deepStrictEqual(proximasDe(dom), []);
  assert.deepStrictEqual(anterioresDe(dom), ['2026-10-16', '2026-10-17']);
  assert.strictEqual(dom.querySelector('[data-edicion-pasada]').hidden, false);
  assert.strictEqual(dom.querySelector('[data-sin-proximos]').hidden, false);
});

test('vigencia.js: una fecha mal escrita cuenta como próxima', () => {
  const dom = correrEn(paginaCon(['24/10/2026', '', '2026-10-1']), '2027-06-01T12:00:00-03:00');
  assert.strictEqual(proximasDe(dom).length, 3);
  assert.strictEqual(dom.querySelector('[data-edicion-pasada]').hidden, true);
});

test('vigencia.js: la fila pasada cotiza la próxima edición, no su fecha', () => {
  const dom = correrEn(paginaCon(['2026-10-16']), TODO_PASADO);
  const fila = dom.querySelector('[data-hasta]');
  assert.ok(fila.classList.contains('fila-pasada'));
  const enlace = fila.querySelector('a.walink');
  assert.strictEqual(enlace.getAttribute('href'), '#consultar');
  assert.strictEqual(enlace.textContent, 'Consultar');
});

test('vigencia.js: nunca esconde por antigüedad (ni hidden ni display:none en el código)', () => {
  const sinComentariosJs = codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(sinComentariosJs, /\.hidden\s*=\s*true/);
  assert.doesNotMatch(sinComentariosJs, /display|\.style\b|removeChild|\.remove\(/);
});

test('CSS: ninguna regla esconde filas fechadas ni filas pasadas', () => {
  for (const hoja of ['charter.css', 'eventos.css']) {
    const css = fs.readFileSync(path.join(raiz, 'css', hoja), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, selector, cuerpo] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/display\s*:\s*none|visibility\s*:\s*hidden/.test(cuerpo)) continue;
      assert.doesNotMatch(selector, /\bli\b|fila-pasada|data-hasta/,
        `${hoja}: "${selector.trim()}" esconde filas fechadas`);
    }
  }
});

// ---------------------------------------------------------------------------
// Las páginas reales
// ---------------------------------------------------------------------------
for (const nombre of CON_VIGENCIA) {
  const html = paginas[nombre];
  const ingles = esIngles(nombre);
  const esEvento = EVENTOS.includes(nombre);
  const filasServidas = [...sinComentarios(html).matchAll(/<li data-hasta="([^"]*)"([^>]*)>/g)];

  test(`${nombre}: el HTML servido tiene todas las filas, ninguna escondida`, () => {
    assert.ok(filasServidas.length >= 3, 'la lista de fechas quedó casi vacía');
    for (const [, hasta, resto] of filasServidas) {
      assert.doesNotMatch(resto, /\bhidden\b|style=/, `la fila ${hasta} viene escondida en el HTML`);
    }
    const dom = domDe(html);
    assert.strictEqual(proximasDe(dom).length, filasServidas.length, 'hay filas fechadas fuera de la lista principal');
    const bloque = dom.querySelector('[data-anteriores]');
    assert.ok(bloque, 'falta el bloque de fechas anteriores');
    assert.strictEqual(bloque.hidden, true, 'sin fechas pasadas, el bloque de anteriores va oculto');
    assert.strictEqual(bloque.querySelectorAll('li').length, 0, 'el bloque de anteriores se sirve vacío');
    assert.strictEqual(bloque.querySelector('h3').textContent.trim(), ingles ? 'Past dates' : 'Fechas anteriores');
    assert.match(bloque.getAttribute('data-enlace'), /^https:\/\/wa\.me\/5493875269009\?text=/);
  });

  test(`${nombre}: con el reloj en 2027 las filas pasadas siguen en la página, visibles y en "anteriores"`, () => {
    const dom = correrEn(domDe(html), TODO_PASADO);
    const todas = dom.querySelectorAll('[data-hasta]');
    assert.strictEqual(todas.length, filasServidas.length, 'el script sacó filas de la página');
    assert.deepStrictEqual(anterioresDe(dom), filasServidas.map(([, h]) => h), 'las filas pasadas no quedaron en orden en anteriores');
    for (const fila of todas) {
      assert.strictEqual(fila.hidden, false, `la fila ${fila.getAttribute('data-hasta')} quedó con hidden`);
      assert.deepStrictEqual(fila.style, {}, `la fila ${fila.getAttribute('data-hasta')} quedó con estilo en línea`);
      assert.ok(fila.classList.contains('fila-pasada'));
      for (let n = fila; n; n = n.parent) assert.strictEqual(n.hidden, false, `un contenedor de la fila ${fila.getAttribute('data-hasta')} quedó oculto`);
    }
    assert.strictEqual(dom.querySelector('[data-anteriores]').hidden, false);
  });

  test(`${nombre}: antes de la primera fecha no cambia nada`, () => {
    const dom = correrEn(domDe(html), NADA_PASADO);
    assert.strictEqual(proximasDe(dom).length, filasServidas.length);
    assert.strictEqual(dom.querySelector('[data-anteriores]').hidden, true);
    const nota = dom.querySelector('[data-edicion-pasada]');
    if (nota) assert.strictEqual(nota.hidden, true);
  });

  if (esEvento) {
    test(`${nombre}: la nota de edición pasada va arriba, una sola vez, y aparece cuando pasaron todas las fechas`, () => {
      const visible = sinComentarios(html);
      assert.strictEqual((visible.match(/data-edicion-pasada/g) || []).length, 1);
      assert.match(visible, /<main>\s*<aside class="edicion-pasada" data-edicion-pasada hidden/, 'la nota no es lo primero del <main>');
      const nota = domDe(html).querySelector('[data-edicion-pasada]');
      const texto = nota.textContent.replace(/\s+/g, ' ');
      assert.ok(texto.includes(ingles
        ? 'This edition has passed. Ask us about the next edition or about transfers to similar events.'
        : 'Esta edición ya pasó. Consúltenos por la próxima edición o por traslados a eventos similares.'), texto);
      const enlaces = nota.querySelectorAll('a').map((a) => a.getAttribute('href'));
      assert.ok(enlaces.some((h) => h.startsWith('https://wa.me/5493875269009?text=')), 'la nota no tiene WhatsApp');
      assert.ok(enlaces.some((h) => h.startsWith(ingles ? 'mailto:contacto@lausof.com?cc=transporte@lausof.com&subject=' : 'mailto:contacto@lausof.com')),
        'la nota no tiene el correo con el formato de la página');

      const antes = correrEn(domDe(html), NADA_PASADO).querySelector('[data-edicion-pasada]');
      assert.strictEqual(antes.hidden, true);
      // Con la última fecha todavía por delante, la nota sigue oculta.
      const ultima = filasServidas[filasServidas.length - 1][1];
      const vispera = correrEn(domDe(html), `${ultima}T12:00:00-03:00`).querySelector('[data-edicion-pasada]');
      assert.strictEqual(vispera.hidden, true);
      const despues = correrEn(domDe(html), TODO_PASADO).querySelector('[data-edicion-pasada]');
      assert.strictEqual(despues.hidden, false);
    });
  } else {
    test(`${nombre}: cuando pasaron todas las fechas aparece el aviso de la sección`, () => {
      assert.ok(!sinComentarios(html).includes('data-edicion-pasada'), 'la nota de edición es sólo para páginas de evento');
      assert.strictEqual(correrEn(domDe(html), TODO_PASADO).querySelector('[data-sin-proximos]').hidden, false);
    });
  }

  test(`${nombre}: el texto de las fechas pasadas no dice que Lausof llevó pasajeros`, () => {
    const dom = domDe(html);
    const nota = dom.querySelector('[data-edicion-pasada]');
    const bloque = dom.querySelector('[data-anteriores]');
    const texto = [nota ? nota.textContent : '', bloque.textContent, bloque.getAttribute('data-etiqueta')].join(' ');
    assert.doesNotMatch(texto, ingles ? /\b(we (took|carried|drove|transported)|carried|passengers)\b/i : /\b(llevamos|trasladamos|transportamos|pasajeros)\b/i);
  });
}
