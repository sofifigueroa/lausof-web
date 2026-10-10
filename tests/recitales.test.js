// Próximos recitales de charter-recitales.html: las filas fechadas. Lo que
// hace js/vigencia.js con las fechas pasadas (las pasa a "Fechas
// anteriores", nunca las esconde) se prueba en tests/vigencia.test.js.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginasEs, sinComentarios } = require('./util.js');

const html = paginasEs['charter-recitales.html'];
const visible = sinComentarios(html);

const seccion = html.slice(html.indexOf('id="proximos"'), html.indexOf('id="como-funciona"'));
const lista = seccion.slice(seccion.indexOf('<ol class="recitales"'), seccion.indexOf('</ol>'));
const filasHtml = [...lista.matchAll(/<li data-hasta="([^"]*)">([\s\S]*?)<\/li>/g)]
  .map(([, hasta, cuerpo]) => ({ hasta, cuerpo }));

// ---------------------------------------------------------------------------
// La página
// ---------------------------------------------------------------------------
test('charter-recitales.html carga vigencia.js una vez, con ruta absoluta, defer y versión', () => {
  const usos = html.match(/<script defer src="\/js\/vigencia\.js\?v=\d+"><\/script>/g) || [];
  assert.strictEqual(usos.length, 1);
  assert.strictEqual((visible.match(/vigencia\.js/g) || []).length, 1, 'vigencia.js se carga de otra forma');
});

test('próximos recitales: hay filas y la lista está marcada para el script', () => {
  assert.match(seccion, /<ol class="recitales" data-vigencia>/);
  assert.ok(filasHtml.length >= 1, 'la lista de próximos recitales quedó vacía');
  assert.match(seccion, /<p class="recitales-vacio" data-sin-proximos hidden>/,
    'falta el aviso para cuando no queda ninguna fecha');
});

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

test('próximos recitales: cada fila tiene fecha válida, igual al <time> y con el día de la semana correcto', () => {
  for (const { hasta, cuerpo } of filasHtml) {
    assert.match(hasta, /^\d{4}-\d{2}-\d{2}$/, `data-hasta mal escrito: "${hasta}"`);
    const t = cuerpo.match(/<time datetime="([^"]*)">([^<]*)<\/time>/);
    assert.ok(t, `la fila ${hasta} no tiene <time>`);
    assert.strictEqual(t[1], hasta, `la fila ${hasta} muestra otra fecha en el <time>`);
    const [a, m, d] = hasta.split('-').map(Number);
    const fecha = new Date(Date.UTC(a, m - 1, d));
    const esperado = `${DIAS[fecha.getUTCDay()]} ${d} ${MESES[m - 1]}`;
    assert.strictEqual(t[2], esperado, `la fila ${hasta} dice "${t[2]}", debería decir "${esperado}"`);
  }
});

test('próximos recitales: las filas van en orden de fecha', () => {
  const fechas = filasHtml.map((f) => f.hasta);
  assert.deepStrictEqual(fechas, [...fechas].sort());
});

test('próximos recitales: cada fila cotiza por WhatsApp con un mensaje que nombra el recital', () => {
  for (const { hasta, cuerpo } of filasHtml) {
    const wa = cuerpo.match(/href="https:\/\/wa\.me\/5493875269009\?text=([^"]+)"/);
    assert.ok(wa, `la fila ${hasta} no tiene el enlace de WhatsApp a la línea del sitio`);
    const texto = decodeURIComponent(wa[1]);
    assert.match(texto, /^Hola Lausof, quiero cotizar una combi al recital de .+ \(\d{1,2}\/\d{1,2}\)$/,
      `mensaje pre-armado inesperado en la fila ${hasta}: "${texto}"`);
    const [, m, d] = hasta.split('-').map(Number);
    assert.ok(texto.endsWith(`(${d}/${m})`), `el mensaje de la fila ${hasta} nombra otra fecha`);
  }
});

// Reglas del blueprint de páginas de eventos (§6.2 y §7.9): nombres sólo en
// texto, aviso de independencia visible junto a las fechas, sin "oficial",
// sin imágenes de artistas en la sección y sin marcado Event.
test('próximos recitales: aviso de independencia visible junto a las fechas', () => {
  assert.match(sinComentarios(seccion),
    /Lausof SRL es una empresa de transporte independiente\.<\/b> No organiza estos recitales ni vende entradas/);
});

test('próximos recitales: sin imágenes ni la palabra "oficial"', () => {
  const s = sinComentarios(seccion);
  assert.doesNotMatch(s, /<img\b/i, 'la sección de recitales no lleva imágenes (ni logos ni fotos de artistas)');
  assert.doesNotMatch(s, /oficial/i);
  assert.doesNotMatch(s, /\$\s?\d/, 'la sección no publica precios');
});

test('próximos recitales: los tiempos de manejo se declaran aproximados', () => {
  const s = sinComentarios(seccion);
  const tiempos = s.match(/de manejo[^.]*/g) || [];
  assert.ok(tiempos.length >= 2, 'faltan los tiempos de manejo por ciudad');
  for (const t of tiempos) assert.match(t, /aproximado/, `tiempo de manejo sin "aproximado": "${t}"`);
});

// ---------------------------------------------------------------------------
// Datos estructurados y sitemap
// ---------------------------------------------------------------------------
const nodos = (() => {
  const bloques = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.strictEqual(bloques.length, 1);
  return JSON.parse(bloques[0][1])['@graph'];
})();

test('JSON-LD: WebPage + Service + BreadcrumbList, sin Event ni FAQPage', () => {
  const tipos = nodos.map((n) => n['@type']).sort();
  assert.deepStrictEqual(tipos, ['BreadcrumbList', 'Service', 'WebPage']);
  assert.doesNotMatch(JSON.stringify(nodos), /"(Event|MusicEvent|FAQPage|Offer|Review|AggregateRating)"/);
  const servicio = nodos.find((n) => n['@type'] === 'Service');
  assert.strictEqual(servicio.provider['@id'], 'https://www.lausof.com/#empresa');
});

test('JSON-LD: nombre y descripción iguales al <title> y la meta description', () => {
  const pagina = nodos.find((n) => n['@type'] === 'WebPage');
  assert.strictEqual(pagina.name, html.match(/<title>([^<]*)<\/title>/)[1]);
  assert.strictEqual(pagina.description, html.match(/<meta name="description" content="([^"]*)">/)[1]);
});

test('dateModified = "Actualizado" visible = lastmod del sitemap', () => {
  const { sitemap } = require('./util.js');
  const pagina = nodos.find((n) => n['@type'] === 'WebPage');
  const visibleAct = visible.match(/Actualizado el <time datetime="(\d{4}-\d{2}-\d{2})">/);
  assert.ok(visibleAct, 'falta el "Actualizado el" visible');
  const lastmod = sitemap.match(/<loc>https:\/\/www\.lausof\.com\/charter-recitales\.html<\/loc>\s*<lastmod>([^<]*)<\/lastmod>/);
  assert.ok(lastmod, 'charter-recitales.html no está en el sitemap con lastmod');
  assert.strictEqual(pagina.dateModified, visibleAct[1]);
  assert.strictEqual(lastmod[1], visibleAct[1]);
});

test('las migas visibles coinciden con el BreadcrumbList', () => {
  const migas = nodos.find((n) => n['@type'] === 'BreadcrumbList').itemListElement;
  const nav = visible.match(/<nav class="migas"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(nav, 'falta la ruta de navegación visible');
  for (const { name } of migas) assert.ok(nav[1].includes(name), `las migas visibles no muestran "${name}"`);
});
