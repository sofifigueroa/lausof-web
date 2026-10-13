// Páginas de ruta del 10/10/2026 (Quebrada de Humahuaca y Salinas Grandes,
// en español y en inglés) y la puesta a la par de turismo.html. Cubre lo que
// las guardias generales no ven: el modelo WebPage + Service + BreadcrumbList
// del blueprint de growth-2026-10, la miga de pan visible igual a la
// declarada, la fecha única (visible, JSON-LD y sitemap), los enlaces desde
// los hubs y las portadas, que todo enlace interno resuelva a un archivo, y
// que no se cuelen precios, reseñas ni números de expediente.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, pares, urlDe, sitemap, index, sinComentarios, DOMINIO } = require('./util.js');

const raiz = path.join(__dirname, '..');

const rutas = {
  'traslado-salta-purmamarca-tilcara-humahuaca.html': 'en/salta-to-purmamarca-tilcara-humahuaca.html',
  'salinas-grandes-desde-salta.html': 'en/salinas-grandes-from-salta.html',
};
const paginasRuta = [...Object.keys(rutas), ...Object.values(rutas)];
const conMarcado = [...paginasRuta, 'turismo.html'];
const FECHA = '2026-10-10';

const textoVisible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const nodosDe = (html) => {
  const nodos = [];
  for (const [, cuerpo] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    const datos = JSON.parse(cuerpo);
    nodos.push(...(datos['@graph'] || [datos]));
  }
  return nodos;
};

test('cada página de ruta está registrada como par ES↔EN', () => {
  for (const [es, en] of Object.entries(rutas)) {
    assert.strictEqual(pares[es], en, `${es} no está en el mapa de pares con ${en}`);
  }
});

for (const nombre of conMarcado) {
  const html = paginas[nombre];

  test(`${nombre}: JSON-LD con WebPage, Service y BreadcrumbList coherentes con lo visible`, () => {
    assert.ok(html, `falta ${nombre}`);
    const nodos = nodosDe(html);
    const tipos = nodos.map((n) => n['@type']);
    for (const tipo of ['WebPage', 'Service', 'BreadcrumbList']) {
      assert.ok(tipos.includes(tipo), `${nombre} no tiene nodo ${tipo}`);
    }
    for (const vedado of ['FAQPage', 'Event', 'Review', 'AggregateRating', 'Offer', 'TouristTrip']) {
      assert.ok(!JSON.stringify(nodos).includes(`"${vedado}"`), `${nombre} lleva marcado ${vedado}`);
    }
    const pagina = nodos.find((n) => n['@type'] === 'WebPage');
    const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="([^"]+)">/)[1];
    assert.strictEqual(pagina.name, titulo, `el WebPage de ${nombre} no repite el <title>`);
    assert.strictEqual(pagina.description, desc, `el WebPage de ${nombre} no repite la meta description`);
    assert.strictEqual(pagina.url, urlDe(nombre));
    assert.strictEqual(pagina.inLanguage, nombre.startsWith('en/') ? 'en' : 'es');
    assert.strictEqual(pagina.dateModified, FECHA);
    const servicio = nodos.find((n) => n['@type'] === 'Service');
    assert.strictEqual(servicio.provider['@id'], `${DOMINIO}/#empresa`);
    assert.ok(!servicio.provider.taxID, `${nombre} redefine la empresa en vez de referenciarla`);

    // La miga visible dice lo mismo que el BreadcrumbList, en el mismo orden.
    const miga = sinComentarios(html).match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(miga, `${nombre} no muestra la miga de pan`);
    const visibles = [...miga[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim());
    const lista = nodos.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    assert.deepStrictEqual(visibles, lista.map((i) => i.name), `la miga de ${nombre} no coincide con el JSON-LD`);
    lista.forEach((item, i) => assert.strictEqual(item.position, i + 1));
    assert.ok(!lista[lista.length - 1].item, 'el último escalón de la miga no lleva enlace');
  });

  test(`${nombre}: el lastmod del sitemap no es anterior a la fecha de actualización`, () => {
    const bloque = sitemap.match(new RegExp(`<loc>${urlDe(nombre).replace(/[.]/g, '\\.')}</loc>\\s*<lastmod>([^<]+)</lastmod>`));
    assert.ok(bloque, `${nombre} no está en el sitemap`);
    // El lastmod sale de git (scripts/lastmod.mjs) y la fecha visible es la de la
    // última revisión del contenido: el lastmod puede ser posterior, nunca anterior.
    assert.ok(bloque[1] >= FECHA, `el lastmod de ${nombre} (${bloque[1]}) es anterior a ${FECHA}`);
  });
}

for (const nombre of paginasRuta) {
  const html = paginas[nombre];
  const visible = textoVisible(html);
  const en = nombre.startsWith('en/');

  test(`${nombre}: muestra la fecha de actualización`, () => {
    assert.match(visible, en ? /Updated 10 October 2026/ : /Actualizado el 10 de octubre de 2026/);
  });

  test(`${nombre}: lleva los datos verificables de la ruta`, () => {
    const comunes = [/CNRT/, /60284/, /Google Maps/, /2[.,]324 m/, /CDC/];
    const propios = nombre.includes('salinas')
      ? [/RN 52/, /4[.,]170 m/, /3[.,]450 m/, /66 km/, /Lip[aá]n/]
      : [/RN 9/, /188 km/, /3[.,]012 m/, /Hornocal/, /4[.,]350 m/, /RP 73|ruta provincial 73/];
    for (const patron of [...comunes, ...propios]) {
      assert.match(visible, patron, `${nombre} perdió el dato ${patron}`);
    }
  });

  test(`${nombre}: sin precios, reseñas ni números de expediente`, () => {
    assert.ok(!/(US\$|USD|ARS|\$\s?\d|€)/.test(visible), `${nombre} publica un precio`);
    assert.ok(!/\b(reviews?|rating|stars?|rese[ñn]as?|opiniones|calificaci[oó]n)\b|★/i.test(visible),
      `${nombre} habla de reseñas o puntajes`);
    assert.ok(!/\b(AMT|agencia|agency|legajo|expediente|license|licencia|permit)\b[^.]{0,20}(N\.?[º°o]\.?|No\.|#)\s*\d/i.test(visible.replace(/CNRT (license )?N?\.?[º°o]?\.? ?(No\. )?60284/g, '')),
      `${nombre} publica un número de expediente o licencia que no es el CNRT 60284`);
  });

  test(`${nombre}: el WhatsApp va pre-armado y nombra la ruta`, () => {
    const was = [...html.matchAll(/href="https:\/\/wa\.me\/5493875269009\?text=([^"]+)"/g)]
      .map((m) => decodeURIComponent(m[1]));
    assert.ok(was.length >= 3, `${nombre} tiene pocos botones de WhatsApp`);
    const ruta = nombre.includes('salinas') ? /Salinas Grandes/ : /Purmamarca, Tilcara (and|y) Humahuaca/;
    assert.ok(was.some((t) => ruta.test(t)), `ningún WhatsApp de ${nombre} nombra la ruta`);
  });

  test(`${nombre}: el correo va a contacto@ con copia a transporte@ y asunto de cotización`, () => {
    const mailtos = [...html.matchAll(/href="mailto:([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    const conAsunto = mailtos.filter((m) => /subject=/.test(m));
    assert.ok(conAsunto.length > 0, `${nombre} no tiene un mailto con asunto`);
    assert.ok(conAsunto.some((m) => m.startsWith('contacto@')), `${nombre} no tiene un mailto a contacto@ con asunto`);
    for (const m of conAsunto) {
      // Desde el 13/10 el enlace directo a transporte@ también lleva el
      // asunto de la página (sin copia: ya es la casilla donde se responde).
      assert.match(m, /^(contacto@lausof\.com\?cc=transporte@lausof\.com&|transporte@lausof\.com\?)subject=/);
      const asunto = decodeURIComponent(m.split('subject=')[1]);
      assert.match(asunto, en ? /^Quote request — / : /^Pedido de cotización — /, `asunto inesperado en ${nombre}: ${asunto}`);
    }
  });

  test(`${nombre}: enlaza al hub de turismo y a la otra página de ruta`, () => {
    const hub = en ? '/en/tours-and-transfers.html' : 'turismo.html';
    assert.ok(html.includes(`href="${hub}"`), `${nombre} no enlaza al hub ${hub}`);
    const otras = paginasRuta.filter((n) => n !== nombre && n.startsWith('en/') === en);
    for (const otra of otras) {
      const href = en ? `/${otra}` : otra;
      assert.ok(html.includes(`href="${href}"`), `${nombre} no enlaza a ${href}`);
    }
  });
}

// Castellano neutro en el texto nuevo: nada de voseo en imperativo ni en
// presente. turismo.html entra porque se reescribió entera el 10/10.
// Las formas con tilde final (cotizá, mandá) son voseo; «se cotiza» no.
const voseo = /(?:^|[^\p{L}])(escribinos|consultanos|contanos|llamanos|cotizá|mandá|escribí|vení|elegís|tenés|podés|querés|sabés|vos)(?![\p{L}])/iu;
for (const nombre of [...Object.keys(rutas), 'turismo.html']) {
  test(`${nombre}: castellano neutro, sin voseo`, () => {
    const m = textoVisible(paginas[nombre]).match(voseo);
    assert.ok(!m, `voseo en ${nombre}: "${m && m[1]}"`);
  });
}

// Los hubs y las portadas llevan a las páginas de ruta.
test('turismo y su gemela inglesa enlazan las dos páginas de ruta de su idioma', () => {
  for (const es of Object.keys(rutas)) {
    assert.ok(paginas['turismo.html'].includes(`href="${es}"`), `turismo.html no enlaza ${es}`);
    assert.ok(paginas['en/tours-and-transfers.html'].includes(`href="/${rutas[es]}"`),
      `en/tours-and-transfers.html no enlaza /${rutas[es]}`);
  }
});

test('las dos portadas enlazan las páginas de ruta de su idioma', () => {
  for (const es of Object.keys(rutas)) {
    assert.ok(index.includes(`href="${es}"`), `index.html no enlaza ${es}`);
    assert.ok(paginas['en/index.html'].includes(`href="/${rutas[es]}"`), `en/index.html no enlaza /${rutas[es]}`);
  }
});

// Todo enlace interno de estas páginas apunta a un archivo que existe, y
// todo #ancla a un id de la misma página.
for (const nombre of [...conMarcado, 'en/tours-and-transfers.html']) {
  test(`${nombre}: los enlaces internos y las anclas resuelven`, () => {
    const html = sinComentarios(paginas[nombre]);
    const dir = path.dirname(nombre);
    for (const [, href] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:|data:)/.test(href)) continue;
      const [ruta, ancla] = href.split('#');
      if (!ruta) {
        assert.match(html, new RegExp(`\\bid="${ancla}"`), `${nombre}: el ancla #${ancla} no existe`);
        continue;
      }
      const limpia = ruta.split('?')[0];
      let archivo = limpia.startsWith('/') ? limpia.slice(1) : path.join(dir, limpia);
      if (archivo === '' || archivo.endsWith('/')) archivo += 'index.html';
      assert.ok(fs.existsSync(path.join(raiz, archivo)), `${nombre}: ${href} no resuelve (${archivo})`);
    }
  });
}

// Las clases nuevas viven en css/turismo.css y todas las páginas que la usan
// piden la misma versión: con /css/* inmutable, una versión vieja dejaría la
// página sin estilos de FAQ o de miga.
test('turismo.css trae las piezas compartidas y todas sus páginas piden la misma versión', () => {
  const css = fs.readFileSync(path.join(raiz, 'css/turismo.css'), 'utf8');
  for (const sel of ['.crumbs', '.faq', '.jump', '.cta-final .routing', '.fotos-ruta', '.ph-quebrada', '.ph-salinas']) {
    assert.ok(css.includes(sel), `turismo.css no define ${sel}`);
  }
  const versiones = new Set();
  for (const [nombre, html] of Object.entries(paginas)) {
    const m = html.match(/css\/turismo\.css\?v=(\d+)/);
    if (m) versiones.add(`${m[1]}`);
    if (conMarcado.includes(nombre) || nombre === 'en/tours-and-transfers.html') {
      assert.ok(m, `${nombre} no carga turismo.css`);
    }
  }
  assert.strictEqual(versiones.size, 1, `turismo.css se pide en más de una versión: ${[...versiones].join(', ')}`);
});
