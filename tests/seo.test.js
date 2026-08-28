// SEO de la migración: el dominio primario es https://www.lausof.com y las
// URLs del sitio Wix viejo redirigen con 301. Si algo de esto se pisa,
// Google vuelve a ver señales contradictorias justo después del corte.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { index, flota, sitemap, robots, redirects } = require('./util.js');

test('las canónicas de las dos páginas apuntan al dominio con www', () => {
  assert.ok(index.includes('<link rel="canonical" href="https://www.lausof.com/">'),
    'la canónica de la portada no es https://www.lausof.com/');
  assert.ok(flota.includes('<link rel="canonical" href="https://www.lausof.com/flota-en-venta.html">'),
    'la canónica de flota-en-venta no lleva www');
});

test('ninguna referencia absoluta quedó en el dominio sin www', () => {
  for (const [nombre, html] of [['index.html', index], ['flota-en-venta.html', flota],
    ['sitemap.xml', sitemap], ['robots.txt', robots]]) {
    assert.ok(!/https:\/\/lausof\.com\//.test(html),
      `${nombre} todavía referencia https://lausof.com/ (sin www)`);
  }
});

test('el Open Graph y el JSON-LD de la portada usan el dominio con www', () => {
  assert.ok(index.includes('<meta property="og:url" content="https://www.lausof.com/">'),
    'og:url de la portada sin www');
  assert.ok(index.includes('"@id": "https://www.lausof.com/#empresa"'),
    '@id del JSON-LD sin www');
  assert.ok(index.includes('"url": "https://www.lausof.com/"'),
    'url del JSON-LD sin www');
});

test('el sitemap lista las dos páginas con www', () => {
  assert.ok(sitemap.includes('<loc>https://www.lausof.com/</loc>'),
    'falta la portada con www en el sitemap');
  assert.ok(sitemap.includes('<loc>https://www.lausof.com/flota-en-venta.html</loc>'),
    'falta flota-en-venta con www en el sitemap');
});

test('robots.txt permite rastrear todo y apunta al sitemap con www', () => {
  assert.match(robots, /User-agent: \*\s*\nAllow: \//,
    'robots.txt no permite el rastreo general');
  assert.ok(robots.includes('Sitemap: https://www.lausof.com/sitemap.xml'),
    'el sitemap de robots.txt no lleva www');
});

test('cada URL indexada del sitio Wix viejo tiene su 301', () => {
  const viejas = ['/nuestra-empresa', '/galeria-imagenes', '/contactenos',
    '/conozca-salta', '/golf-torneos', '/principal-old'];
  for (const ruta of viejas) {
    // El ! opcional: /golf-torneos lo necesita porque su página homónima
    // existe y sin ! Netlify no aplica la regla.
    const regla = new RegExp(`^${ruta}\\s+\\S+\\s+301!?$`, 'm');
    assert.match(redirects, regla, `falta el 301 de ${ruta}`);
  }
});

// El título de la portada va servicio-primero (patrón del sitio viejo y de
// todo competidor que rankea) y tiene que conservar "Grúas", "Remolques",
// "Auxilio" y "Salta": hay puestos ganados en esas búsquedas.
test('el título de la portada es servicio-primero y conserva las keywords', () => {
  const titulo = index.match(/<title>([^<]+)<\/title>/)[1];
  for (const palabra of ['Grúas', 'Remolques', 'Auxilio Mecánico', 'Salta', 'Lausof']) {
    assert.ok(titulo.includes(palabra), `el título perdió "${palabra}": ${titulo}`);
  }
  assert.ok(!titulo.startsWith('Lausof'),
    `el título volvió a ser marca-primero: ${titulo}`);
  const ogTitle = index.match(/<meta property="og:title" content="([^"]+)">/)[1];
  assert.strictEqual(ogTitle, titulo, 'og:title distinto del <title>');
});

// La ficha LocalBusiness de la portada lleva las coordenadas del pin real de
// la ficha de Google, el enlace al mapa y el 526-9009 como contacto adicional
// (es el teléfono que muestra la ficha): sitio y ficha tienen que contar lo
// mismo. La página de flota referencia la misma entidad por su @id.
test('el JSON-LD de la portada lleva geo, hasMap y el teléfono de la ficha', () => {
  const bloque = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const datos = JSON.parse(bloque[1]);
  assert.strictEqual(datos.geo && datos.geo.latitude, -24.771929, 'falta la latitud del pin');
  assert.strictEqual(datos.geo && datos.geo.longitude, -65.4272135, 'falta la longitud del pin');
  assert.match(datos.hasMap || '', /^https:\/\/www\.google\.com\/maps\/place\//,
    'falta el hasMap con el enlace a la ficha');
  // 27/08: el 526-9009 es EL teléfono de llamadas del sitio, así que la ficha
  // se describe con una sola línea y no hace falta contactPoint aparte.
  assert.strictEqual(datos.telephone, '+54-9-387-526-9009',
    'el teléfono del JSON-LD tiene que ser el 526-9009 (la línea real)');
});

// La ficha de la portada es la única definición completa de la entidad, así
// que tiene que contar lo mismo que las fichas de Google, Apple Maps y Bing:
// horario 24 hs, antigüedad, CUIT, logo, fotos y las redes reales. Si acá
// falta algo, las páginas que referencian el @id #empresa tampoco lo heredan.
const empresa = () => JSON.parse(
  index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test('el JSON-LD de la portada declara la guardia de 24 hs los 7 días', () => {
  const horarios = empresa().openingHoursSpecification;
  assert.ok(Array.isArray(horarios) && horarios.length,
    'falta openingHoursSpecification: la ficha no dice que el auxilio es 24 hs');
  const dias = horarios.flatMap((h) => [].concat(h.dayOfWeek));
  for (const dia of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    'Saturday', 'Sunday']) {
    assert.ok(dias.includes(dia), `el horario no cubre ${dia}`);
  }
  // El día completo se expresa 00:00–23:59 (la forma que documenta Google
  // para negocios abiertos las 24 horas).
  for (const h of horarios) {
    assert.strictEqual(h.opens, '00:00', 'un tramo horario no abre a las 00:00');
    assert.strictEqual(h.closes, '23:59', 'un tramo horario no cierra a las 23:59');
  }
});

test('la ficha lleva antigüedad, CUIT y la descripción de las 24 hs', () => {
  const datos = empresa();
  assert.strictEqual(datos.foundingDate, '2010',
    'falta foundingDate 2010 (Contrato Social de 2010)');
  assert.strictEqual(datos.taxID, '30-71146774-9', 'el CUIT del JSON-LD no es el de Lausof');
  for (const palabra of ['24 hs', 'Salta', 'Junín 1334']) {
    assert.ok(datos.description.includes(palabra),
      `la descripción perdió "${palabra}": ${datos.description}`);
  }
});

// El logo y las fotos van con URL absoluta (los buscadores las leen fuera del
// contexto de la página) y tienen que existir en assets/: si se renombra un
// archivo, la ficha queda apuntando al vacío y Google descarta la imagen.
test('el logo y las fotos de la ficha son absolutos y existen en assets', () => {
  const datos = empresa();
  const fotos = [].concat(datos.logo, datos.image);
  assert.ok(fotos.length >= 3, 'la ficha tiene menos de un logo y dos fotos');
  for (const url of fotos) {
    assert.match(url, /^https:\/\/www\.lausof\.com\/assets\/\S+$/,
      `la imagen de la ficha no es absoluta al dominio canónico: ${url}`);
    const archivo = url.replace('https://www.lausof.com/', '');
    assert.ok(fs.existsSync(path.join(__dirname, '..', archivo)),
      `la ficha apunta a ${archivo} y ese archivo no está en el sitio`);
  }
});

test('el sameAs de la ficha lista los perfiles reales de la empresa', () => {
  const redes = empresa().sameAs;
  for (const perfil of ['https://www.instagram.com/lausofsrl',
    'https://www.facebook.com/lausoftransportes',
    'https://maps.apple.com/place?place-id=IFDAF471150EB87B7']) {
    assert.ok(redes.includes(perfil), `falta ${perfil} en el sameAs`);
  }
});

test('la página de flota referencia la entidad #empresa de la portada', () => {
  const bloque = flota.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(bloque, 'no hay JSON-LD estático en flota-en-venta.html');
  const datos = JSON.parse(bloque[1]);
  assert.strictEqual(datos['@id'], 'https://www.lausof.com/#empresa',
    'el nodo de flota no apunta al @id #empresa');
});

// La og:image de cada página es un recorte propio de 1200×630 y va SIEMPRE en
// JPEG (los scrapers de WhatsApp/Facebook manejan mal el WebP), con las
// dimensiones declaradas para que la primera vez que se comparte el enlace la
// preview salga con imagen.
test('las og:image son JPEG dedicadas con dimensiones declaradas', () => {
  for (const [nombre, contenido] of [['index.html', index], ['flota-en-venta.html', flota]]) {
    const imagen = contenido.match(/<meta property="og:image" content="([^"]+)">/);
    assert.ok(imagen, `no hay og:image en ${nombre}`);
    assert.match(imagen[1], /^https:\/\/www\.lausof\.com\/assets\/og-[a-z-]+\.jpg$/,
      `la og:image de ${nombre} no es un recorte JPEG dedicado: ${imagen[1]}`);
    assert.ok(contenido.includes('<meta property="og:image:width" content="1200">'),
      `falta og:image:width en ${nombre}`);
    assert.ok(contenido.includes('<meta property="og:image:height" content="630">'),
      `falta og:image:height en ${nombre}`);
  }
});

// Además del mapa del sitio viejo, las variantes duplicadas de las URLs
// reales tienen su 301: /index.html a / y el subdominio *.netlify.app al
// dominio canónico. Si estas reglas se caen, Google vuelve a ver dos copias.
test('las variantes duplicadas redirigen al canónico', () => {
  assert.match(redirects, /^\/index\.html\s+\/\s+301!$/m,
    'falta el 301 de /index.html a /');
  assert.match(redirects, /^https:\/\/lausof\.netlify\.app\/\*\s+https:\/\/www\.lausof\.com\/:splat\s+301!$/m,
    'falta el 301 del host lausof.netlify.app al dominio canónico');
  assert.match(redirects, /^\/principal-old\s+\/\s+301$/m,
    'se perdió el 301 de /principal-old del mapa del sitio viejo');
});

// El fondo del hero es la LCP de cada página y viene de la CSS, así que las
// dos páginas lo precargan en el head. La precarga tiene que apuntar al MISMO
// archivo que usa la hoja de estilos: si se cambia la foto en la CSS y no acá,
// se descarga dos veces (la vieja precargada y la nueva del fondo).
test('el fondo del hero (LCP) se precarga en las dos páginas', () => {
  const { css } = require('./util.js');
  assert.match(index, /<link rel="preload" as="image" href="assets\/hero-flota-paisaje\.webp" fetchpriority="high" media="\(min-width: [\d.]+px\)">/,
    'falta la precarga del hero de escritorio en index.html');
  assert.match(index, /<link rel="preload" as="image" href="assets\/pasajeros-1-quebrada\.webp" fetchpriority="high" media="\(max-width: 720px\)">/,
    'falta la precarga del hero de mobile en index.html');
  assert.match(flota, /<link rel="preload" as="image" href="assets\/pasajeros-5-flota\.webp" fetchpriority="high">/,
    'falta la precarga del encabezado en flota-en-venta.html');
  for (const foto of ['hero-flota-paisaje.webp', 'pasajeros-1-quebrada.webp']) {
    assert.ok(css.includes(`assets/${foto}`), `la CSS ya no usa ${foto}: actualizar la precarga`);
  }
});

// Los tokens de verificación de los buscadores no son decoración: Bing y
// Google los revalidan cada tanto y, si desaparecen, se pierde el acceso a las
// herramientas para webmasters (y con él los datos de rastreo). El de Bing es
// un meta en la portada; el de Google, un archivo suelto en la raíz.
test('los tokens de verificación de Bing y Google siguen en el sitio', () => {
  assert.ok(index.includes('<meta name="msvalidate.01" content="3A66C4DA67522FB30ABB2560CC0FDEC2" />'),
    'se borró el meta msvalidate.01 de Bing Webmaster Tools de la portada');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'google40eac84837fa77f1.html')),
    'se borró el archivo de verificación de Google Search Console');
});

test('las redirecciones no tienen un comodín que tape páginas reales', () => {
  const reglas = redirects.split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  for (const regla of reglas) {
    const origen = regla.split(/\s+/)[0];
    assert.notStrictEqual(origen, '/*', 'hay un comodín /* que pisa todo el sitio');
    assert.ok(origen !== '/' && origen !== '/flota-en-venta.html',
      `hay una regla que pisa una página real: ${regla}`);
  }
});
