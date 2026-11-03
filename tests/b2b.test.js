// Páginas B2B del 03/11/2026 (auditoría SEO, ~/lausof/web/seo-deep-2026-11-03/
// B-segments-expansion.md, puestos 2 y 3):
//   - Agencias de viajes, hoteles y operadores extranjeros: transporte con
//     chofer en nombre de la agencia. Las condiciones comerciales (comisión o
//     tarifa neta) son decisión de la familia: la página dice que se acuerdan
//     con cada agencia y nunca publica un porcentaje.
//   - Transporte de personal para obras de litio en la Puna (etapa de
//     construcción, contratistas y EPC). Las zonas se nombran como lugares;
//     ninguna empresa minera ni proyecto aparece como cliente.
// Las guardias de todo el sitio (palabras vedadas, flota sin dimensionar,
// teléfonos, registro de usted, castellano residual en inglés) ya alcanzan a
// estas páginas solas; acá va lo propio de cada una.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, pares, sitemap, redirects, urlDe, sinComentarios, DOMINIO } = require('./util.js');

const raiz = path.join(__dirname, '..');
const AGENCIAS = 'agencias-y-hoteles.html';
const LITIO = 'transporte-de-personal-obras-de-litio.html';
const NUEVAS = {
  [AGENCIAS]: 'en/ground-transport-for-tour-operators.html',
  [LITIO]: 'en/crew-transport-lithium-projects.html',
};
const esIngles = (n) => n.startsWith('en/');
const esDe = (n) => (esIngles(n) ? Object.keys(NUEVAS).find((k) => NUEVAS[k] === n) : n);
const todas = [...Object.keys(NUEVAS), ...Object.values(NUEVAS)];
const enlace = (desde, hacia) => `/${hacia}`;

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

// Nombres que estas páginas nunca publican: empresas mineras y operadores de
// proyectos de litio de la Puna, y agencias o plataformas que no son clientes.
// "Rincón", "Olaroz" o "Hombre Muerto" sí pueden aparecer, como lugares.
const sinNombres = [
  /rio\s*tinto/i, /\bgal[aá]n\b/i, /\beramet\b/i, /\bposco\b/i, /\bganfeng\b/i, /\barcadium\b/i,
  /\blivent\b/i, /\ballkem\b/i, /\bexar\b/i, /lithium\s+americas/i, /\bzijin\b/i, /\btsingshan\b/i,
  /\bpluspetrol\b/i, /lake\s+resources/i, /sales\s+de\s+jujuy/i, /\bRIGI\b/, /\bnordic\b/i, /\bdexotic\b/i, /\btiamar\b/i, /\bcivitatis\b/i,
  /getyourguide/i, /\bviator\b/i, /\bdespegar\b/i,
];

test('las dos páginas B2B están en el mapa de pares, el sitemap y los 301 sin .html, en los dos idiomas', () => {
  for (const [es, en] of Object.entries(NUEVAS)) {
    assert.strictEqual(pares[es], en, `${es} no está en el mapa de pares`);
    for (const n of [es, en]) {
      assert.ok(fs.existsSync(path.join(raiz, n)), `falta ${n}`);
      assert.ok(lastmodDe(n), `${n} no está en el sitemap con lastmod`);
      const desde = `/${n.replace(/\.html$/, '')}`;
      assert.match(redirects, new RegExp(`^${desde}\\s+/${n.replace(/[./]/g, '\\$&')}\\s+301!$`, 'm'), `falta el 301 de ${desde}`);
    }
  }
});

for (const nombre of todas) {
  const html = paginas[nombre];
  const en = esIngles(nombre);
  const es = esDe(nombre);
  const ing = NUEVAS[es];
  const texto = visible(html);

  test(`${nombre}: canónica propia y hreflang recíproco con x-default al español`, () => {
    assert.ok(html.includes(`<link rel="canonical" href="${urlDe(nombre)}">`));
    for (const [lang, archivo] of [['es', es], ['en', ing], ['x-default', es]]) {
      assert.ok(html.includes(`<link rel="alternate" hreflang="${lang}" href="${urlDe(archivo)}">`),
        `${nombre}: falta el hreflang ${lang}`);
    }
  });

  test(`${nombre}: JSON-LD WebPage + Service + BreadcrumbList, igual a lo visible y con #empresa`, () => {
    const nodos = grafo(html);
    assert.deepStrictEqual(nodos.map((n) => n['@type']).sort(), ['BreadcrumbList', 'Service', 'WebPage']);
    assert.doesNotMatch(JSON.stringify(nodos), /"(Event|FAQPage|Offer|Review|AggregateRating|TouristTrip|priceRange|price)"/);
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    const servicio = nodos.find((n) => n['@type'] === 'Service');
    const miga = nodos.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    assert.strictEqual(pagina.name, html.match(/<title>([^<]+)<\/title>/)[1]);
    assert.strictEqual(pagina.description, html.match(/<meta name="description" content="([^"]+)">/)[1]);
    assert.strictEqual(pagina.url, urlDe(nombre));
    assert.strictEqual(pagina.inLanguage, en ? 'en' : 'es');
    assert.strictEqual(pagina.about['@id'], `${DOMINIO}/#empresa`);
    assert.strictEqual(pagina.mainEntity['@id'], servicio['@id']);
    assert.strictEqual(pagina.breadcrumb['@id'], nodos.find((n) => n['@type'] === 'BreadcrumbList')['@id']);
    assert.strictEqual(servicio.provider['@id'], `${DOMINIO}/#empresa`);
    assert.ok(!servicio.provider.taxID, 'el Service redefine la empresa');
    assert.strictEqual(servicio.audience['@type'], 'BusinessAudience');
    const nav = sinComentarios(html).match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, 'falta la miga visible');
    const vistos = [...nav[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    assert.deepStrictEqual(vistos, miga.map((i) => i.name));
    const padre = es === AGENCIAS
      ? (en ? 'en/tours-and-transfers.html' : 'turismo.html')
      : (en ? 'en/mining-logistics.html' : 'logistica-minera.html');
    assert.strictEqual(miga[1].item, urlDe(padre));
    // La página lleva además la ficha generada de la empresa, al día.
    assert.ok(html.includes('<script type="application/ld+json" id="empresa">'), 'falta el bloque GENERADO:EMPRESA');
  });

  test(`${nombre}: una sola fecha (dateModified, texto visible y lastmod no anterior)`, () => {
    const pagina = grafo(html).find((n) => n['@type'] === 'WebPage');
    const [a, m, d] = pagina.dateModified.split('-').map(Number);
    const meses = en
      ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      : ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    assert.ok(texto.includes(en ? `Updated ${meses[m - 1]} ${d}, ${a}` : `Actualizado el ${d} de ${meses[m - 1]} de ${a}`));
    assert.ok(lastmodDe(nombre) >= pagina.dateModified);
  });

  test(`${nombre}: sin precios, sin porcentajes, sin número de AMT, con la CNRT 60284, 24 horas y la respuesta en el día`, () => {
    assert.doesNotMatch(texto, /(US\$|USD|ARS|\$\s?\d|€)/, 'publica un precio');
    assert.doesNotMatch(texto, /\d\s?%|\bpor ciento\b|\bpercent\b/i, 'publica un porcentaje (comisión o tarifa)');
    assert.doesNotMatch(texto, /\bAMT\b[^.]{0,20}(N\.?[º°o]\.?|No\.|#)\s*\d/i, 'publica un número de AMT');
    assert.doesNotMatch(texto, /aseguradora|insurer|san crist[oó]bal|p[oó]liza|policy no/i, 'publica datos del seguro');
    assert.match(texto, /CNRT (N\.º |license No\. )60284/);
    assert.match(texto, en ? /24 hours/ : /24 horas/);
    assert.match(texto, en ? /same business day/ : /\ben el día\b/, 'falta la respuesta en el día');
  });

  test(`${nombre}: no nombra empresas, proyectos ni agencias como clientes`, () => {
    const todo = `${texto} ${sinComentarios(html).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]}`;
    for (const patron of sinNombres) {
      const m = todo.match(patron);
      assert.ok(!m, `${nombre} nombra "${m && m[0]}"`);
    }
    assert.doesNotMatch(texto, /\bclientes? como\b|\bour clients include\b/i);
    // "Trabajamos para los contratistas" sí; "Trabajamos para <Empresa>" no.
    assert.doesNotMatch(texto, /\b[Tt]rabajamos para [A-ZÁÉÍÓÚ]|\b[Ww]e work for [A-Z]/);
  });

  test(`${nombre}: CTA por WhatsApp pre-armado y por correo`, () => {
    const textos = [...html.matchAll(/href="https:\/\/wa\.me\/5493875269009\?text=([^"]+)"/g)].map((m) => decodeURIComponent(m[1]));
    assert.ok(textos.length >= 3, 'se esperan los WhatsApp del encabezado, el cierre y la barra');
    const servicio = es === AGENCIAS ? /agencia|tour operator/ : /litio|lithium/;
    for (const t of textos) assert.match(t, servicio, `mensaje pre-armado inesperado: ${t}`);
    const correos = [...html.matchAll(/href="mailto:transporte@lausof\.com\?subject=([^"]+)"/g)];
    assert.ok(correos.length >= 2, 'se espera el correo en el cuerpo y en el pie');
  });

  test(`${nombre}: todos los enlaces internos y las fotos resuelven`, () => {
    for (const [, href] of sinComentarios(html).matchAll(/\b(?:href|src)="([^"#?:]+\.(?:html|webp|avif|png|css|js))(?:[?#][^"]*)?"/g)) {
      const archivo = href.startsWith('/') ? href.slice(1) : path.posix.join(path.posix.dirname(nombre), href);
      assert.ok(fs.existsSync(path.join(raiz, archivo)), `${nombre}: ${href} no existe`);
    }
  });
}

test('agencias: las condiciones se acuerdan con cada agencia y el idioma queda dicho, en los dos idiomas', () => {
  const es = visible(paginas[AGENCIAS]);
  const en = visible(paginas[NUEVAS[AGENCIAS]]);
  assert.match(es, /se acuerdan con cada agencia/);
  assert.match(en, /agreed with each agency/);
  assert.match(es, /en nombre de su agencia/i);
  assert.match(en, /on (your )?behalf/i);
  assert.match(es, /aeropuerto Martín Miguel de Güemes/);
  assert.match(en, /Martín Miguel de Güemes airport/);
  assert.match(es, /choferes trabajan en español/);
  assert.match(en, /drivers work in Spanish/);
  assert.match(es, /no es guía de turismo habilitado/);
  assert.match(en, /not a licensed tour guide/);
  // Ninguna tasa ni modelo dado por hecho: la comisión aparece sólo como pregunta.
  assert.doesNotMatch(es, /comisión del|cobramos comisión|tarifa neta de/i);
  assert.doesNotMatch(en, /commission of|we pay .{0,20}commission|net rate of/i);
});

test('litio: zonas nombradas como lugares, turnos, picos, campamentos y Puna en los dos idiomas', () => {
  const es = visible(paginas[LITIO]);
  const en = visible(paginas[NUEVAS[LITIO]]);
  for (const lugar of ['Salar del Hombre Muerto', 'Salar de Pocitos', 'Olaroz']) {
    assert.ok(es.includes(lugar) && en.includes(lugar), `falta la zona ${lugar}`);
  }
  assert.match(es, /cambios? de turno/i);
  assert.match(es, /picos? de dotación/i);
  assert.match(es, /campamento/i);
  assert.match(en, /shift change/i);
  assert.match(en, /staffing peak/i);
  assert.match(en, /camp/i);
});

test('cada página B2B la reciben su página madre, la portada de su idioma y las páginas de servicio', () => {
  const origenes = {
    [AGENCIAS]: ['turismo.html', 'index.html', 'traslados-empresas.html', 'alquiler-combi-con-chofer-salta.html'],
    [NUEVAS[AGENCIAS]]: ['en/tours-and-transfers.html', 'en/index.html'],
    [LITIO]: ['logistica-minera.html', 'index.html', 'transporte-de-personal.html', 'traslados-empresas.html'],
    [NUEVAS[LITIO]]: ['en/mining-logistics.html', 'en/index.html', 'en/personnel-transport.html'],
  };
  for (const [destino, lista] of Object.entries(origenes)) {
    for (const origen of lista) {
      assert.ok(sinComentarios(paginas[origen]).includes(`href="${enlace(origen, destino)}"`), `${origen} no enlaza ${destino}`);
    }
  }
});

test('las páginas de litio enlazan de vuelta a minería y a personal (ida y vuelta)', () => {
  assert.ok(sinComentarios(paginas[LITIO]).includes('href="/logistica-minera.html"'));
  assert.ok(sinComentarios(paginas[LITIO]).includes('href="/transporte-de-personal.html"'));
  assert.ok(sinComentarios(paginas[NUEVAS[LITIO]]).includes('href="/en/mining-logistics.html"'));
  assert.ok(sinComentarios(paginas[NUEVAS[LITIO]]).includes('href="/en/personnel-transport.html"'));
  assert.ok(sinComentarios(paginas[AGENCIAS]).includes('href="/turismo.html"'));
  assert.ok(sinComentarios(paginas[NUEVAS[AGENCIAS]]).includes('href="/en/tours-and-transfers.html"'));
});
