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

   Y para los enlaces entre páginas: `turismo.html` pasa a `/turismo.html`
   (desde /en/, `x.html` pasa a `/en/x.html`; desde /pt/, a `/pt/x.html`). Con la ruta relativa, desde la
   variante /turismo/ el menú llevaba a /turismo/turismo.html (pendiente del
   03/11).

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

// Un enlace relativo a otra página del sitio: `turismo.html`, `./x.html#a`.
export const PAGINA_RELATIVA = /^(?:\.\/)?([a-z0-9][a-z0-9-]*\.html)([?#].*)?$/i;

function arreglarUrl(url, carpeta = '') {
  if (CARPETAS.test(url)) return url.replace(CARPETAS, '/$1');
  const portada = url.match(/^(?:\.\/)?index\.html(#.*)?$/);
  if (portada) return `/${carpeta}${portada[1] || ''}`;
  const pagina = url.match(PAGINA_RELATIVA);
  if (pagina) return `/${carpeta}${pagina[1]}${pagina[2] || ''}`;
  return url;
}

// `carpeta` es la de la página que se reescribe ('' en la raíz, 'en/' en
// inglés, 'pt/' en portugués).
export function arreglarHtml(html, carpeta = '') {
  return html.replace(ATRIBUTO, (todo, nombre, valor) => {
    const nuevo = nombre === 'srcset'
      ? valor.split(',').map((parte) => parte.replace(/^(\s*)(\S+)/, (m, esp, url) => esp + arreglarUrl(url, carpeta))).join(',')
      : nombre === 'href' ? arreglarUrl(valor, carpeta) : arreglarUrl(valor);
    return `${nombre}="${nuevo}"`;
  });
}

// Carpetas de los otros idiomas: inglés en /en/ y portugués (Brasil) en /pt/
// desde el 03/11/2026. ÚNICA lista de idiomas de los scripts: empresa.mjs,
// imagenes.mjs y prefill.mjs recorren las páginas con paginas() de acá.
export const CARPETAS_IDIOMA = ['en', 'pt'];

// La carpeta de idioma de una página ('en/', 'pt/' o '' en la raíz).
export const carpetaDe = (pagina) => {
  const m = pagina.match(/^([a-z]{2})\//);
  return m && CARPETAS_IDIOMA.includes(m[1]) ? `${m[1]}/` : '';
};

export function paginas() {
  const lista = readdirSync(raiz).filter((f) => f.endsWith('.html') && !f.startsWith('google')).sort();
  for (const carpeta of CARPETAS_IDIOMA) {
    const dir = join(raiz, carpeta);
    if (existsSync(dir)) {
      lista.push(...readdirSync(dir).filter((f) => f.endsWith('.html')).sort().map((f) => `${carpeta}/${f}`));
    }
  }
  return lista;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  for (const pagina of paginas()) {
    const ruta = join(raiz, pagina);
    const actual = readFileSync(ruta, 'utf8');
    const nuevo = arreglarHtml(actual, carpetaDe(pagina));
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
