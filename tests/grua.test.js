// Grúa y auxilio mecánico 24 hs (03/11/2026, carril web-grua-1103).
// Las búsquedas de grúa son el 70 % de las impresiones de Google del sitio y
// todas caían en la portada (seo-deep-2026-11-03/B-segments-expansion.md §0.1).
//   - Par nuevo: grua-salta.html ↔ en/tow-truck-salta.html, con la Puna como
//     sección (#puna) y no como página aparte (sin demanda en Search Console).
//   - El botón de llamar va primero; el WhatsApp va pre-armado con ubicación,
//     vehículo y qué pasó.
//   - Portada: enlace desde la tarjeta de auxilio a la página nueva. Desde el
//     03/11/2026 (decisión de Lautaro) la portada abre con el transporte de
//     pasajeros: el botón de llamada a la grúa salió del hero y la llamada
//     24 hs vive en la tarjeta de auxilio. Esta página toma las búsquedas de
//     grúa, también en plural, con remolques y auxilio mecánico.
// Lo que estas páginas no pueden decir: precios, número de AMT, capacidad en
// toneladas (la cifra salía del Accelo 1016, vendido ~24/10), grúa para
// camiones pesados (no hay unidad en el archivo) ni otra línea que el 526-9009.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, pares, sitemap, redirects, urlDe, sinComentarios, DOMINIO } = require('./util.js');

const raiz = path.join(__dirname, '..');
const ES = 'grua-salta.html';
const EN = 'en/tow-truck-salta.html';
const TEL = 'tel:+5493875269009';

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

const enlacesDe = (fragmento) => [...fragmento.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map((m) => m[1]);

test('el par de grúa está en el mapa de pares, en el sitemap y con su 301 sin .html', () => {
  assert.strictEqual(pares[ES], EN);
  for (const n of [ES, EN]) {
    assert.ok(fs.existsSync(path.join(raiz, n)), `falta ${n}`);
    assert.match(sitemap, new RegExp(`<loc>${urlDe(n).replace(/[./]/g, '\\$&')}</loc>\\s*<lastmod>\\d{4}-\\d{2}-\\d{2}</lastmod>`),
      `${n} no está en el sitemap con lastmod`);
    const sinHtml = `/${n.replace(/\.html$/, '')}`;
    assert.match(redirects, new RegExp(`^${sinHtml.replace(/[./-]/g, '\\$&')}\\s+/${n.replace(/[./-]/g, '\\$&')}\\s+301!$`, 'm'),
      `falta el 301 de ${sinHtml}`);
  }
});

for (const nombre of [ES, EN]) {
  const html = paginas[nombre];
  const en = nombre === EN;
  const texto = visible(html);

  test(`${nombre}: canónica propia y hreflang recíproco con x-default al español`, () => {
    assert.ok(html.includes(`<link rel="canonical" href="${urlDe(nombre)}">`));
    for (const [lang, archivo] of [['es', ES], ['en', EN], ['x-default', ES]]) {
      assert.ok(html.includes(`<link rel="alternate" hreflang="${lang}" href="${urlDe(archivo)}">`),
        `${nombre}: falta el hreflang ${lang}`);
    }
  });

  test(`${nombre}: JSON-LD WebPage + Service + BreadcrumbList, igual a lo visible, con la guardia 24 hs y #empresa`, () => {
    const nodos = grafo(html);
    assert.deepStrictEqual(nodos.map((n) => n['@type']).sort(), ['BreadcrumbList', 'Service', 'WebPage']);
    assert.doesNotMatch(JSON.stringify(nodos), /"(Event|FAQPage|Offer|Review|AggregateRating|priceRange|price)"/);
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
    // La guardia del JSON-LD es la misma que dice el texto: 24 hs, los 7 días.
    const horas = servicio.hoursAvailable;
    assert.strictEqual(horas.dayOfWeek.length, 7);
    assert.strictEqual(horas.opens, '00:00');
    assert.strictEqual(horas.closes, '23:59');
    assert.match(texto, en ? /24 hours a day, every day/ : /24 horas, todos los días del año/);
    // La miga visible y la del JSON-LD dicen lo mismo, y arranca en la portada de su idioma.
    const nav = sinComentarios(html).match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, 'falta la miga visible');
    const vistos = [...nav[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    assert.deepStrictEqual(vistos, miga.map((i) => i.name));
    assert.strictEqual(miga[0].item, urlDe(en ? 'en/index.html' : 'index.html'));
  });

  test(`${nombre}: una sola fecha (dateModified, texto visible y lastmod no anterior)`, () => {
    const pagina = grafo(html).find((n) => n['@type'] === 'WebPage');
    const [a, m, d] = pagina.dateModified.split('-').map(Number);
    const meses = en
      ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      : ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    assert.ok(texto.includes(en ? `Updated ${meses[m - 1]} ${d}, ${a}` : `Actualizado el ${d} de ${meses[m - 1]} de ${a}`));
    const lastmod = sitemap.match(new RegExp(`<loc>${urlDe(nombre).replace(/[./]/g, '\\$&')}</loc>\\s*<lastmod>([^<]+)</lastmod>`))[1];
    assert.ok(lastmod >= pagina.dateModified);
  });

  test(`${nombre}: el primer botón del encabezado llama a la grúa y la barra móvil también arranca con Llamar`, () => {
    const ctas = sinComentarios(html).match(/<section class="page-head"[\s\S]*?<div class="ctas">([\s\S]*?)<\/div>/);
    assert.ok(ctas, 'el encabezado no tiene botones');
    const botones = enlacesDe(ctas[1]);
    assert.strictEqual(botones[0], TEL, 'el primer botón del encabezado no es la llamada');
    assert.ok(botones.some((h) => h.startsWith('https://wa.me/5493875269009?text=')), 'falta el WhatsApp en el encabezado');
    const barra = sinComentarios(html).match(/<div class="wa-bar"[^>]*>([\s\S]*?)<\/div>/);
    assert.strictEqual(enlacesDe(barra[1])[0], TEL);
    // El teléfono se lee en el encabezado: quien está varado lo puede anotar.
    assert.match(visible(ctas[1]), /387 526-9009/);
  });

  test(`${nombre}: todo WhatsApp pre-armado pide ubicación, vehículo y qué pasó`, () => {
    const textos = [...html.matchAll(/href="https:\/\/wa\.me\/5493875269009\?text=([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
    assert.ok(textos.length >= 4, 'se esperan los WhatsApp del encabezado, el pedido, el cierre y la barra');
    const campos = en ? ['Location:', 'Vehicle:', 'What happened:'] : ['Ubicación:', 'Vehículo:', 'Qué pasó:'];
    for (const t of textos) {
      for (const campo of campos) assert.ok(t.includes(`\n${campo} `), `al mensaje le falta "${campo}": ${t}`);
      assert.match(t, en ? /tow truck/ : /grúa/);
    }
  });

  test(`${nombre}: guardia 24 hs, la respuesta en el día y la CNRT 60284`, () => {
    assert.match(texto, en ? /On call 24 hours/ : /Guardia 24 hs/);
    assert.match(texto, en ? /same business day/ : /\ben el día\b/, 'falta la respuesta en el día');
    assert.match(texto, /CNRT (N\.º |license No\. )60284/);
  });

  test(`${nombre}: la Puna es una sección de la página, con su ancla en el índice`, () => {
    assert.ok(html.includes('<section class="block" id="puna">'), 'falta la sección #puna');
    assert.ok(sinComentarios(html).match(/<nav class="jump[\s\S]*?<\/nav>/)[0].includes('href="#puna"'));
    assert.match(texto, /4\.000 metros|4,000 meters/);
    assert.match(texto, /RN 51/);
    assert.match(texto, /RN 52/);
  });

  test(`${nombre}: sin precios, sin número de AMT, sin toneladas, sin camiones pesados y sin el Accelo`, () => {
    assert.doesNotMatch(texto, /(US\$|USD|ARS|\$\s?\d|€)/, 'publica un precio');
    assert.doesNotMatch(texto, /\bAMT\b[^.]{0,20}(N\.?[º°o]\.?|No\.|#)\s*\d/i, 'publica un número de AMT');
    assert.doesNotMatch(texto, /tonelada|\bton\b|-ton\b|\btons\b|\bkg\b|kilos|payload|capacidad de carga/i, 'publica una capacidad de carga');
    assert.doesNotMatch(texto, /camion(es)? pesados?|heavy[- ]duty|heavy trucks?|semirremolque|semi-trailer/i, 'ofrece grúa para pesados');
    assert.doesNotMatch(sinComentarios(html), /Accelo/i);
    assert.doesNotMatch(texto, /San\s+Crist[oó]bal|Iké|Federación Patronal|La Segunda|Sancor|Mapfre|Allianz/i, 'nombra una aseguradora');
  });

  test(`${nombre}: todos los teléfonos son el 526-9009`, () => {
    for (const href of enlacesDe(sinComentarios(html)).filter((h) => h.startsWith('tel:'))) {
      assert.strictEqual(href, TEL);
    }
    for (const [, numero] of texto.matchAll(/\b(\d{3}[ -]?\d{3}[ -]?\d{4}|\d{3} \d{3}-\d{4})\b/g)) {
      assert.match(numero, /526-?9009/, `número inesperado en ${nombre}: ${numero}`);
    }
  });

  test(`${nombre}: todos los enlaces internos y las fotos resuelven`, () => {
    for (const [, href] of sinComentarios(html).matchAll(/\b(?:href|src)="([^"#?:]+\.(?:html|webp|png|css|js))(?:[?#][^"]*)?"/g)) {
      const archivo = href.startsWith('/') ? href.slice(1) : path.posix.join(path.posix.dirname(nombre), href);
      assert.ok(fs.existsSync(path.join(raiz, archivo)), `${nombre}: ${href} no existe`);
    }
    for (const [, ancla] of sinComentarios(html).matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${ancla}"`), `${nombre}: el ancla #${ancla} no existe`);
    }
  });
}

test('portada: el hero no ofrece la grúa; la llamada 24 hs está en la tarjeta de auxilio', () => {
  for (const [portada, titulo, llamada] of [
    ['index.html', '<h3>Auxilio mecánico y remolques</h3>', /Auxilio en ruta 24 hs: 387 526-9009/],
    ['en/index.html', '<h3>Towing and roadside assistance</h3>', /24-hour roadside assistance: call \+54 9 387 526-9009/],
  ]) {
    const html = sinComentarios(paginas[portada]);
    const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/)[0];
    assert.doesNotMatch(visible(hero), /gr[uú]a|remolque|auxilio|tow|roadside/i, `${portada}: el hero habla de la grúa`);
    assert.ok(!enlacesDe(hero).includes(TEL), `${portada}: el hero tiene el botón de llamada a la grúa`);
    assert.ok(enlacesDe(hero).some((h) => h.startsWith('https://wa.me/5493875269009')), `${portada}: el hero perdió el WhatsApp`);
    const desde = html.indexOf(titulo);
    const tarjeta = html.slice(desde, html.indexOf('</article>', desde));
    const tel = tarjeta.match(/<a class="walink" href="tel:\+5493875269009">([\s\S]*?)<\/a>/);
    assert.ok(tel, `${portada}: la tarjeta de auxilio no tiene la llamada`);
    assert.match(visible(tel[1]), llamada);
  }
});

test('grúa: el título y la descripción toman las búsquedas que dejó la portada', () => {
  const html = paginas[ES];
  const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
  const desc = html.match(/<meta name="description" content="([^"]+)">/)[1];
  // "grua salta" 268, "gruas salta" 165, "gruas en salta capital" 116,
  // "servicio de grua salta" 38 (seo-deep-2026-11-03/A-rankings-competitors.md).
  assert.match(titulo, /^Grúa en Salta 24 hs/);
  for (const palabra of ['Grúas', 'Remolques', 'Auxilio Mecánico', 'Salta Capital', 'Lausof']) {
    assert.ok(titulo.includes(palabra), `el título de la grúa no dice "${palabra}": ${titulo}`);
  }
  for (const palabra of ['Servicio de grúa', 'remolques', 'auxilio mecánico', '24 hs, todos los días', 'Salta capital', '387 526-9009']) {
    assert.ok(desc.includes(palabra), `la descripción de la grúa no dice "${palabra}": ${desc}`);
  }
  assert.strictEqual(html.match(/<meta property="og:title" content="([^"]+)">/)[1], titulo);
  assert.strictEqual(html.match(/<meta property="og:description" content="([^"]+)">/)[1], desc);
});

test('grúa: las preguntas frecuentes son las mismas en los dos idiomas', () => {
  const preguntas = (html) => [...sinComentarios(html).matchAll(/<summary>([^<]+)<\/summary>/g)].map((m) => m[1]);
  const es = preguntas(paginas[ES]);
  const en = preguntas(paginas[EN]);
  assert.strictEqual(es.length, en.length, `ES ${es.length} preguntas, EN ${en.length}`);
  for (const [i, par] of [[/alquiler/, /rental/], [/aseguradoras/, /insurers/]].entries()) {
    const a = es.findIndex((q) => par[0].test(q));
    const b = en.findIndex((q) => par[1].test(q));
    assert.ok(a > -1 && a === b, `pregunta ${i}: no está en el mismo lugar en los dos idiomas`);
  }
});

test('portada: la tarjeta de auxilio enlaza la página de grúa, en los dos idiomas', () => {
  for (const [portada, titulo, destino] of [
    ['index.html', '<h3>Auxilio mecánico y remolques</h3>', `href="/${ES}"`],
    ['en/index.html', '<h3>Towing and roadside assistance</h3>', `href="/${EN}"`],
  ]) {
    const html = sinComentarios(paginas[portada]);
    const desde = html.indexOf(titulo);
    assert.ok(desde > -1, `${portada}: no está la tarjeta de auxilio`);
    const tarjeta = html.slice(desde, html.indexOf('</article>', desde));
    assert.ok(tarjeta.includes(`<a class="walink" ${destino}`), `${portada}: la tarjeta no enlaza ${destino}`);
  }
});
