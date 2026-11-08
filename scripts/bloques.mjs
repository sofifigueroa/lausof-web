/* =============================================================================
   BLOQUES COMPARTIDOS — node scripts/bloques.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Escribe, en cada página, cinco bloques que hasta el 07/11/2026 estaban
   copiados a mano (39 versiones de la franja de habilitaciones, 28 del pie de
   contacto, el puntaje de Google escrito de 6 maneras; rondas-2026-11-07/
   2-estado-actual.md, W1, W2, W5, W11):

     CONFIANZA  la franja de habilitaciones (div.certs), una por familia de
                página e idioma (FRANJAS en scripts/empresa.mjs)
     CIERRE     el bloque de cierre (section.cta-final): título y textos de
                cada página (scripts/bloques-datos.mjs), botones iguales por
                idioma. Reemplaza las copias por familia (cta-charter,
                cta-personal, cta-4x4…) que tenían 21 páginas.
     CONTACTO   el pie de contacto (div.foot-grid): dirección, redes, idiomas,
                teléfono y correo. El enlace a la otra sección (GENERADO:CRUCE)
                sigue saliendo de scripts/menu.mjs y queda adentro, igual.
     BARRA      la barra del teléfono (div.wa-bar): Llamar · WhatsApp, o
                Llamar · Correo · WhatsApp en empresas (BARRAS en
                scripts/empresa.mjs; tests/menu.test.js)
     RESENA     el renglón del puntaje de Google en las tres portadas, debajo
                del título de la sección de reseñas (ronda 4, 08/11/2026)
     PRUEBA     la lista de pruebas del hub de empresas (ul.prueba-grid, ES y
                EN), desde PRUEBAS_HUB en scripts/empresa.mjs (ronda 4)

   Ronda 4 (08/11/2026, «confianza y pruebas»): toda página que vende muestra
   el puntaje de Google con su enlace al perfil (3-diseno v4, M14 a). Va en la
   franja; las páginas de empresas sin franja reciben la de su familia justo
   después de la miga; el hub, en su lista de pruebas; y las pocas sin franja
   (flota, flota en venta, golf), en el cierre. Quedan sin puntaje sólo las de
   privacidad y las 404, que no venden.

   De dónde sale cada cosa:
     · Datos de la empresa, puntaje de Google, franjas y rótulos:
       scripts/empresa.mjs (DATOS DE LOS BLOQUES COMPARTIDOS).
     · Lo propio de cada página (asunto del correo, título y textos del
       cierre): scripts/bloques-datos.mjs.
     · El WhatsApp: número y primera línea de los enlaces de la propia página
       que están fuera de las zonas (el botón del encabezado, sobre todo), con
       los renglones de su tipo; el correo, con el asunto de la página. Los dos
       se arman con las funciones de scripts/prefill.mjs, así que salen igual
       que el resto de los enlaces (prefill no entra a estas zonas).
     · Los idiomas del pie: los del selector de la barra de arriba (.lang-switch).

   El contrato de la vitrina se respeta (tienda-v2-0611:scripts/tienda.mjs):
   `<div class="wa-bar` queda tal cual, sin <div> antes del botón de WhatsApp,
   que sigue siendo <a class="btn btn-wa"> con su <svg>. Si una zona
   GENERADO:TIENDA quedó dentro de uno de estos bloques (la vitrina pone la
   suya justo después de la barra), se conserva al regenerar.

     node scripts/bloques.mjs              reescribe lo que falte o haya cambiado
     node scripts/bloques.mjs --comprobar  no escribe nada; sale con 1 si algo no coincide
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { FRANJAS, PRUEBAS_HUB, TEXTOS_BLOQUES, ACCIONES, BARRAS, accionDe, REDES, TEL_HREF, WA_VENTAS, RESENAS_GOOGLE, datoResenas } from './empresa.mjs';
import { PAGINAS as TIPO_DE, idiomaDe, armarWa, armarMailto, waDePagina } from './prefill.mjs';
import { zonaCruce, seccionDe, PORTADAS } from './menu.mjs';
import { PAGINAS as DATOS, PIE_PORTADAS } from './bloques-datos.mjs';
import { AVISOS } from './privacidad.mjs';

export const ZONAS = ['CONFIANZA', 'CIERRE', 'CONTACTO', 'BARRA', 'RESENA', 'PRUEBA'];

// Los hubs de empresas: llevan la lista de pruebas en vez de franja.
export const HUBS_EMPRESAS = ['empresas-y-mineria.html', 'en/business-and-mining.html'];

const abre = (n) => `<!-- GENERADO:${n} — no editar a mano: editar scripts/bloques.mjs (o empresa.mjs, bloques-datos.mjs) y correr \`node scripts/bloques.mjs\` -->`;
const cierra = (n) => `<!-- /GENERADO:${n} -->`;
const zonaRe = (n) => new RegExp(`([ \\t]*)<!-- GENERADO:${n} [\\s\\S]*?<!-- \\/GENERADO:${n} -->`);
const TIENDA = /<!-- GENERADO:TIENDA [a-z0-9-]+ -->[\s\S]*?<!-- \/GENERADO:TIENDA -->/g;

// Lo que había escrito a mano antes de la primera pasada (sólo se usa una vez).
const VIEJO = {
  CONFIANZA: /([ \t]*)<div class="certs[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/,
  CIERRE: /([ \t]*)<section class="block (?:cta-final|cta-[a-z0-9]+|contacto-venta)"[^>]*>[\s\S]*?<\/section>/,
  CONTACTO: /([ \t]*)<div class="wrap foot-grid">[\s\S]*?\n {2}<\/div>(?=\n)/,
  BARRA: /([ \t]*)<div class="wa-bar[^"]*"[^>]*>[\s\S]*?<\/div>/,
  RESENA: /([ \t]*)<p>(?:Opiniones de clientes|What customers say|Opiniões de clientes):[\s\S]*?<\/p>/,
  PRUEBA: /([ \t]*)<ul class="prueba-grid">[\s\S]*?<\/ul>/,
};

export const SVG_WA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const SVG_TEL = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>';
const SVG_CORREO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.24l-8 4.76-8-4.76V6l8 4.75L20 6v2.24z"/></svg>';
const LOGO = '<picture><source type="image/avif" srcset="/assets/logo-insignia-web.avif 340w" sizes="132px"><img src="/assets/logo-insignia-web.webp" srcset="/assets/logo-insignia-web.webp 340w" alt="" width="340" height="340" loading="lazy" sizes="132px" decoding="async"></picture>';

const escaparAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const sangrar = (lineas, s) => lineas.map((l) => (l ? s + l : l)).join('\n');

/** La familia de la franja de una página: portada, pasajeros, empresas o la de su servicio. */
export function familiaDe(pagina) {
  const tipo = TIPO_DE[pagina];
  if (tipo === 'camioneta' || tipo === 'autoelevador') return tipo;
  const seccion = seccionDe(pagina);
  if (seccion === 'inicio') return 'portada';
  if (seccion === 'empresas') return 'empresas';
  return 'pasajeros';
}

/* ---- cada bloque, puro ----------------------------------------------------- */

const ROTULO_RESENAS = { es: 'Reseñas en Google', en: 'Google reviews', pt: 'Avaliações no Google' };
const enlaceResenas = (texto) => `<a href="${RESENAS_GOOGLE.url}" target="_blank" rel="noopener">${texto}</a>`;
const renglonResenas = (idioma) => `<span>${enlaceResenas(`<b>${ROTULO_RESENAS[idioma]}</b>`)}: ${datoResenas(idioma)}</span>`;

/** ¿La página ya muestra el puntaje fuera del cierre? */
const resenaFueraDelCierre = (html) => html.replace(zonaRe('CIERRE'), '').includes(RESENAS_GOOGLE.url);
/** Páginas que no venden: sin puntaje (las de privacidad y las 404). */
const sinPuntaje = (pagina) => Object.values(AVISOS).includes(pagina) || pagina.endsWith('404.html');

export function franja(pagina) {
  const idioma = idiomaDe(pagina);
  const f = FRANJAS[familiaDe(pagina)]?.[idioma];
  if (!f) throw new Error(`${pagina}: no hay franja para la familia ${familiaDe(pagina)} en ${idioma} (scripts/empresa.mjs, FRANJAS)`);
  const items = f.items.map((i) => (i.resena ? renglonResenas(idioma)
    : Array.isArray(i) ? `<span><b>${i[0]}</b>${i[1]}</span>` : `<span>${i}</span>`));
  return [`<div class="${f.clase || 'certs'}" aria-label="${f.rotulo}">`, '  <div class="wrap certs-row">',
    ...items.map((i) => `    ${i}`), '  </div>', '</div>'];
}

/** El WhatsApp y el correo pre-armados de la página. */
function enlaces(html, pagina) {
  const idioma = idiomaDe(pagina);
  const tipo = TIPO_DE[pagina];
  if (!tipo) throw new Error(`${pagina}: sin tipo en scripts/prefill.mjs (PAGINAS)`);
  const w = waDePagina(html, pagina);
  if (!w) throw new Error(`${pagina}: ningún WhatsApp fuera de las zonas del que tomar número y primera línea`);
  const d = DATOS[pagina] || {};
  return { idioma, tipo, wa: escaparAttr(armarWa(w.numero, w.apertura, tipo, idioma)), numero: w.numero, mail: escaparAttr(armarMailto(d.asunto, tipo, idioma)) };
}

export function cierre(html, pagina) {
  const c = DATOS[pagina]?.cierre;
  if (!c) return null;
  // El puntaje va en el cierre sólo si la página no lo muestra en otro lado.
  const conResena = !PORTADAS.includes(pagina) && !sinPuntaje(pagina) && !resenaFueraDelCierre(html);
  const { idioma, tipo, wa, mail } = enlaces(html, pagina);
  const t = TEXTOS_BLOQUES[idioma];
  const a = ACCIONES[idioma][accionDe(tipo)];
  const botonWa = `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${SVG_WA}${a.wa}</a>`;
  const botonCorreo = `<a class="btn btn-ghost" href="${mail}">${SVG_CORREO}${a.correo}</a>`;
  // En inglés, las páginas de empresas ponen el correo primero: las lee compras,
  // y el correo es el canal que responde en inglés (en/warehouse.html, 05/11/2026).
  const botones = idioma === 'en' && familiaDe(pagina) === 'empresas' ? [botonCorreo, botonWa] : [botonWa, botonCorreo];
  const nota = c.nota || t.cierreNota;
  return [
    `<section class="block cta-final"${c.id ? ` id="${c.id}"` : ''}>`,
    '  <div class="wrap">',
    ...(c.sinLogo ? [] : [`    ${LOGO}`]),
    `    <h2>${c.titulo}</h2>`,
    ...c.textos.map((p) => `    <p>${p}</p>`),
    ...(conResena ? [`    <p class="resenas-google">${renglonResenas(idioma)}</p>`] : []),
    '    <div class="cta-botones">',
    ...botones.map((b) => `      ${b}`),
    '    </div>',
    ...(nota ? [`    <p class="routing">${nota}</p>`] : []),
    '  </div>',
    '</section>',
  ];
}

const ORDEN_IDIOMAS = ['es', 'en', 'pt'];
const NOMBRE_IDIOMA = { es: 'Español', en: 'English', pt: 'Português' };
const LANG = { es: 'es', en: 'en', pt: 'pt-BR' };

/** Los idiomas del pie: los mismos destinos que el selector de la barra de arriba. */
function idiomasDe(html) {
  return [...html.matchAll(/<a class="lang-switch"[^>]*>/g)]
    .map(([a]) => ({ href: (a.match(/\bhref="([^"]+)"/) || [])[1], idioma: (a.match(/\bhreflang="([a-z]+)"/) || [])[1] }))
    .filter((x) => x.href && NOMBRE_IDIOMA[x.idioma])
    .sort((a, b) => ORDEN_IDIOMAS.indexOf(a.idioma) - ORDEN_IDIOMAS.indexOf(b.idioma))
    .map(({ href, idioma }) => `<a href="${href}" hreflang="${idioma}" lang="${LANG[idioma]}">${NOMBRE_IDIOMA[idioma]}</a>`);
}

export function contacto(html, pagina) {
  const { idioma, tipo, wa, mail, numero } = enlaces(html, pagina);
  const t = TEXTOS_BLOQUES[idioma];
  const idiomas = idiomasDe(html);
  const extra = PORTADAS.includes(pagina) ? PIE_PORTADAS[pagina]
    : t.flotaEnVenta && pagina !== 'flota-en-venta.html' ? t.flotaEnVenta : null;
  const cruce = zonaCruce(pagina);
  // La flota en venta: llamadas al 526-9009 y WhatsApp a la línea de ventas (28/08/2026).
  const telefonos = tipo === 'flota' && numero === WA_VENTAS.numero
    ? [`<li><a href="${TEL_HREF}">${t.telefono}</a></li>`, `<li>WhatsApp <a href="${wa}" target="_blank" rel="noopener">${WA_VENTAS.texto}</a></li>`]
    : [`<li><a href="${TEL_HREF}">${t.telefono}</a> — ${t.llamadasY} <a href="${wa}" target="_blank" rel="noopener">WhatsApp</a></li>`,
      ...t.notasTelefono.map((n) => `<li>${n}</li>`)];
  const columna = [
    '  <div>',
    `    <p>${t.pie}</p>`,
    `    <p>${REDES}</p>`,
    ...(idiomas.length ? [`    <p>${idiomas.join(' · ')}</p>`] : []),
    ...(extra ? [`    <p>${extra}</p>`] : []),
  ];
  return [
    '<div class="wrap foot-grid">',
    ...columna,
    ...(cruce ? [cruce.replace(/^ {2}/gm, '')] : []),
    '  </div>',
    '  <div>',
    `    <b>${t.telefonos}</b>`,
    '    <ul>',
    ...telefonos.map((l) => `      ${l}`),
    '    </ul>',
    '  </div>',
    '  <div>',
    `    <b>${t.correo}</b>`,
    '    <ul>',
    `      <li><a href="${mail}">transporte@lausof.com</a></li>`,
    '    </ul>',
    '  </div>',
    '</div>',
  ];
}

/** El caso de BARRAS (scripts/empresa.mjs) que le toca a una página. */
export function barraDe(pagina) {
  return BARRAS.find(({ caso }) => (caso === 'empresas' ? seccionDe(pagina) === 'empresas' : caso === pagina || caso === 'resto'));
}

export function barra(html, pagina) {
  const { idioma, wa, mail } = enlaces(html, pagina);
  const t = TEXTOS_BLOQUES[idioma];
  const { canal } = ACCIONES[idioma];
  const { botones } = barraDe(pagina);
  // Los rótulos son el canal: con el verbo no entran en un renglón a 360 px (BARRAS).
  const tres = botones.length === 3;
  const boton = {
    llamar: `<a class="btn btn-ghost" href="${TEL_HREF}">${SVG_TEL}${canal.llamar}</a>`,
    correo: `<a class="btn btn-ghost" href="${mail}">${SVG_CORREO}${canal.correo}</a>`,
    wa: `<a class="btn btn-wa" href="${wa}" target="_blank" rel="noopener">${SVG_WA}${canal.wa}</a>`,
  };
  return [`<div class="wa-bar${tres ? ' tres' : ''}" aria-label="${t.barra}">`, ...botones.map((b) => `  ${boton[b]}`), '</div>'];
}

/** El puntaje en la sección de reseñas de las portadas, con el mismo rótulo que la franja. */
export function resena(pagina) {
  const idioma = idiomaDe(pagina);
  return [`<p class="resenas-google">${enlaceResenas(ROTULO_RESENAS[idioma])}: <span class="resenas-dato">${datoResenas(idioma)}</span></p>`];
}

/** La lista de pruebas del hub de empresas. */
export function prueba(pagina) {
  const idioma = idiomaDe(pagina);
  const items = PRUEBAS_HUB[idioma];
  if (!items) throw new Error(`${pagina}: no hay pruebas del hub en ${idioma} (scripts/empresa.mjs, PRUEBAS_HUB)`);
  return ['<ul class="prueba-grid">',
    ...items.map((i) => (i.resena ? `  <li><b>${enlaceResenas(ROTULO_RESENAS[idioma])}</b>${datoResenas(idioma)}</li>`
      : `  <li><b>${i[2] ? `<a href="${i[2]}">${i[0]}</a>` : i[0]}</b>${i[1]}</li>`)),
    '</ul>'];
}

/** Las páginas de empresas con encabezado llevan la franja de su familia (menos los hubs, que llevan pruebas). */
export const debeLlevarFranja = (html, pagina) =>
  seccionDe(pagina) === 'empresas' && !HUBS_EMPRESAS.includes(pagina) && /<section class="page-head"/.test(html);

/** La primera vez: abre la zona CONFIANZA después de la miga (y de la zona TIENDA que la sigue, si hay). */
function abrirFranja(html) {
  const m = html.match(/\n([ \t]*)<!-- \/GENERADO:MIGAS -->\n(?:[ \t]*<!-- GENERADO:TIENDA bloque -->[\s\S]*?<!-- \/GENERADO:TIENDA -->\n)?/);
  if (!m) return html;
  const i = m.index + m[0].length;
  return `${html.slice(0, i)}\n${m[1]}${abre('CONFIANZA')}\n${m[1]}${cierra('CONFIANZA')}\n${html.slice(i)}`;
}

/* ---- escribir las zonas ---------------------------------------------------- */

/** Reemplaza (o, la primera vez, envuelve) un bloque. Conserva tal cual las zonas TIENDA que hubiera adentro. */
function poner(html, nombre, armar) {
  const m = html.match(zonaRe(nombre)) || html.match(VIEJO[nombre]);
  if (!m) return html;
  const lineas = armar();
  if (!lineas) return html;
  const sangria = m[1];
  const tienda = m[0].match(TIENDA) || [];
  const bloque = [sangrar([abre(nombre), ...lineas.flatMap((l) => l.split('\n'))], sangria), ...tienda, sangria + cierra(nombre)].join('\n');
  return html.slice(0, m.index) + bloque + html.slice(m.index + m[0].length);
}

/** La primera vez: marca el bloque escrito a mano como zona, sin tocarlo. */
function marcar(html, nombre) {
  if (zonaRe(nombre).test(html)) return html;
  const m = html.match(VIEJO[nombre]);
  if (!m) return html;
  return html.slice(0, m.index) + `${m[1]}${abre(nombre)}\n${m[0]}\n${m[1]}${cierra(nombre)}` + html.slice(m.index + m[0].length);
}

/** La página con los cinco bloques al día. Pura e idempotente. */
export function conBloques(html, pagina) {
  if (!/<body[\s>]/.test(html)) return html;
  // Primero se marcan las zonas, así el WhatsApp de la página se lee sólo de
  // los enlaces que quedan fuera de ellas (igual la primera vez que después).
  let out = html;
  for (const n of ['CIERRE', 'CONTACTO', 'BARRA']) out = marcar(out, n);
  if (debeLlevarFranja(out, pagina) && !zonaRe('CONFIANZA').test(out)) out = abrirFranja(out);
  out = poner(out, 'CONFIANZA', () => franja(pagina));
  if (HUBS_EMPRESAS.includes(pagina)) out = poner(out, 'PRUEBA', () => prueba(pagina));
  out = poner(out, 'CIERRE', () => cierre(out, pagina));
  out = poner(out, 'CONTACTO', () => contacto(out, pagina));
  out = poner(out, 'BARRA', () => barra(out, pagina));
  if (PORTADAS.includes(pagina)) out = poner(out, 'RESENA', () => resena(pagina));
  return out;
}

/** Lo que no cierra en una página ya generada (lo usa también tests/bloques.test.js). */
export function problemasDe(html, pagina) {
  const p = [];
  if (DATOS[pagina]?.cierre && !zonaRe('CIERRE').test(html)) p.push(`${pagina}: tiene cierre en bloques-datos.mjs y no tiene la zona CIERRE`);
  if (/class="page-head"/.test(html) && !pagina.includes('404') && !DATOS[pagina]?.cierre) p.push(`${pagina}: página con encabezado y sin cierre en bloques-datos.mjs`);
  if (/<div class="wa-bar/.test(html) && !zonaRe('BARRA').test(html)) p.push(`${pagina}: barra del teléfono fuera de la zona BARRA`);
  if (/<div class="certs/.test(html) && !zonaRe('CONFIANZA').test(html)) p.push(`${pagina}: franja fuera de la zona CONFIANZA`);
  if (/<footer class="site"/.test(html) && !zonaRe('CONTACTO').test(html)) p.push(`${pagina}: pie sin la zona CONTACTO`);
  if (debeLlevarFranja(html, pagina) && !zonaRe('CONFIANZA').test(html)) p.push(`${pagina}: página de empresas sin franja (zona CONFIANZA)`);
  if (HUBS_EMPRESAS.includes(pagina) && !zonaRe('PRUEBA').test(html)) p.push(`${pagina}: hub sin la zona PRUEBA`);
  if (!sinPuntaje(pagina) && /<body[\s>]/.test(html) && !html.includes(RESENAS_GOOGLE.url)) p.push(`${pagina}: página que vende sin el puntaje de Google`);
  return p;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  const problemas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    let nuevo;
    try { nuevo = conBloques(actual, pagina); } catch (e) { problemas.push(e.message); continue; }
    problemas.push(...problemasDe(nuevo, pagina));
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    for (const p of cambiadas) console.log(`bloques sin regenerar: ${p}`);
    process.exit(cambiadas.length || problemas.length ? 1 : 0);
  }
  console.log(`bloques: ${cambiadas.length} página(s) reescrita(s).`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
