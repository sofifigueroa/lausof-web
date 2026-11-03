/* =============================================================================
   RUTAS DESDE LA RAÍZ — node scripts/rutas-raiz.mjs [--comprobar]
   -----------------------------------------------------------------------------
   Las páginas piden sus archivos (hojas, fotos, scripts, íconos) con ruta
   desde la raíz del sitio: `/css/styles.css`, `/assets/foto.webp`. Nunca
   `css/styles.css` a secas.

   Por qué: una ruta relativa se resuelve contra la URL con la que se pidió la
   página. Netlify sirve la misma página también como /turismo/ o
   /turismo.html/ (la barra final no se puede redirigir: el CDN normaliza la
   barra antes de mirar las reglas), y ahí `css/styles.css` pasa a ser
   /turismo/css/styles.css, que da 404: la página sale sin estilos ni fotos
   (auditoría técnica del 03/11/2026, M3). Con la ruta desde la raíz no hay
   variante de URL que rompa el diseño. Las páginas de /en/ ya lo hacían así.

   Lo mismo para la portada: `index.html` (y `index.html#seccion`) se escribe
   `/` (`/#seccion`), porque /index.html responde con un 301 a / y cada enlace
   así le cuesta un salto a la visita.

   El script reescribe los atributos href, src, srcset y data-movil de todas
   las páginas. Es idempotente. `--comprobar` no escribe nada y sale con 1 si
   alguna página tiene rutas relativas (lo mismo vigila tests/rutas-raiz.test.js).
   ============================================================================= */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// Carpetas de archivos del sitio que una página puede pedir.
const CARPETAS = /^(?:\.\/)?((?:assets|css|js)\/)/;
const ATRIBUTO = /\b(href|src|srcset|data-movil)="([^"]*)"/g;

function arreglarUrl(url) {
  if (CARPETAS.test(url)) return url.replace(CARPETAS, '/$1');
  const portada = url.match(/^(?:\.\/)?index\.html(#.*)?$/);
  if (portada) return `/${portada[1] || ''}`;
  return url;
}

export function arreglarHtml(html) {
  return html.replace(ATRIBUTO, (todo, nombre, valor) => {
    const nuevo = nombre === 'srcset'
      ? valor.split(',').map((parte) => parte.replace(/^(\s*)(\S+)/, (m, esp, url) => esp + arreglarUrl(url))).join(',')
      : arreglarUrl(valor);
    return `${nombre}="${nuevo}"`;
  });
}

export function paginas() {
  const lista = readdirSync(raiz).filter((f) => f.endsWith('.html') && !f.startsWith('google')).sort();
  const dirEn = join(raiz, 'en');
  if (existsSync(dirEn)) {
    lista.push(...readdirSync(dirEn).filter((f) => f.endsWith('.html')).sort().map((f) => `en/${f}`));
  }
  return lista;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = arreglarHtml(actual);
    if (nuevo !== actual) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(ruta, nuevo);
    }
  }
  if (comprobar) {
    for (const p of cambiadas) console.log(`con rutas relativas: ${p}`);
    process.exit(cambiadas.length ? 1 : 0);
  }
  console.log(`${cambiadas.length} páginas reescritas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
