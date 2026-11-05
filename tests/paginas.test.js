// Páginas dedicadas de la ola de agosto 2026: cada una existe, declara su
// canónica con www y conserva su título trabajado. También se verifica el
// cableado: sitemap completo, 301 del sitio viejo hacia las páginas nuevas
// y los enlaces internos de las tarjetas de la portada.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, index, sitemap, redirects, pares, paresPt, urlDe } = require('./util.js');

// Título y canónica van juntos: si una página se renombra o se reescribe,
// acá se decide a conciencia (los títulos llevan keywords ganadas).
const dedicadas = {
  'turismo.html': 'Turismo en Salta y Jujuy — Traslados en combi y 4x4 | Lausof SRL',
  'logistica-minera.html': 'Transporte y Logística Minera en Salta — Personal, Cargas y Auxilio en la Puna | Lausof SRL',
  'transporte-de-personal.html': 'Transporte de Personal en Salta — Combis con Chofer para Empresas | Lausof SRL',
  'cargas-refrigeradas.html': 'Cargas Refrigeradas en Salta — Cadena de Frío y Depósito con Cámara | Lausof SRL',
  'galeria.html': 'Galería — Flota y Trabajos de Lausof SRL | Salta',
  'golf-torneos.html': 'Torneos de Golf — Traslados de Delegaciones | Lausof SRL',
  'charter-recitales.html': 'Combis a Recitales y Festivales — Salta, Jujuy y Tucumán | Lausof SRL',
  'clubes-deportivos.html': 'Traslados para Clubes y Delegaciones Deportivas — Salta y el NOA | Lausof SRL',
  'viajes-de-estudio.html': 'Viajes de Estudio y Salidas Educativas — Colegios y Universidades | Lausof SRL',
  'traslados-empresas.html': 'Traslados Corporativos y Congresos — Salta, Jujuy y Tucumán | Lausof SRL',
  'peregrinaciones-eventos.html': 'Peregrinaciones, Casamientos y Eventos — Traslados en Combi | Lausof SRL',
  'alquiler-4x4.html': 'Alquiler de Camionetas 4x4 en Salta — Con Chofer para Viajeros, por Mes para Empresas | Lausof SRL',
  'alquiler-autoelevadores.html': 'Alquiler de Autoelevadores en Salta — 3 y 4 Toneladas, con o sin Operador | Lausof SRL',
  'deposito-galpon.html': 'Depósito y Galpón en Salta — Cámara de Frío y Playa de Maniobras | Lausof SRL',
  'producciones.html': 'Apoyo Logístico para Producciones y Rodajes — Salta y la Puna | Lausof SRL',
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'Traslado de Salta a Purmamarca, Tilcara y Humahuaca — Combi con chofer para grupos | Lausof SRL',
  'salinas-grandes-desde-salta.html': 'Salinas Grandes desde Salta: unos 255 km y 4 h por Purmamarca — Excursión en combi con chofer para grupos | Lausof SRL',
  'traslado-salta-cafayate.html': 'Traslado de Salta a Cafayate — Combi con chofer, solo ida o día completo | Lausof SRL',
  'traslado-salta-cachi.html': 'Traslado de Salta a Cachi: unos 157 km y 2 h 30 por la Cuesta del Obispo — y la vuelta por la Ruta 40 | Lausof SRL',
  'traslado-salta-san-antonio-de-los-cobres.html': 'Traslado de Salta a San Antonio de los Cobres — Ruta 51, La Polvorilla y la Puna | Lausof SRL',
  'traslados-casamientos.html': 'Traslados para Casamientos en Salta — Combis para Invitados, Fincas y Bodegas | Lausof SRL',
  // Ola de eventos del 10/10/2026: el hub de feriados y dos eventos
  // recurrentes (URL sin año; el año vive en el título y se actualiza ahí).
  'feriados-fines-de-semana-largos.html': 'Feriados y Fines de Semana Largos 2026-2027 — Viajes en Combi desde Salta | Lausof SRL',
  'traslado-carnaval-quebrada-de-humahuaca.html': 'Carnaval 2027 en la Quebrada y en Salta — Fechas y Combi con Chofer desde Salta a Humahuaca, Tilcara y Purmamarca | Lausof SRL',
  'traslado-serenata-a-cafayate.html': 'Traslado a la Serenata a Cafayate 2027 desde Salta — Combi con Chofer y Vuelta en la Noche | Lausof SRL',
  // Viajes internacionales (10/10/2026): la página que los agrupa y las dos
  // rutas con página propia. Sus gemelas inglesas van en tests/util.js.
  'viajes-internacionales.html': 'Viajes internacionales desde Salta — Chile, Bolivia y otros destinos | Lausof SRL',
  'traslado-salta-san-pedro-de-atacama.html': 'Traslado privado de Salta a San Pedro de Atacama por el Paso de Jama | Lausof SRL',
  'traslado-salta-uyuni.html': 'Traslado privado de Salta a Uyuni (Bolivia) por La Quiaca y Villazón | Lausof SRL',
  // Sentido inverso (03/11/2026, tests/como-llegar.test.js).
  'traslado-san-pedro-de-atacama-salta.html': 'Traslado privado de San Pedro de Atacama a Salta por el Paso de Jama | Lausof SRL',
  'traslado-uyuni-salta.html': 'Traslado privado de Uyuni a Salta por Villazón y La Quiaca, también desde Tupiza | Lausof SRL',
  // Páginas de eventos y temporada del 10/10/2026 (tests/eventos.test.js).
  'traslados-trail-jujuy-utmb.html': 'Traslados para Jujuy Fuerza Sagrada by UTMB 2027 — Aeropuerto, Largadas y Regreso | Lausof SRL',
  'traslado-tren-a-las-nubes.html': 'Traslado al Tren a las Nubes desde Salta — Combi o 4x4 a San Antonio de los Cobres | Lausof SRL',
  'semana-santa-salta-jujuy.html': 'Semana Santa 2027 en Salta y Jujuy — Traslados y Excursiones con Chofer | Lausof SRL',
  'traslados-fiesta-del-milagro.html': 'Traslados para la Fiesta del Milagro 2027 en Salta — Combis para Peregrinos y Parroquias | Lausof SRL',
  // Sweep del 03/11/2026: aeropuerto y combi con chofer por día (tests/servicios-turismo.test.js).
  'traslado-aeropuerto-salta.html': 'Traslado del aeropuerto de Salta al centro y a los hoteles — Combi con chofer para grupos | Lausof SRL',
  'alquiler-combi-con-chofer-salta.html': 'Alquiler de Combi con Chofer por Día en Salta — Para Grupos, Agencias y Viajes de Varios Días | Lausof SRL',
  // Páginas B2B del 03/11/2026 (tests/b2b.test.js).
  'agencias-y-hoteles.html': 'Transporte para Agencias de Viajes, Hoteles y Operadores en Salta y Jujuy — Combis con Chofer | Lausof SRL',
  'transporte-de-personal-obras-de-litio.html': 'Transporte de Personal para Obras de Litio en la Puna — Cambios de Turno y Campamentos, 24 h | Lausof SRL',
  // Salta – Jujuy (plan SEO 03/11/2026, §3 #3; tests/como-llegar.test.js).
  'traslado-salta-jujuy.html': 'Traslado de Salta a Jujuy — Combi con chofer a San Salvador de Jujuy y al aeropuerto de Jujuy | Lausof SRL',
  // Hub «Empresas y minería» (05/11/2026, tests/hub-empresas.test.js).
  'empresas-y-mineria.html': 'Transporte de Personal y Cargas para Minería y Empresas — Salta, Jujuy y la Puna | Lausof SRL',
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
  const version = index.match(/href="\/?css\/styles\.css\?v=(\d+)"/)[1];
  for (const [nombre, html] of Object.entries(paginas)) {
    const m = html.match(/href="\/?css\/styles\.css\?v=(\d+)"/);
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
test('las páginas de eventos y golf se enlazan desde turismo y desde otra página de servicio', () => {
  const eventos = ['charter-recitales.html', 'clubes-deportivos.html', 'viajes-de-estudio.html',
    'traslados-empresas.html', 'peregrinaciones-eventos.html', 'golf-torneos.html'];
  const { sinComentarios } = require('./util.js');
  const enlazan = (origen, destino) => new RegExp(`<a\\b[^>]*\\bhref="/${destino.replace('.', '\\.')}"`)
    .test(sinComentarios(paginas[origen]));
  for (const evento of eventos) {
    assert.ok(enlazan('turismo.html', evento), `turismo.html no enlaza a ${evento}`);
    const otras = Object.keys(paginas).filter((p) => !/^(en|pt)\//.test(p) &&
      !['index.html', 'turismo.html', evento].includes(p) && enlazan(p, evento));
    assert.ok(otras.length > 0, `${evento} sólo se enlaza desde la portada y turismo`);
  }
  for (const servicio of ['transporte-de-personal.html', 'alquiler-4x4.html']) {
    assert.ok(enlazan('turismo.html', servicio), `turismo.html no enlaza a ${servicio}`);
  }
});
