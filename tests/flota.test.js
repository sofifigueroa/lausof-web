// Página de flota pre-renderizada: las tarjetas y el ItemList ya no los arma
// el navegador, vienen escritos en el HTML por scripts/generar-flota.mjs a
// partir de scripts/unidades.mjs. Estos tests verifican que lo publicado
// coincida con la configuración y que el circuito de regeneración (editar
// unidades.mjs → correr el generador) siga entero.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { flota, sinComentarios } = require('./util.js');

// Lo que ve el visitante (y los crawlers), sin los comentarios de trabajo.
const visible = sinComentarios(flota);

// La configuración real: los tests comparan contra ella, no contra una copia
// a mano, así una unidad nueva o un cambio de precio quedan cubiertos solos.
const config = import('../scripts/unidades.mjs');
const generador = import('../scripts/generar-flota.mjs');

const formatoPesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const precioTexto = (u) => {
  if (u.precio == null) return 'A publicar';
  const numero = formatoPesos.format(u.precio);
  return u.moneda === 'USD' ? 'US$ ' + numero : '$ ' + numero;
};
const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

test('toda unidad publicada está en el HTML con su nombre y su precio', async () => {
  const { UNIDADES } = await config;
  const publicadas = UNIDADES.filter((u) => u.estado !== 'proximamente');
  assert.ok(publicadas.length >= 1, 'la configuración quedó sin unidades publicadas');
  for (const unidad of publicadas) {
    assert.ok(visible.includes(`<h3>${escapar(unidad.titulo)}</h3>`),
      `falta la tarjeta de "${unidad.titulo}"`);
    assert.ok(visible.includes(`<div class="unidad-precio">${precioTexto(unidad)}`),
      `falta el precio ${precioTexto(unidad)} de "${unidad.titulo}"`);
  }
});

test('el bloque "próximamente" refleja la configuración', async () => {
  const { UNIDADES, MOSTRAR_PROXIMAS } = await config;
  const proximas = MOSTRAR_PROXIMAS ? UNIDADES.filter((u) => u.estado === 'proximamente') : [];
  const seccion = flota.match(/<section class="proximas" id="bloque-proximas"[^>]*>/);
  assert.ok(seccion, 'desapareció la sección #bloque-proximas');
  if (proximas.length) {
    assert.ok(!seccion[0].includes('hidden'),
      'hay unidades por publicar pero el bloque "próximamente" sigue oculto');
    for (const unidad of proximas) {
      const tarjeta = visible.match(new RegExp(
        `<article class="card unidad is-proxima">[\\s\\S]*?</article>`));
      assert.ok(tarjeta && tarjeta[0].includes(`<h3>${escapar(unidad.titulo)}</h3>`),
        `falta la tarjeta próximamente de "${unidad.titulo}"`);
      assert.ok(tarjeta[0].includes('Próximamente'), 'la tarjeta próxima perdió su etiqueta');
      assert.ok(tarjeta[0].includes('A publicar'), 'la tarjeta próxima perdió el "A publicar"');
      assert.ok(!tarjeta[0].includes('btn-ml'),
        'una unidad sin publicar no puede enlazar a Mercado Libre');
    }
  } else {
    assert.ok(seccion[0].includes('hidden'),
      'no hay unidades por publicar y el bloque "próximamente" quedó visible');
  }
});

test('el ItemList estático parsea y lista todas las publicadas', async () => {
  const { UNIDADES } = await config;
  const publicadas = UNIDADES.filter((u) => u.estado !== 'proximamente');
  const bloque = flota.match(/<script type="application\/ld\+json" id="datos-estructurados">([\s\S]*?)<\/script>/);
  assert.ok(bloque, 'no está el ItemList estático (id="datos-estructurados")');
  const datos = JSON.parse(bloque[1]);
  assert.strictEqual(datos['@type'], 'ItemList');
  assert.strictEqual(datos.itemListElement.length, publicadas.length,
    'el ItemList no lista la misma cantidad de unidades que la configuración');
  datos.itemListElement.forEach((item, indice) => {
    assert.strictEqual(item.item.name, publicadas[indice].titulo);
    assert.strictEqual(item.item.url, publicadas[indice].url);
    assert.strictEqual(item.item.offers.price, publicadas[indice].precio);
    assert.strictEqual(item.item.offers.priceCurrency, publicadas[indice].moneda);
  });
});

test('cada tarjeta consulta al WhatsApp de ventas por su unidad', async () => {
  const { UNIDADES, WHATSAPP } = await config;
  const botones = [...visible.matchAll(/<a class="btn btn-wa" href="(https:\/\/wa\.me\/[^"?]+)\?text=([^"]*)"/g)]
    .filter(([, , texto]) => texto.includes('la%20unidad'));
  assert.strictEqual(botones.length, UNIDADES.length,
    `se esperaba un botón de consulta por cada una de las ${UNIDADES.length} unidades`);
  for (const [, numero] of botones) {
    assert.strictEqual(numero, `https://wa.me/${WHATSAPP}`,
      'una tarjeta consulta a un número que no es el de ventas');
  }
});

test('los avisos en otros sitios (deRuedas) siguen enlazados', async () => {
  const { UNIDADES } = await config;
  for (const unidad of UNIDADES) {
    for (const aviso of unidad.otrosAvisos || []) {
      assert.ok(visible.includes(`href="${aviso.url}"`),
        `la tarjeta de "${unidad.titulo}" perdió el enlace a ${aviso.nombre}`);
    }
  }
});

test('toda foto de tarjeta declara width y height (sin saltos de layout)', () => {
  const zona = flota.match(/<!-- GENERADO:UNIDADES [\s\S]*?<!-- \/GENERADO:PROXIMAS -->/);
  assert.ok(zona, 'no se encontraron las zonas generadas de tarjetas');
  const fotos = [...zona[0].matchAll(/<img [^>]*>/g)];
  assert.ok(fotos.length > 0, 'las tarjetas quedaron sin fotos');
  for (const [etiqueta] of fotos) {
    assert.match(etiqueta, /width="\d+"/, `foto sin width: ${etiqueta.slice(0, 80)}`);
    assert.match(etiqueta, /height="\d+"/, `foto sin height: ${etiqueta.slice(0, 80)}`);
  }
});

// Sin los marcadores, el generador no sabe qué reemplazar y el circuito de
// edición (unidades.mjs → generar-flota.mjs) se rompe en silencio.
test('los marcadores GENERADO siguen en su lugar', () => {
  for (const zona of ['JSONLD', 'UNIDADES', 'PROXIMAS']) {
    assert.ok(new RegExp(`<!-- GENERADO:${zona} [^>]*-->`).test(flota),
      `falta el marcador de apertura GENERADO:${zona}`);
    assert.ok(flota.includes(`<!-- /GENERADO:${zona} -->`),
      `falta el marcador de cierre /GENERADO:${zona}`);
  }
});

// La verificación más fuerte: regenerar en memoria tiene que devolver el
// archivo tal cual está. Si alguien editó unidades.mjs sin correr el
// generador (o retocó una zona generada a mano), este test lo frena.
test('el HTML publicado está sincronizado con scripts/unidades.mjs', async () => {
  const { generar } = await generador;
  assert.strictEqual(generar(flota), flota,
    'flota-en-venta.html quedó desincronizado: correr `node scripts/generar-flota.mjs`');
});
