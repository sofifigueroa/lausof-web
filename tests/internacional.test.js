// Viajes internacionales (10/10/2026): la página que los agrupa y las dos
// rutas con página propia (San Pedro de Atacama y Uyuni), en los dos idiomas.
//
// Lo que se vigila acá es lo que rompe en silencio en este tipo de página:
// que los datos estructurados digan lo mismo que la página (título,
// descripción, fecha, miga de pan, países), que no se cuele marcado vedado
// (Event, FAQPage, Offer sin precio), que la página sea parte de una
// jerarquía navegable (enlazada desde la portada y turismo, y entre sí), que
// no publique precios ni otro número de habilitación que el CNRT, y que todo
// enlace interno y toda foto existan. Las reglas generales (teléfonos,
// castellano residual, hreflang, sitemap) ya las cubren los otros tests,
// porque las seis páginas entran solas en `paginas`.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, sitemap, urlDe, DOMINIO, sinComentarios } = require('./util.js');

const raiz = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(raiz, 'css', 'turismo.css'), 'utf8');

// Cada página con los países que declara y la foto de su encabezado.
const internacionales = {
  'viajes-internacionales.html': { paises: ['Argentina', 'Chile', 'Bolivia'], foto: 'ph-internacional' },
  'traslado-salta-san-pedro-de-atacama.html': { paises: ['Argentina', 'Chile'], foto: 'ph-atacama' },
  'traslado-salta-uyuni.html': { paises: ['Argentina', 'Bolivia'], foto: 'ph-uyuni' },
  'en/international-trips.html': { paises: ['Argentina', 'Chile', 'Bolivia'], foto: 'ph-internacional' },
  'en/salta-to-san-pedro-de-atacama.html': { paises: ['Argentina', 'Chile'], foto: 'ph-atacama' },
  'en/salta-to-uyuni.html': { paises: ['Argentina', 'Bolivia'], foto: 'ph-uyuni' },
};

const grafoDe = (html) => {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.strictEqual(bloques.length, 1, 'se espera un solo bloque JSON-LD');
  return JSON.parse(bloques[0][1])['@graph'];
};

const atributo = (html, patron) => {
  const m = html.match(patron);
  assert.ok(m, `no se encontró ${patron}`);
  return m[1].replace(/&amp;/g, '&');
};

const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

// "Actualizado el 10/10/2026" o "Updated Oct 10, 2026", como AAAA-MM-DD.
const meses = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const fechaVisible = (texto) => {
  const es = texto.match(/Actualizado el (\d{2})\/(\d{2})\/(\d{4})/);
  if (es) return `${es[3]}-${es[2]}-${es[1]}`;
  const en = texto.match(/Updated ([A-Z][a-z]{2}) (\d{1,2}), (\d{4})/);
  if (en) return `${en[3]}-${meses[en[1]]}-${en[2].padStart(2, '0')}`;
  return null;
};

const lastmodDe = (url) => {
  const m = sitemap.match(new RegExp(`<loc>${url.replace(/[.]/g, '\\.')}</loc>\\s*<lastmod>([^<]+)</lastmod>`));
  return m && m[1];
};

for (const [nombre, { paises, foto }] of Object.entries(internacionales)) {
  const html = paginas[nombre];

  test(`${nombre}: existe y su canónica es la propia`, () => {
    assert.ok(html, `falta ${nombre}`);
    assert.strictEqual(atributo(html, /<link rel="canonical" href="([^"]+)">/), urlDe(nombre));
  });

  test(`${nombre}: WebPage + Service + BreadcrumbList, sin marcado vedado`, () => {
    const grafo = grafoDe(html);
    const tipos = grafo.map((n) => n['@type']).sort();
    assert.deepStrictEqual(tipos, ['BreadcrumbList', 'Service', 'WebPage']);
    const todo = JSON.stringify(grafo);
    for (const vedado of ['Event', 'FAQPage', 'Offer', 'Review', 'AggregateRating', 'TouristTrip']) {
      assert.ok(!todo.includes(`"${vedado}"`), `${nombre} lleva marcado ${vedado}`);
    }
    // La ficha completa de la empresa vive sólo en la portada.
    assert.ok(!grafo.some((n) => n.taxID || n.address), `${nombre} redefine la empresa`);
  });

  test(`${nombre}: el JSON-LD cuenta lo mismo que la página`, () => {
    const grafo = grafoDe(html);
    const pagina = grafo.find((n) => n['@type'] === 'WebPage');
    const servicio = grafo.find((n) => n['@type'] === 'Service');
    const url = urlDe(nombre);
    assert.strictEqual(pagina.url, url);
    assert.strictEqual(pagina['@id'], `${url}#webpage`);
    assert.strictEqual(pagina.name, atributo(html, /<title>([^<]+)<\/title>/), 'name ≠ <title>');
    assert.strictEqual(pagina.description, atributo(html, /<meta name="description" content="([^"]+)">/),
      'description ≠ meta description');
    assert.strictEqual(pagina.inLanguage, nombre.startsWith('en/') ? 'en' : 'es');
    assert.strictEqual(pagina.mainEntity['@id'], servicio['@id']);
    assert.strictEqual(servicio.url, url);
    assert.strictEqual(servicio.provider['@id'], `${DOMINIO}/#empresa`);
    assert.deepStrictEqual(servicio.areaServed.map((a) => [a['@type'], a.name]),
      paises.map((p) => ['Country', p]), 'areaServed no lista los países del viaje');
    // Una fecha, la misma en tres lugares: dateModified, el "Actualizado"
    // visible y el lastmod del sitemap.
    assert.strictEqual(fechaVisible(visible(html)), pagina.dateModified,
      'la fecha visible no coincide con dateModified');
    assert.strictEqual(lastmodDe(url), pagina.dateModified,
      'el lastmod del sitemap no coincide con dateModified');
  });

  test(`${nombre}: la miga de pan visible es la del BreadcrumbList`, () => {
    const lista = grafoDe(html).find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
    const nav = sinComentarios(html).match(/<nav class="crumbs[^"]*"[^>]*>([\s\S]*?)<\/nav>/);
    assert.ok(nav, `${nombre} no muestra la miga de pan`);
    const items = [...nav[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map(([, li]) => {
      const a = li.match(/<a href="([^"]+)">([^<]+)<\/a>/);
      return a ? { href: a[1], nombre: a[2] } : { href: null, nombre: li.trim() };
    });
    assert.strictEqual(items.length, lista.length, 'la miga visible y la declarada tienen distinto largo');
    lista.forEach((item, i) => {
      assert.strictEqual(item.position, i + 1);
      assert.strictEqual(items[i].nombre, item.name, `el paso ${i + 1} de la miga no coincide`);
      if (i === lista.length - 1) {
        assert.strictEqual(item.item, undefined, 'el último paso no lleva enlace');
        assert.strictEqual(items[i].href, null, 'el último paso visible no lleva enlace');
      } else {
        // La portada se enlaza como index.html y su URL canónica es /.
        const href = items[i].href === 'index.html' ? '/' : items[i].href;
        const destino = href.startsWith('/') ? `${DOMINIO}${href}` : `${DOMINIO}/${href}`;
        assert.strictEqual(destino, item.item, `el enlace del paso ${i + 1} no coincide`);
      }
    });
  });

  test(`${nombre}: sin precios ni otro número de habilitación que el CNRT`, () => {
    const texto = visible(html);
    assert.ok(!/(US\$|USD|\$\s?\d|€|\bARS\b)/.test(texto), `${nombre} publica un precio`);
    assert.match(texto, /CNRT/);
    for (const [, numero] of texto.matchAll(/N(?:\.º|o\.)\s*(\d+)/g)) {
      assert.strictEqual(numero, '60284', `${nombre} publica el número ${numero}`);
    }
  });

  test(`${nombre}: todo enlace interno y toda imagen existen`, () => {
    const base = nombre.startsWith('en/') ? 'en' : '';
    for (const [, ref] of sinComentarios(html).matchAll(/\b(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
      if (/^(https?:|mailto:|tel:)/.test(ref)) continue;
      let archivo = ref.startsWith('/') ? ref.slice(1) : path.posix.join(base, ref);
      if (archivo === '' || archivo.endsWith('/')) archivo += 'index.html';
      assert.ok(fs.existsSync(path.join(raiz, archivo)), `${nombre} enlaza ${ref}, que no existe`);
    }
  });

  test(`${nombre}: la foto del encabezado existe y es la que se precarga`, () => {
    assert.match(html, new RegExp(`class="page-head-photo ${foto}"`));
    const regla = css.match(new RegExp(`\\.page-head-photo\\.${foto}\\{background-image:url\\('\\.\\./([^']+)'\\)`));
    assert.ok(regla, `turismo.css no define .${foto}`);
    assert.ok(fs.existsSync(path.join(raiz, regla[1])), `${regla[1]} no existe`);
    const precarga = atributo(html, /<link rel="preload" as="image" href="([^"]+)"/).replace(/^\//, '');
    assert.strictEqual(precarga, regla[1], 'la precarga no es la foto del encabezado');
  });
}

// Las páginas de ruta citan la página oficial de estado del paso que usan:
// es la información que cambia de un día para el otro.
test('cada página de ruta enlaza el estado oficial de su paso de frontera', () => {
  const pasos = {
    'traslado-salta-san-pedro-de-atacama.html': 'pasosinternacionales/detalle/ruta/19/Jama',
    'en/salta-to-san-pedro-de-atacama.html': 'pasosinternacionales/detalle/ruta/19/Jama',
    'traslado-salta-uyuni.html': 'pasosinternacionales/detalle/ruta/18/La-Quiaca-Villaz%C3%B3n',
    'en/salta-to-uyuni.html': 'pasosinternacionales/detalle/ruta/18/La-Quiaca-Villaz%C3%B3n',
  };
  for (const [nombre, paso] of Object.entries(pasos)) {
    assert.ok(paginas[nombre].includes(`href="https://www.argentina.gob.ar/seguridad/${paso}"`),
      `${nombre} no enlaza el estado oficial del paso`);
  }
  for (const nombre of ['traslado-salta-san-pedro-de-atacama.html', 'en/salta-to-san-pedro-de-atacama.html']) {
    assert.match(paginas[nombre], /href="https:\/\/www\.sag\.gob\.cl\//, `${nombre} no enlaza al SAG`);
  }
});

// Jerarquía navegable: la página que agrupa enlaza las dos rutas, cada ruta
// vuelve a ella y a su hermana, y el conjunto cuelga de la portada y de
// turismo en los dos idiomas.
test('las páginas internacionales están enlazadas entre sí y desde el sitio', () => {
  const enlaces = {
    'viajes-internacionales.html': ['traslado-salta-san-pedro-de-atacama.html', 'traslado-salta-uyuni.html'],
    'traslado-salta-san-pedro-de-atacama.html': ['viajes-internacionales.html', 'traslado-salta-uyuni.html'],
    'traslado-salta-uyuni.html': ['viajes-internacionales.html', 'traslado-salta-san-pedro-de-atacama.html'],
    'en/international-trips.html': ['/en/salta-to-san-pedro-de-atacama.html', '/en/salta-to-uyuni.html'],
    'en/salta-to-san-pedro-de-atacama.html': ['/en/international-trips.html', '/en/salta-to-uyuni.html'],
    'en/salta-to-uyuni.html': ['/en/international-trips.html', '/en/salta-to-san-pedro-de-atacama.html'],
    'index.html': ['viajes-internacionales.html'],
    'turismo.html': ['viajes-internacionales.html'],
    'en/index.html': ['/en/international-trips.html'],
    'en/tours-and-transfers.html': ['/en/international-trips.html'],
  };
  for (const [nombre, destinos] of Object.entries(enlaces)) {
    for (const destino of destinos) {
      assert.ok(sinComentarios(paginas[nombre]).includes(`href="${destino}"`),
        `${nombre} no enlaza ${destino}`);
    }
  }
});
