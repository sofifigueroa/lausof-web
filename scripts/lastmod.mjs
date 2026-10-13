/* =============================================================================
   LASTMOD DESDE GIT — node scripts/lastmod.mjs
   -----------------------------------------------------------------------------
   El <lastmod> de cada URL de sitemap.xml es la fecha del último commit que
   tocó su archivo, en hora de Salta. Se corre ANTES de cada commit que cambie
   páginas (y deja sitemap.xml listo para entrar en ese mismo commit):

     node scripts/lastmod.mjs              reescribe los <lastmod> de sitemap.xml
     node scripts/lastmod.mjs --comprobar  no escribe nada; sale con 1 si alguno no coincide

   Reglas:
     · Archivo con cambios sin commitear (o sin commit todavía): la fecha es
       HOY, porque va a entrar en el commit que se está por hacer.
     · Archivo limpio: la fecha de AUTOR del último commit que lo tocó
       (`git log -1 --format=%aI`). La de autor y no la de commit porque un
       rebase o un cherry-pick reescriben la de commit y dejan la de autor:
       el integrador rebasea ramas y el lastmod no tiene que moverse por eso.
     · Cuenta el archivo .html de la página, no sus fotos ni su hoja de
       estilos: es lo que el buscador vuelve a bajar.

   Qué NO toca: el "dateModified" del JSON-LD y la línea visible
   "Actualizado el …" de las páginas. Esa es la fecha en que se revisó el
   CONTENIDO ("Distancias, tiempos y estado de rutas consultados ese día") y
   la escribe quien lo revisó; moverla por un cambio de marcado la volvería
   falsa. Los tests piden que esas dos coincidan entre sí y que el lastmod no
   sea anterior a ellas.

   Por qué git y no a mano (13/10/2026): había páginas cambiadas el 10/10 con
   lastmod de agosto (producciones.html con 2026-08-26). Google usa el
   lastmod sólo "if it's consistently and verifiably (for example by
   comparing to the last modification of the page) accurate"
   (developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap,
   actualizada el 08/07/2026, leída el 13/10/2026). scripts/indexnow.mjs elige
   qué avisarle a Bing con estos mismos <lastmod>, y por eso se niega a enviar
   si este --comprobar falla.

   Sin dependencias: Node 18+ y git.
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = 'https://www.lausof.com/';
const ZONA = 'America/Argentina/Salta';

// AAAA-MM-DD de un instante, en hora de Salta.
export function fechaSalta(instante) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(instante).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

// https://www.lausof.com/en/ → en/index.html
export function archivoDeLoc(loc) {
  if (!loc.startsWith(ORIGEN)) throw new Error(`URL de otro sitio en el sitemap: ${loc}`);
  let ruta = loc.slice(ORIGEN.length);
  if (ruta === '' || ruta.endsWith('/')) ruta += 'index.html';
  return ruta;
}

// en/index.html → https://www.lausof.com/en/
export function locDeArchivo(archivo) {
  return ORIGEN + archivo.replace(/(^|\/)index\.html$/, '$1');
}

const git = (args) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8' }).trim();

export function hayGit() {
  try { return git(['rev-parse', '--is-inside-work-tree']) === 'true'; } catch { return false; }
}

// Fecha de git del archivo: HOY si tiene cambios sin commitear o no tiene
// historia; si no, la de autor del último commit que lo tocó.
export function fechaGit(archivo, hoy = fechaSalta(new Date())) {
  if (git(['status', '--porcelain', '--', archivo]) !== '') return hoy;
  const iso = git(['log', '-1', '--format=%aI', '--', archivo]);
  return iso ? fechaSalta(new Date(iso)) : hoy;
}

// El sitemap con el <lastmod> que devuelve fechaDe(loc) en cada <url>. Pura.
export function alinearSitemap(xml, fechaDe) {
  return xml.replace(/<url>[\s\S]*?<\/url>/g, (bloque) => {
    const loc = bloque.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)[1];
    const fecha = fechaDe(loc);
    return /<lastmod>/.test(bloque)
      ? bloque.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${fecha}</lastmod>`)
      : bloque.replace(/(\n\s*)<\/url>$/, `$1  <lastmod>${fecha}</lastmod>$1</url>`);
  });
}

// El sitemap.xml como tiene que quedar según git.
export function sitemapSegunGit(xml = fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8')) {
  const hoy = fechaSalta(new Date());
  return alinearSitemap(xml, (loc) => fechaGit(archivoDeLoc(loc), hoy));
}

// URLs cuyo <lastmod> no coincide con git: [{ loc, tiene, corresponde }]
export function desactualizadas(xml = fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8')) {
  const hoy = fechaSalta(new Date());
  const lista = [];
  for (const [bloque] of xml.matchAll(/<url>[\s\S]*?<\/url>/g)) {
    const loc = bloque.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)[1];
    const tiene = bloque.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1] ?? null;
    const corresponde = fechaGit(archivoDeLoc(loc), hoy);
    if (tiene !== corresponde) lista.push({ loc, tiene, corresponde });
  }
  return lista;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  if (!hayGit()) {
    console.error('lastmod: esto no es un repositorio git; las fechas salen de git.');
    process.exit(2);
  }
  const ruta = path.join(raiz, 'sitemap.xml');
  const xml = fs.readFileSync(ruta, 'utf8');
  const viejas = desactualizadas(xml);
  if (comprobar) {
    for (const v of viejas) console.log(`desactualizado ${v.loc}: dice ${v.tiene}, corresponde ${v.corresponde}`);
    process.exit(viejas.length ? 1 : 0);
  }
  if (viejas.length) fs.writeFileSync(ruta, sitemapSegunGit(xml));
  for (const v of viejas) console.log(`${v.loc}: ${v.tiene} → ${v.corresponde}`);
  console.log(`lastmod: ${viejas.length} URL(s) actualizadas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
