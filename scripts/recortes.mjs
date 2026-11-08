/* =============================================================================
   RECORTES DE TELÉFONO DEL ENCABEZADO — node scripts/recortes.mjs
   -----------------------------------------------------------------------------
   En un teléfono la foto del encabezado (.page-head-photo, la LCP de cada
   página interna) va con object-fit:cover y queda limitada por el alto del
   encabezado: se ve sólo su franja central. Este script, desde
   scripts/recortes-datos.mjs (lo escribe scripts/recortes-medir.mjs):

     1. corta, al lado de cada foto, `foto-movil.webp`: la franja central, con
        todo el alto (mismos píxeles a la misma escala, menos bytes);
     2. le escribe al <img> del encabezado de cada página
          data-movil="…-movil.webp" data-movil-media="(max-width: 440px)"
          data-movil-sizes="…"   (cuánto mide el recorte en pantalla)
        y le saca esos atributos a la página que ya no lleva recorte.

   Después se corre `node scripts/imagenes.mjs`, que arma las variantes AVIF y
   WebP del recorte y los <source> del <picture>. Orden: recortes → imagenes.

     node scripts/recortes.mjs              # corta lo que falta y escribe las páginas
     node scripts/recortes.mjs --comprobar  # no escribe; sale con 1 si algo no está al día

   Un recorte que ya existe con otra medida no se pisa: el script corta con
   error y dice cuál. Si ese recorte ya se publicó, se le sube la versión en
   VERSIONES (recortes-datos.mjs): el nuevo se llama foto-movil-v2.webp… y el
   viejo sale con `git rm` junto con sus variantes, porque /assets/* se sirve
   un año como immutable. Si nunca se publicó, se borra a mano y se corta de
   nuevo (así nunca quedan variantes viejas de otro corte).
   Ronda 7 de lausof.com (08/11/2026). README: «Fotos responsive».
   ============================================================================= */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { raiz, archivoDe, medidasWebp, atributos } from './imagenes.mjs';
import { paginas } from './rutas-raiz.mjs';
import { MEDIA, RECORTES, VERSIONES } from './recortes-datos.mjs';

// El nombre del recorte: foto-movil.webp, o foto-movil-v2.webp… si VERSIONES
// dice que ese recorte ya se publicó con otra medida.
export const movilDe = (foto, versiones = VERSIONES) =>
  foto.replace(/\.webp$/, versiones[foto] ? `-movil-v${versiones[foto]}.webp` : '-movil.webp');
const ATRIBUTOS = ['data-movil', 'data-movil-media', 'data-movil-sizes'];

// Lo que cada página tiene que llevar: { pagina: { foto, movil, sizes } }.
export function pedidos(recortes = RECORTES) {
  const p = {};
  for (const r of recortes) {
    for (const [pagina, { sizes }] of Object.entries(r.paginas)) {
      if (p[pagina]) throw new Error(`${pagina} figura en dos recortes`);
      p[pagina] = { foto: r.foto, movil: movilDe(r.foto), sizes };
    }
  }
  return p;
}

// El <img> del encabezado: el primero dentro de <div class="page-head-photo".
const ENCABEZADO = /(<div class="page-head-photo"[^>]*>(?:(?!<\/div>)[\s\S])*?)(<img\s[^>]*>)/;

// Reescribe el <img> del encabezado de una página. Pura.
export function conRecorte(html, pagina, pedido) {
  const m = html.match(ENCABEZADO);
  if (!m) {
    if (pedido) throw new Error(`${pagina}: no tiene foto de encabezado (.page-head-photo) y figura en recortes-datos.mjs`);
    return html;
  }
  const img = m[2];
  const attrs = atributos(img).filter(([n]) => !ATRIBUTOS.includes(n));
  if (pedido) {
    const src = attrs.find(([n]) => n === 'src')?.[1];
    if (src !== pedido.foto) throw new Error(`${pagina}: la foto del encabezado es ${src}, no ${pedido.foto}; volver a medir (scripts/recortes-medir.mjs)`);
    // Van antes de alt, donde los tenía turismo desde el 13/10/2026.
    const i = attrs.findIndex(([n]) => n === 'alt');
    attrs.splice(i < 0 ? attrs.length : i, 0, ['data-movil', pedido.movil], ['data-movil-media', MEDIA], ['data-movil-sizes', pedido.sizes]);
  }
  const nuevo = `<img ${attrs.map(([n, v]) => (v === null ? n : `${n}="${v}"`)).join(' ')}>`;
  return html.slice(0, m.index + m[1].length) + nuevo + html.slice(m.index + m[1].length + img.length);
}

// Recortes que faltan o que no tienen la medida de los datos.
export function estadoRecortes(recortes = RECORTES) {
  const faltan = [];
  const distintos = [];
  for (const r of recortes) {
    const archivo = archivoDe(movilDe(r.foto), 'index.html');
    if (!existsSync(archivo)) { faltan.push(r); continue; }
    const { ancho, alto } = medidasWebp(archivo);
    if (ancho !== r.ancho || alto !== r.natural[1]) distintos.push(`${movilDe(r.foto)} mide ${ancho}x${alto}, los datos piden ${r.ancho}x${r.natural[1]}`);
  }
  return { faltan, distintos };
}

function cortar(r) {
  const origen = archivoDe(r.foto, 'index.html');
  const { ancho, alto } = medidasWebp(origen);
  if (ancho !== r.natural[0] || alto !== r.natural[1]) throw new Error(`${r.foto} mide ${ancho}x${alto} y los datos dicen ${r.natural.join('x')}; volver a medir`);
  // Franja central con todo el alto, WebP 80 como el resto del sitio (README).
  execFileSync('magick', [origen, '-gravity', 'center', '-crop', `${r.ancho}x${alto}+0+0`, '+repage', '-strip',
    '-quality', '80', '-define', 'webp:method=6', archivoDe(movilDe(r.foto), 'index.html')], { stdio: 'inherit' });
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const { faltan, distintos } = estadoRecortes();
  const pedido = pedidos();
  const desactualizadas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = conRecorte(actual, pagina, pedido[pagina]);
    if (nuevo !== actual) { desactualizadas.push(pagina); if (!comprobar) writeFileSync(ruta, nuevo); }
  }
  for (const d of distintos) console.log(`recorte con otra medida: ${d} (si ya se publicó, subir su versión en VERSIONES)`);
  if (comprobar) {
    for (const r of faltan) console.log(`falta ${movilDe(r.foto).slice(1)}`);
    for (const p of desactualizadas) console.log(`desactualizada ${p}`);
    process.exit(faltan.length || distintos.length || desactualizadas.length ? 1 : 0);
  }
  if (distintos.length) process.exit(1);
  for (const r of faltan) { console.log(`corto ${movilDe(r.foto).slice(1)} (${r.ancho}x${r.natural[1]})`); cortar(r); }
  console.log(`${faltan.length} recortes nuevos, ${desactualizadas.length} páginas reescritas. Ahora: node scripts/imagenes.mjs`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) principal();
