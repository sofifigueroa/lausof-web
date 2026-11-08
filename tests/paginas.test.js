// Páginas dedicadas de la ola de agosto 2026: cada una existe, declara su
// canónica con www y conserva su título trabajado. También se verifica el
// cableado: sitemap completo, 301 del sitio viejo hacia las páginas nuevas
// y los enlaces internos de las tarjetas de la portada.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, index, sitemap, redirects, pares, paresPt, urlDe } = require('./util.js');

// Título y canónica van juntos: si una página se renombra o se reescribe,
// acá se decide a conciencia (los títulos llevan keywords ganadas). Desde la
// ronda 9 (08/11/2026) los títulos se escriben en scripts/metadatos-datos.mjs;
// este mapa sigue fijándolos a mano, a propósito.
const dedicadas = {
  'turismo.html': 'Turismo en Salta y Jujuy: traslados en combi y 4x4 | Lausof',
  'logistica-minera.html': 'Transporte y logística minera en Salta y la Puna | Lausof',
  'transporte-de-personal.html': 'Transporte de personal en Salta: combis con chofer | Lausof',
  'cargas-refrigeradas.html': 'Cargas refrigeradas en Salta: cadena de frío y cámara | Lausof',
  // Desde el 05/11/2026 es la página de flota por tipo de unidad (fotos,
  // fase 1; título de imagenes-2026-11-05/4-textos.md §2.5).
  'galeria.html': 'Flota de Lausof: combis, camiones y 4x4 en Salta',
  'golf-torneos.html': 'Traslados de delegaciones a torneos de golf | Lausof',
  'charter-recitales.html': 'Alquiler de combi para recitales y festivales en Salta | Lausof',
  'clubes-deportivos.html': 'Traslados para clubes y delegaciones deportivas | Lausof',
  'viajes-de-estudio.html': 'Viajes de estudio para colegios y universidades | Lausof',
  'traslados-empresas.html': 'Traslados corporativos y congresos en Salta | Lausof',
  'peregrinaciones-eventos.html': 'Peregrinaciones, casamientos y eventos en combi | Lausof',
  'alquiler-4x4.html': 'Alquiler de 4x4 con chofer en Salta: viajeros y empresas | Lausof',
  'alquiler-autoelevadores.html': 'Alquiler de autoelevadores en Salta, con o sin operador | Lausof',
  'deposito-galpon.html': 'Depósito y galpón en Salta con cámara de frío | Lausof',
  'producciones.html': 'Apoyo logístico para rodajes en Salta y la Puna | Lausof',
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'Traslado de Salta a Purmamarca, Tilcara y Humahuaca | Lausof',
  'salinas-grandes-desde-salta.html': 'Salinas Grandes desde Salta: unos 255 km y 4 h en combi | Lausof',
  'traslado-salta-cafayate.html': 'Traslado de Salta a Cafayate en combi con chofer | Lausof',
  'traslado-salta-cachi.html': 'Traslado de Salta a Cachi: unos 157 km y 2 h 30 | Lausof',
  'traslado-salta-san-antonio-de-los-cobres.html': 'Traslado de Salta a San Antonio de los Cobres | Lausof',
  'traslados-casamientos.html': 'Traslados para casamientos en Salta, fincas y bodegas | Lausof',
  // Ola de eventos del 10/10/2026: el hub de feriados y dos eventos
  // recurrentes (URL sin año; el año vive en el título y se actualiza ahí).
  'feriados-fines-de-semana-largos.html': 'Feriados y fines de semana largos 2026-2027 en Salta | Lausof',
  'traslado-carnaval-quebrada-de-humahuaca.html': 'Carnaval 2027 en la Quebrada y Salta: combi con chofer | Lausof',
  'traslado-serenata-a-cafayate.html': 'Traslado a la Serenata a Cafayate 2027 desde Salta | Lausof',
  // Viajes internacionales (10/10/2026): la página que los agrupa y las dos
  // rutas con página propia. Sus gemelas inglesas van en tests/util.js.
  'viajes-internacionales.html': 'Viajes internacionales desde Salta: Chile y Bolivia | Lausof',
  'traslado-salta-san-pedro-de-atacama.html': 'Traslado privado de Salta a San Pedro de Atacama | Lausof',
  'traslado-salta-uyuni.html': 'Traslado privado de Salta a Uyuni, Bolivia | Lausof',
  // Sentido inverso (03/11/2026, tests/como-llegar.test.js).
  'traslado-san-pedro-de-atacama-salta.html': 'Traslado privado de San Pedro de Atacama a Salta | Lausof',
  'traslado-uyuni-salta.html': 'Traslado privado de Uyuni a Salta, también desde Tupiza | Lausof',
  // Páginas de eventos y temporada del 10/10/2026 (tests/eventos.test.js).
  'traslados-trail-jujuy-utmb.html': 'Traslados para Jujuy Fuerza Sagrada by UTMB 2027 | Lausof',
  'traslado-tren-a-las-nubes.html': 'Traslado al Tren a las Nubes desde Salta | Lausof',
  'semana-santa-salta-jujuy.html': 'Semana Santa 2027 en Salta y Jujuy: traslados con chofer | Lausof',
  'traslados-fiesta-del-milagro.html': 'Traslados para la Fiesta del Milagro 2027 en Salta | Lausof',
  // Sweep del 03/11/2026: aeropuerto y combi con chofer por día (tests/servicios-turismo.test.js).
  'traslado-aeropuerto-salta.html': 'Traslado del aeropuerto de Salta al centro y hoteles | Lausof',
  'alquiler-combi-con-chofer-salta.html': 'Alquiler de combi con chofer por día en Salta | Lausof',
  // Páginas B2B del 03/11/2026 (tests/b2b.test.js).
  'agencias-y-hoteles.html': 'Transporte para agencias y hoteles en Salta y Jujuy | Lausof',
  'transporte-de-personal-obras-de-litio.html': 'Transporte de personal para obras de litio en la Puna | Lausof',
  // Salta – Jujuy (plan SEO 03/11/2026, §3 #3; tests/como-llegar.test.js).
  'traslado-salta-jujuy.html': 'Traslado de Salta a Jujuy y al aeropuerto de Jujuy | Lausof',
  // Hub «Empresas y minería» (05/11/2026, tests/hub-empresas.test.js).
  'empresas-y-mineria.html': 'Transporte de Personal y Cargas para Minería y Empresas | Lausof',
};

for (const [nombre, titulo] of Object.entries(dedicadas)) {
  test(`${nombre}: existe, con su canónica www y su título`, () => {
    const html = paginas[nombre];
    assert.ok(html, `falta la página ${nombre}`);
    assert.ok(html.includes(`<link rel="canonical" href="https://www.lausof.com/${nombre}">`),
      `la canónica de ${nombre} no apunta a https://www.lausof.com/${nombre}`);
    assert.strictEqual(html.match(/<title>([^<]+)<\/title>/)[1], titulo,
      `el título de ${nombre} cambió`);
  });
}

// Todas las páginas comparten css/styles.css y tienen que pedir la MISMA
// versión ?v= que la portada: una página con la versión vieja se ve rota
// hasta que al visitante se le vence la caché.
test('todas las páginas cargan styles.css en la misma versión que la portada', () => {
  const version = index.match(/href="\/?css\/styles\.css\?v=([0-9a-f]+)"/)[1];
  for (const [nombre, html] of Object.entries(paginas)) {
    const m = html.match(/href="\/?css\/styles\.css\?v=([0-9a-f]+)"/);
    assert.ok(m, `${nombre} no versiona styles.css con ?v=`);
    assert.strictEqual(m[1], version,
      `${nombre} carga styles.css?v=${m[1]} y la portada usa ?v=${version}`);
  }
});

// El sitemap lista exactamente las páginas indexables: la portada, flota y
// las páginas dedicadas de `dedicadas`, más todas las gemelas inglesas del
// mapa `pares` (que verifica una por una tests/ingles.test.js). Ninguna de las
// dos 404 va: no son páginas para indexar. El total se deriva de esas dos
// fuentes, no de un número fijo: así cada rama que suma una página no choca
// con la otra en este test.
test('el sitemap lista exactamente las URLs indexables y ninguna más', () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const esperadas = [
    'https://www.lausof.com/',
    'https://www.lausof.com/flota-en-venta.html',
    ...Object.keys(dedicadas).map((n) => `https://www.lausof.com/${n}`),
  ];
  for (const url of esperadas) {
    assert.ok(urls.includes(url), `falta ${url} en el sitemap`);
  }
  const indexables = new Set([...esperadas, ...Object.values(pares).map(urlDe), ...Object.values(paresPt).map(urlDe)]);
  for (const url of urls) {
    assert.ok(indexables.has(url), `${url} está en el sitemap y no es una página indexable conocida`);
  }
  assert.strictEqual(new Set(urls).size, urls.length, 'el sitemap repite URLs');
  assert.strictEqual(urls.length, indexables.size,
    `el sitemap tiene ${urls.length} URLs y se esperaban ${indexables.size}`);
  assert.ok(!sitemap.includes('404.html'), 'la 404 no va en el sitemap');
});

// Tres URLs del sitio viejo ya tienen página dedicada: su 301 va derecho ahí
// (antes caían en secciones de la portada). La de golf lleva ! porque las
// URLs lindas de Netlify hacen que /golf-torneos "exista" como
// golf-torneos.html y sin ! la regla no se aplica.
test('las URLs del sitio viejo con página dedicada redirigen a ella', () => {
  const retargets = [
    ['/conozca-salta', 'https://www.lausof.com/turismo.html', '301'],
    ['/galeria-imagenes', 'https://www.lausof.com/galeria.html', '301'],
    ['/golf-torneos', 'https://www.lausof.com/golf-torneos.html', '301!'],
  ];
  for (const [origen, destino, codigo] of retargets) {
    const regla = new RegExp(`^${origen}\\s+${destino.replace(/[./]/g, '\\$&')}\\s+${codigo}$`, 'm');
    assert.match(redirects, regla, `${origen} no redirige a ${destino} con ${codigo}`);
  }
});

// La portada enlaza a las páginas dedicadas (además del WhatsApp): es el
// camino de lectura antes de cotizar. Hasta el 05/11/2026 lo hacían las cinco
// tarjetas; desde la estructura aprobada (opción A) lo hacen las tres puertas
// y el menú generado (scripts/menu.mjs). Las que salieron de las puertas
// (logística minera, recitales) siguen a un toque: logística en el menú,
// recitales en «Grupos y ocasiones» → turismo.html#eventos. El orden y el
// texto de las puertas los vigila tests/portadas.test.js.
const tramoDe = (html, desde, hasta) => {
  const i = html.indexOf(desde);
  assert.ok(i > -1, `no está ${desde}`);
  return html.slice(i, html.indexOf(hasta, i));
};
test('las puertas de la portada enlazan a sus páginas dedicadas', () => {
  const puertas = tramoDe(index, '<section class="puertas"', '</section>');
  const enlaces = [
    'href="/turismo.html"',
    'href="/transporte-de-personal.html"',
    'href="/transporte-de-personal-obras-de-litio.html"',
    'href="/traslados-empresas.html"',
    'href="/alquiler-4x4.html#empresas"',
    'href="/cargas-refrigeradas.html"',
    'href="/deposito-galpon.html"',
    'href="/alquiler-autoelevadores.html"',
  ];
  for (const enlace of enlaces) {
    assert.ok(puertas.includes(`<a ${enlace}`), `las puertas perdieron el enlace interno ${enlace}`);
  }
  const menu = tramoDe(index, '<!-- GENERADO:MENU', '<!-- /GENERADO:MENU -->');
  assert.ok(menu.includes('href="/logistica-minera.html"'), 'el menú de la portada perdió logística minera');
  assert.ok(menu.includes('href="/turismo.html#eventos"'), 'el menú de la portada perdió «Grupos y ocasiones»');
});

// Las 8 páginas de servicios especiales de la ola del 26/08 vivían juntas en
// un índice al pie de #servicios de la portada. Desde el 05/11/2026 viven en
// el hub de su sección: las de grupos y ocasiones en turismo.html#eventos y
// las de empresas en empresas-y-mineria.html (el menú lleva a los dos).
test('las 8 páginas de servicios especiales se enlazan desde el hub de su sección', () => {
  const eventos = tramoDe(paginas['turismo.html'], 'id="eventos"', '</section>');
  const hubEmpresas = paginas['empresas-y-mineria.html'];
  const porHub = {
    'charter-recitales.html': eventos, 'clubes-deportivos.html': eventos,
    'viajes-de-estudio.html': eventos, 'peregrinaciones-eventos.html': eventos,
    'traslados-empresas.html': hubEmpresas, 'alquiler-4x4.html': hubEmpresas,
    'deposito-galpon.html': hubEmpresas, 'producciones.html': hubEmpresas,
  };
  for (const [pagina, hub] of Object.entries(porHub)) {
    assert.ok(new RegExp(`href="/${pagina.replace('.', '\\.')}[#"]`).test(hub),
      `el hub de su sección no enlaza a ${pagina}`);
  }
});

// El pie de la portada enlaza las páginas que no tienen tarjeta propia.
test('el pie de la portada enlaza turismo, galería y depósito', () => {
  assert.ok(index.includes('<a href="/turismo.html">Turismo en Salta →</a>'),
    'el pie perdió el enlace a turismo');
  assert.ok(index.includes('<a href="/galeria.html">Galería →</a>'),
    'el pie perdió el enlace a la galería');
  assert.ok(index.includes('<a href="/deposito-galpon.html">Depósito y galpón →</a>'),
    'el pie perdió el enlace al depósito');
});

// Ninguna página queda huérfana: cada una recibe al menos un enlace interno
// desde OTRA página de su mismo idioma (el selector de idioma y el hreflang
// no cuentan, porque cruzan de idioma). Hasta el 10/10/2026 golf-torneos no
// recibía ningún enlace y las páginas de eventos sólo uno, desde la portada
// (análisis de servicios del 10/10, ítem 8). Las 404 no se enlazan.
test('cada página recibe al menos un enlace interno de su mismo idioma', () => {
  const path = require('node:path');
  const { sinComentarios } = require('./util.js');
  const idioma = (archivo) => (/^(en|pt)\//.test(archivo) ? archivo.slice(0, 2) : 'es');
  const resolver = (desde, href) => {
    let ruta = href.replace(/^https:\/\/www\.lausof\.com/, '');
    if (/^[a-z]+:|^\/\//i.test(ruta)) return null; // externo, mailto, tel, wa.me
    ruta = ruta.split('#')[0].split('?')[0];
    if (!ruta) return null; // ancla en la misma página
    let archivo = ruta.startsWith('/')
      ? ruta.slice(1)
      : path.posix.normalize(path.posix.join(path.posix.dirname(desde), ruta));
    if (archivo === '' || archivo.endsWith('/')) archivo += 'index.html';
    if (archivo === 'en' || archivo === 'pt') archivo += '/index.html';
    return archivo;
  };
  const entrantes = Object.fromEntries(Object.keys(paginas).map((p) => [p, new Set()]));
  for (const [desde, html] of Object.entries(paginas)) {
    for (const [, href] of sinComentarios(html).matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      const destino = resolver(desde, href);
      if (destino && destino !== desde && entrantes[destino] && idioma(destino) === idioma(desde)) {
        entrantes[destino].add(desde);
      }
    }
  }
  for (const [pagina, origenes] of Object.entries(entrantes)) {
    if (/(^|\/)404\.html$/.test(pagina)) continue;
    assert.ok(origenes.size > 0, `${pagina} no recibe ningún enlace interno de su idioma`);
  }
});

// Las páginas de eventos y la de golf reciben enlaces desde turismo y desde
// al menos una página de servicio: un solo camino es el que se pierde primero
// en un rediseño. Desde el 05/11/2026 la portada ya no las enlaza (la fila de
// servicios especiales salió con la estructura aprobada; sus enlaces viven en
// los hubs y en el menú «Grupos y ocasiones» → turismo.html#eventos).
// Traslados corporativos y transporte de personal son de empresas: turismo ya
// no los enlaza en el cuerpo (regla T2 de 3a §3.4, tests/cruces.test.js); los
// enlazan el menú y el hub de empresas.
test('las páginas de eventos y golf se enlazan desde turismo y desde otra página de servicio', () => {
  const eventos = ['charter-recitales.html', 'clubes-deportivos.html', 'viajes-de-estudio.html',
    'peregrinaciones-eventos.html', 'golf-torneos.html'];
  const { sinComentarios } = require('./util.js');
  const enlazan = (origen, destino) => new RegExp(`<a\\b[^>]*\\bhref="/${destino.replace('.', '\\.')}"`)
    .test(sinComentarios(paginas[origen]));
  for (const evento of eventos) {
    assert.ok(enlazan('turismo.html', evento), `turismo.html no enlaza a ${evento}`);
    const otras = Object.keys(paginas).filter((p) => !/^(en|pt)\//.test(p) &&
      !['index.html', 'turismo.html', evento].includes(p) && enlazan(p, evento));
    assert.ok(otras.length > 0, `${evento} sólo se enlaza desde la portada y turismo`);
  }
  for (const servicio of ['alquiler-4x4.html']) {
    assert.ok(enlazan('turismo.html', servicio), `turismo.html no enlaza a ${servicio}`);
  }
});
