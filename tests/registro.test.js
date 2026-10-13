// Registro del castellano: las páginas nuevas van en "usted", neutro y cordial
// (BUILD-BRIEF de Lautaro, 10/10/2026). Las páginas viejas del sitio están en
// "vos" y no se reescriben en esta tanda: quedan congeladas en la lista de
// abajo. Toda página que NO esté en esa lista (las de octubre y cualquiera
// que se sume después) tiene que estar libre de voseo y de tuteo.
//
// El 13/10/2026 se pasaron a usted las cuatro páginas de eventos de octubre
// (Semana Santa, Tren a las Nubes, trail de Jujuy y Fiesta del Milagro), que
// habían salido en vos. Este test es lo que impide que vuelva a pasar.
//
// La lista funciona como trinquete: si una página vieja se pasa a usted,
// el test de abajo pide sacarla de la lista, así no puede volver a "vos".
'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { paginasEs, sinComentarios } = require('./util.js');

// Páginas anteriores a octubre de 2026 que siguen en "vos" (medido el 13/10).
const EN_VOS = new Set([
  '404.html',
  'alquiler-4x4.html',
  'alquiler-autoelevadores.html',
  'cargas-refrigeradas.html',
  'charter-recitales.html',
  'clubes-deportivos.html',
  'deposito-galpon.html',
  'flota-en-venta.html',
  'galeria.html',
  'golf-torneos.html',
  'index.html',
  'logistica-minera.html',
  'peregrinaciones-eventos.html',
  'producciones.html',
  'transporte-de-personal.html',
  'traslados-empresas.html',
  'viajes-de-estudio.html',
]);

// Formas de vos y de tú. Las del presente y del imperativo voseante llevan
// tilde final (tenés, cotizá, escribí), así que "estas", "reservas" o
// "viajes" no cuentan; los imperativos con pronombre (escribinos, contanos)
// van por raíz. Los pronombres tu/tus/te/ti/contigo son de tú en cualquier
// variante: en usted son su/sus/le/lo/usted.
const VOSEO = new RegExp('(?<![\\p{L}])(' + [
  'vos', 'tu', 'tus', 'te', 'ti', 'contigo',
  '(?:escrib|cont|mand|avis|llam|consult|contact|segu|ped|dec|pas|confirm|indic|dej|envi|habl|pregunt)[aeií]nos',
  '(?:cotiz|reserv|mir|mand|cont|consult|llam|avis|sum|dej|and|pas|pregunt|confirm|indic|envi|busc|planific|organiz|arm|compr)á',
  '(?:conoc|hac|ten|pon|ve|eleg)é', '(?:escrib|ven|eleg|ped|dec|segu|sal)í',
  'tenés', 'podés', 'querés', 'sabés', 'debés', 'necesitás', 'viajás', 'llegás', 'volvés', 'salís',
  'preferís', 'venís', 'hacés', 'estás', 'sos', 'vas', 'organizás', 'elegís', 'reservás', 'buscás',
  'tomás', 'pensás', 'andás', 'hablás', 'parás', 'corrés', 'contratás',
  'quieras', 'elijas', 'prefieras', 'pidas', 'tengas', 'puedas', 'necesites', 'llegues', 'sepas', 'vayas', 'hagas',
].join('|') + ')(?![\\p{L}])', 'giu');

// Lo que lee el visitante y lo que leen Google y los asistentes: el texto,
// los alt/title/aria-label, las meta (description, og:) y el JSON-LD. Afuera
// quedan los href: el mensaje pre-armado de WhatsApp está en la voz del
// cliente ("Hola Lausof, quiero cotizar…").
function textoDe(html) {
  const limpio = sinComentarios(html);
  const atributos = [...limpio.matchAll(/\s(?:alt|title|aria-label|content)="([^"]*)"/g)].map((m) => m[1]);
  const jsonld = [...limpio.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const visible = limpio
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ');
  return [visible, ...atributos, ...jsonld].join(' · ');
}

const formasDe = (html) => [...new Set([...textoDe(html).matchAll(VOSEO)].map((m) => m[1]))];

test('el detector reconoce el voseo y deja pasar el usted', () => {
  for (const vos of ['Mandanos los días', 'Contanos cuántos son', 'Cotizá por WhatsApp', 'si tenés fecha', 'para tu grupo', 'que elijas', 'coordina con vos']) {
    assert.ok(formasDe(vos).length, `no detecta "${vos}"`);
  }
  for (const usted of ['Envíenos los días', 'Cuéntenos cuántos son', 'Cotizar por WhatsApp', 'si tiene fecha', 'para su grupo', 'que elija', 'coordina con usted', 'estas fechas', 'las reservas', 'los viajes', 'Le respondemos']) {
    assert.deepStrictEqual(formasDe(usted), [], `marca como voseo "${usted}"`);
  }
});

test('las cuatro páginas de eventos de octubre no están en la lista de páginas en vos', () => {
  for (const nombre of ['semana-santa-salta-jujuy.html', 'traslado-tren-a-las-nubes.html', 'traslados-trail-jujuy-utmb.html', 'traslados-fiesta-del-milagro.html']) {
    assert.ok(nombre in paginasEs, `${nombre} no existe`);
    assert.ok(!EN_VOS.has(nombre), `${nombre} tiene que ir en usted`);
  }
});

for (const [nombre, html] of Object.entries(paginasEs)) {
  if (EN_VOS.has(nombre)) {
    test(`${nombre}: sigue en vos (si ya pasó a usted, sacarla de EN_VOS)`, () => {
      assert.ok(formasDe(html).length > 0, `${nombre} ya no tiene voseo: sacarla de EN_VOS para que no vuelva`);
    });
  } else {
    test(`${nombre}: en usted, sin voseo ni tuteo`, () => {
      const formas = formasDe(html);
      assert.deepStrictEqual(formas, [], `${nombre} tiene formas de vos/tú: ${formas.join(', ')}`);
    });
  }
}

test('la lista de páginas en vos sólo nombra páginas que existen', () => {
  for (const nombre of EN_VOS) assert.ok(nombre in paginasEs, `${nombre} no existe`);
});
