// Páginas de ruta de los Valles y la Puna, y la de casamientos (10/10/2026):
// Salta–Cafayate, Salta–Cachi y la vuelta por la Ruta 40, Salta–San Antonio
// de los Cobres y traslados para casamientos, en español y en inglés.
//
// Lo que se vigila acá es lo propio de estas páginas; el hreflang recíproco,
// el selector de idioma, el inglés sin castellano y los teléfonos ya los
// cubren las guardias generales en cuanto el par está en `pares`.
//   - Datos estructurados: WebPage + Service + BreadcrumbList (blueprint 7.6),
//     sin Event, FAQPage, Offer ni Review, y con cada valor igual al texto
//     visible (título, descripción, miga de pan, fecha).
//   - La fecha de actualización es una sola: dateModified, el texto visible
//     y el lastmod del sitemap.
//   - Ningún precio, y el castellano nuevo en registro neutro (sin voseo).
//   - Cada página recibe enlaces desde su página madre.
// Los datos de cada página tienen su fuente en
// ~/lausof/web/growth-2026-10/facts/ (fuera del repo).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sitemap, urlDe, sinComentarios } = require('./util.js');

const rutas = {
  'traslado-salta-cafayate.html': 'en/salta-to-cafayate-transfer.html',
  'traslado-salta-cachi.html': 'en/salta-to-cachi-transfer.html',
  'traslado-salta-san-antonio-de-los-cobres.html': 'en/salta-to-san-antonio-de-los-cobres.html',
  'traslados-casamientos.html': 'en/wedding-transportation.html',
};
const todas = [...Object.keys(rutas), ...Object.values(rutas)];

const nodosDe = (html) => {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.strictEqual(bloques.length, 1, 'se espera un solo bloque JSON-LD');
  const datos = JSON.parse(bloques[0][1]);
  assert.ok(Array.isArray(datos['@graph']), 'el JSON-LD no es un @graph');
  return datos['@graph'];
};

const decodificar = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"');

const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

for (const nombre of todas) {
  const html = paginas[nombre];
  const es = !nombre.startsWith('en/');

  test(`${nombre}: existe y su canónica es la propia`, () => {
    assert.ok(html, `falta ${nombre}`);
    assert.ok(html.includes(`<link rel="canonical" href="${urlDe(nombre)}">`),
      `la canónica de ${nombre} no es ${urlDe(nombre)}`);
  });

  test(`${nombre}: JSON-LD WebPage + Service + BreadcrumbList y nada más`, () => {
    const nodos = nodosDe(html);
    const tipos = nodos.map((n) => n['@type']).sort();
    assert.deepStrictEqual(tipos, ['BreadcrumbList', 'Service', 'WebPage']);
    const crudo = JSON.stringify(nodos);
    for (const vedado of ['"Event"', '"FAQPage"', '"Offer"', '"Review"', '"AggregateRating"', '"TouristTrip"']) {
      assert.ok(!crudo.includes(vedado), `${nombre} declara ${vedado}`);
    }
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    const servicio = nodos.find((n) => n['@type'] === 'Service');
    const miga = nodos.find((n) => n['@type'] === 'BreadcrumbList');
    assert.strictEqual(pagina.inLanguage, es ? 'es' : 'en');
    assert.strictEqual(pagina.url, urlDe(nombre));
    assert.strictEqual(pagina.mainEntity['@id'], servicio['@id']);
    assert.strictEqual(pagina.breadcrumb['@id'], miga['@id']);
    assert.strictEqual(servicio.provider['@id'], 'https://www.lausof.com/#empresa');
    assert.ok(!servicio.provider.taxID, 'el Service redefine la ficha de la empresa');
  });

  test(`${nombre}: el JSON-LD dice lo mismo que la página`, () => {
    const nodos = nodosDe(html);
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    const titulo = decodificar(html.match(/<title>([^<]+)<\/title>/)[1]);
    const desc = decodificar(html.match(/<meta name="description" content="([^"]+)">/)[1]);
    assert.strictEqual(pagina.name, titulo, 'el name del WebPage no es el <title>');
    assert.strictEqual(pagina.description, desc, 'la description del WebPage no es la meta description');

    // La miga de pan del JSON-LD es la misma que se ve, en el mismo orden.
    const miga = nodos.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    assert.ok(miga.length >= 2, 'la miga de pan necesita al menos dos niveles');
    const nav = html.match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, `${nombre} no muestra la miga de pan`);
    const vistos = [...nav[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    assert.deepStrictEqual(vistos, miga.map((i) => i.name), 'la miga visible no coincide con la del JSON-LD');
    miga.forEach((item, i) => {
      assert.strictEqual(item.position, i + 1);
      if (i < miga.length - 1) assert.match(item.item, /^https:\/\/www\.lausof\.com\//);
    });
  });

  test(`${nombre}: una sola fecha de actualización (JSON-LD, texto y sitemap)`, () => {
    const pagina = nodosDe(html).find((n) => n['@type'] === 'WebPage');
    const entrada = sitemap.match(new RegExp(
      `<loc>${urlDe(nombre).replace(/[.]/g, '\\.')}</loc>\\s*<lastmod>([^<]+)</lastmod>`));
    assert.ok(entrada, `${nombre} no está en el sitemap`);
    // El lastmod sale de git (scripts/lastmod.mjs) y la fecha visible es la de la
    // última revisión del contenido: el lastmod puede ser posterior, nunca anterior.
    assert.ok(entrada[1] >= pagina.dateModified, 'el lastmod del sitemap es anterior a dateModified');
    const [a, m, d] = pagina.dateModified.split('-').map(Number);
    const meses = es
      ? ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const texto = es ? `Actualizado el ${d} de ${meses[m - 1]} de ${a}` : `Updated ${meses[m - 1]} ${d}, ${a}`;
    assert.ok(visible(html).includes(texto), `${nombre} no muestra "${texto}"`);
  });

  test(`${nombre}: sin precios publicados`, () => {
    const m = visible(html).match(/(US\$|USD|ARS|\$\s?\d|€)/);
    assert.ok(!m, `${nombre} publica un precio: "${m && m[0]}"`);
  });

  test(`${nombre}: cita la habilitación CNRT 60284`, () => {
    assert.match(visible(html), /CNRT (N\.º |license No\. )60284/);
  });
}

// El castellano nuevo va en registro neutro latinoamericano (pedido de
// Lautaro): nada de voseo en estas cuatro páginas, aunque el resto del sitio
// todavía lo use.
// Formas con tilde: "se cotiza" (tercera persona) es neutro, "cotizá" no.
const voseo = /(^|[^\p{L}])(vos|escribinos|contanos|llamanos|avisanos|cotizá|consultá|mirá|tenés|querés|podés|elegís|organizás|sabés|necesitás)(?![\p{L}])/iu;
for (const nombre of Object.keys(rutas)) {
  test(`${nombre}: español neutro, sin voseo`, () => {
    const m = visible(paginas[nombre]).match(voseo);
    assert.ok(!m, `voseo en ${nombre}: "${m && m[0]}"`);
  });
}

// La página general de San Antonio de los Cobres nombra el Tren a las Nubes:
// lleva la línea de independencia cerca del dato y enlaza al sitio oficial.
test('San Antonio de los Cobres: aviso de independencia del Tren a las Nubes', () => {
  for (const [nombre, aviso] of [
    ['traslado-salta-san-antonio-de-los-cobres.html', /no opera el tren ni vende sus boletos/],
    ['en/salta-to-san-antonio-de-los-cobres.html', /we do not operate the train or sell its tickets/],
  ]) {
    const html = paginas[nombre];
    assert.match(visible(html), aviso, `${nombre} perdió el aviso de independencia`);
    assert.ok(html.includes('href="https://www.trenalasnubes.com.ar/"'), `${nombre} no enlaza al sitio oficial del tren`);
    assert.ok(!/\boficial(es)? de Lausof|official (Lausof|partner)/i.test(visible(html)),
      `${nombre} sugiere una relación oficial con el tren`);
  }
});

// Ninguna queda colgada: cada página recibe el enlace desde su página madre
// (turismo y su gemela para las rutas; peregrinaciones y las portadas para
// casamientos), y las rutas se enlazan entre sí.
test('las páginas de ruta y casamientos se enlazan desde su página madre', () => {
  const enlaza = (origen, destino) => sinComentarios(paginas[origen]).includes(`href="${destino}"`);
  for (const es of ['traslado-salta-cafayate.html', 'traslado-salta-cachi.html',
    'traslado-salta-san-antonio-de-los-cobres.html']) {
    assert.ok(enlaza('turismo.html', es), `turismo.html no enlaza a ${es}`);
    assert.ok(enlaza('en/tours-and-transfers.html', `/${rutas[es]}`),
      `en/tours-and-transfers.html no enlaza a ${rutas[es]}`);
  }
  assert.ok(enlaza('peregrinaciones-eventos.html', 'traslados-casamientos.html'));
  assert.ok(enlaza('index.html', 'traslados-casamientos.html'));
  assert.ok(enlaza('en/index.html', '/en/wedding-transportation.html'));
  assert.ok(enlaza('traslado-salta-cafayate.html', 'traslado-salta-cachi.html'));
  assert.ok(enlaza('traslado-salta-cachi.html', 'traslado-salta-cafayate.html'));
  assert.ok(enlaza('traslados-casamientos.html', 'peregrinaciones-eventos.html'));
});

// Ninguna foto de estas páginas apunta a un archivo que no existe.
test('las fotos de las páginas de ruta existen en assets', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  for (const nombre of todas) {
    for (const [, src] of paginas[nombre].matchAll(/<img src="([^"]+)"/g)) {
      const archivo = src.replace(/^\//, '');
      assert.ok(fs.existsSync(path.join(__dirname, '..', archivo)), `${nombre}: falta ${archivo}`);
    }
  }
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'turismo.css'), 'utf8');
  for (const [, url] of css.matchAll(/url\('\.\.\/([^']+)'\)/g)) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', url)), `css/turismo.css: falta ${url}`);
  }
});
