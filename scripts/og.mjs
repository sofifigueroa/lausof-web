/* =============================================================================
   LA IMAGEN PARA COMPARTIR — node scripts/og.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Casi todas las páginas de turismo, las tres portadas y algunas de empresas
   (48 de 80 hasta el 08/11/2026) comparten la misma og:image: la vista previa
   que sale cuando alguien pega el enlace en WhatsApp o en una red. Hasta esa
   fecha era og-portada.jpg, con el camión rotulado «AUXILIO» y la grúa
   vendida (rondas-2026-11-07/2-estado-actual.md, W13), y su og:image:alt
   estaba escrito de 9 maneras.

   Este script deja, en cada página que usa la imagen compartida (o la
   retirada), el mismo archivo y el mismo texto alternativo por idioma, y
   cambia la URL retirada también en el JSON-LD de la portada:

     node scripts/og.mjs              reescribe lo que falte o haya cambiado
     node scripts/og.mjs --comprobar  no escribe nada; sale con 1 si algo no coincide

   La foto es real (biblioteca F0058, combi-sprinter-dique-lausof-v1, patente
   difuminada, aprobada el 06/11/2026), recortada a 1200×630 en JPEG: los
   scrapers de WhatsApp y Facebook manejan mal el WebP (tests/seo.test.js).
   Una foto que cambia, cambia de nombre (README, «Fotos responsive»): el
   archivo nuevo no pisó og-portada.jpg, que se borró del repo el 09/11/2026
   para que la exportación no la siga publicando (tests/og.test.js).

   Las páginas con imagen propia (eventos, 4x4, minería, flota…) no se tocan.
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz, paginas } from './rutas-raiz.mjs';
import { idiomaDe } from './prefill.mjs';

const BASE = 'https://www.lausof.com/assets/';
export const OG_COMPARTIDA = {
  archivo: 'og-combi-dique.jpg',
  alt: {
    es: 'Combi de Lausof junto al dique, entre cerros verdes',
    en: 'Lausof minibus by a reservoir, with green hills behind',
    pt: 'Van da Lausof junto à represa, entre morros verdes',
  },
};
// Imágenes compartidas que ya no van en ninguna página (ni están en assets/).
export const OG_RETIRADAS = ['og-portada.jpg'];

const URL_ACTUAL = BASE + OG_COMPARTIDA.archivo;
const URLS_RETIRADAS = OG_RETIRADAS.map((a) => BASE + a);
const META_IMAGEN = /<meta property="og:image" content="([^"]+)">/;
const META_ALT = /<meta property="og:image:alt" content="[^"]*">/;
const sinComentarios = (html) => html.replace(/<!--[\s\S]*?-->/g, '');

/** ¿La página usa la imagen compartida (o la retirada)? */
export function usaCompartida(html) {
  const m = html.match(META_IMAGEN);
  return Boolean(m) && (m[1] === URL_ACTUAL || URLS_RETIRADAS.includes(m[1]));
}

/** La página con la imagen compartida al día. Pura e idempotente. */
export function conOg(html, pagina) {
  if (!usaCompartida(html)) return html;
  const alt = OG_COMPARTIDA.alt[idiomaDe(pagina)];
  let out = html.replace(META_IMAGEN, `<meta property="og:image" content="${URL_ACTUAL}">`);
  out = META_ALT.test(out)
    ? out.replace(META_ALT, `<meta property="og:image:alt" content="${alt}">`)
    : out.replace(/(<meta property="og:image:height" content="630">)/, `$1\n  <meta property="og:image:alt" content="${alt}">`);
  // El JSON-LD (la portada lista la imagen en «image»).
  for (const vieja of URLS_RETIRADAS) out = out.split(`"${vieja}"`).join(`"${URL_ACTUAL}"`);
  return out;
}

/** Lo que no cierra en una página ya escrita (lo usa también tests/og.test.js). */
export function problemasDe(html, pagina) {
  const p = [];
  const visible = sinComentarios(html);
  for (const vieja of OG_RETIRADAS) {
    if (visible.includes(`/assets/${vieja}`)) p.push(`${pagina}: todavía usa ${vieja}`);
  }
  if (usaCompartida(html)) {
    const alt = OG_COMPARTIDA.alt[idiomaDe(pagina)];
    if (!html.includes(`<meta property="og:image:alt" content="${alt}">`)) p.push(`${pagina}: og:image:alt distinto del de ${OG_COMPARTIDA.archivo}`);
  }
  return p;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  const problemas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = conOg(actual, pagina);
    problemas.push(...problemasDe(nuevo, pagina));
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    for (const p of cambiadas) console.log(`og sin regenerar: ${p}`);
    process.exit(cambiadas.length || problemas.length ? 1 : 0);
  }
  console.log(`og: ${cambiadas.length} página(s) reescrita(s).`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
