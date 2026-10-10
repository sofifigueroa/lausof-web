// Alquiler 4x4 y logística minera, después de las respuestas de la familia
// del 10/10/2026 (vía Lautaro, `~/lausof/web/growth-2026-10/BUILD-BRIEF.md`):
//   5. el alquiler 4x4 es para turistas y empresas, con o sin chofer;
//   6. en minería, Lausof atiende todas las áreas y rutas de la Puna.
// Estas guardias sostienen esas dos afirmaciones en los dos idiomas, el
// camino de reserva, los requisitos para quien maneja desde el exterior (con
// su fuente oficial a la vista) y los vetos que siguen vigentes: sin precios,
// sin aseguradoras, sin clientes.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sinComentarios } = require('./util.js');

// Lo que el visitante ve: sin comentarios, scripts ni etiquetas.
const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;|&#\d+;/gi, ' ')
  .replace(/\s+/g, ' ');

const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap((m) => { const d = JSON.parse(m[1]); return d['@graph'] || [d]; });

const servicio = (html) => jsonLd(html).find((n) => n['@type'] === 'Service');

const alquiler = { es: 'alquiler-4x4.html', en: 'en/4x4-rental.html' };
const mineria = { es: 'logistica-minera.html', en: 'en/mining-logistics.html' };

// ---------------------------------------------------------------------------
// Alquiler 4x4
// ---------------------------------------------------------------------------
test('alquiler 4x4: abierto a viajeros y empresas, con o sin chofer (ES)', () => {
  const t = visible(paginas[alquiler.es]);
  assert.match(t, /con o sin chofer/i);
  assert.match(t, /viajeros/i);
  assert.match(t, /empresas/i);
  assert.match(t, /¿Alquilan a turistas extranjeros\?/);
  assert.doesNotMatch(t, /es un servicio para empresas/i,
    'volvió la frase que limitaba el alquiler a empresas');
});

test('alquiler 4x4: abierto a viajeros y empresas, con o sin chofer (EN)', () => {
  const t = visible(paginas[alquiler.en]);
  assert.match(t, /self-drive or with a driver/i);
  assert.match(t, /travelers/i);
  assert.match(t, /companies/i);
  assert.match(t, /Do you rent to foreign travelers\?/);
  assert.doesNotMatch(t, /is a service for companies/i,
    'volvió la frase que limitaba el alquiler a empresas');
});

test('alquiler 4x4: el título y la descripción ya no lo venden sólo a empresas', () => {
  for (const nombre of Object.values(alquiler)) {
    const titulo = paginas[nombre].match(/<title>([^<]+)<\/title>/)[1];
    assert.match(titulo, /chofer|driver/i, `${nombre}: el título no dice con o sin chofer`);
    assert.match(titulo, /Viajeros|Travelers/, `${nombre}: el título no nombra a los viajeros`);
    assert.doesNotMatch(servicio(paginas[nombre]).description, /^(Alquiler mensual|Monthly)/,
      `${nombre}: la ficha Service sigue diciendo que el alquiler es sólo mensual`);
  }
});

test('alquiler 4x4: la ficha Service incluye Chile y Bolivia en el área servida', () => {
  for (const nombre of Object.values(alquiler)) {
    const areas = servicio(paginas[nombre]).areaServed.map((a) => a.name);
    for (const area of ['Salta', 'Jujuy', 'Chile', 'Bolivia']) {
      assert.ok(areas.includes(area), `${nombre}: falta ${area} en areaServed`);
    }
  }
});

// El camino de reserva: una sección propia con los pasos y los dos canales.
test('alquiler 4x4: tiene sección de reserva con WhatsApp y correo', () => {
  for (const [nombre, id] of [[alquiler.es, 'reservar'], [alquiler.en, 'booking']]) {
    const html = sinComentarios(paginas[nombre]);
    const desde = html.indexOf(`id="${id}"`);
    assert.ok(desde > -1, `${nombre}: falta la sección #${id}`);
    const seccion = html.slice(desde, html.indexOf('</section>', desde));
    assert.match(seccion, /href="https:\/\/wa\.me\/5493875269009\?text=/, `${nombre}: la reserva no tiene WhatsApp`);
    assert.match(seccion, /href="mailto:contacto@lausof\.com\?cc=transporte@lausof\.com/, `${nombre}: la reserva no tiene correo`);
    assert.strictEqual((seccion.match(/<b>[1-4]\. /g) || []).length, 4, `${nombre}: la reserva no muestra los cuatro pasos`);
    assert.ok(html.includes(`href="#${id}"`), `${nombre}: el encabezado no enlaza a #${id}`);
  }
});

// Requisitos para quien maneja desde el exterior: cada dato normativo va con
// su fuente oficial enlazada (leídas el 10/10/2026).
const fuentesOficiales = [
  'https://www.argentina.gob.ar/transporte/mundial-sub-20-argentina-2023/informacion-sobre-licencias-de-conducir-internacionales',
  'https://www.afip.gob.ar/viajeros/ayuda/viajes-a-chile.asp',
  'https://www.aduana.cl/viajes-en-auto/aduana/2018-12-28/084645.html',
  'https://www.afip.gob.ar/viajeros/ayuda/desde-y-hacia-bolivia.asp',
];

test('alquiler 4x4: requisitos para extranjeros con fuente oficial enlazada', () => {
  for (const [nombre, id] of [[alquiler.es, 'viajeros'], [alquiler.en, 'foreign-drivers']]) {
    const html = sinComentarios(paginas[nombre]);
    const desde = html.indexOf(`id="${id}"`);
    assert.ok(desde > -1, `${nombre}: falta la sección #${id}`);
    const seccion = html.slice(desde, html.indexOf('</section>', desde));
    for (const url of fuentesOficiales) {
      assert.ok(seccion.includes(`href="${url}"`), `${nombre}: falta la fuente ${url}`);
    }
    const t = visible(seccion);
    assert.match(t, /Ginebra|Geneva/, `${nombre}: falta la convención de Ginebra`);
    assert.match(t, /Viena|Vienna/, `${nombre}: falta la convención de Viena`);
    assert.match(t, /\(ACM\)/, `${nombre}: falta la autorización ACM para salir con un vehículo alquilado`);
    assert.match(t, /90 d[ií]as|90 days/, `${nombre}: falta el plazo de 90 días de Chile`);
  }
});

test('alquiler 4x4: rutas típicas con los pasos a Chile y Bolivia', () => {
  for (const nombre of Object.values(alquiler)) {
    const t = visible(paginas[nombre]);
    const ruta40 = nombre.startsWith('en/') ? 'Route 40' : 'Ruta 40';
    for (const lugar of [ruta40, 'Salinas Grandes', 'Tolar Grande', 'San Pedro de Atacama', 'Uyuni', 'Jama', 'Sico', 'La Quiaca']) {
      assert.ok(t.includes(lugar), `${nombre}: falta "${lugar}" en las rutas`);
    }
  }
});

// Vetos de Lautaro que siguen vigentes: sin precios, sin aseguradoras.
const aseguradoras = /\b(San Crist[oó]bal|Sancor|La Segunda|Federaci[oó]n Patronal|Rivadavia|Mapfre|Allianz|Zurich|HDI|Mercantil Andina|Provincia Seguros|La Caja|Liderar|Rus\b)/i;

test('alquiler 4x4 y minería: sin precios ni aseguradoras', () => {
  for (const nombre of [...Object.values(alquiler), ...Object.values(mineria)]) {
    const t = visible(paginas[nombre]);
    const precio = t.match(/(US\$|USD|U\$S|ARS|\$\s?\d|€|\d+\s?(d[oó]lares|pesos|dollars))/i);
    assert.ok(!precio, `${nombre} publica un precio: "${precio && precio[0]}"`);
    const m = t.match(aseguradoras);
    assert.ok(!m, `${nombre} nombra una aseguradora: "${m && m[0]}"`);
  }
});

// ---------------------------------------------------------------------------
// Logística minera
// ---------------------------------------------------------------------------
test('minería: todas las áreas de la Puna, en Salta, Jujuy y Catamarca', () => {
  for (const [nombre, id, frase] of [
    [mineria.es, 'zonas', /todas las áreas y rutas mineras de la Puna/i],
    [mineria.en, 'areas', /all the mining areas and routes of the Puna/i],
  ]) {
    const html = sinComentarios(paginas[nombre]);
    const desde = html.indexOf(`id="${id}"`);
    assert.ok(desde > -1, `${nombre}: falta la sección #${id}`);
    const t = visible(html.slice(desde, html.indexOf('</section>', desde)));
    assert.match(t, frase, `${nombre}: no dice que atiende todas las áreas`);
    for (const lugar of ['Salta', 'Jujuy', 'Catamarca', 'Pocitos', 'Rincón', 'Arizaro', 'Pastos Grandes',
      'Olaroz', 'Cauchari', 'Hombre Muerto', 'Tres Quebradas', 'Tolar Grande', 'Antofagasta de la Sierra']) {
      assert.ok(t.includes(lugar), `${nombre}: falta "${lugar}" en las zonas`);
    }
  }
});

test('minería: la ficha Service sirve Salta, Jujuy y Catamarca', () => {
  for (const nombre of Object.values(mineria)) {
    const areas = servicio(paginas[nombre]).areaServed.map((a) => a.name);
    assert.deepStrictEqual(areas, ['Salta', 'Jujuy', 'Catamarca'], `${nombre}: areaServed = ${areas}`);
  }
});

// Las zonas se nombran como lugares: ningún cliente ni operador minero.
const operadores = /\b(Rio Tinto|Arcadium|Livent|Allkem|Ganfeng|Eramet|Galan|Zijin|First Quantum|Lithium South|Minera Exar|POSCO|Fortescue|Glencore|Pan American|Mansfield)\b/i;

test('minería y alquiler 4x4: no nombran operadores mineros ni clientes', () => {
  for (const nombre of [...Object.values(alquiler), ...Object.values(mineria)]) {
    const m = visible(paginas[nombre]).match(operadores);
    assert.ok(!m, `${nombre} nombra un operador minero: "${m && m[0]}"`);
  }
});
