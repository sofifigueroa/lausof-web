// Sweep de contenido del 03/11/2026 (~/lausof/web/sweep-2026-11-03/04-content-seo.md):
//   - Dos páginas nuevas en español y en inglés: el traslado desde el
//     aeropuerto de Salta (SLA) y la combi con chofer por día.
//   - Salinas Grandes y Cachi responden la distancia y el tiempo desde Salta
//     en el título, la descripción y el primer párrafo (las búsquedas de
//     "distancia salta a ..." no hacían clic).
//   - El título de la portada para las búsquedas de grúa, la respuesta en el
//     día en la 4x4 en español, los enlaces ruta → hub de feriados y hub →
//     UTMB, las fiestas nuevas del hub y el enlace a las reseñas reales de
//     Google (sin marcado de reseñas).
// Las filas fechadas de Semana Santa y UTMB las cubre tests/vigencia.test.js.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, pares, sitemap, urlDe, sinComentarios, DOMINIO } = require('./util.js');

const raiz = path.join(__dirname, '..');
const NUEVAS = {
  'traslado-aeropuerto-salta.html': 'en/salta-airport-transfer.html',
  'alquiler-combi-con-chofer-salta.html': 'en/minibus-with-driver-salta.html',
};
const todas = [...Object.keys(NUEVAS), ...Object.values(NUEVAS)];
const esIngles = (n) => n.startsWith('en/');
// Desde el 03/11 todas las páginas enlazan desde la raíz (scripts/rutas-raiz.mjs).
const enlace = (desde, hacia) => `/${hacia}`;
const HUB = 'feriados-fines-de-semana-largos.html';
const RESENAS = 'https://www.google.com/maps?cid=13700114490953273065';

const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

const grafo = (html) => {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.strictEqual(bloques.length, 1, 'se espera un solo bloque JSON-LD propio de la página');
  return JSON.parse(bloques[0][1])['@graph'];
};

const lastmodDe = (nombre) => {
  const m = sitemap.match(new RegExp(`<loc>${urlDe(nombre).replace(/[./]/g, '\\$&')}</loc>\\s*<lastmod>([^<]+)</lastmod>`));
  return m && m[1];
};

// Páginas de ruta en español, sacadas del mapa de pares: una ruta nueva entra sola.
const rutasEs = Object.keys(pares).filter((n) => /^(traslado-salta-|salinas-grandes-)/.test(n));

// La "respuesta en el día": en español, "en el día"; en inglés, "same business day".
const respuestaEnElDia = (nombre) => (esIngles(nombre) ? /same business day/ : /\ben el día\b/);

test('las dos páginas nuevas están en el mapa de pares y en el sitemap, en los dos idiomas', () => {
  for (const [es, en] of Object.entries(NUEVAS)) {
    assert.strictEqual(pares[es], en, `${es} no está en el mapa de pares`);
    for (const n of [es, en]) {
      assert.ok(fs.existsSync(path.join(raiz, n)), `falta ${n}`);
      assert.ok(lastmodDe(n), `${n} no está en el sitemap con lastmod`);
    }
  }
});

for (const nombre of todas) {
  const html = paginas[nombre];
  const en = esIngles(nombre);
  const gemela = en ? Object.keys(NUEVAS).find((k) => NUEVAS[k] === nombre) : NUEVAS[nombre];
  const [es, ing] = en ? [gemela, nombre] : [nombre, gemela];

  test(`${nombre}: canónica propia y hreflang recíproco con x-default al español`, () => {
    assert.ok(html.includes(`<link rel="canonical" href="${urlDe(nombre)}">`));
    for (const [lang, archivo] of [['es', es], ['en', ing], ['x-default', es]]) {
      assert.ok(html.includes(`<link rel="alternate" hreflang="${lang}" href="${urlDe(archivo)}">`),
        `${nombre}: falta el hreflang ${lang}`);
    }
  });

  test(`${nombre}: JSON-LD WebPage + Service + BreadcrumbList, igual a lo visible y sin reseñas ni eventos`, () => {
    const nodos = grafo(html);
    assert.deepStrictEqual(nodos.map((n) => n['@type']).sort(), ['BreadcrumbList', 'Service', 'WebPage']);
    assert.doesNotMatch(JSON.stringify(nodos), /"(Event|FAQPage|Offer|Review|AggregateRating|TouristTrip)"/);
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    const servicio = nodos.find((n) => n['@type'] === 'Service');
    const miga = nodos.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    assert.strictEqual(pagina.name, html.match(/<title>([^<]+)<\/title>/)[1]);
    assert.strictEqual(pagina.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
    assert.strictEqual(pagina.url, urlDe(nombre));
    assert.strictEqual(pagina.inLanguage, en ? 'en' : 'es');
    assert.strictEqual(pagina.about['@id'], `${DOMINIO}/#empresa`);
    assert.strictEqual(pagina.mainEntity['@id'], servicio['@id']);
    assert.strictEqual(servicio.provider['@id'], `${DOMINIO}/#empresa`);
    assert.ok(!servicio.provider.taxID, 'el Service redefine la empresa');
    const nav = sinComentarios(html).match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, 'falta la miga visible');
    const vistos = [...nav[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    assert.deepStrictEqual(vistos, miga.map((i) => i.name));
    assert.strictEqual(miga[1].item, urlDe(en ? 'en/tours-and-transfers.html' : 'turismo.html'));
  });

  test(`${nombre}: una sola fecha (dateModified, texto visible y lastmod no anterior)`, () => {
    const pagina = grafo(html).find((n) => n['@type'] === 'WebPage');
    const [a, m, d] = pagina.dateModified.split('-').map(Number);
    const meses = en
      ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      : ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    assert.ok(visible(html).includes(en ? `Updated ${meses[m - 1]} ${d}, ${a}` : `Actualizado el ${d} de ${meses[m - 1]} de ${a}`));
    assert.ok(lastmodDe(nombre) >= pagina.dateModified);
  });

  test(`${nombre}: sin precios, sin números de permiso, con la CNRT 60284 y la respuesta en el día`, () => {
    const texto = visible(html);
    assert.doesNotMatch(texto, /(US\$|USD|ARS|\$\s?\d|€)/, 'publica un precio');
    assert.doesNotMatch(texto, /\bAMT\b[^.]{0,20}(N\.?[º°o]\.?|No\.|#)\s*\d/i, 'publica un número de AMT');
    assert.match(texto, /CNRT (N\.º |license No\. )60284/);
    assert.match(texto, respuestaEnElDia(nombre), 'falta la respuesta en el día');
  });

  test(`${nombre}: los WhatsApp van pre-armados y nombran el servicio`, () => {
    const textos = [...html.matchAll(/href="https:\/\/wa\.me\/5493875269009\?text=([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
    assert.ok(textos.length >= 3, 'se esperan los WhatsApp del encabezado, el cierre y la barra');
    const servicio = nombre.includes('aeropuerto') || nombre.includes('airport') ? /aeropuerto|airport/ : /por día|by the day/;
    for (const t of textos) assert.match(t, servicio, `mensaje pre-armado inesperado: ${t}`);
  });

  test(`${nombre}: enlaza las reseñas reales de Google como enlace simple`, () => {
    assert.ok(html.includes(`href="${RESENAS}" target="_blank" rel="noopener"`), 'falta el enlace a las reseñas de Google');
  });

  test(`${nombre}: la reciben turismo (o tours), la portada de su idioma y las páginas de ruta`, () => {
    const origenes = en
      ? ['en/tours-and-transfers.html', 'en/index.html', ...rutasEs.map((r) => pares[r])]
      : ['turismo.html', 'index.html', ...rutasEs];
    // La portada en español enlaza las dos; la inglesa, al menos desde su índice de páginas.
    for (const origen of origenes) {
      assert.ok(sinComentarios(paginas[origen]).includes(`href="${enlace(origen, nombre)}"`), `${origen} no enlaza ${nombre}`);
    }
  });

  test(`${nombre}: todos los enlaces internos y las fotos resuelven`, () => {
    for (const [, href] of sinComentarios(html).matchAll(/\b(?:href|src)="([^"#?:]+\.(?:html|webp|png|css|js))(?:[?#][^"]*)?"/g)) {
      const archivo = href.startsWith('/') ? href.slice(1) : path.posix.join(path.posix.dirname(nombre), href);
      assert.ok(fs.existsSync(path.join(raiz, archivo)), `${nombre}: ${href} no existe`);
    }
  });
}

// Las búsquedas de distancia a Salinas Grandes y a Cachi encuentran el dato en
// el resultado: título, descripción y primer párrafo, en los dos idiomas.
const distancias = {
  'salinas-grandes-desde-salta.html': /255 km/,
  'en/salinas-grandes-from-salta.html': /255 km/,
  'traslado-salta-cachi.html': /157 km/,
  'en/salta-to-cachi-transfer.html': /157 km/,
};
for (const [nombre, km] of Object.entries(distancias)) {
  test(`${nombre}: la distancia y el tiempo desde Salta van en el título, la descripción y el primer párrafo`, () => {
    const html = paginas[nombre];
    const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="([^"]+)">/)[1];
    const lead = visible(html.match(/<p class="lead">([\s\S]*?)<\/p>/)[1]);
    for (const [donde, texto] of [['título', titulo], ['descripción', desc], ['primer párrafo', lead]]) {
      assert.match(texto, km, `${nombre}: el ${donde} no dice la distancia`);
      assert.match(texto, /\d h\b|\d Hours\b/, `${nombre}: el ${donde} no dice el tiempo`);
    }
    // El dato es el mismo que la tabla de la página, con su fuente.
    assert.match(visible(html), /Google Maps|Ruta0/);
  });
}

test('la portada: el título abre con las grúas 24 hs y la descripción da la guardia y el teléfono', () => {
  const html = paginas['index.html'];
  const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
  const desc = html.match(/<meta name="description" content="([^"]+)">/)[1];
  assert.match(titulo, /^Grúas 24 hs en Salta/);
  assert.match(desc, /24 hs, todos los días/);
  assert.match(desc, /387 526-9009/);
  assert.strictEqual(html.match(/<meta property="og:description" content="([^"]+)">/)[1], desc);
});

test('alquiler-4x4.html: promete la respuesta en el día, como su gemela inglesa', () => {
  assert.match(visible(paginas['alquiler-4x4.html']), /\ben el día\b/);
  assert.match(visible(paginas['en/4x4-rental.html']), /same business day/);
});

test('cada página de ruta en español enlaza el hub de feriados', () => {
  assert.ok(rutasEs.length > 0);
  for (const ruta of rutasEs) {
    assert.ok(sinComentarios(paginas[ruta]).includes(`href="/${HUB}"`), `${ruta} no enlaza el hub`);
  }
});

test('el hub de feriados enlaza la página de UTMB y la combi por día', () => {
  const html = sinComentarios(paginas[HUB]);
  assert.ok(html.includes('href="/traslados-trail-jujuy-utmb.html"'));
  assert.ok(html.includes('href="/alquiler-combi-con-chofer-salta.html"'));
});

// Fiestas del hub: con fecha sólo si hay fuente; si no, "a confirmar". Nunca
// una fecha 2027 inventada.
test('el hub nombra las fiestas de diciembre a febrero, con fecha verificada o a confirmar', () => {
  const html = sinComentarios(paginas[HUB]);
  const tarjeta = (titulo) => {
    const m = html.match(new RegExp(`<b>${titulo}</b>([\\s\\S]*?)</div>`));
    assert.ok(m, `el hub no tiene la tarjeta "${titulo}"`);
    return visible(m[1]);
  };
  assert.match(tarjeta('Festival Provincial de los 7 Colores'), /Domingo 6 de diciembre de 2026/);
  assert.match(tarjeta('Enero Tilcareño'), /2027, a confirmar/);
  assert.match(tarjeta('Festival de la Tradición Calchaquí, en Cachi'), /2027, a confirmar/);
  assert.match(tarjeta('Carnaval 2027 en la ciudad de Salta'), /a confirmar/);
  const aviso = visible(html.slice(html.indexOf('id="eventos"')).match(/<p class="recitales-aviso">([\s\S]*?)<\/p>/)[1]);
  assert.match(aviso, /03\/11\/2026/, 'las fuentes de las fiestas no están fechadas');
  for (const fuente of ['turismo.jujuy.gob.ar', 'todojujuy.com', 'culturasalta.gov.ar']) {
    assert.ok(html.includes(fuente), `falta la fuente ${fuente}`);
  }
});

// Reseñas: un enlace al perfil real, nunca marcado de reseñas ni citas.
test('las reseñas de Google se enlazan desde la zona de confianza, sin marcado de reseñas en ningún lado', () => {
  for (const nombre of ['index.html', 'en/index.html', 'turismo.html', 'en/tours-and-transfers.html']) {
    assert.ok(paginas[nombre].includes(`href="${RESENAS}"`), `${nombre} no enlaza las reseñas`);
  }
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      assert.doesNotMatch(json, /"(Review|AggregateRating|reviewRating|ratingValue)"/, `${nombre} declara reseñas en el JSON-LD`);
    }
  }
});
