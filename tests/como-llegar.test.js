// "Cómo llegar" / "How to get there" (03/11/2026,
// ~/lausof/web/seo-deep-2026-11-03/C-authority-local-ai.md §3.4): cada página
// de ruta abre con un bloque de respuesta extraíble para "cómo ir de Salta a
// X": distancia, tiempo, camino y las opciones (colectivo, excursión,
// traslado privado con Lausof). ChatGPT respondía esas preguntas citando
// Rome2Rio y las empresas de colectivos; el bloque pone a Lausof como una
// opción honesta entre las reales. Y las páginas en sentido inverso (San
// Pedro de Atacama → Salta, Uyuni → Salta), que responden la búsqueda del
// viajero que está del otro lado de la frontera (E-languages-markets.md §4).
//
// Lo que se vigila: que el bloque exista en TODAS las páginas de ruta, arriba
// (es la primera sección después de la navegación de la página) y en texto
// visible, con las cifras que la propia página sostiene más abajo, con su
// fuente fechada, sin precios ni marcado de preguntas; y que las páginas
// inversas estén cableadas (pares, hub, ida ↔ vuelta, sitemap, 301).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, pares, sitemap, redirects, urlDe, rutaDe, sinComentarios } = require('./util.js');

// Páginas de ruta ES → EN. Una ruta nueva entra acá y en el mapa de pares.
const RUTAS = {
  'traslado-salta-cafayate.html': 'en/salta-to-cafayate-transfer.html',
  'traslado-salta-cachi.html': 'en/salta-to-cachi-transfer.html',
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'en/salta-to-purmamarca-tilcara-humahuaca.html',
  'traslado-salta-san-antonio-de-los-cobres.html': 'en/salta-to-san-antonio-de-los-cobres.html',
  'salinas-grandes-desde-salta.html': 'en/salinas-grandes-from-salta.html',
  'traslado-aeropuerto-salta.html': 'en/salta-airport-transfer.html',
  'traslado-salta-san-pedro-de-atacama.html': 'en/salta-to-san-pedro-de-atacama.html',
  'traslado-salta-uyuni.html': 'en/salta-to-uyuni.html',
  'traslado-san-pedro-de-atacama-salta.html': 'en/san-pedro-de-atacama-to-salta.html',
  'traslado-uyuni-salta.html': 'en/uyuni-to-salta.html',
  'traslado-salta-jujuy.html': 'en/salta-to-jujuy-transfer.html',
};
// Ida → vuelta.
const INVERSAS = {
  'traslado-salta-san-pedro-de-atacama.html': 'traslado-san-pedro-de-atacama-salta.html',
  'traslado-salta-uyuni.html': 'traslado-uyuni-salta.html',
  'en/salta-to-san-pedro-de-atacama.html': 'en/san-pedro-de-atacama-to-salta.html',
  'en/salta-to-uyuni.html': 'en/uyuni-to-salta.html',
};
const todas = [...Object.keys(RUTAS), ...Object.values(RUTAS)];
const esIngles = (n) => n.startsWith('en/');
// Desde el 03/11 todo enlace entre páginas va desde la raíz.
const enlace = (desde, hacia) => rutaDe(hacia);

const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const bloqueDe = (nombre) => {
  const id = esIngles(nombre) ? 'getting-there' : 'como-llegar';
  const m = sinComentarios(paginas[nombre]).match(new RegExp(`<section class="([^"]+)" id="${id}">([\\s\\S]*?)</section>`));
  return m && { id, clase: m[1], html: m[2], texto: visible(m[2]) };
};

test('cada página de ruta tiene su gemela registrada', () => {
  for (const [es, en] of Object.entries(RUTAS)) {
    assert.strictEqual(pares[es], en, `${es} no está en el mapa de pares con ${en}`);
  }
});

for (const nombre of todas) {
  const en = esIngles(nombre);

  test(`${nombre}: abre con el bloque "cómo llegar", visible y enlazado`, () => {
    const html = sinComentarios(paginas[nombre]);
    const bloque = bloqueDe(nombre);
    assert.ok(bloque, `${nombre} no tiene el bloque #${en ? 'getting-there' : 'como-llegar'}`);
    assert.match(bloque.clase, /^block( alt)?$/, 'el bloque no es una sección común');
    // Arriba: es la primera sección después de la navegación de la página.
    const main = html.match(/<main>([\s\S]*?)<\/main>/)[1];
    const primera = main.slice(main.indexOf('<nav class="jump')).match(/<section class="[^"]+" id="([^"]+)"/);
    assert.strictEqual(primera[1], bloque.id, `en ${nombre} el bloque no es la primera sección`);
    assert.match(html, new RegExp(`<nav class="jump[\\s\\S]*?<a href="#${bloque.id}">[\\s\\S]*?</nav>`),
      'la navegación de la página no enlaza el bloque');
    // Texto visible: nada de <details>, hidden ni estilos que lo escondan.
    assert.ok(!/<details|\bhidden\b|aria-hidden|display:\s*none/.test(bloque.html), 'el bloque está escondido');
  });

  test(`${nombre}: el bloque responde distancia, tiempo, camino y opciones`, () => {
    const { html, texto } = bloqueDe(nombre);
    assert.match(html, en ? /<h2>How to get from [^<]+<\/h2>/ : /<h2>Cómo ir (?:de|del) [^<]+<\/h2>/);
    const respuesta = visible(html.match(/<div class="prosa">\s*<p>([\s\S]*?)<\/p>/)[1]);
    assert.match(respuesta, /\d+ km/, 'la respuesta no da la distancia');
    assert.match(respuesta, en ? /\d+ h\b|\bhours?\b|\bminutes\b/ : /\d+ h\b|\bhoras?\b|\bminutos\b/,
      'la respuesta no da el tiempo');
    const filas = [...html.matchAll(/<th scope="row">([^<]+)<\/th>/g)].map((m) => m[1]);
    for (const fila of en ? ['Distance and time', 'Road'] : ['Distancia y tiempo', 'Camino']) {
      assert.ok(filas.includes(fila), `falta la fila "${fila}"`);
    }
    assert.strictEqual(filas[filas.length - 1], en ? 'Private transfer with Lausof' : 'Traslado privado con Lausof',
      'Lausof va como la última opción, después de las públicas');
    assert.ok(filas.some((f) => (en ? /bus|taxi/i : /colectivo|taxi/i).test(f)),
      'el bloque no nombra la opción de transporte público');
    // La respuesta en el día, también acá.
    assert.match(texto, en ? /same business day/ : /en el día/);
    // Fuente fechada.
    assert.match(texto, en ? /(?:checked|Checked) [A-Z][a-z]{2} \d{1,2}, 2026/ : /consultados? el \d{2}\/\d{2}\/2026/,
      'el bloque no fecha su fuente');
  });

  test(`${nombre}: las cifras del bloque son las de la página`, () => {
    const { texto } = bloqueDe(nombre);
    const resto = visible(sinComentarios(paginas[nombre]).replace(/<section class="[^"]+" id="(?:como-llegar|getting-there)">[\s\S]*?<\/section>/, ''));
    const km = texto.match(/(\d[\d.,]*) km/)[1];
    assert.ok(resto.includes(`${km} km`), `${nombre}: el bloque dice ${km} km y el resto de la página no`);
  });

  test(`${nombre}: sin precios, reseñas ni marcado de preguntas`, () => {
    const { texto } = bloqueDe(nombre);
    assert.ok(!/(US\$|USD|\$\s?\d|€|\bARS\b|precio desde|from \$)/i.test(texto), 'el bloque publica un precio');
    assert.ok(!/reseña|review|rating|★|estrellas|stars/i.test(texto), 'el bloque habla de reseñas');
    assert.ok(!/"@type":\s*"(?:FAQPage|Question|HowTo|Offer)"/.test(paginas[nombre]), `${nombre} lleva marcado vedado`);
  });
}

// ------------------------------------------------------------- inversas
for (const [ida, vuelta] of Object.entries(INVERSAS)) {
  const en = esIngles(vuelta);
  const html = paginas[vuelta];

  test(`${vuelta}: existe, se indexa y tiene su 301 sin .html`, () => {
    assert.ok(html, `falta ${vuelta}`);
    assert.ok(sitemap.includes(`<loc>${urlDe(vuelta)}</loc>`), 'no está en el sitemap');
    const sin = rutaDe(vuelta).replace(/\.html$/, '');
    assert.match(redirects, new RegExp(`^${sin}\\s+${rutaDe(vuelta).replace(/\./g, '\\.')}\\s+301!$`, 'm'));
  });

  test(`${vuelta}: es la ruta al revés, con búsqueda del otro lado`, () => {
    const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
    assert.match(titulo, en ? /from (?:San Pedro de Atacama|Uyuni) to Salta/ : /de (?:San Pedro de Atacama|Uyuni) a Salta/);
    const h1 = visible(html.match(/<h1>([\s\S]*?)<\/h1>/)[1]);
    assert.match(h1, en ? /to Salta/ : /a Salta/);
    const texto = visible(html);
    assert.match(texto, en ? /pick you up/ : /[Ll]o buscamos/);
    assert.match(texto, en ? /to enter Argentina/ : /para entrar a la Argentina/);
    assert.match(texto, /SENASA/, 'no explica el control sanitario argentino');
    // El texto de WhatsApp pide el sentido correcto.
    for (const [, txt] of html.matchAll(/wa\.me\/5493875269009\?text=([^"]+)"/g)) {
      const t = decodeURIComponent(txt);
      assert.match(t, en ? /from (?:San Pedro de Atacama|Uyuni) to Salta/ : /de (?:San Pedro de Atacama|Uyuni) a Salta/, `WhatsApp pide otra ruta: ${t}`);
    }
  });

  test(`${vuelta}: el horario de frontera va con su fuente oficial y fecha`, () => {
    const id = en ? 'border' : 'frontera';
    const seccion = visible(html.match(new RegExp(`<section class="[^"]+" id="${id}">([\\s\\S]*?)</section>`))[1]);
    assert.match(seccion, en ? /On Nov 3, 2026/ : /El 03\/11\/2026/);
    assert.match(seccion, /\d{1,2}:\d{2}/, 'no da el horario');
    assert.match(seccion, en ? /Checked Nov 3, 2026/ : /Consultado el 03\/11\/2026/);
  });

  test(`${ida} ↔ ${vuelta}: se enlazan entre sí`, () => {
    assert.ok(sinComentarios(paginas[ida]).includes(`href="${enlace(ida, vuelta)}"`), `${ida} no enlaza ${vuelta}`);
    assert.ok(sinComentarios(html).includes(`href="${enlace(vuelta, ida)}"`), `${vuelta} no enlaza ${ida}`);
  });
}

test('Uyuni → Salta cubre también Tupiza y Villazón', () => {
  for (const nombre of ['traslado-uyuni-salta.html', 'en/uyuni-to-salta.html']) {
    const texto = visible(paginas[nombre]);
    for (const lugar of ['Tupiza', 'Villazón', 'La Quiaca']) {
      assert.ok(texto.includes(lugar), `${nombre} no nombra ${lugar}`);
    }
    assert.ok(paginas[nombre].includes('id="tupiza-villazon"'), `${nombre} no tiene la sección de Tupiza y Villazón`);
  }
});

// Decisión 14A de Lautaro (05/11/2026, web/revision-sitio-2026-11-05,
// 3-decisiones-consolidadas.md ítem 14; su «It's us, why we mention other
// companies»): el bloque compara colectivo, excursión y traslado privado sin
// nombrar empresas de colectivos, agencias, buscadores ni marketplaces, y
// termina en lo que hace Lausof. Vale también para las gemelas en portugués.
const RUTAS_PT = ['pt/traslado-salta-cafayate.html', 'pt/traslado-salta-purmamarca-tilcara-humahuaca.html',
  'pt/salinas-grandes-saindo-de-salta.html', 'pt/traslado-salta-san-pedro-de-atacama.html', 'pt/traslado-salta-uyuni.html'];
const NOMBRES_AJENOS = /Rome2Rio|Omio|Civitatis|Google|Ruta0|OSRM|OpenStreetMap|Flecha Bus|El Indio|Balut|Andesmar|Pullman|Frontera del Norte|Ale Hnos|SAETA|Viator|GetYourGuide|Tripadvisor/;
const AGENCIAS_Y_EMPRESAS = /agencias?|agências?|agency|agencies|empresas? (?:figuran?|estão|que lo cubren)|among the companies|one of the companies|varias empresas|several companies|várias empresas|entre otras empresas|entre outras empresas|cada empresa|each company|remis companies/i;
for (const nombre of [...todas, ...RUTAS_PT]) {
  test(`${nombre}: el bloque «cómo llegar» no nombra empresas ni agencias (14A)`, () => {
    const m = sinComentarios(paginas[nombre]).match(/<section class="[^"]+" id="(?:como-llegar|getting-there)">([\s\S]*?)<\/section>/);
    assert.ok(m, `${nombre} no tiene el bloque`);
    // Fuera de la nota «Vindo do Brasil?», que cita el vuelo y sus fuentes.
    const texto = visible(m[1].replace(/<p class="nota-fuente">Vindo do Brasil\?[\s\S]*?<\/p>/, ''));
    assert.doesNotMatch(texto, NOMBRES_AJENOS, `${nombre}: el bloque nombra a otra empresa`);
    assert.doesNotMatch(texto, AGENCIAS_Y_EMPRESAS, `${nombre}: el bloque manda a agencias o empresas`);
  });
}
test('San Pedro de Atacama → Salta: la pregunta del colectivo no nombra empresas (14A)', () => {
  const es = visible(paginas['traslado-san-pedro-de-atacama-salta.html']);
  const en = visible(paginas['en/san-pedro-de-atacama-to-salta.html']);
  assert.ok(es.includes('¿Hay colectivo de San Pedro de Atacama a Salta? Sí, hay colectivos de línea con horario fijo. Con un traslado privado, el grupo elige la hora de salida y puede parar en el camino.'));
  assert.ok(en.includes('Is there a bus from San Pedro de Atacama to Salta? Yes, there are scheduled buses. With a private transfer, your group picks the departure time and can stop on the way.'));
});
