/* =============================================================================
   INDEXNOW — avisarle a Bing (y a los otros buscadores IndexNow) qué cambió
   -----------------------------------------------------------------------------
   Se corre DESPUÉS de cada deploy a producción, desde la carpeta del sitio:

     node scripts/indexnow.mjs --desde <sha del deploy anterior>   (lo normal)
     node scripts/indexnow.mjs --desde 2026-10-10                  (por lastmod)
     node scripts/indexnow.mjs --todas                             (las 54, una vez)
     node scripts/indexnow.mjs --desde <sha> --prueba              (no envía nada)

   Qué hace, siguiendo la documentación del protocolo (indexnow.org/documentation
   y bing.com/indexnow/getstarted, leídas el 10/10/2026):

     1. Lee sitemap.xml y elige las URLs que cambiaron:
          --desde <ref git>  las que son nuevas o cambiaron de <lastmod> respecto
                             del sitemap.xml de ese commit (git show ref:sitemap.xml).
          --desde AAAA-MM-DD las que tienen <lastmod> en esa fecha o después.
          --todas            todas. Bing pide avisar sólo lo que cambió desde que
                             se empezó a usar IndexNow: esto es para la primera
                             vez o para un sitio rehecho, no para cada deploy.
     2. Comprueba que el archivo de la clave esté publicado
        (https://www.lausof.com/<CLAVE>.txt, contenido = la clave). Si no está,
        corta antes de enviar: el buscador respondería 403.
     3. Manda un solo POST JSON a https://api.indexnow.org/indexnow con
        host, key, keyLocation y urlList (hasta 10.000 URLs por pedido). Ese
        endpoint comparte el aviso con todos los buscadores participantes
        (Bing, Yandex, Seznam, Naver, Yep...).
     4. 200 = recibido; 202 = recibido, validación de la clave pendiente.
        Cualquier otro código sale con error (400 formato, 403 clave, 422 URL de
        otro host, 429 demasiados pedidos: esperar y no reintentar en loop).

   La clave no es un secreto: es pública por diseño (el buscador la lee del
   archivo). Si alguna vez se cambia, se renombra el .txt de la raíz, se pone
   la nueva acá y se ajusta la regla de tests/seo.test.js que lo deja publicar.

   Sin dependencias: Node 18+ (fetch incluido).
   ============================================================================= */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const CLAVE = 'd1eb0835b80b7ebe76ad80c22dc86589';
export const HOST = 'www.lausof.com';
export const UBICACION_CLAVE = `https://${HOST}/${CLAVE}.txt`;
export const ENDPOINT = 'https://api.indexnow.org/indexnow';
export const MAX_POR_PEDIDO = 10000;

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// <url><loc>…</loc><lastmod>…</lastmod></url> → [{ loc, lastmod }]
export function leerSitemap(xml) {
  const urls = [];
  for (const bloque of xml.match(/<url>[\s\S]*?<\/url>/g) || []) {
    const loc = bloque.match(/<loc>\s*([^<\s]+)\s*<\/loc>/);
    if (!loc) continue;
    const lastmod = bloque.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/);
    urls.push({ loc: loc[1], lastmod: lastmod ? lastmod[1] : null });
  }
  return urls;
}

// Nuevas o con otro lastmod que en el sitemap anterior.
export function cambiadasContra(actual, anterior) {
  const antes = new Map(anterior.map((u) => [u.loc, u.lastmod]));
  return actual.filter((u) => !antes.has(u.loc) || antes.get(u.loc) !== u.lastmod)
    .map((u) => u.loc);
}

// lastmod >= fecha (AAAA-MM-DD; las fechas ISO se comparan como texto).
export function cambiadasDesde(actual, fecha) {
  return actual.filter((u) => u.lastmod && u.lastmod.slice(0, 10) >= fecha).map((u) => u.loc);
}

export function armarPedido(urls) {
  for (const u of urls) {
    if (new URL(u).host !== HOST) throw new Error(`URL de otro host: ${u}`);
  }
  if (urls.length > MAX_POR_PEDIDO) throw new Error(`más de ${MAX_POR_PEDIDO} URLs en un pedido`);
  return { host: HOST, key: CLAVE, keyLocation: UBICACION_CLAVE, urlList: urls };
}

export const respuestaOk = (estado) => estado === 200 || estado === 202;

function parsearArgs(argv) {
  const args = { prueba: argv.includes('--prueba'), todas: argv.includes('--todas'), desde: null };
  const i = argv.indexOf('--desde');
  if (i > -1) args.desde = argv[i + 1];
  if (!args.todas && !args.desde) {
    throw new Error('falta --desde <sha|AAAA-MM-DD> o --todas (ver el encabezado del script)');
  }
  return args;
}

async function main() {
  const args = parsearArgs(process.argv.slice(2));
  const actual = leerSitemap(fs.readFileSync(path.join(raiz, 'sitemap.xml'), 'utf8'));
  let urls;
  if (args.todas) {
    urls = actual.map((u) => u.loc);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(args.desde)) {
    urls = cambiadasDesde(actual, args.desde);
  } else {
    const xml = execFileSync('git', ['show', `${args.desde}:sitemap.xml`], { cwd: raiz, encoding: 'utf8' });
    urls = cambiadasContra(actual, leerSitemap(xml));
  }
  if (urls.length === 0) {
    console.log('IndexNow: ninguna URL del sitemap cambió; no se envía nada.');
    return;
  }
  const pedido = armarPedido(urls);
  console.log(`IndexNow: ${urls.length} URL(s)`);
  for (const u of urls) console.log(`  ${u}`);
  if (args.prueba) {
    console.log('--prueba: no se envió nada.');
    return;
  }

  const archivo = await fetch(UBICACION_CLAVE, { redirect: 'manual' });
  const contenido = archivo.status === 200 ? (await archivo.text()).trim() : '';
  if (contenido !== CLAVE) {
    throw new Error(`${UBICACION_CLAVE} respondió ${archivo.status} sin la clave: ¿está desplegado?`);
  }

  const respuesta = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(pedido),
  });
  const cuerpo = await respuesta.text();
  console.log(`IndexNow: HTTP ${respuesta.status}${cuerpo ? ` ${cuerpo.slice(0, 300)}` : ''}`);
  if (!respuestaOk(respuesta.status)) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`IndexNow: ${e.message}`);
    process.exitCode = 1;
  });
}
