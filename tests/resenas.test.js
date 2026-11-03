// Reseñas de Google junto a los botones de las páginas de ruta y de eventos
// (plan SEO 03/11/2026, §3 #1: las páginas de ruta y de eventos inician el
// 47 % de los contactos, y toda agencia que gana muestra su cantidad de
// reseñas). Se permite UN renglón: el enlace simple al perfil real, con el
// puntaje y la cantidad que Google muestra en público y la fecha de lectura.
// Lo que sigue vedado (BUILD-BRIEF): reseñas inventadas o citadas, puntajes
// que no sean los de Google, y cualquier marcado de reseñas en el JSON-LD.
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginas, sinComentarios, RESENAS, RENGLON_RESENAS, sinEnlaceResenas } = require('./util.js');

// Páginas de ruta y de eventos, por nombre: una página nueva de ruta o de
// evento entra sola.
const RUTA_O_EVENTO = /^(traslados?-|salinas-grandes-|semana-santa-|charter-|peregrinaciones-|feriados-|clubes-|viajes-)|^en\/(salta-to-|[a-z-]+-to-salta|salinas-grandes-|international-|transfer-|train-|jujuy-|holy-week-|wedding-)/;
const conEnlace = Object.keys(paginas).filter((n) => RUTA_O_EVENTO.test(n));

const visible = (html) => sinComentarios(html)
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

test('la lista de páginas de ruta y de eventos no quedó vacía', () => {
  assert.ok(conEnlace.length >= 38, `sólo ${conEnlace.length} páginas de ruta o de eventos`);
});

for (const nombre of conEnlace) {
  test(`${nombre}: enlaza las reseñas de Google una vez, en la franja junto a los botones`, () => {
    const html = sinComentarios(paginas[nombre]);
    const renglones = html.match(RENGLON_RESENAS) || [];
    assert.strictEqual(renglones.length, 1, 'se espera un solo renglón de reseñas, con el formato aprobado');
    assert.strictEqual(html.split(`href="${RESENAS}"`).length - 1, 1, 'el perfil de Google se enlaza más de una vez');
    // En la franja de habilitaciones, que va inmediatamente debajo de los
    // botones del encabezado.
    const franja = html.match(/<div class="certs"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    assert.ok(franja && franja[1].includes(RESENAS), 'el enlace no está en la franja de habilitaciones');
    const idioma = nombre.startsWith('en/') ? /Google reviews/ : /Reseñas en Google/;
    assert.match(renglones[0], idioma, 'el renglón no está en el idioma de la página');
  });
}

// Fuera de las portadas (es, en y pt tienen su sección de clientes desde
// antes), ninguna página habla de reseñas fuera de ese renglón: así no se
// cuela una reseña citada o un puntaje que no sea el de Google.
const PORTADAS = ['index.html', 'en/index.html', 'pt/index.html'];
for (const [nombre, html] of Object.entries(paginas)) {
  if (PORTADAS.includes(nombre)) continue;
  test(`${nombre}: no habla de reseñas fuera del enlace al perfil de Google`, () => {
    const texto = visible(sinEnlaceResenas(html));
    const m = texto.match(/\b(rese[ñn]as?|reviews?|opiniones|testimonios?|calificaci[oó]n|rating|stars?|estrellas)\b|★/i);
    assert.ok(!m, `${nombre} habla de reseñas: "${m && texto.slice(Math.max(0, m.index - 40), m.index + 40)}"`);
    assert.ok(!/<blockquote/i.test(html), `${nombre} cita un texto como reseña`);
  });
}

test('el puntaje y la cantidad son los mismos en todas las páginas', () => {
  const valores = new Set();
  for (const html of Object.values(paginas)) {
    for (const r of html.match(RENGLON_RESENAS) || []) {
      valores.add(r.replace(/.*<\/a>: /, '').replace(/<\/span>$/, '').replace('4.9 out of 5 from 9 reviews (November 3, 2026)', '4,9 de 5, con 9 reseñas (03/11/2026)'));
    }
  }
  assert.deepStrictEqual([...valores], ['4,9 de 5, con 9 reseñas (03/11/2026)']);
});

test('ninguna página marca reseñas ni puntajes en el JSON-LD', () => {
  for (const [nombre, html] of Object.entries(paginas)) {
    for (const [, json] of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      assert.doesNotMatch(json, /"(Review|AggregateRating|reviewRating|ratingValue|reviewCount)"/, `${nombre} declara reseñas en el JSON-LD`);
    }
  }
});
