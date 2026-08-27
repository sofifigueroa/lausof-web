// Páginas dedicadas de la ola de agosto 2026: cada una existe, declara su
// canónica con www y conserva su título trabajado. También se verifica el
// cableado: sitemap completo, 301 del sitio viejo hacia las páginas nuevas
// y los enlaces internos de las tarjetas de la portada.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, index, sitemap, redirects } = require('./util.js');

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
  'alquiler-4x4.html': 'Alquiler de Camionetas 4x4 en Salta — Mensual, para Empresas y Minería | Lausof SRL',
  'alquiler-autoelevadores.html': 'Alquiler de Autoelevadores en Salta — 3 y 4 Toneladas, con o sin Operador | Lausof SRL',
  'deposito-galpon.html': 'Depósito y Galpón en Salta — Cámara de Frío y Playa de Maniobras | Lausof SRL',
  'producciones.html': 'Apoyo Logístico para Producciones y Rodajes — Salta y la Puna | Lausof SRL',
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
// las quince dedicadas. La 404 no va (no es una página para indexar).
test('el sitemap lista las 17 URLs indexables y ninguna más', () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const esperadas = [
    'https://www.lausof.com/',
    'https://www.lausof.com/flota-en-venta.html',
    ...Object.keys(dedicadas).map((n) => `https://www.lausof.com/${n}`),
  ];
  for (const url of esperadas) {
    assert.ok(urls.includes(url), `falta ${url} en el sitemap`);
  }
  assert.strictEqual(urls.length, 17, `el sitemap tiene ${urls.length} URLs y se esperaban 17`);
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
