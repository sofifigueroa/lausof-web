// Páginas de eventos y fines de semana largos (ola del 10/10/2026): el hub de
// feriados, Carnaval de la Quebrada (ES + EN) y Serenata a Cafayate. Siguen el
// molde de charter-recitales.html y las reglas del blueprint de páginas de
// eventos (~/lausof/web/growth-2026-10/02-event-pages-rules-blueprint.md):
// WebPage + Service + BreadcrumbList sin Event, migas visibles, filas fechadas
// que /js/vigencia.js pasa a "Fechas anteriores" al vencer (nunca las
// esconde; ver tests/vigencia.test.js), aviso de independencia junto a las
// fechas, tiempos de manejo declarados aproximados, enlaces de ida y vuelta
// con el hub y fechas coherentes entre JSON-LD, texto y sitemap.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, sitemap, index, sinComentarios, pares } = require('./util.js');

const HUB = 'feriados-fines-de-semana-largos.html';
const CARNAVAL = 'traslado-carnaval-quebrada-de-humahuaca.html';
const CARNAVAL_EN = 'en/transfer-carnival-quebrada-de-humahuaca.html';
const SERENATA = 'traslado-serenata-a-cafayate.html';
const nuevas = [HUB, CARNAVAL, CARNAVAL_EN, SERENATA];
const eventos = [CARNAVAL, CARNAVAL_EN, SERENATA];

const DIAS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MESES_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const esIngles = (nombre) => nombre.startsWith('en/');
const urlDe = (nombre) => `https://www.lausof.com/${nombre}`;

// "sáb 6" / "Sat, Feb 6": el comienzo del <time> tiene que nombrar bien el
// día de la semana de su datetime.
const etiquetaDe = (fecha, ingles) => {
  const [a, m, d] = fecha.split('-').map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return ingles ? `${DIAS_EN[dia]}, ${MESES_EN[m - 1]} ${d}` : `${DIAS_ES[dia]} ${d}`;
};

const filasDe = (html) => {
  const visible = sinComentarios(html);
  const lista = visible.slice(visible.indexOf('data-vigencia>'), visible.indexOf('</ol>', visible.indexOf('data-vigencia>')));
  return [...lista.matchAll(/<li data-hasta="([^"]*)">([\s\S]*?)<\/li>/g)]
    .map(([, hasta, cuerpo]) => ({ hasta, cuerpo }));
};

const nodosDe = (html) => {
  // Sólo el bloque propio de la página: la ficha de la empresa va aparte, en
  // el bloque id="empresa" que escribe scripts/empresa.mjs (tests/empresa.test.js).
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.strictEqual(bloques.length, 1, 'se esperaba un solo bloque JSON-LD');
  return JSON.parse(bloques[0][1])['@graph'];
};

for (const nombre of nuevas) {
  const html = paginas[nombre];
  const visible = () => sinComentarios(html);
  const ingles = esIngles(nombre);

  test(`${nombre}: existe y carga vigencia.js una vez, con ruta absoluta y versión`, () => {
    assert.ok(html, `falta ${nombre}`);
    const usos = html.match(/<script defer src="\/js\/vigencia\.js\?v=\d+"><\/script>/g) || [];
    assert.strictEqual(usos.length, 1);
  });

  test(`${nombre}: JSON-LD WebPage + Service + BreadcrumbList, sin Event ni FAQPage`, () => {
    const nodos = nodosDe(html);
    assert.deepStrictEqual(nodos.map((n) => n['@type']).sort(), ['BreadcrumbList', 'Service', 'WebPage']);
    assert.doesNotMatch(JSON.stringify(nodos), /"(Event|MusicEvent|Festival|FAQPage|Offer|Review|AggregateRating|TouristTrip)"/);
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    const servicio = nodos.find((n) => n['@type'] === 'Service');
    assert.strictEqual(servicio.provider['@id'], 'https://www.lausof.com/#empresa');
    assert.strictEqual(pagina.url, urlDe(nombre));
    assert.strictEqual(pagina.inLanguage, ingles ? 'en' : 'es');
    assert.strictEqual(pagina.mainEntity['@id'], servicio['@id']);
    assert.strictEqual(pagina.name, html.match(/<title>([^<]*)<\/title>/)[1]);
    assert.strictEqual(pagina.description, html.match(/<meta name="description" content="([^"]*)">/)[1]);
  });

  test(`${nombre}: las migas visibles coinciden con el BreadcrumbList y cierran en la propia página`, () => {
    const migas = nodosDe(html).find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    const nav = visible().match(/<nav class="migas"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, 'falta la ruta de navegación visible');
    for (const { name } of migas) assert.ok(nav[1].includes(name), `las migas visibles no muestran "${name}"`);
    assert.strictEqual(migas[migas.length - 1].item, urlDe(nombre));
    assert.ok(migas.length >= 2);
  });

  test(`${nombre}: dateModified = "Actualizado" visible = lastmod del sitemap`, () => {
    const pagina = nodosDe(html).find((n) => n['@type'] === 'WebPage');
    const act = visible().match(ingles
      ? /Updated on <time datetime="(\d{4}-\d{2}-\d{2})">/
      : /Actualizado el <time datetime="(\d{4}-\d{2}-\d{2})">/);
    assert.ok(act, 'falta la fecha de actualización visible');
    const loc = urlDe(nombre).replace(/[./]/g, '\\$&');
    const lastmod = sitemap.match(new RegExp(`<loc>${loc}</loc>\\s*<lastmod>([^<]*)</lastmod>`));
    assert.ok(lastmod, `${nombre} no está en el sitemap con lastmod`);
    assert.strictEqual(pagina.dateModified, act[1]);
    // El lastmod sale de git (scripts/lastmod.mjs) y la fecha visible es la de la
    // última revisión del contenido: el lastmod puede ser posterior, nunca anterior.
    assert.ok(lastmod[1] >= act[1], `lastmod ${lastmod[1]} anterior a la fecha visible ${act[1]}`);
  });

  test(`${nombre}: filas fechadas válidas, en orden, con el día de la semana correcto`, () => {
    const filas = filasDe(html);
    assert.ok(filas.length >= 3, 'la lista de fechas quedó casi vacía');
    assert.match(visible(), nombre === HUB ? /data-sin-proximos hidden>/ : /data-edicion-pasada hidden/,
      'falta el aviso para cuando no queda ninguna fecha');
    for (const { hasta, cuerpo } of filas) {
      assert.match(hasta, /^\d{4}-\d{2}-\d{2}$/, `data-hasta mal escrito: "${hasta}"`);
      const t = cuerpo.match(/<time datetime="(\d{4}-\d{2}-\d{2})">([^<]*)<\/time>/);
      assert.ok(t, `la fila ${hasta} no tiene <time>`);
      assert.ok(t[1] <= hasta, `la fila ${hasta} empieza después de terminar (${t[1]})`);
      assert.ok(t[2].startsWith(etiquetaDe(t[1], ingles)),
        `la fila ${hasta} dice "${t[2]}" y su primer día es ${etiquetaDe(t[1], ingles)}`);
    }
    const fechas = filas.map((f) => f.hasta);
    assert.deepStrictEqual(fechas, [...fechas].sort(), 'las filas no van en orden de fecha');
  });

  test(`${nombre}: cada fila cotiza por WhatsApp a la línea del sitio con un mensaje propio`, () => {
    const filas = filasDe(html);
    const mensajes = new Set();
    for (const { hasta, cuerpo } of filas) {
      const wa = cuerpo.match(/href="https:\/\/wa\.me\/5493875269009\?text=([^"]+)"/);
      assert.ok(wa, `la fila ${hasta} no tiene el WhatsApp de la línea del sitio`);
      const texto = decodeURIComponent(wa[1]);
      assert.match(texto, ingles ? /^Hello Lausof, I would like a quote/ : /^Hola Lausof, quiero cotizar una combi /);
      mensajes.add(texto);
    }
    assert.strictEqual(mensajes.size, filas.length, 'dos filas comparten el mismo mensaje pre-armado');
  });

  test(`${nombre}: sin precios y con los tiempos de manejo declarados aproximados`, () => {
    const texto = visible().replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(texto, /(\$|US\$|ARS)\s?\d/, 'la página no publica precios');
    const tiempos = texto.match(/\b\d h(?: \d{2})?\b[^.]*/g) || [];
    assert.ok(tiempos.length >= 1, 'faltan los tiempos de manejo');
    for (const t of tiempos) {
      assert.match(t, ingles ? /estimate/ : /aproximado/, `tiempo de manejo sin aclarar que es estimado: "${t}"`);
    }
  });
}

// Reglas de nombre e independencia (blueprint §6.2 y §7.9): las páginas de
// evento llevan el aviso junto a las fechas, no usan "oficial" en relación al
// evento y no muestran logos ni afiches (sólo fotos propias de Lausof).
for (const nombre of eventos) {
  const html = paginas[nombre];
  const ingles = esIngles(nombre);
  const fechas = sinComentarios(html).slice(html.indexOf('data-vigencia>'));
  const seccion = fechas.slice(0, fechas.indexOf('</section>'));

  test(`${nombre}: aviso de independencia en la sección de fechas`, () => {
    assert.match(seccion, ingles
      ? /<b>Lausof SRL is an independent transport company\.<\/b> We do not organize/
      : /<b>Lausof SRL es una empresa de transporte independiente\.<\/b> No organiza/);
  });

  test(`${nombre}: sin "oficial" y con imágenes sólo de Lausof`, () => {
    const visible = sinComentarios(html).replace(/<a\b[^>]*>/g, '<a>');
    assert.doesNotMatch(visible.replace(/<[^>]+>/g, ' '), ingles ? /\bofficial\b/i : /\boficial\b/i);
    for (const [img] of sinComentarios(html).matchAll(/<img [^>]*>/g)) {
      const src = img.match(/src="([^"]+)"/)[1];
      assert.match(src, /\/?assets\/(galeria|charter|logo-)/, `imagen ajena al banco de fotos propio: ${src}`);
      assert.ok(fs.existsSync(path.join(__dirname, '..', src.replace(/^\//, ''))), `no existe ${src}`);
    }
  });

  test(`${nombre}: og:image es un recorte JPEG propio de 1200×630 que existe`, () => {
    const og = html.match(/<meta property="og:image" content="https:\/\/www\.lausof\.com\/(assets\/[^"]+\.jpg)">/);
    assert.ok(og, 'og:image no es un JPEG del sitio');
    assert.ok(fs.existsSync(path.join(__dirname, '..', og[1])), `no existe ${og[1]}`);
    assert.match(html, /<meta property="og:image:width" content="1200">/);
    assert.match(html, /<meta property="og:image:height" content="630">/);
  });
}

// Enlaces: el hub cuelga de la portada, enlaza cada página de evento y cada
// página de evento vuelve al hub (blueprint §3.3 y §7.9 punto 25). Las páginas
// madre (turismo, recitales) enlazan las nuevas.
test('la portada enlaza el hub de feriados', () => {
  assert.ok(index.includes('href="feriados-fines-de-semana-largos.html"'), 'la portada no enlaza el hub');
});

test('el hub enlaza cada página de evento y cada una vuelve al hub', () => {
  for (const nombre of [CARNAVAL, SERENATA]) {
    assert.ok(paginas[HUB].includes(`href="${nombre}"`), `el hub no enlaza ${nombre}`);
    assert.ok(paginas[nombre].includes(`href="${HUB}"`), `${nombre} no vuelve al hub`);
  }
});

test('turismo y recitales enlazan el hub y las dos páginas de evento', () => {
  for (const madre of ['turismo.html', 'charter-recitales.html']) {
    for (const nombre of [HUB, CARNAVAL, SERENATA]) {
      assert.ok(paginas[madre].includes(`href="${nombre}"`), `${madre} no enlaza ${nombre}`);
    }
  }
  assert.ok(paginas['en/tours-and-transfers.html'].includes(`href="/${CARNAVAL_EN}"`),
    'la página de turismo en inglés no enlaza el carnaval en inglés');
});

test('enlaces internos de las páginas nuevas apuntan a archivos que existen', () => {
  for (const nombre of nuevas) {
    for (const [, href] of sinComentarios(paginas[nombre]).matchAll(/<a\b[^>]*\bhref="([^"#:?]+\.html)(?:#[^"]*)?"/g)) {
      const archivo = href.replace(/^\//, '');
      assert.ok(fs.existsSync(path.join(__dirname, '..', archivo)), `${nombre} enlaza ${href}, que no existe`);
    }
  }
});

// Gemelas: el carnaval tiene versión en inglés (público extranjero en el
// carnaval según el Ministerio de Cultura y Turismo de Jujuy); la Serenata y
// el hub no la tienen.
test('sólo el carnaval tiene gemela inglesa entre las páginas nuevas', () => {
  assert.strictEqual(pares[CARNAVAL], CARNAVAL_EN);
  assert.ok(!pares[SERENATA] && !pares[HUB]);
});

// Hub: las filas de 2027 que salen de la regla de traslado (y no de un
// feriado fijo) se declaran a confirmar, nunca como confirmadas.
test('hub: los feriados trasladables de 2027 se marcan a confirmar', () => {
  const filas = filasDe(paginas[HUB]);
  for (const hasta of ['2027-06-21', '2027-08-16', '2027-10-11']) {
    const fila = filas.find((f) => f.hasta === hasta);
    assert.ok(fila, `falta la fila ${hasta}`);
    assert.match(fila.cuerpo, /a confirmar/, `la fila ${hasta} no avisa que sale de la regla`);
  }
  for (const { hasta, cuerpo } of filas) {
    if (hasta >= '2027-01-01') assert.doesNotMatch(cuerpo, /calendario oficial/, `la fila ${hasta} se atribuye al calendario oficial`);
  }
});
