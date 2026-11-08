// Datos del viaje y una sola forma de preguntas frecuentes (scripts/viaje.mjs,
// ronda 5 de lausof.com, 08/11/2026). Baymard (rondas-2026-11-07/
// 1-investigacion.md, R-A1): al 83 % de los sitios de excursiones les falta la
// información básica a la vista (duración, punto de encuentro, qué incluye) y
// el 57 % no muestra el punto de encuentro en un mapa. Hasta esta ronda las
// preguntas frecuentes tenían dos formas: el acordeón en 67 páginas y una
// ficha fija (.faq-item) en 12 (2-estado-actual.md, W6).
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { paginas, sinComentarios } = require('./util.js');

const guion = import('../scripts/viaje.mjs');
const datos = import('../scripts/viaje-datos.mjs');

const HUBS = new Set(['turismo.html', 'en/tours-and-transfers.html', 'pt/passeios-e-traslados.html']);
const PERSONAL = new Set(['transporte-de-personal-obras-de-litio.html', 'en/crew-transport-lithium-projects.html']);
// Las páginas de ruta: las que cargan turismo.css, menos los hubs y las de
// personal para obras (la misma definición que M14 b del kit de medidas).
const RUTAS = Object.keys(paginas).filter((n) => paginas[n].includes('/css/turismo.css') && !HUBS.has(n) && !PERSONAL.has(n));

const zona = (html) => (html.match(/<!-- GENERADO:VIAJE\b[^\n]*-->([\s\S]*?)<!-- \/GENERADO:VIAJE -->/) || [])[1];
const texto = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('cada página está al día con scripts/viaje.mjs (correr node scripts/viaje.mjs)', async () => {
  const { conViaje, problemasDe } = await guion;
  for (const [nombre, html] of Object.entries(paginas)) {
    assert.deepStrictEqual(problemasDe(html, nombre), [], nombre);
    assert.ok(conViaje(html, nombre) === html, `${nombre}: los datos del viaje no están al día`);
  }
});

test('toda página de ruta tiene duración, salida e incluye', async () => {
  const { VIAJES } = await datos;
  assert.ok(RUTAS.length >= 35, `sólo ${RUTAS.length} páginas de ruta`);
  for (const n of RUTAS) {
    assert.ok(VIAJES[n], `${n} no tiene datos del viaje`);
    for (const c of ['duracion', 'salida', 'incluye']) assert.ok(VIAJES[n].filas[c], `${n}: falta «${c}»`);
    assert.ok(zona(paginas[n]), `${n}: el bloque no está en la página`);
  }
});

test('el bloque es una sección hermana, una sola vez, dentro de <main> y antes de «En esta página»', () => {
  for (const [n, html] of Object.entries(paginas)) {
    const z = zona(html);
    if (!z) continue;
    assert.strictEqual(html.split('<!-- GENERADO:VIAJE').length, 2, `${n}: el bloque está más de una vez`);
    assert.strictEqual((z.match(/<section\b/g) || []).length, 1, `${n}: el bloque no es una sola sección`);
    const main = html.slice(html.indexOf('<main>'), html.indexOf('</main>'));
    const i = main.indexOf('<!-- GENERADO:VIAJE');
    assert.ok(i > 0, `${n}: el bloque está fuera de <main>`);
    // Ninguna sección abierta alrededor: antes del bloque, cada <section> ya cerró.
    const antes = sinComentarios(main.slice(0, i));
    assert.strictEqual((antes.match(/<section\b/g) || []).length, (antes.match(/<\/section>/g) || []).length, `${n}: el bloque quedó dentro de otra sección`);
    const salto = main.indexOf('<nav class="jump');
    if (salto >= 0) assert.ok(i < salto, `${n}: el bloque va después de «En esta página»`);
  }
});

test('el bloque no trae precios, «desde», cantidades de flota ni plazos de respuesta', () => {
  for (const [n, html] of Object.entries(paginas)) {
    const z = zona(html);
    if (!z) continue;
    const t = texto(z);
    assert.doesNotMatch(t, /\$\s?\d|\bARS\b|\bUSD\b|\bdesde\b|\baprox\.|a confirmar/i, `${n}: precio o «desde» en el bloque`);
    assert.doesNotMatch(t, /\b\d+\s+(unidades|vehículos|combis|camionetas|minibuses|vehicles|units|veículos|vans)\b/i, `${n}: cantidad de flota`);
    assert.doesNotMatch(t, /24\s?hs|24\/7|respondemos en|reply within|respondemos em/i, `${n}: plazo de respuesta`);
    assert.doesNotMatch(t, /apacheta/i, n);
  }
});

test('el mapa es un enlace a Google Maps, no un mapa incrustado', () => {
  for (const [n, html] of Object.entries(paginas)) {
    const z = zona(html);
    if (!z) continue;
    assert.doesNotMatch(z, /<iframe|<script/, `${n}: el bloque incrusta algo`);
    for (const [, url] of z.matchAll(/<a class="datos-viaje-mapa" href="([^"]+)" target="_blank" rel="noopener">/g)) {
      assert.match(url, /^https:\/\/www\.google\.com\/maps\/(dir\/\?api=1&amp;origin=|search\/\?api=1&amp;query=)/, `${n}: ${url}`);
    }
  }
});

test('urlMapa arma el recorrido y el lugar como dicen las URL de Maps', async () => {
  const { urlMapa } = await guion;
  assert.strictEqual(urlMapa({ tipo: 'ruta', origen: 'Salta, Argentina', destino: 'Cafayate, Salta, Argentina', paradas: [] }),
    'https://www.google.com/maps/dir/?api=1&origin=Salta%2C+Argentina&destination=Cafayate%2C+Salta%2C+Argentina&travelmode=driving');
  assert.strictEqual(urlMapa({ tipo: 'ruta', origen: 'A', destino: 'B', paradas: ['C', 'D'] }),
    'https://www.google.com/maps/dir/?api=1&origin=A&destination=B&waypoints=C%7CD&travelmode=driving');
  assert.strictEqual(urlMapa({ tipo: 'lugar', consulta: 'Aeropuerto de Salta' }), 'https://www.google.com/maps/search/?api=1&query=Aeropuerto+de+Salta');
  assert.strictEqual(urlMapa(null), null);
});

test('control: un dato sin su frase en la página y un bloque viejo se detectan', async () => {
  const { conViaje, problemasDe } = await guion;
  const pagina = 'traslado-salta-cafayate.html';
  const html = paginas[pagina];
  const dato = { filas: { duracion: { valor: 'Dos días', fuente: ['una frase que la página no dice'] } }, mapa: null };
  const p = problemasDe(html, pagina, { [pagina]: dato });
  assert.ok(p.some((x) => x.includes('ya no dice')), 'no detectó la fuente que falta');
  assert.notStrictEqual(conViaje(html, pagina, { [pagina]: dato }), html, 'no detectó el bloque viejo');
  // Sin datos, la zona se borra entera y la página queda sin restos.
  const sin = conViaje(html, pagina, {});
  assert.ok(!sin.includes('GENERADO:VIAJE'), 'quedó la zona sin datos');
  // Un dato no puede apoyarse en el propio bloque.
  const solo = { [pagina]: { filas: { duracion: { valor: 'Una frase que sólo dice el bloque', fuente: ['Una frase que sólo dice el bloque'] } }, mapa: null } };
  assert.ok(problemasDe(conViaje(html, pagina, solo), pagina, solo).some((x) => x.includes('ya no dice')), 'un dato se apoyó en sí mismo');
});

test('las preguntas frecuentes tienen una sola forma: el acordeón', () => {
  for (const [n, html] of Object.entries(paginas)) {
    assert.ok(!html.includes('faq-item'), `${n}: todavía tiene la ficha fija .faq-item`);
    for (const [, cuerpo] of sinComentarios(html).matchAll(/<div class="faq">([\s\S]*?)\n\s*<\/div>\n/g)) {
      const hijos = cuerpo.replace(/<details>[\s\S]*?<\/details>/g, '').trim();
      assert.strictEqual(hijos, '', `${n}: algo en .faq que no es un <details>`);
      for (const [, d] of cuerpo.matchAll(/<details>([\s\S]*?)<\/details>/g)) assert.match(d, /^\s*<summary>[^<]+<\/summary>/, `${n}: pregunta sin <summary>`);
    }
    assert.doesNotMatch(html, /"@type"\s*:\s*"FAQPage"/, `${n}: marcado FAQPage (C3)`);
  }
  const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'styles.css'), 'utf8');
  assert.ok(!css.includes('.faq-item'), 'styles.css todavía define .faq-item');
});
