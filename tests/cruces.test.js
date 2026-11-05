// Enlaces entre las dos secciones del sitio (estructura aprobada el 05/11/2026,
// opción A: web/estructura-sitio-2026-11-05/3a-diseno-estructura.md §3.4).
//
//   T1  Las páginas de turismo nunca muestran ni enlazan cargas, cadena de
//       frío, depósito ni autoelevadores: ni enlaces fuera del menú, ni
//       fotos, ni un prefill de carga.
//   T2  Las páginas de turismo llegan a las de empresas sólo por el menú y por
//       un enlace del pie al hub de empresas. Las únicas excepciones son las
//       de PERMITIDOS, cada una con su motivo.
//   B1  Cada página de empresas lleva un enlace del pie al hub de turismo.
//   B2  Minería y cargas se enlazan entre sí.
//
// La sección y la línea de cada página (la que enlaza y la enlazada) salen de
// su <body> (data-seccion, data-linea), que escribe scripts/menu.mjs. Así una
// página nueva queda cubierta sin tocar este archivo. El enlace del pie es la
// zona GENERADO:CRUCE, que también arma scripts/menu.mjs.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sinComentarios } = require('./util.js');

const atributo = (html, k) => {
  const body = (html.match(/<body([^>]*)>/) || [])[1] || '';
  return (body.match(new RegExp(`\\b${k}="([^"]*)"`)) || [])[1];
};
const seccion = (nombre) => atributo(paginas[nombre], 'data-seccion');
const linea = (nombre) => atributo(paginas[nombre], 'data-linea');
const idiomaDe = (nombre) => (nombre.startsWith('en/') ? 'en' : nombre.startsWith('pt/') ? 'pt' : 'es');

// La página del sitio a la que lleva un href, o null si es externo, de
// contacto o un ancla de la misma página.
const archivoDe = (href) => {
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  let ruta = href.split(/[?#]/)[0].slice(1);
  if (ruta === '' || ruta.endsWith('/')) ruta += 'index.html';
  return paginas[ruta] ? ruta : null;
};

const zonaRe = (nombre) => new RegExp(`<!-- GENERADO:${nombre}[\\s\\S]*?<!-- \\/GENERADO:${nombre} -->`, 'g');
const zonas = (html, nombre) => html.match(zonaRe(nombre)) || [];
// La página sin el menú ni el enlace del pie (los dos caminos permitidos por
// T2) y sin comentarios.
const cuerpo = (html) => sinComentarios(html.replace(zonaRe('MENU'), '').replace(zonaRe('CRUCE'), ''));
const destinos = (html) => [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)]
  .map((m) => archivoDe(m[1])).filter(Boolean);

const paginasDe = (s) => Object.keys(paginas).filter((n) => seccion(n) === s);
const turismo = paginasDe('turismo');
const empresas = paginasDe('empresas');
const cargas = empresas.filter((n) => linea(n) === 'cargas');

// T2: enlaces de cuerpo de turismo a empresas que el diseño acepta (3a §3.4).
const PERMITIDOS = [
  // San Antonio de los Cobres es un pueblo minero.
  ['traslado-salta-san-antonio-de-los-cobres.html', 'logistica-minera.html'],
  ['en/salta-to-san-antonio-de-los-cobres.html', 'en/mining-logistics.html'],
  // Las agencias contratan traslados corporativos.
  ['agencias-y-hoteles.html', 'traslados-empresas.html'],
];

// Tipos de prefill de carga (scripts/prefill.mjs, TIPOS) y fotos de carga.
const PREFILL_CARGA = ['carga', 'refrigerado', 'deposito', 'autoelevador'];
const FOTO_CARGA = /\/assets\/(?:galeria\/)?[^"'\s,)]*(?:refrigerad|carga|autoelevador|deposito)/i;

// Hub de cada sección por idioma. El sitio en portugués es sólo turismo: sus
// páginas llevan al hub de empresas en español.
const HUB = {
  turismo: { es: 'turismo.html', en: 'en/tours-and-transfers.html', pt: 'pt/passeios-e-traslados.html' },
  empresas: { es: 'empresas-y-mineria.html', en: 'en/business-and-mining.html', pt: 'empresas-y-mineria.html' },
};
const MINERIA = { es: 'logistica-minera.html', en: 'en/mining-logistics.html' };

test('las secciones se leen de <body>: hay páginas de turismo, de empresas y de cargas', () => {
  assert.ok(turismo.length >= 50, `sólo ${turismo.length} páginas de turismo`);
  assert.ok(empresas.length >= 16, `sólo ${empresas.length} páginas de empresas`);
  assert.strictEqual(cargas.length, 5);
});

test('T1: ninguna página de turismo enlaza, muestra o prefija cargas fuera del menú', () => {
  for (const nombre of turismo) {
    const html = cuerpo(paginas[nombre]);
    for (const destino of destinos(html)) {
      assert.notStrictEqual(linea(destino), 'cargas', `${nombre} enlaza la página de cargas ${destino}`);
    }
    assert.ok(!PREFILL_CARGA.includes(atributo(paginas[nombre], 'data-tipo')), `${nombre}: prefill de carga en <body>`);
    for (const [, tipo] of html.matchAll(/\bdata-prefill="([^"]+)"/g)) {
      assert.ok(!PREFILL_CARGA.includes(tipo), `${nombre}: un contacto con prefill de carga (${tipo})`);
    }
    const foto = html.match(FOTO_CARGA);
    assert.strictEqual(foto, null, `${nombre} muestra una foto de carga: ${foto && foto[0]}`);
  }
});

test('T2: turismo enlaza empresas sólo por el menú, el pie o una excepción del diseño', () => {
  const permitido = (origen, destino) => PERMITIDOS.some(([o, d]) => o === origen && d === destino);
  for (const nombre of turismo) {
    for (const destino of destinos(cuerpo(paginas[nombre]))) {
      if (seccion(destino) !== 'empresas') continue;
      assert.ok(permitido(nombre, destino), `${nombre} enlaza la página de empresas ${destino} fuera del menú y del pie`);
    }
  }
  // Las excepciones siguen vivas: si una se cae, sale de la lista.
  for (const [origen, destino] of PERMITIDOS) {
    assert.strictEqual(seccion(origen), 'turismo', `${origen} ya no es de turismo`);
    assert.strictEqual(seccion(destino), 'empresas', `${destino} ya no es de empresas`);
    assert.ok(destinos(cuerpo(paginas[origen])).includes(destino), `${origen} ya no enlaza ${destino}: sacarlo de PERMITIDOS`);
  }
});

test('T2 y B1: cada página de turismo y de empresas lleva en el pie un solo enlace al hub de la otra sección', () => {
  for (const nombre of [...turismo, ...empresas]) {
    const html = paginas[nombre];
    const zona = zonas(html, 'CRUCE');
    assert.strictEqual(zona.length, 1, `${nombre}: sin la zona GENERADO:CRUCE (correr node scripts/menu.mjs)`);
    const pie = (html.match(/<footer\b[\s\S]*?<\/footer>/) || [''])[0];
    assert.ok(pie.includes(zona[0]), `${nombre}: el enlace a la otra sección tiene que ir en el pie`);
    const otra = seccion(nombre) === 'turismo' ? 'empresas' : 'turismo';
    const enlaces = destinos(zona[0]);
    assert.deepStrictEqual(enlaces, [HUB[otra][idiomaDe(nombre)]], `${nombre}: el pie enlaza ${enlaces.join(', ')}`);
    if (idiomaDe(nombre) === 'pt') assert.match(zona[0], /hreflang="es"/, `${nombre}: el hub en español sin hreflang="es"`);
  }
  for (const nombre of Object.keys(paginas).filter((n) => !turismo.includes(n) && !empresas.includes(n))) {
    assert.strictEqual(zonas(paginas[nombre], 'CRUCE').length, 0, `${nombre} (${seccion(nombre)}) no lleva enlace de cruce`);
  }
});

test('B2: minería enlaza cargas refrigeradas, y cada página de cargas enlaza el hub y logística minera', () => {
  for (const [idioma, mineria] of Object.entries(MINERIA)) {
    const refrigeradas = cargas.find((n) => idiomaDe(n) === idioma && /refrigera/.test(n));
    assert.ok(destinos(cuerpo(paginas[mineria])).includes(refrigeradas), `${mineria} no enlaza ${refrigeradas}`);
  }
  for (const nombre of cargas) {
    const idioma = idiomaDe(nombre);
    const enlaces = destinos(cuerpo(paginas[nombre]));
    assert.ok(enlaces.includes(HUB.empresas[idioma]), `${nombre} no enlaza el hub ${HUB.empresas[idioma]}`);
    assert.ok(enlaces.includes(MINERIA[idioma]), `${nombre} no enlaza ${MINERIA[idioma]}`);
  }
});
