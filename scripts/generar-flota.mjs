/* =============================================================================
   GENERADOR DE LA PÁGINA DE FLOTA — node scripts/generar-flota.mjs
   -----------------------------------------------------------------------------
   Lee la lista de unidades de scripts/unidades.mjs y reescribe, dentro de
   flota-en-venta.html, las zonas marcadas con <!-- GENERADO ... -->:

     · las tarjetas de las unidades publicadas (#grilla-unidades),
     · las tarjetas del bloque "próximamente" (#grilla-proximas), destapando
       u ocultando el bloque según haya unidades por publicar,
     · el bloque ItemList de datos estructurados para Google, en el <head>.

   Las tarjetas quedan escritas en el HTML (no las arma el navegador) para que
   Google, Bing y los scrapers de vista previa de WhatsApp/Facebook las vean
   sin ejecutar JavaScript. El marcado que emite es el mismo que generaba el
   código del navegador, más width/height en cada <img> (evita saltos de
   layout); las medidas se leen del archivo .webp real, así nunca quedan
   desincronizadas de la foto.

   Sin dependencias: corre con Node solo. Es idempotente: correrlo dos veces
   deja el archivo igual.
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { UNIDADES, WHATSAPP, MOSTRAR_PROXIMAS } from './unidades.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGINA = join(raiz, 'flota-en-venta.html');

/* ---- utilidades ---------------------------------------------------------- */

// El código del navegador usaba textContent (el DOM escapa solo); acá el
// escape hay que hacerlo a mano para texto y atributos.
const escapar = (texto) =>
  String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escaparAtributo = (texto) => escapar(texto).replace(/"/g, '&quot;');

// Mismo formato de precio que usaba el navegador: es-AR agrupa con puntos.
const formatoPesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

function precioTexto(unidad) {
  if (unidad.precio == null) return 'A publicar';
  const numero = formatoPesos.format(unidad.precio);
  return unidad.moneda === 'USD' ? 'US$ ' + numero : '$ ' + numero;
}

function enlaceWhatsApp(unidad) {
  const texto = 'Hola Lausof, quiero consultar por la unidad ' + unidad.titulo + ' que vi en la web.';
  return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
}

/* ---- medidas de las fotos ------------------------------------------------
   Lee ancho y alto directamente del encabezado del .webp (formatos VP8,
   VP8L y VP8X), sin librerías. Si el archivo no existe o no se entiende,
   corta con error: mejor que publicar una medida inventada. */
function medidasWebp(archivo) {
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

/* ---- tarjeta de una unidad -----------------------------------------------
   Emite el mismo árbol que armaba crearTarjeta() en el navegador. Los
   contenedores son flex/grid, así que la sangría del HTML no cambia nada
   visual; lo único sensible al espacio en blanco queda en una sola línea
   (precio + "dólares", y "También publicado en " + enlaces). */
function tarjeta(unidad) {
  const proxima = unidad.estado === 'proximamente';
  const filas = [];

  filas.push(`      <article class="card unidad${proxima ? ' is-proxima' : ''}">`);

  if (unidad.foto) {
    const { ancho, alto } = medidasWebp(join(raiz, 'assets', 'unidades', unidad.foto));
    filas.push(`        <div class="card-photo"><img src="assets/unidades/${escaparAtributo(unidad.foto)}" alt="${escaparAtributo(unidad.titulo)}" loading="lazy" width="${ancho}" height="${alto}"></div>`);
  } else {
    filas.push(`        <div class="card-photo"><span>Fotos en preparación</span></div>`);
  }

  filas.push(`        <div class="card-body">`);
  if (proxima) {
    filas.push(`          <span class="tag tag-proxima">Próximamente</span>`);
  }

  const moneda = !proxima && unidad.moneda === 'USD'
    ? '<span class="unidad-moneda">dólares</span>' : '';
  filas.push(`          <div class="unidad-head">`);
  filas.push(`            <h3>${escapar(unidad.titulo)}</h3>`);
  filas.push(`            <div class="unidad-precio">${escapar(precioTexto(unidad))}${moneda}</div>`);
  filas.push(`          </div>`);

  if (unidad.ficha && unidad.ficha.length) {
    filas.push(`          <ul class="unidad-ficha">`);
    for (const dato of unidad.ficha) filas.push(`            <li>${escapar(dato)}</li>`);
    filas.push(`          </ul>`);
  }

  filas.push(`          <p>${escapar(unidad.resumen)}</p>`);

  filas.push(`          <div class="unidad-acciones">`);
  filas.push(`            <a class="btn btn-wa" href="${escaparAtributo(enlaceWhatsApp(unidad))}" target="_blank" rel="noopener">${proxima ? 'Avisame cuando esté' : 'Consultá por esta unidad'}</a>`);
  // Las unidades que todavía no están publicadas no llevan enlace:
  // un enlace roto a Mercado Libre es peor que no tener enlace.
  if (!proxima && unidad.url) {
    filas.push(`            <a class="btn btn-ml" href="${escaparAtributo(unidad.url)}" target="_blank" rel="noopener">Ver ficha y fotos en Mercado Libre</a>`);
  }
  filas.push(`          </div>`);

  // La misma unidad puede estar publicada en más de un sitio. Va como enlace
  // chico y sin precio: el precio que vale es el de Mercado Libre.
  if (!proxima && unidad.otrosAvisos && unidad.otrosAvisos.length) {
    const enlaces = unidad.otrosAvisos
      .map((aviso) => `<a href="${escaparAtributo(aviso.url)}" target="_blank" rel="noopener">${escapar(aviso.nombre)}</a>`)
      .join(' · ');
    filas.push(`          <p class="unidad-otros">También publicado en ${enlaces}</p>`);
  }

  filas.push(`        </div>`);
  filas.push(`      </article>`);
  return filas.join('\n');
}

/* ---- ItemList para Google ------------------------------------------------
   El mismo objeto que armaba actualizarDatosEstructurados() en el navegador:
   la página lista vehículos a la venta, con su precio y su moneda. */
function datosEstructurados(publicadas) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Unidades en venta — Lausof SRL',
    itemListElement: publicadas.map((unidad, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      item: {
        '@type': 'Vehicle',
        name: unidad.titulo,
        url: unidad.url,
        offers: {
          '@type': 'Offer',
          price: unidad.precio,
          priceCurrency: unidad.moneda,
          availableAtOrFrom: { '@type': 'Place', address: 'Salta Capital, Argentina' },
          seller: { '@type': 'Organization', name: 'Lausof SRL' }
        }
      }
    }))
  });
}

/* ---- reemplazo entre marcadores ------------------------------------------ */

function reemplazarZona(html, zona, contenido) {
  const patron = new RegExp(`(<!-- GENERADO:${zona} [^>]*-->)[\\s\\S]*?\\n([ \\t]*<!-- /GENERADO:${zona} -->)`);
  if (!patron.test(html)) {
    throw new Error(`flota-en-venta.html perdió los marcadores GENERADO:${zona}; restaurarlos antes de regenerar`);
  }
  return html.replace(patron, (_, abre, cierra) => `${abre}\n${contenido}\n${cierra}`);
}

// Genera el HTML nuevo a partir del actual. Es una función pura para que los
// tests puedan verificar que el archivo publicado está sincronizado con
// scripts/unidades.mjs (regenerar no debe cambiar nada).
export function generar(html) {
  const publicadas = UNIDADES.filter((u) => u.estado !== 'proximamente');
  const proximas = MOSTRAR_PROXIMAS ? UNIDADES.filter((u) => u.estado === 'proximamente') : [];

  let salida = html;
  salida = reemplazarZona(salida, 'UNIDADES', publicadas.map(tarjeta).join('\n'));
  salida = reemplazarZona(salida, 'PROXIMAS', proximas.map(tarjeta).join('\n'));
  salida = reemplazarZona(salida, 'JSONLD',
    `  <script type="application/ld+json" id="datos-estructurados">${datosEstructurados(publicadas)}</script>`);

  // El bloque "próximamente" se destapa sólo si tiene tarjetas adentro.
  const bloque = /(<section class="proximas" id="bloque-proximas" aria-labelledby="titulo-proximas")( hidden)?(>)/;
  if (!bloque.test(salida)) {
    throw new Error('flota-en-venta.html perdió la sección #bloque-proximas');
  }
  salida = salida.replace(bloque, (_, abre, __, cierra) =>
    abre + (proximas.length ? '' : ' hidden') + cierra);

  return salida;
}

function principal() {
  const actual = readFileSync(PAGINA, 'utf8');
  const nuevo = generar(actual);
  if (nuevo === actual) {
    console.log('flota-en-venta.html ya estaba al día (sin cambios).');
    return;
  }
  writeFileSync(PAGINA, nuevo);
  const publicadas = UNIDADES.filter((u) => u.estado !== 'proximamente').length;
  console.log(`flota-en-venta.html regenerado: ${publicadas} unidades publicadas, ${UNIDADES.length - publicadas} por publicar.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
