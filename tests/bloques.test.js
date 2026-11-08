// Los bloques compartidos que escribe scripts/bloques.mjs (ronda 1 de
// lausof.com, 08/11/2026): franja de habilitaciones, cierre, pie de contacto,
// barra del teléfono y el puntaje de Google de las portadas. Hasta el
// 07/11/2026 estaban copiados a mano: 39 versiones de la franja, 28 del pie,
// el puntaje escrito de 6 maneras y 21 páginas con su propia copia del cierre
// (rondas-2026-11-07/2-estado-actual.md, W1, W2, W5, W11). Ninguna prueba
// miraba la estructura de estos bloques.
//
// También cuenta las anclas de la vitrina (tienda-v2-0611:scripts/tienda.mjs,
// ponerZonas): si una cambia, la vitrina deja de encontrar dónde ponerse.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sinComentarios } = require('./util.js');

const guion = import('../scripts/bloques.mjs');
const datos = import('../scripts/empresa.mjs');
const porPagina = import('../scripts/bloques-datos.mjs');

const idiomaDe = (n) => (n.startsWith('en/') ? 'en' : n.startsWith('pt/') ? 'pt' : 'es');
const zona = (html, n) => {
  const m = html.match(new RegExp(`<!-- GENERADO:${n} [\\s\\S]*?<!-- \\/GENERADO:${n} -->`, 'g')) || [];
  return m;
};

test('cada página está al día con scripts/bloques.mjs (correr node scripts/bloques.mjs)', async () => {
  const { conBloques, problemasDe } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.deepStrictEqual(problemasDe(html, nombre), [], nombre);
    assert.ok(conBloques(html, nombre) === html, `${nombre}: los bloques no están al día`);
  }
});

test('el cierre: uno por página con encabezado, cta-final, título, WhatsApp con su ícono y correo', async () => {
  const { PAGINAS } = await porPagina;
  let n = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const cierres = zona(html, 'CIERRE');
    if (!PAGINAS[nombre] || !PAGINAS[nombre].cierre) {
      assert.strictEqual(cierres.length, 0, `${nombre}: cierre sin datos`);
      continue;
    }
    n++;
    assert.strictEqual(cierres.length, 1, `${nombre}: un solo cierre`);
    const c = cierres[0];
    assert.match(c, /<section class="block cta-final"(?: id="[a-z-]+")?>/, `${nombre}: el cierre no es section.cta-final`);
    assert.match(c, /<h2>[^<]{3,}/, `${nombre}: cierre sin título`);
    assert.match(c, /<div class="cta-botones">/, `${nombre}: cierre sin la fila de botones`);
    assert.match(c, /<a class="btn btn-wa" href="https:\/\/wa\.me\/\d+\?text=[^"]+"[^>]*><svg[\s\S]*?<\/svg>[^<]+<\/a>/, `${nombre}: cierre sin WhatsApp pre-armado`);
    assert.match(c, /href="mailto:transporte@lausof\.com\?subject=[^"]+&amp;body=[^"]+"/, `${nombre}: cierre sin correo con asunto y renglones`);
    assert.doesNotMatch(c, /<div class="ctas">/, `${nombre}: el cierre no usa .ctas (es el ancla del encabezado para la vitrina)`);
    assert.doesNotMatch(html, /class="block (?:cta-(?!final)[a-z0-9]+|contacto-venta)"/, `${nombre}: queda una copia vieja del cierre`);
  }
  // Toda página con encabezado tiene cierre (antes faltaba en 21).
  const conEncabezado = Object.entries(paginas).filter(([n, h]) => /class="page-head"/.test(h) && !n.endsWith('404.html'));
  for (const [nombre, html] of conEncabezado) assert.strictEqual(zona(html, 'CIERRE').length, 1, `${nombre}: página con encabezado sin cierre`);
  assert.ok(n >= 77, `se esperaban 77 cierres, hay ${n}`);
});

test('la franja: una sola versión por familia de página e idioma, con el puntaje de Google como dato único', async () => {
  const { familiaDe } = await guion;
  const { datoResenas } = await datos;
  const versiones = new Map();
  for (const [nombre, html] of Object.entries(paginas)) {
    const franjas = zona(html, 'CONFIANZA');
    assert.ok(franjas.length <= 1, `${nombre}: más de una franja`);
    assert.strictEqual((html.match(/<div class="certs/g) || []).length, franjas.length, `${nombre}: franja fuera de la zona`);
    if (!franjas.length) continue;
    const clave = `${familiaDe(nombre)}/${idiomaDe(nombre)}`;
    const cuerpo = franjas[0].replace(/<!--[\s\S]*?-->/g, '').trim();
    if (!versiones.has(clave)) versiones.set(clave, new Set());
    versiones.get(clave).add(cuerpo);
  }
  for (const [clave, set] of versiones) assert.strictEqual(set.size, 1, `${clave}: ${set.size} versiones de la franja`);
  // Todas las grafías del puntaje del sitio son el dato de empresa.mjs.
  const permitidas = new Set(['es', 'en', 'pt'].map(datoResenas));
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const [g] of sinComentarios(html).matchAll(/4[,.]9[^<]{0,60}/g)) {
      assert.ok(permitidas.has(g.trim()), `${nombre}: el puntaje está escrito a mano: "${g}"`);
    }
  }
});

test('el pie de contacto: uno por página, igual en cada idioma salvo idiomas, cruce y las excepciones', async () => {
  const { PORTADAS } = await import('../scripts/menu.mjs');
  const versiones = { es: new Set(), en: new Set(), pt: new Set() };
  for (const [nombre, html] of Object.entries(paginas)) {
    const pies = zona(html, 'CONTACTO');
    assert.strictEqual(pies.length, 1, `${nombre}: un pie de contacto`);
    const p = pies[0];
    assert.match(p, /<a href="tel:\+5493875269009">/, `${nombre}: el pie no tiene el 526-9009`);
    assert.match(p, />transporte@lausof\.com<\/a>/, `${nombre}: el pie no tiene el correo`);
    assert.match(p, /Junín 1334/, `${nombre}: el pie no tiene el domicilio de la empresa`);
    if (PORTADAS.includes(nombre) || nombre === 'flota-en-venta.html') continue;
    const comun = p.replace(/<!-- GENERADO:CRUCE[\s\S]*?\/GENERADO:CRUCE -->/, '')
      .replace(/<p>(?:<a href="[^"]+" hreflang="[a-z]+" lang="[a-zA-Z-]+">[^<]+<\/a>(?: · )?)+<\/p>/, '')
      .replace(/href="[^"]*"/g, '').replace(/\s+/g, ' ');
    versiones[idiomaDe(nombre)].add(comun);
  }
  for (const [idioma, set] of Object.entries(versiones)) assert.ok(set.size <= 1, `${idioma}: ${set.size} versiones del pie de contacto`);
});

test('la barra del teléfono respeta el contrato de la vitrina (barraNueva)', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    const barras = html.match(/<div class="wa-bar[^"]*"[^>]*>[\s\S]*?<\/div>/g) || [];
    if (nombre.endsWith('404.html')) { assert.strictEqual(barras.length, 0, nombre); continue; }
    assert.strictEqual(barras.length, 1, `${nombre}: una sola barra`);
    assert.strictEqual(zona(html, 'BARRA').length, 1, `${nombre}: la barra no está en su zona`);
    // Sin <div> antes del botón de WhatsApp, que es <a class="btn btn-wa"> con su <svg>.
    assert.match(barras[0], /^<div class="wa-bar[^"]*"[^>]*>(?:(?!<div)[\s\S])*?<a class="btn btn-wa"[^>]*>(<svg[\s\S]*?<\/svg>)[^<]*<\/a>/, `${nombre}: el botón de WhatsApp de la barra cambió de forma`);
  }
});

// Las anclas de la vitrina (3-diseno.md §8.1, BRIEF «Rules»): cada una una vez
// por página donde está, y los .ctas del encabezado dentro de su sección.
test('las anclas de la vitrina: una vez por página y .ctas dentro del encabezado', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    if (!/<body[\s>]/.test(html)) continue;
    for (const a of ['</head>', '<!-- /GENERADO:LEGAL -->', '</body>']) {
      assert.strictEqual(html.split(a).length - 1, 1, `${nombre}: ${a} no aparece una vez`);
    }
    for (const a of ['<section class="page-head"', '<main>', '<div class="wa-bar']) {
      assert.ok(html.split(a).length - 1 <= 1, `${nombre}: ${a} aparece más de una vez`);
    }
    const ini = html.indexOf('<section class="page-head"');
    if (ini >= 0 && html.includes('<div class="ctas">')) {
      const fin = html.indexOf('</section>', ini);
      const ctas = html.indexOf('<div class="ctas">', ini);
      assert.ok(ctas > ini && ctas < fin, `${nombre}: el primer .ctas no está dentro del encabezado`);
    }
  }
});
