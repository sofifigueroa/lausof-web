/* =============================================================================
   DATOS DEL VIAJE — node scripts/viaje.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Un bloque corto, arriba en cada página de ruta, evento o segmento, con lo
   que el viajero busca antes de escribir: duración, distancia, dónde sale el
   grupo (con el recorrido en el mapa), qué incluye y en qué unidades viaja.
   Baymard (rondas-2026-11-07/1-investigacion.md, R-A1): al 83 % de los sitios
   de excursiones y traslados les falta esa información básica a la vista, y
   el 57 % no muestra el punto de encuentro en un mapa.

   Los datos viven en scripts/viaje-datos.mjs, cada uno con la frase de la
   propia página que lo sostiene (`fuente`): el bloque no dice nada que la
   página no diga más abajo, y si la página cambia esa frase, --comprobar y
   tests/viaje.test.js lo marcan.

     node scripts/viaje.mjs              escribe o actualiza el bloque
     node scripts/viaje.mjs --comprobar  no escribe nada; sale con 1 si algo no coincide

   El bloque es una sección hermana de las demás (nunca dentro de otra), va
   después de la franja de habilitaciones (o de la miga) y antes de «En esta
   página», así «Cómo llegar» sigue siendo la primera sección después de esa
   navegación (tests/como-llegar.test.js). El mapa es un enlace a Google Maps
   (URL de Maps, developers.google.com/maps/documentation/urls, 03/11/2026),
   no un mapa incrustado: no pide nada al cargar la página (E1, E3).
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { idiomaDe } from './prefill.mjs';
import { VIAJES } from './viaje-datos.mjs';

export const CLAVES = ['duracion', 'distancia', 'salida', 'incluye', 'unidades'];

export const TEXTOS_VIAJE = {
  es: {
    id: 'datos-del-viaje', titulo: 'Datos del viaje',
    filas: { duracion: 'Duración', distancia: 'Distancia', salida: 'Salida', incluye: 'Incluye', unidades: 'Unidades' },
    ruta: 'Ver el recorrido en el mapa', lugar: 'Ver en el mapa',
  },
  en: {
    id: 'trip-details', titulo: 'Trip details',
    filas: { duracion: 'Duration', distancia: 'Distance', salida: 'Pickup', incluye: 'Included', unidades: 'Vehicles' },
    ruta: 'See the route on the map', lugar: 'See it on the map',
  },
  pt: {
    id: 'dados-da-viagem', titulo: 'Dados da viagem',
    filas: { duracion: 'Duração', distancia: 'Distância', salida: 'Saída', incluye: 'Inclui', unidades: 'Veículos' },
    ruta: 'Ver o trajeto no mapa', lugar: 'Ver no mapa',
  },
};

const ABRE = '<!-- GENERADO:VIAJE — no editar a mano: editar scripts/viaje-datos.mjs y correr `node scripts/viaje.mjs` -->';
const CIERRA = '<!-- /GENERADO:VIAJE -->';
const ZONA = /\n*[ \t]*<!-- GENERADO:VIAJE\b[^\n]*-->[\s\S]*?<!-- \/GENERADO:VIAJE -->/;

const escapar = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enc = (t) => encodeURIComponent(t).replace(/%20/g, '+');

/** La URL de Google Maps del recorrido o del lugar (sin clave, sin JS). */
export function urlMapa(mapa) {
  if (!mapa) return null;
  if (mapa.tipo === 'lugar') return `https://www.google.com/maps/search/?api=1&query=${enc(mapa.consulta)}`;
  const partes = [`origin=${enc(mapa.origen)}`, `destination=${enc(mapa.destino)}`];
  if (mapa.paradas && mapa.paradas.length) partes.push(`waypoints=${mapa.paradas.map(enc).join('%7C')}`);
  partes.push('travelmode=driving');
  return `https://www.google.com/maps/dir/?api=1&${partes.join('&')}`;
}

/** El HTML del bloque de una página (sin la zona). */
export function bloqueDe(pagina, dato) {
  const t = TEXTOS_VIAJE[idiomaDe(pagina)];
  const url = urlMapa(dato.mapa);
  const enlace = url
    ? `<a class="datos-viaje-mapa" href="${url.replace(/&/g, '&amp;')}" target="_blank" rel="noopener">${dato.mapa.tipo === 'lugar' ? t.lugar : t.ruta}</a>`
    : '';
  const filas = CLAVES.filter((c) => dato.filas[c]).map((c) => {
    const extra = c === 'salida' && enlace ? ` ${enlace}` : '';
    return `        <div><dt>${t.filas[c]}</dt><dd>${escapar(dato.filas[c].valor)}${extra}</dd></div>`;
  });
  const suelto = enlace && !dato.filas.salida ? `\n      <p>${enlace}</p>` : '';
  return [
    `  <section class="block datos-viaje" id="${t.id}" aria-labelledby="${t.id}-h2">`,
    '    <div class="wrap">',
    `      <h2 id="${t.id}-h2">${t.titulo}</h2>`,
    '      <dl class="datos-viaje-lista">',
    ...filas,
    `      </dl>${suelto}`,
    '    </div>',
    '  </section>',
  ].join('\n');
}

const zonaDe = (pagina, dato) => `\n\n  ${ABRE}\n${bloqueDe(pagina, dato)}\n  ${CIERRA}`;

/** La página con el bloque al día (o sin él, si no tiene datos). Pura e idempotente. */
export function conViaje(html, pagina, viajes = VIAJES) {
  const dato = viajes[pagina];
  if (ZONA.test(html)) return html.replace(ZONA, dato ? zonaDe(pagina, dato) : '');
  if (!dato) return html;
  for (const marca of ['<!-- /GENERADO:CONFIANZA -->', '<!-- /GENERADO:MIGAS -->']) {
    const i = html.indexOf(marca);
    if (i >= 0) return html.slice(0, i + marca.length) + zonaDe(pagina, dato) + html.slice(i + marca.length);
  }
  throw new Error(`${pagina}: sin franja ni miga donde poner los datos del viaje`);
}

const visible = (html) => html
  .replace(ZONA, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&(nbsp|amp|quot|rsquo|lsquo|ldquo|rdquo|ndash|mdash|hellip|lt|gt);/g, (_, e) => ENTIDADES[e])
  .replace(/\s+/g, ' ');
const ENTIDADES = { nbsp: ' ', amp: '&', quot: '"', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', lt: '<', gt: '>' };

/** El texto visible de una página, sin el propio bloque (un dato no puede apoyarse en sí mismo). */
export const textoVisible = visible;

/** Lo que no cierra en una página ya escrita (lo usa también tests/viaje.test.js). */
export function problemasDe(html, pagina, viajes = VIAJES) {
  const p = [];
  const dato = viajes[pagina];
  if (!dato) return p;
  const texto = visible(html);
  for (const c of Object.keys(dato.filas)) {
    if (!CLAVES.includes(c)) p.push(`${pagina}: fila desconocida «${c}»`);
    for (const f of dato.filas[c].fuente || []) {
      if (!texto.includes(f)) p.push(`${pagina}: «${c}» se apoya en una frase que la página ya no dice: «${f}»`);
    }
    if (!(dato.filas[c].fuente || []).length) p.push(`${pagina}: «${c}» sin fuente`);
  }
  if (!html.includes(`id="${TEXTOS_VIAJE[idiomaDe(pagina)].id}"`)) p.push(`${pagina}: sin el bloque de datos del viaje`);
  return p;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const lista = paginas();
  const cambiadas = [];
  const problemas = Object.keys(VIAJES).filter((p) => !lista.includes(p)).map((p) => `viaje-datos: ${p} no es una página`);
  for (const pagina of lista) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = conViaje(actual, pagina);
    problemas.push(...problemasDe(nuevo, pagina));
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    for (const p of cambiadas) console.log(`viaje sin regenerar: ${p}`);
    process.exit(cambiadas.length || problemas.length ? 1 : 0);
  }
  console.log(`viaje: ${cambiadas.length} página(s) reescrita(s).`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
