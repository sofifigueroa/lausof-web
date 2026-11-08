/* =============================================================================
   ENCABEZADO Y MIGAS — node scripts/encabezado.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Dos piezas de arriba de cada página que hasta el 08/11/2026 estaban
   escritas a mano y se habían ido separando (rondas-2026-11-07/
   2-estado-actual.md, W1, W4):

     MIGAS      la miga de pan (nav.crumbs), una sola forma en las 80 páginas,
                desde scripts/encabezado-datos.mjs. Reemplaza las «migas»
                que las 12 páginas de eventos tenían dentro del encabezado y
                se suma a las 7 páginas que no tenían ninguna. Va justo
                después del encabezado (en el hub de empresas, antes: así lo
                pide su diseño).
     encabezado el molde de section.page-head: foto, kicker, h1, bajada y
                botones, siempre en el mismo orden y con las mismas clases
                (y el del hub de empresas, con la foto en su columna). El
                molde es de este script; lo que dice cada encabezado sigue en
                la página, porque sus enlaces y sus fotos ya tienen dueño:
                los WhatsApp y los correos los escribe scripts/prefill.mjs,
                que no entra a las zonas GENERADO (prefill.mjs, ZONA_GENERADA),
                y las fotos scripts/imagenes.mjs. Si un encabezado trae algo
                que no entra en el molde, --comprobar lo dice y no lo toca.
                Los comentarios que había adentro quedan arriba de la sección.

   El contrato de la vitrina se respeta (tienda-v2-0611:scripts/tienda.mjs,
   ponerZonas y tituloDe): `<section class="page-head"` y `<div class="ctas">`
   quedan exactos, una vez, con .ctas dentro del encabezado y antes de su
   </section>, sin secciones anidadas; las zonas TIENDA «cabeza» (antes de
   .ctas) e «ir» (dentro de .ctas) se conservan donde están; la página actual
   de la miga es <li aria-current="page">texto</li>.

     node scripts/encabezado.mjs              reescribe lo que haya cambiado
     node scripts/encabezado.mjs --comprobar  no escribe nada; sale con 1 si algo no coincide
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { MIGAS, NODOS, INICIO, ROTULO } from './encabezado-datos.mjs';

const SITIO = 'https://www.lausof.com';
const abre = '<!-- GENERADO:MIGAS — no editar a mano: editar scripts/encabezado-datos.mjs y correr `node scripts/encabezado.mjs` -->';
const cierra = '<!-- /GENERADO:MIGAS -->';
const ZONA = /([ \t]*)<!-- GENERADO:MIGAS [\s\S]*?<!-- \/GENERADO:MIGAS -->/;
const NAV_CRUMBS = /([ \t]*)<nav class="crumbs[^"]*"[^>]*>[\s\S]*?<\/nav>/;
const NAV_MIGAS = /\n[ \t]*<nav class="migas"[^>]*>[\s\S]*?<\/nav>/;
const SECCION = /([ \t]*)<section class="page-head([^"]*)"([^>]*)>([\s\S]*?)<\/section>/;
const TIENDA = /<!-- GENERADO:TIENDA ([a-z0-9-]+) -->[\s\S]*?<!-- \/GENERADO:TIENDA -->/g;

const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const desescapar = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const idiomaDe = (p) => (p.startsWith('en/') ? 'en' : p.startsWith('pt/') ? 'pt' : 'es');
const paginaDe = (href) => href.replace(/^\//, '').replace(/#.*$/, '') || null;

/* ---- migas ----------------------------------------------------------------- */

/** El nombre y el padre de un nivel intermedio (un href) en un idioma. */
function nivel(href, idioma) {
  const nodo = NODOS[idioma]?.[href];
  if (nodo) return nodo;
  const propia = MIGAS[paginaDe(href)];
  if (!propia || href.includes('#')) throw new Error(`miga: el nivel ${href} (${idioma}) no está en MIGAS ni en NODOS (scripts/encabezado-datos.mjs)`);
  return propia;
}

/** Los niveles de la miga de una página: [{ nombre, href }], el último sin href (la página actual). */
export function rastro(pagina) {
  const propia = MIGAS[pagina];
  if (!propia) return null;
  const idioma = idiomaDe(pagina);
  const niveles = [{ nombre: propia.nombre }];
  const vistos = new Set();
  for (let padre = propia.padre; padre; padre = nivel(padre, idioma).padre) {
    if (vistos.has(padre)) throw new Error(`${pagina}: la miga da una vuelta en ${padre}`);
    vistos.add(padre);
    niveles.unshift({ nombre: nivel(padre, idioma).nombre, href: padre });
  }
  niveles.unshift({ ...INICIO[idioma] });
  return niveles;
}

/** La nav de la miga, en líneas sin sangría. */
export function migas(pagina) {
  const niveles = rastro(pagina);
  if (!niveles) return null;
  const clase = ['crumbs', MIGAS[pagina].clase, 'wrap'].filter(Boolean).join(' ');
  return [
    `<nav class="${clase}" aria-label="${ROTULO[idiomaDe(pagina)]}">`,
    '  <ol>',
    ...niveles.map((n) => (n.href ? `    <li><a href="${n.href}">${escapar(n.nombre)}</a></li>` : `    <li aria-current="page">${escapar(n.nombre)}</li>`)),
    '  </ol>',
    '</nav>',
  ];
}

/** El BreadcrumbList del JSON-LD de la página, si tiene: [{ nombre, url }]. */
export function migasDelJsonLd(html) {
  for (const [, bloque] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let datos;
    try { datos = JSON.parse(bloque); } catch { continue; }
    const nodos = Array.isArray(datos) ? datos : datos['@graph'] || [datos];
    const lista = nodos.find((n) => n && n['@type'] === 'BreadcrumbList');
    if (lista) return lista.itemListElement.map((i) => ({ nombre: i.name, url: i.item }));
  }
  return null;
}

/* ---- el molde del encabezado ------------------------------------------------ */

/**
 * Las partes de un encabezado: foto, kicker, h1, bajada, botones, zonas de la
 * vitrina y comentarios. Lanza un error si queda algo que no entra en el molde.
 */
export function partesDe(interior, pagina, hub) {
  let resto = interior;
  const sacar = (re) => {
    const m = resto.match(re);
    if (!m) return null;
    resto = resto.slice(0, m.index) + resto.slice(m.index + m[0].length);
    return m;
  };
  const tienda = {};
  for (const [todo, nombre] of interior.matchAll(TIENDA)) tienda[nombre] = todo;
  resto = resto.replace(TIENDA, '');
  const comentarios = [];
  resto = resto.replace(/<!--[\s\S]*?-->/g, (c) => { comentarios.push(c); return ''; });
  const foto = sacar(/<div class="page-head-photo([^"]*)" role="presentation">\s*(<picture>[\s\S]*?<\/picture>)\s*<\/div>/);
  const kicker = sacar(/<p class="kicker on-dark">([\s\S]*?)<\/p>/);
  sacar(/<nav class="migas"[^>]*>[\s\S]*?<\/nav>/);
  const h1 = sacar(/<h1([^>]*)>([\s\S]*?)<\/h1>/);
  const lead = sacar(/<p class="lead">([\s\S]*?)<\/p>/);
  const ctas = sacar(/<div class="ctas">([\s\S]*?)<\/div>/);
  if (!h1) throw new Error(`${pagina}: el encabezado no tiene <h1>`);
  if (!ctas) throw new Error(`${pagina}: el encabezado no tiene <div class="ctas"> (la vitrina pone ahí su botón)`);
  const botones = [...ctas[1].matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((m) => m[0]);
  const sobra = ctas[1].replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '').trim();
  if (sobra) throw new Error(`${pagina}: .ctas tiene algo que no es un botón: ${sobra.slice(0, 80)}`);
  // Lo que queda tienen que ser sólo los envoltorios del molde.
  const envoltorios = hub
    ? /<div class="wrap hub-head-grid">|<div>|<\/div>/g
    : /<div class="wrap page-head-inner">|<\/div>/g;
  const extra = resto.replace(envoltorios, '').trim();
  if (extra) throw new Error(`${pagina}: el encabezado tiene algo que no entra en el molde: ${extra.slice(0, 120)}`);
  return {
    foto: foto && { clase: foto[1].trim(), picture: foto[2] },
    kicker: kicker && kicker[1],
    h1: { attrs: h1[1], texto: h1[2] },
    lead: lead && lead[1],
    botones,
    tienda,
    comentarios,
  };
}

/** El encabezado armado con el molde, en líneas sin sangría. */
export function molde({ foto, kicker, h1, lead, botones, tienda }, clase, attrs, hub) {
  const fotoHtml = foto ? `<div class="page-head-photo${foto.clase ? ` ${foto.clase}` : ''}" role="presentation">${foto.picture}</div>` : null;
  const texto = [
    ...(kicker !== null && kicker !== undefined ? [`<p class="kicker on-dark">${kicker}</p>`] : []),
    `<h1${h1.attrs}>${h1.texto}</h1>`,
    ...(lead !== null && lead !== undefined ? [`<p class="lead">${lead}</p>`] : []),
    ...(tienda.cabeza ? [tienda.cabeza] : []),
    `<div class="ctas">${tienda.ir || ''}`,
    ...botones.map((b) => `  ${b}`),
    '</div>',
  ];
  const otras = Object.keys(tienda).filter((n) => n !== 'cabeza' && n !== 'ir');
  if (otras.length) throw new Error(`zonas TIENDA inesperadas en el encabezado: ${otras.join(', ')}`);
  const cuerpo = hub
    ? ['<div class="wrap hub-head-grid">', '  <div>', ...texto.map((l) => `    ${l}`), '  </div>', ...(fotoHtml ? [`  ${fotoHtml}`] : []), '</div>']
    : [...(fotoHtml ? [fotoHtml] : []), '<div class="wrap page-head-inner">', ...texto.map((l) => `  ${l}`), '</div>'];
  return [`<section class="page-head${clase}"${attrs}>`, ...cuerpo.map((l) => `  ${l}`), '</section>'];
}

const sangrar = (lineas, s) => lineas.map((l) => (l ? s + l : l)).join('\n');

/** La página con el encabezado en su molde. Pura e idempotente. */
export function conEncabezado(html, pagina) {
  const m = html.match(SECCION);
  if (!m) return html;
  const [todo, sangria, clase, attrs, interior] = m;
  const hub = /\bhub-head\b/.test(clase);
  const partes = partesDe(interior, pagina, hub);
  const notas = partes.comentarios.map((c) => sangria + c.replace(/\n[ \t]*/g, `\n${sangria}     `)).join('\n');
  const nuevo = (notas ? `${notas}\n` : '') + sangrar(molde(partes, clase, attrs, hub), sangria);
  return html.slice(0, m.index) + nuevo + html.slice(m.index + todo.length);
}

/** La página con la miga generada en su lugar. Pura e idempotente. */
export function conMigas(html, pagina) {
  const lineas = migas(pagina);
  if (!lineas) return html;
  // La vitrina pone su bloque de precios justo después de la miga
  // (tienda.mjs, lugarDelBloque): si quedó dentro de la zona, se conserva.
  const poner = (sangria, tienda = []) => [sangria + abre, sangrar(lineas, sangria), ...tienda.map((z) => sangria + z), sangria + cierra].join('\n');
  let out = html.replace(NAV_MIGAS, '');
  const zona = out.match(ZONA) || out.match(NAV_CRUMBS);
  if (zona) return out.slice(0, zona.index) + poner(zona[1], zona[0].match(TIENDA) || []) + out.slice(zona.index + zona[0].length);
  const seccion = out.match(SECCION);
  if (!seccion) throw new Error(`${pagina}: tiene miga en encabezado-datos.mjs y no tiene ni miga ni encabezado donde ponerla`);
  const fin = seccion.index + seccion[0].length;
  return `${out.slice(0, fin)}\n\n${poner(seccion[1])}${out.slice(fin)}`;
}

/** Lo que no cierra en una página ya generada (lo usa también tests/encabezado.test.js). */
export function problemasDe(html, pagina) {
  const p = [];
  const tieneEncabezado = SECCION.test(html);
  if (tieneEncabezado && !MIGAS[pagina]) p.push(`${pagina}: tiene encabezado y no tiene miga en scripts/encabezado-datos.mjs`);
  if (/<nav class="migas"/.test(html)) p.push(`${pagina}: quedan migas con la forma vieja (nav.migas)`);
  if (/<nav class="crumbs/.test(html) && !ZONA.test(html)) p.push(`${pagina}: miga fuera de la zona MIGAS`);
  const ld = migasDelJsonLd(html);
  const niveles = rastro(pagina);
  if (ld && niveles) {
    const esperado = niveles.map((n, i) => ({ nombre: n.nombre, url: i === niveles.length - 1 ? null : SITIO + n.href }));
    const igual = ld.length === esperado.length && ld.every((x, i) => x.nombre === esperado[i].nombre
      && (esperado[i].url === null || x.url === esperado[i].url));
    if (!igual) p.push(`${pagina}: el BreadcrumbList del JSON-LD (${ld.map((x) => x.nombre).join(' › ')}) no dice lo mismo que la miga (${esperado.map((x) => x.nombre).join(' › ')})`);
  }
  return p;
}

export const conTodo = (html, pagina) => conMigas(conEncabezado(html, pagina), pagina);

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  const problemas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    let nuevo;
    try { nuevo = conTodo(actual, pagina); } catch (e) { problemas.push(e.message); continue; }
    problemas.push(...problemasDe(nuevo, pagina));
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    for (const p of cambiadas) console.log(`encabezado o miga sin regenerar: ${p}`);
    process.exit(cambiadas.length || problemas.length ? 1 : 0);
  }
  console.log(`encabezado: ${cambiadas.length} página(s) reescrita(s).`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}

export { desescapar };
