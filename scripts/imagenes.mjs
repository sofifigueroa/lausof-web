/* =============================================================================
   FOTOS RESPONSIVE — node scripts/imagenes.mjs
   -----------------------------------------------------------------------------
   Cada foto del sitio se publica en un .webp "original" (el que ya estaba, que
   queda como fallback en el src del <img>). Este script, para cada <img> que
   apunta a un .webp de assets/:

     1. genera, al lado del original, las variantes que faltan:
          foto-400w.webp, foto-640w.webp, ...   (anchos menores al original)
          foto-400w.avif, ...,  foto.avif       (AVIF, también al ancho real)
        Todas salen del MISMO .webp publicado: mismo recorte, mismos colores.
     2. reescribe el <img> dentro de un <picture>:
          <picture><source type="image/avif" srcset="…" sizes="…"><img src="foto.webp" srcset="…" sizes="…" …></picture>
        El navegador elige formato (AVIF si lo entiende) y ancho (según
        `sizes` y la densidad de la pantalla). Quien no entiende nada de esto
        usa el src de siempre.

   Lo que el script NO decide, y por eso tiene que venir escrito en el <img>:
     · `sizes`: cuánto mide la foto en pantalla. Depende del diseño de cada
       sección; si falta, el script corta con error y dice qué <img> es.
     · width/height, alt, loading/decoding, fetchpriority (los vigilan los
       tests de tests/imagenes.test.js).
     · `data-movil="assets/otra.webp"`: dirección de arte del hero de la
       portada. En pantallas ≤720px se sirve OTRA foto (la del minibús en la
       quebrada), igual que hacía la CSS antes.
     · `data-movil-media="(max-width: 480px)"`: otro corte para esa foto
       móvil. Lo usa el encabezado de turismo y de tours-and-transfers: en
       teléfonos se ve sólo la franja central de la foto, así que se sirve
       ese recorte (ruta-68-…-movil.webp) a la misma escala, con los mismos
       píxeles en pantalla y menos bytes. Ver README, "Fotos responsive".

   Necesita ImageMagick 7 con AVIF (`brew install imagemagick`). Es
   idempotente: lo que ya existe no se vuelve a codificar y correrlo dos
   veces deja todo igual. `--comprobar` no escribe nada y sale con 1 si hay
   variantes faltantes o páginas desactualizadas.
   ============================================================================= */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// Anchos intermedios. Se generan los menores al 85 % del ancho real (más
// cerca no ahorran nada) y además siempre el ancho real.
export const ANCHOS = [400, 640, 960, 1280, 1600];
// Corte de la dirección de arte del hero: el mismo de los ajustes de mobile
// de css/styles.css.
export const MEDIA_MOVIL = '(max-width: 720px)';
// Calidades: WebP 80 es la convención del sitio (README). AVIF 60 es la
// elegida midiendo SSIM contra el JPEG original (10/10/2026, dos fotos): queda
// a la par del .webp publicado (0,038 vs 0,030 de diferencia) con 20-35 %
// menos bytes. AVIF 50 pesaba la mitad pero ya se alejaba (0,048 a 0,086).
const CALIDAD_WEBP = '80';
const CALIDAD_AVIF = '60';

/* ---- medidas ------------------------------------------------------------
   Ancho y alto del encabezado del .webp (VP8, VP8L, VP8X), sin librerías. */
export function medidasWebp(archivo) {
  const b = readFileSync(archivo);
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${archivo} no es un .webp válido`);
  }
  const fourcc = b.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') {
    return { ancho: 1 + b.readUIntLE(24, 3), alto: 1 + b.readUIntLE(27, 3) };
  }
  if (fourcc === 'VP8 ') {
    if (b.readUIntLE(23, 3) !== 0x2a019d) throw new Error(`${archivo}: encabezado VP8 inesperado`);
    return { ancho: b.readUInt16LE(26) & 0x3fff, alto: b.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    if (b[20] !== 0x2f) throw new Error(`${archivo}: encabezado VP8L inesperado`);
    const bits = b.readUInt32LE(21);
    return { ancho: 1 + (bits & 0x3fff), alto: 1 + ((bits >> 14) & 0x3fff) };
  }
  throw new Error(`${archivo}: formato webp desconocido (${fourcc})`);
}

/* ---- rutas --------------------------------------------------------------- */

// Ruta en disco de un src, tal como lo escribe la página ("assets/x.webp"
// relativo a la página, o "/assets/x.webp" desde la raíz del sitio).
export function archivoDe(src, pagina) {
  return src.startsWith('/') ? join(raiz, src) : join(raiz, dirname(pagina), src);
}

// ¿Este src es una foto que el pipeline maneja?
export const esFotoWebp = (src) => /^(\/|\.\.\/)?assets\/[^"?#]+\.webp$/.test(src || '');

export const anchosDe = (natural) => ANCHOS.filter((a) => a <= natural * 0.85);

const variante = (src, ancho, ext) =>
  src.replace(/\.webp$/, ancho ? `-${ancho}w.${ext}` : `.${ext}`);

// Todas las variantes de una foto: [{src, ancho, formato}] (src con el mismo
// prefijo que el original). El original .webp no está: ya existe.
export function variantesDe(src, natural) {
  const lista = [];
  for (const ancho of anchosDe(natural)) {
    lista.push({ src: variante(src, ancho, 'webp'), ancho, formato: 'webp' });
    lista.push({ src: variante(src, ancho, 'avif'), ancho, formato: 'avif' });
  }
  lista.push({ src: variante(src, null, 'avif'), ancho: natural, formato: 'avif', natural: true });
  return lista;
}

function srcsetDe(src, natural, formato) {
  const partes = anchosDe(natural).map((a) => `${variante(src, a, formato)} ${a}w`);
  partes.push(`${formato === 'webp' ? src : variante(src, null, 'avif')} ${natural}w`);
  return partes.join(', ');
}

/* ---- atributos ----------------------------------------------------------- */

export function atributos(etiqueta) {
  const lista = [];
  const cuerpo = etiqueta.replace(/^<img\s*/, '').replace(/\s*\/?>$/, '');
  for (const [, nombre, valor] of cuerpo.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) {
    lista.push([nombre, valor ?? null]);
  }
  return lista;
}
const valorDe = (lista, nombre) => lista.find(([n]) => n === nombre)?.[1];
const serializar = (lista) =>
  lista.map(([n, v]) => (v === null ? n : `${n}="${v}"`)).join(' ');

/* ---- <img> → <picture> ---------------------------------------------------
   Devuelve el <picture> completo para un <img> de foto. Lanza error si al
   <img> le falta `sizes` o si la foto no existe. */
export function pictureDe(etiqueta, pagina) {
  const attrs = atributos(etiqueta).filter(([n]) => n !== 'srcset');
  const src = valorDe(attrs, 'src');
  const sizes = valorDe(attrs, 'sizes');
  if (!sizes) {
    throw new Error(`${pagina}: el <img> de ${src} no tiene sizes (cuánto mide en pantalla). Ver README, "Fotos responsive".`);
  }
  const { ancho } = medidasWebp(archivoDe(src, pagina));
  const iSrc = attrs.findIndex(([n]) => n === 'src');
  attrs.splice(iSrc + 1, 0, ['srcset', srcsetDe(src, ancho, 'webp')]);

  const fuentes = [];
  const movil = valorDe(attrs, 'data-movil');
  if (movil) {
    const m = medidasWebp(archivoDe(movil, pagina));
    const dim = `width="${m.ancho}" height="${m.alto}"`;
    const media = valorDe(attrs, 'data-movil-media') || MEDIA_MOVIL;
    fuentes.push(`<source media="${media}" type="image/avif" srcset="${srcsetDe(movil, m.ancho, 'avif')}" sizes="${sizes}" ${dim}>`);
    fuentes.push(`<source media="${media}" type="image/webp" srcset="${srcsetDe(movil, m.ancho, 'webp')}" sizes="${sizes}" ${dim}>`);
  }
  fuentes.push(`<source type="image/avif" srcset="${srcsetDe(src, ancho, 'avif')}" sizes="${sizes}">`);
  return `<picture>${fuentes.join('')}<img ${serializar(attrs)}></picture>`;
}

/* ---- una página entera ---------------------------------------------------
   Reescribe cada foto (suelta o ya envuelta en <picture>) y deja todo lo
   demás tal cual, incluidos los comentarios. Pura: no escribe nada. */
const PATRON = /<!--[\s\S]*?-->|<picture>(?:(?!<\/picture>)[\s\S])*?<\/picture>|<img\s[^>]*>/g;

export function fotosDe(html) {
  const fotos = [];
  for (const [bloque] of html.matchAll(PATRON)) {
    if (bloque.startsWith('<!--')) continue;
    const img = bloque.startsWith('<picture>') ? bloque.match(/<img\s[^>]*>/)?.[0] : bloque;
    if (img && esFotoWebp(valorDe(atributos(img), 'src'))) fotos.push(img);
  }
  return fotos;
}

export function procesarHtml(html, pagina) {
  return html.replace(PATRON, (bloque) => {
    if (bloque.startsWith('<!--')) return bloque;
    const img = bloque.startsWith('<picture>') ? bloque.match(/<img\s[^>]*>/)?.[0] : bloque;
    if (!img || !esFotoWebp(valorDe(atributos(img), 'src'))) return bloque;
    return pictureDe(img, pagina);
  });
}

/* ---- páginas y variantes -------------------------------------------------- */

export function paginas() {
  const lista = readdirSync(raiz).filter((f) => f.endsWith('.html') && !f.startsWith('google')).sort();
  const dirEn = join(raiz, 'en');
  if (existsSync(dirEn)) {
    lista.push(...readdirSync(dirEn).filter((f) => f.endsWith('.html')).sort().map((f) => `en/${f}`));
  }
  return lista;
}

// Variantes que piden las páginas: [{archivo, origen, ancho, formato, natural}]
export function variantesPedidas() {
  const pedidas = new Map();
  for (const pagina of paginas()) {
    for (const img of fotosDe(readFileSync(join(raiz, pagina), 'utf8'))) {
      const attrs = atributos(img);
      for (const src of [valorDe(attrs, 'src'), valorDe(attrs, 'data-movil')].filter(Boolean)) {
        const origen = archivoDe(src, pagina);
        const { ancho } = medidasWebp(origen);
        for (const v of variantesDe(src, ancho)) {
          const archivo = archivoDe(v.src, pagina);
          pedidas.set(archivo, { archivo, origen, ...v });
        }
      }
    }
  }
  return [...pedidas.values()];
}

function codificar({ archivo, origen, ancho, formato, natural }) {
  const args = [origen];
  if (!natural) args.push('-resize', `${ancho}x`);
  args.push('-strip');
  if (formato === 'webp') {
    args.push('-quality', CALIDAD_WEBP, '-define', 'webp:method=6');
  } else {
    args.push('-quality', CALIDAD_AVIF, '-define', 'heic:speed=4');
  }
  args.push(archivo);
  execFileSync('magick', args, { stdio: 'inherit' });
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const faltan = variantesPedidas().filter((v) => !existsSync(v.archivo));
  const desactualizadas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = procesarHtml(actual, pagina);
    if (nuevo !== actual) {
      desactualizadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  if (comprobar) {
    for (const v of faltan) console.log(`falta ${v.archivo.slice(raiz.length + 1)}`);
    for (const p of desactualizadas) console.log(`desactualizada ${p}`);
    process.exit(faltan.length || desactualizadas.length ? 1 : 0);
  }
  faltan.forEach((v, i) => {
    console.log(`[${i + 1}/${faltan.length}] ${v.archivo.slice(raiz.length + 1)}`);
    codificar(v);
  });
  console.log(`${faltan.length} variantes nuevas, ${desactualizadas.length} páginas reescritas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
