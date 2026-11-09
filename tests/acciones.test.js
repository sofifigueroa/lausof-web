// Las salidas de contacto (ronda 6 de lausof.com, 08/11/2026): una redacción
// por idioma en los botones de WhatsApp y correo (ACCIONES en
// scripts/empresa.mjs, que escriben scripts/bloques.mjs y scripts/acciones.mjs),
// «correo» y nunca «mail» en español, una regla para la barra del teléfono
// (BARRAS), la salida «coordinar con el equipo» pasado el límite de pasajeros
// (scripts/viaje.mjs) y el tipo `privacidad` de los mensajes pre-armados.
// Hasta esa ronda el mismo botón decía 8 cosas en español, 6 en inglés y 4
// en portugués (rondas-2026-11-07/2-estado-actual.md, W14).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas } = require('./util.js');

const guion = import('../scripts/acciones.mjs');
const empresa = import('../scripts/empresa.mjs');
const prefill = import('../scripts/prefill.mjs');
const viaje = import('../scripts/viaje.mjs');
const bloques = import('../scripts/bloques.mjs');

const idiomaDe = (n) => (n.startsWith('en/') ? 'en' : n.startsWith('pt/') ? 'pt' : 'es');
const zona = (html, n) => (html.match(new RegExp(`<!-- GENERADO:${n} [\\s\\S]*?<!-- \\/GENERADO:${n} -->`)) || [''])[0];
const deUrl = (href) => decodeURIComponent(href.replace(/&amp;/g, '&').split('text=')[1] || '');

test('cada página está al día con scripts/acciones.mjs (correr node scripts/acciones.mjs)', async () => {
  const { conAcciones } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.ok(conAcciones(html, nombre) === html, `${nombre}: hay botones genéricos sin la redacción de ACCIONES`);
  }
});

test('ningún botón de contacto dice un rótulo genérico viejo: sólo los de ACCIONES', async () => {
  const { GENERICOS, botonesDe } = await guion;
  const { ACCIONES } = await empresa;
  for (const [nombre, html] of Object.entries(paginas)) {
    const idioma = idiomaDe(nombre);
    const vigentes = new Set(Object.values(ACCIONES[idioma]).flatMap((a) => Object.values(a)));
    for (const b of botonesDe(html)) {
      if (GENERICOS[idioma][b.canal].includes(b.rotulo)) assert.ok(vigentes.has(b.rotulo), `${nombre}: «${b.rotulo}» no es de ACCIONES`);
    }
  }
});

test('en español ningún botón ni rótulo de la barra dice «mail»', async () => {
  const { botonesDe } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    if (idiomaDe(nombre) !== 'es') continue;
    for (const b of botonesDe(html)) assert.ok(!/\bmail\b/i.test(b.rotulo), `${nombre}: «${b.rotulo}»`);
  }
});

test('el cierre usa el mismo verbo para WhatsApp y correo, y «consultar» sólo donde no se cotiza', async () => {
  const { ACCIONES, accionDe } = await empresa;
  const { PAGINAS } = await prefill;
  let cierres = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const z = zona(html, 'CIERRE');
    if (!z) continue;
    cierres += 1;
    const a = ACCIONES[idiomaDe(nombre)][accionDe(PAGINAS[nombre])];
    const rotulos = [...z.matchAll(/<a class="btn[^"]*"[^>]*>(?:<svg[\s\S]*?<\/svg>)?([^<]*)<\/a>/g)].map((m) => m[1]).sort();
    assert.deepStrictEqual(rotulos, [a.wa, a.correo].sort(), nombre);
  }
  assert.ok(cierres >= 77, `sólo ${cierres} cierres`);
});

test('la barra sigue BARRAS: `tres` si y sólo si lleva tres botones, y cada botón dice su canal', async () => {
  const { ACCIONES, BARRAS } = await empresa;
  const { barraDe } = await bloques;
  assert.strictEqual(BARRAS[BARRAS.length - 1].caso, 'resto', 'la última regla es la de todas las demás');
  for (const [nombre, html] of Object.entries(paginas)) {
    const b = (zona(html, 'BARRA').match(/<div class="wa-bar[^"]*"[^>]*>[\s\S]*?<\/div>/) || [])[0];
    if (!b) continue;
    const idioma = idiomaDe(nombre);
    const { botones } = barraDe(nombre);
    const rotulos = [...b.matchAll(/<\/svg>([^<]*)<\/a>/g)].map((m) => m[1]);
    const tres = botones.length === 3;
    assert.strictEqual(b.startsWith('<div class="wa-bar tres"'), tres, `${nombre}: clase tres`);
    const esperado = botones.map((x) => ACCIONES[idioma].canal[x]);
    assert.deepStrictEqual(rotulos, esperado, nombre);
    // El contrato de la vitrina: el botón de WhatsApp sigue siendo <a class="btn btn-wa"> con su <svg>, sin <div> antes.
    assert.match(b, /^<div class="wa-bar[^"]*"[^>]*>(?:(?!<div)[\s\S])*?<a class="btn btn-wa"[^>]*><svg/, `${nombre}: contrato de la barra`);
  }
});

test('las páginas de privacidad piden una consulta sobre datos, nunca los renglones de una cotización', async () => {
  for (const nombre of ['privacidad.html', 'en/privacy.html', 'pt/privacidade.html']) {
    const html = paginas[nombre];
    const textos = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]*|mailto:[^"]*)"/g)].map((m) => decodeURIComponent(m[1].replace(/&amp;/g, '&')));
    assert.ok(textos.length >= 3, nombre);
    for (const t of textos) {
      assert.ok(/datos personales|personal data|dados pessoais/.test(t), `${nombre}: sin el renglón de privacidad`);
      assert.ok(!/Origen y destino|From and to|Origem e destino|cotizar|a quote|orçamento/.test(t), `${nombre}: renglones o primera línea de cotización`);
    }
  }
});

test('«coordinar con el equipo»: en cada página cuya fila «Unidades» nombra las plazas, con el WhatsApp de la página y el renglón del grupo', async () => {
  const { VIAJES } = await import('../scripts/viaje-datos.mjs');
  const { plazasDe, TEXTOS_VIAJE } = await viaje;
  let con = 0;
  for (const [nombre, dato] of Object.entries(VIAJES)) {
    const z = zona(paginas[nombre], 'VIAJE');
    const enlaces = [...z.matchAll(/<a class="datos-viaje-mapa datos-viaje-equipo" href="([^"]*)"[^>]*>([^<]*)<\/a>/g)];
    const n = plazasDe(dato);
    if (!n) { assert.strictEqual(enlaces.length, 0, `${nombre}: sin plazas en «Unidades» y con la salida`); continue; }
    con += 1;
    assert.strictEqual(enlaces.length, 1, `${nombre}: sin la salida «coordinar con el equipo»`);
    const t = TEXTOS_VIAJE[idiomaDe(nombre)];
    assert.strictEqual(enlaces[0][2], t.equipo.replace('{n}', n), nombre);
    // La salida va dentro de la fila «Unidades», que es la que nombra el límite.
    assert.match(z, new RegExp(`<dt>${t.filas.unidades}</dt><dd>[^<]*\\b${n}\\b[^<]*<a class="datos-viaje-mapa datos-viaje-equipo"`), `${nombre}: fuera de «Unidades»`);
    const texto = deUrl(enlaces[0][1]);
    const [primera, segunda] = texto.split('\n');
    assert.match(primera, /^(Hola|Hi|Hello|Olá) Lausof/, `${nombre}: sin la primera línea de la página`);
    assert.strictEqual(segunda, t.grupo.replace('{n}', n), `${nombre}: sin el renglón del grupo`);
    assert.ok(/^https:\/\/wa\.me\/5493875269009\?text=/.test(enlaces[0][1]), `${nombre}: otro número`);
  }
  assert.ok(con >= 45, `sólo ${con} páginas con la salida`);
});

test('plazasDe lee la unidad más grande de la fila «Unidades» en los tres idiomas, y nada en la 4x4', async () => {
  const { plazasDe } = await viaje;
  const fila = (valor) => ({ filas: { unidades: { valor } } });
  assert.strictEqual(plazasDe(fila('Combis de 19+1 plazas y camionetas 4x4')), 19);
  assert.strictEqual(plazasDe(fila('19-seat minibuses and 4x4 pickups')), 19);
  assert.strictEqual(plazasDe(fila('Vans de 19+1 lugares e caminhonetes 4x4')), 19);
  assert.strictEqual(plazasDe(fila('Combi para 19 pasajeros más el chofer, o camioneta 4x4')), 19);
  assert.strictEqual(plazasDe(fila('Camionetas 4x4 preparadas para ripio y altura')), null);
  assert.strictEqual(plazasDe({ filas: {} }), null);
});

test('rotuloDe: genérico → ACCIONES; propio de la página → igual; «mail» → «correo» en español', async () => {
  const { rotuloDe } = await guion;
  const es = { idioma: 'es', canal: 'wa', tipo: 'pasajeros', menu: false };
  assert.strictEqual(rotuloDe('Cotizá por WhatsApp', es), 'Cotizar por WhatsApp');
  assert.strictEqual(rotuloDe('Consultar disponibilidad', es), 'Cotizar por WhatsApp');
  assert.strictEqual(rotuloDe('Consultar por WhatsApp', { ...es, tipo: 'flota' }), 'Consultar por WhatsApp');
  assert.strictEqual(rotuloDe('Cotizar el traslado', es), 'Cotizar el traslado');
  assert.strictEqual(rotuloDe('WhatsApp', es), 'WhatsApp', 'un «WhatsApp» suelto fuera del menú es de su página');
  assert.strictEqual(rotuloDe('WhatsApp', { ...es, menu: true }), 'Cotizar por WhatsApp');
  assert.strictEqual(rotuloDe('Pedir la documentación por mail', { ...es, canal: 'correo' }), 'Pedir la documentación por correo');
  assert.strictEqual(rotuloDe('Request a quote by email', { idioma: 'en', canal: 'correo', tipo: 'empresa' }), 'Get a quote by email');
  assert.strictEqual(rotuloDe('Request the documents by email', { idioma: 'en', canal: 'correo', tipo: 'proveedor' }), 'Request the documents by email');
  assert.strictEqual(rotuloDe('Consultar disponibilidade', { idioma: 'pt', canal: 'wa', tipo: 'privacidad' }), 'Falar pelo WhatsApp');
});
