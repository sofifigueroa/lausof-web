/* =============================================================================
   VERSIONES DE LAS HOJAS Y LOS SCRIPTS — node scripts/versiones.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Cada <link href="/css/….css?v=…"> y <script src="/js/….js?v=…"> de las
   páginas lleva, como ?v=, los primeros 10 caracteres del SHA-256 del
   archivo. _headers sirve /css/* y /js/* como immutable por un año, así que
   el ?v= es lo único que hace que un navegador baje la hoja nueva.

   Hasta el 08/11/2026 el número se subía a mano en cada página que cargaba el
   archivo (styles.css ?v=30 en 82 páginas): el merge b7b276e tuvo 40
   conflictos, todos de versión de hoja, y galeria.css estaba como v1 en una
   página y v2 en otra (rondas-2026-11-07/2-estado-actual.md, W7). Con el
   hash, el ?v= cambia solo cuando cambia el archivo, sale igual en todas las
   páginas y dos ramas que no tocan la hoja no chocan.

   Las zonas GENERADO:TIENDA son de la vitrina (tienda-v2-0611:scripts/
   tienda.mjs): este script no entra en ellas. La vitrina puede pedir el
   mismo valor con `version('css/tienda.css')`.

     node scripts/versiones.mjs              reescribe los ?v= que no coincidan
     node scripts/versiones.mjs --comprobar  no escribe nada; sale con 1 si alguno no coincide
   ============================================================================= */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';

export const LARGO = 10;

// Una referencia a una hoja o un script propio: (href|src)="/css/x.css?v=…" o "/js/x.js?v=…".
const REFERENCIA = /\b(href|src)="\/((?:css|js)\/[a-z0-9-]+\.(?:css|js))(?:\?v=([^"]*))?"/g;
const TIENDA = /<!-- GENERADO:TIENDA [\s\S]*?<!-- \/GENERADO:TIENDA -->/g;

const cache = new Map();

/** El ?v= de un archivo del sitio (ruta relativa a la raíz, p. ej. 'css/styles.css'). */
export function version(ruta, base = raiz) {
  const clave = `${base}|${ruta}`;
  if (!cache.has(clave)) {
    const archivo = join(base, ruta);
    if (!existsSync(archivo)) throw new Error(`versiones: ${ruta} no existe`);
    cache.set(clave, createHash('sha256').update(readFileSync(archivo)).digest('hex').slice(0, LARGO));
  }
  return cache.get(clave);
}

/** Separa el HTML en tramos que este script escribe y zonas de la vitrina, que no toca. */
function tramos(html) {
  const lista = [];
  let desde = 0;
  for (const m of html.matchAll(TIENDA)) {
    lista.push({ texto: html.slice(desde, m.index), propio: true });
    lista.push({ texto: m[0], propio: false });
    desde = m.index + m[0].length;
  }
  lista.push({ texto: html.slice(desde), propio: true });
  return lista;
}

/** La página con cada ?v= igual al hash de su archivo. Pura salvo por leer los archivos versionados. */
export function conVersiones(html, base = raiz) {
  return tramos(html).map(({ texto, propio }) => (!propio ? texto
    : texto.replace(REFERENCIA, (_, atributo, ruta) => `${atributo}="/${ruta}?v=${version(ruta, base)}"`))).join('');
}

/** Las referencias de una página: [{ ruta, v }] (fuera de las zonas de la vitrina). */
export function referenciasDe(html) {
  return tramos(html).filter((t) => t.propio)
    .flatMap(({ texto }) => [...texto.matchAll(REFERENCIA)].map((m) => ({ ruta: m[2], v: m[3] ?? null })));
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  const problemas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    let nuevo;
    try { nuevo = conVersiones(actual); } catch (e) { problemas.push(`${pagina}: ${e.message}`); continue; }
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    for (const p of cambiadas) console.log(`versiones sin regenerar: ${p}`);
    process.exit(cambiadas.length || problemas.length ? 1 : 0);
  }
  console.log(`versiones: ${cambiadas.length} página(s) reescrita(s).`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
