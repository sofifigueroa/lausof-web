/* =============================================================================
   TARJETAS DE DESTINO — node scripts/tarjetas.mjs [--comprobar]
   -----------------------------------------------------------------------------
   En los hubs de turismo (ES, EN, PT) y de viajes internacionales (ES, EN),
   cada <article class="card circuito"> lleva: foto, una etiqueta corta
   (<span class="tag">), el título, una línea y un enlace «Ver … →» (o
   «Consultar … →» si el destino no tiene página propia). Es el patrón de las
   tarjetas de Norte Travel (1-investigacion.md §R-B). Datos y fuentes en
   scripts/tarjetas-datos.mjs.

   El script escribe sólo tres cosas dentro de cada tarjeta:
     1. la etiqueta, justo antes del <h3>;
     2. la línea, el <p> justo después del <h3> (ronda 9: una sola frase);
     3. el texto del enlace .ruta-link (o el enlace entero, si la tarjeta no
        tenía, antes del cierre de .card-body, después de la zona TIENDA).
   No toca la foto, el título ni las zonas
   <!-- GENERADO:TIENDA hub -->, y deja el href de un enlace que ya existe
   (los renglones de un wa.me o mailto los pone scripts/prefill.mjs: correr
   prefill después de este script).

   Contrato de la vitrina (tienda-v2-0611:scripts/tienda.mjs ponerZonas): el
   <h2> antes de la primera tarjeta, el <p class="sub"> antes de
   <div class="cards circuitos">, la cantidad de tarjetas y <a class="ruta-link"
   dentro de cada una siguen iguales; la vitrina pone su zona «hub» antes del
   .ruta-link.

     node scripts/tarjetas.mjs              # escribe las páginas
     node scripts/tarjetas.mjs --comprobar  # no escribe; sale con 1 si algo no está al día

   Ronda 8 de lausof.com (08/11/2026). README: «Tarjetas de destino».
   ============================================================================= */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { raiz } from './rutas-raiz.mjs';
import { TARJETAS } from './tarjetas-datos.mjs';
import { VIAJES } from './viaje-datos.mjs';

const TARJETA = /<article class="card circuito">[\s\S]*?<\/article>/g;
const ETIQUETA = /<span class="tag">[^<]*<\/span>\s*/;
const RUTA = /(<a class="ruta-link"[^>]*>)([^<]*)(<\/a>)/;
const FLECHA = ' →';
const LINEA = /(<\/h3>(?:\s*<!--[\s\S]*?-->)*\s*<p>)([\s\S]*?)(<\/p>)/;
/** Una línea: una sola frase corta (ronda 9; 1b L29). */
export const LARGO_LINEA = 120;
const DOS_FRASES = /[.!?]\s+[A-ZÁÉÍÓÚÑ¿¡]/;
const normal = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
const escapar = (s) => s.replace(/&/g, '&amp;');

/** Problemas de los datos de una página (fuentes que no se sostienen). Pura. */
export function problemasDeDatos(pagina, datos = TARJETAS[pagina], viajes = VIAJES, descripciones = []) {
  const p = [];
  datos.forEach((d, i) => {
    if (!d.linea) p.push(`${pagina}: «${d.titulo}» sin línea`);
    else {
      if (d.linea.length > LARGO_LINEA) p.push(`${pagina}: la línea de «${d.titulo}» mide ${d.linea.length} (límite ${LARGO_LINEA})`);
      if (DOS_FRASES.test(d.linea)) p.push(`${pagina}: la línea de «${d.titulo}» tiene más de una frase`);
      if (/desde \$|\$|ARS|USD/.test(d.linea)) p.push(`${pagina}: la línea de «${d.titulo}» dice un precio (BRIEF)`);
    }
    if (d.etiqueta === null) {
      if (!d.motivo) p.push(`${pagina}: «${d.titulo}» va sin etiqueta y sin motivo`);
      return;
    }
    if (!d.etiqueta || !d.fuente || !d.fuente.texto) { p.push(`${pagina}: «${d.titulo}» sin etiqueta o sin fuente`); return; }
    if (/desde|\$|ARS|USD|unidades/i.test(d.etiqueta)) p.push(`${pagina}: «${d.etiqueta}» dice algo prohibido (BRIEF)`);
    let texto;
    if (d.fuente.pagina === 'tarjeta') texto = descripciones[i];
    else {
      const v = viajes[d.fuente.pagina];
      texto = v && v.filas && v.filas.duracion ? v.filas.duracion.valor : undefined;
    }
    if (texto === undefined) p.push(`${pagina}: «${d.titulo}»: no encuentro la fuente ${d.fuente.pagina}`);
    else if (!normal(texto).includes(normal(d.fuente.texto))) {
      p.push(`${pagina}: «${d.titulo}»: «${d.fuente.texto}» ya no está en ${d.fuente.pagina === 'tarjeta' ? 'la descripción de la tarjeta' : `la duración de ${d.fuente.pagina}`}`);
    }
  });
  return p;
}

const descripcionDe = (tarjeta) => {
  const m = tarjeta.match(LINEA);
  return m ? m[2].replace(/<[^>]+>/g, '') : '';
};

/** Una tarjeta al día con su dato. Pura e idempotente. */
export function conTarjeta(tarjeta, d, pagina) {
  const titulo = (tarjeta.match(/<h3>([^<]*)<\/h3>/) || [])[1];
  if (titulo !== d.titulo) throw new Error(`${pagina}: la tarjeta dice «${titulo}» y los datos «${d.titulo}» (¿cambió el orden o el título?)`);
  let out = tarjeta.replace(ETIQUETA, '');
  if (d.linea) {
    if (!LINEA.test(out)) throw new Error(`${pagina}: «${d.titulo}» no tiene el <p> después del <h3>`);
    out = out.replace(LINEA, (_, a, __, c) => `${a}${escapar(d.linea)}${c}`);
  }
  if (d.etiqueta) {
    const h3 = out.indexOf('<h3>');
    const sangria = out.slice(out.lastIndexOf('\n', h3) + 1, h3);
    out = `${out.slice(0, h3)}<span class="tag">${escapar(d.etiqueta)}</span>\n${sangria}${out.slice(h3)}`;
  }
  if (d.enlace) {
    const texto = escapar(d.enlace.texto) + FLECHA;
    if (RUTA.test(out)) out = out.replace(RUTA, (_, a, __, c) => `${a}${texto}${c}`);
    else {
      if (!d.enlace.href) throw new Error(`${pagina}: «${d.titulo}» no tiene enlace y los datos no dan href`);
      const externo = /^https?:/.test(d.enlace.href) ? ' target="_blank" rel="noopener"' : '';
      const cierre = out.lastIndexOf('</div>');
      const linea = out.lastIndexOf('\n', cierre);
      const h3 = out.indexOf('<h3>');
      const sangria = out.slice(out.lastIndexOf('\n', h3) + 1, h3);
      out = `${out.slice(0, linea)}\n${sangria}<a class="ruta-link" href="${d.enlace.href}"${externo}>${texto}</a>${out.slice(linea)}`;
    }
  }
  return out;
}

/** La página con todas sus tarjetas al día. Pura e idempotente. */
export function conTarjetas(html, pagina, datos = TARJETAS[pagina]) {
  if (!datos) return html;
  const tarjetas = html.match(TARJETA) || [];
  if (tarjetas.length !== datos.length) throw new Error(`${pagina}: ${tarjetas.length} tarjetas y ${datos.length} en los datos`);
  let i = 0;
  return html.replace(TARJETA, (t) => conTarjeta(t, datos[i++], pagina));
}

/** Lo que no cierra en una página ya escrita (lo usa también tests/tarjetas.test.js). */
export function problemasDe(html, pagina, datos = TARJETAS[pagina]) {
  const tarjetas = html.match(TARJETA) || [];
  const p = problemasDeDatos(pagina, datos, VIAJES, tarjetas.map(descripcionDe));
  tarjetas.forEach((t, i) => {
    if (!/<a class="ruta-link"/.test(t)) p.push(`${pagina}: la tarjeta ${i + 1} no tiene <a class="ruta-link"> (contrato de la vitrina)`);
  });
  return p;
}

function principal() {
  const comprobar = process.argv.includes('--comprobar');
  const cambiadas = [];
  const problemas = [];
  for (const pagina of Object.keys(TARJETAS)) {
    const archivo = join(raiz, pagina);
    const html = readFileSync(archivo, 'utf8');
    let nuevo;
    try { nuevo = conTarjetas(html, pagina); } catch (e) { problemas.push(e.message); continue; }
    problemas.push(...problemasDe(nuevo, pagina));
    if (nuevo !== html) {
      cambiadas.push(pagina);
      if (!comprobar) writeFileSync(archivo, nuevo);
    }
  }
  for (const p of problemas) console.error(p);
  if (comprobar) {
    if (cambiadas.length) console.error(`tarjetas: no están al día ${cambiadas.join(', ')} (correr node scripts/tarjetas.mjs y después node scripts/prefill.mjs)`);
    if (cambiadas.length || problemas.length) process.exit(1);
    console.log(`tarjetas: ${Object.keys(TARJETAS).length} páginas al día.`);
    return;
  }
  console.log(`tarjetas: ${cambiadas.length} página(s) reescrita(s).`);
  if (problemas.length) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal();
}
