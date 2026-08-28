// Corrección de teléfonos: en Argentina los celulares llevan el 9 después
// del 54 (+549387...), los fijos no (+54387...). Un dígito de menos y el
// enlace marca a cualquier lado. Se revisan TODOS los tel: y wa.me de las
// dos páginas.
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');
// Cubre TODAS las páginas de la raíz: una página nueva entra sola.
const { paginas } = require('./util.js');

// Canon de teléfonos (27/08, indicación del dueño): el sitio quedó con dos
// líneas y una función para cada una. El 526-9009 es el móvil que toma las
// llamadas; el 509-2489 es el único WhatsApp (antes solo atendía la venta de
// flota, ahora es el de todo el sitio) y nunca va como tel:.
const lineasMoviles = ['5269009'];
const lineasWhatsApp = ['5493875092489'];

// Líneas dadas de baja: no vuelven a entrar ni en un enlace, ni en un texto,
// ni en un comentario. Se buscan en las dos formas en que se escriben.
const lineasMuertas = ['5377527', '537-7527', '4311584', '431-1584'];

const extraer = (contenido, patron) =>
  [...contenido.matchAll(patron)].map((m) => m[1]);

for (const [nombre, contenido] of Object.entries(paginas)) {
  const tels = extraer(contenido, /href="(tel:[^"]+)"/g);
  const was = extraer(contenido, /href="(https:\/\/wa\.me\/[^"]+)"/g);

  test(`${nombre}: hay enlaces de teléfono y de WhatsApp`, () => {
    assert.ok(tels.length > 0, `no se encontró ningún tel: en ${nombre}`);
    assert.ok(was.length > 0, `no se encontró ningún wa.me en ${nombre}`);
  });

  test(`${nombre}: todo wa.me apunta a la línea de WhatsApp`, () => {
    for (const href of was) {
      const m = href.match(/^https:\/\/wa\.me\/(\d+)(\?text=[^"]*)?$/);
      assert.ok(m, `wa.me con formato inesperado: ${href}`);
      assert.ok(lineasWhatsApp.includes(m[1]),
        `wa.me a una línea que no atiende WhatsApp: ${href}`);
    }
  });

  // El 509-2489 atiende solo por WhatsApp: si aparece en un tel:, el que
  // llama cae en una línea que nadie levanta.
  test(`${nombre}: el 509-2489 nunca se ofrece para llamar`, () => {
    for (const href of tels) {
      assert.ok(!href.includes('5092489'),
        `el 509-2489 es solo WhatsApp y quedó como tel:: ${href}`);
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
  // El WhatsApp de la tarjeta va a la línea que atiende; el tel: al móvil que
  // toma llamadas. Las dos cosas tienen que estar: el que quedó varado elige.
  assert.ok(wa[1].includes('/5493875092489?'),
    'la plantilla de auxilio no va al WhatsApp que atiende');
  assert.ok(tarjeta.includes('href="tel:+5493875269009"'),
    'la tarjeta de auxilio no tiene enlace tel: para llamar directo');
});

// Guardia dura: las líneas dadas de baja no pueden reaparecer en ninguna
// página de la raíz. Se lee del disco (no de `paginas`) para que entre también
// el archivo de verificación de Google y cualquier .html nuevo, y se mira el
// archivo entero —comentarios incluidos— porque un número muerto en un
// comentario es el que después alguien vuelve a pegar en el HTML.
const raiz = path.join(__dirname, '..');
for (const nombre of fs.readdirSync(raiz).sort()) {
  if (!nombre.endsWith('.html')) continue;
  const contenido = fs.readFileSync(path.join(raiz, nombre), 'utf8');
  test(`${nombre}: no quedó ninguna línea dada de baja`, () => {
    for (const muerta of lineasMuertas) {
      assert.ok(!contenido.toLowerCase().includes(muerta),
        `${nombre} volvió a nombrar la línea de baja ${muerta}`);
    }
  });
}
