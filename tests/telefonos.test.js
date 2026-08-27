// Corrección de teléfonos: en Argentina los celulares llevan el 9 después
// del 54 (+549387...), los fijos no (+54387...). Un dígito de menos y el
// enlace marca a cualquier lado. Se revisan TODOS los tel: y wa.me de las
// dos páginas.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
// Cubre TODAS las páginas de la raíz: una página nueva entra sola.
const { paginas } = require('./util.js');

// Líneas conocidas: las dos móviles del sitio + la móvil de venta de flota
// son celulares; la 431-1584 es fija.
const lineasMoviles = ['5377527', '5269009', '5092489'];

// El WhatsApp solo atiende en dos líneas: la general y la de venta de flota.
// La 526-9009 toma llamadas pero no tiene WhatsApp: nunca va como wa.me.
const lineasWhatsApp = ['5493875377527', '5493875092489'];

const extraer = (contenido, patron) =>
  [...contenido.matchAll(patron)].map((m) => m[1]);

for (const [nombre, contenido] of Object.entries(paginas)) {
  const tels = extraer(contenido, /href="(tel:[^"]+)"/g);
  const was = extraer(contenido, /href="(https:\/\/wa\.me\/[^"]+)"/g);

  test(`${nombre}: hay enlaces de teléfono y de WhatsApp`, () => {
    assert.ok(tels.length > 0, `no se encontró ningún tel: en ${nombre}`);
    assert.ok(was.length > 0, `no se encontró ningún wa.me en ${nombre}`);
  });

  test(`${nombre}: todo wa.me apunta a una de las dos líneas con WhatsApp`, () => {
    for (const href of was) {
      const m = href.match(/^https:\/\/wa\.me\/(\d+)(\?text=[^"]*)?$/);
      assert.ok(m, `wa.me con formato inesperado: ${href}`);
      assert.ok(lineasWhatsApp.includes(m[1]),
        `wa.me a una línea que no atiende WhatsApp: ${href}`);
    }
  });

  test(`${nombre}: todo tel: es celular con 9 o fijo sin 9`, () => {
    for (const href of tels) {
      assert.match(href, /^tel:\+54(?:9387|387)\d{7}$/,
        `tel: con formato inesperado: ${href}`);
    }
  });

  test(`${nombre}: ninguna línea móvil quedó sin el 9`, () => {
    for (const href of tels) {
      const linea = href.slice(-7);
      if (lineasMoviles.includes(linea)) {
        assert.ok(href.startsWith('tel:+549387'),
          `la línea móvil ${linea} está sin el 9: ${href}`);
      }
    }
  });
}

// La tarjeta de auxilio atiende al que está varado: el WhatsApp va con la
// plantilla de despacho (ubicación / vehículo / qué pasó) y el teléfono para
// llamar está adentro de la tarjeta, no solo en el pie.
test('index.html: la tarjeta de auxilio lleva plantilla de WhatsApp y tel: visible', () => {
  const index = paginas['index.html'];
  const desde = index.indexOf('<h3>Auxilio mecánico y remolques</h3>');
  assert.ok(desde > -1, 'no está la tarjeta de auxilio');
  const tarjeta = index.slice(desde, index.indexOf('</article>', desde));
  const wa = tarjeta.match(/href="(https:\/\/wa\.me\/[^"]+)"/);
  assert.ok(wa, 'la tarjeta de auxilio perdió su enlace de WhatsApp');
  for (const campo of ['Ubicaci%C3%B3n%3A', 'Veh%C3%ADculo%3A', 'Qu%C3%A9%20pas%C3%B3%3A']) {
    assert.ok(wa[1].includes(campo), `la plantilla de auxilio perdió el campo ${campo}`);
  }
  // 27/08: el 537-7527 quedó sin línea (solo WhatsApp); el tel: de auxilio va al 526-9009.
  assert.ok(tarjeta.includes('href="tel:+5493875269009"'),
    'la tarjeta de auxilio no tiene enlace tel: para llamar directo');
  assert.ok(!tarjeta.includes('tel:+5493875377527'),
    'la tarjeta de auxilio sigue ofreciendo llamar al 537-7527, que no tiene línea');
});
