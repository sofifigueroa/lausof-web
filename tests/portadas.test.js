// Las tres portadas desde el 05/11/2026 (estructura aprobada, opción A:
// web/estructura-sitio-2026-11-05/3a-diseno-estructura.md §3.1, textos de
// 4-textos.md §1, decisiones b, c y d de DECISION-2026-11-05.md):
//   · un H1 con un solo propósito, el transporte de pasajeros, sin cargas;
//   · tres puertas en la primera pantalla, en el orden decidido: Turismo y
//     traslados · Personal para minería · Cargas (b), con la etiqueta
//     «Cargas» (c);
//   · la barra de afirmaciones debajo, sin cantidades de unidades;
//   · sin la fila de 13 servicios especiales ni las cinco tarjetas;
//   · el texto nuevo en registro impersonal (d).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sinComentarios } = require('./util.js');

const PORTADAS = {
  'index.html': {
    h1: 'Transporte de pasajeros en Salta y el norte argentino',
    puertas: [
      ['Turismo y traslados', '/turismo.html', 'turismo'],
      ['Personal para minería', '/empresas-y-mineria.html#personal', 'personal'],
      ['Cargas', '/empresas-y-mineria.html#cargas', 'carga'],
    ],
    prueba: ['24 h', 'CNRT 60284', 'AMT', 'Agencia de turismo habilitada', 'Viajes internacionales', 'Factura A', 'Flota y taller propios'],
  },
  'en/index.html': {
    h1: 'Passenger transport in Salta and northwest Argentina',
    puertas: [
      ['Tours &amp; transfers', '/en/tours-and-transfers.html', 'turismo'],
      ['Mining crew transport', '/en/business-and-mining.html#crew', 'personal'],
      ['Freight', '/en/business-and-mining.html#freight', 'carga'],
    ],
    prueba: ['24/7', 'CNRT 60284', 'AMT', 'Licensed travel agency', 'International trips', 'Invoice type A', 'Own fleet and workshop'],
  },
  'pt/index.html': {
    h1: 'Transporte de passageiros em Salta e no norte da Argentina',
    puertas: [
      ['Passeios e traslados', '/pt/passeios-e-traslados.html', 'turismo'],
      ['Pessoal para mineração', '/empresas-y-mineria.html#personal', 'personal'],
      ['Cargas', '/empresas-y-mineria.html#cargas', 'carga'],
    ],
    prueba: ['24 h', 'CNRT 60284', 'AMT', 'Agência de viagens habilitada', 'Viagens internacionais', 'Factura A', 'Frota e oficina próprias'],
  },
};

const tramo = (html, desde, hasta) => {
  const i = html.indexOf(desde);
  assert.ok(i > -1, `no está ${desde}`);
  const j = html.indexOf(hasta, i);
  return html.slice(i, j > -1 ? j : undefined);
};
const puertasDe = (html) => [...tramo(html, '<section class="puertas"', '</section>')
  .matchAll(/<article class="puerta">([\s\S]*?)<\/article>/g)].map((m) => m[1]);
// Todo lo que el rediseño escribió: hero, puertas, barra, menú y columnas del pie.
const bloquesNuevos = (html) => [
  tramo(html, '<section class="hero"', '</section>'),
  tramo(html, '<section class="puertas"', '</section>'),
  tramo(html, '<div class="certs prueba"', '</div>\n  </div>'),
  tramo(html, '<!-- GENERADO:MENU', '<!-- /GENERADO:MENU -->'),
  tramo(html, '<!-- GENERADO:PIE', '<!-- /GENERADO:PIE -->'),
].map(sinComentarios).join('\n');
const visible = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

for (const [nombre, esperado] of Object.entries(PORTADAS)) {
  const html = paginas[nombre];

  test(`${nombre}: un solo H1, sobre el transporte de pasajeros y sin cargas`, () => {
    const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1]);
    assert.deepStrictEqual(h1s, [esperado.h1]);
    assert.doesNotMatch(h1s[0], /carga|freight|refrigerad|frío|frio/i);
  });

  test(`${nombre}: tres puertas en el orden decidido, cada una a su sección y con su WhatsApp`, () => {
    const puertas = puertasDe(html);
    assert.strictEqual(puertas.length, 3);
    puertas.forEach((puerta, i) => {
      const [titulo, href, tipo] = esperado.puertas[i];
      const h2 = puerta.match(/<h2><a href="([^"]*)"[^>]*>([^<]*)<\/a><\/h2>/);
      assert.ok(h2, `puerta ${i + 1} sin título enlazado`);
      assert.strictEqual(h2[2], titulo, `puerta ${i + 1}: título`);
      assert.strictEqual(h2[1], href, `puerta ${i + 1}: destino`);
      assert.match(puerta, new RegExp(`class="btn btn-sm btn-puerta" href="${href.replace(/[.]/g, '\\.')}"`), `puerta ${i + 1}: botón`);
      assert.match(puerta, new RegExp(`data-prefill="${tipo}" href="https://wa\\.me/5493875269009\\?text=`), `puerta ${i + 1}: WhatsApp de ${tipo}`);
    });
  });

  test(`${nombre}: las puertas quedan arriba, antes de la barra y de todo lo demás`, () => {
    const orden = ['<section class="hero"', '<section class="puertas"', '<div class="certs prueba"', 'class="block why"'];
    const posiciones = orden.map((marca) => html.indexOf(marca));
    assert.ok(posiciones.every((p) => p > -1), `falta un bloque: ${orden.filter((m, i) => posiciones[i] < 0)}`);
    assert.deepStrictEqual([...posiciones].sort((a, b) => a - b), posiciones, 'el orden de los bloques cambió');
  });

  test(`${nombre}: la barra de afirmaciones del diseño, sin cantidades de unidades`, () => {
    const barra = tramo(html, '<div class="certs prueba"', '</div>\n  </div>');
    const items = [...barra.matchAll(/<span>([^<]*)<\/span>/g)].map((m) => m[1]);
    assert.deepStrictEqual(items, esperado.prueba);
  });

  test(`${nombre}: sin las cinco tarjetas ni la fila de servicios especiales`, () => {
    const main = tramo(html, '<main>', '</main>');
    assert.doesNotMatch(main, /swipe-hint|class="cards/);
    // Las páginas de empresas se enlazan en el cuerpo sólo desde sus puertas.
    const fuera = main.replace(tramo(html, '<section class="puertas"', '</section>'), '');
    for (const pagina of ['golf-torneos', 'clubes-deportivos', 'cargas-refrigeradas', 'alquiler-autoelevadores',
      'deposito-galpon', 'producciones', 'logistica-minera', 'transporte-de-personal', 'refrigerated-freight', 'warehouse']) {
      assert.doesNotMatch(fuera, new RegExp(`href="/(?:en/)?${pagina}\\.html"`), `${pagina} enlazada fuera de las puertas`);
    }
  });

  test(`${nombre}: nada vedado en los bloques nuevos`, () => {
    const texto = visible(bloquesNuevos(html));
    // Ningún número salvo los publicados: CNRT, el año, las 24 h, la línea y 4x4.
    const numeros = (texto.match(/\d[\d.,/]*/g) || []).filter((n) => !['60284', '2010', '24', '24/7', '387', '526-9009', '4', '4x4'].includes(n));
    assert.deepStrictEqual(numeros.filter((n) => !/^(526|9009)$/.test(n)), [], 'números que no están en la lista de publicados');
    assert.doesNotMatch(texto, /\$|\bUSD\b|\bARS\b|precio|price|preço/i, 'precios');
    assert.doesNotMatch(texto, /gr[uú]a|remolque|auxilio|\btow|sin chofer|self-drive|rent a car|izaje/i, 'servicios retirados');
    assert.doesNotMatch(texto, /asegurador|insurer|seguradora/i, 'aseguradora');
    assert.doesNotMatch(texto, /\b(Rio Tinto|Arcadium|Livent|Allkem|Ganfeng|Eramet|Galan|Zijin|POSCO|Fortescue|Glencore|Minera Exar)\b/i, 'clientes');
    const telefonos = [...bloquesNuevos(html).matchAll(/(?:tel:|wa\.me\/)\+?(\d+)/g)].map((m) => m[1]);
    assert.ok(telefonos.every((t) => t === '5493875269009'), `otro teléfono: ${telefonos}`);
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      assert.doesNotMatch(json, /"@type":\s*"(Event|Review|AggregateRating)"/, 'marcado de eventos o reseñas');
    }
  });
}

test('index.html y pt/index.html: la tercera línea se llama «Cargas», en la puerta y en el menú', () => {
  for (const nombre of ['index.html', 'pt/index.html']) {
    assert.match(puertasDe(paginas[nombre])[2], /<h2><a [^>]*>Cargas<\/a><\/h2>/);
  }
  assert.match(tramo(paginas['index.html'], '<!-- GENERADO:MENU', '<!-- /GENERADO:MENU -->'), /<p class="menu-col-titulo">Cargas<\/p>/);
  assert.match(tramo(paginas['en/index.html'], '<!-- GENERADO:MENU', '<!-- /GENERADO:MENU -->'), /<p class="menu-col-titulo">Freight<\/p>/);
});

test('pt/index.html: las puertas de empresas van al hub en español y lo dicen', () => {
  const [, personal, cargas] = puertasDe(paginas['pt/index.html']);
  for (const puerta of [personal, cargas]) {
    assert.match(puerta, /<h2><a href="\/empresas-y-mineria\.html#[a-z]+" hreflang="es">/);
    assert.match(puerta, />Ver em espanhol<\/a>/);
    assert.doesNotMatch(puerta, /class="puerta-sub"/, 'el sitio en portugués no lista subpáginas de empresas');
  }
});

// Decisión d (05/11/2026): las páginas viejas siguen en voseo; el texto nuevo
// va impersonal, sin segunda persona (ni vos, ni tú, ni usted).
test('index.html: el texto nuevo va en registro impersonal', () => {
  const texto = visible(bloquesNuevos(paginas['index.html']));
  const m = texto.match(/\b(vos|tú|tu|tus|te|usted|cotizá|escribinos|llamanos|consultá|contanos|tenés|querés|podés|mirá|deslizá|cotiza|escribe|llama|consulta)\b/i);
  assert.ok(!m, `segunda persona en el texto nuevo: "${m && m[0]}"`);
});
