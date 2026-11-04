// Alquiler 4x4 y logística minera:
//   - 4x4 (04/11/2026, decisión de Lautaro, opción D): Lausof no alquila sin
//     chofer a turistas (en Salta eso es "rent a car" y pide habilitación
//     provincial: Decreto 2461/00, modificado por los 2112/10 y 636/14;
//     web/tarifario/informes/alquiler.md). A los viajeros, 4x4 con chofer,
//     también a Chile y Bolivia; a empresas y contratistas mineros, alquiler
//     mensual con o sin chofer. Reemplaza la respuesta de la familia del
//     10/10/2026 (punto 5 del BUILD-BRIEF: turistas y empresas, con o sin
//     chofer).
//   - Minería (familia, 10/10/2026, punto 6): Lausof atiende todas las áreas y
//     rutas de la Puna.
// Estas guardias sostienen las dos cosas en los dos idiomas, el camino de
// reserva y los vetos que siguen vigentes: sin precios, sin aseguradoras, sin
// clientes.
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
test('alquiler 4x4: a viajeros con chofer, a empresas por mes con o sin chofer (ES)', () => {
  const t = visible(paginas[alquiler.es]);
  assert.match(t, /Camionetas 4x4 con chofer para viajeros/);
  assert.match(t, /Alquiler mensual de camionetas 4x4, con o sin chofer/);
  assert.match(t, /servicio por contrato para empresas/);
  assert.match(t, /No alquilamos camionetas sin chofer a turistas/);
  assert.match(t, /¿Alquilan camionetas sin chofer a turistas\? No\./);
  assert.match(t, /empresas de alquiler habilitadas en Salta/);
});

test('alquiler 4x4: a viajeros con chofer, a empresas por mes con o sin chofer (EN)', () => {
  const t = visible(paginas[alquiler.en]);
  assert.match(t, /4x4 pickups with a driver for travelers/);
  assert.match(t, /Monthly 4x4 pickup rental, with or without a driver/);
  assert.match(t, /contract service for companies/);
  assert.match(t, /We do not rent self-drive pickups to tourists/);
  assert.match(t, /Do you rent self-drive pickups to tourists\? No\./);
  assert.match(t, /licensed rental companies in Salta/);
});

// Lo que no puede volver: el "Sí" a turistas que manejan, la oferta de 4x4
// sin chofer para viajeros, los requisitos para conducir desde el exterior y
// la promesa de dejar la camioneta en otra ciudad.
test('alquiler 4x4: ningún sí al alquiler sin chofer para turistas', () => {
  for (const nombre of Object.values(alquiler)) {
    const t = visible(paginas[nombre]);
    for (const vedado of [
      /¿Alquilan a turistas extranjeros\?/, /Do you rent to foreign travelers\?/,
      /Viajeros que manejan/, /Travelers who drive/, /4x4 sin chofer para recorrer/, /self-drive 4x4 to explore/i,
      /Alquilamos a viajeros/, /We rent to travelers/,
      /licencia del país de origen/, /home license is enough/i, /permiso internacional para conducir/i, /International Driving Permit/i,
      /\(ACM\)/, /self-drive or with (a )?driver/i, /con o sin chofer, para viajeros/i,
    ]) {
      assert.doesNotMatch(t, vedado, `${nombre}: volvió ${vedado}`);
    }
  }
});

test('alquiler 4x4: el título, la descripción y la ficha Service no venden sin chofer a viajeros', () => {
  for (const nombre of Object.values(alquiler)) {
    const html = paginas[nombre];
    const titulo = html.match(/<title>([^<]+)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="([^"]+)">/)[1];
    const h1 = html.match(/<h1>([^<]+)<\/h1>/)[1];
    assert.match(titulo, /Con Chofer para Viajeros|With a Driver for Travelers/, `${nombre}: título ${titulo}`);
    assert.match(titulo, /Empresas|Companies/, `${nombre}: el título no nombra a las empresas`);
    for (const texto of [titulo, desc, h1, servicio(html).description]) {
      assert.doesNotMatch(texto, /self-drive|sin chofer para viajeros|o sin chofer, para viajeros/i, `${nombre}: ${texto}`);
    }
    assert.match(servicio(html).description, /^(Camionetas 4x4 con chofer para viajeros|4x4 pickups with a driver for travelers)/,
      `${nombre}: la ficha Service no abre con la 4x4 con chofer`);
  }
});

// El mensaje pre-armado de la 4x4 ya no pregunta "con o sin chofer": separa
// viajero de empresa desde el primer mensaje.
test('alquiler 4x4: los mensajes pre-armados no ofrecen manejar', () => {
  for (const nombre of Object.values(alquiler)) {
    const enlaces = [...paginas[nombre].matchAll(/href="((?:https:\/\/wa\.me\/|mailto:)[^"]+)"/g)].map((m) => decodeURIComponent(m[1].replace(/&amp;/g, '&')));
    assert.ok(enlaces.length > 0);
    for (const e of enlaces) {
      assert.doesNotMatch(e, /sin chofer|self-drive|sem motorista|Lugar de retiro|Pickup place/i, `${nombre}: ${e.slice(0, 120)}`);
    }
  }
});

// Las páginas para viajeros, agencias y operadores enlazan la 4x4 "con chofer",
// nunca "con o sin chofer": quien llega desde ahí vende o compra un viaje
// turístico (la de inglés para operadores se escapó en el primer pase).
test('alquiler 4x4: las páginas de turismo y agencias la enlazan con chofer', () => {
  for (const nombre of ['agencias-y-hoteles.html', 'en/ground-transport-for-tour-operators.html', 'turismo.html', 'pt/passeios-e-traslados.html', 'viajes-internacionales.html', 'en/international-trips.html']) {
    const enlaces = [...sinComentarios(paginas[nombre]).matchAll(/<a [^>]*href="\/(?:en\/4x4-rental|alquiler-4x4)\.html"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => m[1]);
    for (const e of enlaces) {
      assert.doesNotMatch(e, /o sin chofer|or without a driver|ou sem motorista|self-drive/i, `${nombre}: «${e}»`);
    }
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
    assert.match(seccion, /href="mailto:transporte@lausof\.com\?subject=/, `${nombre}: la reserva no tiene correo`);
    assert.strictEqual((seccion.match(/<b>[1-4]\. /g) || []).length, 4, `${nombre}: la reserva no muestra los cuatro pasos`);
    assert.ok(html.includes(`href="#${id}"`), `${nombre}: el encabezado no enlaza a #${id}`);
  }
});

// Viajeros: la sección propia lleva el cruce con chofer y manda a las páginas
// de ruta, donde viven los documentos de frontera con sus fuentes oficiales.
test('alquiler 4x4: la sección de viajeros es con chofer y enlaza las rutas a Chile y Bolivia', () => {
  for (const [nombre, id, rutas] of [
    [alquiler.es, 'viajeros', ['/traslado-salta-san-pedro-de-atacama.html', '/traslado-salta-uyuni.html']],
    [alquiler.en, 'travelers', ['/en/salta-to-san-pedro-de-atacama.html', '/en/salta-to-uyuni.html']],
  ]) {
    const html = sinComentarios(paginas[nombre]);
    const desde = html.indexOf(`id="${id}"`);
    assert.ok(desde > -1, `${nombre}: falta la sección #${id}`);
    const seccion = html.slice(desde, html.indexOf('</section>', desde));
    for (const ruta of rutas) assert.ok(seccion.includes(`href="${ruta}"`), `${nombre}: falta el enlace a ${ruta}`);
    assert.match(visible(seccion), /siempre con uno de nuestros choferes|always comes with one of our drivers/);
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
