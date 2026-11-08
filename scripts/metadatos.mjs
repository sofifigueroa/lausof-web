/* =============================================================================
   TÍTULO Y DESCRIPCIÓN DE CADA PÁGINA — node scripts/metadatos.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Escribe, desde scripts/metadatos-datos.mjs (la única fuente), en cada una
   de las 82 páginas:
     1. el <title>;
     2. la <meta name="description">;
     3. sus copias para compartir, og:title y og:description (si la página
        las tiene: las 404 y los avisos de privacidad no las llevan);
     4. el name y la description del nodo WebPage del JSON-LD, para que el
        marcado diga lo mismo que la página (1b C5).
   No toca nada más del <head> ni del cuerpo, y no entra a las zonas
   GENERADO:EMPRESA ni TIENDA.

     node scripts/metadatos.mjs              escribe las páginas
     node scripts/metadatos.mjs --comprobar  no escribe; sale con 1 si una
                                             página no está al día, si un dato
                                             pasa del límite o si sobra o
                                             falta una página en los datos

   Ronda 9 de lausof.com (08/11/2026). README: «Títulos y descripciones».
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { METADATOS, LIMITES, LARGOS } from './metadatos-datos.mjs';

const TITULO = /<title>[^<]*<\/title>/;
const DESC = /<meta name="description" content="[^"]*">/;
const OG_TITULO = /<meta property="og:title" content="[^"]*">/;
const OG_DESC = /<meta property="og:description" content="[^"]*">/;
const LD = /(<script type="application\/ld\+json"(?![^>]*id="empresa")[^>]*>)([\s\S]*?)(<\/script>)/g;

const texto = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const atributo = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const leer = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** El largo que cuenta: el del texto escrito en la página (con sus entidades). */
export const largo = (s) => texto(s).length;

const esWebPage = (n) => n && typeof n === 'object' && [].concat(n['@type']).includes('WebPage');
const nodosDe = (dato) => (Array.isArray(dato) ? dato : dato && dato['@graph'] ? dato['@graph'] : [dato]);

/** El JSON-LD de un bloque con el WebPage al día. Cambia sólo esas dos cadenas. */
function conWebPage(crudo, pagina, { titulo, descripcion }) {
  const nodos = nodosDe(JSON.parse(crudo)).filter(esWebPage);
  if (!nodos.length) return crudo;
  if (nodos.length > 1) throw new Error(`${pagina}: más de un WebPage en un bloque JSON-LD`);
  let out = crudo;
  for (const [clave, nuevo] of [['name', titulo], ['description', descripcion]]) {
    const viejo = nodos[0][clave];
    if (viejo === undefined || viejo === nuevo) continue;
    const patron = new RegExp(`("${clave}"\\s*:\\s*)${JSON.stringify(viejo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    const hallados = out.match(patron) || [];
    if (hallados.length !== 1) throw new Error(`${pagina}: el ${clave} del WebPage aparece ${hallados.length} veces en el JSON-LD`);
    out = out.replace(patron, (_, a) => a + JSON.stringify(nuevo));
  }
  const despues = nodosDe(JSON.parse(out)).filter(esWebPage)[0];
  if ((despues.name !== undefined && despues.name !== titulo) || (despues.description !== undefined && despues.description !== descripcion)) {
    throw new Error(`${pagina}: el WebPage no quedó al día`);
  }
  return out;
}

/** La página con su título, descripción y copias al día. Pura e idempotente. */
export function conMetadatos(html, pagina, dato = METADATOS[pagina]) {
  if (!dato) throw new Error(`${pagina}: no está en scripts/metadatos-datos.mjs`);
  for (const [nombre, re] of [['<title>', TITULO], ['meta description', DESC]]) {
    if ((html.match(new RegExp(re.source, 'g')) || []).length !== 1) throw new Error(`${pagina}: necesita un solo ${nombre}`);
  }
  let out = html
    .replace(TITULO, `<title>${texto(dato.titulo)}</title>`)
    .replace(DESC, `<meta name="description" content="${atributo(dato.descripcion)}">`)
    .replace(OG_TITULO, `<meta property="og:title" content="${atributo(dato.titulo)}">`)
    .replace(OG_DESC, `<meta property="og:description" content="${atributo(dato.descripcion)}">`);
  out = out.replace(LD, (_, abre, crudo, cierra) => abre + conWebPage(crudo, pagina, dato) + cierra);
  return out;
}

/** Lo que no cierra en los datos (largos y páginas). Pura; la usa también el test. */
export function problemasDeDatos(datos = METADATOS, lista = paginas(), largos = LARGOS) {
  const p = [];
  for (const pagina of lista) if (!datos[pagina]) p.push(`${pagina}: falta en scripts/metadatos-datos.mjs`);
  for (const pagina of Object.keys(datos)) if (!lista.includes(pagina)) p.push(`${pagina}: está en los datos y no es una página`);
  for (const [pagina, { titulo, descripcion }] of Object.entries(datos)) {
    if (!titulo || !descripcion) { p.push(`${pagina}: título o descripción vacíos`); continue; }
    if (largo(titulo) > LIMITES.titulo && !largos[pagina]) p.push(`${pagina}: el título mide ${largo(titulo)} (límite ${LIMITES.titulo})`);
    if (largo(descripcion) > LIMITES.descripcion) p.push(`${pagina}: la descripción mide ${largo(descripcion)} (límite ${LIMITES.descripcion})`);
    if (/\$|\bARS\b|\bUSD\b|US\$|desde \$/i.test(`${titulo} ${descripcion}`)) p.push(`${pagina}: título o descripción con un precio`);
    if (/Cotizá por WhatsApp/.test(descripcion)) p.push(`${pagina}: la descripción repite el botón`);
  }
  for (const pagina of Object.keys(largos)) {
    if (datos[pagina] && largo(datos[pagina].titulo) <= LIMITES.titulo) p.push(`${pagina}: está en LARGOS y ya no hace falta`);
  }
  return p;
}

/** Lo que no cierra en una página ya escrita. Pura; la usa también el test. */
export function problemasDe(html, pagina, dato = METADATOS[pagina]) {
  const p = [];
  if (!dato) return [`${pagina}: no está en scripts/metadatos-datos.mjs`];
  const t = html.match(/<title>([^<]*)<\/title>/);
  const d = html.match(/<meta name="description" content="([^"]*)">/);
  if (!t || leer(t[1]) !== dato.titulo) p.push(`${pagina}: el <title> no es el de los datos`);
  if (!d || leer(d[1]) !== dato.descripcion) p.push(`${pagina}: la meta description no es la de los datos`);
  const ogt = html.match(/<meta property="og:title" content="([^"]*)">/);
  const ogd = html.match(/<meta property="og:description" content="([^"]*)">/);
  if (ogt && leer(ogt[1]) !== dato.titulo) p.push(`${pagina}: og:title distinto del <title>`);
  if (ogd && leer(ogd[1]) !== dato.descripcion) p.push(`${pagina}: og:description distinta de la meta description`);
  for (const m of html.matchAll(LD)) {
    for (const n of nodosDe(JSON.parse(m[2])).filter(esWebPage)) {
      if (n.name !== undefined && n.name !== dato.titulo) p.push(`${pagina}: el name del WebPage no es el <title>`);
      if (n.description !== undefined && n.description !== dato.descripcion) p.push(`${pagina}: la description del WebPage no es la meta description`);
    }
  }
  return p;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const problemas = problemasDeDatos();
  const cambiadas = [];
  for (const pagina of paginas()) {
    if (!METADATOS[pagina]) continue;
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = conMetadatos(actual, pagina);
    problemas.push(...problemasDe(nuevo, pagina));
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    for (const p of cambiadas) console.log(`metadatos sin regenerar: ${p}`);
    process.exit(cambiadas.length || problemas.length ? 1 : 0);
  }
  console.log(`metadatos: ${cambiadas.length} página(s) reescrita(s).`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
