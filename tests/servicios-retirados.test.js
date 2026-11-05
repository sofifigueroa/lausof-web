// Servicios retirados del sitio (04/11/2026, decisión de Lautaro).
//
// 1. Grúa y remolque (opción A). La grúa de plancha (el Accelo 1016) se vendió
//    y el remolque para particulares dejó de ofrecerse. Salieron
//    grua-salta.html y en/tow-truck-salta.html (301 a la portada de su
//    idioma), la tarjeta de auxilio de las tres portadas con su llamada 24 hs,
//    la fila del camión plancha de la flota y todo lo que la grúa sostenía:
//    "grúa de plancha hidráulica", "trabajamos para aseguradoras", los 7,5 t
//    de carga del Accelo y cualquier "grúa propia". Lo que queda es el
//    traslado de vehículos para empresas y mineras: se cotiza a pedido y lo
//    coordina Lausof, sin camión propio, sin 24 hs y sin nombrar a nadie.
// 2. 4x4 sin chofer para turistas (opción D): lo vigila
//    tests/alquiler-mineria.test.js.
//
// Estas guardias miran el texto VISIBLE y los datos estructurados de todas
// las páginas (ES, EN y PT): los comentarios del HTML pueden contar la
// historia, el visitante y los buscadores no.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, pares, paresPt, sitemap, redirects, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const RETIRADAS = { 'grua-salta.html': '/', 'en/tow-truck-salta.html': '/en/' };

const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

// Lo que se ve en la página y lo que dicen sus metas (título, descripción,
// og:*, alt): todo lo que lee una persona o un buscador.
const leible = (html) => {
  const atributos = [...sinComentarios(html).matchAll(/\b(?:content|alt|aria-label|title)="([^"]*)"/g)].map((m) => m[1]);
  return `${visible(html)} ${atributos.join(' ')}`;
};

const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]).join('\n');

// Afirmaciones que no pueden volver, en los tres idiomas.
const VEDADAS = [
  ['plancha', /plancha/i],
  ['grúa (servicio o unidad)', /\bgr[uú]as?\b/i],
  ['remolque / remolcar', /\bremolc|\bremolques?\b/i],
  ['aseguradoras', /aseguradora|\binsurers?\b|seguradora/i],
  ['7,5 t del Accelo', /7[,.]5\s?(?:t\b|-?ton|toneladas)/i],
  ['tow / towing / tow truck', /\btow(?:ing|s|ed)?\b|tow truck/i],
  ['flatbed', /flatbed/i],
  ['roadside assistance', /roadside assistance|roadside recovery/i],
  ['guincho / reboque', /guincho|reboque/i],
  ['auxilio en ruta 24 hs', /auxilio (?:mecánico )?(?:en ruta )?(?:las )?24|urgencias 24|24-hour on-call|socorro na estrada|emergências 24/i],
];

for (const [nombre, html] of Object.entries(paginas)) {
  test(`${nombre}: sin grúa, remolque, plancha, aseguradoras ni 7,5 t (texto, metas y JSON-LD)`, () => {
    const texto = `${leible(html)} ${jsonLd(html)}`;
    for (const [etiqueta, patron] of VEDADAS) {
      const m = texto.match(patron);
      assert.ok(!m, `${nombre}: volvió "${etiqueta}": «${m && texto.slice(Math.max(0, m.index - 60), m.index + 60)}»`);
    }
  });

  test(`${nombre}: ningún enlace a las páginas de grúa retiradas`, () => {
    for (const retirada of Object.keys(RETIRADAS)) {
      const ruta = `/${retirada}`;
      const sinExt = ruta.replace(/\.html$/, '');
      assert.ok(!new RegExp(`href="(?:https://www\\.lausof\\.com)?${sinExt.replace(/[./-]/g, '\\$&')}(?:\\.html)?(?:[#?"])`).test(html),
        `${nombre} enlaza ${ruta}`);
    }
  });
}

test('las páginas de grúa ya no existen, ni en el sitemap, ni en los pares de idiomas', () => {
  for (const retirada of Object.keys(RETIRADAS)) {
    assert.ok(!fs.existsSync(path.join(raiz, retirada)), `volvió ${retirada}`);
    assert.ok(!sitemap.includes(`/${retirada}`), `${retirada} sigue en el sitemap`);
    assert.ok(!Object.keys(pares).includes(retirada) && !Object.values(pares).includes(retirada), `${retirada} sigue en pares`);
    assert.ok(!Object.values(paresPt).includes(retirada), `${retirada} sigue en paresPt`);
  }
});

// 301! a la portada de su idioma, con y sin .html, en un solo salto. Las de
// /en/ van antes del comodín /en/* (que si no las devuelve como 404).
test('las páginas de grúa redirigen con 301! a la portada de su idioma, antes del comodín /en/*', () => {
  const reglas = redirects.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/));
  const comodin = reglas.findIndex(([o]) => o === '/en/*');
  assert.ok(comodin > -1);
  for (const [retirada, destino] of Object.entries(RETIRADAS)) {
    for (const origen of [`/${retirada}`, `/${retirada.replace(/\.html$/, '')}`]) {
      const i = reglas.findIndex(([o]) => o === origen);
      assert.ok(i > -1, `falta la regla de ${origen}`);
      assert.deepStrictEqual(reglas[i].slice(1), [destino, '301!'], `${origen} no va a ${destino} con 301!`);
      if (origen.startsWith('/en/')) assert.ok(i < comodin, `${origen} queda detrás del comodín /en/*`);
      // Un solo salto: el destino no vuelve a redirigir.
      assert.ok(!reglas.some(([o]) => o === destino), `el destino ${destino} vuelve a redirigir`);
    }
  }
});

test('las portadas ya no ofrecen auxilio ni remolque en su catálogo de servicios', () => {
  for (const portada of ['index.html', 'en/index.html', 'pt/index.html']) {
    const datos = jsonLd(paginas[portada]);
    assert.doesNotMatch(datos, /auxilio mecánico y remolques|towing|socorro mecânico e reboque|rescate y traslado de vehículos/i,
      `${portada}: el catálogo todavía ofrece la grúa`);
    assert.doesNotMatch(datos, /auxilio-5-ruta/, `${portada}: la ficha todavía muestra la foto de la grúa`);
  }
});

// Las fotos de la grúa rotulada «AUXILIO» no vuelven a ninguna página. El
// encabezado de logística minera (ES y EN) la usó hasta el 05/11/2026
// (7-auditoria-build.md, nota 8); ahora lleva el minibús de personal.
test('ninguna página muestra las fotos de la grúa', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.doesNotMatch(sinComentarios(html), /\/assets\/(?:mineria-tractor|auxilio-\d)/,
      `${nombre}: muestra una foto de la grúa`);
  }
});

// El cierre de las portadas habla de pasajeros (5d85b85) y no ofrece llevar
// un vehículo: al turista con el auto roto eso le suena a remolque. El PT se
// quedó con el título viejo hasta el 05/11/2026 (7b-revision-pt.md, B1).
test('el cierre de las tres portadas no ofrece transportar un vehículo', () => {
  const cierres = {
    'index.html': '¿Tenés un viaje, un grupo o un equipo para trasladar?',
    'en/index.html': 'A trip, a group or a crew to move?',
    'pt/index.html': 'Tem uma viagem, um grupo ou uma equipe para transportar?',
  };
  for (const [portada, titulo] of Object.entries(cierres)) {
    const cierre = sinComentarios(paginas[portada]).match(/<section class="block cta-final">([\s\S]*?)<\/section>/);
    assert.ok(cierre, `${portada}: falta el cierre`);
    const h2 = visible(cierre[1].match(/<h2>([\s\S]*?)<\/h2>/)[1]).trim();
    assert.strictEqual(h2, titulo, `${portada}: título del cierre`);
    assert.doesNotMatch(visible(cierre[1]), /veh[ií]cul|vehicle/i, `${portada}: el cierre ofrece llevar un vehículo`);
  }
});

// Lo que queda: el traslado de vehículos para empresas y mineras, cotizado a
// pedido y coordinado por Lausof, en las páginas de minería, cargas y empresas.
const TRASLADO = {
  'logistica-minera.html': /Traslado de vehículos para empresas y mineras: lo coordinamos nosotros y se cotiza a pedido/,
  'en/mining-logistics.html': /Vehicle transfers for companies and mining operations, coordinated by us and quoted on request/,
  'transporte-de-personal-obras-de-litio.html': /coordinamos el traslado de vehículos para empresas y mineras, que se cotiza a pedido/,
  'en/crew-transport-lithium-projects.html': /coordinate vehicle transfers for companies and mining operations, quoted on request/,
  'cargas-refrigeradas.html': /Para empresas y mineras también coordinamos el traslado de vehículos, que se cotiza a pedido/,
  'en/refrigerated-freight.html': /For companies and mining operations we also coordinate vehicle transfers, quoted on request/,
  'traslados-empresas.html': /Coordinamos el traslado de vehículos para empresas y mineras, que se cotiza a pedido/,
  'transporte-de-personal.html': /Coordinamos el traslado de vehículos para empresas y mineras, que se cotiza a pedido/,
  'en/personnel-transport.html': /We coordinate vehicle transfers for companies and mining operations, quoted on request/,
};

test('minería, cargas y empresas ofrecen el traslado de vehículos a pedido', () => {
  for (const [nombre, frase] of Object.entries(TRASLADO)) {
    assert.match(visible(paginas[nombre]), frase, `${nombre}: falta el traslado de vehículos`);
  }
});

// Ese traslado no promete camión propio ni 24 hs, y no nombra a quien lo hace.
// Se mira cada oración de cada bloque (párrafo, ítem, celda) por separado.
const oraciones = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .split(/<\/?(?:p|li|h[1-6]|div|td|th|summary|figcaption)\b[^>]*>/i)
  .map((b) => b.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
  .filter(Boolean)
  .flatMap((b) => b.split(/(?<=[.!?])\s+/));

test('el traslado de vehículos no promete unidad propia ni guardia 24 hs', () => {
  for (const nombre of Object.keys(TRASLADO)) {
    for (const oracion of oraciones(paginas[nombre])) {
      if (!/traslado de vehículos|vehicle transfers/i.test(oracion)) continue;
      assert.doesNotMatch(oracion, /24|propi[oa]s?\b|our own|nuestr[oa] (?:camión|unidad)/i, `${nombre}: «${oracion}»`);
    }
  }
});
