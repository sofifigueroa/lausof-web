/* =============================================================================
   VITRINA — precios y «Reservar» en las páginas de turismo (zonas TIENDA)
   -----------------------------------------------------------------------------
   Diseño: ~/lausof/web/demo-reservas-2026-11-06/3a-diseno-experiencia.md,
   revisado por 3c-diseno-seleccion.md (contador «Personas», un total por
   tramo) y 3e-diseno-mercado.md §5 (sólo pesos); textos: 4-textos.md; contrato con el armado de la demo:
   7-contrato-overlay.md; contrato de Apacheta: asistente-demo-plan-0611.md §3.

   `scripts/demo.mjs armar` (O4) llama a `generarTienda` sobre la copia de la
   demo con el perfil demo. El generador marca en cada página sus zonas

     <!-- GENERADO:TIENDA <nombre> -->…<!-- /GENERADO:TIENDA -->

   y escribe sólo dentro de ellas. Con `perfil.tienda.activa === false`
   (producción hoy) no toca nada: las páginas del repo no llevan zonas, así
   que la vitrina no cambia ni un byte de www.lausof.com, ni el <lastmod> del
   sitemap ni los avisos de IndexNow de 79 páginas por comentarios vacíos.
   Las zonas:

     estilos   <head>: la hoja de la vitrina, /css/tienda.css?v=<hash> (un <link>)
     cabeza    encabezado, antes de los botones: la línea de precio
     ir        primer botón del encabezado: «Ver precios y reservar»
     bloque    después de las migas: «Precios y reserva» (#precios)
     bloque-2  la 4x4 mensual para empresas, después de su sección
     destinos  el título de los circuitos del hub: «Destinos» (D11)
     hub-controles  bajo la bajada del hub: «Personas» (3c §3)
     hub       cada tarjeta de circuito del hub de turismo
     barra     después de la barra del teléfono: WhatsApp · Reservar
     pie       fila legal del pie: «Botón de arrepentimiento», sólo si el
               catálogo manda `enlaces.cancelar` (lo pasa armar; ver leerPerfil)
     scripts   antes de </body>: la configuración y, recién con el `load`,
               js/precios-host.js + js/tienda.js y el boton.js del chat de Apacheta

   Ningún precio se escribe en un archivo: los dibuja js/tienda.js con el
   catálogo que lee en el navegador. Precios, nombres, vehículos y capacidades
   son del catálogo; acá sólo está qué página ofrece qué (tienda-mapa.mjs).

   Para mirarla a mano sobre una copia del sitio (nunca sobre el repo):
     node scripts/tienda.mjs --raiz <copia> [--sitio <origen>] [--app <origen>] [--clave <clave>]
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGINAS, HUB, SERVICIOS, ofertaDe, idiomaDe } from './tienda-mapa.mjs';
import { TEXTOS, texto } from './tienda-textos.mjs';
import { eleccionesDe, porPersonaEn } from './tienda-elecciones.mjs';
import { version } from './versiones.mjs';


const ABRE = (nombre) => `<!-- GENERADO:TIENDA ${nombre} -->`;
const CIERRA = '<!-- /GENERADO:TIENDA -->';
const ZONA_RE = /<!-- GENERADO:TIENDA ([a-z0-9-]+) -->([\s\S]*?)<!-- \/GENERADO:TIENDA -->/g;

// Sobre de correo de los botones «Email» que ya usan las páginas de empresas en inglés.
const ICONO_CORREO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4.24l-8 4.76-8-4.76V6l8 4.75L20 6v2.24z"/></svg>';

const escapar = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const desescapar = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** La ruta con la que se enlaza un archivo (root-absoluta). */
export const rutaDe = (archivo) => {
  if (archivo === 'index.html') return '/';
  if (archivo.endsWith('/index.html')) return `/${archivo.slice(0, -'index.html'.length)}`;
  return `/${archivo}`;
};

/* ---- perfil -------------------------------------------------------------- */

function origen(url, nombre) {
  let u;
  try { u = new URL(url); } catch { throw new Error(`perfil.tienda.${nombre}: «${url}» no es una URL`); }
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) {
    throw new Error(`perfil.tienda.${nombre}: tiene que ser https`);
  }
  if (u.pathname !== '/' || u.search || u.hash) throw new Error(`perfil.tienda.${nombre}: sólo el origen, sin ruta`);
  return u.origin;
}

/**
 * La página del «Botón de arrepentimiento»: `enlaces.cancelar` del catálogo,
 * si es una dirección del mismo origen que SITIO; si no, null y el pie no
 * lleva el enlace. Web nunca la arma (Apacheta, 18/11: null mientras la página
 * no exista; `{sitio}/{empresa}/cancelar` terminaba en su pantalla de ingreso).
 */
function cancelarDe(enlaces, sitio) {
  const v = enlaces && enlaces.cancelar;
  if (typeof v !== 'string' || !sitio) return null;
  try {
    const u = new URL(v);
    return u.origin === sitio ? u.toString() : null;
  } catch { return null; }
}

/**
 * Lo que la vitrina lee del perfil (scripts/entorno.mjs), validado.
 * `enlaces`: los del catálogo (`enlaces`), que el generador no pide (no usa la
 * red): se los pasa quien lo llama (scripts/demo.mjs armar, O4).
 */
export function leerPerfil(perfil, enlaces = null) {
  const t = perfil && perfil.tienda;
  if (!t) throw new Error('perfil sin tienda');
  const activa = t.activa === true;
  if (!activa) return { activa: false };
  if (typeof t.empresa !== 'string' || !/^[a-z0-9-]+$/.test(t.empresa)) throw new Error('perfil.tienda.empresa: un slug');
  const clave = t.clave === null || t.clave === undefined || t.clave === '' ? null : String(t.clave);
  if (clave !== null && !/^[A-Za-z0-9_-]{8,128}$/.test(clave)) throw new Error('perfil.tienda.clave: la clave pública del sitio');
  const elecciones = eleccionesDe(perfil);
  const sitio = t.sitio ? origen(t.sitio, 'sitio') : null;
  return {
    activa: true,
    nombre: perfil.nombre || null,
    host: perfil.host ? origen(perfil.host, 'host') : null,
    sitio,
    cancelar: cancelarDe(enlaces, sitio),
    app: t.app ? origen(t.app, 'app') : null,
    empresa: t.empresa,
    clave,
    elecciones,
    porPersona: porPersonaEn(elecciones, perfil),
    // Fuera de producción el chip «PRECIOS DE PRUEBA» va en el HTML, invisible,
    // para que el título guarde su alto; js/tienda.js lo muestra sólo con un
    // catálogo "demo": true y el visto del host. Producción nunca lo lleva.
    chipDemo: perfil.nombre !== 'produccion',
  };
}

// La hoja de la vitrina es un archivo del sitio (css/tienda.css), servido
// immutable por un año con ?v= = hash del archivo (scripts/versiones.mjs), y no
// un <style> en cada página: en línea sumaba ~1,6 KB comprimidos a cada HTML y
// turismo pasaba la primera ventana TCP (14,6 KB; +150 ms de LCP simulado,
// rondas v3 (b)). Pedida en el <head>, baja en paralelo con styles.css.
const hoja = () => `<link rel="stylesheet" href="/css/tienda.css?v=${version('css/tienda.css')}">`;

/* ---- las zonas ----------------------------------------------------------- */

function unaVez(html, patron, archivo, que) {
  const r = new RegExp(patron.source, patron.flags.includes('g') ? patron.flags : `${patron.flags}g`);
  const hallados = [...html.matchAll(r)];
  if (hallados.length !== 1) throw new Error(`${archivo}: ${que} aparece ${hallados.length} veces (se esperaba 1)`);
  return hallados[0];
}

const insertarEn = (html, i, trozo) => html.slice(0, i) + trozo + html.slice(i);
const vacia = (nombre) => `${ABRE(nombre)}${CIERRA}`;

function finDeSeccion(html, inicio, archivo) {
  const cierre = html.indexOf('</section>', inicio);
  const otra = html.indexOf('<section', inicio + 1);
  if (cierre < 0 || (otra >= 0 && otra < cierre)) throw new Error(`${archivo}: sección sin cerrar o anidada`);
  return cierre + '</section>'.length;
}

/** Dónde va un bloque: después de las migas; si no hay, después de la primera sección de <main>; o después de la sección `despues`. */
function lugarDelBloque(html, archivo, despues) {
  if (despues) return finDeSeccion(html, unaVez(html, new RegExp(`<section[^>]*\\bid="${despues}"`), archivo, `la sección #${despues}`).index, archivo);
  const migas = html.match(/<nav class="crumbs[^"]*"[^>]*>[\s\S]*?<\/nav>/);
  if (migas) return migas.index + migas[0].length;
  const main = unaVez(html, /<main[^>]*>/, archivo, '<main>');
  const primera = html.indexOf('<section', main.index);
  if (primera < 0) throw new Error(`${archivo}: <main> sin secciones`);
  return finDeSeccion(html, primera, archivo);
}

/** Qué zonas lleva un archivo, en el orden en que aparecen. */
export function zonasDe(archivo) {
  const o = ofertaDe(archivo);
  const lista = ['estilos'];
  if (o && o.cabeza) lista.push('cabeza', 'ir');
  if (o) o.bloques.forEach((_, i) => lista.push(i === 0 ? 'bloque' : `bloque-${i + 1}`));
  if (Object.values(HUB.paginas).includes(archivo)) lista.push('destinos', 'hub-controles', ...HUB.circuitos.map(() => 'hub'));
  lista.push('pie');
  if (o && o.barra) lista.push('barra');
  lista.push('scripts');
  return lista;
}

const esPagina = (html) => /<body[\s>]/.test(html) && html.includes('</head>');

/** Pone las zonas vacías que le falten a una página. Idempotente. Pura. */
export function ponerZonas(html, archivo) {
  if (!esPagina(html)) return html;
  const tiene = new Set([...html.matchAll(ZONA_RE)].map((m) => m[1]));
  const falta = (n) => !tiene.has(n);
  let out = html;
  const o = ofertaDe(archivo);
  if (falta('estilos')) out = insertarEn(out, unaVez(out, /<\/head>/, archivo, '</head>').index, `  ${vacia('estilos')}\n`);
  if (o && o.cabeza && falta('cabeza')) {
    const inicio = unaVez(out, /<section class="page-head"/, archivo, 'el encabezado').index;
    const ctas = out.indexOf('<div class="ctas">', inicio);
    if (ctas < 0 || ctas > out.indexOf('</section>', inicio)) throw new Error(`${archivo}: el encabezado no tiene .ctas`);
    const sangria = out.slice(out.lastIndexOf('\n', ctas) + 1, ctas);
    out = out.slice(0, ctas) + `${vacia('cabeza')}\n${sangria}<div class="ctas">${vacia('ir')}` + out.slice(ctas + '<div class="ctas">'.length);
  }
  if (o) {
    o.bloques.forEach((b, i) => {
      const nombre = i === 0 ? 'bloque' : `bloque-${i + 1}`;
      if (!falta(nombre)) return;
      const en = lugarDelBloque(out, archivo, b.despues && b.despues[o.idioma]);
      out = insertarEn(out, en, `\n  ${vacia(nombre)}`);
    });
  }
  if (Object.values(HUB.paginas).includes(archivo) && falta('destinos')) {
    // El título de la sección de circuitos: «Destinos» en la demo (D11). La
    // zona envuelve el texto de hoy, que queda si la vitrina no llena la zona.
    const primera = out.indexOf('<article class="card circuito">');
    const h2 = out.lastIndexOf('<h2>', primera);
    const fin = out.indexOf('</h2>', h2);
    if (primera < 0 || h2 < 0 || fin > primera) throw new Error(`${archivo}: sin el título de los circuitos`);
    out = `${out.slice(0, h2 + 4)}${ABRE('destinos')}${out.slice(h2 + 4, fin)}${CIERRA}${out.slice(fin)}`;
  }
  if (Object.values(HUB.paginas).includes(archivo) && falta('hub-controles')) {
    // El contador del hub va bajo la bajada, antes de las tarjetas (3c §3).
    const primera = out.indexOf('<article class="card circuito">');
    const cards = out.lastIndexOf('<div class="cards circuitos">', primera);
    const sub = out.lastIndexOf('<p class="sub">', cards);
    const finSub = out.indexOf('</p>', sub);
    if (cards < 0 || sub < 0 || finSub > cards) throw new Error(`${archivo}: sin la bajada de los circuitos`);
    out = insertarEn(out, finSub + '</p>'.length, vacia('hub-controles'));
  }
  if (Object.values(HUB.paginas).includes(archivo) && falta('hub')) {
    const tarjetas = [...out.matchAll(/<article class="card circuito">/g)];
    if (tarjetas.length !== HUB.circuitos.length) throw new Error(`${archivo}: ${tarjetas.length} tarjetas de circuito, el mapa tiene ${HUB.circuitos.length}`);
    for (let i = tarjetas.length - 1; i >= 0; i -= 1) {
      const inicio = tarjetas[i].index;
      const tramo = out.slice(inicio, out.indexOf('</article>', inicio));
      const ruta = tramo.indexOf('<a class="ruta-link"');
      const en = inicio + (ruta >= 0 ? ruta : tramo.lastIndexOf('</div>'));
      out = insertarEn(out, en, `${vacia('hub')}\n            `);
    }
  }
  if (falta('pie')) {
    const legal = unaVez(out, /\n([ \t]*)<!-- \/GENERADO:LEGAL -->/, archivo, 'el cierre de GENERADO:LEGAL');
    out = insertarEn(out, legal.index, `\n${legal[1]}${vacia('pie')}`);
  }
  if (o && o.barra && falta('barra')) {
    const barra = unaVez(out, /<div class="wa-bar[^"]*"[^>]*>[\s\S]*?<\/div>/, archivo, 'la barra del teléfono');
    out = insertarEn(out, barra.index + barra[0].length, `\n${vacia('barra')}`);
  }
  if (falta('scripts')) out = insertarEn(out, unaVez(out, /<\/body>/, archivo, '</body>').index, `${vacia('scripts')}\n`);
  return out;
}

/* ---- el contenido de cada zona ------------------------------------------ */

const esqueleto = (n) => Array.from({ length: Math.min(Math.max(n, 1), 3) }, () =>
  '<article class="card tienda-card tienda-esqueleto" aria-hidden="true"><div class="card-body"><span class="e e-titulo"></span><span class="e"></span><span class="e e-zona"></span><span class="e e-linea"></span><span class="e e-boton"></span></div></article>').join('');

/**
 * «Personas − 2 +», dibujado inerte hasta que el catálogo responde (3c §5,
 * §6): así nada se corre al llegar los precios. js/tienda.js lo habilita y lo
 * saca si no hay tramos (o si el catálogo no respondió). Sin selector de
 * moneda: sólo pesos (3e §5 A).
 */
function controles({ idioma, sufijo }) {
  const id = `personas-${sufijo}`;
  return `<div class="tienda-controles" data-tienda-controles data-inerte>`
    + `<div class="tienda-contador"><label for="${id}">${escapar(texto(idioma, 'tienda.contador.label'))}</label><span class="tienda-contador-ctl">`
    + `<button type="button" class="tienda-menos" data-tienda-menos aria-label="${escapar(texto(idioma, 'tienda.contador.menos'))}" aria-controls="${id}" disabled>−</button>`
    + `<input id="${id}" data-tienda-personas type="text" inputmode="numeric" pattern="[0-9]*" role="spinbutton" aria-valuemin="1" aria-valuemax="99" aria-valuenow="2" aria-valuetext="${escapar(texto(idioma, 'tienda.contador.valuetext.varios', { n: 2 }))}" value="2" autocomplete="off" disabled>`
    + `<button type="button" class="tienda-mas-uno" data-tienda-mas-uno aria-label="${escapar(texto(idioma, 'tienda.contador.mas'))}" aria-controls="${id}" disabled>+</button>`
    + '</span></div></div>';
}

/** La región que lee el lector, presente desde la carga. */
const vivo = (idioma) => `<p class="tienda-sr" aria-live="polite" aria-atomic="true" data-tienda-vivo>${escapar(texto(idioma, 'tienda.estado.cargando'))}</p>`;

/**
 * Sin JavaScript no hay catálogo: el mismo estado de error, con WhatsApp (3c
 * §5). Sin catálogo no hay dirección de compra, y Web no la arma (Apacheta, 18/11).
 */
function sinScript({ idioma, wa }) {
  return `<noscript><div class="cards tienda-cards"><article class="card tienda-card tienda-error"><div class="card-body"><p>${escapar(texto(idioma, 'tienda.estado.error'))}</p><a class="btn btn-wa" href="${escapar(wa)}" target="_blank" rel="noopener">${escapar(texto(idioma, 'tienda.estado.error_wa'))}</a></div></article></div></noscript>`;
}

/** El chip «PRECIOS DE PRUEBA» del título, invisible hasta que el catálogo dice "demo": true (sólo fuera de producción). */
const chipTitulo = (idioma, chipDemo) => (chipDemo ? ` <span class="tienda-chip" data-tienda-chip>${escapar(texto(idioma, 'demo.chip.bloque'))}</span>` : '');

function seccionBloque({ idioma, kicker, titulo: h2, servicios, indice, wa, chipDemo }) {
  const id = indice === 0 ? 'precios' : `precios-${indice + 1}`;
  const conPrecio = servicios.some((s) => SERVICIOS[s.clave].unidad !== null);
  // El bloque principal lleva título, contador y renglón final; el
  // secundario (la 4x4 mensual para empresas) es sólo su tarjeta, bajo la
  // sección que la presenta, y sigue al contador del principal.
  // El H2 es el nombre corto de la página (4-textos §2.1): queda fijo, el
  // catálogo no lo cambia al cargar (C10).
  const cabecera = indice === 0
    ? `\n      <div class="tienda-cab"><div class="tienda-titulo"><p class="kicker" data-tienda-kicker>${escapar(kicker)}</p><h2 id="${id}-h2">${escapar(h2)}${conPrecio ? chipTitulo(idioma, chipDemo) : ''}</h2></div>${conPrecio ? controles({ idioma, sufijo: id }) : ''}</div>${conPrecio ? vivo(idioma) : ''}`
    : '';
  const rotulo = indice === 0 ? `aria-labelledby="${id}-h2"` : `aria-label="${escapar(kicker)}"`;
  const mas = indice === 0
    ? `\n      <p class="tienda-mas" data-tienda-mas><a class="walink" href="${escapar(wa)}" target="_blank" rel="noopener">${escapar(texto(idioma, 'tienda.bloque.otro_wa'))}</a></p>`
    : '';
  return `
  <section class="block tienda${indice === 0 ? '' : ' tienda-secundario'}" id="${id}" ${rotulo}${conPrecio ? ' data-tienda-con-precio' : ''}>
    <div class="wrap">${cabecera}
      <div class="cards tienda-cards" data-tienda-bloque="${indice}" aria-busy="true">${esqueleto(servicios.length)}</div>${indice === 0 ? sinScript({ idioma, wa }) : ''}${mas}
    </div>
  </section>
  `;
}

/** El H2 del bloque: el `titulo` del mapa, si la página lo tiene; si no, sus migas; sin migas, su <h1> (4-textos §2.1). */
function tituloDe(html, o, idioma) {
  if (o.titulo) {
    if (!o.titulo[idioma]) throw new Error(`${o.es}: tienda-mapa.mjs le da \`titulo\` pero no en ${idioma}`);
    return o.titulo[idioma];
  }
  // Las migas son <li aria-current> en las páginas de turismo y <span aria-current> en las de eventos.
  const migas = html.match(/<(?:li|span)[^>]*\baria-current="page"[^>]*>([^<]+)<\/(?:li|span)>/);
  if (migas) return desescapar(migas[1].trim());
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1) return desescapar(h1[1].trim());
  throw new Error(`${o.es}: sin migas y sin <h1> en ${idioma} para el título del bloque`);
}

const hrefDe = (trozo, clase) => {
  const m = trozo.match(new RegExp(`<a[^>]*class="btn ${clase}"[^>]*href="([^"]*)"`)) || trozo.match(new RegExp(`<a[^>]*href="([^"]*)"[^>]*class="btn ${clase}"`));
  return m ? desescapar(m[1]) : null;
};

const barraDe = (html) => (html.match(/<div class="wa-bar[^"]*"[^>]*>[\s\S]*?<\/div>/) || [''])[0];

/** La barra del teléfono para una página con precio (3a §6.1, 4-textos §6). */
function barraNueva(html, archivo, idioma, elecciones) {
  const original = barraDe(html);
  const aria = (original.match(/aria-label="([^"]*)"/) || [])[1] || '';
  const wa = original.match(/<a class="btn btn-wa"[^>]*>(<svg[\s\S]*?<\/svg>)[^<]*<\/a>/);
  if (!wa) throw new Error(`${archivo}: la barra no tiene el botón de WhatsApp`);
  const waAbre = wa[0].slice(0, wa[0].indexOf('>') + 1);
  const botonWa = `${waAbre}${wa[1]}${escapar(texto(idioma, 'tienda.barra.wa'))}</a>`;
  const reservar = `<a class="btn btn-reservar" href="#precios">${escapar(texto(idioma, 'tienda.barra.reservar'))}</a>`;
  let correo = '';
  if (idioma === 'en' && elecciones.barraEn === 'correo-whatsapp-reservar') {
    const mail = html.match(/href="(mailto:[^"]*)"/);
    if (!mail) throw new Error(`${archivo}: sin mailto para el botón Email`);
    correo = `\n  <a class="btn btn-ghost" href="${mail[1]}">${ICONO_CORREO}${escapar(texto(idioma, 'tienda.barra.correo'))}</a>`;
  }
  return `\n<div class="${correo ? 'wa-bar tres' : 'wa-bar'}" aria-label="${aria}" data-tienda-barra>${correo}\n  ${botonWa}\n  ${reservar}\n</div>\n`;
}

/** Los textos que js/tienda.js necesita en la página, con la leyenda del neto según la elección. */
function textosDePagina(idioma, elecciones) {
  const propios = { ...TEXTOS[idioma] };
  if (idioma !== 'es' && elecciones.netoEtiqueta === 'traduccion') propios['tienda.neto'] = propios['tienda.neto_traduccion'];
  delete propios['tienda.neto_traduccion'];
  delete propios['pie.arrepentimiento'];
  return propios;
}

const jsonEnHTML = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

// Los scripts se piden recién con el `load` de la página, en orden (async =
// false): js/precios-host.js, js/tienda.js y, último, el boton.js del chat de
// Apacheta. Así ni los scripts ni el catálogo ni el chat le compiten ancho de
// banda a la foto del encabezado, el LCP de estas páginas (4G emulado: pedir
// los de la vitrina al parsear corría el LCP +0,33 s; así, +0,06–0,08 s; el
// boton.js async al parsear subía el de charter, rondas v3 (c)). boton.js
// funciona igual cargado tarde: si el <body> ya está, pone el botón en el acto.
// El ?v= de los dos del sitio es el hash del archivo (scripts/versiones.mjs),
// como en el resto del sitio: _headers sirve /js/* immutable por un año, y un
// número a mano se olvida de subir (antes ?v=1 y ?v=3 fijos).
const VITRINA_JS = () => [`/js/precios-host.js?v=${version('js/precios-host.js')}`, `/js/tienda.js?v=${version('js/tienda.js')}`];
const cargaDespuesDelLoad = (urls) => {
  for (const u of urls) if (/['"\\<>\s]/.test(u)) throw new Error(`tienda: URL de script inválida: ${u}`);
  return `<script>addEventListener('load',function(){[${urls.map((u) => `'${u}'`).join(',')}].forEach(function(u){var s=document.createElement('script');s.src=u;s.async=false;document.head.appendChild(s)})})</script>`;
};

/** Lo que js/tienda.js necesita de cada servicio del mapa. */
const entradaDe = ({ clave, tramos }) => ({ clave, nombre: SERVICIOS[clave].nombre, unidad: SERVICIOS[clave].unidad, tramos: tramos || null });

/** El contenido de cada zona de una página con un perfil activo. Puro. */
export function contenidos(html, archivo, p) {
  const idioma = idiomaDe(archivo);
  const c = {};
  const o = ofertaDe(archivo);
  const conVitrina = p.sitio && p.elecciones.idiomas.includes(idioma);
  const esHub = HUB.paginas[idioma] === archivo;
  const usaEstilos = p.sitio || (p.app && p.clave);
  if (usaEstilos) c.estilos = hoja();
  if (p.sitio && p.cancelar) {
    const etiqueta = p.elecciones.arrepentimientoEtiqueta === 'solo-es' ? texto('es', 'pie.arrepentimiento') : texto(idioma, 'pie.arrepentimiento');
    c.pie = `<a class="pie-arrepentimiento" href="${escapar(p.cancelar)}">${escapar(etiqueta)}</a>`;
  }
  const scripts = [];
  const despues = [];
  const chat = p.app && p.clave ? `${p.app}/asistente/${p.clave}/boton.js` : null;

  const wa = hrefDe(barraDe(html), 'btn-wa') || 'https://wa.me/5493875269009';
  const base = {
    sitio: p.sitio, empresa: p.empresa, idioma, desde: rutaDe(archivo), wa,
    chat: Boolean(p.app && p.clave),
    porPersona: p.porPersona,
    textos: textosDePagina(idioma, p.elecciones),
    bloques: [], cabeza: null, hub: null,
  };

  if (o && conVitrina) {
    const soloPresupuesto = o.tipo === 'evento' && p.elecciones.eventos === 'solo-presupuesto';
    const bloques = o.bloques
      .map((b) => ({ ...b, servicios: b.servicios.filter((s) => !(soloPresupuesto && SERVICIOS[s.clave] && SERVICIOS[s.clave].unidad !== null)) }));
    for (const b of bloques) for (const s of b.servicios) if (!(s.clave in SERVICIOS)) throw new Error(`${archivo}: servicio sin unidad en tienda-mapa.mjs: ${s.clave}`);
    const titulo = tituloDe(html, o, idioma);
    const kicker = soloPresupuesto || o.tipo === 'presupuesto' ? texto(idioma, 'tienda.bloque.kicker_presupuesto') : texto(idioma, 'tienda.bloque.kicker');
    bloques.forEach((b, i) => {
      if (!b.servicios.length) return;
      c[i === 0 ? 'bloque' : `bloque-${i + 1}`] = seccionBloque({
        idioma, kicker: i === 0 ? kicker : texto(idioma, 'tienda.bloque.kicker_presupuesto'), titulo: i === 0 ? titulo : null, servicios: b.servicios, indice: i, wa, chipDemo: p.chipDemo,
      });
    });
    const cabeza = o.cabeza && !soloPresupuesto ? entradaDe({ clave: o.cabeza, tramos: o.cabezaTramos }) : null;
    if (cabeza) {
      // No es una región viva: el único anuncio es el del bloque (3c §6).
      c.cabeza = '<p class="tienda-cabeza" data-tienda-cabeza></p>';
      c.ir = `<a class="btn btn-reservar" href="#precios" data-tienda-ir>${escapar(texto(idioma, 'tienda.cabeza.boton'))}</a>`;
    }
    if (o.barra && !soloPresupuesto) c.barra = barraNueva(html, archivo, idioma, p.elecciones);
    base.bloques = bloques.map((b) => ({ servicios: b.servicios.map(entradaDe) }));
    base.cabeza = cabeza;
  }
  if (esHub && conVitrina) {
    c.destinos = `${escapar(texto(idioma, 'tienda.hub.titulo'))}${chipTitulo(idioma, p.chipDemo)}`;
    c['hub-controles'] = `\n      ${controles({ idioma, sufijo: 'destinos' })}${vivo(idioma)}`;
    c.hub = HUB.circuitos.map((clave) => `<div class="tienda-hub" data-tienda-hub="${clave}"></div>`);
    base.hub = HUB.circuitos.map((clave) => entradaDe({ clave }));
  }
  if ((o || esHub) && conVitrina) {
    scripts.push(`<script type="application/json" id="tienda-config">${jsonEnHTML(base)}</script>`);
    despues.push(...VITRINA_JS());
  }
  if (chat) despues.push(chat);
  if (despues.length) scripts.push(cargaDespuesDelLoad(despues));
  if (scripts.length) c.scripts = `\n${scripts.join('\n')}\n`;
  return c;
}

/**
 * Marca las zonas de una página y las llena con el perfil. Sin perfil activo
 * devuelve la página tal cual. Pura.
 */
export function transformarPagina(entrada, archivo, p) {
  if (!esPagina(entrada) || !p.activa) return entrada;
  const html = ponerZonas(entrada, archivo);
  const esperadas = zonasDe(archivo);
  const halladas = [...html.matchAll(ZONA_RE)].map((m) => m[1]);
  if (halladas.join(',') !== esperadas.join(',')) {
    throw new Error(`${archivo}: zonas TIENDA [${halladas.join(', ')}], se esperaban [${esperadas.join(', ')}]`);
  }
  const c = contenidos(html, archivo, p);
  if (!Object.keys(c).length) return entrada; // nada que poner (sin SITIO ni chat): la página queda como está
  const usados = {};
  return html.replace(ZONA_RE, (_, nombre, dentro) => {
    let valor = c[nombre];
    if (Array.isArray(valor)) { usados[nombre] = (usados[nombre] || 0) + 1; valor = valor[usados[nombre] - 1]; }
    return `${ABRE(nombre)}${valor || dentro}${CIERRA}`;
  });
}

/** Las páginas del sitio dentro de `raiz`: la raíz, en/ y pt/. */
export function paginasDe(raiz) {
  const lista = [];
  for (const dir of ['', 'en', 'pt']) {
    const abs = path.join(raiz, dir);
    if (!fs.existsSync(abs)) continue;
    for (const nombre of fs.readdirSync(abs).sort()) if (nombre.endsWith('.html')) lista.push(dir ? `${dir}/${nombre}` : nombre);
  }
  return lista;
}

/**
 * El gancho de `scripts/demo.mjs armar` (O4, 7-contrato-overlay.md): llena las
 * zonas de las páginas de `raiz` con el perfil. Devuelve las rutas que cambió.
 * Rehúsa llenar las zonas de un repositorio con un perfil que no es el de
 * producción: el árbol del repo nunca lleva hosts de la demo (G2).
 */
export async function generarTienda({ raiz, perfil, enlaces = null }) {
  if (!raiz || !path.isAbsolute(raiz)) throw new Error('generarTienda: raiz tiene que ser una ruta absoluta');
  if (!fs.existsSync(path.join(raiz, 'index.html'))) throw new Error('generarTienda: raiz no es el sitio');
  const p = leerPerfil(perfil, enlaces);
  if (p.activa && fs.existsSync(path.join(raiz, '.git')) && p.nombre !== 'produccion') {
    throw new Error('generarTienda: un perfil que no es el de producción no se escribe en el repositorio; la demo se arma en su copia');
  }
  for (const [es, o] of Object.entries(PAGINAS)) {
    for (const archivo of [es, o.en, o.pt].filter(Boolean)) if (!fs.existsSync(path.join(raiz, archivo))) throw new Error(`tienda-mapa.mjs: ${archivo} no existe`);
  }
  const escritos = [];
  for (const archivo of paginasDe(raiz)) {
    const abs = path.join(raiz, archivo);
    const antes = fs.readFileSync(abs, 'utf8');
    const despues = transformarPagina(antes, archivo, p);
    if (despues !== antes) { fs.writeFileSync(abs, despues); escritos.push(archivo); }
  }
  return { escritos };
}

/* ---- CLI ----------------------------------------------------------------- */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const valor = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
  const raiz = valor('raiz');
  if (!raiz) { console.error('uso: node scripts/tienda.mjs --raiz <copia del sitio> [--sitio <origen>] [--app <origen>] [--clave <clave>]'); process.exit(2); }
  const perfil = { nombre: 'local', tienda: { activa: true, empresa: 'lausof', sitio: valor('sitio') || null, app: valor('app') || null, clave: valor('clave') || null } };
  const { escritos } = await generarTienda({ raiz: path.resolve(raiz), perfil });
  console.log(`vitrina aplicada: ${escritos.length} páginas`);
}
