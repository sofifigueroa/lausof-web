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

// Ronda 4 (08/11/2026, «confianza y pruebas»; rondas-2026-11-07/3-diseno.md v4).
test('el puntaje de Google, enlazado al perfil, en toda página que vende (M14 a)', async () => {
  const { RESENAS_GOOGLE } = await datos;
  const { AVISOS } = await import('../scripts/privacidad.mjs');
  const sinPuntaje = (n) => Object.values(AVISOS).includes(n) || n.endsWith('404.html');
  let n = 0;
  for (const [nombre, html] of Object.entries(paginas)) {
    const enlaces = (sinComentarios(html).match(new RegExp(`<a href="${RESENAS_GOOGLE.url.replace(/[.?]/g, '\\$&')}" target="_blank" rel="noopener">`, 'g')) || []).length;
    if (sinPuntaje(nombre)) { assert.strictEqual(enlaces, 0, `${nombre}: no vende y muestra el puntaje`); continue; }
    assert.strictEqual(enlaces, 1, `${nombre}: el puntaje con su enlace, una vez (hay ${enlaces})`);
    n++;
  }
  assert.ok(n >= 77, `se esperaban al menos 77 páginas con puntaje, hay ${n}`);
});

test('las habilitaciones van en un solo orden en cada franja y en las pruebas del hub', async () => {
  const { ORDEN_HABILITACIONES } = await datos;
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const bloque of [...zona(html, 'CONFIANZA'), ...zona(html, 'PRUEBA')]) {
      const items = [...bloque.matchAll(/<(span|li)>([\s\S]*?)<\/\1>/g)].map((m) => m[2].replace(/<[^>]+>/g, ''));
      const orden = items.map((t) => ORDEN_HABILITACIONES.findIndex(([, re]) => re.test(t))).filter((i) => i >= 0);
      assert.deepStrictEqual(orden, [...orden].sort((a, b) => a - b), `${nombre}: habilitaciones fuera de orden: ${items.join(' | ')}`);
    }
  }
});

test('las páginas de empresas llevan la franja de su familia; los hubs, sus pruebas generadas', async () => {
  const { debeLlevarFranja, HUBS_EMPRESAS } = await guion;
  const conFranja = Object.entries(paginas).filter(([n, h]) => debeLlevarFranja(h, n));
  assert.ok(conFranja.length >= 14, `sólo ${conFranja.length} páginas de empresas`);
  for (const [nombre, html] of conFranja) {
    assert.strictEqual(zona(html, 'CONFIANZA').length, 1, `${nombre}: sin franja`);
    // Después de la miga, como en el resto de las páginas de empresas.
    assert.ok(html.indexOf('<!-- /GENERADO:MIGAS -->') < html.indexOf('<!-- GENERADO:CONFIANZA'), `${nombre}: la franja va después de la miga`);
  }
  for (const hub of HUBS_EMPRESAS) {
    const p = zona(paginas[hub], 'PRUEBA');
    assert.strictEqual(p.length, 1, `${hub}: sin la zona PRUEBA`);
    assert.match(paginas[hub], /<section class="prueba"[^>]*>\s*<div class="wrap">\s*<!-- GENERADO:PRUEBA/, `${hub}: la zona PRUEBA va dentro de section.prueba`);
  }
});

test('las portadas: el puntaje bajo el título de las reseñas, que son las de Google', () => {
  const titulos = { 'index.html': 'Reseñas de nuestros clientes', 'en/index.html': 'Reviews from our customers', 'pt/index.html': 'Avaliações dos nossos clientes' };
  for (const [nombre, h2] of Object.entries(titulos)) {
    const html = paginas[nombre];
    const seccion = html.match(/<section class="block" id="(?:clientes|reviews)">[\s\S]*?<\/section>/);
    assert.ok(seccion, `${nombre}: sin sección de reseñas`);
    assert.ok(seccion[0].includes(`<h2>${h2}</h2>`), `${nombre}: el título de la sección no es «${h2}»`);
    assert.strictEqual(zona(seccion[0], 'RESENA').length, 1, `${nombre}: el puntaje no está en la sección de reseñas`);
    assert.strictEqual(zona(html, 'RESENA').length, 1, `${nombre}: el puntaje, una sola vez`);
    for (const [, pie] of seccion[0].matchAll(/<footer>([^<]*)<\/footer>/g)) assert.match(pie, / · Google$/, `${nombre}: una reseña sin su origen`);
  }
  // Su línea elegida (29/08), palabra por palabra (BRIEF, L28).
  assert.ok(paginas['index.html'].includes('<h2>Su tranquilidad viaja con nosotros</h2>'));
});

// Ronda 10: los bloques compartidos van en el mismo orden en las 82 páginas.
// Lo que se ve a 390 px (que cada uno se vea, en este orden, y que la barra no
// tape el final) lo mira scripts/galeria-navegador.mjs; esto es lo barato: el orden
// en el HTML. Los hubs de empresas llevan la miga antes del encabezado.
const ORDEN = ['ENCABEZADO', 'MIGAS', 'CONFIANZA', 'VIAJE', 'CIERRE', 'CONTACTO', 'LEGAL', 'BARRA'];
const ordenDe = (html) => {
  const limpio = html.replace(/<!-- RONDA:VISTA -->[\s\S]*?<!-- \/RONDA:VISTA -->/g, '');
  const re = /<!-- GENERADO:(MIGAS|CONFIANZA|VIAJE|CIERRE|CONTACTO|LEGAL|BARRA) |<section class="(?:page-head|hero)\b/g;
  return [...limpio.matchAll(re)].map((m) => m[1] || 'ENCABEZADO');
};

test('los bloques compartidos van en un solo orden en todas las páginas', async () => {
  const { HUBS_EMPRESAS } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    let orden = ordenDe(html);
    assert.strictEqual(new Set(orden).size, orden.length, `${nombre}: un bloque repetido (${orden.join(' · ')})`);
    if (HUBS_EMPRESAS.includes(nombre)) {
      assert.deepStrictEqual(orden.slice(0, 2), ['MIGAS', 'ENCABEZADO'], `${nombre}: la miga del hub va antes del encabezado`);
      orden = ['ENCABEZADO', 'MIGAS', ...orden.slice(2)];
    }
    const posiciones = orden.map((b) => ORDEN.indexOf(b));
    assert.deepStrictEqual(posiciones, [...posiciones].sort((a, b) => a - b), `${nombre}: ${orden.join(' · ')}`);
    for (const b of ['CONTACTO', 'LEGAL']) assert.ok(orden.includes(b), `${nombre}: sin ${b}`);
    if (!nombre.endsWith('404.html')) assert.ok(orden.includes('BARRA'), `${nombre}: sin la barra del teléfono`);
  }
  // Control en rojo: la miga después de la franja, como estaba en 8 páginas hasta la ronda 10.
  const roto = '<section class="page-head"><!-- GENERADO:CONFIANZA --><!-- GENERADO:MIGAS --><!-- GENERADO:CONTACTO --><!-- GENERADO:LEGAL --><!-- GENERADO:BARRA ';
  const p = ordenDe(roto).map((b) => ORDEN.indexOf(b));
  assert.notDeepStrictEqual(p, [...p].sort((a, b) => a - b));
});
