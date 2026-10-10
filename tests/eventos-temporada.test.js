// Páginas de eventos y temporada (10/10/2026): la carrera de trail de Jujuy,
// el traslado al Tren a las Nubes, Semana Santa y la Fiesta del Milagro.
// Las reglas salen del blueprint de páginas de eventos
// (~/lausof/web/growth-2026-10/02-event-pages-rules-blueprint.md §6.2, §7.4,
// §7.6 y §7.9): WebPage + Service + BreadcrumbList sin Event, fecha de
// actualización única, migas visibles, aviso de independencia, nombres sólo
// en texto, sin precios, fotos propias, enlaces con la página madre y fechas
// con el día de la semana correcto. El hreflang, el sitemap y el inglés los
// vigilan tests/ingles.test.js y tests/paginas.test.js.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, sitemap, sinComentarios, urlDe } = require('./util.js');

// Una fila por página: idioma, página madre (la de las migas) y la palabra
// que el mensaje pre-armado de WhatsApp tiene que nombrar.
const eventos = [
  { archivo: 'traslados-trail-jujuy-utmb.html', idioma: 'es', madre: 'clubes-deportivos.html', wa: /carrera de trail de Jujuy \(31\/3 al 4\/4\/2027\)/ },
  { archivo: 'traslado-tren-a-las-nubes.html', idioma: 'es', madre: 'turismo.html', wa: /pasaje Solo Tren .*San Antonio de los Cobres/, sinFechas: true },
  { archivo: 'semana-santa-salta-jujuy.html', idioma: 'es', madre: 'turismo.html', wa: /Semana Santa 2027/ },
  { archivo: 'traslados-fiesta-del-milagro.html', idioma: 'es', madre: 'peregrinaciones-eventos.html', wa: /peregrinos al Milagro 2027/ },
  { archivo: 'en/jujuy-utmb-trail-race-transfers.html', idioma: 'en', madre: 'en/tours-and-transfers.html', wa: /Jujuy trail race \(March 31 to April 4, 2027\)/ },
  { archivo: 'en/train-to-the-clouds-transfer.html', idioma: 'en', madre: 'en/tours-and-transfers.html', wa: /train-only ticket .*San Antonio de los Cobres/, sinFechas: true },
  { archivo: 'en/holy-week-salta-jujuy.html', idioma: 'en', madre: 'en/tours-and-transfers.html', wa: /Holy Week 2027/ },
];

// Lo que el visitante ve: sin comentarios, sin scripts ni estilos, sin
// etiquetas. Los atributos (href, alt) quedan afuera.
const textoVisible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

const grafo = (html) => {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.strictEqual(bloques.length, 1, 'se espera un único bloque JSON-LD');
  return JSON.parse(bloques[0][1])['@graph'];
};

// Cómo se enlaza un archivo desde otro: las páginas en español usan rutas
// relativas a la raíz; las de /en/, rutas absolutas.
const enlaceA = (desde, hacia) => (desde.startsWith('en/') ? `/${hacia}` : hacia);

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIAS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

for (const { archivo, idioma, madre, wa, sinFechas } of eventos) {
  const html = paginas[archivo];
  const visible = textoVisible(html || '');
  const canonica = urlDe(archivo);

  test(`${archivo}: existe y su canónica es la propia`, () => {
    assert.ok(html, `falta ${archivo}`);
    assert.ok(html.includes(`<link rel="canonical" href="${canonica}">`), `la canónica de ${archivo} no es ${canonica}`);
  });

  test(`${archivo}: JSON-LD con WebPage + Service + BreadcrumbList, sin Event ni FAQPage`, () => {
    const nodos = grafo(html);
    assert.deepStrictEqual(nodos.map((n) => n['@type']).sort(), ['BreadcrumbList', 'Service', 'WebPage']);
    assert.doesNotMatch(JSON.stringify(nodos),
      /"(Event|SportsEvent|MusicEvent|Festival|FAQPage|Offer|Review|AggregateRating|TouristTrip)"/);
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    const servicio = nodos.find((n) => n['@type'] === 'Service');
    assert.strictEqual(pagina.name, html.match(/<title>([^<]*)<\/title>/)[1], 'el WebPage no repite el <title>');
    assert.strictEqual(pagina.description, html.match(/<meta name="description" content="([^"]*)">/)[1],
      'el WebPage no repite la meta description');
    assert.strictEqual(pagina.inLanguage, idioma);
    assert.strictEqual(pagina.url, canonica);
    assert.strictEqual(pagina.mainEntity['@id'], servicio['@id'], 'el WebPage no apunta al Service');
    assert.strictEqual(servicio.url, canonica);
    assert.strictEqual(servicio.provider['@id'], 'https://www.lausof.com/#empresa');
    assert.ok(!servicio.provider.taxID, 'el Service redefine la ficha de la empresa');
  });

  test(`${archivo}: dateModified = "Actualizado" visible = lastmod del sitemap`, () => {
    const pagina = grafo(html).find((n) => n['@type'] === 'WebPage');
    const act = sinComentarios(html).match(/(?:Actualizado el|Updated) <time datetime="(\d{4}-\d{2}-\d{2})">/);
    assert.ok(act, 'falta la fecha de actualización visible');
    const lastmod = sitemap.match(new RegExp(
      `<loc>${canonica.replace(/[.]/g, '\\.')}</loc>\\s*<lastmod>([^<]*)</lastmod>`));
    assert.ok(lastmod, `${archivo} no está en el sitemap con lastmod`);
    assert.strictEqual(pagina.dateModified, act[1]);
    assert.strictEqual(lastmod[1], act[1]);
  });

  test(`${archivo}: las migas visibles coinciden con el BreadcrumbList`, () => {
    const migas = grafo(html).find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    assert.strictEqual(migas.length, 3, 'se esperan tres niveles: inicio, página madre y esta');
    const nav = sinComentarios(html).match(/<nav class="migas"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, 'falta la ruta de navegación visible');
    for (const { name } of migas) assert.ok(nav[1].includes(name), `las migas visibles no muestran "${name}"`);
    assert.strictEqual(migas[1].item, urlDe(madre), 'el segundo nivel no es la página madre');
    assert.strictEqual(migas[2].item, canonica);
    assert.ok(nav[1].includes(`href="${enlaceA(archivo, madre)}"`), 'las migas visibles no enlazan a la página madre');
  });

  test(`${archivo}: la página madre la enlaza y ella enlaza a la madre`, () => {
    assert.ok(paginas[madre].includes(`href="${enlaceA(madre, archivo)}"`), `${madre} no enlaza a ${archivo}`);
    assert.ok(html.includes(`href="${enlaceA(archivo, madre)}"`), `${archivo} no enlaza a ${madre}`);
  });

  // §6.2: aviso visible de que Lausof no organiza el evento ni vende las
  // entradas, junto a los datos del evento y con enlace a la fuente.
  test(`${archivo}: aviso de independencia visible, con enlace a la fuente`, () => {
    const aviso = sinComentarios(html).match(/<p class="recitales-aviso">([\s\S]*?)<\/p>/);
    assert.ok(aviso, 'falta el aviso junto a los datos del evento');
    assert.match(textoVisible(aviso[1]),
      idioma === 'es' ? /Lausof SRL es una empresa de transporte/ : /Lausof SRL is an? (independent )?transport company/);
    assert.match(textoVisible(aviso[1]), idioma === 'es' ? /no (organiza|opera)/i : /we do not (organize|operate)/i);
    assert.match(aviso[1], /href="https:\/\/|href="http:\/\//, 'el aviso no enlaza a la fuente de los datos');
    assert.match(textoVisible(aviso[1]), /10\/10\/2026|October 10, 2026/, 'el aviso no fecha la verificación');
  });

  test(`${archivo}: sin "oficial", sin afiliaciones y sin precios`, () => {
    assert.doesNotMatch(visible, /oficial|official|partner|autorizad|authori[sz]ed|sponsor|patrocin/i);
    assert.doesNotMatch(visible, /\$\s?\d|\bUSD\b|\bARS\b|€|R\$/, 'la página no publica precios');
  });

  test(`${archivo}: todas las fotos son propias y existen`, () => {
    for (const [, src] of sinComentarios(html).matchAll(/<img [^>]*src="([^"]+)"/g)) {
      assert.match(src, /^\/?assets\//, `imagen externa o fuera de assets/: ${src}`);
      assert.ok(fs.existsSync(path.join(__dirname, '..', src.replace(/^\//, ''))), `${src} no existe`);
    }
    const og = html.match(/<meta property="og:image" content="https:\/\/www\.lausof\.com\/([^"]+)">/);
    assert.ok(og, 'falta la og:image');
    assert.match(og[1], /\.jpg$/, 'la og:image va en JPEG');
    assert.ok(fs.existsSync(path.join(__dirname, '..', og[1])), `la og:image ${og[1]} no existe`);
    // La foto del encabezado es un <img> prioritario dentro del encabezado
    // (scripts/imagenes.mjs), no un fondo precargado.
    const cabeza = html.match(/<div class="page-head-photo" role="presentation">([\s\S]*?)<\/div>/);
    const img = cabeza && cabeza[1].match(/<img [^>]*src="([^"]+)"[^>]*>/);
    assert.ok(img, 'el encabezado no declara su foto');
    assert.match(img[0], /fetchpriority="high"/, 'la foto del encabezado no se pide con prioridad');
  });

  test(`${archivo}: cada WhatsApp pre-armado nombra el evento de la página`, () => {
    const textos = [...html.matchAll(/href="https:\/\/wa\.me\/5493875269009\?text=([^"]+)"/g)]
      .map((m) => decodeURIComponent(m[1]));
    assert.ok(textos.length >= 3, 'se esperan los WhatsApp de la barra, el encabezado y el cierre');
    for (const t of textos) assert.match(t, wa, `mensaje pre-armado inesperado: "${t}"`);
  });

  // Toda fecha escrita con su día de la semana es de 2027: si el día no
  // coincide con el calendario, la fecha está mal copiada.
  test(`${archivo}: cada fecha con día de la semana coincide con el calendario 2027`, () => {
    const vistas = [];
    if (idioma === 'es') {
      const patron = new RegExp(`\\b(${DIAS_ES.join('|')}) (\\d{1,2}) de (${MESES_ES.join('|')})`, 'gi');
      for (const [entera, dia, num, mes] of visible.matchAll(patron)) {
        const fecha = new Date(Date.UTC(2027, MESES_ES.indexOf(mes.toLowerCase()), Number(num)));
        assert.strictEqual(DIAS_ES[fecha.getUTCDay()], dia.toLowerCase(), `fecha mal escrita: "${entera}"`);
        vistas.push(entera);
      }
    } else {
      const patron = new RegExp(`\\b(${DIAS_EN.join('|')}), (${MESES_EN.join('|')}) (\\d{1,2})`, 'g');
      for (const [entera, dia, mes, num] of visible.matchAll(patron)) {
        const fecha = new Date(Date.UTC(2027, MESES_EN.indexOf(mes), Number(num)));
        assert.strictEqual(DIAS_EN[fecha.getUTCDay()], dia, `fecha mal escrita: "${entera}"`);
        vistas.push(entera);
      }
    }
    // El tren sale todo el año: su página no fecha días sueltos.
    if (!sinFechas) assert.ok(vistas.length >= 1, 'la página no tiene ninguna fecha con día de la semana');
  });

  test(`${archivo}: los tiempos de manejo se declaran aproximados`, () => {
    if (idioma === 'es') {
      for (const t of visible.match(/de manejo[^.]*/g) || []) {
        assert.match(t, /aproximad/, `tiempo de manejo sin "aproximado": "${t}"`);
      }
    } else if (/of driving/.test(visible)) {
      assert.match(visible, /approximate/, 'la página da tiempos de manejo y no dice que son aproximados');
    }
  });
}

// La Fiesta del Milagro se publica sólo en español (sin demanda en inglés
// a la vista): su selector de idioma va a la portada inglesa.
test('traslados-fiesta-del-milagro.html: sin gemela, el selector va a /en/', () => {
  const html = paginas['traslados-fiesta-del-milagro.html'];
  assert.match(html, /<a class="lang-switch" href="\/en\/"/);
  assert.doesNotMatch(sinComentarios(html), /hreflang="(es|x-default)"/);
});

// La razón de ser de la página del tren: el pasaje Solo Tren no incluye el
// traslado. Si el tren cambia sus modalidades, esta página se reescribe.
test('traslado-tren-a-las-nubes.html: nombra las dos modalidades y el horario de la estación', () => {
  const visible = textoVisible(paginas['traslado-tren-a-las-nubes.html']);
  assert.match(visible, /Bus-Tren-Bus/);
  assert.match(visible, /Solo Tren/);
  assert.match(visible, /no incluye el traslado/);
  assert.match(visible, /11:40/);
  assert.match(visible, /14:45/);
});

test('traslados-trail-jujuy-utmb.html: dice que la inscripción no incluye el traslado a las largadas', () => {
  for (const archivo of ['traslados-trail-jujuy-utmb.html', 'en/jujuy-utmb-trail-race-transfers.html']) {
    const visible = textoVisible(paginas[archivo]);
    assert.match(visible, /no incluye el traslado a las largadas|does not include transport to the start/, archivo);
  }
});
