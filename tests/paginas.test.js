// Páginas dedicadas de la ola de agosto 2026: cada una existe, declara su
// canónica con www y conserva su título trabajado. También se verifica el
// cableado: sitemap completo, 301 del sitio viejo hacia las páginas nuevas
// y los enlaces internos de las tarjetas de la portada.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, index, sitemap, redirects, pares, urlDe } = require('./util.js');

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
  'alquiler-4x4.html': 'Alquiler de Camionetas 4x4 en Salta — Con o sin Chofer, para Viajeros y Empresas | Lausof SRL',
  'alquiler-autoelevadores.html': 'Alquiler de Autoelevadores en Salta — 3 y 4 Toneladas, con o sin Operador | Lausof SRL',
  'deposito-galpon.html': 'Depósito y Galpón en Salta — Cámara de Frío y Playa de Maniobras | Lausof SRL',
  'producciones.html': 'Apoyo Logístico para Producciones y Rodajes — Salta y la Puna | Lausof SRL',
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'Traslado de Salta a Purmamarca, Tilcara y Humahuaca — Combi con chofer para grupos | Lausof SRL',
  'salinas-grandes-desde-salta.html': 'Salinas Grandes desde Salta por Purmamarca — Excursión en combi con chofer para grupos | Lausof SRL',
  'traslado-salta-cafayate.html': 'Traslado de Salta a Cafayate — Combi con chofer, solo ida o día completo | Lausof SRL',
  'traslado-salta-cachi.html': 'Traslado de Salta a Cachi por la Cuesta del Obispo — y la vuelta por la Ruta 40 | Lausof SRL',
  'traslado-salta-san-antonio-de-los-cobres.html': 'Traslado de Salta a San Antonio de los Cobres — Ruta 51, La Polvorilla y la Puna | Lausof SRL',
  'traslados-casamientos.html': 'Traslados para Casamientos en Salta — Combis para Invitados, Fincas y Bodegas | Lausof SRL',
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
  const indexables = new Set([...esperadas, ...Object.values(pares).map(urlDe)]);
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

// Las tarjetas de servicios de la portada enlazan a su página dedicada
// (además del WhatsApp): es el camino de lectura antes de cotizar. Las de
// la ola del 26/08 suman un cruce por tarjeta: personal → traslados
// puntuales, turismo → recitales, minería → alquiler 4x4.
test('las tarjetas de la portada enlazan a su página dedicada', () => {
  const enlaces = [
    'href="cargas-refrigeradas.html"',
    'href="transporte-de-personal.html"',
    'href="turismo.html"',
    'href="logistica-minera.html"',
    'href="traslados-empresas.html"',
    'href="charter-recitales.html"',
    'href="alquiler-4x4.html"',
  ];
  for (const enlace of enlaces) {
    assert.ok(index.includes(`<a class="walink" ${enlace}`),
      `la portada perdió el enlace interno ${enlace}`);
  }
});

// El índice de traslados y servicios especiales al pie de #servicios enlaza
// las 8 páginas de la ola del 26/08: es el único lugar de la portada donde
// aparecen todas juntas.
test('la portada enlaza las 8 páginas de servicios especiales', () => {
  const paginasOla = ['charter-recitales.html', 'clubes-deportivos.html',
    'viajes-de-estudio.html', 'traslados-empresas.html',
    'peregrinaciones-eventos.html', 'alquiler-4x4.html',
    'deposito-galpon.html', 'producciones.html'];
  const seccion = index.slice(index.indexOf('id="servicios"'), index.indexOf('id="porque"'));
  for (const pagina of paginasOla) {
    assert.ok(seccion.includes(`href="${pagina}"`),
      `el índice de servicios especiales perdió el enlace a ${pagina}`);
  }
});

// El pie de la portada enlaza las páginas que no tienen tarjeta propia.
test('el pie de la portada enlaza turismo, galería y depósito', () => {
  assert.ok(index.includes('<a href="turismo.html">Turismo en Salta →</a>'),
    'el pie perdió el enlace a turismo');
  assert.ok(index.includes('<a href="galeria.html">Galería →</a>'),
    'el pie perdió el enlace a la galería');
  assert.ok(index.includes('<a href="deposito-galpon.html">Depósito y galpón →</a>'),
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
  const idioma = (archivo) => (archivo.startsWith('en/') ? 'en' : 'es');
  const resolver = (desde, href) => {
    let ruta = href.replace(/^https:\/\/www\.lausof\.com/, '');
    if (/^[a-z]+:|^\/\//i.test(ruta)) return null; // externo, mailto, tel, wa.me
    ruta = ruta.split('#')[0].split('?')[0];
    if (!ruta) return null; // ancla en la misma página
    let archivo = ruta.startsWith('/')
      ? ruta.slice(1)
      : path.posix.normalize(path.posix.join(path.posix.dirname(desde), ruta));
    if (archivo === '' || archivo.endsWith('/')) archivo += 'index.html';
    if (archivo === 'en') archivo = 'en/index.html';
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
// al menos una página de servicio además de la portada: la portada sola es
// un solo camino, y es el que se pierde primero en un rediseño.
test('las páginas de eventos y golf se enlazan desde turismo y desde otra página de servicio', () => {
  const eventos = ['charter-recitales.html', 'clubes-deportivos.html', 'viajes-de-estudio.html',
    'traslados-empresas.html', 'peregrinaciones-eventos.html', 'golf-torneos.html'];
  const { sinComentarios } = require('./util.js');
  const enlazan = (origen, destino) => new RegExp(`<a\\b[^>]*\\bhref="${destino.replace('.', '\\.')}"`)
    .test(sinComentarios(paginas[origen]));
  for (const evento of eventos) {
    assert.ok(enlazan('turismo.html', evento), `turismo.html no enlaza a ${evento}`);
    assert.ok(enlazan('index.html', evento), `la portada no enlaza a ${evento}`);
    const otras = Object.keys(paginas).filter((p) => !p.startsWith('en/') &&
      !['index.html', 'turismo.html', evento].includes(p) && enlazan(p, evento));
    assert.ok(otras.length > 0, `${evento} sólo se enlaza desde la portada y turismo`);
  }
  for (const servicio of ['transporte-de-personal.html', 'alquiler-4x4.html']) {
    assert.ok(enlazan('turismo.html', servicio), `turismo.html no enlaza a ${servicio}`);
  }
});
