// La ficha de la empresa (#empresa) en los datos estructurados de cada página.
//
// Todas las páginas referencian https://www.lausof.com/#empresa por su @id.
// Un buscador lee cada página por separado, así que la referencia sólo
// "resuelve" si en ESA página hay un nodo con ese @id y con los datos. Hasta
// el 13/10/2026 la ficha completa estaba sólo en la portada (SCH-EMPRESA) y
// no llevaba el número de CNRT (SCH-CNRT).
//
//   - scripts/empresa.mjs escribe la misma ficha (FICHA) en todas las páginas.
//   - La portada lleva la ficha ampliada, a mano: cada dato de FICHA tiene
//     que figurar igual ahí.
//   - Los nodos se buscan en TODO el JSON-LD, a cualquier profundidad
//     (EN-JSONLD): una ficha redefinida dentro de un provider o de un about
//     no se escapa de la guardia.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sinComentarios } = require('./util.js');

const guion = import('../scripts/empresa.mjs');
const ID = 'https://www.lausof.com/#empresa';

// Todos los objetos del JSON-LD de la página, a cualquier profundidad.
function nodosDe(html, nombre) {
  const nodos = [];
  const recorrer = (valor) => {
    if (Array.isArray(valor)) { valor.forEach(recorrer); return; }
    if (valor && typeof valor === 'object') {
      nodos.push(valor);
      Object.values(valor).forEach(recorrer);
    }
  };
  for (const [, cuerpo] of sinComentarios(html).matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let datos;
    assert.doesNotThrow(() => { datos = JSON.parse(cuerpo); }, `JSON-LD roto en ${nombre}`);
    recorrer(datos);
  }
  return nodos;
}

// Las páginas con datos estructurados: todas menos las 404 y el archivo de
// verificación de Google (util.js ya lo deja afuera).
const conDatos = Object.keys(paginas).filter((n) => !n.endsWith('404.html'));

test('el recorrido del JSON-LD llega a los nodos anidados', () => {
  const html = `<script type="application/ld+json">{"@graph":[{"@type":"WebPage","mainEntity":{"@type":"Service","provider":{"@id":"${ID}","telephone":"x"}}}]}</script>`;
  const anidado = nodosDe(html, 'prueba').find((n) => n['@id'] === ID);
  assert.ok(anidado && anidado.telephone === 'x', 'no encontró el nodo anidado dentro de provider');
});

for (const nombre of conDatos) {
  test(`${nombre}: el JSON-LD resuelve #empresa con la ficha completa`, async () => {
    const { FICHA } = await guion;
    const nodos = nodosDe(paginas[nombre], nombre);
    const deEmpresa = nodos.filter((n) => n['@id'] === ID);
    assert.ok(deEmpresa.length > 0, `${nombre} no nombra la entidad #empresa`);

    // La definición: el nodo que trae los datos (los demás son referencias).
    const fichas = deEmpresa.filter((n) => n.telephone || n.address || n.legalName || n.identifier);
    assert.strictEqual(fichas.length, 1,
      `${nombre}: se espera una sola definición completa de #empresa y hay ${fichas.length}`);
    const ficha = fichas[0];
    for (const [clave, valor] of Object.entries(FICHA)) {
      if (clave === '@context') continue;
      assert.deepStrictEqual(ficha[clave], valor, `${nombre}: "${clave}" de #empresa no coincide con scripts/empresa.mjs`);
    }

    // Las referencias no contradicen la ficha: lo poco que repiten es igual.
    for (const ref of deEmpresa.filter((n) => n !== ficha)) {
      for (const [clave, valor] of Object.entries(ref)) {
        if (clave === '@type' || !(clave in FICHA)) continue;
        assert.deepStrictEqual(valor, FICHA[clave], `${nombre}: una referencia a #empresa dice otro "${clave}"`);
      }
    }
  });
}

test('toda página que no es la portada lleva el bloque generado, al día', async () => {
  const { conFicha, paginas: lista } = await guion;
  assert.deepStrictEqual(lista(), conDatos.filter((n) => n !== 'index.html').sort());
  for (const nombre of lista()) {
    assert.strictEqual(conFicha(paginas[nombre]), paginas[nombre],
      `${nombre} está desactualizada: correr node scripts/empresa.mjs`);
    assert.strictEqual((paginas[nombre].match(/GENERADO:EMPRESA —/g) || []).length, 1);
  }
  assert.ok(!/GENERADO:EMPRESA/.test(paginas['index.html']), 'la portada lleva la ficha ampliada, no el bloque generado');
});

test('la ficha dice quién es la empresa, dónde está, cómo llamarla y su habilitación CNRT', async () => {
  const { FICHA } = await guion;
  assert.strictEqual(FICHA.legalName, 'LAUSOF S.R.L.');
  assert.strictEqual(FICHA.alternateName, 'Lausof Transportes');
  assert.strictEqual(FICHA.brand.name, 'Lausof Transportes');
  assert.strictEqual(FICHA.url, 'https://www.lausof.com/');
  assert.match(FICHA.logo, /^https:\/\/www\.lausof\.com\/assets\/\S+\.png$/);
  assert.strictEqual(FICHA.telephone.replace(/\D/g, ''), '5493875269009', 'la única línea pública es el 387 526-9009');
  assert.deepStrictEqual(
    [FICHA.address.streetAddress, FICHA.address.addressLocality, FICHA.address.postalCode, FICHA.address.addressCountry],
    ['Junín 1334', 'Salta', 'A4400', 'AR']);
  assert.strictEqual(FICHA.identifier.propertyID, 'CNRT');
  assert.strictEqual(FICHA.identifier.value, '60284');
  assert.strictEqual(FICHA.hasCertification.certificationIdentification, '60284');
});

// Política de afirmaciones (BUILD-BRIEF): CNRT 60284 se publica; de AMT sólo
// la afirmación general, nunca un número; nada de aseguradoras ni de cantidad
// de unidades, y un solo teléfono.
test('la ficha no publica lo que la política deja afuera', async () => {
  const { FICHA } = await guion;
  const texto = JSON.stringify(FICHA);
  assert.doesNotMatch(texto, /AMT|expediente|permiso/i, 'la ficha nombra AMT o un número de permiso');
  assert.doesNotMatch(texto, /segur|asegurador|insur/i, 'la ficha nombra un seguro o una aseguradora');
  assert.doesNotMatch(texto, /numberOfEmployees|unidades|fleet/i, 'la ficha cuenta unidades');
  const telefonos = texto.match(/\+?54[-\s\d]{9,}/g) || [];
  assert.strictEqual(telefonos.length, 1, `la ficha tiene más de un teléfono: ${telefonos.join(', ')}`);
});
